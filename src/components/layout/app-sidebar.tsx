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
  ChevronDown,
  ShieldCheck,
  LogOut,
} from "lucide-react"
import { BrandLogo } from "@/components/shared/brand-logo"
import { useAuth } from "@/features/auth/auth-context"
import { useDashboardSummary } from "@/features/dashboard/api/use-dashboard-summary"
import { restartPageAnimation } from "@/lib/animation"
import { cn } from "@/lib/utils"

interface NavSubItem {
  title: string
  href: string
  icon: any
  badge?: string
  badgeVariant?: "accent" | "warning" | "danger"
}

interface NavItem {
  title: string
  href: string
  icon: any
  badge?: string
  badgeVariant?: "accent" | "warning" | "danger"
  highlight?: boolean
  roles?: string[]
  children?: NavSubItem[]
}

interface AppSidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function AppSidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: AppSidebarProps) {
  const pathname = usePathname()
  const { tenant, user, logout } = useAuth()
  const { data: summary } = useDashboardSummary()

  const [openSubMenus, setOpenSubMenus] = React.useState<Record<string, boolean>>({
    "Müşteriler": true,
  })

  React.useEffect(() => {
    if (pathname.startsWith("/customers") || pathname.startsWith("/vehicles")) {
      setOpenSubMenus((prev) => ({ ...prev, "Müşteriler": true }))
    }
  }, [pathname])

  const toggleSubMenu = (e: React.MouseEvent, title: string) => {
    e.preventDefault()
    e.stopPropagation()
    setOpenSubMenus((prev) => ({
      ...prev,
      [title]: prev[title] !== undefined ? !prev[title] : false,
    }))
  }

  const handleNavClick = (href: string) => {
    onCloseMobile()
    if (pathname === href) {
      restartPageAnimation()
    }
  }

  const dynamicNavItems: NavItem[] = React.useMemo(() => {
    return [
      {
        title: "Ana Sayfa & Panel",
        href: "/",
        icon: LayoutDashboard,
      },
      {
        title: "Müşteriler",
        href: "/customers",
        icon: Users,
        badge:
          summary?.totalCustomersCount !== undefined && summary.totalCustomersCount > 0
            ? String(summary.totalCustomersCount)
            : undefined,
        children: [
          {
            title: "Müşteri Rehberi",
            href: "/customers",
            icon: Users,
          },
          {
            title: "Araçlar",
            href: "/vehicles",
            icon: Car,
            badge:
              summary?.totalVehiclesCount !== undefined && summary.totalVehiclesCount > 0
                ? String(summary.totalVehiclesCount)
                : undefined,
          },
        ],
      },
      {
        title: "Randevu Takvimi",
        href: "/appointments",
        icon: Calendar,
        badge:
          summary?.todayAppointmentsCount && summary.todayAppointmentsCount > 0
            ? `${summary.todayAppointmentsCount} Bugün`
            : undefined,
        badgeVariant: "accent",
      },
      {
        title: "İş Emirleri (Atölye)",
        href: "/work-orders",
        icon: Wrench,
        badge:
          summary?.activeWorkOrdersCount && summary.activeWorkOrdersCount > 0
            ? `${summary.activeWorkOrdersCount} Lifte`
            : undefined,
        badgeVariant: "warning",
      },
      {
        title: "Yedek Parça & Stok",
        href: "/inventory",
        icon: Package,
        badge:
          summary?.criticalStockCount && summary.criticalStockCount > 0
            ? `${summary.criticalStockCount} Kritik`
            : undefined,
        badgeVariant: "danger",
      },
      {
        title: "Faturalar & Kasa",
        href: "/invoices",
        icon: Receipt,
        badge:
          summary?.unpaidInvoicesCount && summary.unpaidInvoicesCount > 0
            ? `${summary.unpaidInvoicesCount} Bekleyen`
            : undefined,
        badgeVariant: "warning",
        roles: ["OWNER", "SERVICE_MANAGER", "CASHIER", "tenant_admin"],
      },
      {
        title: "Cari Hesaplar",
        href: "/current-accounts",
        icon: FileSpreadsheet,
        roles: ["OWNER", "SERVICE_MANAGER", "CASHIER", "tenant_admin"],
      },
      {
        title: "İşlem Geçmişi & Denetim",
        href: "/audit-logs",
        icon: ShieldCheck,
        roles: ["OWNER", "SERVICE_MANAGER", "tenant_admin"],
      },
      {
        title: "Servis Ayarları",
        href: "/settings",
        icon: Settings,
        roles: ["OWNER", "SERVICE_MANAGER", "tenant_admin"],
      },
    ]
  }, [summary])

  const visibleNavItems = React.useMemo(() => {
    if (!user?.role) return dynamicNavItems
    const r = (user.role || "").toUpperCase()
    return dynamicNavItems.filter((item) => {
      if (!item.roles) return true
      const upperAllowed = item.roles.map((x) => x.toUpperCase())
      return upperAllowed.includes(r) || (r === "TENANT_ADMIN" && upperAllowed.includes("OWNER"))
    })
  }, [user?.role, dynamicNavItems])

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar Shell */}
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
          {visibleNavItems.map((item) => {
            const hasChildren = Boolean(item.children && item.children.length > 0)
            const isChildActive = Boolean(hasChildren && item.children!.some((c) => pathname === c.href))
            const isActive = pathname === item.href || (collapsed && isChildActive)
            const isExpanded = openSubMenus[item.title] ?? true
            const Icon = item.icon

            return (
              <div key={item.title} className="space-y-1">
                <div className="flex items-center">
                  <Link
                    href={item.href}
                    onClick={() => {
                      handleNavClick(item.href)
                      if (hasChildren && !isExpanded) {
                        setOpenSubMenus((prev) => ({ ...prev, [item.title]: true }))
                      }
                    }}
                    className={cn(
                      "group relative flex-1 flex items-center rounded-xl text-sm font-medium transition-colors duration-150 cursor-pointer",
                      collapsed ? "h-11 w-full justify-center px-0" : "h-11 px-3 gap-3",
                      isActive
                        ? "bg-sky-500 text-white shadow-sm shadow-sky-500/25 dark:bg-sky-500 dark:text-slate-950 font-semibold"
                        : isChildActive
                        ? "text-sky-600 dark:text-sky-400 bg-sky-500/10 font-medium"
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
                          : isChildActive
                          ? "text-sky-500 dark:text-sky-400"
                          : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200",
                        item.highlight && "text-amber-500 animate-pulse"
                      )}
                    />

                    {!collapsed && (
                      <span className="flex-1 truncate tracking-tight transition-opacity duration-200">
                        {item.title}
                      </span>
                    )}

                    {!collapsed && item.badge && !hasChildren && (
                      <span
                        className={cn(
                          "ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full transition-opacity duration-200",
                          isActive
                            ? "bg-white/20 text-white dark:bg-slate-900/40 dark:text-slate-950"
                            : item.badgeVariant === "accent"
                            ? "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                            : item.badgeVariant === "warning"
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            : item.badgeVariant === "danger"
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Collapsible toggle arrow for items with children */}
                    {!collapsed && hasChildren && (
                      <button
                        type="button"
                        onClick={(e) => toggleSubMenu(e, item.title)}
                        className={cn(
                          "ml-auto p-1 rounded-lg transition-transform cursor-pointer",
                          isActive
                            ? "text-white dark:text-slate-950 hover:bg-white/20"
                            : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                        )}
                        title={isExpanded ? "Alt menüyü daralt" : "Alt menüyü genişlet"}
                        aria-label={isExpanded ? "Alt menüyü daralt" : "Alt menüyü genişlet"}
                      >
                        <ChevronDown
                          size={14}
                          className={cn(
                            "transition-transform duration-200",
                            isExpanded ? "rotate-0" : "-rotate-90"
                          )}
                        />
                      </button>
                    )}
                  </Link>
                </div>

                {/* Sub-items (nested under parent like Müşteriler -> Araç Parkı) */}
                {!collapsed && hasChildren && isExpanded && (
                  <div className="ml-5 pl-3 border-l-2 border-slate-200/80 dark:border-slate-800/80 space-y-1 py-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    {item.children!.map((sub) => {
                      const isSubActive = pathname === sub.href
                      const SubIcon = sub.icon

                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => handleNavClick(sub.href)}
                          className={cn(
                            "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                            isSubActive
                              ? "bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold border border-sky-500/30"
                              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                          )}
                        >
                          <SubIcon
                            size={15}
                            className={cn(
                              "shrink-0 transition-transform group-hover:scale-110",
                              isSubActive ? "text-sky-500 dark:text-sky-400" : "text-slate-400"
                            )}
                          />
                          <span className="flex-1 truncate">{sub.title}</span>
                          {sub.badge && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
                              {sub.badge}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer Tenant Info & Logout */}
        <div className="p-2.5 border-t border-slate-200/70 dark:border-slate-800/70 space-y-1.5">
          {!collapsed ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 transition-opacity duration-200">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-500 flex items-center justify-center shrink-0 font-bold text-xs border border-sky-500/20">
                  {tenant?.name ? tenant.name.slice(0, 2).toUpperCase() : "WA"}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {tenant?.name || "Servis Paneli"}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                    <ShieldCheck size={11} className="text-emerald-500 shrink-0" />
                    Pro Plan (Aktif)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Oturumu Kapat"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-500 flex items-center justify-center font-bold text-xs border border-sky-500/20 cursor-pointer hover:scale-105 transition-transform"
                title={`${tenant?.name || "Servis"} (Pro Plan)`}
              >
                {tenant?.name ? tenant.name.slice(0, 2).toUpperCase() : "WA"}
              </div>
              <button
                type="button"
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                title="Oturumu Kapat"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
