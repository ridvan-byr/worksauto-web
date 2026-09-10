"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import {
  CheckCircle2,
  ArrowRight,
} from "lucide-react"
import { BrandLogo } from "@/components/shared/brand-logo"
import { Button } from "@/components/ui/button"




interface PublicService {
  id: string
  name: string
  durationMinutes: number
  laborPrice: number
  price?: number
  category?: string
}

interface PublicTenant {
  id: string
  title: string
  phone: string
  city?: string
  district?: string
  logoUrl?: string
  services: PublicService[]
}

const FALLBACK_SERVICES: PublicService[] = [
  { id: "s1", name: "Periyodik Bakım (Yağ + 4 Filtre)", durationMinutes: 60, laborPrice: 1250 },
  { id: "s2", name: "Ön Fren Balata Değişimi", durationMinutes: 45, laborPrice: 850 },
  { id: "s3", name: "Bilgisayarlı Arıza Tespit & Diagnostik", durationMinutes: 30, laborPrice: 500 },
  { id: "s4", name: "Klima Gazı Dolumu & Kaçak Testi", durationMinutes: 40, laborPrice: 950 },
  { id: "s5", name: "Rot-Balans & Ön Takım Kontrolü", durationMinutes: 45, laborPrice: 750 },
]

export default function PublicBookingPage() {
  const params = useParams()
  const slug = params.slug as string // e.g. "yildiz-oto-servis"

  const [_tenant, setTenant] = React.useState<PublicTenant | null>(null)
  const [services, setServices] = React.useState<PublicService[]>(FALLBACK_SERVICES)
  const [_isLoadingServices, setIsLoadingServices] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const [name, setName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [plate, setPlate] = React.useState("")
  const [brandModel, setBrandModel] = React.useState("")
  const [selectedServiceId, setSelectedServiceId] = React.useState("")
  const [date, setDate] = React.useState(new Date().toISOString().split("T")[0])
  const [time, setTime] = React.useState("10:00")
  const [note, _setNote] = React.useState("")
  const [kvkkAccepted, setKvkkAccepted] = React.useState(true)
  const [isSuccess, setIsSuccess] = React.useState(false)

  // Fetch real tenant info & services catalogue
  React.useEffect(() => {
    async function loadTenantData() {
      try {
        const res = await fetch(`/api/v1/tenants/public/${slug}`)
        if (res.ok) {
          const data: PublicTenant = await res.json()
          setTenant(data)
          if (data.services && data.services.length > 0) {
            setServices(data.services)
            setSelectedServiceId(data.services[0].id)
          } else {
            setSelectedServiceId(FALLBACK_SERVICES[0].id)
          }
        } else {
          setSelectedServiceId(FALLBACK_SERVICES[0].id)
        }
      } catch (err) {
        console.warn("Public tenant fetch fallback:", err)
        setSelectedServiceId(FALLBACK_SERVICES[0].id)
      } finally {
        setIsLoadingServices(false)
      }
    }
    if (slug) {
      loadTenantData()
    }
  }, [slug])

  // Phone mask
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "")
    if (raw.length === 0) {
      setPhone("")
      return
    }
    const formatted = raw.startsWith("0") ? raw.slice(0, 11) : "0" + raw.slice(0, 10)
    let res = "0"
    if (formatted.length > 1) res += " (" + formatted.slice(1, 4)
    if (formatted.length >= 4) res += ") " + formatted.slice(4, 7)
    if (formatted.length >= 7) res += " " + formatted.slice(7, 9)
    if (formatted.length >= 9) res += " " + formatted.slice(9, 11)
    setPhone(res)
  }

  const handleCreatePublicAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/v1/appointments/public/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          plate: plate.toUpperCase(),
          brandModel,
          serviceId: selectedServiceId || undefined,
          slotDate: date,
          slotStartTime: `${date}T${time}:00Z`,
          slotEndTime: `${date}T${time}:00Z`,
          customerNotes: note || "Web üzerinden online randevu talebi oluşturuldu.",
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || "Randevu talebi iletilemedi.")
      }

      setIsSuccess(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Randevu talebi gönderilirken bir hata oluştu."
      alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0] || FALLBACK_SERVICES[0]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <header className="max-w-xl w-full mx-auto flex items-center justify-between py-4">
        <BrandLogo collapsed={false} clickable={false} />
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
          Online Randevu Portalı
        </span>
      </header>

      {/* Main Form Box */}
      <main className="max-w-xl w-full mx-auto my-auto">
        {isSuccess ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-emerald-500 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                Randevu Talebiniz Alındı!
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                <strong>{name}</strong>, <strong>{plate.toUpperCase()}</strong> plakalı aracınız için <strong>{date} saat {time}</strong> slotuna randevu kaydınız açıldı. Servis danışmanımız SMS ile onay iletecektir.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-left text-xs space-y-1.5 max-w-sm mx-auto font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Seçilen Hizmet:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedService.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tahmini İşçilik:</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">
                  {selectedService.laborPrice ?? selectedService.price ?? 0} ₺
                </span>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => {
                setIsSuccess(false)
                setName("")
                setPhone("")
                setPlate("")
                setBrandModel("")
              }}
              variant="outline"
              className="h-10 px-5 text-xs font-semibold cursor-pointer"
            >
              Yeni Randevu Talebi Oluştur
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleCreatePublicAppointment}
            className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-5 animate-in fade-in duration-200"
          >
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Servis Randevusu Alın
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Araç plakanızı, yapılacak bakımı ve size uygun saati seçin.
              </p>
            </div>

            {/* Customer Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Adınız ve Soyadınız <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: Rıdvan Bayar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Cep Telefonunuz <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="0 (5XX) XXX XX XX"
                  value={phone}
                  onChange={handlePhoneChange}
                  maxLength={17}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Araç Plakanız <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="34 ABC 123"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Marka & Model
                </label>
                <input
                  type="text"
                  placeholder="Örn: BMW 320i"
                  value={brandModel}
                  onChange={(e) => setBrandModel(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Service Selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Talep Edilen Hizmet <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (~{s.durationMinutes} dk • {s.laborPrice ?? s.price} ₺)
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Tarih <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Saat <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  step={1800}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>

            {/* KVKK Consent Checkbox */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer hover:border-sky-500/40 transition-colors">
              <input
                type="checkbox"
                checked={kvkkAccepted}
                onChange={(e) => setKvkkAccepted(e.target.checked)}
                className="mt-0.5 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                required
              />
              <span className="leading-snug">
                6698 sayılı KVKK kapsamında kişisel verilerimin randevu/servis süreçleri doğrultusunda işlenmesini ve servis durumu hakkında SMS ile bilgilendirilmeyi kabul ediyorum.
              </span>
            </label>

            <Button
              type="submit"
              disabled={isSubmitting || !kvkkAccepted}
              className="w-full h-12 rounded-2xl text-xs font-bold gap-2 shadow-lg shadow-sky-500/20 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Randevu Talebini Gönder</span>
                  <ArrowRight size={15} />
                </>
              )}
            </Button>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-xl w-full mx-auto text-center py-4 text-[11px] text-slate-400">
        WorksAuto Bulut Tabanlı Yeni Nesil Araç Servis Yönetim Teknolojileri
      </footer>
    </div>
  )
}
