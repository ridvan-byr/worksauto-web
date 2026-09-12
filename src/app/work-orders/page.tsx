"use client"

import { useWorkOrders, useUpdateWorkOrderStatus, useRollbackWorkOrder } from "@/features/work-orders/api/use-work-orders"
import { useStaff } from "@/features/settings/api/use-settings"

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
  Search,
  XCircle,
  Archive,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { WorkOrder, WorkOrderStatus, WorkOrderPriority, WorkOrderNote, WorkOrderPhoto } from "@/features/work-orders/types"
import { KanbanBoard } from "@/features/work-orders/components/kanban-board"
import { WorkOrderListView } from "@/features/work-orders/components/work-order-list-view"
import { CreateWorkOrderModal, type CreateWorkOrderModalValues } from "@/features/work-orders/components/create-work-order-modal"
import { CancelledWorkOrdersModal } from "@/features/work-orders/components/cancelled-work-orders-modal"
import { cn } from "@/lib/utils"

interface ApiWorkOrderInput {
  id?: string
  tenantId?: string
  workOrderNumber?: string
  customerId?: string
  customer?: { firstName?: string; lastName?: string; name?: string; surname?: string; phone?: string }
  customerName?: string
  customerPhone?: string
  vehicleId?: string
  vehicle?: { plate?: string; brand?: string; model?: string; year?: number; currentKm?: number; mileage?: number }
  plate?: string
  brand?: string
  model?: string
  year?: number
  kilometer?: number
  initialKm?: number
  status?: string
  priority?: WorkOrderPriority
  assignedLift?: string
  assignedMechanicId?: string
  assignedMechanicName?: string
  assignedMechanic?: { user?: { name?: string; surname?: string } }
  estimatedCompletionDate?: string
  estimatedCompletionTime?: string
  completedAt?: string
  createdAt?: string
  updatedAt?: string
  totalLaborPrice?: number
  totalPartsPrice?: number
  laborTotal?: number
  partsTotal?: number
  grandTotal?: number
  items?: Array<Record<string, unknown>>
  notes?: WorkOrderNote[]
  photos?: WorkOrderPhoto[]
}

function mapApiWorkOrderToWorkOrder(input: unknown): WorkOrder {
  const w = (input || {}) as ApiWorkOrderInput
  const items = (w.items || []) as Array<Record<string, unknown>>
  const mechanicFullName = w.assignedMechanic?.user?.name
    ? `${w.assignedMechanic.user.name} ${w.assignedMechanic.user.surname || ""}`.trim()
    : (w.assignedMechanicName || 'Atanmamış')

  return {
    id: w.id || '',
    tenantId: w.tenantId || '',
    workOrderNumber: w.workOrderNumber || `WO-${w.id?.slice(0, 8) || ''}`,
    customerId: w.customerId || '',
    customerName: w.customer
      ? `${w.customer.firstName || w.customer.name || ""} ${w.customer.lastName || w.customer.surname || ""}`.trim()
      : (w.customerName || 'Müşteri'),
    customerPhone: w.customer?.phone || w.customerPhone || '',
    vehicleId: w.vehicleId || '',
    plate: w.vehicle?.plate || w.plate || '',
    brand: w.vehicle?.brand || w.brand || '',
    model: w.vehicle?.model || w.model || '',
    year: w.vehicle?.year || w.year || new Date().getFullYear(),
    kilometer: w.vehicle?.currentKm ?? w.vehicle?.mileage ?? w.kilometer ?? w.initialKm ?? 0,
    status: (w.status === 'QUEUE' ? 'PENDING' : (w.status || 'PENDING')) as WorkOrderStatus,
    priority: w.priority || 'NORMAL',
    assignedLift: w.assignedLift || 'Lift Belirtilmemiş',
    assignedMechanicId: w.assignedMechanicId,
    assignedMechanicName: mechanicFullName,
    estimatedCompletionTime: w.estimatedCompletionDate || w.estimatedCompletionTime || '18:00',
    completedAt: w.completedAt,
    createdAt: w.createdAt || new Date().toISOString(),
    updatedAt: w.updatedAt || new Date().toISOString(),
    laborTotal: Number(w.laborTotal ?? w.totalLaborPrice ?? 0),
    partsTotal: Number(w.partsTotal ?? w.totalPartsPrice ?? 0),
    taxRate: 0.20,
    grandTotal: Number(w.grandTotal ?? ((Number(w.laborTotal ?? w.totalLaborPrice ?? 0) + Number(w.partsTotal ?? w.totalPartsPrice ?? 0)) * 1.2)),
    services: items
      .filter((i) => i.itemType === 'SERVICE' || !i.itemType)
      .map((i) => ({
        id: String(i.id || Math.random()),
        name: String(i.name || i.description || 'Hizmet'),
        durationMinutes: Number(i.quantity || 1) * 30,
        laborPrice: Number(i.unitPrice || 0),
        completed: true,
      })),
    parts: items
      .filter((i) => i.itemType === 'PART')
      .map((i) => ({
        id: String(i.id || Math.random()),
        name: String(i.name || i.description || 'Yedek Parça'),
        partNumber: String(i.itemId || i.partNumber || ''),
        quantity: Number(i.quantity || 1),
        unitPrice: Number(i.unitPrice || 0),
        totalPrice: Number(i.totalPrice || (Number(i.quantity || 1) * Number(i.unitPrice || 0))),
      })),
    notes: (w.notes || []).map((n: WorkOrderNote) => ({
      id: n.id,
      authorName: n.authorName || 'Yetkili',
      text: n.text || '',
      createdAt: n.createdAt,
      isInternal: n.isInternal ?? false,
    })),
    photos: (w.photos || []).map((p: WorkOrderPhoto) => ({
      id: p.id,
      url: p.url,
      caption: p.caption || '',
      uploaderName: p.uploaderName || 'Personel',
      uploadedAt: p.uploadedAt || new Date().toISOString(),
      type: (p.type || 'CHECKIN') as 'CHECKIN' | 'DAMAGE' | 'COMPLETED',
    })),
  }
}

export default function WorkOrdersPage() {
  const [orders, setOrders] = React.useState<WorkOrder[]>([])
  const [viewMode, setViewMode] = React.useState<"kanban" | "list">("kanban")
  const [selectedStaffFilter, setSelectedStaffFilter] = React.useState<string>("all")
  const [timeframeFilter, setTimeframeFilter] = React.useState<"active_48h" | "today" | "week" | "all">("active_48h")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [cloneInitialData, setCloneInitialData] = React.useState<Partial<CreateWorkOrderModalValues> | null>(null)
  const [isCancelledModalOpen, setIsCancelledModalOpen] = React.useState(false)
  const [listInitialFilter, setListInitialFilter] = React.useState<string>("all")

  const { data: apiOrders } = useWorkOrders()
  const { data: staffMembers = [] } = useStaff()
  const updateStatusMutation = useUpdateWorkOrderStatus()
  const rollbackMutation = useRollbackWorkOrder()

  // Live API sync
  React.useEffect(() => {
    if (apiOrders) {
      const mapped = apiOrders.map(mapApiWorkOrderToWorkOrder)
      setOrders(mapped)
    }
  }, [apiOrders])

  const handleStatusChange = async (id: string, newStatus: WorkOrderStatus) => {
    const targetOrder = orders.find((o) => o.id === id)

    // COMPLETED -> IN_PROGRESS transition requires rollback endpoint in domain
    if (targetOrder?.status === "COMPLETED" && newStatus === "IN_PROGRESS") {
      try {
        await rollbackMutation.mutateAsync(id)
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "IN_PROGRESS" } : o)))
      } catch (e) {
        console.error("Rollback hatası:", e)
      }
      return
    }

    const backendStatus = (newStatus as string) === "PENDING" ? "QUEUE" : newStatus
    try {
      await updateStatusMutation.mutateAsync({ id, status: backendStatus })
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)))
    } catch (e) {
      console.error("API status update error:", e)
    }
  }

  const handleCreatedOrder = (newOrder: WorkOrder) => {
    const mapped = mapApiWorkOrderToWorkOrder(newOrder)
    setOrders((prev) => [mapped, ...prev.filter((o) => o.id !== mapped.id)])
    setCloneInitialData(null)
  }

  const handleCloneCancelledOrder = (order: WorkOrder) => {
    setCloneInitialData({
      customerId: order.customerId,
      vehicleId: order.vehicleId,
      assignedLift: order.assignedLift || "",
      assignedMechanic: typeof order.assignedMechanic === "string"
        ? order.assignedMechanic
        : (order.assignedMechanic as { id?: string } | undefined)?.id || "",
      priority: order.priority || "NORMAL",
      serviceName: "Hızlı Arıza Tespiti & Genel Kontrol",
      laborPrice: 750,
      initialNote: `İptal edilen #${order.workOrderNumber} numaralı iş emrinden kopyalanarak başlatıldı.`,
    })
    setIsCreateModalOpen(true)
  }

  // Dynamic distinct technician list for filtering (excludes administrative roles without mechanic profile)
  const staffFilterOptions = React.useMemo(() => {
    const nameSet = new Set<string>()
    staffMembers
      .filter((s) => {
        if (s.isActive === false) return false
        if (s.role === "OWNER" || s.role === "CASHIER" || s.role === "SUPER_ADMIN") {
          return !!s.mechanic
        }
        return s.role === "TECHNICIAN" || !!s.mechanic
      })
      .forEach((s) => {
        if (s.name) {
          const full = `${s.name} ${s.surname || ""}`.trim()
          nameSet.add(full)
        }
      })
    orders.forEach((o) => {
      if (
        o.assignedMechanicName &&
        o.assignedMechanicName !== "Usta" &&
        o.assignedMechanicName !== "Atanmamış" &&
        !o.assignedMechanicName.toLowerCase().includes("owner")
      ) {
        nameSet.add(o.assignedMechanicName)
      }
    })
    return Array.from(nameSet)
  }, [staffMembers, orders])

  // Filter by staff, timeframe retention & live search
  const displayedOrders = React.useMemo(() => {
    const now = Date.now()
    const isSearching = Boolean(searchQuery.trim())

    return orders.filter((o) => {
      // 1. Staff Filter
      if (selectedStaffFilter === "unassigned") {
        if (o.assignedMechanicName && o.assignedMechanicName !== "Usta" && o.assignedMechanicName !== "Atanmamış") {
          return false
        }
      } else if (selectedStaffFilter !== "all" && o.assignedMechanicName !== selectedStaffFilter) {
        return false
      }

      // 2. Search query matches (if searching, search across all timeframes)
      if (isSearching) {
        const q = searchQuery.toLowerCase().trim()
        const cleanPlateQ = q.replace(/\s/g, "")
        const matchPlate = o.plate.toLowerCase().replace(/\s/g, "").includes(cleanPlateQ)
        const matchNumber = o.workOrderNumber.toLowerCase().includes(q)
        const matchCustomer = o.customerName.toLowerCase().includes(q)
        const cleanDigits = q.replace(/\D/g, "")
        const matchPhone = cleanDigits.length >= 3 && o.customerPhone.replace(/\D/g, "").includes(cleanDigits)
        return matchPlate || matchNumber || matchCustomer || matchPhone
      }

      // 3. Timeframe / Lifecycle Retention Filter (Only applies when NOT actively searching)
      // Active queue / in-progress orders always stay on board regardless of age
      if (o.status === "PENDING" || o.status === "IN_PROGRESS") {
        return true
      }

      const orderTime = new Date(o.completedAt || o.updatedAt || o.createdAt).getTime()
      const diffHours = (now - orderTime) / (1000 * 60 * 60)

      if (timeframeFilter === "active_48h") {
        if (o.status === "COMPLETED") return diffHours <= 48
        if (o.status === "CANCELLED") return diffHours <= 24
        return true
      } else if (timeframeFilter === "today") {
        return new Date(orderTime).toDateString() === new Date().toDateString()
      } else if (timeframeFilter === "week") {
        return diffHours <= 24 * 7
      }

      // "all" - Show all archived records
      return true
    })
  }, [orders, selectedStaffFilter, searchQuery, timeframeFilter])

  // KPIs
  const inProgressCount = orders.filter((o) => o.status === "IN_PROGRESS").length
  const pendingCount = orders.filter((o) => o.status === "PENDING").length
  const completedCount = displayedOrders.filter((o) => o.status === "COMPLETED").length
  const cancelledOrdersList = React.useMemo(() => {
    const isSearching = Boolean(searchQuery.trim())
    const now = Date.now()
    return orders.filter((o) => {
      if (o.status !== "CANCELLED") return false
      if (isSearching || timeframeFilter === "all") return true
      const orderTime = new Date(o.updatedAt || o.createdAt).getTime()
      const diffHours = (now - orderTime) / (1000 * 60 * 60)
      if (timeframeFilter === "today") return new Date(orderTime).toDateString() === new Date().toDateString()
      if (timeframeFilter === "week") return diffHours <= 24 * 7
      // default: active_48h -> keep last 24h
      return diffHours <= 24
    })
  }, [orders, searchQuery, timeframeFilter])
  const cancelledCount = cancelledOrdersList.length
  const totalWOCount = displayedOrders.length

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
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Liftte / İşlemde</p>
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
              <option value="all">Tüm Personel / Ustalar</option>
              <option value="unassigned">Atanmamış Araçlar</option>
              {staffFilterOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe & Archival Retention Filter */}
          <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
            <Archive size={14} />
            <span className="font-medium shrink-0">Görünüm:</span>
            <select
              value={timeframeFilter}
              onChange={(e) => setTimeframeFilter(e.target.value as "active_48h" | "today" | "week" | "all")}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              title="Atölye aktif panosu tamamlanan işleri 48 saat, iptalleri 24 saat gösterir"
            >
              <option value="active_48h">Aktif Atölye (Son 48s)</option>
              <option value="today">Sadece Bugün</option>
              <option value="week">Bu Hafta (Son 7 Gün)</option>
              <option value="all">Tüm Arşiv (Geçmiş Dahil)</option>
            </select>
          </div>
        </div>

        {/* Action Controls: Cancelled Orders Button & View Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {cancelledCount > 0 && (
            <button
              type="button"
              onClick={() => setIsCancelledModalOpen(true)}
              className="h-9 px-3 rounded-xl border border-rose-200/90 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-2xs"
              title="İptal edilen iş emirlerini görüntüle"
            >
              <XCircle size={14} />
              <span>İptal Edilenler ({cancelledCount})</span>
            </button>
          )}

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
              onClick={() => {
                setListInitialFilter("all")
                setViewMode("list")
              }}
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
      </div>

      {/* Main View */}
      {viewMode === "kanban" ? (
        <KanbanBoard orders={displayedOrders} onStatusChange={handleStatusChange} />
      ) : (
        <WorkOrderListView orders={displayedOrders} initialStatusFilter={listInitialFilter} />
      )}

      {/* Cancelled Work Orders Modal */}
      <CancelledWorkOrdersModal
        isOpen={isCancelledModalOpen}
        onClose={() => setIsCancelledModalOpen(false)}
        orders={cancelledOrdersList}
        onCloneAsNew={handleCloneCancelledOrder}
        onSwitchToList={() => {
          setIsCancelledModalOpen(false)
          setListInitialFilter("CANCELLED")
          setViewMode("list")
        }}
      />

      {/* Create Modal */}
      <CreateWorkOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setCloneInitialData(null)
        }}
        onCreated={handleCreatedOrder}
        initialData={cloneInitialData}
      />
    </div>
  )
}