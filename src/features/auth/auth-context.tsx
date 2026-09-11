"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "@/components/ui/sonner"
import { getAccessToken, setAccessToken, refreshAccessToken, setSessionCookie, apiClient } from "@/lib/api-client"
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
  login: (userData: User, tenantData: Tenant) => void
  logout: () => void
  completeOnboarding: (data: Partial<Tenant>) => void
  completeB2bConsent: (updatedTenant: Partial<Tenant>) => void
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()

  const [user, setUser] = React.useState<User | null>(null)
  const [tenant, setTenant] = React.useState<Tenant | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  // Load active session on mount with silent cookie refresh fallback
  React.useEffect(() => {
    const initAuth = async () => {
      try {
        const saved = typeof window !== "undefined" ? localStorage.getItem(AUTH_STORAGE_KEY) : null
        const hasSessionCookie = typeof document !== "undefined" && document.cookie.includes("worksauto_session=1")
        let token = getAccessToken()

        // Sessiz Yenileme: Eğer in-memory token yoksa ama session cookie varsa httpOnly cookie ile yenile
        if (!token && hasSessionCookie) {
          try {
            token = await refreshAccessToken()
          } catch {
            setSessionCookie(false)
          }
        }

        if (saved && (token || hasSessionCookie)) {
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
          setUser(null)
          setTenant(null)
        }
      } catch {
        setUser(null)
        setTenant(null)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  // Proactive live session verification & auto-kick on license suspension
  React.useEffect(() => {
    const verifyLiveSession = async () => {
      const token = getAccessToken()
      if (!token) return

      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          const errMsg = (data.message || "").toLowerCase()
          if (res.status === 401 && (errMsg.includes("askıya") || errMsg.includes("lisans") || errMsg.includes("aktif değil"))) {
            setUser(null)
            setTenant(null)
            setAccessToken(null)
            setSessionCookie(false)
            localStorage.removeItem(AUTH_STORAGE_KEY)
            localStorage.removeItem(ACCESS_TOKEN_KEY)
            localStorage.removeItem(REFRESH_TOKEN_KEY)
            router.replace("/sign-in?suspended=true")
          }
        } else {
          const freshData = await res.json().catch(() => null)
          if (freshData?.user) {
            let role = freshData.user.role
            if (role === "tenant_admin") role = "OWNER"
            else if (role === "technician") role = "TECHNICIAN"

            const updatedUser: User = {
              id: freshData.user.id,
              name: freshData.user.name,
              surname: freshData.user.surname,
              phone: freshData.user.phone || "",
              email: freshData.user.email || "",
              role: role || "OWNER",
            }

            setUser(updatedUser)

            if (freshData.tenant) {
              setTenant((prev) => (prev ? { ...prev, ...freshData.tenant } : freshData.tenant))
            }

            try {
              const saved = typeof window !== "undefined" ? localStorage.getItem(AUTH_STORAGE_KEY) : null
              if (saved) {
                const parsed = JSON.parse(saved)
                parsed.user = updatedUser
                if (freshData.tenant) {
                  parsed.tenant = { ...parsed.tenant, ...freshData.tenant }
                }
                localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed))
              }
            } catch {
              // ignore storage errors
            }
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
    const handleSuspended = (_e: Event) => {
      setUser(null)
      setTenant(null)
      setAccessToken(null)
      setSessionCookie(false)
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
    const isLegalConsentRoute = currentPath === "/legal/consent"
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

    // 2.5. STRICT GATEKEEPER: B2B Legal KVKK Consent MUST be accepted before anything else!
    if (tenant.b2bConsentAccepted === false) {
      if (!isLegalConsentRoute) {
        router.replace("/legal/consent")
      }
      return
    }

    // If B2B consent is already accepted, do not allow staying on /legal/consent
    if (tenant.b2bConsentAccepted && isLegalConsentRoute) {
      router.replace(tenant.onboardingCompleted ? "/" : "/onboarding")
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
        credentials: "include",
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
          credentials: "include",
          body: JSON.stringify({ phone: cleanPhone, code }),
        })

        const data = await res.json()
        if (!res.ok) {
          return {
            success: false,
            error: data.message || "INVALID_OTP",
          }
        }

        setAccessToken(data.accessToken)
        setSessionCookie(true)

        let dbTenant: Partial<Tenant> | null = null
        try {
          const tenantRes = await fetch(`${API_BASE_URL}/tenants/current`, {
            headers: { Authorization: `Bearer ${data.accessToken}` },
          })
          if (tenantRes.ok) {
            dbTenant = await tenantRes.json()
          }
        } catch {
          // fallback
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
          name: dbTenant?.title || data.user.tenantTitle || "Oto Servis",
          legalName: dbTenant?.legalName || dbTenant?.title || data.user.tenantTitle || "Oto Servis",
          taxOffice: dbTenant?.taxOffice || "",
          taxNumber: dbTenant?.taxNumber || "",
          city: dbTenant?.city || "İstanbul",
          district: dbTenant?.district || "",
          address: dbTenant?.address || "",
          logo: "/brand/worksauto-icon-white-tight.png",
          primaryColor: "#0284c7",
          slogan: "Güvenilir & Garantili Araç Bakım ve Onarım Merkezi",
          workingDays: dbTenant?.workingDays || ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"],
          workStartTime: dbTenant?.workStartTime || "08:30",
          workEndTime: dbTenant?.workEndTime || "18:30",
          breakStartTime: dbTenant?.breakStartTime || "12:30",
          breakEndTime: dbTenant?.breakEndTime || "13:30",
          services: [],
          staff: [],
          appointmentSlotDuration: dbTenant?.appointmentSlotDuration || 45,
          autoWorkOrder: true,
          criticalStockThreshold: dbTenant?.criticalStockThreshold || 5,
          onboardingCompleted: dbTenant?.onboardingCompleted ?? true,
        }

        setUser(liveUser)
        setTenant(liveTenant)

        // Store 30-day non-sensitive profile session in localStorage; bearer token is stored strictly in-memory
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: liveUser, tenant: liveTenant }))
          localStorage.removeItem(ACCESS_TOKEN_KEY)
          localStorage.removeItem(REFRESH_TOKEN_KEY)
        } catch {
          // ignore
        }

        if (!liveTenant.onboardingCompleted) {
          router.push("/onboarding")
        } else {
          router.push("/")
        }
        return { success: true }
      } catch {
        return { success: false, error: "Sunucu bağlantı hatası oluştu. Lütfen API servisinin çalıştığından emin olun." }
      }
    },
    [router]
  )

  const login = React.useCallback(
    (userData: User, tenantData: Tenant) => {
      setUser(userData)
      setTenant(tenantData)
      setSessionCookie(true)
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: userData, tenant: tenantData }))
      } catch {
        // ignore
      }
    },
    []
  )

  const logout = React.useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      }).catch(() => {})
    } finally {
      setUser(null)
      setTenant(null)
      setAccessToken(null)
      setSessionCookie(false)
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
    }
  }, [router, queryClient])

  const completeOnboarding = React.useCallback(async (data: Partial<Tenant>) => {
    try {
      await apiClient.post("/tenants/onboarding", data)
      toast.success("Atölye kurulumu başarıyla tamamlandı!")
    } catch (err: unknown) {
      console.warn("API Onboarding sync error:", err)
    }

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
    router.push("/")
  }, [router])

  const completeB2bConsent = React.useCallback((updatedTenant: Partial<Tenant>) => {
    setTenant((prev) => {
      if (!prev) return null
      const updated = {
        ...prev,
        ...updatedTenant,
        b2bConsentAccepted: true,
        b2bConsentAcceptedAt: new Date().toISOString(),
      }
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
    toast.success("B2B Sözleşmesi ve KVKK Protokolü başarıyla onaylandı!")
    router.replace("/")
  }, [router])

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
      completeB2bConsent,
    }),
    [user, tenant, isLoading, sendOtp, verifyOtp, login, logout, completeOnboarding, completeB2bConsent]
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
