"use client"

import * as React from "react"
import { AppSidebar } from "./app-sidebar"
import { AppHeader } from "./app-header"
import { cn } from "@/lib/utils"

const COOKIE_NAME = "worksauto_sidebar_collapsed"

interface AppShellProps {
  children: React.ReactNode
  defaultCollapsed?: boolean
}

export function AppShell({ children, defaultCollapsed = false }: AppShellProps) {
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
