"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import {
  X,
  User,
  Phone,
  Wrench,
  CheckCircle2,
  Play,
  CalendarClock,
  Ban,
  UserX,
  Gauge,
  Fuel,
  Warehouse,
  ExternalLink,
  AlertTriangle,
  MessageSquare,
  Send,
  Mail,
  Smartphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Appointment, CancellationReason } from "../types"
import { AppointmentStatusBadge } from "./appointment-status-badge"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { useStaff, useWorkshopBays } from "@/features/settings/api/use-settings"
import { useStaffLeaves } from "@/features/staff/api/use-staff-management"
import { formatBayOptionLabel } from "@/lib/workshop-constants"
import { cn } from "@/lib/utils"

export interface CheckInFormData {
  initialKm: number
  fuelLevel?: string
  assignedMechanicId?: string
  assignedLift?: string
}

const RESCHEDULE_EARLIER_REASONS = [
  { id: "customer_request", label: "Müşteri erken teslim / giriş talep etti", icon: "📞" },
  { id: "bay_available", label: "Erken boşalan lift & teknisyen imkanı", icon: "⚡" },
  { id: "parts_ready", label: "Yedek parçalar erkenden temin edildi", icon: "📦" },
  { id: "custom", label: "Diğer (Özel Gerekçe)", icon: "✏️" },
]

const RESCHEDULE_POSTPONE_REASONS = [
  { id: "parts", label: "Yedek parça tedarik süreci", icon: "📦" },
  { id: "repair_delay", label: "Önceki araç onarımı uzadı", icon: "🔧" },
  { id: "customer_request", label: "Müşteri erteleme talep etti", icon: "📞" },
  { id: "bay_busy", label: "Atölye / Lift yoğunluğu", icon: "👨‍🔧" },
  { id: "custom", label: "Diğer (Özel Gerekçe)", icon: "✏️" },
]

const CANCELLATION_REASON_LABELS: Record<string, string> = {
  CUSTOMER_REQUEST: "Müşteri randevuyu iptal etti / vazgeçti",
  PARTS_UNAVAILABLE: "Gerekli yedek parça temin edilemedi",
  CAPACITY_FULL: "Servis atölye lift kapasitesi dolu",
  PRICE_DISAGREEMENT: "Fiyat konusunda anlaşılamadı",
  OTHER: "Diğer gerekçe",
}

interface AppointmentDetailModalProps {
  isOpen: boolean
  appointment: Appointment | null
  onClose: () => void
  onConvertToWorkOrder: (
    id: string,
    checkInData: CheckInFormData
  ) => Promise<{ success: boolean; workOrderNumber: string; workOrderId?: string }> | { success: boolean; workOrderNumber: string; workOrderId?: string }
  onReschedule: (
    id: string,
    newDate: string,
    newTime: string,
    reason?: string,
    notifyCustomer?: boolean,
    channels?: ("WHATSAPP" | "SMS" | "EMAIL")[]
  ) => void
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
  const router = useRouter()
  const [mounted, setMounted] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<"detail" | "checkin" | "reschedule" | "cancel">("detail")

  // Staff & Bays for Workshop Assignment
  const { data: staffList = [] } = useStaff()
  const { data: bays = [] } = useWorkshopBays()

  const mechanics = React.useMemo(() => {
    return staffList.filter((s) => {
      if (s.isActive === false) return false
      if (s.role === "OWNER" || s.role === "CASHIER" || s.role === "SUPER_ADMIN") {
        return !!s.mechanic
      }
      return s.role === "TECHNICIAN" || !!s.mechanic
    })
  }, [staffList])

  const { data: staffLeaves = [] } = useStaffLeaves()
  const onLeaveStaffIds = React.useMemo(() => {
    const today = new Date().toISOString().split("T")[0]
    const ids = new Set<string>()
    staffLeaves.forEach((l) => {
      if (l.status === "CANCELLED") return
      const start = l.startDate.split("T")[0]
      const end = l.endDate.split("T")[0]
      if (today >= start && today <= end) {
        ids.add(l.userId)
      }
    })
    return ids
  }, [staffLeaves])

  // Check-In Form State
  const [initialKm, setInitialKm] = React.useState<number | "">("")
  const [fuelLevel, setFuelLevel] = React.useState<string>("")
  const [assignedMechanicId, setAssignedMechanicId] = React.useState<string>("")
  const [assignedLift, setAssignedLift] = React.useState<string>("")
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = React.useState(false)

  // Reschedule State
  const [rescheduleDate, setRescheduleDate] = React.useState("")
  const [rescheduleTime, setRescheduleTime] = React.useState("")
  const [rescheduleReasonChip, setRescheduleReasonChip] = React.useState("parts")
  const [rescheduleCustomReason, setRescheduleCustomReason] = React.useState("Yedek parça tedarik süreci")
  const [notifyCustomerOnReschedule, setNotifyCustomerOnReschedule] = React.useState(true)
  const [selectedChannels, setSelectedChannels] = React.useState<("WHATSAPP" | "SMS" | "EMAIL")[]>(["WHATSAPP", "EMAIL"])

  // Detect whether appointment is being moved earlier or later
  const isRescheduleEarlier = React.useMemo(() => {
    if (!appointment?.date || !appointment?.time || !rescheduleDate || !rescheduleTime) return false
    try {
      const oldDateTime = `${appointment.date}T${appointment.time.slice(0, 5)}`
      const newDateTime = `${rescheduleDate}T${rescheduleTime.slice(0, 5)}`
      return newDateTime < oldDateTime
    } catch {
      return false
    }
  }, [appointment, rescheduleDate, rescheduleTime])

  const activeRescheduleReasons = isRescheduleEarlier
    ? RESCHEDULE_EARLIER_REASONS
    : RESCHEDULE_POSTPONE_REASONS

  const prevRescheduleEarlierRef = React.useRef(isRescheduleEarlier)
  React.useEffect(() => {
    if (viewMode === "reschedule" && prevRescheduleEarlierRef.current !== isRescheduleEarlier) {
      prevRescheduleEarlierRef.current = isRescheduleEarlier
      if (isRescheduleEarlier) {
        setRescheduleReasonChip("customer_request")
        setRescheduleCustomReason("Müşteri erken teslim / giriş talep etti")
      } else {
        setRescheduleReasonChip("parts")
        setRescheduleCustomReason("Yedek parça tedarik süreci")
      }
    }
  }, [isRescheduleEarlier, viewMode])

  const todayStr = React.useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }, [])

  const currentTimeStr = React.useMemo(() => {
    const d = new Date()
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  }, [])

  // Cancel State
  const [cancelReason, setCancelReason] = React.useState<CancellationReason>("CUSTOMER_REQUEST")
  const [cancelNote, setCancelNote] = React.useState("")

  // Success Work Order Banner State
  const [createdWONumber, setCreatedWONumber] = React.useState<string | null>(null)
  const [createdWorkOrderId, setCreatedWorkOrderId] = React.useState<string | null>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (appointment) {
      setRescheduleDate(appointment.date)
      setRescheduleTime(appointment.time)
      setRescheduleReasonChip("parts")
      setRescheduleCustomReason("Yedek parça tedarik süreci")
      const hasPhone = Boolean(appointment.customerPhone)
      const hasEmail = Boolean(appointment.customerEmail)
      setNotifyCustomerOnReschedule(hasPhone || hasEmail)
      const defaultChannels: ("WHATSAPP" | "SMS" | "EMAIL")[] = []
      if (hasPhone) defaultChannels.push("WHATSAPP")
      if (hasEmail) defaultChannels.push("EMAIL")
      if (defaultChannels.length === 0 && hasPhone) defaultChannels.push("SMS")
      setSelectedChannels(defaultChannels.length > 0 ? defaultChannels : ["WHATSAPP"])
      setCreatedWONumber(appointment.workOrderNumber || null)
      setCreatedWorkOrderId(appointment.workOrderId || null)
      setAssignedMechanicId(appointment.assignedStaffId || "")
      setAssignedLift("")
      setInitialKm(appointment.currentKm && appointment.currentKm > 0 ? appointment.currentKm : "")
      setFuelLevel("")
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

  const handleConfirmCheckIn = async () => {
    const kmValue = initialKm === "" ? (appointment.currentKm || 0) : Number(initialKm)
    if (kmValue < 0) {
      toast.error("Kilometre 0'dan küçük olamaz.")
      return
    }

    setIsSubmittingCheckIn(true)
    try {
      const res = await onConvertToWorkOrder(appointment.id, {
        initialKm: kmValue,
        fuelLevel: fuelLevel || undefined,
        assignedMechanicId: assignedMechanicId || undefined,
        assignedLift: assignedLift || undefined,
      })

      if (res.success) {
        setCreatedWONumber(res.workOrderNumber)
        if (res.workOrderId) {
          setCreatedWorkOrderId(res.workOrderId)
        }
        setViewMode("detail")
      }
    } finally {
      setIsSubmittingCheckIn(false)
    }
  }

  const toggleChannel = (ch: "WHATSAPP" | "SMS" | "EMAIL") => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    )
  }

  const handleConfirmReschedule = () => {
    if (!rescheduleDate || !rescheduleTime) {
      toast.error("Lütfen yeni tarih ve saat seçiniz.")
      return
    }

    const [h, m] = rescheduleTime.split(":").map(Number)
    const [yr, mo, dy] = rescheduleDate.split("-").map(Number)
    const targetDt = new Date(yr, mo - 1, dy, h || 0, m || 0, 0, 0)
    if (targetDt.getTime() < Date.now()) {
      toast.error(isRescheduleEarlier ? "Geçmiş bir tarih veya saate randevu erkene alınamaz." : "Geçmiş bir tarih veya saate randevu ertelenemez.")
      return
    }
    const selectedObj = activeRescheduleReasons.find((r) => r.id === rescheduleReasonChip)
    const finalReason =
      rescheduleReasonChip === "custom"
        ? rescheduleCustomReason.trim() || "Randevu saati güncellendi"
        : selectedObj?.label || rescheduleCustomReason.trim()

    onReschedule(
      appointment.id,
      rescheduleDate,
      rescheduleTime,
      finalReason,
      notifyCustomerOnReschedule && selectedChannels.length > 0,
      selectedChannels
    )
    toast.success(
      "Randevu saati güncellendi" +
        (notifyCustomerOnReschedule && selectedChannels.length > 0
          ? ` ve müşteriye bildirim (${selectedChannels.join(", ")}) iletildi.`
          : ".")
    )
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
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <PlateBadge plate={appointment.plate} size="md" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {appointment.brand} {appointment.model}
              </h2>
              <p className="text-[11px] text-slate-500 font-mono">
                Randevu Ref: {appointment.id.slice(0, 8)}
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
            {/* 1. İPTAL EDİLDİ BANNERI (Rose / Kırmızı) */}
            {appointment.status === "CANCELLED" && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 space-y-2 animate-in zoom-in-95 duration-200">
                <div className="flex items-start gap-2.5">
                  <Ban size={18} className="text-rose-500 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-rose-800 dark:text-rose-200">Bu Randevu İptal Edildi</p>
                    {appointment.cancellationReason && (
                      <p className="text-[11px] opacity-90">
                        İptal Gerekçesi:{" "}
                        <strong className="font-semibold text-rose-900 dark:text-rose-100">
                          {CANCELLATION_REASON_LABELS[appointment.cancellationReason] || appointment.cancellationReason}
                        </strong>
                      </p>
                    )}
                    {createdWONumber && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-mono">
                        Bağlı olan iş emri ({createdWONumber}) de randevuyla birlikte iptal edildi.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 2. GELMEDİ (NO-SHOW) BANNERI (Amber / Turuncu) */}
            {appointment.status === "NO_SHOW" && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 space-y-1 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2.5">
                  <UserX size={18} className="text-amber-500 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold">Müşteri Randevuya Gelmedi</p>
                    <p className="text-[11px] opacity-90">
                      Müşteri planlanan saatte servise giriş yapmadığı için randevu kapatıldı.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. AKTİF İŞ EMRİ BAŞARI BANNERI (Yalnızca İptal / Gelmedi Değilse) */}
            {appointment.status !== "CANCELLED" && appointment.status !== "NO_SHOW" && createdWONumber && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 space-y-2.5 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold">Atölye İş Emri Başlatıldı!</p>
                    <p className="text-[11px] opacity-90">
                      İş Emri No: <strong className="font-mono text-emerald-800 dark:text-emerald-200">{createdWONumber}</strong> • Araç kabulü tamamlandı ve usta panosuna aktarıldı.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {createdWorkOrderId && (
                    <button
                      type="button"
                      onClick={() => router.push(`/work-orders/${createdWorkOrderId}`)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <ExternalLink size={13} />
                      <span>İş Emrini Gör</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => router.push("/work-orders")}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Atölye Panosu
                  </button>
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
                  onClick={() => setViewMode("checkin")}
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

        {/* VIEW 2: CHECK-IN & CREATE WORK ORDER FORM */}
        {viewMode === "checkin" && (
          <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Play size={16} className="text-emerald-500 fill-emerald-500" />
                  <span>Araç Kabul & İş Emrini Başlat</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Aracın güncel giriş km ve yakıt seviyesini belirleyin, gerekiyorsa usta ve lift atayın.
                </p>
              </div>
            </div>

            {/* Giriş Kilometresi */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Gauge size={13} className="text-sky-500" />
                  <span>Giriş Kilometresi</span>
                  {appointment.currentKm && appointment.currentKm > 0 ? (
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                      Son Kayıt: {appointment.currentKm.toLocaleString("tr-TR")} km
                    </span>
                  ) : null}
                </span>
                <span className="text-[10px] text-slate-400 font-normal">İsteğe Bağlı</span>
              </label>
              <input
                type="number"
                min={0}
                placeholder={
                  appointment.currentKm && appointment.currentKm > 0
                    ? `Son Bilinen: ${appointment.currentKm} km (Mevcut km korunur)`
                    : "Bilinmiyorsa boş bırakılabilir (Varsayılan: 0)"
                }
                value={initialKm}
                onChange={(e) => setInitialKm(e.target.value === "" ? "" : Number(e.target.value))}
                className={cn(
                  "w-full h-11 px-3.5 rounded-xl border bg-slate-50 dark:bg-slate-900 text-sm font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2",
                  appointment.currentKm && Number(initialKm) > 0 && Number(initialKm) < appointment.currentKm
                    ? "border-amber-400 focus:ring-amber-500"
                    : "border-slate-200 dark:border-slate-800 focus:ring-emerald-500"
                )}
              />
              {appointment.currentKm && Number(initialKm) > 0 && Number(initialKm) < appointment.currentKm ? (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                  <AlertTriangle size={11} className="shrink-0" />
                  <span>
                    Dikkat: Girdiğiniz km ({Number(initialKm).toLocaleString("tr-TR")}), aracın son kayıtlı kilometresinden ({appointment.currentKm.toLocaleString("tr-TR")} km) düşüktür.
                  </span>
                </p>
              ) : null}
            </div>

            {/* Yakıt Seviyesi */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Fuel size={13} className="text-amber-500" />
                  <span>Yakıt Seviyesi</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">İsteğe Bağlı</span>
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {[
                  { label: "Yok", val: "", desc: "Seçilmedi" },
                  { label: "Rezerv", val: "Rezerv", desc: "Kırmızı Işık" },
                  { label: "1/4", val: "1/4", desc: "Çeyrek" },
                  { label: "1/2", val: "1/2", desc: "Yarım" },
                  { label: "3/4", val: "3/4", desc: "3 Çeyrek" },
                  { label: "Full", val: "Full", desc: "Dolu" },
                ].map((f) => (
                  <button
                    key={f.val}
                    type="button"
                    onClick={() => setFuelLevel(f.val)}
                    className={cn(
                      "py-2 px-1 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center",
                      fuelLevel === f.val
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/30"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <span className="text-xs font-black font-mono">{f.label}</span>
                    <span
                      className={cn(
                        "text-[9px] mt-0.5 font-medium leading-tight",
                        fuelLevel === f.val ? "text-amber-100" : "text-slate-400"
                      )}
                    >
                      {f.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Usta / Teknisyen Ataması */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Wrench size={13} className="text-emerald-500" />
                  <span>Atanacak Teknisyen / Usta</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Opsiyonel / Havuz</span>
              </label>
              <select
                value={assignedMechanicId}
                onChange={(e) => setAssignedMechanicId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">⚠️ Atölye Havuzuna Bırak (Sonradan Panodan Ata)</option>
                {mechanics.map((m) => {
                  const staffUserId = m.user?.id || m.id
                  const isOnLeave = onLeaveStaffIds.has(staffUserId)
                  const spec = m.specialty || m.mechanic?.specialty || "Teknisyen"

                  return (
                    <option key={m.id} value={m.mechanic?.id || m.id} disabled={isOnLeave}>
                      {m.name} {m.surname || ""} • {spec} {isOnLeave ? "— [İzinli / Seçilemez]" : ""}
                    </option>
                  )
                })}
              </select>
              {!assignedMechanicId && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400">
                  Usta seçilmezse iş emri atölye havuzuna düşer ve panodan herhangi bir ustaya devredilebilir.
                </p>
              )}
            </div>

            {/* Lift / Peron Ataması */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Warehouse size={13} className="text-purple-500" />
                  <span>Atanacak Lift / Çalışma Alanı</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Opsiyonel</span>
              </label>
              <select
                value={assignedLift}
                onChange={(e) => setAssignedLift(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">Lift Seçilmedi (Genel Park / Kabul Alanı)</option>
                {bays.map((bay) => (
                  <option key={bay.id} value={bay.name}>
                    {formatBayOptionLabel(bay.name, bay.category)}
                  </option>
                ))}
              </select>
            </div>

            {/* Aktarılacak Hizmet Kalemleri */}
            {appointment.services.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">İş Emrine Eklenecek Hizmetler:</span>
                <div className="space-y-0.5">
                  {appointment.services.map((s) => (
                    <div key={s.id} className="flex justify-between text-[11px]">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">• {s.name}</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{s.price.toLocaleString("tr-TR")} ₺</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form Butonları */}
            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmittingCheckIn}
                onClick={() => setViewMode("detail")}
                className="h-10 px-4 text-xs font-semibold cursor-pointer"
              >
                Vazgeç / Geri
              </Button>
              <Button
                type="button"
                disabled={isSubmittingCheckIn}
                onClick={handleConfirmCheckIn}
                className="h-10 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer"
              >
                {isSubmittingCheckIn ? (
                  <span>İş Emri Açılıyor...</span>
                ) : (
                  <>
                    <Play size={14} fill="currentColor" />
                    <span>İş Emrini Başlat & Atölyeye Al</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* VIEW 3: RESCHEDULE FORM */}
        {viewMode === "reschedule" && (
          <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CalendarClock size={16} className={isRescheduleEarlier ? "text-emerald-500" : "text-purple-500"} />
                <span>{isRescheduleEarlier ? "Randevuyu Erkene Al & Müşteriyi Bilgilendir" : "Randevu Saatini Ertele & Müşteriyi Bilgilendir"}</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isRescheduleEarlier
                  ? "Müşteri talebi veya erken lift uygunluğu doğrultusunda randevuyu öne çekin."
                  : "Müşteri ile mutabık kalınan yeni randevu zamanını ve erteleme gerekçesini belirleyin."}
              </p>
            </div>

            {/* Parça / Stok Erken Randevu Uyarısı */}
            {isRescheduleEarlier && (
              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 flex items-start gap-2 text-xs">
                <span className="text-sm shrink-0">💡</span>
                <span className="text-[11px] text-emerald-900 dark:text-emerald-300 leading-relaxed">
                  <strong>Erken Randevu Hatırlatması:</strong> Bu işlemde özel/harici yedek parça gereksinimi varsa depoda hazır olduğunu teyit ediniz.
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Yeni Tarih</label>
                <input
                  type="date"
                  min={todayStr}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Yeni Saat</label>
                <input
                  type="time"
                  step={1800}
                  min={rescheduleDate === todayStr ? currentTimeStr : undefined}
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Gerekçe Çipleri */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>{isRescheduleEarlier ? "Erkene Alma Gerekçesi" : "Erteleme Gerekçesi"}</span>
                <span className="text-[10px] text-slate-400">Bildirime eklenecektir</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeRescheduleReasons.map((reason) => (
                  <button
                    key={reason.id}
                    type="button"
                    onClick={() => {
                      setRescheduleReasonChip(reason.id)
                      if (reason.id !== "custom") {
                        setRescheduleCustomReason(reason.label)
                      }
                    }}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer",
                      rescheduleReasonChip === reason.id
                        ? isRescheduleEarlier
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs"
                          : "bg-purple-500/10 border-purple-500 text-purple-700 dark:text-purple-300 font-semibold shadow-xs"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                    )}
                  >
                    <span>{reason.icon}</span>
                    <span className="truncate text-[11px]">{reason.label}</span>
                  </button>
                ))}
              </div>

              {/* Özel Gerekçe Alanı */}
              {rescheduleReasonChip === "custom" && (
                <input
                  type="text"
                  placeholder={isRescheduleEarlier ? "Özel gerekçe yazınız (örn: Müşteri erken saat talep etti vb.)..." : "Özel gerekçe yazınız (örn: Müşteri seyahatte vb.)..."}
                  value={rescheduleCustomReason}
                  onChange={(e) => setRescheduleCustomReason(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1"
                />
              )}
            </div>

            {/* Müşteri Bildirim Seçenekleri & Kanal Seçici */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between select-none">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Send size={13} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Müşteriye Otomatik Bildir
                    </span>
                    <p className="text-[10px] text-slate-400">
                      Yeni tarih ve saat müşteriye seçilen kanallarla gönderilir
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyCustomerOnReschedule}
                  disabled={!appointment.customerPhone && !appointment.customerEmail}
                  onChange={(e) => setNotifyCustomerOnReschedule(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer disabled:opacity-50"
                />
              </div>

              {!appointment.customerPhone && !appointment.customerEmail && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900">
                  <AlertTriangle size={13} className="shrink-0" />
                  <span>Müşterinin sistemde kayıtlı iletişim bilgisi (telefon veya e-posta) bulunmamaktadır.</span>
                </p>
              )}

              {notifyCustomerOnReschedule && (appointment.customerPhone || appointment.customerEmail) && (
                <div className="space-y-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">İletim Kanalları:</span>
                    <span className="text-[10px] text-slate-400">İstediğiniz kanalları seçin</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* WhatsApp */}
                    <button
                      type="button"
                      disabled={!appointment.customerPhone}
                      onClick={() => toggleChannel("WHATSAPP")}
                      className={cn(
                        "p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 cursor-pointer",
                        !appointment.customerPhone
                          ? "opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900"
                          : selectedChannels.includes("WHATSAPP")
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-2xs"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold flex items-center gap-1">
                          <MessageSquare size={13} className={appointment.customerPhone && selectedChannels.includes("WHATSAPP") ? "text-emerald-600" : "text-slate-400"} />
                          <span>WhatsApp</span>
                        </span>
                        {appointment.customerPhone && selectedChannels.includes("WHATSAPP") && (
                          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">✓</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 truncate font-mono">
                        {appointment.customerPhone || "Telefon Yok"}
                      </span>
                    </button>

                    {/* SMS */}
                    <button
                      type="button"
                      disabled={!appointment.customerPhone}
                      onClick={() => toggleChannel("SMS")}
                      className={cn(
                        "p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 cursor-pointer",
                        !appointment.customerPhone
                          ? "opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900"
                          : selectedChannels.includes("SMS")
                          ? "bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-2xs"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold flex items-center gap-1">
                          <Smartphone size={13} className={appointment.customerPhone && selectedChannels.includes("SMS") ? "text-indigo-600" : "text-slate-400"} />
                          <span>SMS</span>
                        </span>
                        {appointment.customerPhone && selectedChannels.includes("SMS") && (
                          <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[9px] font-bold">✓</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 truncate font-mono">
                        {appointment.customerPhone || "Telefon Yok"}
                      </span>
                    </button>

                    {/* E-Posta */}
                    <button
                      type="button"
                      disabled={!appointment.customerEmail}
                      onClick={() => toggleChannel("EMAIL")}
                      className={cn(
                        "p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 cursor-pointer",
                        !appointment.customerEmail
                          ? "opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900"
                          : selectedChannels.includes("EMAIL")
                          ? "bg-sky-500/10 border-sky-500 text-sky-700 dark:text-sky-300 shadow-2xs"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold flex items-center gap-1">
                          <Mail size={13} className={appointment.customerEmail && selectedChannels.includes("EMAIL") ? "text-sky-600" : "text-slate-400"} />
                          <span>E-Posta</span>
                        </span>
                        {appointment.customerEmail && selectedChannels.includes("EMAIL") && (
                          <span className="w-3.5 h-3.5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[9px] font-bold">✓</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 truncate font-mono" title={appointment.customerEmail || undefined}>
                        {appointment.customerEmail || "E-Posta Yok"}
                      </span>
                    </button>
                  </div>

                  {/* Bildirim Önizlemesi */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400 font-medium">
                      <span className="text-[10px] uppercase font-bold flex items-center gap-1.5">
                        <Send size={11} className="text-purple-500" />
                        <span>Müşteriye Gidecek Bildirim Önizlemesi</span>
                      </span>
                      <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                        {selectedChannels.join(", ") || "Kanal seçilmedi"}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 leading-relaxed">
                      {(() => {
                        let dateText = rescheduleDate
                        try {
                          if (rescheduleDate) {
                            const [yr, mo, dy] = rescheduleDate.split("-").map(Number)
                            dateText = new Date(yr, mo - 1, dy).toLocaleDateString("tr-TR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              weekday: "long",
                            })
                          }
                        } catch {}
                        return isRescheduleEarlier ? (
                          <>
                            Sayın {appointment.customerName || "Müşterimiz"},{" "}
                            {appointment.plate ? `${appointment.plate} plakalı ` : ""}
                            aracınızın servis randevusu talebiniz/oluşan müsaitlik doğrultusunda{" "}
                            <strong>
                              {dateText} saat {rescheduleTime}
                            </strong>{" "}
                            olarak erkene alınmıştır.
                            {rescheduleCustomReason.trim()
                              ? ` (${rescheduleCustomReason.trim()})`
                              : ""}
                          </>
                        ) : (
                          <>
                            Sayın {appointment.customerName || "Müşterimiz"},{" "}
                            {appointment.plate ? `${appointment.plate} plakalı ` : ""}
                            aracınızın servis randevusu{" "}
                            <strong>
                              {dateText} saat {rescheduleTime}
                            </strong>{" "}
                            olarak güncellenmiştir.
                            {rescheduleCustomReason.trim()
                              ? ` (Erteleme Nedeni: ${rescheduleCustomReason.trim()})`
                              : ""}
                          </>
                        )
                      })()}
                    </p>
                  </div>
                </div>
              )}
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
                className={cn(
                  "h-9 px-4 text-xs font-semibold text-white cursor-pointer gap-1.5 transition-colors",
                  isRescheduleEarlier
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-xs shadow-emerald-500/20"
                    : "bg-purple-600 hover:bg-purple-700"
                )}
              >
                <CalendarClock size={14} />
                <span>{isRescheduleEarlier ? "Erken Saati ve Bildirimi Onayla" : "Yeni Saati ve Bildirimi Onayla"}</span>
              </Button>
            </div>
          </div>
        )}

        {/* VIEW 4: CANCEL FORM */}
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
