import * as React from "react"
import { CheckCircle2, Clock, XCircle } from "lucide-react"
import { InvoiceStatus } from "../types"
import { cn } from "@/lib/utils"

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus
  className?: string
}

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  if (status === "PAID") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
          className
        )}
      >
        <CheckCircle2 size={12} />
        <span>Ödendi</span>
      </span>
    )
  }

  if (status === "PARTIALLY_PAID") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
          className
        )}
      >
        <Clock size={12} />
        <span>Kısmi Ödendi</span>
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
        className
      )}
    >
      <XCircle size={12} />
      <span>Ödenmedi</span>
    </span>
  )
}
