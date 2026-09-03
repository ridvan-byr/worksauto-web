import * as React from "react"
import { WorkOrderStatus } from "../types"
import { cn } from "@/lib/utils"

export function WorkOrderStatusBadge({ status, className }: { status: WorkOrderStatus; className?: string }) {
  switch (status) {
    case "PENDING":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
            className
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>Sırada Bekliyor</span>
        </span>
      )
    case "IN_PROGRESS":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20",
            className
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          <span>Lifte / İşlemde</span>
        </span>
      )
    case "COMPLETED":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
            className
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Hazır / Bitti</span>
        </span>
      )
    case "CANCELLED":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200/70 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700 line-through opacity-80",
            className
          )}
        >
          <span>İptal Edildi</span>
        </span>
      )
    default:
      return null
  }
}
