"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Wrench,
  User,
  Phone,
  Car,
  Clock,
  CheckCircle2,
  Play,
  Plus,
  Trash2,
  Sparkles,
  Receipt,
  AlertCircle,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { WorkOrderStatusBadge } from "@/features/work-orders/components/work-order-status-badge"
import { TechnicianNotes } from "@/features/work-orders/components/technician-notes"
import { PhotoGallery } from "@/features/work-orders/components/photo-gallery"
import {
  getWorkOrderById,
  updateWorkOrderStatus,
  addServiceToWorkOrder,
  addPartToWorkOrder,
  addNoteToWorkOrder,
  addPhotoToWorkOrder,
} from "@/features/work-orders/mock-data"
import { WorkOrder, WorkOrderStatus } from "@/features/work-orders/types"
import { cn } from "@/lib/utils"

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

  React.useEffect(() => {
    const found = getWorkOrderById(id)
    if (found) {
      setOrder(found)
    }
  }, [id])

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

  const handleStatusUpdate = (status: WorkOrderStatus) => {
    const updated = updateWorkOrderStatus(order.id, status)
    setOrder(updated)
  }

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newServiceName.trim() || newServicePrice === "") return
    const updated = addServiceToWorkOrder(order.id, {
      name: newServiceName.trim(),
      durationMinutes: 45,
      laborPrice: Number(newServicePrice),
      completed: false,
      mechanicName: order.assignedMechanicName,
    })
    setOrder(updated)
    setNewServiceName("")
    setIsAddingService(false)
  }

  const handleAddPart = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPartName.trim() || newPartPrice === "") return
    const updated = addPartToWorkOrder(order.id, {
      name: newPartName.trim(),
      partNumber: newPartNumber.trim().toUpperCase() || "GENERIC-PART",
      quantity: Number(newPartQty) || 1,
      unitPrice: Number(newPartPrice),
    })
    setOrder(updated)
    setNewPartName("")
    setNewPartNumber("")
    setIsAddingPart(false)
  }

  const handleAddNote = (text: string) => {
    const updated = addNoteToWorkOrder(order.id, text, order.assignedMechanicName || "Usta")
    setOrder(updated)
  }

  const handleAddPhoto = (caption: string, type: "CHECKIN" | "DAMAGE" | "COMPLETED") => {
    const updated = addPhotoToWorkOrder(order.id, {
      url: "/assets/brand/preview.html",
      caption,
      uploaderName: order.assignedMechanicName || "Usta",
      type,
    })
    setOrder(updated)
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

              <Button
                type="button"
                size="sm"
                onClick={() => setIsAddingService(!isAddingService)}
                className="h-8 px-3 text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <Plus size={13} />
                <span>İşçilik Ekle</span>
              </Button>
            </div>

            {/* Inline Add Service Form */}
            {isAddingService && (
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
              {order.services.map((srv) => (
                <div
                  key={srv.id}
                  className="p-3 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 size={13} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{srv.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">~{srv.durationMinutes} dakika</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                      {srv.laborPrice.toLocaleString("tr-TR")} ₺
                    </span>
                  </div>
                </div>
              ))}
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

              <Button
                type="button"
                size="sm"
                onClick={() => setIsAddingPart(!isAddingPart)}
                className="h-8 px-3 text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <Plus size={13} />
                <span>Parça Ekle</span>
              </Button>
            </div>

            {/* Inline Add Part Form */}
            {isAddingPart && (
              <form onSubmit={handleAddPart} className="p-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-2 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Parça Adı (Örn: Bosch Ön Balata)..."
                    value={newPartName}
                    onChange={(e) => setNewPartName(e.target.value)}
                    className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Parça No / OEM Kodu..."
                    value={newPartNumber}
                    onChange={(e) => setNewPartNumber(e.target.value)}
                    className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono uppercase"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="number"
                      min={1}
                      placeholder="Adet"
                      value={newPartQty}
                      onChange={(e) => setNewPartQty(Number(e.target.value))}
                      className="w-20 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono text-center"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Birim Fiyat (TL)"
                      value={newPartPrice}
                      onChange={(e) => setNewPartPrice(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-32 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                      required
                    />
                  </div>
                  <div className="flex gap-1.5 self-end sm:self-auto">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingPart(false)} className="h-9 text-xs">
                      Vazgeç
                    </Button>
                    <Button type="submit" size="sm" className="h-9 px-3.5 text-xs font-bold">
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
                    className="p-3 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {p.partNumber} • {p.quantity} Adet × {p.unitPrice.toLocaleString("tr-TR")} ₺
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                        {p.totalPrice.toLocaleString("tr-TR")} ₺
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECTION 3: PHOTOS */}
          <PhotoGallery photos={order.photos} onAddPhoto={handleAddPhoto} />
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
          <TechnicianNotes notes={order.notes} onAddNote={handleAddNote} />
        </div>
      </div>
    </div>
  )
}
