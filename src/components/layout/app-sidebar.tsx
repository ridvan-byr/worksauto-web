"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Car,
  Calendar,
  Wrench,
  Package,
  Receipt,
  FileSpreadsheet,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react"
import { BrandLogo } from "@/components/shared/brand-logo"
import { restartPageAnimation } from "@/lib/animation"
import { cn } from "@/lib/utils"

interface AppSidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

const navItems = [
  {
    title: "Ana Sayfa & Panel",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Müşteriler",
    href: "/customers",
    icon: Users,
    badge: "24",
  },
  {
    title: "Araçlar",
    href: "/vehicles",
    icon: Car,
  },
  {
    title: "Randevu Takvimi",
    href: "/appointments",
    icon: Calendar,
    badge: "5 Yeni",
    badgeVariant: "accent",
  },
  {
    title: "İş Emirleri (Atölye)",
    href: "/work-orders",
    icon: Wrench,
    badge: "8 Lifte",
    badgeVariant: "warning",
  },
  {
    title: "Yedek Parça & Stok",
    href: "/inventory",
    icon: Package,
  },
  {
    title: "Faturalar & Kasa",
    href: "/invoices",
    icon: Receipt,
  },
  {
    title: "Cari Hesaplar",
    href: "/current-accounts",
    icon: FileSpreadsheet,
  },
  {
    title: "Onboarding Wizard",
    href: "/onboarding",
    icon: Sparkles,
    highlight: true,
  },
  {
    title: "Servis Ayarları",
    href: "/settings",
    icon: Settings,
  },
]

export function AppSidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: AppSidebarProps) {
  const pathname = usePathname()

  const handleNavClick = (href: string) => {
    onCloseMobile()
    if (pathname === href) {
      restartPageAnimation()
    }
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200/80 bg-white/95 dark:border-slate-800/80 dark:bg-[#070b12]/95 backdrop-blur-xl transition-[width,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          // Mobile state
          mobileOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0",
          // Desktop collapsed state
          collapsed ? "lg:w-[72px]" : "lg:w-64"
        )}
      >
        {/* Floating Edge Toggle Handle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex absolute -right-3 top-5 z-50 h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-500 hover:text-sky-500 hover:scale-110 hover:border-sky-500/50 dark:text-slate-400 dark:hover:text-sky-400 dark:hover:border-sky-400/50 transition-all cursor-pointer"
          title={collapsed ? "Menüyü Genişlet" : "Menüyü Daralt"}
          aria-label={collapsed ? "Menüyü Genişlet" : "Menüyü Daralt"}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>

        {/* Header / Brand Area */}
        <div className="flex h-16 items-center justify-center px-3 border-b border-slate-200/70 dark:border-slate-800/70 overflow-hidden">
          <BrandLogo collapsed={collapsed} />
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-4 px-2.5 space-y-1.5 scrollbar-none">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => handleNavClick(item.href)}
                className={cn(
                  "group relative flex items-center rounded-xl text-sm font-medium transition-colors duration-150 cursor-pointer",
                  collapsed ? "h-11 w-full justify-center px-0" : "h-11 px-3 gap-3",
                  isActive
                    ? "bg-sky-500 text-white shadow-sm shadow-sky-500/25 dark:bg-sky-500 dark:text-slate-950 font-semibold"
                    : item.highlight
                    ? "text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
                )}
                title={collapsed ? item.title : undefined}
              >
                <Icon
                  size={20}
                  className={cn(
                    "shrink-0 transition-transform group-hover:scale-110",
                    isActive
                      ? "text-white dark:text-slate-950"
                      : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200",
                    item.highlight && "text-amber-500 animate-pulse"
                  )}
                />

                {!collapsed && (
                  <span className="flex-1 truncate tracking-tight transition-opacity duration-200">
                    {item.title}
                  </span>
                )}

                {!collapsed && item.badge && (
                  <span
                    className={cn(
                      "ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full transition-opacity duration-200",
                      isActive
                        ? "bg-white/20 text-white dark:bg-slate-900/40 dark:text-slate-950"
                        : item.badgeVariant === "accent"
                        ? "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                        : item.badgeVariant === "warning"
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Footer Tenant Info */}
        <div className="p-2.5 border-t border-slate-200/70 dark:border-slate-800/70">
          {!collapsed ? (
            <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 transition-opacity duration-200">
              <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-500 flex items-center justify-center shrink-0 font-bold text-xs border border-sky-500/20">
                YS
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  Yıldız Oto Servis
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <ShieldCheck size={11} className="text-emerald-500 shrink-0" />
                  Pro Plan (Aktif)
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div
                className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-500 flex items-center justify-center font-bold text-xs border border-sky-500/20 cursor-pointer hover:scale-105 transition-transform"
                title="Yıldız Oto Servis (Pro Plan)"
              >
                YS
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
