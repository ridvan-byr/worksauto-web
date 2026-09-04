"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { AppSidebar } from "./app-sidebar"
import { AppHeader } from "./app-header"
import { useAuth } from "@/features/auth/auth-context"
import { cn } from "@/lib/utils"

const COOKIE_NAME = "worksauto_sidebar_collapsed"

interface AppShellProps {
  children: React.ReactNode
  defaultCollapsed?: boolean
}

export function AppShell({ children, defaultCollapsed = false }: AppShellProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  // Keep state in sync with server prop
  React.useEffect(() => {
    setCollapsed(defaultCollapsed)
  }, [defaultCollapsed])

  const handleToggleCollapse = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=31536000; SameSite=Lax`
        localStorage.setItem("worksauto-sidebar-collapsed", JSON.stringify(next))
      } catch (e) {
        // ignore
      }
      return next
    })
  }, [])

  const { user, tenant, isLoading } = useAuth()
  const currentPath = pathname || (typeof window !== "undefined" ? window.location.pathname : "")

  // Immersive Fullscreen Routes: Login, Onboarding & Admin do NOT render the tenant dashboard shell
  const isImmersiveRoute =
    currentPath === "/sign-in" ||
    currentPath === "/login" ||
    currentPath === "/onboarding" ||
    currentPath.startsWith("/book") ||
    currentPath.startsWith("/admin")

  if (isImmersiveRoute) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100">
        {children}
      </div>
    )
  }

  // If loading auth state, show a clean loading indicator
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Oturum doğrulanıyor...</p>
      </div>
    )
  }

  // If not logged in, block protected content and wait for redirect to /sign-in
  if (!user || !tenant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Giriş ekranına yönlendiriliyorsunuz...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Sidebar */}
      <AppSidebar
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Container */}
      <div
        className={cn(
          "flex flex-col min-h-screen transition-[padding] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          collapsed ? "lg:pl-[72px]" : "lg:pl-64"
        )}
      >
        <AppHeader onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
