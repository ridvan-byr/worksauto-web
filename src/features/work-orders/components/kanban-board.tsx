"use client"

import * as React from "react"
import { Clock, CheckCircle2, Wrench } from "lucide-react"
import { WorkOrder, WorkOrderStatus } from "../types"
import { WorkOrderCard } from "./work-order-card"

interface KanbanBoardProps {
  orders: WorkOrder[]
  onStatusChange: (id: string, newStatus: WorkOrderStatus) => void
  onReorderOrders?: (newOrders: WorkOrder[]) => void
}

const PRIORITY_WEIGHT: Record<string, number> = {
  URGENT: 3,
  HIGH: 2,
  NORMAL: 1,
}

const STORAGE_KEY = "worksauto_work_orders_sequence"

export function KanbanBoard({ orders, onStatusChange, onReorderOrders: _onReorderOrders }: KanbanBoardProps) {
  const [dragOverColumn, setDragOverColumn] = React.useState<WorkOrderStatus | null>(null)

  // Live Drag State (tracks active dragged order, its origin status and slot index)
  const [activeDraggedId, setActiveDraggedId] = React.useState<string | null>(null)
  const [activeDraggedStatus, setActiveDraggedStatus] = React.useState<WorkOrderStatus | null>(null)
  const activeDraggedIdRef = React.useRef<string | null>(null)
  const activeDraggedStatusRef = React.useRef<WorkOrderStatus | null>(null)
  const activeDraggedIdxRef = React.useRef<number | null>(null)

  // Custom Sequence of Order IDs (persisted in localStorage)
  const [customOrderIds, setCustomOrderIds] = React.useState<string[]>(() => {
    if (typeof window === "undefined") return []
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Sync new orders into customOrderIds if not already present
  React.useEffect(() => {
    if (!orders || orders.length === 0) return
    setCustomOrderIds((prev) => {
      let changed = false
      const updated = [...prev]
      orders.forEach((o) => {
        if (!updated.includes(o.id)) {
          updated.push(o.id)
          changed = true
        }
      })
      if (changed) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        } catch {
          // ignore
        }
        return updated
      }
      return prev
    })
  }, [orders])

  // Helper to check if the current drag event is actually a Work Order
  const isWorkOrderDrag = (e: React.DragEvent) => {
    return (
      e.dataTransfer.types.includes("application/work-order-id") ||
      Boolean(activeDraggedIdRef.current)
    )
  }

  const handleCardDragStart = (id: string, status: WorkOrderStatus, idx: number) => {
    activeDraggedIdRef.current = id
    activeDraggedStatusRef.current = status
    activeDraggedIdxRef.current = idx
    setActiveDraggedId(id)
    setActiveDraggedStatus(status)
  }

  const handleCardDragEnd = () => {
    activeDraggedIdRef.current = null
    activeDraggedStatusRef.current = null
    activeDraggedIdxRef.current = null
    setActiveDraggedId(null)
    setActiveDraggedStatus(null)
    setDragOverColumn(null)
  }

  // Generic Reorder Function
  const reorderTwoOrders = React.useCallback(
    (draggedId: string, targetId: string, position: "before" | "after") => {
      setCustomOrderIds((prev) => {
        const master = [...prev]
        orders.forEach((o) => {
          if (!master.includes(o.id)) master.push(o.id)
        })

        const filtered = master.filter((id) => id !== draggedId)
        const targetIndex = filtered.indexOf(targetId)
        if (targetIndex === -1) return prev

        const insertIndex = position === "before" ? targetIndex : targetIndex + 1
        filtered.splice(insertIndex, 0, draggedId)

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
        } catch {
          // ignore
        }

        return filtered
      })
    },
    [orders]
  )

  // Move up/down within a specific column (buttons)
  const handleMoveWithinColumn = (
    orderId: string,
    direction: "up" | "down",
    columnOrders: WorkOrder[]
  ) => {
    const currentIndex = columnOrders.findIndex((o) => o.id === orderId)
    if (currentIndex === -1) return
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= columnOrders.length) return

    const targetOrder = columnOrders[targetIndex]
    reorderTwoOrders(orderId, targetOrder.id, direction === "up" ? "before" : "after")
  }

  // Handle Drop on Card (Card-to-Card Reordering)
  const handleCardDrop = (
    draggedId: string,
    targetId: string,
    position: "before" | "after"
  ) => {
    const draggedOrder = orders.find((o) => o.id === draggedId)
    const targetOrder = orders.find((o) => o.id === targetId)
    if (!draggedOrder || !targetOrder) return

    // If dragged from another column, change status first
    if (draggedOrder.status !== targetOrder.status) {
      onStatusChange(draggedId, targetOrder.status)
    }

    reorderTwoOrders(draggedId, targetId, position)
    handleCardDragEnd()
  }

  // Handle Drop on Empty Column Area
  const handleDropToColumn = (e: React.DragEvent, targetStatus: WorkOrderStatus) => {
    e.preventDefault()
    setDragOverColumn(null)
    const id =
      e.dataTransfer.getData("application/work-order-id") || activeDraggedIdRef.current
    if (id) {
      const draggedOrder = orders.find((o) => o.id === id)
      if (draggedOrder && draggedOrder.status !== targetStatus) {
        onStatusChange(id, targetStatus)
      }
    }
    handleCardDragEnd()
  }

  // Helper sorter respecting customOrderIds
  const sortByCustomOrder = React.useCallback(
    (list: WorkOrder[], defaultSort: (a: WorkOrder, b: WorkOrder) => number) => {
      return [...list].sort((a, b) => {
        const indexA = customOrderIds.indexOf(a.id)
        const indexB = customOrderIds.indexOf(b.id)

        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB
        }
        if (indexA !== -1) return -1
        if (indexB !== -1) return 1
        return defaultSort(a, b)
      })
    },
    [customOrderIds]
  )

  // 1. PENDING / QUEUE: Custom order, fallback to priority + FIFO
  const pendingOrders = React.useMemo(() => {
    const raw = orders.filter((o) => o.status === "PENDING" || (o.status as string) === "QUEUE")
    return sortByCustomOrder(raw, (a, b) => {
      const pDiff = (PRIORITY_WEIGHT[b.priority] || 1) - (PRIORITY_WEIGHT[a.priority] || 1)
      if (pDiff !== 0) return pDiff
      const timeA = new Date(a.createdAt || 0).getTime()
      const timeB = new Date(b.createdAt || 0).getTime()
      return timeA - timeB
    })
  }, [orders, sortByCustomOrder])

  // 2. IN_PROGRESS: Custom order, fallback to lift + priority
  const inProgressOrders = React.useMemo(() => {
    const raw = orders.filter((o) => o.status === "IN_PROGRESS")
    return sortByCustomOrder(raw, (a, b) => {
      const liftA = a.assignedLift || ""
      const liftB = b.assignedLift || ""
      const liftComp = liftA.localeCompare(liftB, "tr", { numeric: true })
      if (liftComp !== 0) return liftComp
      return (PRIORITY_WEIGHT[b.priority] || 1) - (PRIORITY_WEIGHT[a.priority] || 1)
    })
  }, [orders, sortByCustomOrder])

  // 3. COMPLETED: Custom order, fallback to LIFO
  const completedOrders = React.useMemo(() => {
    const raw = orders.filter((o) => o.status === "COMPLETED")
    return sortByCustomOrder(raw, (a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime()
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime()
      return timeB - timeA
    })
  }, [orders, sortByCustomOrder])

  // Column references kept current for zero-latency live drag updates
  const pendingOrdersRef = React.useRef(pendingOrders)
  const inProgressOrdersRef = React.useRef(inProgressOrders)
  const completedOrdersRef = React.useRef(completedOrders)

  React.useEffect(() => {
    pendingOrdersRef.current = pendingOrders
    inProgressOrdersRef.current = inProgressOrders
    completedOrdersRef.current = completedOrders
  }, [pendingOrders, inProgressOrders, completedOrders])

  // Live Reorder while dragging over slots within the SAME column
  const handleLiveSlotReorder = React.useCallback(
    (columnStatus: WorkOrderStatus, targetIdx: number) => {
      const currentStatus = activeDraggedStatusRef.current
      const currentIdx = activeDraggedIdxRef.current
      const draggedId = activeDraggedIdRef.current

      if (
        !draggedId ||
        currentIdx === null ||
        currentStatus !== columnStatus ||
        currentIdx === targetIdx
      ) {
        return
      }

      const columnOrders =
        columnStatus === "PENDING"
          ? pendingOrdersRef.current
          : columnStatus === "IN_PROGRESS"
          ? inProgressOrdersRef.current
          : completedOrdersRef.current

      if (targetIdx < 0 || targetIdx >= columnOrders.length) return
      const targetOrder = columnOrders[targetIdx]
      if (!targetOrder || targetOrder.id === draggedId) return

      setCustomOrderIds((prev) => {
        const master = [...prev]
        orders.forEach((o) => {
          if (!master.includes(o.id)) master.push(o.id)
        })

        const fromPos = master.indexOf(draggedId)
        if (fromPos === -1) return prev
        master.splice(fromPos, 1)

        const toPos = master.indexOf(targetOrder.id)
        if (toPos === -1) return prev

        const insertPos = currentIdx < targetIdx ? toPos + 1 : toPos
        master.splice(insertPos, 0, draggedId)

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(master))
        } catch {
          // ignore
        }
        return master
      })

      activeDraggedIdxRef.current = targetIdx
    },
    [orders]
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {/* COLUMN 1: PENDING */}
        <div
          onDragOver={(e) => {
            if (!isWorkOrderDrag(e)) {
              e.dataTransfer.dropEffect = "none"
              return
            }
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
              Bekleme Sırasına Almak İçin Buraya Bırakın
            </div>
          )}

          <div className="space-y-3.5 pt-2 min-h-[340px]">
            {pendingOrders.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
                <Clock size={20} className="mb-1 text-slate-300" />
                <span>Bekleyen araç bulunmuyor</span>
              </div>
            ) : (
              pendingOrders.map((order, idx) => (
                <WorkOrderCard
                  key={order.id}
                  order={order}
                  index={idx}
                  columnStatus="PENDING"
                  activeDraggedId={activeDraggedId}
                  activeDraggedStatus={activeDraggedStatus}
                  onStatusChange={onStatusChange}
                  isFirst={idx === 0}
                  isLast={idx === pendingOrders.length - 1}
                  onMoveUp={() => handleMoveWithinColumn(order.id, "up", pendingOrders)}
                  onMoveDown={() => handleMoveWithinColumn(order.id, "down", pendingOrders)}
                  onDragStartCard={handleCardDragStart}
                  onDragEndCard={handleCardDragEnd}
                  onCardDragOverSlot={handleLiveSlotReorder}
                  onCardDrop={handleCardDrop}
                />
              ))
            )}
          </div>
        </div>

        {/* COLUMN 2: IN PROGRESS (ON LIFT) */}
        <div
          onDragOver={(e) => {
            if (!isWorkOrderDrag(e)) {
              e.dataTransfer.dropEffect = "none"
              return
            }
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
              Lifte / İşleme Almak İçin Buraya Bırakın
            </div>
          )}

          <div className="space-y-3.5 pt-2 min-h-[340px]">
            {inProgressOrders.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-sky-200 dark:border-sky-900/50 rounded-2xl text-slate-400 text-xs">
                <Wrench size={20} className="mb-1 text-sky-400/50" />
                <span>Şu an liftte olan araç yok</span>
              </div>
            ) : (
              inProgressOrders.map((order, idx) => (
                <WorkOrderCard
                  key={order.id}
                  order={order}
                  index={idx}
                  columnStatus="IN_PROGRESS"
                  activeDraggedId={activeDraggedId}
                  activeDraggedStatus={activeDraggedStatus}
                  onStatusChange={onStatusChange}
                  isFirst={idx === 0}
                  isLast={idx === inProgressOrders.length - 1}
                  onMoveUp={() => handleMoveWithinColumn(order.id, "up", inProgressOrders)}
                  onMoveDown={() => handleMoveWithinColumn(order.id, "down", inProgressOrders)}
                  onDragStartCard={handleCardDragStart}
                  onDragEndCard={handleCardDragEnd}
                  onCardDragOverSlot={handleLiveSlotReorder}
                  onCardDrop={handleCardDrop}
                />
              ))
            )}
          </div>
        </div>

        {/* COLUMN 3: COMPLETED */}
        <div
          onDragOver={(e) => {
            if (!isWorkOrderDrag(e)) {
              e.dataTransfer.dropEffect = "none"
              return
            }
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
              İşlemi Tamamlamak İçin Buraya Bırakın
            </div>
          )}

          <div className="space-y-3.5 pt-2 min-h-[340px]">
            {completedOrders.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-emerald-200 dark:border-emerald-900/50 rounded-2xl text-slate-400 text-xs">
                <CheckCircle2 size={20} className="mb-1 text-emerald-400/50" />
                <span>Teslime hazır araç yok</span>
              </div>
            ) : (
              completedOrders.map((order, idx) => (
                <WorkOrderCard
                  key={order.id}
                  order={order}
                  index={idx}
                  columnStatus="COMPLETED"
                  activeDraggedId={activeDraggedId}
                  activeDraggedStatus={activeDraggedStatus}
                  onStatusChange={onStatusChange}
                  isFirst={idx === 0}
                  isLast={idx === completedOrders.length - 1}
                  onMoveUp={() => handleMoveWithinColumn(order.id, "up", completedOrders)}
                  onMoveDown={() => handleMoveWithinColumn(order.id, "down", completedOrders)}
                  onDragStartCard={handleCardDragStart}
                  onDragEndCard={handleCardDragEnd}
                  onCardDragOverSlot={handleLiveSlotReorder}
                  onCardDrop={handleCardDrop}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
