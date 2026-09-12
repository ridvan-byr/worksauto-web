"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  Wrench,
  CheckCircle2,
  Car,
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
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { PlateBadge } from "@/features/customers/components/plate-badge"
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
  photos: Array<{ id: string; url: string; type: string; caption?: string }>
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
    desc: "Aracınızın giriş kontrolleri tamamlandı ve atölye sırasına alındı.",
  },
  {
    key: "IN_PROGRESS",
    title: "Lifte Alındı / Bakımda",
    desc: "Ustanız işlemler ve parça değişimlerine aktif olarak devam ediyor.",
  },
  {
    key: "QUALITY_CHECK",
    title: "Kalite Kontrol & Test",
    desc: "Son güvenlik kontrolleri, sıvı seviyeleri ve atölye denetimi yapılıyor.",
  },
  {
    key: "COMPLETED",
    title: "Teslimata Hazır",
    desc: "Tüm işlemler tamamlandı. Aracınızı teslim alabilirsiniz.",
  },
]

export default function PublicVehicleTrackPage() {
  const params = useParams()
  const token = params.token as string

  const [data, setData] = React.useState<TrackingData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!token) return
    setLoading(true)
    apiClient
      .get<TrackingData>(`/work-orders/public/track/${token}`)
      .then((res) => {
        setData(res)
        setError(null)
      })
      .catch((err) => {
        console.warn("Public track API error:", err)
        setError("İş emri bulunamadı veya bağlantı süresi dolmuş.")
      })
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-12 h-12 rounded-2xl border-4 border-indigo-500 border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-400">Araç canlı takip verileri yükleniyor...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-xl font-bold text-slate-100 mb-2">Takip Kaydı Bulunamadı</h1>
        <p className="text-xs text-slate-400 max-w-sm text-center mb-6">
          {error || "Belirtilen takip koduyla eşleşen aktif bir servis iş emri bulunamadı."}
        </p>
        <Link href="/">
          <Button variant="outline" className="text-xs border-slate-700 text-slate-300">
            Ana Sayfaya Dön
          </Button>
        </Link>
      </div>
    )
  }

  // Calculate current progress step
  let currentStepIndex = 0
  if (data.status === "QUEUE") currentStepIndex = 0
  else if (data.status === "IN_PROGRESS") currentStepIndex = 1
  else if (data.status === "COMPLETED") currentStepIndex = 3

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 selection:bg-indigo-500 selection:text-white">
      {/* Top Header / Brand Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-black">
              <Wrench size={18} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-200">{data.tenant?.title || "AutoWorks Servis"}</h2>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Canlı Atölye Takip Portalı
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {data.tenant?.phone && (
              <a
                href={`tel:${data.tenant.phone}`}
                className="h-8 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                <Phone size={13} className="text-indigo-400" />
                <span className="hidden sm:inline">Servisi Ara</span>
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
        {/* Vehicle Identity Card */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800/90 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <PlateBadge plate={data.vehicle.plate} size="lg" />
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-white truncate">
                  {data.vehicle.brand} {data.vehicle.model}
                </h1>
                <p className="text-xs text-slate-400">
                  {data.vehicle.year ? `${data.vehicle.year} Model • ` : ""}
                  İş Emri: <strong className="font-mono text-indigo-400">{data.workOrderNumber}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg">
                <Gauge size={13} className="text-sky-400" />
                <span>{data.vehicle.kilometer.toLocaleString("tr-TR")} KM</span>
              </span>
              {data.fuelLevel && (
                <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg">
                  <Fuel size={13} className="text-amber-400" />
                  <span>Yakıt: {data.fuelLevel}</span>
                </span>
              )}
              <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg">
                <Wrench size={13} className="text-indigo-400" />
                <span>{data.assignedLift}</span>
              </span>
            </div>
          </div>

          <div className="shrink-0 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-right sm:text-right">
            <p className="text-[10px] uppercase font-semibold text-slate-400">Atölye Sorumlusu</p>
            <p className="text-xs font-bold text-slate-200 mt-0.5">{data.mechanicName}</p>
            <p className="text-[10px] text-indigo-400 font-mono mt-0.5">Usta Teknisyen</p>
          </div>
        </div>

        {/* Live Stepper Flow */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800/90 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-400" />
              <span>Canlı Servis Durumu</span>
            </h3>
            <span
              className={cn(
                "text-[10px] font-bold px-2.5 py-1 rounded-full border",
                data.status === "COMPLETED"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : data.status === "IN_PROGRESS"
                  ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
              )}
            >
              {data.status === "COMPLETED"
                ? "Teslimata Hazır"
                : data.status === "IN_PROGRESS"
                ? "İşlem Sürüyor"
                : "Sırada Bekliyor"}
            </span>
          </div>

          {/* Stepper Timeline */}
          <div className="space-y-4 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {STATUS_STEPS.map((step, idx) => {
              const isPast = idx < currentStepIndex
              const isCurrent = idx === currentStepIndex

              return (
                <div key={step.key} className="flex items-start gap-4 relative">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 z-10 transition-all font-bold text-xs shadow-md",
                      isPast
                        ? "bg-emerald-500 text-slate-950"
                        : isCurrent
                        ? "bg-indigo-600 text-white ring-4 ring-indigo-500/20 animate-pulse"
                        : "bg-slate-800 text-slate-500 border border-slate-700"
                    )}
                  >
                    {isPast ? <CheckCircle2 size={18} /> : idx + 1}
                  </div>

                  <div className="space-y-0.5 pt-1 min-w-0 flex-1">
                    <h4
                      className={cn(
                        "text-xs font-bold transition-colors",
                        isPast ? "text-emerald-400" : isCurrent ? "text-white" : "text-slate-500"
                      )}
                    >
                      {step.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Invoice & Online Payment Banner */}
        {data.invoice && (
          <div
            className={cn(
              "p-5 rounded-3xl border shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all",
              data.invoice.isPaid
                ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-200"
                : "bg-indigo-950/30 border-indigo-700/50 text-indigo-200"
            )}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className={data.invoice.isPaid ? "text-emerald-400" : "text-indigo-400"} />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {data.invoice.isPaid ? "Fatura Ödendi" : "Servis Bedeli / Fatura"}
                </h4>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-white">
                  {data.invoice.grandTotal.toLocaleString("tr-TR")} ₺
                </span>
                {!data.invoice.isPaid && data.invoice.remainingAmount > 0 && (
                  <span className="text-xs text-rose-400 font-semibold font-mono">
                    (Kalan: {data.invoice.remainingAmount.toLocaleString("tr-TR")} ₺)
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                Fatura No: <span className="font-mono">{data.invoice.invoiceNumber}</span>
              </p>
            </div>

            {!data.invoice.isPaid ? (
              <Link href={`/pay/${data.invoice.id}`} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto h-10 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer">
                  <CreditCard size={14} />
                  <span>Kredi Kartı ile Online Öde</span>
                  <ChevronRight size={14} />
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                <ShieldCheck size={16} />
                <span>Ödeme Başarıyla Alındı</span>
              </div>
            )}
          </div>
        )}

        {/* Operations & Parts Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Services Checklist */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800/90 shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Wrench size={14} className="text-sky-400" />
              <span>Yapılan İşlemler ({data.services.length})</span>
            </h3>
            {data.services.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Henüz işlem kalemi eklenmedi.</p>
            ) : (
              <div className="space-y-1.5">
                {data.services.map((srv) => (
                  <div
                    key={srv.id}
                    className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-slate-200">{srv.name}</span>
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Parts Checklist */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800/90 shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Car size={14} className="text-indigo-400" />
              <span>Değişen Parçalar ({data.parts.length})</span>
            </h3>
            {data.parts.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Parça sarfiyatı bulunmuyor.</p>
            ) : (
              <div className="space-y-1.5">
                {data.parts.map((prt) => (
                  <div
                    key={prt.id}
                    className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-slate-200">{prt.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-bold">
                      {prt.quantity} Adet
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Vehicle Photos Gallery */}
        {data.photos.length > 0 && (
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800/90 shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Camera size={14} className="text-emerald-400" />
              <span>Araç Kabul & Hasar Fotoğrafları ({data.photos.length})</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {data.photos.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setSelectedPhoto(photo.url)}
                  className="aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-slate-800 relative group cursor-pointer"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || "Araç Fotoğrafı"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ExternalLink size={16} className="text-white" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer Guarantee Info */}
        <div className="p-4 text-center text-slate-500 text-[11px] space-y-1">
          <p>
            © {new Date().getFullYear()} {data.tenant?.title || "AutoWorks Servis"} • Tüm hakları saklıdır.
          </p>
          <p className="text-[10px]">
            İşbu canlı araç servis takip sistemi WorksAuto Otomotiv Altyapısı ile sağlanmaktadır.
          </p>
        </div>
      </main>

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 cursor-pointer"
            >
              <X size={20} />
            </button>
            <img src={selectedPhoto} alt="Büyük Görünüm" className="w-full h-full object-contain" />
          </div>
        </div>
      )}
    </div>
  )
}
