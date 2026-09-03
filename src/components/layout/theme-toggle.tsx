"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, Laptop, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setMounted(true)
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const changeThemeWithAnimation = (newTheme: string, e: React.MouseEvent) => {
    setOpen(false)
    if (newTheme === theme) return

    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!document.startViewTransition || isReduced) {
      setTheme(newTheme)
      return
    }

    const x = e.clientX
    const y = e.clientY
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    const transition = document.startViewTransition(() => {
      setTheme(newTheme)
    })

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 450,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      )
    })
  }

  // Consistent icon render: default to dark (defaultTheme="dark") before mount to avoid pop-in
  const isDark = mounted ? resolvedTheme === "dark" : true

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none"
        title="Tema Tercihi"
        aria-label="Tema Tercihi"
      >
        {isDark ? (
          <Moon size={16} className="text-sky-400" />
        ) : (
          <Sun size={16} className="text-amber-500" />
        )}
        <ChevronDown
          size={13}
          className={cn("text-slate-400 transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-36 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl shadow-slate-950/20 backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <button
            onClick={(e) => changeThemeWithAnimation("light", e)}
            className={cn(
              "flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left",
              theme === "light"
                ? "bg-sky-500/15 text-sky-600 dark:text-sky-400 font-semibold"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
            )}
          >
            <Sun size={15} className="text-amber-500" />
            <span>Açık Tema</span>
          </button>

          <button
            onClick={(e) => changeThemeWithAnimation("dark", e)}
            className={cn(
              "flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left",
              theme === "dark"
                ? "bg-sky-500/15 text-sky-600 dark:text-sky-400 font-semibold"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
            )}
          >
            <Moon size={15} className="text-sky-400" />
            <span>Koyu Tema</span>
          </button>

          <button
            onClick={(e) => changeThemeWithAnimation("system", e)}
            className={cn(
              "flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left",
              theme === "system"
                ? "bg-sky-500/15 text-sky-600 dark:text-sky-400 font-semibold"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
            )}
          >
            <Laptop size={15} className="text-slate-400" />
            <span>Sistem</span>
          </button>
        </div>
      )}
    </div>
  )
}
