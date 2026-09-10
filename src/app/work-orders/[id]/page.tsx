"use client"

import {
  useWorkOrder,
  useAddWorkOrderItem,
  useUpdateWorkOrderStatus,
  useRemoveWorkOrderItem,
  useUpdateWorkOrderItemQuantity,
  useUpdateWorkOrderItem,
  useAddWorkOrderNote,
  useUpdateWorkOrderNote,
  useDeleteWorkOrderNote,
  useUploadWorkOrderPhoto,
  useUpdateWorkOrderPhoto,
  useDeleteWorkOrderPhoto,
} from "@/features/work-orders/api/use-work-orders"
import { useProducts, type ProductRecord } from "@/features/inventory/api/use-inventory"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Wrench,
  User,
  Phone,
  CheckCircle2,
  Play,
  Plus,
  Minus,
  Trash2,
  Edit2,
  Loader2,
  Receipt,
  FileText,
  Search,
  Package,
  Boxes,
  AlertTriangle,
  Check,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { WorkOrderStatusBadge } from "@/features/work-orders/components/work-order-status-badge"
import { TechnicianNotes } from "@/features/work-orders/components/technician-notes"
import { PhotoGallery } from "@/features/work-orders/components/photo-gallery"
import { WorkOrder, WorkOrderStatus } from "@/features/work-orders/types"


export default function WorkOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [order, setOrder] = React.useState<WorkOrder | null>(null)
  const [newServiceName, setNewServiceName] = React.useState("")
  const [newServicePrice, setNewServicePrice] = React.useState<number | "">(650)
  const [isAddingService, setIsAddingService] = React.useState(false)

  // Part Form
  const [newPartName, setNewPartName] = React.useState("")
  const [newPartNumber, setNewPartNumber] = React.useState("")
  const [newPartQty, setNewPartQty] = React.useState<number>(1)
  const [newPartPrice, setNewPartPrice] = React.useState<number | "">(450)
  const [isAddingPart, setIsAddingPart] = React.useState(false)
  const [isCustomPartMode, setIsCustomPartMode] = React.useState(false)
  const [selectedProduct, setSelectedProduct] = React.useState<ProductRecord | null>(null)
  const [productSearch, setProductSearch] = React.useState("")
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)

  const { data: apiProducts } = useProducts()

  const filteredProducts = React.useMemo(() => {
    if (!apiProducts) return []
    if (!productSearch.trim()) return apiProducts.slice(0, 8)
    const q = productSearch.toLowerCase()
    return apiProducts
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.code && p.code.toLowerCase().includes(q)) ||
          (p.oemCode && p.oemCode.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      )
      .slice(0, 8)
  }, [apiProducts, productSearch])

  const handleSelectProduct = (prod: ProductRecord) => {
    setSelectedProduct(prod)
    setNewPartName(prod.name)
    setNewPartNumber(prod.oemCode || prod.code || "")
    setNewPartPrice(prod.salePrice)
    setProductSearch(`${prod.name} (${prod.code || prod.oemCode || ""})`)
    setIsSearchOpen(false)
  }

  const { data: apiOrder } = useWorkOrder(id)
  const addItemMutation = useAddWorkOrderItem()
  const updateStatusMutation = useUpdateWorkOrderStatus()
  const removeItemMutation = useRemoveWorkOrderItem()
  const updateQuantityMutation = useUpdateWorkOrderItemQuantity()
  const updateItemMutation = useUpdateWorkOrderItem()
  const addNoteMutation = useAddWorkOrderNote()
  const updateNoteMutation = useUpdateWorkOrderNote()
  const deleteNoteMutation = useDeleteWorkOrderNote()
  const uploadPhotoMutation = useUploadWorkOrderPhoto()
  const updatePhotoMutation = useUpdateWorkOrderPhoto()
  const deletePhotoMutation = useDeleteWorkOrderPhoto()

  const [updatingItemId, setUpdatingItemId] = React.useState<string | null>(null)
  const [deletingItemId, setDeletingItemId] = React.useState<string | null>(null)
  const [editingService, setEditingService] = React.useState<{ id: string; name: string; laborPrice: number } | null>(null)
  const [isUpdatingService, setIsUpdatingService] = React.useState(false)

  React.useEffect(() => {
    if (apiOrder) {
      const rawItems = (apiOrder.items || []) as Array<Record<string, unknown>>
      const servicesList = rawItems
        .filter((i) => i.itemType === 'SERVICE')
        .map((i) => ({
          id: String(i.id || 'srv_1'),
          name: String(i.name || 'İşçilik'),
          durationMinutes: 60,
          laborPrice: Number(i.unitPrice || 0),
          completed: true,
        }))

      const partsList = rawItems
        .filter((i) => i.itemType === 'PART')
        .map((i) => ({
          id: String(i.id || 'prt_1'),
          name: String(i.name || 'Yedek Parça'),
          partNumber: String(i.itemId || i.partNumber || 'YEDEK-PARCA'),
          quantity: Number(i.quantity || 1),
          unitPrice: Number(i.unitPrice || 0),
          totalPrice: Number(i.totalPrice || Number(i.unitPrice || 0) * Number(i.quantity || 1) * 1.2),
        }))

      const computedLaborTotal = servicesList.reduce((sum, s) => sum + s.laborPrice, 0)
      const computedPartsTotal = partsList.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0)

      setOrder({
        id: apiOrder.id,
        tenantId: apiOrder.tenantId || 'ten_1',
        workOrderNumber: apiOrder.workOrderNumber,
        customerId: apiOrder.customerId,
        customerName: apiOrder.customer ? `${apiOrder.customer.firstName} ${apiOrder.customer.lastName}` : 'Müşteri',
        customerPhone: apiOrder.customer?.phone || '',
        vehicleId: apiOrder.vehicleId,
        plate: apiOrder.vehicle?.plate || '34XX000',
        brand: apiOrder.vehicle?.brand || 'Araç',
        model: apiOrder.vehicle?.model || '',
        year: apiOrder.vehicle?.year || 2024,
        kilometer: apiOrder.vehicle?.mileage || 0,
        status: apiOrder.status,
        priority: 'NORMAL',
        assignedLift: apiOrder.assignedLift || 'Lift 1',
        assignedMechanicName: apiOrder.assignedMechanic?.user ? `${apiOrder.assignedMechanic.user.name} ${apiOrder.assignedMechanic.user.surname}` : 'Usta',
        services: servicesList,
        parts: partsList,
        notes: (apiOrder.notes || []).map((n: any) => ({
          id: n.id,
          authorId: n.authorId || null,
          authorName: n.authorName || 'Usta',
          text: n.text || n.note || '',
          createdAt: n.createdAt,
          updatedAt: n.updatedAt || null,
          isInternal: n.isInternal ?? true,
        })),
        photos: (apiOrder.photos || []).map((p: any) => ({
          id: p.id,
          url: p.url,
          caption: p.caption || '',
          uploadedAt: p.createdAt || new Date().toISOString(),
          uploaderName: p.uploadedBy || 'Usta',
          type: (p.photoType || p.type || 'CHECKIN') as 'CHECKIN' | 'DAMAGE' | 'COMPLETED',
          photoType: (p.photoType || p.type || 'CHECKIN') as 'CHECKIN' | 'DAMAGE' | 'COMPLETED',
          updatedAt: p.updatedAt || null,
        })),
        laborTotal: computedLaborTotal,
        partsTotal: computedPartsTotal,
        taxRate: 0.20,
        grandTotal: Number(apiOrder.grandTotal ?? (computedLaborTotal + computedPartsTotal) * 1.2),
        estimatedCompletionTime: apiOrder.targetCompletionDate || '18:00',
        createdAt: apiOrder.createdAt,
        updatedAt: apiOrder.updatedAt,
      })
    }
  }, [id, apiOrder])

  if (!order) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-500">İş emri bulunamadı.</p>
        <Link href="/work-orders">
          <Button variant="outline" size="sm">İş Emirlerine Dön</Button>
        </Link>
      </div>
    )
  }

  const isOrderLocked = order.status === "COMPLETED" || order.status === "CANCELLED"

  const handleStatusUpdate = async (status: WorkOrderStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: order.id, status })
    } catch (e) {
      console.warn('API status update error:', e)
    }
    setOrder((prev) => (prev ? { ...prev, status } : null))
  }

  const handleRemoveItem = async (itemId: string, itemName: string) => {
    if (isOrderLocked) return
    if (!window.confirm(`"${itemName}" kalemini iş emrinden çıkarmak istediğinize emin misiniz? (Parça ise stoğa iade edilir)`)) {
      return
    }

    setDeletingItemId(itemId)
    try {
      await removeItemMutation.mutateAsync({
        workOrderId: order.id,
        itemId,
      })
    } catch (err) {
      console.error('Failed to remove item:', err)
    } finally {
      setDeletingItemId(null)
    }
  }

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (isOrderLocked || newQuantity < 1) return

    setUpdatingItemId(itemId)
    try {
      await updateQuantityMutation.mutateAsync({
        workOrderId: order.id,
        itemId,
        quantity: newQuantity,
      })
    } catch (err) {
      console.error('Failed to update quantity:', err)
    } finally {
      setUpdatingItemId(null)
    }
  }

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newServiceName.trim() || newServicePrice === "") return
    try {
      await addItemMutation.mutateAsync({
        workOrderId: order.id,
        item: {
          itemType: 'SERVICE',
          name: newServiceName.trim(),
          quantity: 1,
          unitPrice: Number(newServicePrice),
          kdvRate: 20,
        },
      })
    } catch (e) {
      console.warn('API add service error:', e)
    }
    setOrder((prev) => {
      if (!prev) return null
      const price = Number(newServicePrice)
      return {
        ...prev,
        services: [
          ...(prev.services || []),
          {
            id: 'serv_' + Date.now(),
            name: newServiceName.trim(),
            durationMinutes: 45,
            laborPrice: price,
            completed: false,
            mechanicName: prev.assignedMechanicName,
          },
        ],
        laborTotal: (prev.laborTotal || 0) + price,
        grandTotal: (prev.grandTotal || 0) + price * 1.2,
      }
    })
    setNewServiceName("")
    setIsAddingService(false)
  }

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPartName.trim() || newPartPrice === "") return
    const qty = Number(newPartQty) || 1
    const price = Number(newPartPrice)
    const itemId = !isCustomPartMode && selectedProduct ? selectedProduct.id : undefined

    try {
      await addItemMutation.mutateAsync({
        workOrderId: order?.id || id,
        item: {
          itemType: 'PART',
          itemId,
          name: newPartName.trim(),
          quantity: qty,
          unitPrice: price,
          kdvRate: 20,
        },
      })
    } catch (e) {
      console.warn('API add part error:', e)
    }

    setOrder((prev) => {
      if (!prev) return null
      const lineTotal = qty * price
      return {
        ...prev,
        parts: [
          ...prev.parts,
          {
            id: 'part_' + Date.now(),
            name: newPartName.trim(),
            partNumber: newPartNumber.trim().toUpperCase() || (selectedProduct?.code || "GENERIC-PART"),
            quantity: qty,
            unitPrice: price,
            totalPrice: lineTotal,
          },
        ],
        partsTotal: prev.partsTotal + lineTotal,
        grandTotal: prev.grandTotal + lineTotal * 1.2,
      }
    })

    setNewPartName("")
    setNewPartNumber("")
    setSelectedProduct(null)
    setProductSearch("")
    setIsAddingPart(false)
    setIsCustomPartMode(false)
  }

  const handleStartEditService = (srv: { id: string; name: string; laborPrice: number }) => {
    setEditingService({ id: srv.id, name: srv.name, laborPrice: srv.laborPrice })
  }

  const handleSaveEditService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order || !editingService || !editingService.name.trim() || isUpdatingService) return

    setIsUpdatingService(true)
    const price = Number(editingService.laborPrice) || 0
    try {
      await updateItemMutation.mutateAsync({
        workOrderId: order.id,
        itemId: editingService.id,
        data: {
          name: editingService.name.trim(),
          unitPrice: price,
        },
      })
      setOrder((prev) => {
        if (!prev) return null
        const updatedServices = prev.services.map((s) =>
          s.id === editingService.id
            ? { ...s, name: editingService.name.trim(), laborPrice: price }
            : s
        )
        const newLaborTotal = updatedServices.reduce((sum, s) => sum + s.laborPrice, 0)
        const newGrandTotal = (newLaborTotal + prev.partsTotal) * 1.2
        return {
          ...prev,
          services: updatedServices,
          laborTotal: newLaborTotal,
          grandTotal: newGrandTotal,
        }
      })
      setEditingService(null)
    } catch (err) {
      console.error("Failed to update service:", err)
    } finally {
      setIsUpdatingService(false)
    }
  }

  const handleAddNote = async (text: string) => {
    if (!order) return
    await addNoteMutation.mutateAsync({
      workOrderId: order.id,
      text,
      isInternal: true,
    })
  }

  const handleUpdateNote = async (noteId: string, text: string) => {
    if (!order) return
    await updateNoteMutation.mutateAsync({
      workOrderId: order.id,
      noteId,
      text,
    })
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!order) return
    await deleteNoteMutation.mutateAsync({
      workOrderId: order.id,
      noteId,
    })
  }

  const handleUploadPhoto = async (
    file: File,
    caption: string,
    photoType: "CHECKIN" | "DAMAGE" | "COMPLETED"
  ) => {
    if (!order) return
    await uploadPhotoMutation.mutateAsync({
      workOrderId: order.id,
      file,
      caption,
      photoType,
    })
  }

  const handleUpdatePhoto = async (
    photoId: string,
    caption: string,
    photoType: "CHECKIN" | "DAMAGE" | "COMPLETED"
  ) => {
    if (!order) return
    await updatePhotoMutation.mutateAsync({
      workOrderId: order.id,
      photoId,
      caption,
      photoType,
    })
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!order) return
    await deletePhotoMutation.mutateAsync({
      workOrderId: order.id,
      photoId,
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/work-orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Atölye Panosuna Dön</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
            {order.workOrderNumber}
          </span>
          <WorkOrderStatusBadge status={order.status} />
        </div>
      </div>

      {/* Main Vehicle & Customer Header Cockpit */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <PlateBadge plate={order.plate} size="lg" />
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{order.brand} {order.model}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                {order.year} • {order.kilometer.toLocaleString("tr-TR")} KM
              </span>
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                <User size={13} />
                <span>{order.customerName}</span>
              </span>
              <span>•</span>
              <a
                href={`tel:${order.customerPhone}`}
                className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-mono font-bold hover:underline"
              >
                <Phone size={12} />
                <span>{order.customerPhone}</span>
              </a>
              {order.vin && (
                <>
                  <span>•</span>
                  <span className="font-mono text-[11px] text-slate-400">Şasi: {order.vin}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Big Touch-Friendly Mechanic Action Buttons with Rollback */}
        <div className="flex flex-wrap items-center gap-2.5 self-stretch md:self-auto">
          {order.status === "PENDING" && (
            <Button
              type="button"
              onClick={() => handleStatusUpdate("IN_PROGRESS")}
              className="h-12 px-6 rounded-2xl text-xs font-bold gap-2 bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-600/25 cursor-pointer flex-1 md:flex-initial"
            >
              <Play size={16} fill="currentColor" />
              <span>Aracı Lifte Al (İşleme Başla)</span>
            </Button>
          )}

          {order.status === "IN_PROGRESS" && (
            <div className="flex items-center gap-2 flex-1 md:flex-initial">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleStatusUpdate("PENDING")}
                className="h-12 px-4 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                title="Yanlışlıkla alındıysa sıraya geri al"
              >
                <span>↩ Sıraya Geri Al</span>
              </Button>
              <Button
                type="button"
                onClick={() => handleStatusUpdate("COMPLETED")}
                className="h-12 px-6 rounded-2xl text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 cursor-pointer"
              >
                <CheckCircle2 size={16} />
                <span>İşi Tamamla & Teslime Hazırla</span>
              </Button>
            </div>
          )}

          {order.status === "COMPLETED" && (
            <div className="flex items-center gap-2 flex-1 md:flex-initial">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleStatusUpdate("IN_PROGRESS")}
                className="h-12 px-4 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                title="İşi tekrar lifte geri al"
              >
                <span>↩ Lifte Geri Al</span>
              </Button>
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>İşlem Tamamlandı • Faturaya Hazır</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Services & Parts */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION 1: SERVICES & LABOR */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Wrench size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Yapılan İşlemler & İşçilikler ({order.services.length})
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Atanan Teknisyen: {order.assignedMechanicName} • {order.assignedLift}
                  </p>
                </div>
              </div>

              {!isOrderLocked ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsAddingService(!isAddingService)}
                  className="h-8 px-3 text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>İşçilik Ekle</span>
                </Button>
              ) : (
                <span className="text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                  Kilitli
                </span>
              )}
            </div>

            {/* Inline Add Service Form */}
            {isAddingService && !isOrderLocked && (
              <form onSubmit={handleAddService} className="p-3.5 rounded-2xl bg-sky-500/5 border border-sky-500/20 flex flex-col sm:flex-row gap-2 items-center animate-in fade-in duration-200">
                <input
                  type="text"
                  placeholder="İşlem adı (Örn: Arka Balata Değişimi)..."
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="flex-1 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs w-full"
                  required
                />
                <input
                  type="number"
                  placeholder="İşçilik (TL)"
                  value={newServicePrice}
                  onChange={(e) => setNewServicePrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full sm:w-28 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                  required
                />
                <div className="flex gap-1.5 self-end sm:self-auto">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingService(false)} className="h-9 text-xs">
                    Vazgeç
                  </Button>
                  <Button type="submit" size="sm" className="h-9 px-3.5 text-xs font-bold">
                    Kaydet
                  </Button>
                </div>
              </form>
            )}

            {/* Services Table */}
            <div className="space-y-2">
              {order.services.length === 0 ? (
                <p className="text-center py-4 text-xs text-slate-400 italic">
                  Henüz işçilik veya işlem girilmedi.
                </p>
              ) : (
                order.services.map((srv) => {
                  const isEditingThis = editingService?.id === srv.id

                  if (isEditingThis) {
                    return (
                      <form
                        key={srv.id}
                        onSubmit={handleSaveEditService}
                        className="p-3 rounded-2xl bg-sky-500/5 border border-sky-500/30 flex flex-col sm:flex-row gap-2 items-center text-xs animate-in fade-in duration-200"
                      >
                        <input
                          type="text"
                          value={editingService.name}
                          onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                          className="flex-1 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs w-full"
                          required
                          autoFocus
                        />
                        <input
                          type="number"
                          value={editingService.laborPrice}
                          onChange={(e) => setEditingService({ ...editingService, laborPrice: Number(e.target.value) })}
                          className="w-full sm:w-28 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                          required
                          min={0}
                        />
                        <div className="flex gap-1.5 self-end sm:self-auto">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingService(null)}
                            disabled={isUpdatingService}
                            className="h-9 text-xs"
                          >
                            Vazgeç
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={isUpdatingService || !editingService.name.trim()}
                            className="h-9 px-3.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white"
                          >
                            {isUpdatingService ? (
                              <Loader2 size={13} className="animate-spin mr-1" />
                            ) : (
                              <Check size={13} className="mr-1" />
                            )}
                            <span>Kaydet</span>
                          </Button>
                        </div>
                      </form>
                    )
                  }

                  return (
                    <div
                      key={srv.id}
                      className="p-3 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between text-xs gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-4 h-4 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                          <CheckCircle2 size={13} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{srv.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">~{srv.durationMinutes} dakika</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                          {srv.laborPrice.toLocaleString("tr-TR")} ₺
                        </span>
                        {!isOrderLocked && (
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleStartEditService({ id: srv.id, name: srv.name, laborPrice: srv.laborPrice })}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors cursor-pointer"
                              title="İşçiliği Düzenle"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              disabled={deletingItemId === srv.id}
                              onClick={() => handleRemoveItem(srv.id, srv.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-50"
                              title="İşçiliği Sil"
                            >
                              {deletingItemId === srv.id ? (
                                <Loader2 size={13} className="animate-spin text-rose-500" />
                              ) : (
                                <Trash2 size={13} />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* SECTION 2: PARTS & MATERIALS */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Receipt size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Kullanılan Yedek Parçalar & Sarf Malzeme ({order.parts.length})
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Stoktan düşecek orijinal ve muadil parçalar
                  </p>
                </div>
              </div>

              {!isOrderLocked ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsAddingPart(!isAddingPart)}
                  className="h-8 px-3 text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Parça Ekle</span>
                </Button>
              ) : (
                <span className="text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                  Kilitli
                </span>
              )}
            </div>

            {/* Inline Add Part Form */}
            {isAddingPart && !isOrderLocked && (
              <form onSubmit={handleAddPart} className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-3 animate-in fade-in duration-200">
                {/* Source Selection Tabs */}
                <div className="flex items-center justify-between pb-2 border-b border-indigo-500/10">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomPartMode(false)
                        setSelectedProduct(null)
                        setProductSearch("")
                        setNewPartName("")
                        setNewPartNumber("")
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                        !isCustomPartMode
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                      }`}
                    >
                      <Boxes size={13} />
                      <span>Depo Stoğundan Seç</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomPartMode(true)
                        setSelectedProduct(null)
                        setProductSearch("")
                        setNewPartName("")
                        setNewPartNumber("")
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                        isCustomPartMode
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                      }`}
                    >
                      <ExternalLink size={13} />
                      <span>Dış Tedarik / Serbest Giriş</span>
                    </button>
                  </div>

                  {!isCustomPartMode && (
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
                      <Package size={12} />
                      <span>Otomatik Stok Düşümü Aktif</span>
                    </span>
                  )}
                </div>

                {!isCustomPartMode ? (
                  /* Autocomplete Dropdown Mode */
                  <div className="space-y-2">
                    <div className="relative">
                      <div className="relative flex items-center">
                        <Search size={14} className="absolute left-3 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Depoda parça adı, OEM kodu veya barkod ile arayın..."
                          value={productSearch}
                          onFocus={() => setIsSearchOpen(true)}
                          onChange={(e) => {
                            setProductSearch(e.target.value)
                            setIsSearchOpen(true)
                          }}
                          className="w-full h-9.5 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>

                      {/* Dropdown Results */}
                      {isSearchOpen && (
                        <div className="absolute left-0 right-0 top-11 z-50 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-h-60 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95">
                          {filteredProducts.length === 0 ? (
                            <div className="p-4 text-center">
                              <p className="text-xs text-slate-500">Depoda eşleşen parça bulunamadı.</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsCustomPartMode(true)
                                  setNewPartName(productSearch)
                                  setIsSearchOpen(false)
                                }}
                                className="mt-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                              >
                                Dış tedarik olarak serbest ekle
                              </button>
                            </div>
                          ) : (
                            filteredProducts.map((p) => {
                              const isOutOfStock = p.stockQuantity <= 0
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => handleSelectProduct(p)}
                                  className="w-full p-2.5 rounded-xl text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                        {p.name}
                                      </p>
                                      {p.oemCode && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                          {p.oemCode}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                      Kod: {p.code} {p.shelfLocation ? `• Raf: ${p.shelfLocation}` : ""}
                                    </p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                        isOutOfStock
                                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                      }`}
                                    >
                                      {isOutOfStock ? "Tükendi" : `Stok: ${p.stockQuantity}`}
                                    </span>
                                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                                      {p.salePrice.toLocaleString("tr-TR")} ₺
                                    </p>
                                  </div>
                                </button>
                              )
                            })
                          )}
                        </div>
                      )}
                    </div>

                    {/* Selected Product Banner */}
                    {selectedProduct && (
                      <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {selectedProduct.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-mono">
                            Raf: {selectedProduct.shelfLocation || "Genel"}
                          </span>
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                            Mevcut Stok: {selectedProduct.stockQuantity}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProduct(null)
                            setProductSearch("")
                            setNewPartName("")
                            setNewPartNumber("")
                          }}
                          className="text-[11px] text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          Seçimi Kaldır
                        </button>
                      </div>
                    )}

                    {/* Low/Insufficient Stock Warning */}
                    {selectedProduct && newPartQty > selectedProduct.stockQuantity && (
                      <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-1.5">
                        <AlertTriangle size={14} className="shrink-0" />
                        <span>
                          Dikkat: Girilen miktar ({newPartQty}) mevcut depo stoğunu ({selectedProduct.stockQuantity}) aşıyor!
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Custom Part Free-Text Mode */
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Parça Adı (Örn: Bosch Ön Balata)..."
                        value={newPartName}
                        onChange={(e) => setNewPartName(e.target.value)}
                        className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Parça No / OEM Kodu..."
                        value={newPartNumber}
                        onChange={(e) => setNewPartNumber(e.target.value)}
                        className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono uppercase focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 italic">
                      * Bu parça depoda kayıtlı değildir; yalnızca bu iş emrine sarfiyat olarak eklenecektir.
                    </p>
                  </div>
                )}

                {/* Quantity, Price and Actions */}
                <div className="flex flex-col sm:flex-row gap-2 items-center justify-between pt-1">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Adet</label>
                      <input
                        type="number"
                        min={1}
                        placeholder="Adet"
                        value={newPartQty}
                        onChange={(e) => setNewPartQty(Math.max(1, Number(e.target.value)))}
                        className="w-20 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono text-center font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Birim Fiyat (TL)</label>
                      <input
                        type="number"
                        placeholder="Birim Fiyat (TL)"
                        value={newPartPrice}
                        onChange={(e) => setNewPartPrice(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-32 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                        required
                      />
                    </div>
                    <div className="pt-3.5 text-xs text-slate-500 font-mono">
                      Toplam: <strong className="text-slate-900 dark:text-slate-100">{(Number(newPartQty || 1) * Number(newPartPrice || 0)).toLocaleString("tr-TR")} ₺</strong>
                    </div>
                  </div>
                  <div className="flex gap-1.5 self-end sm:self-auto pt-3 sm:pt-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsAddingPart(false)
                        setSelectedProduct(null)
                        setProductSearch("")
                      }}
                      className="h-9 text-xs"
                    >
                      Vazgeç
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="h-9 px-4 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                    >
                      Parçayı Ekle
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {/* Parts List */}
            <div className="space-y-2">
              {order.parts.length === 0 ? (
                <p className="text-center py-5 text-xs text-slate-400 italic">
                  Henüz parça sarfiyatı girilmedi.
                </p>
              ) : (
                order.parts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {p.partNumber} • Birim: {p.unitPrice.toLocaleString("tr-TR")} ₺
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      {/* Quantity Stepper */}
                      {!isOrderLocked ? (
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xs">
                          <button
                            type="button"
                            disabled={p.quantity <= 1 || updatingItemId === p.id}
                            onClick={() => handleUpdateQuantity(p.id, p.quantity - 1)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                            title="Adet Azalt (Stoğa iade et)"
                          >
                            <Minus size={12} />
                          </button>

                          <div className="w-9 text-center font-mono font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center justify-center">
                            {updatingItemId === p.id ? (
                              <Loader2 size={13} className="animate-spin text-indigo-500" />
                            ) : (
                              <span>{p.quantity}</span>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={updatingItemId === p.id}
                            onClick={() => handleUpdateQuantity(p.id, p.quantity + 1)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                            title="Adet Artır (Stoktan düş)"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      ) : (
                        <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-400">
                          {p.quantity} Adet
                        </span>
                      )}

                      {/* Total Price */}
                      <div className="text-right min-w-[70px]">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                          {p.totalPrice.toLocaleString("tr-TR")} ₺
                        </span>
                      </div>

                      {/* Remove Button */}
                      {!isOrderLocked && (
                        <button
                          type="button"
                          disabled={deletingItemId === p.id}
                          onClick={() => handleRemoveItem(p.id, p.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-50"
                          title="Kalemi Kaldır & Stoğa İade Et"
                        >
                          {deletingItemId === p.id ? (
                            <Loader2 size={14} className="animate-spin text-rose-500" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECTION 3: PHOTOS */}
          <PhotoGallery
            photos={order.photos}
            onUploadPhoto={handleUploadPhoto}
            onUpdatePhoto={handleUpdatePhoto}
            onDeletePhoto={handleDeletePhoto}
            isLocked={isOrderLocked}
          />
        </div>

        {/* Right 1 Column: Cost Summary Card & Technician Notes */}
        <div className="space-y-6">
          {/* Live Cost Summary Card */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Receipt size={16} />
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Maliyet & Fatura Dökümü
              </h3>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>İşçilik Toplamı:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{order.laborTotal.toLocaleString("tr-TR")} ₺</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Yedek Parça Toplamı:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{order.partsTotal.toLocaleString("tr-TR")} ₺</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>KDV (%20):</span>
                <span>{Math.round((order.laborTotal + order.partsTotal) * 0.20).toLocaleString("tr-TR")} ₺</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-sm font-black text-sky-600 dark:text-sky-400">
                <span className="font-sans text-slate-900 dark:text-slate-100">GENEL TOPLAM:</span>
                <span>{order.grandTotal.toLocaleString("tr-TR")} ₺</span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                className="w-full h-11 rounded-xl text-xs font-bold gap-2 cursor-pointer"
                onClick={() => router.push("/invoices")}
              >
                <FileText size={15} />
                <span>Fatura Oluştur (Tahsilat)</span>
              </Button>
            </div>
          </div>

          {/* Internal Technician Notes Stream */}
          <TechnicianNotes
            notes={order.notes}
            onAddNote={handleAddNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            isLocked={isOrderLocked}
          />
        </div>
      </div>
    </div>
  )
}