"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  Menu,
  Search,
  Plus,
  Bell,
  Calendar,
} from "lucide-react"
import { BrandLogo } from "@/components/shared/brand-logo"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./theme-toggle"
import { restartPageAnimation } from "@/lib/animation"

interface AppHeaderProps {
  onOpenMobile: () => void
  onForceRetrigger?: () => void
}

export function AppHeader({ onOpenMobile, onForceRetrigger }: AppHeaderProps) {
  const pathname = usePathname()

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
              }
            }}
          />
        </div>

        {/* Desktop Search / Quick Plate Finder */}
        <div className="hidden sm:flex items-center gap-2 pl-2">
          <div className="relative w-64 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Plaka, müşteri veya iş emri ara... [34 ABC]"
              className="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:placeholder:text-slate-500 dark:focus:bg-slate-900 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Right: Quick Actions, Theme, User Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Quick New Action Button */}
        <div className="hidden md:flex items-center gap-2">
          <Button size="sm" variant="outline" className="text-xs h-9 gap-1.5 border-slate-200 dark:border-slate-800 cursor-pointer">
            <Calendar size={14} className="text-sky-500" />
            <span>Yeni Randevu</span>
          </Button>

          <Button size="sm" className="text-xs h-9 gap-1.5 cursor-pointer">
            <Plus size={15} />
            <span>İş Emri Aç</span>
          </Button>
        </div>

        {/* Notification Bell */}
        <button
          className="relative flex items-center justify-center h-9 w-9 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
          title="Bildirimler"
        >
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-sky-500" />
        </button>

        {/* 3-Way Theme Selector with Circular Reveal Animation */}
        <ThemeToggle />

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
            R
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-semibold leading-tight text-slate-900 dark:text-slate-100">
              Rıdvan Bayır
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Servis Yöneticisi
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
