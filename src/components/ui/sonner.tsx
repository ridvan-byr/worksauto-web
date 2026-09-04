"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

export function Toaster({ ...props }: ToasterProps) {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group font-sans"
      position="top-right"
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white/95 dark:group-[.toaster]:bg-[#0e1524]/95 group-[.toaster]:text-slate-900 dark:group-[.toaster]:text-white group-[.toaster]:border-slate-200/90 dark:group-[.toaster]:border-slate-800/90 group-[.toaster]:shadow-2xl group-[.toaster]:backdrop-blur-xl group-[.toaster]:rounded-2xl group-[.toaster]:p-3.5 group-[.toaster]:gap-3 group-[.toaster]:text-xs transition-all",
          title: "font-bold text-xs tracking-tight",
          description: "text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed mt-0.5",
          actionButton:
            "group-[.toast]:bg-sky-600 group-[.toast]:hover:bg-sky-500 group-[.toast]:text-white font-semibold text-xs rounded-xl shadow-xs transition-colors",
          cancelButton:
            "group-[.toast]:bg-slate-100 dark:group-[.toast]:bg-slate-800 group-[.toast]:text-slate-600 dark:group-[.toast]:text-slate-300 font-semibold text-xs rounded-xl transition-colors",
          closeButton:
            "group-[.toast]:bg-slate-100 dark:group-[.toast]:bg-slate-800/90 group-[.toast]:border-slate-200 dark:group-[.toast]:border-slate-700/80 group-[.toast]:text-slate-400 hover:group-[.toast]:text-slate-900 dark:hover:group-[.toast]:text-white transition-colors",
          success:
            "!border-emerald-500/30 dark:!bg-[#0c1618]/95 !text-slate-900 dark:!text-white",
          error:
            "!border-rose-500/30 dark:!bg-[#190e14]/95 !text-slate-900 dark:!text-white",
          warning:
            "!border-amber-500/30 dark:!bg-[#191408]/95 !text-slate-900 dark:!text-white",
          info:
            "!border-sky-500/30 dark:!bg-[#0c1322]/95 !text-slate-900 dark:!text-white",
        },
      }}
      {...props}
    />
  )
}

export { toast }
