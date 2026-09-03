"use client"

import * as React from "react"
import {
  Wrench,
  LayoutGrid,
  List,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  Filter,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { WorkOrder, WorkOrderStatus } from "@/features/work-orders/types"
import {
  getStoredWorkOrders,
  saveStoredWorkOrders,
  updateWorkOrderStatus,
} from "@/features/work-orders/mock-data"
import { KanbanBoard } from "@/features/work-orders/components/kanban-board"
import { WorkOrderListView } from "@/features/work-orders/components/work-order-list-view"
import { CreateWorkOrderModal } from "@/features/work-orders/components/create-work-order-modal"
import { cn } from "@/lib/utils"

export default function WorkOrdersPage() {
  const [orders, setOrders] = React.useState<WorkOrder[]>([])
  const [viewMode, setViewMode] = React.useState<"kanban" | "list">("kanban")
  const [selectedStaffFilter, setSelectedStaffFilter] = React.useState<string>("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)

  React.useEffect(() => {
    setOrders(getStoredWorkOrders())
  }, [])

  const handleStatusChange = (id: string, newStatus: WorkOrderStatus) => {
    updateWorkOrderStatus(id, newStatus)
    setOrders(getStoredWorkOrders())
  }

  const handleCreatedOrder = (newOrder: WorkOrder) => {
    const next = [newOrder, ...orders]
    setOrders(next)
    saveStoredWorkOrders(next)
  }

  // Filter by staff
  const displayedOrders = React.useMemo(() => {
    if (selectedStaffFilter === "all") return orders
    return orders.filter((o) => o.assignedMechanicName === selectedStaffFilter)
  }, [orders, selectedStaffFilter])

  // KPIs
  const inProgressCount = orders.filter((o) => o.status === "IN_PROGRESS").length
  const pendingCount = orders.filter((o) => o.status === "PENDING").length
  const completedCount = orders.filter((o) => o.status === "COMPLETED").length
  const totalWOCount = orders.length

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              İş Emirleri & Atölye Paneli
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              Canlı Atölye
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Liftlerdeki aktif araçlar, teknisyen atamaları, parça kullanımı ve iş emri akışı.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="h-11 px-5 rounded-2xl gap-2 font-semibold text-xs shadow-lg shadow-sky-500/20 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Hızlı Araç Kabulü (İş Emri Aç)</span>
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Lifte / İşlemde</p>
            <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{inProgressCount} Araç</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Wrench size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Sırada Bekleyen</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingCount} Araç</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Teslime Hazır / Biten</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{completedCount} Araç</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Toplam İş Emri</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalWOCount}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Play size={18} fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Control Bar: Staff Filter & Kanban/List Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        {/* Staff Filter */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Filter size={14} />
          <span className="font-medium">Usta Filtresi:</span>
          <select
            value={selectedStaffFilter}
            onChange={(e) => setSelectedStaffFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            <option value="all">Tüm Ustalar</option>
            <option value="Ahmet Usta">Ahmet Usta (Mekanik)</option>
            <option value="Mustafa Usta">Mustafa Usta (Elektrik & Diagnostik)</option>
            <option value="Ali Usta">Ali Usta (Ön Takım)</option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setViewMode("kanban")}
            className={cn(
              "py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
              viewMode === "kanban"
                ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            )}
          >
            <LayoutGrid size={13} />
            <span>Atölye Panosu (Kanban)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={cn(
              "py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
              viewMode === "list"
                ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            )}
          >
            <List size={13} />
            <span>Liste Tablosu</span>
          </button>
        </div>
      </div>

      {/* Main View */}
      {viewMode === "kanban" ? (
        <KanbanBoard orders={displayedOrders} onStatusChange={handleStatusChange} />
      ) : (
        <WorkOrderListView orders={displayedOrders} />
      )}

      {/* Create Modal */}
      <CreateWorkOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleCreatedOrder}
      />
    </div>
  )
}
