"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { User, Tenant, ServiceItem, StaffMember } from "./types"

const AUTH_STORAGE_KEY = "worksauto_auth_session"

// 1. Initial Mock Tenants
const MOCK_TENANTS: Record<string, { user: User; tenant: Tenant }> = {
  // Scenario 1: Active Completed Workshop
  "05320000001": {
    user: {
      id: "usr_1",
      name: "Rıdvan",
      surname: "Bayar",
      phone: "05320000001",
      email: "ridvan@yildizoto.com",
      role: "tenant_admin",
    },
    tenant: {
      id: "ten_yildiz",
      name: "Yıldız Oto Servis",
      legalName: "Yıldız Motorlu Araçlar San. ve Tic. Ltd. Şti.",
      taxOffice: "Kadıköy",
      taxNumber: "9876543210",
      city: "İstanbul",
      district: "Kadıköy",
      address: "Oto Sanayi Sitesi A Blok No: 14",
      logo: "/brand/worksauto-icon-white-tight.png",
      primaryColor: "#0284c7",
      slogan: "Güvenilir & Garantili Araç Bakım ve Onarım Merkezi",
      workingDays: ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"],
      workStartTime: "08:30",
      workEndTime: "18:30",
      breakStartTime: "12:30",
      breakEndTime: "13:30",
      services: [
        { id: "s1", name: "Periyodik Bakım (Yağ + 4 Filtre)", durationMinutes: 60, laborPrice: 1250 },
        { id: "s2", name: "Ön & Arka Fren Balata Değişimi", durationMinutes: 45, laborPrice: 850 },
        { id: "s3", name: "Bilgisayarlı Arıza Tespit & Teşhis", durationMinutes: 30, laborPrice: 500 },
      ],
      staff: [
        { id: "st1", name: "Ahmet", surname: "Usta", phone: "0532 111 22 33", expertise: "Motor & Mekanik" },
        { id: "st2", name: "Mustafa", surname: "Demir", phone: "0533 222 33 44", expertise: "Oto Elektrik & Beyin" },
      ],
      appointmentSlotDuration: 45,
      autoWorkOrder: true,
      criticalStockThreshold: 5,
      onboardingCompleted: true,
    },
  },

  // Scenario 2: Newly Provisioned Workshop (Only 4 fields by Super Admin)
  "05320000002": {
    user: {
      id: "usr_2",
      name: "Mehmet",
      surname: "Demir",
      phone: "05320000002",
      email: "mehmet@egemotor.com",
      role: "tenant_admin",
    },
    tenant: {
      id: "ten_ege",
      name: "", // To be filled in onboarding
      legalName: "",
      taxOffice: "",
      taxNumber: "",
      city: "",
      district: "",
      address: "",
      logo: "",
      primaryColor: "#0284c7",
      slogan: "",
      workingDays: ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"],
      workStartTime: "08:30",
      workEndTime: "18:00",
      services: [],
      staff: [],
      appointmentSlotDuration: 45,
      autoWorkOrder: true,
      criticalStockThreshold: 5,
      onboardingCompleted: false, // Must complete onboarding!
    },
  },
}

interface AuthContextType {
  user: User | null
  tenant: Tenant | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (phone: string, codeOrPass: string) => { success: boolean; error?: string }
  logout: () => void
  completeOnboarding: (data: Partial<Tenant>) => void
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  // Default to active session in dev or check localStorage
  const [user, setUser] = React.useState<User | null>(MOCK_TENANTS["05320000001"].user)
  const [tenant, setTenant] = React.useState<Tenant | null>(MOCK_TENANTS["05320000001"].tenant)
  const [isLoading, setIsLoading] = React.useState(true)

  // Load from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.user && parsed.tenant) {
          setUser(parsed.user)
          setTenant(parsed.tenant)
        }
      }
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Route Guard: enforce onboarding and auth rules
  React.useEffect(() => {
    if (isLoading) return

    const isAuthRoute = pathname === "/sign-in"
    const isOnboardingRoute = pathname === "/onboarding"

    // If logged in but onboarding is NOT completed, lock into /onboarding
    if (user && tenant && !tenant.onboardingCompleted) {
      if (!isOnboardingRoute) {
        router.replace("/onboarding")
      }
    }

    // If logged in and onboarding IS completed, prevent access to /onboarding
    if (user && tenant && tenant.onboardingCompleted && isOnboardingRoute) {
      router.replace("/")
    }
  }, [user, tenant, isLoading, pathname, router])

  const login = React.useCallback(
    (rawPhone: string, codeOrPass: string) => {
      const cleanPhone = rawPhone.replace(/\D/g, "")
      const account = MOCK_TENANTS[cleanPhone]

      if (!account) {
        return {
          success: false,
          error: "NOT_FOUND",
        }
      }

      setUser(account.user)
      setTenant(account.tenant)

      try {
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({ user: account.user, tenant: account.tenant })
        )
      } catch (e) {
        // ignore
      }

      if (!account.tenant.onboardingCompleted) {
        router.push("/onboarding")
      } else {
        router.push("/")
      }

      return { success: true }
    },
    [router]
  )

  const logout = React.useCallback(() => {
    setUser(null)
    setTenant(null)
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    } catch (e) {
      // ignore
    }
    router.push("/sign-in")
  }, [router])

  const completeOnboarding = React.useCallback(
    (data: Partial<Tenant>) => {
      setTenant((prev) => {
        if (!prev) return null
        const updated: Tenant = {
          ...prev,
          ...data,
          onboardingCompleted: true,
        }
        try {
          localStorage.setItem(
            AUTH_STORAGE_KEY,
            JSON.stringify({ user, tenant: updated })
          )
        } catch (e) {
          // ignore
        }
        return updated
      })
      router.push("/")
    },
    [user, router]
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
