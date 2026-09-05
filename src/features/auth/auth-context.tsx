"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "@/components/ui/sonner"
import { User, Tenant } from "./types"

const AUTH_STORAGE_KEY = "worksauto_auth_session"
const ACCESS_TOKEN_KEY = "worksauto_access_token"
const REFRESH_TOKEN_KEY = "worksauto_refresh_token"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"

interface AuthContextType {
  user: User | null
  tenant: Tenant | null
  isAuthenticated: boolean
  isLoading: boolean
  sendOtp: (phone: string) => Promise<{ success: boolean; error?: string; devCode?: string }>
  verifyOtp: (phone: string, code: string) => Promise<{ success: boolean; error?: string }>
  login: (phone: string, codeOrPass: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  completeOnboarding: (data: Partial<Tenant>) => void
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()

  const [user, setUser] = React.useState<User | null>(null)
  const [tenant, setTenant] = React.useState<Tenant | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  // Load active 30-day session from localStorage on mount (Requires real JWT Token)
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY)
      const token = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (saved && token) {
        const parsed = JSON.parse(saved)
        if (parsed.user && parsed.tenant) {
          if (parsed.user.role === "tenant_admin") {
            parsed.user.role = "OWNER"
          } else if (parsed.user.role === "technician") {
            parsed.user.role = "TECHNICIAN"
          }
          setUser(parsed.user)
          setTenant(parsed.tenant)
        } else {
          setUser(null)
          setTenant(null)
        }
      } else {
        // Without a valid saved session & JWT, user remains unauthenticated
        setUser(null)
        setTenant(null)
      }
    } catch {
      setUser(null)
      setTenant(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Proactive live session verification & auto-kick on license suspension
  React.useEffect(() => {
    const verifyLiveSession = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_KEY) : null
      if (!token) return

      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          const errMsg = (data.message || "").toLowerCase()
          if (res.status === 401 && (errMsg.includes("askıya") || errMsg.includes("lisans") || errMsg.includes("aktif değil"))) {
            setUser(null)
            setTenant(null)
            localStorage.removeItem(AUTH_STORAGE_KEY)
            localStorage.removeItem(ACCESS_TOKEN_KEY)
            localStorage.removeItem(REFRESH_TOKEN_KEY)
            router.replace("/sign-in?suspended=true")
          }
        }
      } catch {
        // Network error, keep existing state
      }
    }

    // Verify on mount
    verifyLiveSession()

    // Verify when user switches back to this tab
    window.addEventListener("focus", verifyLiveSession)

    // Listen to immediate custom event from api-client
    const handleSuspended = (e: any) => {
      setUser(null)
      setTenant(null)
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY)
        localStorage.removeItem(ACCESS_TOKEN_KEY)
        localStorage.removeItem(REFRESH_TOKEN_KEY)
      } catch {}
      router.replace("/sign-in?suspended=true")
    }
    window.addEventListener("worksauto:suspended", handleSuspended)

    return () => {
      window.removeEventListener("focus", verifyLiveSession)
      window.removeEventListener("worksauto:suspended", handleSuspended)
    }
  }, [router])

  // Route Guard: strictly enforce authentication and onboarding
  React.useEffect(() => {
    if (isLoading) return

    const currentPath = pathname || (typeof window !== "undefined" ? window.location.pathname : "")
    if (!currentPath) return

    const isAuthRoute = currentPath === "/sign-in" || currentPath === "/login"
    const isOnboardingRoute = currentPath === "/onboarding"
    const isPublicRoute = currentPath.startsWith("/book")
    const isAdminRoute = currentPath.startsWith("/admin")

    // Admin routes are completely isolated and managed by AdminLayout
    if (isAdminRoute) return

    // 1. Unauthenticated users cannot access protected tenant routes
    if (!user || !tenant) {
      if (!isAuthRoute && !isPublicRoute) {
        router.replace("/sign-in")
      }
      return
    }

    // 2. Authenticated users should not see sign-in page
    if (isAuthRoute) {
      router.replace("/")
      return
    }

    // 3. If logged in but onboarding is NOT completed, lock into /onboarding
    if (!tenant.onboardingCompleted) {
      if (!isOnboardingRoute) {
        router.replace("/onboarding")
      }
      return
    }

    // 4. If logged in and onboarding IS completed, prevent access to /onboarding
    if (tenant.onboardingCompleted && isOnboardingRoute) {
      router.replace("/")
    }
  }, [user, tenant, isLoading, pathname, router])

  /**
   * Canlı API: Kullanıcı telefonuna SMS OTP gönderir
   */
  const sendOtp = React.useCallback(async (rawPhone: string) => {
    const cleanPhone = rawPhone.replace(/\D/g, "")
    try {
      const res = await fetch(`${API_BASE_URL}/auth/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone }),
      })

      const data = await res.json()
      if (!res.ok) {
        return {
          success: false,
          error: data.message || "NOT_FOUND",
        }
      }

      return {
        success: true,
        devCode: data.devCode,
      }
    } catch {
      return { success: false, error: "Sunucu bağlantı hatası oluştu." }
    }
  }, [])

  /**
   * Canlı API: SMS kodunu doğrular ve 30 günlük oturum başlatır
   */
  const verifyOtp = React.useCallback(
    async (rawPhone: string, code: string) => {
      const cleanPhone = rawPhone.replace(/\D/g, "")
      try {
        const res = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: cleanPhone, code }),
        })

        const data = await res.json()
        if (!res.ok) {
          return {
            success: false,
            error: data.message || "INVALID_OTP",
          }
        }

        // Live user & tenant mapping
        const liveUser: User = {
          id: data.user.id,
          name: data.user.name,
          surname: data.user.surname,
          phone: data.user.phone || cleanPhone,
          email: data.user.email || "",
          role: data.user.role || "OWNER",
        }

        const liveTenant: Tenant = {
          id: data.user.tenantId,
          name: data.user.tenantTitle || "Bayar Oto Servis",
          legalName: data.user.tenantTitle || "Bayar Oto Servis",
          taxOffice: "İkitelli",
          taxNumber: "1234567890",
          city: "İstanbul",
          district: "Başakşehir",
          address: "İkitelli OSB, Dolapdere Sanayi Sitesi",
          logo: "/brand/worksauto-icon-white-tight.png",
          primaryColor: "#0284c7",
          slogan: "Güvenilir & Garantili Araç Bakım ve Onarım Merkezi",
          workingDays: ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"],
          workStartTime: "08:30",
          workEndTime: "18:30",
          services: [],
          staff: [],
          appointmentSlotDuration: 45,
          autoWorkOrder: true,
          criticalStockThreshold: 5,
          onboardingCompleted: true,
        }

        setUser(liveUser)
        setTenant(liveTenant)

        // Store 30-day session and JWT in localStorage
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: liveUser, tenant: liveTenant }))
          localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken)
          localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken)
        } catch {
          // ignore
        }

        router.push("/")
        return { success: true }
      } catch {
        return { success: false, error: "Sunucu bağlantı hatası oluştu. Lütfen API servisinin çalıştığından emin olun." }
      }
    },
    [router]
  )

  const login = React.useCallback(
    async (rawPhone: string, codeOrPass: string) => {
      return verifyOtp(rawPhone, codeOrPass)
    },
    [verifyOtp]
  )

  const logout = React.useCallback(() => {
    setUser(null)
    setTenant(null)
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      queryClient.clear()
    } catch {
      // ignore
    }
    toast.info("Oturum güvenli şekilde kapatıldı. Tekrar görüşmek üzere!")
    router.push("/sign-in")
  }, [router, queryClient])

  const completeOnboarding = React.useCallback((data: Partial<Tenant>) => {
    setTenant((prev) => {
      if (!prev) return null
      const updated = { ...prev, ...data, onboardingCompleted: true }
      try {
        const saved = localStorage.getItem(AUTH_STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          parsed.tenant = updated
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed))
        }
      } catch {
        // ignore
      }
      return updated
    })
  }, [])

  const value = React.useMemo(
    () => ({
      user,
      tenant,
      isAuthenticated: !!user && !!tenant,
      isLoading,
      sendOtp,
      verifyOtp,
      login,
      logout,
      completeOnboarding,
    }),
    [user, tenant, isLoading, sendOtp, verifyOtp, login, logout, completeOnboarding]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
