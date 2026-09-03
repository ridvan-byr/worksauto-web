"use client"

import * as React from "react"
import { Clock, Play, CheckCircle2, Wrench } from "lucide-react"
import { WorkOrder, WorkOrderStatus } from "../types"
import { WorkOrderCard } from "./work-order-card"

interface KanbanBoardProps {
  orders: WorkOrder[]
  onStatusChange: (id: string, newStatus: WorkOrderStatus) => void
}

export function KanbanBoard({ orders, onStatusChange }: KanbanBoardProps) {
  const pendingOrders = orders.filter((o) => o.status === "PENDING")
  const inProgressOrders = orders.filter((o) => o.status === "IN_PROGRESS")
  const completedOrders = orders.filter((o) => o.status === "COMPLETED")

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
      {/* COLUMN 1: PENDING */}
      <div className="rounded-3xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 p-4 space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-800/70">
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

        <div className="space-y-3 min-h-[320px]">
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
      <div className="rounded-3xl bg-sky-500/[0.04] dark:bg-sky-500/[0.03] border border-sky-500/20 p-4 space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-sky-500/20">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-900 dark:text-sky-200">
              2. Lifte / İşlemde
            </h3>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 shadow-2xs">
            {inProgressOrders.length}
          </span>
        </div>

        <div className="space-y-3 min-h-[320px]">
          {inProgressOrders.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-sky-200 dark:border-sky-900/50 rounded-2xl text-slate-400 text-xs">
              <Wrench size={20} className="mb-1 text-sky-400/50" />
              <span>Şu an lifte olan araç yok</span>
            </div>
          ) : (
            inProgressOrders.map((order) => (
              <WorkOrderCard key={order.id} order={order} onStatusChange={onStatusChange} />
            ))
          )}
        </div>
      </div>

      {/* COLUMN 3: COMPLETED */}
      <div className="rounded-3xl bg-emerald-500/[0.04] dark:bg-emerald-500/[0.03] border border-emerald-500/20 p-4 space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
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

        <div className="space-y-3 min-h-[320px]">
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
  )
}
