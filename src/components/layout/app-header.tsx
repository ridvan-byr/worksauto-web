"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Menu,
  Search,
  Plus,
  Bell,
  Calendar,
  X,
  Car,
  User,
  ChevronRight,
} from "lucide-react"
import { BrandLogo } from "@/components/shared/brand-logo"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./theme-toggle"
import { useAuth } from "@/features/auth/auth-context"
import { useVehicles } from "@/features/vehicles/api/use-vehicles"
import { restartPageAnimation } from "@/lib/animation"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { NotificationPopover } from "@/features/notifications/components/notification-popover"
import { cn } from "@/lib/utils"

interface AppHeaderProps {
  onOpenMobile: () => void
  onForceRetrigger?: () => void
}

export function AppHeader({ onOpenMobile, onForceRetrigger }: AppHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const { data: apiVehicles } = useVehicles()

  // Global Quick Search State
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)
  const searchRef = React.useRef<HTMLDivElement>(null)

  // Close on outside click
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Close on Escape
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Live Search Results
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return []

    const q = searchQuery.toLowerCase().trim()
    const cleanPlateQ = q.replace(/\s/g, "")
    const allVehicles = (apiVehicles || []).map((v: any) => ({
      id: v.id,
      plate: v.plate,
      brand: v.brand,
      model: v.model,
      year: v.year,
      customerId: v.customerId,
      customerName: v.customer ? `${v.customer.firstName} ${v.customer.lastName}` : "Müşteri",
      customerPhone: v.customer?.phone || "",
    }))

    return allVehicles.filter((v: any) => {
      const matchPlate = v.plate.toLowerCase().replace(/\s/g, "").includes(cleanPlateQ)
      const matchModel = `${v.brand} ${v.model}`.toLowerCase().includes(q)
      const matchCustomer = v.customerName.toLowerCase().includes(q)
      const cleanDigits = q.replace(/\D/g, "")
      const matchPhone = cleanDigits.length >= 3 && v.customerPhone.replace(/\D/g, "").includes(cleanDigits)

      return matchPlate || matchModel || matchCustomer || matchPhone
    }).slice(0, 5) // Top 5 matches
  }, [searchQuery, apiVehicles])

  const handleSelectResult = (customerId: string) => {
    setIsOpen(false)
    setSearchQuery("")
    router.push(`/customers/${customerId}`)
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-[#070b12]/80 px-4 lg:px-8 backdrop-blur-md transition-colors">
      {/* Left: Mobile Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="lg:hidden flex items-center justify-center h-10 w-10 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          aria-label="Menüyü Aç"
        >
          <Menu size={22} />
        </button>

        {/* Mobile Logo */}
        <div className="lg:hidden">
          <BrandLogo
            collapsed={true}
            onClick={() => {
              if (pathname === "/") {
                restartPageAnimation()
                if (onForceRetrigger) onForceRetrigger()
              }
            }}
          />
        </div>
      </div>

      {/* Center: Global Fast Plate & Customer Search Bar */}
      <div ref={searchRef} className="relative hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Plaka, müşteri veya telefon ara... (örn: 34 RB 1905)"
            value={searchQuery}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setIsOpen(true)
            }}
            className="w-full h-10 pl-10 pr-9 rounded-2xl border border-slate-200/80 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 dark:border-slate-800/80 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:bg-slate-900 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("")
                setIsOpen(false)
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dynamic Search Dropdown */}
        {isOpen && searchQuery.trim().length >= 2 && (
          <div className="absolute top-12 left-0 right-0 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Arama Sonuçları</span>
              <span>{searchResults.length} Sonuç</span>
            </div>

            {searchResults.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 space-y-1">
                <Car size={20} className="mx-auto text-slate-300 dark:text-slate-600" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">Eşleşen Araç veya Müşteri Bulunamadı</p>
                <p className="text-[10px]">Farklı bir plaka veya isim deneyin.</p>
              </div>
            ) : (
              searchResults.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleSelectResult(v.customerId)}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <PlateBadge plate={v.plate} size="sm" />
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {v.brand} {v.model}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        Sahibi: <strong>{v.customerName}</strong> • {v.customerPhone}
                      </p>
                    </div>
                  </div>

                  <ChevronRight size={14} className="text-slate-400 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))
            )}

            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80 px-3 py-1 flex items-center justify-between text-[10px] text-slate-400">
              <span>Tüm listeyi görmek için:</span>
              <Link
                href="/customers"
                onClick={() => setIsOpen(false)}
                className="text-sky-500 font-semibold hover:underline"
              >
                Müşteriler Paneli
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Right: Quick Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/customers"
          className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-xl bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 dark:bg-sky-500/20 dark:text-sky-400 dark:hover:bg-sky-500/30 text-xs font-semibold transition-colors cursor-pointer"
        >
          <Plus size={15} />
          <span>Hızlı Kabul</span>
        </Link>

        <NotificationPopover />

        <ThemeToggle />

        {/* User Mini Avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-xs font-bold text-white shadow-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-none">
              {user ? `${user.name} ${user.surname}` : "Yetkili Kullanıcı"}
            </p>
            <p className="text-[10px] text-slate-400 leading-none mt-1">
              {user?.role === "tenant_admin" ? "Servis Yöneticisi" : "Servis Danışmanı"}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
