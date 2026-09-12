"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Wrench,
  Play,
  CheckCircle2,
  XCircle,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { WorkOrder, WorkOrderStatus } from "../types"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { cn } from "@/lib/utils"

interface WorkOrderCardProps {
  order: WorkOrder
  index: number
  columnStatus: WorkOrderStatus
  activeDraggedId?: string | null
  activeDraggedStatus?: WorkOrderStatus | null
  onStatusChange: (id: string, newStatus: WorkOrderStatus) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  isFirst?: boolean
  isLast?: boolean
  onDragStartCard?: (id: string, status: WorkOrderStatus, index: number) => void
  onDragEndCard?: () => void
  onCardDragOverSlot?: (columnStatus: WorkOrderStatus, index: number) => void
  onCardDrop?: (draggedId: string, targetId: string, position: "before" | "after") => void
}

export function WorkOrderCard({
  order,
  index,
  columnStatus,
  activeDraggedId,
  activeDraggedStatus,
  onStatusChange,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
  onDragStartCard,
  onDragEndCard,
  onCardDragOverSlot,
  onCardDrop,
}: WorkOrderCardProps) {
  const router = useRouter()
  const [isDragging, setIsDragging] = React.useState(false)
  const [dropPosition, setDropPosition] = React.useState<"before" | "after" | null>(null)

  const isCurrentDragged = activeDraggedId === order.id || isDragging
  const isDifferentColumnDrag = Boolean(
    activeDraggedStatus && activeDraggedStatus !== columnStatus
  )

  const handleCardClick = () => {
    router.push(`/work-orders/${order.id}`)
  }

  return (
    <div
      onClick={handleCardClick}
      draggable={order.status !== "CANCELLED"}
      onDragStart={(e) => {
        setIsDragging(true)
        onDragStartCard?.(order.id, order.status, index)
        e.dataTransfer.setData("application/work-order-id", order.id)
        e.dataTransfer.setData("application/work-order-status", order.status)
        e.dataTransfer.setData("text/plain", order.id)
        e.dataTransfer.setData(
          "application/json",
          JSON.stringify({ orderId: order.id, currentStatus: order.status })
        )
        e.dataTransfer.effectAllowed = "move"
      }}
      onDragEnd={() => {
        setIsDragging(false)
        setDropPosition(null)
        onDragEndCard?.()
      }}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("application/work-order-id")) return
        e.preventDefault()
        e.stopPropagation()
        e.dataTransfer.dropEffect = "move"

        if (isDifferentColumnDrag) {
          const rect = e.currentTarget.getBoundingClientRect()
          const midY = rect.top + rect.height / 2
          const pos = e.clientY < midY ? "before" : "after"
          if (dropPosition !== pos) {
            setDropPosition(pos)
          }
        } else {
          // Same column: active live preview & shifting
          if (dropPosition !== null) setDropPosition(null)
          onCardDragOverSlot?.(columnStatus, index)
        }
      }}
      onDragEnter={(e) => {
        if (!e.dataTransfer.types.includes("application/work-order-id")) return
        e.preventDefault()
        e.stopPropagation()

        if (!isDifferentColumnDrag) {
          onCardDragOverSlot?.(columnStatus, index)
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setDropPosition(null)
        }
      }}
      onDrop={(e) => {
        const draggedId =
          e.dataTransfer.getData("application/work-order-id") || activeDraggedId
        if (!draggedId || draggedId === order.id) {
          setDropPosition(null)
          onDragEndCard?.()
          return
        }
        e.preventDefault()
        e.stopPropagation()
        const pos = dropPosition || "after"
        setDropPosition(null)
        onCardDrop?.(draggedId, order.id, pos)
        onDragEndCard?.()
      }}
      className={cn(
        "p-4 sm:p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-sky-500/40 transition-all duration-150 cursor-grab active:cursor-grabbing space-y-3.5 group select-none relative",
        isCurrentDragged &&
          "opacity-60 scale-[0.99] border-dashed border-sky-500 bg-sky-500/10 shadow-md ring-2 ring-sky-500/30"
      )}
    >
      {/* Drop Insertion Line Indicator */}
      {dropPosition === "before" && (
        <div className="absolute -top-2 left-1 right-1 h-1.5 bg-sky-500 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.9)] z-30 animate-pulse pointer-events-none" />
      )}
      {dropPosition === "after" && (
        <div className="absolute -bottom-2 left-1 right-1 h-1.5 bg-sky-500 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.9)] z-30 animate-pulse pointer-events-none" />
      )}

      {/* Top Header: Plate, WO Number & Reorder Actions */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-1.5">
          <GripVertical
            size={15}
            className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors shrink-0 cursor-grab active:cursor-grabbing"
          />
          <PlateBadge plate={order.plate} size="sm" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            {order.workOrderNumber}
          </span>

          {/* Up & Down Reorder Micro Buttons */}
          {(onMoveUp || onMoveDown) && (
            <div
              className="flex items-center bg-slate-100 dark:bg-slate-800/90 rounded-lg p-0.5 opacity-0 group-hover:opacity-100 transition-opacity gap-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                disabled={isFirst}
                onClick={(e) => {
                  e.stopPropagation()
                  onMoveUp?.()
                }}
                className={cn(
                  "w-5 h-5 rounded flex items-center justify-center transition-colors",
                  isFirst
                    ? "opacity-25 cursor-not-allowed text-slate-400"
                    : "hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-sky-500 cursor-pointer"
                )}
                title="Sırada Bir Üste Al"
              >
                <ChevronUp size={13} />
              </button>
              <button
                type="button"
                disabled={isLast}
                onClick={(e) => {
                  e.stopPropagation()
                  onMoveDown?.()
                }}
                className={cn(
                  "w-5 h-5 rounded flex items-center justify-center transition-colors",
                  isLast
                    ? "opacity-25 cursor-not-allowed text-slate-400"
                    : "hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-sky-500 cursor-pointer"
                )}
                title="Sırada Bir Alta Al"
              >
                <ChevronDown size={13} />
              </button>
            </div>
          )}

          <GripVertical
            size={14}
            className="text-slate-300 dark:text-slate-600 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors shrink-0"
          />
        </div>
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
        {(order.services || []).slice(0, 2).map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400"
          >
            <span className="truncate pr-2">• {s.name}</span>
            <span className="font-mono font-medium shrink-0">{s.laborPrice} ₺</span>
          </div>
        ))}
        {(order.services || []).length > 2 && (
          <p className="text-[10px] text-slate-400 font-medium italic">
            +{(order.services || []).length - 2} ek işlem daha...
          </p>
        )}
        {(!order.services || order.services.length === 0) && (
          <p className="text-[10px] text-slate-400 italic">Genel kontrol ve arıza tespiti</p>
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

          {order.status === "CANCELLED" && (
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <XCircle size={12} />
              <span>İptal Edildi</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
