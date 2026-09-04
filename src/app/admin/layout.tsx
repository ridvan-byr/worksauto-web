"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Shield,
  Building2,
  Server,
  Activity,
  LogOut,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { BrandLogo } from "@/components/shared/brand-logo"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { toast } from "@/components/ui/sonner"
import {
  getAdminToken,
  getAdminUser,
  clearAdminSession,
  useAdminHealth,
} from "@/features/admin/api/use-admin"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const currentPath = pathname || (typeof window !== "undefined" ? window.location.pathname : "")
  const isLoginPage = currentPath === "/admin/login"

  const [isLoading, setIsLoading] = React.useState(true)
  const [adminUser, setAdminUser] = React.useState<any>(null)

  const { data: health } = useAdminHealth()

  React.useEffect(() => {
    const activePath = pathname || (typeof window !== "undefined" ? window.location.pathname : "")
    if (activePath === "/admin/login") {
      setIsLoading(false)
      return
    }

    const token = getAdminToken()
    const user = getAdminUser()

    if (!token || !user || user.role !== "SUPER_ADMIN") {
      clearAdminSession()
      router.replace("/admin/login")
      return
    }

    setAdminUser(user)
    setIsLoading(false)
  }, [pathname, isLoginPage, router])

  if (isLoginPage) {
    return <>{children}</>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Platform Yetkisi Doğrulanıyor...</p>
      </div>
    )
  }

  const handleLogout = () => {
    clearAdminSession()
    toast.info("Yönetici oturumu güvenli şekilde kapatıldı.")
    router.replace("/admin/login")
  }

  const isHealthy = health?.status === "OPERATIONAL"

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white transition-colors">
      {/* Top Header Bar */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0e1524]/90 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-4">
          <BrandLogo clickable={false} />
          <span className="hidden sm:inline-block w-px h-5 bg-slate-200 dark:bg-slate-800" />
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 rounded-full">
              Platform Yönetimi
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Merkezi Servis Konsolu</span>
          </div>
        </div>

        {/* Right Header Status, Theme & User */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Health Indicator Pill */}
          <div
            className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
              isHealthy
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
            }`}
            title={`PostgreSQL: ${health?.database?.status || "OK"} (${health?.database?.latencyMs || 0}ms) | Redis: ${health?.redis?.status || "OK"}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isHealthy ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            <span>{isHealthy ? "Tüm Servisler Aktif" : "Sistem Kontrolü"}</span>
          </div>

          {/* Theme Switcher Toggle (Light / Dark mode) */}
          <ThemeToggle />

          {/* Admin User Info */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25 flex items-center justify-center font-bold text-xs">
              <Shield size={15} />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {adminUser?.name} {adminUser?.surname}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{adminUser?.email}</p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
            title="Platformdan Güvenli Çıkış Yap"
            aria-label="Çıkış Yap"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        {children}
      </main>
    </div>
  )
}
