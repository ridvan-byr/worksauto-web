import * as React from "react"
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import { StockUnit } from "../types"
import { cn } from "@/lib/utils"

interface StockBadgeProps {
  currentStock: number
  minimumStock: number
  unit: StockUnit
  className?: string
}

export function StockBadge({ currentStock, minimumStock, unit, className }: StockBadgeProps) {
  const isOutOfStock = currentStock <= 0
  const isLowStock = currentStock <= minimumStock && !isOutOfStock

  if (isOutOfStock) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 animate-pulse",
          className
        )}
      >
        <XCircle size={12} />
        <span>Tükendi (0 {unit})</span>
      </span>
    )
  }

  if (isLowStock) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
          className
        )}
      >
        <AlertTriangle size={12} />
        <span>Kritik ({currentStock} {unit})</span>
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
        className
      )}
    >
      <CheckCircle2 size={12} />
      <span>{currentStock} {unit}</span>
    </span>
  )
}
