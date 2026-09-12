"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  Wrench,
  CheckCircle2,
  Phone,
  Camera,
  CreditCard,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Fuel,
  Gauge,
  Sparkles,
  X,
  ExternalLink,
  Check,
  Car,
  MapPin,
  MessageCircle,
  XCircle,
  Clock,
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { BrandLogo } from "@/components/shared/brand-logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TrackingData {
  workOrderNumber: string
  status: "QUEUE" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  createdAt: string
  completedAt?: string | null
  initialKm: number
  fuelLevel?: string | null
  assignedLift: string
  mechanicName: string
  customer: {
    name: string
    phone: string
  }
  vehicle: {
    plate: string
    brand: string
    model: string
    year?: number | null
    kilometer: number
    color?: string | null
  }
  services: Array<{ id: string; name: string; completed: boolean }>
  parts: Array<{ id: string; name: string; quantity: number }>
  photos: Array<{
    id: string
    url: string
    display_url?: string
    rawUrl?: string
    type: string
    caption?: string
  }>
  tenant?: {
    title: string
    phone: string
    address?: string
    city?: string
    district?: string
    logoUrl?: string
  }
  invoice?: {
    id: string
    invoiceNumber: string
    grandTotal: number
    paidAmount: number
    remainingAmount: number
    status: string
    isPaid: boolean
  } | null
}

const STATUS_STEPS = [
  {
    key: "QUEUE",
    title: "Servise Kabul Edildi",
    shortTitle: "Kabul Edildi",
    desc: "Aracınızın giriş kontrolleri ve servis kaydı tamamlandı, atölye sırasına alındı.",
  },
  {
    key: "IN_PROGRESS",
    title: "İşleme Alındı / Bakımda",
    shortTitle: "Bakımda",
    desc: "Ustanız işlemler, diagnostik testler ve parça değişimlerine aktif olarak devam ediyor.",
  },
  {
    key: "QUALITY_CHECK",
    title: "Kalite & Test Kontrolü",
    shortTitle: "Son Kontrol",
    desc: "Son güvenlik kontrolleri, sıvı seviyeleri ve yol testi denetimi yapılıyor.",
  },
  {
    key: "COMPLETED",
    title: "Tamamlandı / Teslime Hazır",
    shortTitle: "Teslime Hazır",
    desc: "Tüm işlemler başarıyla tamamlandı. Aracınızı servisten teslim alabilirsiniz.",
  },
]

export default function PublicVehicleTrackPage() {
  const params = useParams()
  const token = params.token as string

  const [data, setData] = React.useState<TrackingData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = React.useState<string | null>(null)

  // Fetch logic with silent background sync support
  const fetchTrackingData = React.useCallback(
    async (showLoading = false) => {
      if (!token) return
      if (showLoading) setLoading(true)

      try {
        const res = await apiClient.get<TrackingData>(`/work-orders/public/track/${token}`)
        setData(res)
        setError(null)
      } catch (err: any) {
        console.warn("Public track API error:", err)
        if (showLoading) {
          setError("İş emri bulunamadı veya bağlantı süresi dolmuş.")
        }
      } finally {
        if (showLoading) setLoading(false)
      }
    },
    [token]
  )

  // Initial fetch
  React.useEffect(() => {
    fetchTrackingData(true)
  }, [fetchTrackingData])

  // Realtime Live Synchronization: Poll every 10 seconds while tab is active
  React.useEffect(() => {
    if (!token) return

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        fetchTrackingData(false)
      }
    }, 10000)

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchTrackingData(false)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [token, fetchTrackingData])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070b12] flex flex-col items-center justify-center p-4 text-slate-800 dark:text-white transition-colors">
        <div className="w-9 h-9 rounded-full border-2 border-sky-500 border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wide">
          Canlı araç takip verileri yükleniyor...
        </p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070b12] flex flex-col items-center justify-center p-4 text-slate-800 dark:text-white selection:bg-sky-500 selection:text-white transition-colors">
        <div className="w-full max-w-md p-8 rounded-2xl bg-white dark:bg-[#0b101b] border border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Takip Kaydı Bulunamadı</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {error || "Belirtilen takip koduyla eşleşen aktif bir servis iş emri bulunamadı."}
          </p>
          <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06]">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Lütfen size iletilen güncel SMS veya e-posta bildirimindeki bağlantıyı kontrol ediniz ya da doğrudan servis danışmanınız ile iletişime geçiniz.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Calculate current progress step
  let currentStepIndex = 0
  if (data.status === "QUEUE") currentStepIndex = 0
  else if (data.status === "IN_PROGRESS") currentStepIndex = 1
  else if (data.status === "COMPLETED") currentStepIndex = 3

  const currentStepInfo = STATUS_STEPS[currentStepIndex] || STATUS_STEPS[0]
  const cleanPhone = data.tenant?.phone ? data.tenant.phone.replace(/\D/g, "") : ""

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 selection:bg-sky-500 selection:text-white relative flex flex-col justify-between transition-colors duration-200">
      {/* Top Subtle Ambient Cyan Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-radial from-sky-500/5 dark:from-sky-500/10 via-transparent to-transparent pointer-events-none -z-0" />

      {/* Top Sticky Header (Minimal Brand Identity) */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#070b12]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/[0.08] px-4 sm:px-6 py-3 transition-colors">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          {/* Brand Identity: WorksAuto Logo + Tenant Info */}
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo clickable={false} className="w-28 sm:w-32 h-7 shrink-0" />
            <div className="h-4 w-px bg-slate-200 dark:bg-white/10 shrink-0 hidden xs:block" />
            <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
              {data.tenant?.title || "WorksAuto Servis"}
            </h2>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 space-y-4 relative z-10">
        {/* Vehicle & Customer Identity Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0b101b]/90 border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-md shadow-xs dark:shadow-xl transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <PlateBadge plate={data.vehicle.plate} size="lg" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    {data.vehicle.brand} {data.vehicle.model}
                  </h1>
                  <span className="font-mono text-[11px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 px-2 py-0.5 rounded-md">
                    {data.workOrderNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {data.vehicle.year ? `${data.vehicle.year} Model • ` : ""}
                  {data.vehicle.color ? `${data.vehicle.color} • ` : ""}
                  Müşteri: <span className="text-slate-800 dark:text-white font-semibold">{data.customer.name}</span>
                </p>
              </div>
            </div>

            {/* Current Status Pill */}
            <div className="sm:text-right shrink-0">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border",
                  data.status === "CANCELLED"
                    ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30"
                    : data.status === "COMPLETED"
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                    : data.status === "IN_PROGRESS"
                    ? "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/30"
                    : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30"
                )}
              >
                {data.status === "CANCELLED" ? (
                  <XCircle size={13} />
                ) : (
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      data.status === "COMPLETED"
                        ? "bg-emerald-500 dark:bg-emerald-400"
                        : data.status === "IN_PROGRESS"
                        ? "bg-sky-500 dark:bg-sky-400 animate-pulse"
                        : "bg-amber-500 dark:bg-amber-400"
                    )}
                  />
                )}
                {data.status === "CANCELLED"
                  ? "İş Emri İptal Edildi"
                  : data.status === "COMPLETED"
                  ? "Teslimata Hazır"
                  : data.status === "IN_PROGRESS"
                  ? "İşlem Sürüyor"
                  : "Sırada Bekliyor"}
              </span>
            </div>
          </div>

          {/* Technical Metadata Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-white/[0.06] text-[11px] text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] px-2.5 py-1 rounded-lg">
              <Gauge size={12} className="text-sky-500 dark:text-sky-400" />
              <span>{data.vehicle.kilometer > 0 ? `${data.vehicle.kilometer.toLocaleString("tr-TR")} KM` : "Giriş KM Belirtilmedi"}</span>
            </span>
            {data.fuelLevel && (
              <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] px-2.5 py-1 rounded-lg">
                <Fuel size={12} className="text-amber-500 dark:text-amber-400" />
                <span>Yakıt: {data.fuelLevel}</span>
              </span>
            )}
            {data.assignedLift && (
              <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] px-2.5 py-1 rounded-lg">
                <Wrench size={12} className="text-sky-500 dark:text-sky-400" />
                <span>{data.assignedLift}</span>
              </span>
            )}
            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] px-2.5 py-1 rounded-lg ml-auto">
              <span className="text-slate-500">Teknisyen:</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">{data.mechanicName || "Atölye Sorumlusu"}</span>
            </span>
          </div>
        </div>

        {/* Status Section: Stepper Timeline or Cancellation Notice */}
        {data.status === "CANCELLED" ? (
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0b101b]/90 border border-rose-200 dark:border-rose-500/20 backdrop-blur-md shadow-xs dark:shadow-xl space-y-3 transition-colors">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <XCircle size={22} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Bu Servis İş Emri İptal Edilmiştir
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Aracınıza ait servis iş emri iptal edilmiştir. Yapılan veya planlanan herhangi bir aktif bakım/onarım işlemi bulunmamaktadır. Ayrıntılı bilgi almak ya da yeni bir servis randevusu oluşturmak için servis danışmanınız ile iletişime geçebilirsiniz.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0b101b]/90 border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-md shadow-xs dark:shadow-xl space-y-5 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-sky-500 dark:text-sky-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">
                  Canlı Servis Aşamaları
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Aşama {currentStepIndex + 1} / 4
              </span>
            </div>

            {/* Stepper Progress Bar (Horizontal on all devices) */}
            <div className="relative pt-1 pb-1">
              <div className="grid grid-cols-4 gap-2 relative z-10">
                {STATUS_STEPS.map((step, idx) => {
                  const isPast = idx < currentStepIndex
                  const isCurrent = idx === currentStepIndex

                  return (
                    <div key={step.key} className="flex flex-col items-center text-center">
                      {/* Bar Indicator */}
                      <div
                        className={cn(
                          "h-1.5 w-full rounded-full transition-all duration-300 mb-2.5",
                          isPast
                            ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                            : isCurrent
                            ? "bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)] animate-pulse"
                            : "bg-slate-200 dark:bg-white/[0.08]"
                        )}
                      />
                      <span
                        className={cn(
                          "text-[10px] sm:text-xs font-semibold tracking-tight transition-colors line-clamp-1",
                          isPast
                            ? "text-emerald-600 dark:text-emerald-400"
                            : isCurrent
                            ? "text-slate-900 dark:text-white font-bold"
                            : "text-slate-400 dark:text-slate-500"
                        )}
                      >
                        {step.shortTitle}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Active Step Description Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] flex items-start gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold",
                  data.status === "COMPLETED"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                )}
              >
                {data.status === "COMPLETED" ? <Check size={16} /> : currentStepIndex + 1}
              </div>
              <div className="space-y-0.5 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{currentStepInfo.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{currentStepInfo.desc}</p>
              </div>
            </div>
          </div>
        )}

        {/* Multi-Channel Customer Contact Hub */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0b101b]/90 border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-md shadow-xs dark:shadow-xl space-y-3.5 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-sky-500 dark:text-sky-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">
                Servis İletişim & Konum
              </h3>
            </div>
            {data.tenant?.city && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {data.tenant.district ? `${data.tenant.district}, ` : ""}{data.tenant.city}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {/* 1. WhatsApp Direct Chat */}
            {cleanPhone ? (
              <a
                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                  `Merhaba, ${data.vehicle.plate} plakalı (${data.workOrderNumber}) aracımın servis durumu hakkında bilgi alabilir miyim?`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-xs font-semibold transition-all active:scale-98"
              >
                <MessageCircle size={15} />
                <span>WhatsApp'tan Yaz</span>
              </a>
            ) : null}

            {/* 2. Direct Phone Call */}
            {data.tenant?.phone ? (
              <a
                href={`tel:${data.tenant.phone}`}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20 text-xs font-semibold transition-all active:scale-98"
              >
                <Phone size={14} />
                <span>Servisi Ara</span>
              </a>
            ) : null}

            {/* 3. Google Maps Navigation */}
            {data.tenant?.address ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${data.tenant.title} ${data.tenant.address || ""} ${data.tenant.city || ""}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.03] hover:bg-slate-200 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] text-xs font-semibold transition-all active:scale-98"
              >
                <MapPin size={14} className="text-rose-500 dark:text-rose-400" />
                <span>Yol Tarifi Al</span>
              </a>
            ) : null}
          </div>
        </div>

        {/* Invoice & Online Payment Card (If invoice exists) */}
        {data.invoice && (
          <div
            className={cn(
              "p-5 rounded-2xl border shadow-xs dark:shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all",
              data.invoice.isPaid
                ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200"
                : "bg-white dark:bg-[#0b101b]/90 border-sky-200 dark:border-sky-500/30 text-slate-800 dark:text-slate-200"
            )}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className={data.invoice.isPaid ? "text-emerald-600 dark:text-emerald-400" : "text-sky-600 dark:text-sky-400"} />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {data.invoice.isPaid ? "Fatura Ödendi" : "Servis Faturası"}
                </h4>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
                  {data.invoice.grandTotal.toLocaleString("tr-TR")} ₺
                </span>
                {!data.invoice.isPaid && data.invoice.remainingAmount > 0 && (
                  <span className="text-xs text-rose-500 dark:text-rose-400 font-semibold font-mono">
                    (Kalan: {data.invoice.remainingAmount.toLocaleString("tr-TR")} ₺)
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500">
                Fatura No: <span className="font-mono text-slate-700 dark:text-slate-400">{data.invoice.invoiceNumber}</span>
              </p>
            </div>

            {!data.invoice.isPaid ? (
              <Link href={`/pay/${data.invoice.id}`} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto h-10 px-5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs gap-2 shadow-lg shadow-sky-500/20 cursor-pointer transition-all">
                  <CreditCard size={14} />
                  <span>Kredi Kartı ile Güvenli Öde</span>
                  <ChevronRight size={14} />
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                <ShieldCheck size={16} />
                <span>Ödeme Başarıyla Alındı</span>
              </div>
            )}
          </div>
        )}

        {/* Bento Grid: Services & Parts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Services Box */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0b101b]/90 border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-md shadow-xs dark:shadow-xl space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                <Wrench size={13} className="text-sky-500 dark:text-sky-400" />
                <span>Yapılan İşlemler</span>
              </h3>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.06]">
                {data.services.length}
              </span>
            </div>

            {data.services.length > 0 ? (
              <ul className="space-y-2 text-xs">
                {data.services.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04] text-slate-800 dark:text-slate-200"
                  >
                    <span className="truncate pr-2 font-medium">{s.name}</span>
                    <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={12} />
                      <span>Tamamlandı</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                Henüz planlanan işlem eklenmedi.
              </div>
            )}
          </div>

          {/* Parts Box */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0b101b]/90 border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-md shadow-xs dark:shadow-xl space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                <Car size={13} className="text-sky-500 dark:text-sky-400" />
                <span>Değişen Parçalar</span>
              </h3>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.06]">
                {data.parts.length}
              </span>
            </div>

            {data.parts.length > 0 ? (
              <ul className="space-y-2 text-xs">
                {data.parts.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04] text-slate-800 dark:text-slate-200"
                  >
                    <span className="truncate pr-2 font-medium">{p.name}</span>
                    <span className="shrink-0 text-[11px] font-mono text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04]">
                      {p.quantity} Adet
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                Parça sarfiyatı bulunmuyor.
              </div>
            )}
          </div>
        </div>

        {/* Photos Section (If photos exist) */}
        {data.photos && data.photos.length > 0 && (
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0b101b]/90 border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-md shadow-xs dark:shadow-xl space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                <Camera size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>Araç Kabul & Durum Fotoğrafları</span>
              </h3>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.06]">
                {data.photos.length}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {data.photos.map((photo) => {
                const raw = photo.display_url || photo.url
                const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "")
                const fullImgUrl =
                  raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")
                    ? raw
                    : `${apiBase}/media/files/${raw.replace(/^\/?(api\/v1\/)?media\/files\//, "")}`

                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setSelectedPhoto(fullImgUrl)}
                    className="aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-slate-900 relative group cursor-pointer"
                  >
                    <img
                      src={fullImgUrl}
                      alt={photo.caption || "Araç Fotoğrafı"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ExternalLink size={16} className="text-white" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* Modern, Responsive Corporate Footer (Centered Brand Layout) */}
      <footer className="mt-auto w-full border-t border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#070b12]/90 backdrop-blur-xl py-8 px-4 relative z-10 text-center transition-colors">
        <div className="max-w-xl mx-auto space-y-3">
          {/* Centered Brand Logo (Light / Dark Adaptive) */}
          <div className="flex items-center justify-center">
            <img
              src="/brand/worksauto-logo-dark.png"
              alt="WorksAuto"
              className="h-6 sm:h-7 w-auto object-contain block dark:hidden"
            />
            <img
              src="/brand/worksauto-logo-white.png"
              alt="WorksAuto"
              className="h-6 sm:h-7 w-auto object-contain hidden dark:block opacity-90"
            />
          </div>

          {/* Explanation Text */}
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Bu canlı takip sayfası <strong className="text-slate-900 dark:text-slate-200">{data.tenant?.title || "WorksAuto Servis"}</strong> adına <strong className="text-slate-900 dark:text-slate-200">WorksAuto</strong> canlı araç takip altyapısı tarafından sağlanmaktadır.
          </p>

          {/* Copyright */}
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} WorksAuto. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 dark:bg-[#070b12]/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl border border-slate-700 dark:border-white/[0.1] bg-white dark:bg-[#0b101b]">
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer z-10"
            >
              <X size={18} />
            </button>
            <img src={selectedPhoto} alt="Büyük Görünüm" className="w-full h-full object-contain" />
          </div>
        </div>
      )}
    </div>
  )
}
