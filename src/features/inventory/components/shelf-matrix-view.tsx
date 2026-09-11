"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  Layers,
  Plus,
  Trash2,
  AlertTriangle,
  Boxes,
  Grid3X3,
  MapPin,
  Search,
  CheckCircle2,
  X,
  ArrowRight,
  Sparkles,
  Info,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Inbox,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Product } from "@/features/inventory/types"
import {
  useShelves,
  useShelfMatrix,
  useCreateShelf,
  useDeleteShelf,
  useAssignProductCell,
  useBulkAssignProductCell,
  type ShelfSummaryRecord,
  type ShelfDetailRecord,
  type ShelfCellRecord,
  type ShelfProductSummary,
} from "@/features/inventory/api/use-inventory"

interface ShelfMatrixViewProps {
  products: Product[]
  onCreateProductForCell?: (
    cell: ShelfCellRecord,
    shelf?: ShelfDetailRecord | ShelfSummaryRecord | null
  ) => void
}

interface ConfirmModalState {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "warning" | "info"
  onConfirm: () => void | Promise<void>
}

function createCustomDragImage(
  e: React.DragEvent,
  title: string,
  subtitle?: string,
  badge?: string
) {
  try {
    const ghost = document.createElement("div")
    ghost.style.position = "fixed"
    ghost.style.top = "0px"
    ghost.style.left = "0px"
    ghost.style.transform = "translate(-9999px, -9999px)"
    ghost.style.padding = "10px 14px"
    ghost.style.borderRadius = "14px"
    ghost.style.background = "#0f172a"
    ghost.style.color = "#ffffff"
    ghost.style.border = "1.5px solid #38bdf8"
    ghost.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)"
    ghost.style.display = "flex"
    ghost.style.alignItems = "center"
    ghost.style.gap = "10px"
    ghost.style.zIndex = "-1000"
    ghost.style.pointerEvents = "none"
    ghost.style.fontFamily = "system-ui, -apple-system, sans-serif"
    ghost.style.maxWidth = "280px"
    ghost.style.minWidth = "180px"

    ghost.innerHTML = `
      <div style="width: 32px; height: 32px; border-radius: 9px; background: rgba(2, 132, 199, 0.25); color: #38bdf8; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">📦</div>
      <div style="min-width: 0; flex: 1;">
        <div style="font-size: 12px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #f8fafc;">${title}</div>
        ${subtitle ? `<div style="font-size: 10px; color: #94a3b8; font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${subtitle}</div>` : ""}
      </div>
      ${badge ? `<div style="font-size: 10px; font-weight: 700; background: #0284c7; color: #ffffff; padding: 3px 8px; border-radius: 8px; white-space: nowrap; flex-shrink: 0;">${badge}</div>` : ""}
    `
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 30, 20)
    setTimeout(() => {
      if (document.body.contains(ghost)) {
        document.body.removeChild(ghost)
      }
    }, 150)
  } catch {
    // Fallback
  }
}

function createCellDragImage(
  e: React.DragEvent,
  cell: ShelfCellRecord,
  cellProducts: ShelfProductSummary[],
  isMulti: boolean
) {
  try {
    const ghost = document.createElement("div")
    ghost.style.position = "fixed"
    ghost.style.top = "0px"
    ghost.style.left = "0px"
    ghost.style.transform = "translate(-9999px, -9999px)"
    ghost.style.width = "185px"
    ghost.style.height = "115px"
    ghost.style.padding = "12px"
    ghost.style.borderRadius = "16px"
    ghost.style.boxSizing = "border-box"
    ghost.style.fontFamily = "system-ui, -apple-system, sans-serif"
    ghost.style.zIndex = "-1000"
    ghost.style.pointerEvents = "none"
    ghost.style.display = "flex"
    ghost.style.flexDirection = "column"
    ghost.style.justifyContent = "space-between"
    ghost.style.overflow = "hidden"

    const totalStock = cellProducts.reduce((sum, p) => sum + p.stockQuantity, 0)
    const productCount = cellProducts.length

    if (isMulti) {
      // Purple / Indigo card - Birebir mor raf kutusu görünümü
      ghost.style.background = "#1e1b4b"
      ghost.style.color = "#ffffff"
      ghost.style.border = "1.5px solid #818cf8"
      ghost.style.boxShadow = "0 25px 50px -12px rgba(99, 102, 241, 0.4), 0 10px 20px -5px rgba(0, 0, 0, 0.5)"

      const itemsHtml = cellProducts.slice(0, 2).map(p => `
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; line-height: 1.2; gap: 4px;">
          <span style="font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #e0e7ff;">${p.name}</span>
          <span style="font-family: monospace; font-weight: 600; color: #a5b4fc; flex-shrink: 0;">${p.stockQuantity} ad.</span>
        </div>
      `).join("")

      ghost.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
          <span style="font-size: 10px; font-family: monospace; font-weight: bold; color: #c7d2fe;">K${cell.rowNumber}-G${cell.colNumber}</span>
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="padding: 2px 5px; border-radius: 6px; background: rgba(99, 102, 241, 0.25); color: #c7d2fe; font-family: monospace; font-size: 9px; font-weight: bold; border: 1px solid rgba(129, 140, 248, 0.4);">
              ${productCount} Çeşit
            </span>
            <span style="width: 8px; height: 8px; border-radius: 50%; background: #6366f1;"></span>
          </div>
        </div>

        <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; padding-top: 4px; overflow: hidden;">
          <div style="display: flex; flex-direction: column; gap: 2px; overflow: hidden;">
            ${itemsHtml}
            ${productCount > 2 ? `<div style="font-size: 9px; color: #818cf8; font-style: italic;">+${productCount - 2} parça daha...</div>` : ""}
          </div>
          <div style="padding-top: 4px; border-top: 1px solid rgba(129, 140, 248, 0.2); display: flex; align-items: center; justify-content: space-between; font-size: 9px; color: #94a3b8; font-family: monospace;">
            <span>Toplam:</span>
            <span style="font-weight: bold; color: #ffffff;">${totalStock} Adet</span>
          </div>
        </div>
      `
    } else {
      // Single product card - Birebir mavi/yeşil raf kutusu görünümü
      ghost.style.background = "#0f172a"
      ghost.style.color = "#ffffff"
      ghost.style.border = "1.5px solid #38bdf8"
      ghost.style.boxShadow = "0 25px 50px -12px rgba(14, 165, 233, 0.4), 0 10px 20px -5px rgba(0, 0, 0, 0.5)"

      const p = cellProducts[0]

      ghost.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
          <span style="font-size: 10px; font-family: monospace; font-weight: bold; color: #94a3b8;">K${cell.rowNumber}-G${cell.colNumber}</span>
          <span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></span>
        </div>

        <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; padding-top: 4px; overflow: hidden;">
          <div style="font-size: 12px; font-weight: bold; color: #ffffff; line-height: 1.25; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
            ${p?.name || ""}
          </div>
          <div style="padding-top: 4px; border-top: 1px solid rgba(56, 189, 248, 0.2); display: flex; align-items: center; justify-content: space-between; font-size: 10px;">
            <span style="font-family: monospace; color: #94a3b8; background: rgba(15, 23, 42, 0.8); padding: 2px 4px; border-radius: 4px; font-size: 9px;">
              ${p?.oemCode || "-"}
            </span>
            <span style="font-family: monospace; font-weight: bold; color: #38bdf8;">
              ${p?.stockQuantity || 0} Adet
            </span>
          </div>
        </div>
      `
    }

    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 90, 55)
    setTimeout(() => {
      if (document.body.contains(ghost)) {
        document.body.removeChild(ghost)
      }
    }, 150)
  } catch {
    // Fallback
  }
}

function createShelfPillDragImage(
  e: React.DragEvent,
  code: string,
  totalProducts: number,
  name?: string
) {
  try {
    const ghost = document.createElement("div")
    ghost.style.position = "fixed"
    ghost.style.top = "0px"
    ghost.style.left = "0px"
    ghost.style.transform = "translate(-9999px, -9999px)"
    ghost.style.padding = "6px 14px"
    ghost.style.borderRadius = "12px"
    ghost.style.background = "#0284c7"
    ghost.style.color = "#ffffff"
    ghost.style.border = "1.5px solid #38bdf8"
    ghost.style.boxShadow = "0 15px 30px -5px rgba(2, 132, 199, 0.5)"
    ghost.style.display = "flex"
    ghost.style.alignItems = "center"
    ghost.style.gap = "8px"
    ghost.style.zIndex = "-1000"
    ghost.style.pointerEvents = "none"
    ghost.style.fontFamily = "system-ui, -apple-system, sans-serif"
    ghost.style.fontWeight = "bold"
    ghost.style.fontSize = "12px"

    ghost.innerHTML = `
      <span>📦 Raf: ${code}</span>
      <span style="background: rgba(255,255,255,0.25); color: #ffffff; padding: 2px 6px; border-radius: 6px; font-size: 10px; font-family: monospace;">
        ${totalProducts} Parça
      </span>
      ${name ? `<span style="font-size: 10px; color: #bae6fd; font-weight: 500;">(${name})</span>` : ""}
    `
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 40, 15)
    setTimeout(() => {
      if (document.body.contains(ghost)) {
        document.body.removeChild(ghost)
      }
    }, 150)
  } catch {
    // Fallback
  }
}

export function ShelfMatrixView({ products, onCreateProductForCell }: ShelfMatrixViewProps) {
  const { data: shelves = [], isLoading: isShelvesLoading } = useShelves()
  const [selectedShelfId, setSelectedShelfId] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [viewMode, setViewMode] = React.useState<"DETAILED" | "COMPACT">("DETAILED")
  const [selectedFloor, setSelectedFloor] = React.useState<string>("ALL")

  const isDraggingRef = React.useRef(false)

  // Drag & Drop State
  const [draggedProductId, setDraggedProductId] = React.useState<string | null>(null)
  const [dragOverCellId, setDragOverCellId] = React.useState<string | null>(null)
  const [dragOverShelfId, setDragOverShelfId] = React.useState<string | null>(null)
  const [dragOverStaging, setDragOverStaging] = React.useState(false)
  const [draggedBulkInfo, setDraggedBulkInfo] = React.useState<{
    type: "PRODUCT" | "CELL_BULK" | "SHELF_BULK"
    title: string
    count: number
    cellId?: string
    shelfId?: string
  } | null>(null)
  const [stagingSearch, setStagingSearch] = React.useState("")
  const [isStagingOpen, setIsStagingOpen] = React.useState(true)

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [activeCellModal, setActiveCellModal] = React.useState<ShelfCellRecord | null>(null)
  const [confirmModal, setConfirmModal] = React.useState<ConfirmModalState>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  })

  const deleteShelfMutation = useDeleteShelf()
  const assignProductCellMutation = useAssignProductCell()
  const bulkAssignMutation = useBulkAssignProductCell()

  // Otomatik ilk rafı seç
  React.useEffect(() => {
    if (shelves.length > 0 && !selectedShelfId) {
      setSelectedShelfId(shelves[0].id)
    }
  }, [shelves, selectedShelfId])

  const { data: currentShelf } = useShelfMatrix(
    selectedShelfId || undefined
  )

  const selectedShelfSummary = shelves.find((s) => s.id === selectedShelfId)

  // Hücre matrisini katlara (rows) göre grupla (Yukarıdan aşağı: En üst kat önce)
  const cellsByRow = React.useMemo(() => {
    if (!currentShelf?.cells) return {}
    const grouped: { [key: number]: ShelfCellRecord[] } = {}
    
    // Satırları ters sırala (Örn: 4. Kat en üstte görünsün)
    for (let r = currentShelf.rows; r >= 1; r--) {
      grouped[r] = []
    }

    currentShelf.cells.forEach((cell: ShelfCellRecord) => {
      if (!grouped[cell.rowNumber]) grouped[cell.rowNumber] = []
      grouped[cell.rowNumber].push(cell)
    })

    // Sütunları sırala
    Object.keys(grouped).forEach((row) => {
      grouped[Number(row)].sort((a, b) => a.colNumber - b.colNumber)
    })

    return grouped
  }, [currentShelf])

  const cellMap = React.useMemo(() => {
    const map = new Map<string, ShelfCellRecord>()
    currentShelf?.cells?.forEach((cell: ShelfCellRecord) => {
      map.set(`${cell.rowNumber}-${cell.colNumber}`, cell)
    })
    return map
  }, [currentShelf?.cells])

  const floorNumbers = React.useMemo(() => {
    if (!currentShelf) return []
    const floors: number[] = []
    for (let r = currentShelf.rows; r >= 1; r--) {
      floors.push(r)
    }
    if (selectedFloor !== "ALL") {
      return floors.filter((f) => String(f) === selectedFloor)
    }
    return floors
  }, [currentShelf, selectedFloor])

  const colNumbers = React.useMemo(() => {
    if (!currentShelf) return []
    return Array.from({ length: currentShelf.columns }, (_, i) => i + 1)
  }, [currentShelf])

  // Atanmamış veya aranabilen serbest parçalar (Sürükle & Bırak Dock'u için)
  const unassignedProducts = React.useMemo(() => {
    return products.filter((p) => !p.shelfCellId)
  }, [products])

  const filteredStagingProducts = React.useMemo(() => {
    if (!stagingSearch.trim()) {
      return unassignedProducts
    }
    const q = stagingSearch.toLowerCase()
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category && String(p.category).toLowerCase().includes(q))
    )
  }, [products, unassignedProducts, stagingSearch])

  const handleDropPayload = async (
    e: React.DragEvent,
    target: { cellId?: string; shelfId?: string; unassign?: boolean }
  ) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverCellId(null)
    setDragOverShelfId(null)
    setDragOverStaging(false)
    setDraggedProductId(null)
    setDraggedBulkInfo(null)

    let productIds: string[] = []
    const jsonStr = e.dataTransfer.getData("application/json")
    if (jsonStr) {
      try {
        const parsed = JSON.parse(jsonStr)
        if (Array.isArray(parsed.productIds) && parsed.productIds.length > 0) {
          productIds = parsed.productIds
        } else if (parsed.productId) {
          productIds = [parsed.productId]
        }
      } catch {}
    }

    if (productIds.length === 0) {
      const text = e.dataTransfer.getData("text/plain") || draggedProductId
      if (text) {
        productIds = text.split(",").map((s) => s.trim()).filter(Boolean)
      }
    }

    if (productIds.length === 0) return

    try {
      if (target.unassign) {
        if (productIds.length === 1) {
          await assignProductCellMutation.mutateAsync({
            productId: productIds[0],
            shelfCellId: null,
          })
        } else {
          await bulkAssignMutation.mutateAsync({
            productIds,
            shelfCellId: null,
            targetShelfId: null,
          })
        }
      } else if (target.cellId) {
        if (productIds.length === 1) {
          await assignProductCellMutation.mutateAsync({
            productId: productIds[0],
            shelfCellId: target.cellId,
          })
        } else {
          await bulkAssignMutation.mutateAsync({
            productIds,
            shelfCellId: target.cellId,
          })
        }
      } else if (target.shelfId) {
        await bulkAssignMutation.mutateAsync({
          productIds,
          targetShelfId: target.shelfId,
        })
      }
    } catch (err) {
      console.error("Drop handling failed:", err)
    }
  }

  // Açık olan modal hücresini her zaman güncel sunucu verisiyle senkronize tut
  const activeCellId = activeCellModal?.id
  React.useEffect(() => {
    if (activeCellId && currentShelf?.cells) {
      const freshCell = currentShelf.cells.find((c: ShelfCellRecord) => c.id === activeCellId)
      if (freshCell) {
        setActiveCellModal(freshCell)
      }
    }
  }, [currentShelf, activeCellId])

  const handleQuickAssign = async (productId: string, cellId: string) => {
    try {
      // Modal açıksa anında içeride görünmesi için optimistik olarak güncelle
      if (activeCellModal && activeCellModal.id === cellId) {
        const prod = products.find((p) => p.id === productId)
        if (prod) {
          setActiveCellModal((prev: ShelfCellRecord | null) => {
            if (!prev) return null
            const existing = prev.products || []
            if (existing.some((x: ShelfProductSummary) => x.id === productId)) return prev
            return {
              ...prev,
              products: [
                ...existing,
                {
                  id: prod.id,
                  name: prod.name,
                  oemCode: prod.sku || "",
                  category: prod.category,
                  stockQuantity: prod.currentStock || 0,
                  minStockLevel: prod.minimumStock ?? 5,
                },
              ],
            }
          })
        }
      }

      await assignProductCellMutation.mutateAsync({
        productId,
        shelfCellId: cellId,
      })
    } catch (e) {
      console.error("Quick assign failed:", e)
    }
  }

  const handleDeleteShelf = (shelfId: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Raf Ünitesini Sil",
      message: `'${name}' raf ünitesini ve tüm hücre matrisini silmek istediğinize emin misiniz? Hücrelerdeki parçalar silinmez, rafsız parçalar listesine aktarılır.`,
      confirmText: "Evet, Rafı Sil",
      cancelText: "Vazgeç",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteShelfMutation.mutateAsync(shelfId)
          setSelectedShelfId(null)
        } catch (_e) {
          // toast will handle
        }
      },
    })
  }

  const handleUnassignProduct = (productId: string, productName?: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Raf Atamasını Kaldır",
      message: productName
        ? `"${productName}" adlı parçanın bu hücredeki raf atamasını kaldırmak istediğinize emin misiniz? Parça sistemden silinmez, rafsız parçalar istasyonuna aktarılır.`
        : "Bu parçanın hücre atamasını kaldırmak istediğinize emin misiniz? Parça sistemden silinmez, rafsız parçalar istasyonuna aktarılır.",
      confirmText: "Evet, Kaldır",
      cancelText: "Vazgeç",
      variant: "danger",
      onConfirm: async () => {
        try {
          // Optimistik olarak modal içindeki listeden çıkar
          setActiveCellModal((prev: ShelfCellRecord | null) => {
            if (!prev) return null
            return {
              ...prev,
              products: prev.products?.filter((p: ShelfProductSummary) => p.id !== productId) || [],
            }
          })

          await assignProductCellMutation.mutateAsync({
            productId,
            shelfCellId: null,
          })
        } catch (_e) {
          // toast handles
        }
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Üst Bar: Raf Seçici, İstatistikler & Yeni Raf Butonu */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="flex flex-col gap-2.5 w-full md:w-auto">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                <Boxes size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Aktif Depo Rafı</p>
                <select
                  value={selectedShelfId || ""}
                  onChange={(e) => setSelectedShelfId(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  disabled={isShelvesLoading || shelves.length === 0}
                >
                  {shelves.length === 0 ? (
                    <option value="">Henüz Tanımlı Raf Yok</option>
                  ) : (
                    shelves.map((s: ShelfSummaryRecord) => (
                      <option key={s.id} value={s.id}>
                        {s.code} - {s.name} ({s.occupiedCells}/{s.totalCells} Dolu)
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {selectedShelfSummary && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {selectedShelfSummary.zone || "Genel Depo"}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-[11px] font-bold text-sky-600 dark:text-sky-400">
                  %{selectedShelfSummary.occupancyRate} Doluluk
                </span>
              </div>
            )}
          </div>

          {/* Hızlı Raf Sekmeleri & Sürükle-Bırak Hedefleri */}
          {shelves.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] font-medium text-slate-400 mr-1">Raflar Arası Geçiş & Taşıma:</span>
              {shelves.map((s) => {
                const isCurrent = s.id === selectedShelfId
                const isDropTarget = dragOverShelfId === s.id
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedShelfId(s.id)}
                    onDragEnter={(e) => {
                      e.preventDefault()
                      if (!isCurrent) setDragOverShelfId(s.id)
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = "move"
                      if (!isCurrent && dragOverShelfId !== s.id) setDragOverShelfId(s.id)
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        if (dragOverShelfId === s.id) setDragOverShelfId(null)
                      }
                    }}
                    onDrop={(e) => handleDropPayload(e, { shelfId: s.id })}
                    draggable={isCurrent && (selectedShelfSummary?.totalProducts || 0) > 0}
                    onDragStart={(e) => {
                      if (currentShelf?.cells) {
                        const allProdIds = currentShelf.cells.flatMap((c: ShelfCellRecord) => (c.products || []).map((p: ShelfProductSummary) => p.id))
                        if (allProdIds.length > 0) {
                          e.dataTransfer.setData("application/json", JSON.stringify({ type: "SHELF_BULK", shelfId: s.id, productIds: allProdIds }))
                          e.dataTransfer.setData("text/plain", allProdIds.join(","))
                          e.dataTransfer.effectAllowed = "move"
                          createShelfPillDragImage(
                            e,
                            s.code,
                            allProdIds.length,
                            s.name
                          )
                          setDraggedBulkInfo({ type: "SHELF_BULK", title: `${s.code} (${allProdIds.length} Parça)`, count: allProdIds.length, shelfId: s.id })
                        }
                      }
                    }}
                    onDragEnd={() => {
                      setDraggedBulkInfo(null)
                      setDragOverShelfId(null)
                    }}
                    className={`group px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border select-none ${
                      isDropTarget
                        ? "bg-sky-500 text-white border-sky-400 ring-2 ring-sky-300 scale-105 shadow-md animate-pulse"
                        : isCurrent
                        ? "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-800 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-sky-300 hover:text-sky-500"
                    }`}
                    title={
                      isCurrent
                        ? "Aktif Raf (Tüm parçaları başka bir rafa taşımak için bu etiketi sürükleyip diğer rafa bırakabilirsiniz)"
                        : "Parçayı veya hücreyi bu rafa taşımak için üzerine bırakın"
                    }
                  >
                    <span>{s.code}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      isCurrent ? "bg-sky-200/80 dark:bg-sky-800/60 text-sky-800 dark:text-sky-200" : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300"
                    }`}>
                      {s.totalProducts}
                    </span>
                    {isDropTarget && <span className="text-[10px] font-extrabold animate-bounce">🎯 Buraya Taşı</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {selectedShelfSummary && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteShelf(selectedShelfSummary.id, selectedShelfSummary.name)}
              className="h-9 px-3 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-rose-200 dark:border-rose-900/40"
              title="Rafı Sil"
            >
              <Trash2 size={14} className="mr-1.5" />
              Rafı Sil
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="h-9 px-4 text-xs font-semibold gap-1.5 shadow-sm bg-sky-500 hover:bg-sky-600 text-white"
          >
            <Plus size={15} />
            <span>Yeni Raf Ünitesi Ekle</span>
          </Button>
        </div>
      </div>

      {/* Raf Bulunamadı Durumu */}
      {shelves.length === 0 && !isShelvesLoading && (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-500 mx-auto flex items-center justify-center mb-4">
            <Grid3X3 size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Henüz Depo Rafı Eklenmemiş</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5 mb-6">
            Yedek parça ve sarf malzemelerinizi göz ve kat esasına göre konumlandırmak için ilk raf ünitenizi tanımlayın.
          </p>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="h-10 px-5 text-xs font-bold gap-2 bg-sky-500 hover:bg-sky-600 text-white"
          >
            <Plus size={16} />
            <span>İlk Rafı Tanımla (Örn: RAF-A01)</span>
          </Button>
        </div>
      )}

      {/* Matris Görünümü */}
      {currentShelf && (
        <div className="space-y-4">
          {/* Bilgi & Filtre Bandı */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 px-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {currentShelf.name}
              </span>
              <span className="text-[11px] text-slate-500">
                ({currentShelf.rows} Kat x {currentShelf.columns} Göz = {currentShelf.cells?.length} Toplam Hücre)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
              {/* Kat Filtresi */}
              {currentShelf.rows > 1 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-500">Kat:</span>
                  <select
                    value={selectedFloor}
                    onChange={(e) => setSelectedFloor(e.target.value)}
                    className="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value="ALL">Tüm Katlar ({currentShelf.rows} Kat)</option>
                    {Object.keys(cellsByRow)
                      .map(Number)
                      .sort((a, b) => b - a)
                      .map((floor) => (
                        <option key={floor} value={String(floor)}>
                          Sadece Kat {floor}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Görünüm Modu Değiştirici */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setViewMode("DETAILED")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "DETAILED"
                      ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                  title="Genişletilmiş kart görünümü (Kaydırılabilir)"
                >
                  Detaylı Kartlar
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("COMPACT")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "COMPACT"
                      ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                  title="Tüm deponun kuşbakışı ısı haritası"
                >
                  Kuşbakışı (Isı Haritası)
                </button>
              </div>

              {/* Arama */}
              <div className="relative w-full sm:w-56">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rafta parça ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Sürükle & Bırak İstasyonu (Staging Dock) */}
          <div
            onDragEnter={(e) => {
              e.preventDefault()
              setDragOverStaging(true)
            }}
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = "move"
              if (!dragOverStaging) setDragOverStaging(true)
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragOverStaging(false)
              }
            }}
            onDrop={(e) => handleDropPayload(e, { unassign: true })}
            className={`p-4 rounded-3xl border shadow-sm dark:shadow-xl space-y-3 text-slate-900 dark:text-slate-100 transition-all ${
              dragOverStaging
                ? "bg-amber-50/90 dark:bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/60 shadow-lg scale-[1.01]"
                : "bg-white dark:bg-slate-900/95 border-slate-200/90 dark:border-slate-800"
            }`}
          >
            {dragOverStaging && (
              <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-800 dark:text-amber-200 text-xs font-bold text-center animate-pulse">
                🎯 Parçaları veya hücreyi buraya bırakarak raf atamasını kaldırın (Serbest Alana Çıkar)
              </div>
            )}
            {/* Dock Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0">
                  <Inbox size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>Rafa Parça Yerleştirme İstasyonu (Sürükle & Bırak)</span>
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        unassignedProducts.length > 0
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse"
                          : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {unassignedProducts.length} Rafsız Parça
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Parçayı kartından tutup aşağıdaki istediğiniz raf hücresine sürükleyip bırakın; anında atanır.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <div className="relative w-full sm:w-48">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="İstasyonda ara..."
                    value={stagingSearch}
                    onChange={(e) => setStagingSearch(e.target.value)}
                    className="w-full h-8 pl-7 pr-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-[11px] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsStagingOpen(!isStagingOpen)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={isStagingOpen ? "İstasyonu Daralt" : "İstasyonu Genişlet"}
                >
                  {isStagingOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>

            {/* Dock İçeriği: Sürüklenebilir Parça Çipleri */}
            {isStagingOpen && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                {filteredStagingProducts.length === 0 ? (
                  <div className="py-3 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-500 dark:text-emerald-400" />
                    <span>
                      Tüm parçalar raflara yerleştirilmiş. Başka bir parçayı taşımak için yukarıdan arayabilir veya doğrudan hücreler arasında sürükleyebilirsiniz.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                    {filteredStagingProducts.map((p) => (
                      <div
                        key={p.id}
                        draggable="true"
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", p.id)
                          e.dataTransfer.effectAllowed = "move"
                          createCustomDragImage(e, p.name, p.sku, `${p.currentStock} Adet`)
                          setDraggedProductId(p.id)
                        }}
                        onDragEnd={() => {
                          setDraggedProductId(null)
                          setDragOverCellId(null)
                        }}
                        className={`shrink-0 px-3 py-2 rounded-xl border transition-all cursor-grab active:cursor-grabbing flex items-center gap-2.5 group select-none ${
                          draggedProductId === p.id
                            ? "opacity-50 scale-95 border-sky-400 bg-sky-500/20"
                            : "bg-slate-50 dark:bg-slate-800/80 border-slate-200/90 dark:border-slate-700/80 hover:border-sky-500/60 hover:bg-white dark:hover:bg-slate-800 shadow-xs"
                        }`}
                        title="Bu parçayı tutup aşağıdaki bir raf hücresine bırakın"
                      >
                        <GripVertical size={14} className="text-slate-400 dark:text-slate-500 group-hover:text-sky-500 dark:group-hover:text-sky-400 shrink-0" />
                        <div className="max-w-[170px] min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{p.name}</p>
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="font-mono text-slate-500 dark:text-slate-400 truncate">{p.sku}</span>
                            <span className="text-sky-600 dark:text-sky-400 font-bold shrink-0">{p.currentStock} Adet</span>
                            {p.shelfLocation && (
                              <span className="text-[9px] px-1 rounded bg-slate-200/80 dark:bg-slate-900 text-slate-600 dark:text-slate-400 truncate">
                                {p.shelfLocation}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Raf 2D Grid Paneli */}
          <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-2xl overflow-x-auto text-slate-900 dark:text-slate-100">
            {/* Tek Birleşik Master Grid - Katlar, Gözler ve Sütunlar Matematiksel Olarak Kilitli & Kusursuz Eşit */}
            <div
              className={`grid gap-2.5 ${
                viewMode === "COMPACT" ? "w-max min-w-full" : currentShelf.columns > 6 ? "min-w-full" : "w-full min-w-full"
              }`}
              style={{
                width: viewMode === "DETAILED" && currentShelf.columns > 6 ? `${64 + currentShelf.columns * 190}px` : undefined,
                gridTemplateColumns:
                  viewMode === "DETAILED"
                    ? currentShelf.columns > 6
                      ? `64px repeat(${currentShelf.columns}, 185px)`
                      : `64px repeat(${currentShelf.columns}, minmax(0, 1fr))`
                    : `56px repeat(${currentShelf.columns}, 38px)`,
              }}
            >
              {/* Sütun Başlıkları Satırı (Row 0) */}
              <div className="flex items-center justify-end pr-2 text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase h-7">
                {viewMode === "DETAILED" ? "Kat / Göz" : "K/G"}
              </div>
              {colNumbers.map((col) => (
                <div
                  key={`head-col-${col}`}
                  className={`text-center font-mono font-bold text-slate-600 dark:text-slate-400 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/40 flex items-center justify-center ${
                    viewMode === "DETAILED" ? "text-[10px]" : "text-[9px]"
                  }`}
                >
                  {viewMode === "DETAILED" ? `Göz ${col}` : `G${col}`}
                </div>
              ))}

              {/* Katlar ve Hücreler Döngüsü (Rows 1..N) */}
              {floorNumbers.map((rowNum) => {
                return (
                  <React.Fragment key={`row-${rowNum}`}>
                    {/* Kat Rozeti (Sütun 1) */}
                    <div
                      className={`flex items-center justify-end pr-2 ${
                        viewMode === "DETAILED" ? "h-[115px]" : "h-9"
                      }`}
                    >
                      <span className="inline-block px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400 border border-slate-200 dark:border-slate-700/60 whitespace-nowrap shadow-xs">
                        Kat {rowNum}
                      </span>
                    </div>

                    {/* Bu Katın Tüm Göz Hücreleri (Sütun 2..N+1) */}
                    {colNumbers.map((col) => {
                      const cell = cellMap.get(`${rowNum}-${col}`)
                      if (!cell) {
                        return (
                          <div
                            key={`empty-${rowNum}-${col}`}
                            className={`rounded-xl border border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/40 ${
                              viewMode === "DETAILED" ? "h-[115px]" : "h-9 w-9"
                            }`}
                          />
                        )
                      }

                      const cellProducts = cell.products || []
                      const productCount = cellProducts.length
                      const hasProducts = productCount > 0
                      const isMulti = productCount > 1
                      const totalStock =
                        cellProducts.reduce((sum: number, p: ShelfProductSummary) => sum + (p.stockQuantity || 0), 0)
                      const hasCritical = cellProducts.some(
                        (p: ShelfProductSummary) => (p.stockQuantity || 0) <= (p.minStockLevel ?? 5)
                      )

                      const isMatch =
                        !searchQuery ||
                        cell.cellCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        cellProducts.some(
                          (p: ShelfProductSummary) =>
                            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (p.oemCode && p.oemCode.toLowerCase().includes(searchQuery.toLowerCase()))
                        )

                      const tooltipText = hasProducts
                        ? `${cell.cellCode}\n${cellProducts
                            .map((p: ShelfProductSummary) => `• ${p.name} (${p.oemCode || '-'}): ${p.stockQuantity} ad.`)
                            .join("\n")}`
                        : `${cell.cellCode} - Boş`

                      const isDragOver = dragOverCellId === cell.id

                      const isCellBeingDragged =
                        (hasProducts && cellProducts.some((p: ShelfProductSummary) => p.id === draggedProductId)) ||
                        draggedBulkInfo?.cellId === cell.id

                      if (viewMode === "COMPACT") {
                        /* Kuşbakışı Isı Haritası Modu */
                        return (
                          <button
                            key={cell.id}
                            type="button"
                            onClick={() => {
                              if (isDraggingRef.current) return
                              setActiveCellModal(cell)
                            }}
                            draggable={hasProducts}
                            onDragStart={(e) => {
                              if (hasProducts) {
                                isDraggingRef.current = true
                                const pIds = cellProducts.map((p: ShelfProductSummary) => p.id)
                                e.dataTransfer.setData(
                                  "application/json",
                                  JSON.stringify({ type: "CELL_BULK", cellId: cell.id, productIds: pIds })
                                )
                                e.dataTransfer.setData("text/plain", pIds.join(","))
                                e.dataTransfer.effectAllowed = "move"
                                createCellDragImage(
                                  e,
                                  cell,
                                  cellProducts,
                                  isMulti
                                )
                                setDraggedBulkInfo({
                                  type: "CELL_BULK",
                                  title: `${cell.cellCode} (${pIds.length} Parça)`,
                                  count: pIds.length,
                                  cellId: cell.id,
                                })
                              }
                            }}
                            onDragEnd={() => {
                              setDraggedBulkInfo(null)
                              setDragOverCellId(null)
                              setDragOverShelfId(null)
                              setTimeout(() => {
                                isDraggingRef.current = false
                              }, 100)
                            }}
                            onDragEnter={(e) => {
                              e.preventDefault()
                              if (dragOverCellId !== cell.id) setDragOverCellId(cell.id)
                            }}
                            onDragOver={(e) => {
                              e.preventDefault()
                              e.dataTransfer.dropEffect = "move"
                              if (dragOverCellId !== cell.id) setDragOverCellId(cell.id)
                            }}
                            onDragLeave={(e) => {
                              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                if (dragOverCellId === cell.id) setDragOverCellId(null)
                              }
                            }}
                            onDrop={(e) => handleDropPayload(e, { cellId: cell.id })}
                            title={tooltipText}
                            className={`w-9 h-9 rounded-lg border text-[10px] font-mono font-bold transition-all flex items-center justify-center cursor-pointer relative group ${
                              isCellBeingDragged
                                ? "opacity-40 border-dashed border-sky-400 bg-sky-500/20 scale-95 ring-1 ring-sky-400/50"
                                : isDragOver
                                ? "ring-2 ring-sky-500 bg-sky-500/30 dark:bg-sky-500/40 scale-110 shadow-lg shadow-sky-500/50 z-20"
                                : hasProducts
                                ? isMulti
                                  ? hasCritical
                                    ? "bg-amber-100 dark:bg-amber-500/30 border-amber-400 dark:border-amber-500 text-amber-800 dark:text-amber-300 ring-1 ring-amber-400/50"
                                    : "bg-indigo-100 dark:bg-indigo-500/30 border-indigo-300 dark:border-indigo-500 text-indigo-800 dark:text-indigo-200 ring-1 ring-indigo-400/50 hover:scale-110 shadow-xs"
                                  : hasCritical
                                  ? "bg-amber-100 dark:bg-amber-500/30 border-amber-400 dark:border-amber-500 text-amber-800 dark:text-amber-300 animate-pulse hover:scale-110"
                                  : "bg-emerald-100/80 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-300 hover:scale-110"
                                : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                            } ${!isMatch && searchQuery ? "opacity-20 grayscale" : ""}`}
                          >
                            <span>G{cell.colNumber}</span>
                            {isMulti && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-900" />
                            )}
                          </button>
                        )
                      }

                      /* Detaylı Kartlar Modu */
                      return (
                        <button
                          key={cell.id}
                          type="button"
                          onClick={() => {
                            if (isDraggingRef.current) return
                            setActiveCellModal(cell)
                          }}
                          draggable={hasProducts}
                          onDragStart={(e) => {
                            if (!hasProducts) return
                            isDraggingRef.current = true
                            if (isMulti) {
                              const pIds = cellProducts.map((p: ShelfProductSummary) => p.id)
                              e.dataTransfer.setData(
                                "application/json",
                                JSON.stringify({ type: "CELL_BULK", cellId: cell.id, productIds: pIds })
                              )
                              e.dataTransfer.setData("text/plain", pIds.join(","))
                              e.dataTransfer.effectAllowed = "move"
                              createCellDragImage(
                                e,
                                cell,
                                cellProducts,
                                true
                              )
                              setDraggedBulkInfo({
                                type: "CELL_BULK",
                                title: `${cell.cellCode} (${pIds.length} Parça)`,
                                count: pIds.length,
                                cellId: cell.id,
                              })
                            } else {
                              const p = cellProducts[0]
                              e.dataTransfer.setData(
                                "application/json",
                                JSON.stringify({ type: "PRODUCT", productId: p.id, productIds: [p.id] })
                              )
                              e.dataTransfer.setData("text/plain", p.id)
                              e.dataTransfer.effectAllowed = "move"
                              createCellDragImage(
                                e,
                                cell,
                                cellProducts,
                                false
                              )
                              setDraggedProductId(p.id)
                            }
                          }}
                          onDragEnd={() => {
                            setDraggedBulkInfo(null)
                            setDraggedProductId(null)
                            setDragOverCellId(null)
                            setDragOverShelfId(null)
                            setTimeout(() => {
                              isDraggingRef.current = false
                            }, 100)
                          }}
                          onDragEnter={(e) => {
                            e.preventDefault()
                            if (dragOverCellId !== cell.id) setDragOverCellId(cell.id)
                          }}
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.dataTransfer.dropEffect = "move"
                            if (dragOverCellId !== cell.id) setDragOverCellId(cell.id)
                          }}
                          onDragLeave={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                              if (dragOverCellId === cell.id) setDragOverCellId(null)
                            }
                          }}
                          onDrop={(e) => handleDropPayload(e, { cellId: cell.id })}
                          className={`group relative p-3 rounded-2xl border text-left transition-all duration-200 select-none flex flex-col justify-between h-[115px] overflow-hidden min-w-0 ${
                            hasProducts ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                          } ${
                            isCellBeingDragged
                              ? isMulti
                                ? "opacity-45 border-dashed border-indigo-400 bg-indigo-500/15 scale-[0.98] ring-1 ring-indigo-400/40"
                                : "opacity-45 border-dashed border-sky-400 bg-sky-500/10 scale-[0.98] ring-1 ring-sky-400/40"
                              : isDragOver
                              ? "ring-2 ring-sky-500 bg-sky-50 dark:bg-sky-500/25 scale-[1.03] shadow-lg shadow-sky-500/20 z-20"
                              : hasProducts
                              ? isMulti
                                ? hasCritical
                                  ? "bg-amber-50/90 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/50 hover:border-amber-400 ring-1 ring-amber-500/20"
                                  : "bg-indigo-50/70 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/40 hover:border-indigo-400 hover:bg-indigo-100/50 dark:hover:bg-indigo-500/20 ring-1 ring-indigo-500/20 shadow-xs"
                                : hasCritical
                                ? "bg-amber-50/80 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/40 hover:border-amber-400 hover:bg-amber-100/60 dark:hover:bg-amber-500/20"
                                : "bg-sky-50/60 dark:bg-sky-500/10 border-sky-200/90 dark:border-sky-500/30 hover:border-sky-400 hover:bg-sky-100/60 dark:hover:bg-sky-500/20"
                              : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-sky-400/60 hover:bg-sky-50/30 dark:hover:bg-slate-800/80"
                          } ${!isMatch && searchQuery ? "opacity-30 grayscale" : ""}`}
                        >
                          {/* Sürükleme Kaynağı Görsel Efekti */}
                          {isCellBeingDragged && (
                            <div className={`absolute inset-0 backdrop-blur-[1px] flex items-center justify-center z-30 font-semibold text-[10px] pointer-events-none select-none gap-1 ${
                              isMulti ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300" : "bg-sky-500/10 text-sky-600 dark:text-sky-300"
                            }`}>
                              <span>📦 Taşınıyor...</span>
                            </div>
                          )}

                          {/* Sürükleme Hedefi Görsel Efekti - pointer-events-none ile FLICKER BUG'I ÇÖZÜLDÜ */}
                          {isDragOver && (
                            <div className="absolute inset-0 bg-sky-600/30 backdrop-blur-xs flex items-center justify-center z-30 font-bold text-xs text-sky-800 dark:text-white pointer-events-none select-none gap-1 animate-pulse">
                              <span>🎯 Buraya Bırak</span>
                            </div>
                          )}

                          {/* Hücre Başlığı & Kat/Göz Kodu */}
                          <div className="flex items-center justify-between w-full shrink-0">
                            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200">
                              K{cell.rowNumber}-G{cell.colNumber}
                            </span>

                            {hasProducts ? (
                              <div className="flex items-center gap-1.5">
                                {isMulti && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono text-[9px] font-bold border border-indigo-200 dark:border-indigo-500/40 flex items-center gap-1">
                                    <Layers size={9} />
                                    <span>{productCount} Çeşit</span>
                                  </span>
                                )}
                                {/* Bulk Cell Drag Handle */}
                                <div
                                  draggable="true"
                                  onClick={(e) => e.stopPropagation()}
                                  onDragStart={(e) => {
                                    e.stopPropagation()
                                    isDraggingRef.current = true
                                    const pIds = cellProducts.map((p: ShelfProductSummary) => p.id)
                                    e.dataTransfer.setData(
                                      "application/json",
                                      JSON.stringify({ type: "CELL_BULK", cellId: cell.id, productIds: pIds })
                                    )
                                    e.dataTransfer.setData("text/plain", pIds.join(","))
                                    e.dataTransfer.effectAllowed = "move"
                                    createCellDragImage(
                                      e,
                                      cell,
                                      cellProducts,
                                      isMulti
                                    )
                                    setDraggedBulkInfo({
                                      type: "CELL_BULK",
                                      title: `${cell.cellCode} (${pIds.length} Parça)`,
                                      count: pIds.length,
                                      cellId: cell.id,
                                    })
                                  }}
                                  onDragEnd={() => {
                                    setDraggedBulkInfo(null)
                                    setDragOverCellId(null)
                                    setDragOverShelfId(null)
                                    setTimeout(() => {
                                      isDraggingRef.current = false
                                    }, 100)
                                  }}
                                  className={`p-1 rounded-md cursor-grab active:cursor-grabbing transition-colors ${
                                    isMulti
                                      ? "bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-600 dark:text-indigo-400 border border-indigo-300/40 dark:border-indigo-500/30"
                                      : "bg-sky-500/10 hover:bg-sky-500/25 text-sky-600 dark:text-sky-400 border border-sky-300/40 dark:border-sky-500/30"
                                  }`}
                                  title={`Tüm gözü (${productCount} parça) başka hücreye veya yukarıdaki raflardan birine topluca taşımak için sürükleyin`}
                                >
                                  <GripVertical size={12} />
                                </div>
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    hasCritical
                                      ? "bg-amber-500 animate-pulse"
                                      : isMulti
                                      ? "bg-indigo-500"
                                      : "bg-emerald-500"
                                  }`}
                                  title={
                                    hasCritical
                                      ? "Kritik Stok Uyarısı"
                                      : isMulti
                                      ? "Çoklu Ürün"
                                      : "Normal"
                                  }
                                />
                              </div>
                            ) : (
                              <span className="text-[9px] text-slate-400 dark:text-slate-600 font-medium">Boş</span>
                            )}
                          </div>

                          {/* Parça İçeriği - Sabit Boyutta Dengeli Düzen & Sürüklenebilir Öğeler */}
                          {hasProducts ? (
                            isMulti ? (
                              /* Çoklu Ürün Listesi */
                              <div className="flex-1 flex flex-col justify-between pt-1 w-full overflow-hidden min-w-0">
                                <div className="space-y-0.5 overflow-hidden">
                                  {cellProducts.slice(0, 2).map((p: ShelfProductSummary) => (
                                    <div
                                      key={p.id}
                                      draggable="true"
                                      onDragStart={(e) => {
                                        e.stopPropagation()
                                        isDraggingRef.current = true
                                        e.dataTransfer.setData(
                                          "application/json",
                                          JSON.stringify({ type: "PRODUCT", productId: p.id, productIds: [p.id] })
                                        )
                                        e.dataTransfer.setData("text/plain", p.id)
                                        e.dataTransfer.effectAllowed = "move"
                                        createCustomDragImage(
                                          e,
                                          p.name,
                                          p.oemCode ? `OEM: ${p.oemCode}` : cell.cellCode,
                                          `${p.stockQuantity} Adet`
                                        )
                                        setDraggedProductId(p.id)
                                      }}
                                      onDragEnd={() => {
                                        setDraggedProductId(null)
                                        setDragOverCellId(null)
                                        setTimeout(() => {
                                          isDraggingRef.current = false
                                        }, 100)
                                      }}
                                      className={`flex items-center justify-between text-[10px] leading-tight gap-1 cursor-grab active:cursor-grabbing hover:bg-indigo-100/60 dark:hover:bg-white/10 rounded px-1 -mx-1 transition-colors ${
                                        draggedProductId === p.id ? "opacity-30" : ""
                                      }`}
                                      title="Başka bir göze veya rafa taşımak için sürükleyin"
                                    >
                                      <span className="text-slate-800 dark:text-white font-medium truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-200">
                                        {p.name}
                                      </span>
                                      <span className="font-mono text-indigo-600 dark:text-indigo-300 font-semibold shrink-0">
                                        {p.stockQuantity} ad.
                                      </span>
                                    </div>
                                  ))}
                                  {productCount > 2 && (
                                    <p className="text-[9px] text-slate-500 dark:text-slate-400 italic leading-none">
                                      +{productCount - 2} parça daha...
                                    </p>
                                  )}
                                </div>
                                <div className="pt-1 border-t border-indigo-200/80 dark:border-indigo-500/20 flex items-center justify-between text-[9px] text-slate-500 dark:text-slate-400 font-mono shrink-0">
                                  <span>Toplam:</span>
                                  <span className="font-bold text-slate-800 dark:text-white">{totalStock} Adet</span>
                                </div>
                              </div>
                            ) : (
                              /* Tek Ürün Görünümü - Kutunun herhangi bir yerinden sürüklenebilir */
                              <div
                                onDragStart={(e) => {
                                  e.stopPropagation()
                                  isDraggingRef.current = true
                                  e.dataTransfer.setData(
                                    "application/json",
                                    JSON.stringify({ type: "PRODUCT", productId: cellProducts[0].id, productIds: [cellProducts[0].id] })
                                  )
                                  e.dataTransfer.setData("text/plain", cellProducts[0].id)
                                  e.dataTransfer.effectAllowed = "move"
                                  createCellDragImage(
                                    e,
                                    cell,
                                    cellProducts,
                                    false
                                  )
                                  setDraggedProductId(cellProducts[0].id)
                                }}
                                onDragEnd={() => {
                                  setDraggedProductId(null)
                                  setDragOverCellId(null)
                                  setTimeout(() => {
                                    isDraggingRef.current = false
                                  }, 100)
                                }}
                                className={`flex-1 flex flex-col justify-between pt-1 w-full overflow-hidden min-w-0 rounded-lg transition-all ${
                                  draggedProductId === cellProducts[0].id ? "opacity-30" : ""
                                }`}
                                title="Bu ürünü tutup başka bir rafa veya göze taşımak için sürükleyin"
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors break-words">
                                    {cellProducts[0].name}
                                  </p>
                                  <GripVertical size={13} className="text-slate-400 dark:text-slate-500 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="pt-1 border-t border-slate-200 dark:border-slate-700/50 flex items-center justify-between text-[10px] shrink-0 gap-1">
                                  <span className="font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/80 px-1 py-0.5 rounded text-[9px] truncate max-w-[55%] border border-slate-200/60 dark:border-transparent">
                                    {cellProducts[0].oemCode || "-"}
                                  </span>
                                  <span
                                    className={`font-bold font-mono shrink-0 ${
                                      hasCritical ? "text-amber-600 dark:text-amber-400" : "text-sky-600 dark:text-sky-400"
                                    }`}
                                  >
                                    {cellProducts[0].stockQuantity} Adet
                                  </span>
                                </div>
                              </div>
                            )
                          ) : (
                            /* Boş Hücre Görünümü */
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                              <span className="text-[11px] text-slate-400 dark:text-slate-600 font-mono group-hover:hidden">
                                Boş Göz
                              </span>
                              <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold hidden group-hover:flex items-center gap-1">
                                <Plus size={12} />
                                Parça Ata
                              </span>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </React.Fragment>
                )
              })}
            </div>

            {/* Alt Lejant (Legend) */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Tek Parça Hücresi
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  Çoklu Parça (2+ Çeşit)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  Kritik Stoklu Parça
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  Boş Hücre
                </span>
              </div>
              <p className="text-slate-400 dark:text-slate-500">
                * Hücreye tıklayarak parça atayabilir veya mevcut parçayı değiştirebilirsiniz.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Yeni Raf Ünitesi Ekle */}
      {isCreateModalOpen && (
        <CreateShelfModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={(shelf) => {
            setIsCreateModalOpen(false)
            setSelectedShelfId(shelf.id)
          }}
        />
      )}

      {/* Modal 2: Hücre Detay & Parça Atama */}
      {activeCellModal && (
        <CellDetailModal
          cell={activeCellModal}
          products={products}
          currentShelf={currentShelf}
          onClose={() => setActiveCellModal(null)}
          onUnassignProduct={handleUnassignProduct}
          onQuickAssign={handleQuickAssign}
          onCreateProductForCell={onCreateProductForCell}
          isAssigning={assignProductCellMutation.isPending}
        />
      )}

      {/* Modal 3: Özel Onay (Confirm) Modalı - Google / Tarayıcı Pop-up'ı Yerine */}
      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Floating Bulk Drag Indicator */}
      {draggedBulkInfo && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-sky-600 text-white shadow-2xl text-xs font-bold flex items-center gap-2 pointer-events-none animate-in fade-in">
          <span>📦 Toplu Taşıma: {draggedBulkInfo.title}</span>
        </div>
      )}
    </div>
  )
}

// -------------------------------------------------------------
// ALT MODALLAR (PORTAL İLE RENDER EDİLİR)
// -------------------------------------------------------------

function CreateShelfModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (shelf: ShelfDetailRecord) => void
}) {
  const [mounted, setMounted] = React.useState(false)
  const [name, setName] = React.useState("")
  const [code, setCode] = React.useState("")
  const [zone, setZone] = React.useState("Ana Depo")
  const [rows, setRows] = React.useState(4)
  const [columns, setColumns] = React.useState(6)

  const createShelfMutation = useCreateShelf()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await createShelfMutation.mutateAsync({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        zone: zone.trim() || undefined,
        rows: Number(rows),
        columns: Number(columns),
      })
      onCreated(res)
    } catch (_err) {
      // toast handles
    }
  }

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <Boxes size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Yeni Raf Ünitesi Ekle</h3>
              <p className="text-[11px] text-slate-500">Kat ve göz matrisiyle otomatik hücreler üretilir</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Raf Adı *
            </label>
            <input
              type="text"
              placeholder="Örn: A Koridoru - Ön Takım Rafı"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Raf Kodu (Kısa) *
              </label>
              <input
                type="text"
                placeholder="Örn: RAF-A01"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 uppercase"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Bölge / Depo
              </label>
              <input
                type="text"
                placeholder="Örn: Ana Depo, Lastik Odası"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Grid Boyutları */}
          <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 space-y-3">
            <p className="text-xs font-bold text-sky-900 dark:text-sky-300 flex items-center gap-1.5">
              <Grid3X3 size={15} />
              <span>Matris Boyutları</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  Kat Sayısı (Satır)
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={rows}
                  onChange={(e) => setRows(Math.max(1, Number(e.target.value)))}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  Göz Sayısı (Sütun)
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={columns}
                  onChange={(e) => setColumns(Math.max(1, Number(e.target.value)))}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold"
                  required
                />
              </div>
            </div>

            <div className="pt-1 text-[11px] text-sky-700 dark:text-sky-400 flex items-center gap-1">
              <Info size={13} />
              <span>
                Toplam <strong>{rows * columns} adet hücre</strong> otomatik olarak oluşturulacak.
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={onClose} className="h-10 px-4 text-xs font-semibold">
              Vazgeç
            </Button>
            <Button
              type="submit"
              disabled={createShelfMutation.isPending}
              className="h-10 px-5 text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white"
            >
              {createShelfMutation.isPending ? "Oluşturuluyor..." : "Rafı Oluştur"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

function CellDetailModal({
  cell,
  products,
  currentShelf,
  onClose,
  onUnassignProduct,
  onQuickAssign,
  onCreateProductForCell,
  isAssigning,
}: {
  cell: ShelfCellRecord
  products: Product[]
  currentShelf: ShelfDetailRecord | null | undefined
  onClose: () => void
  onUnassignProduct: (productId: string, productName?: string) => void
  onQuickAssign: (productId: string, cellId: string) => void
  onCreateProductForCell?: (
    cell: ShelfCellRecord,
    shelf?: ShelfDetailRecord | ShelfSummaryRecord | null
  ) => void
  isAssigning: boolean
}) {
  const [mounted, setMounted] = React.useState(false)
  const [modalSearch, setModalSearch] = React.useState("")

  const [locallyAdded, setLocallyAdded] = React.useState<ShelfProductSummary[]>([])
  const [locallyRemovedIds, setLocallyRemovedIds] = React.useState<string[]>([])

  // Sunucu verisi (currentShelf veya ilk cell)
  const serverProducts = React.useMemo(() => {
    const found = currentShelf?.cells?.find((c: ShelfCellRecord) => c.id === cell?.id)
    return found?.products || cell?.products || []
  }, [currentShelf, cell])

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Sunucudan güncel veriler geldiğinde eşleşen optimistik kayıtları temizle
  React.useEffect(() => {
    const serverIds = new Set(serverProducts.map((p: ShelfProductSummary) => p.id))
    setLocallyAdded((prev) => prev.filter((p) => !serverIds.has(p.id)))
    setLocallyRemovedIds((prev) => prev.filter((id) => serverIds.has(id)))
  }, [serverProducts])

  // Nihai birleştirilmiş liste (Sıfır flicker, anında tepki, kararlı görünüm)
  const assignedProducts = React.useMemo(() => {
    const filteredServer = serverProducts.filter((p: ShelfProductSummary) => !locallyRemovedIds.includes(p.id))
    const existingIds = new Set(filteredServer.map((p: ShelfProductSummary) => p.id))
    const addedItems = locallyAdded.filter((p) => !existingIds.has(p.id))
    return [...filteredServer, ...addedItems]
  }, [serverProducts, locallyAdded, locallyRemovedIds])

  if (!mounted) return null

  // Henüz bir hücreye atanmamış veya bu hücredeki ürünler
  const availableProducts = products.filter(
    (p) => !p.shelfCellId || p.shelfCellId === cell.id || assignedProducts.some((a: ShelfProductSummary) => a.id === p.id)
  )

  const filteredAvailable = availableProducts.filter((p) => {
    if (!modalSearch.trim()) return true
    const q = modalSearch.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.category && String(p.category).toLowerCase().includes(q))
    )
  })

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold shrink-0">
              <MapPin size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Hücre: {cell.cellCode}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-400">
                  Kat {cell.rowNumber} / Göz {cell.colNumber}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">Bu raf gözündeki parçalar ve hızlı işlem menüsü</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Aksiyon 1: Bu Hücreye Sıfırdan Yeni Parça Kartı Oluştur */}
          <button
            type="button"
            onClick={() => {
              onClose()
              onCreateProductForCell?.(cell, currentShelf)
            }}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-sky-500/20 cursor-pointer group transition-all"
          >
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="font-bold text-xs">Bu Hücreye Yeni Parça Kartı Aç</p>
                <p className="text-[10px] text-white/80 font-normal">
                  Konum ({cell.cellCode}) otomatik kilitli olarak yeni stok kartı tanımlanır.
                </p>
              </div>
            </div>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform shrink-0" />
          </button>

          {/* Mevcut Parçalar Listesi */}
          <div className="space-y-2 pt-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Bu Gözde Bulunan Parçalar ({assignedProducts.length})
            </label>

            {assignedProducts.length === 0 ? (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                <p className="text-xs text-slate-400">Bu hücre henüz boş. Aşağıdan mevcut bir parça atayabilir veya yeni kart açabilirsiniz.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {assignedProducts.map((p: ShelfProductSummary) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{p.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                          {p.oemCode || '-'}
                        </span>
                        <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                          Stok: {p.stockQuantity} Adet
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setLocallyRemovedIds((prev) => [...prev, p.id])
                        setLocallyAdded((prev) => prev.filter((x) => x.id !== p.id))
                        onUnassignProduct(p.id, p.name)
                      }}
                      className="h-8 px-2.5 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
                      title="Raf Atamasını Kaldır"
                    >
                      Hücreden Çıkar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ayırıcı */}
          <div className="relative flex items-center justify-center pt-2">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-slate-900 px-3 text-[10px] uppercase font-bold text-slate-400 shrink-0">
              Mevcut Stoktan Hızlı Parça Ata
            </span>
          </div>

          {/* Arama & 1-Tıkla Atama Listesi (Selectbox yerine) */}
          <div className="space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Parça adı veya OEM kodu ile ara..."
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                className="w-full h-9 pl-8 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              {filteredAvailable.length === 0 ? (
                <p className="text-center py-4 text-xs text-slate-400">Eşleşen atanabilir parça bulunamadı.</p>
              ) : (
                filteredAvailable.map((p) => {
                  const isAlreadyHere = assignedProducts.some((a: ShelfProductSummary) => a.id === p.id) || p.shelfCellId === cell.id
                  return (
                    <div
                      key={p.id}
                      className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-sky-500/50 hover:bg-slate-100 dark:hover:bg-slate-800/90 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{p.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                          <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{p.sku || '-'}</span>
                          <span>•</span>
                          <span className="text-sky-600 dark:text-sky-400 font-semibold">
                            Stok: {p.currentStock} Adet
                          </span>
                          {p.shelfLocation && !isAlreadyHere && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400 truncate max-w-[90px] border border-slate-300/60 dark:border-slate-700/60">
                              {p.shelfLocation}
                            </span>
                          )}
                        </div>
                      </div>

                      {isAlreadyHere ? (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                          Bu Gözde
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          type="button"
                          disabled={isAssigning}
                          onClick={async () => {
                            // 1. ANINDA GÖRÜNMESİ İÇİN OPTİMİSTİK OLARAK EKLE
                            const newItem = {
                              id: p.id,
                              name: p.name,
                              oemCode: p.sku || "",
                              category: p.category,
                              stockQuantity: p.currentStock || 0,
                              minStockLevel: p.minimumStock ?? 5,
                            }
                            setLocallyRemovedIds((prev) => prev.filter((id) => id !== p.id))
                            setLocallyAdded((prev) => {
                              if (prev.some((x) => x.id === p.id)) return prev
                              return [...prev, newItem]
                            })
                            // 2. Sunucuya kaydet
                            await onQuickAssign(p.id, cell.id)
                          }}
                          className="h-7 px-3 text-[11px] font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shrink-0 gap-1 cursor-pointer"
                        >
                          <Plus size={12} />
                          <span>Bu Göze Ata</span>
                        </Button>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end shrink-0">
          <Button type="button" variant="outline" onClick={onClose} className="h-9 px-4 text-xs font-semibold cursor-pointer">
            Kapat
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Evet, Devam Et",
  cancelText = "Vazgeç",
  variant = "danger",
  onConfirm,
  onClose,
}: {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "warning" | "info"
  onConfirm: () => void | Promise<void>
  onClose: () => void
}) {
  const [mounted, setMounted] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isOpen) return null

  const handleConfirm = async () => {
    try {
      setIsLoading(true)
      await onConfirm()
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              variant === "danger"
                ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
            }`}
          >
            <AlertTriangle size={22} />
          </div>
          <div className="space-y-1 pt-0.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={onClose}
            className="h-9 px-4 text-xs font-semibold rounded-xl cursor-pointer"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            disabled={isLoading}
            onClick={handleConfirm}
            className={`h-9 px-4 text-xs font-bold rounded-xl text-white shadow-sm cursor-pointer ${
              variant === "danger"
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-sky-600 hover:bg-sky-700"
            }`}
          >
            {isLoading ? "İşleniyor..." : confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

