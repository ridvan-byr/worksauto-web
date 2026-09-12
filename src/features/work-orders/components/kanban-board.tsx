"use client"

import * as React from "react"
import { Clock, CheckCircle2, Wrench } from "lucide-react"
import { WorkOrder, WorkOrderStatus } from "../types"
import { WorkOrderCard } from "./work-order-card"

interface KanbanBoardProps {
  orders: WorkOrder[]
  onStatusChange: (id: string, newStatus: WorkOrderStatus) => void
}

const PRIORITY_WEIGHT: Record<string, number> = {
  URGENT: 3,
  HIGH: 2,
  NORMAL: 1,
}

export function KanbanBoard({ orders, onStatusChange }: KanbanBoardProps) {
  const [dragOverColumn, setDragOverColumn] = React.useState<WorkOrderStatus | null>(null)

  const handleDropToColumn = (e: React.DragEvent, targetStatus: WorkOrderStatus) => {
    e.preventDefault()
    setDragOverColumn(null)
    const id = e.dataTransfer.getData("text/plain")
    if (id) {
      onStatusChange(id, targetStatus)
    }
  }

  // 1. PENDING / QUEUE: En acil olanlar en üstte, aynı aciliyette ilk gelen araç önce alınır (FIFO)
  const pendingOrders = React.useMemo(() => {
    return orders
      .filter((o) => o.status === "PENDING" || (o.status as string) === "QUEUE")
      .sort((a, b) => {
        const pDiff = (PRIORITY_WEIGHT[b.priority] || 1) - (PRIORITY_WEIGHT[a.priority] || 1)
        if (pDiff !== 0) return pDiff
        const timeA = new Date(a.createdAt || 0).getTime()
        const timeB = new Date(b.createdAt || 0).getTime()
        return timeA - timeB // Eskiden yeniye (İlk gelen ilk çıkar)
      })
  }, [orders])

  // 2. IN_PROGRESS: Lift sırasına göre düzenli gruplu, ardından aciliyet
  const inProgressOrders = React.useMemo(() => {
    return orders
      .filter((o) => o.status === "IN_PROGRESS")
      .sort((a, b) => {
        const liftA = a.assignedLift || ""
        const liftB = b.assignedLift || ""
        const liftComp = liftA.localeCompare(liftB, "tr", { numeric: true })
        if (liftComp !== 0) return liftComp
        return (PRIORITY_WEIGHT[b.priority] || 1) - (PRIORITY_WEIGHT[a.priority] || 1)
      })
  }, [orders])

  // 3. COMPLETED: En son biten / teslim aşamasına gelen en üstte (LIFO)
  const completedOrders = React.useMemo(() => {
    return orders
      .filter((o) => o.status === "COMPLETED")
      .sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime()
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime()
        return timeB - timeA // Yeniden eskiye
      })
  }, [orders])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {/* COLUMN 1: PENDING */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            e.dataTransfer.dropEffect = "move"
            if (dragOverColumn !== "PENDING") setDragOverColumn("PENDING")
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              if (dragOverColumn === "PENDING") setDragOverColumn(null)
            }
          }}
          onDrop={(e) => handleDropToColumn(e, "PENDING")}
          className={`rounded-3xl border p-4 sm:p-4.5 space-y-3.5 transition-all ${
            dragOverColumn === "PENDING"
              ? "bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/60 shadow-lg scale-[1.01]"
              : "bg-slate-100/70 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800/80"
          }`}
        >
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70 dark:border-slate-800/70">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                1. Sırada Bekleyenler
              </h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-2xs">
              {pendingOrders.length}
            </span>
          </div>

          {dragOverColumn === "PENDING" && (
            <div className="p-2.5 rounded-xl border border-dashed border-amber-400 bg-amber-500/20 text-center text-xs font-bold text-amber-800 dark:text-amber-200 animate-pulse">
              🎯 Bekleme Sırasına Almak İçin Buraya Bırakın
            </div>
          )}

          <div className="space-y-3.5 pt-2 min-h-[340px]">
            {pendingOrders.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
                <Clock size={20} className="mb-1 text-slate-300" />
                <span>Bekleyen araç bulunmuyor</span>
              </div>
            ) : (
              pendingOrders.map((order) => (
                <WorkOrderCard key={order.id} order={order} onStatusChange={onStatusChange} />
              ))
            )}
          </div>
        </div>

        {/* COLUMN 2: IN PROGRESS (ON LIFT) */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            e.dataTransfer.dropEffect = "move"
            if (dragOverColumn !== "IN_PROGRESS") setDragOverColumn("IN_PROGRESS")
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              if (dragOverColumn === "IN_PROGRESS") setDragOverColumn(null)
            }
          }}
          onDrop={(e) => handleDropToColumn(e, "IN_PROGRESS")}
          className={`rounded-3xl border p-4 sm:p-4.5 space-y-3.5 transition-all ${
            dragOverColumn === "IN_PROGRESS"
              ? "bg-sky-500/20 border-sky-400 ring-2 ring-sky-400/60 shadow-lg scale-[1.01]"
              : "bg-sky-500/[0.04] dark:bg-sky-500/[0.03] border-sky-500/20"
          }`}
        >
          <div className="flex items-center justify-between pb-2.5 border-b border-sky-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-sky-900 dark:text-sky-200">
                2. Liftte / İşlemde
              </h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 shadow-2xs">
              {inProgressOrders.length}
            </span>
          </div>

          {dragOverColumn === "IN_PROGRESS" && (
            <div className="p-2.5 rounded-xl border border-dashed border-sky-400 bg-sky-500/25 text-center text-xs font-bold text-sky-800 dark:text-sky-200 animate-pulse">
              🎯 Lifte / İşleme Almak İçin Buraya Bırakın
            </div>
          )}

          <div className="space-y-3.5 pt-2 min-h-[340px]">
            {inProgressOrders.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-sky-200 dark:border-sky-900/50 rounded-2xl text-slate-400 text-xs">
                <Wrench size={20} className="mb-1 text-sky-400/50" />
                <span>Şu an liftte olan araç yok</span>
              </div>
            ) : (
              inProgressOrders.map((order) => (
                <WorkOrderCard key={order.id} order={order} onStatusChange={onStatusChange} />
              ))
            )}
          </div>
        </div>

        {/* COLUMN 3: COMPLETED */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            e.dataTransfer.dropEffect = "move"
            if (dragOverColumn !== "COMPLETED") setDragOverColumn("COMPLETED")
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              if (dragOverColumn === "COMPLETED") setDragOverColumn(null)
            }
          }}
          onDrop={(e) => handleDropToColumn(e, "COMPLETED")}
          className={`rounded-3xl border p-4 sm:p-4.5 space-y-3.5 transition-all ${
            dragOverColumn === "COMPLETED"
              ? "bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-400/60 shadow-lg scale-[1.01]"
              : "bg-emerald-500/[0.04] dark:bg-emerald-500/[0.03] border-emerald-500/20"
          }`}
        >
          <div className="flex items-center justify-between pb-2.5 border-b border-emerald-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                3. Hazır / Teslim Bekleyen
              </h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-2xs">
              {completedOrders.length}
            </span>
          </div>

          {dragOverColumn === "COMPLETED" && (
            <div className="p-2.5 rounded-xl border border-dashed border-emerald-400 bg-emerald-500/25 text-center text-xs font-bold text-emerald-800 dark:text-emerald-200 animate-pulse">
              🎯 İşlemi Tamamlamak İçin Buraya Bırakın
            </div>
          )}

          <div className="space-y-3.5 pt-2 min-h-[340px]">
            {completedOrders.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-emerald-200 dark:border-emerald-900/50 rounded-2xl text-slate-400 text-xs">
                <CheckCircle2 size={20} className="mb-1 text-emerald-400/50" />
                <span>Teslime hazır araç yok</span>
              </div>
            ) : (
              completedOrders.map((order) => (
                <WorkOrderCard key={order.id} order={order} onStatusChange={onStatusChange} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
