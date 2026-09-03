"use client"

import * as React from "react"
import Link from "next/navigation"
import { useRouter } from "next/navigation"
import {
  Wrench,
  User,
  Clock,
  ArrowRight,
  Play,
  CheckCircle2,
  Camera,
  MessageSquare,
  AlertCircle,
} from "lucide-react"
import { WorkOrder, WorkOrderStatus } from "../types"
import { WorkOrderStatusBadge } from "./work-order-status-badge"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface WorkOrderCardProps {
  order: WorkOrder
  onStatusChange: (id: string, newStatus: WorkOrderStatus) => void
}

export function WorkOrderCard({ order, onStatusChange }: WorkOrderCardProps) {
  const router = useRouter()

  const handleCardClick = () => {
    router.push(`/work-orders/${order.id}`)
  }

  return (
    <div
      onClick={handleCardClick}
      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-sky-500/40 transition-all cursor-pointer space-y-3 group"
    >
      {/* Top Header: Plate & WO Number */}
      <div className="flex items-center justify-between gap-2">
        <PlateBadge plate={order.plate} size="sm" />
        <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
          {order.workOrderNumber}
        </span>
      </div>

      {/* Vehicle Model & Customer Name */}
      <div>
        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
          {order.brand} {order.model}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
          {order.customerName}
        </p>
      </div>

      {/* Services List Preview */}
      <div className="space-y-1 py-1 border-y border-slate-100 dark:border-slate-800/60">
        {order.services.slice(0, 2).map((s) => (
          <div key={s.id} className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
            <span className="truncate pr-2">• {s.name}</span>
            <span className="font-mono font-medium shrink-0">{s.laborPrice} ₺</span>
          </div>
        ))}
        {order.services.length > 2 && (
          <p className="text-[10px] text-slate-400 font-medium italic">
            +{order.services.length - 2} ek işlem daha...
          </p>
        )}
      </div>

      {/* Lift & Mechanic Badge */}
      <div className="flex items-center justify-between text-[10px] text-slate-500">
        <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
          <Wrench size={12} className="text-sky-500" />
          <span>{order.assignedLift}</span>
        </span>
        <span className="font-medium">{order.assignedMechanicName}</span>
      </div>

      {/* Bottom Footer: Total, Indicators & Quick Status Button */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60">
        <div>
          <span className="text-[10px] text-slate-400 block">Genel Toplam (KDV Dahil)</span>
          <span className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
            {order.grandTotal.toLocaleString("tr-TR")} ₺
          </span>
        </div>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {order.status === "PENDING" && (
            <button
              type="button"
              onClick={() => onStatusChange(order.id, "IN_PROGRESS")}
              className="h-7 px-2.5 rounded-lg bg-sky-500 text-white hover:bg-sky-600 text-[10px] font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
              title="Aracı Lifte Al"
            >
              <Play size={10} fill="currentColor" />
              <span>Lifte Al</span>
            </button>
          )}

          {order.status === "IN_PROGRESS" && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onStatusChange(order.id, "PENDING")}
                className="h-7 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-semibold transition-colors cursor-pointer"
                title="Yanlışlıkla alındıysa sıraya geri al"
              >
                ↩ Sıraya Al
              </button>
              <button
                type="button"
                onClick={() => onStatusChange(order.id, "COMPLETED")}
                className="h-7 px-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-[10px] font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                title="İşi Bitir"
              >
                <CheckCircle2 size={11} />
                <span>Tamamla</span>
              </button>
            </div>
          )}

          {order.status === "COMPLETED" && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onStatusChange(order.id, "IN_PROGRESS")}
                className="h-7 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-semibold transition-colors cursor-pointer"
                title="İşi yeniden lifte geri al"
              >
                ↩ Lifte Geri Al
              </button>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={12} />
                <span>Bitti</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
