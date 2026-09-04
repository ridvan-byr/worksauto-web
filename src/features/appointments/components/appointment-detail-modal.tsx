"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  X,
  Calendar,
  Clock,
  Car,
  User,
  Phone,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Play,
  CalendarClock,
  Ban,
  UserX,
  ArrowRight,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Appointment, CancellationReason } from "../types"
import { AppointmentStatusBadge } from "./appointment-status-badge"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { cn } from "@/lib/utils"

interface AppointmentDetailModalProps {
  isOpen: boolean
  appointment: Appointment | null
  onClose: () => void
  onConvertToWorkOrder: (id: string) => { success: boolean; workOrderNumber: string }
  onReschedule: (id: string, newDate: string, newTime: string) => void
  onCancel: (id: string, reason: CancellationReason, note?: string) => void
  onMarkNoShow: (id: string) => void
}

export function AppointmentDetailModal({
  isOpen,
  appointment,
  onClose,
  onConvertToWorkOrder,
  onReschedule,
  onCancel,
  onMarkNoShow,
}: AppointmentDetailModalProps) {
  const [mounted, setMounted] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<"detail" | "reschedule" | "cancel">("detail")
  
  // Reschedule State
  const [rescheduleDate, setRescheduleDate] = React.useState("")
  const [rescheduleTime, setRescheduleTime] = React.useState("")

  // Cancel State
  const [cancelReason, setCancelReason] = React.useState<CancellationReason>("CUSTOMER_REQUEST")
  const [cancelNote, setCancelNote] = React.useState("")

  // Success Work Order Banner
  const [createdWONumber, setCreatedWONumber] = React.useState<string | null>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (appointment) {
      setRescheduleDate(appointment.date)
      setRescheduleTime(appointment.time)
      setCreatedWONumber(appointment.workOrderNumber || null)
      setViewMode("detail")
    }
  }, [appointment])

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = "auto"
      }
    }
  }, [isOpen])

  if (!isOpen || !mounted || !appointment) return null

  const handleStartWorkOrder = () => {
    const res = onConvertToWorkOrder(appointment.id)
    if (res.success) {
      setCreatedWONumber(res.workOrderNumber)
    }
  }

  const handleConfirmReschedule = () => {
    onReschedule(appointment.id, rescheduleDate, rescheduleTime)
    setViewMode("detail")
  }

  const handleConfirmCancel = () => {
    onCancel(appointment.id, cancelReason, cancelNote)
    setViewMode("detail")
  }

  const handleConfirmNoShow = () => {
    onMarkNoShow(appointment.id)
    onClose()
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <PlateBadge plate={appointment.plate} size="md" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {appointment.brand} {appointment.model}
              </h2>
              <p className="text-[11px] text-slate-500">
                Randevu Ref: {appointment.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AppointmentStatusBadge status={appointment.status} />
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* VIEW 1: NORMAL DETAILS */}
        {viewMode === "detail" && (
          <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Success Work Order Banner */}
            {createdWONumber && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 space-y-2 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold">Atölye İş Emri Başlatıldı!</p>
                    <p className="text-[11px] opacity-90">
                      İş Emri Numarası: <strong className="font-mono">{createdWONumber}</strong> • Araç kabulü tamamlandı ve usta panosuna aktarıldı.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Customer Contact Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {appointment.customerName}
                  </p>
                  <a href={`tel:${appointment.customerPhone}`} className="text-[11px] text-slate-500 hover:text-sky-500 font-mono flex items-center gap-1">
                    <Phone size={11} />
                    <span>{appointment.customerPhone}</span>
                  </a>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Tarih & Saat</span>
                <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                  {appointment.date} {appointment.time}
                </span>
              </div>
            </div>

            {/* Assigned Mechanic */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 text-xs">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Wrench size={14} className="text-sky-500" />
                <span>Atanan Teknisyen: <strong>{appointment.assignedStaffName || "Atama Bekliyor"}</strong></span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">~{appointment.totalDurationMinutes} dk</span>
            </div>

            {/* Services List */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Yapılacak Hizmetler & Taban İşçilik
              </p>
              <div className="space-y-1">
                {appointment.services.map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs"
                  >
                    <span>{s.name}</span>
                    <span className="font-bold font-mono text-sky-600 dark:text-sky-400">
                      {s.price.toLocaleString("tr-TR")} ₺
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center px-1 text-xs pt-1 font-bold">
                <span className="text-slate-500">Tahmini Toplam:</span>
                <span className="font-mono text-sm text-slate-900 dark:text-slate-100">
                  {appointment.totalEstimatedPrice.toLocaleString("tr-TR")} ₺
                </span>
              </div>
            </div>

            {/* Customer Note */}
            {appointment.customerNote && (
              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs space-y-0.5">
                <span className="font-bold block text-[10px] uppercase text-amber-600 dark:text-amber-400">Müşteri Notu:</span>
                <p className="text-[11px]">{appointment.customerNote}</p>
              </div>
            )}

            {/* PRIMARY ONE-CLICK ACTION: START WORK ORDER */}
            {appointment.status !== "CANCELLED" && appointment.status !== "NO_SHOW" && !createdWONumber && (
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={handleStartWorkOrder}
                  className="w-full h-12 rounded-2xl text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 cursor-pointer"
                >
                  <Play size={16} fill="currentColor" />
                  <span>Randevuyu Onayla & Atölye İş Emrini Başlat</span>
                </Button>
              </div>
            )}

            {/* SECONDARY ACTIONS: Reschedule, Cancel, No-Show */}
            {appointment.status !== "CANCELLED" && appointment.status !== "NO_SHOW" && (
              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode("reschedule")}
                  className="py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CalendarClock size={13} />
                  <span>Ertele</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("cancel")}
                  className="py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Ban size={13} />
                  <span>İptal Et</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmNoShow}
                  className="py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserX size={13} />
                  <span>Gelmedi</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: RESCHEDULE FORM */}
        {viewMode === "reschedule" && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CalendarClock size={16} className="text-purple-500" />
                <span>Randevu Saatini Ertele</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Müşteri ile teyit edilen yeni tarih ve saati belirleyin.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Yeni Tarih</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Yeni Saat</label>
                <input
                  type="time"
                  step={1800}
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setViewMode("detail")}
                className="h-9 px-3 text-xs font-semibold cursor-pointer"
              >
                Geri
              </Button>
              <Button
                type="button"
                onClick={handleConfirmReschedule}
                className="h-9 px-4 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
              >
                Yeni Saati Onayla
              </Button>
            </div>
          </div>
        )}

        {/* VIEW 3: CANCEL FORM */}
        {viewMode === "cancel" && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <Ban size={16} />
                <span>Randevu İptali</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Lütfen sistem standardına uygun iptal gerekçesini seçin.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">İptal Nedeni</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value as CancellationReason)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
              >
                <option value="CUSTOMER_REQUEST">Müşteri vazgeçti / randevuyu iptal etti</option>
                <option value="PARTS_UNAVAILABLE">Gerekli yedek parça temin edilemedi</option>
                <option value="CAPACITY_FULL">Servis atölye lift kapasitesi dolu</option>
                <option value="PRICE_DISAGREEMENT">Fiyat konusunda anlaşılamadı</option>
                <option value="OTHER">Diğer gerekçe</option>
              </select>

              <textarea
                rows={2}
                placeholder="İsteğe bağlı ek açıklama..."
                value={cancelNote}
                onChange={(e) => setCancelNote(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setViewMode("detail")}
                className="h-9 px-3 text-xs font-semibold cursor-pointer"
              >
                Geri
              </Button>
              <Button
                type="button"
                onClick={handleConfirmCancel}
                className="h-9 px-4 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                Randevuyu İptal Et
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
