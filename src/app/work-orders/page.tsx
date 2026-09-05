"use client"

import { useWorkOrders, useUpdateWorkOrderStatus } from "@/features/work-orders/api/use-work-orders"

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
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { WorkOrder, WorkOrderStatus } from "@/features/work-orders/types"
import { KanbanBoard } from "@/features/work-orders/components/kanban-board"
import { WorkOrderListView } from "@/features/work-orders/components/work-order-list-view"
import { CreateWorkOrderModal } from "@/features/work-orders/components/create-work-order-modal"
import { cn } from "@/lib/utils"

export default function WorkOrdersPage() {
  const [orders, setOrders] = React.useState<WorkOrder[]>([])
  const [viewMode, setViewMode] = React.useState<"kanban" | "list">("kanban")
  const [selectedStaffFilter, setSelectedStaffFilter] = React.useState<string>("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)

  const { data: apiOrders } = useWorkOrders()
  const updateStatusMutation = useUpdateWorkOrderStatus()

  // Live API sync with mock fallback
  React.useEffect(() => {
    if (apiOrders && apiOrders.length > 0) {
      const mapped: WorkOrder[] = apiOrders.map((w: any) => ({
        id: w.id,
        tenantId: w.tenantId || 'ten_1',
        workOrderNumber: w.workOrderNumber,
        customerId: w.customerId,
        customerName: w.customer ? `${w.customer.firstName} ${w.customer.lastName}` : 'Müşteri',
        customerPhone: w.customer?.phone || '',
        vehicleId: w.vehicleId,
        plate: w.vehicle?.plate || '34XX000',
        brand: w.vehicle?.brand || 'Araç',
        model: w.vehicle?.model || '',
        year: w.vehicle?.year || 2024,
        kilometer: w.vehicle?.mileage || 0,
        status: w.status === 'QUEUE' ? 'PENDING' : w.status,
        priority: 'NORMAL',
        assignedLift: w.assignedLift || 'Lift 1',
        assignedMechanicName: w.assignedMechanic?.user ? `${w.assignedMechanic.user.name} ${w.assignedMechanic.user.surname}` : 'Usta',
        services: (w.items || []).filter((i: any) => i.itemType === 'SERVICE').map((i: any) => ({
          id: i.id,
          name: i.name,
          durationMinutes: 60,
          laborPrice: Number(i.unitPrice),
          completed: true,
        })),
        parts: (w.items || []).filter((i: any) => i.itemType === 'PART').map((i: any) => ({
          id: i.id,
          name: i.name,
          partNumber: i.itemId || 'YEDEK-PARCA',
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          totalPrice: Number(i.totalPrice),
        })),
        notes: (w.notes || []).map((n: any) => ({
          id: n.id,
          authorName: n.authorName || 'Usta',
          authorRole: 'TECHNICIAN',
          note: n.note,
          createdAt: n.createdAt,
        })),
        photos: (w.photos || []).map((p: any) => ({
          id: p.id,
          url: p.url,
          caption: p.caption,
          uploadedBy: p.uploadedBy,
          createdAt: p.createdAt,
        })),
        laborTotal: Number(w.subtotal || 0),
        partsTotal: 0,
        taxRate: 0.20,
        grandTotal: Number(w.grandTotal || 0),
        estimatedCompletionTime: w.targetCompletionDate || '18:00',
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
      }))
      setOrders(mapped)
    }
  }, [apiOrders])

  const handleStatusChange = async (id: string, newStatus: WorkOrderStatus) => {
    const backendStatus = (newStatus as string) === 'PENDING' ? 'QUEUE' : newStatus;
    try {
      await updateStatusMutation.mutateAsync({ id, status: backendStatus })
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)))
    } catch (e) {
      console.error('API status update error:', e)
    }
  }

  const handleCreatedOrder = (newOrder: WorkOrder) => {
    setOrders((prev) => [newOrder, ...prev])
  }

  // Filter by staff & live search
  const displayedOrders = React.useMemo(() => {
    return orders.filter((o) => {
      if (selectedStaffFilter !== "all" && o.assignedMechanicName !== selectedStaffFilter) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      const cleanPlateQ = q.replace(/\s/g, "")
      const matchPlate = o.plate.toLowerCase().replace(/\s/g, "").includes(cleanPlateQ)
      const matchNumber = o.workOrderNumber.toLowerCase().includes(q)
      const matchCustomer = o.customerName.toLowerCase().includes(q)
      const cleanDigits = q.replace(/\D/g, "")
      const matchPhone = cleanDigits.length >= 3 && o.customerPhone.replace(/\D/g, "").includes(cleanDigits)
      return matchPlate || matchNumber || matchCustomer || matchPhone
    })
  }, [orders, selectedStaffFilter, searchQuery])

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

      {/* Control Bar: Live Search, Staff Filter & Kanban/List Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Live Search Bar */}
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Plaka, iş emri no veya müşteri ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            />
          </div>

          {/* Staff Filter */}
          <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
            <Filter size={14} />
            <span className="font-medium shrink-0">Usta:</span>
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