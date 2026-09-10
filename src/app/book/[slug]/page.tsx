"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import {
  CheckCircle2,
  ArrowRight,
  Clock,
  Calendar,
  Wrench,
  MapPin,
  Phone,
} from "lucide-react"
import { BrandLogo } from "@/components/shared/brand-logo"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api-client"
import { toast } from "@/components/ui/sonner"

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
  address?: string
  city?: string
  district?: string
  logoUrl?: string
  services: PublicService[]
}

const DEFAULT_SLOTS = [
  "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00",
]

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

  const [tenant, setTenant] = React.useState<PublicTenant | null>(null)
  const [services, setServices] = React.useState<PublicService[]>(FALLBACK_SERVICES)
  const [isLoadingTenant, setIsLoadingTenant] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const [name, setName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [plate, setPlate] = React.useState("")
  const [brandModel, setBrandModel] = React.useState("")
  const [selectedServiceId, setSelectedServiceId] = React.useState("")
  
  // Today's date YYYY-MM-DD
  const todayStr = React.useMemo(() => new Date().toISOString().split("T")[0], [])
  const [date, setDate] = React.useState(todayStr)
  const [time, setTime] = React.useState("09:30")
  const [note, setNote] = React.useState("")
  const [kvkkAccepted, setKvkkAccepted] = React.useState(true)
  const [isSuccess, setIsSuccess] = React.useState(false)

  // Fetch real tenant info & services catalogue via apiClient
  React.useEffect(() => {
    async function loadTenantData() {
      try {
        const data = await apiClient.get<PublicTenant>(`/tenants/public/${slug}`)
        if (data) {
          setTenant(data)
          if (data.services && data.services.length > 0) {
            setServices(data.services)
            setSelectedServiceId(data.services[0].id)
          } else {
            setSelectedServiceId(FALLBACK_SERVICES[0].id)
          }
        }
      } catch (err: unknown) {
        console.warn("Public tenant fetch fallback:", err)
        setSelectedServiceId(FALLBACK_SERVICES[0].id)
      } finally {
        setIsLoadingTenant(false)
      }
    }
    if (slug) {
      loadTenantData()
    }
  }, [slug])

  // Phone input formatting
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

  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0] || FALLBACK_SERVICES[0]

  const handleCreatePublicAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim() || !plate.trim()) {
      toast.error("Lütfen zorunlu alanları (Ad-Soyad, Telefon, Plaka) doldurunuz.")
      return
    }

    if (!kvkkAccepted) {
      toast.error("Randevu oluşturmak için KVKK aydınlatma metnini onaylamanız gerekmektedir.")
      return
    }

    setIsSubmitting(true)

    try {
      // Calculate realistic slot end time based on selected service duration
      const durationMin = selectedService?.durationMinutes || 60
      const startTimeDate = new Date(`${date}T${time}:00`)
      const endTimeDate = new Date(startTimeDate.getTime() + durationMin * 60 * 1000)

      await apiClient.post(`/appointments/public/${slug}`, {
        customerName: name.trim(),
        customerPhone: phone.replace(/\D/g, ""),
        plate: plate.toUpperCase().replace(/\s/g, ""),
        brandModel: brandModel.trim() || undefined,
        serviceId: selectedServiceId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedServiceId)
          ? selectedServiceId
          : undefined,
        slotDate: date,
        slotStartTime: startTimeDate.toISOString(),
        slotEndTime: endTimeDate.toISOString(),
        customerNotes: note.trim() || "Web üzerinden online randevu talebi oluşturuldu.",
      })

      setIsSuccess(true)
      toast.success("Randevu talebiniz servis merkezimize başarıyla iletildi.")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Randevu talebi gönderilirken bir hata oluştu."
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

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
                Sayın <strong>{name}</strong>, <strong>{plate.toUpperCase()}</strong> plakalı aracınız için{" "}
                <strong>{date} saat {time}</strong> slotuna randevu kaydınız oluşturuldu. Servis danışmanımız müsaitlik durumunu kontrol ederek SMS ile onay iletecektir.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-left text-xs space-y-2 max-w-sm mx-auto font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">İşletme:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{tenant?.title || "Yetkili Servis"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hizmet:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedService.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tahmini Süre:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">~{selectedService.durationMinutes} dk</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1.5">
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
                setNote("")
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
            {/* Workshop Banner */}
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 text-xs font-bold uppercase tracking-wider">
                <Wrench size={14} />
                <span>{tenant?.title || (isLoadingTenant ? "Servis Yükleniyor..." : "Yetkili Servis Merkezi")}</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                Online Servis Randevusu Alın
              </h1>
              <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {tenant?.city && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {tenant.district ? `${tenant.district}, ` : ""}{tenant.city}
                  </span>
                )}
                {tenant?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={12} /> {tenant.phone}
                  </span>
                )}
              </div>
            </div>

            {/* Customer Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Adınız ve Soyadınız <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: Rıdvan Emre Bayar"
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
                  placeholder="Örn: BMW 320i veya Ford Focus"
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
                    {s.name} (~{s.durationMinutes} dk • {s.laborPrice ?? s.price ?? 0} ₺)
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar size={13} className="text-sky-500" />
                <span>Randevu Tarihi</span> <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                min={todayStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            {/* Interactive Time Slot Pills */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock size={13} className="text-sky-500" />
                <span>Müsait Saat Dilimi Seçiniz</span> <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {DEFAULT_SLOTS.map((slot) => {
                  const isSelected = time === slot
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTime(slot)}
                      className={`py-2 px-1 text-center rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                        isSelected
                          ? "bg-sky-600 text-white font-bold shadow-md shadow-sky-600/30 scale-[1.02]"
                          : "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {slot}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Customer Notes */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Arıza / Bakım Notlarınız (Opsiyonel)
              </label>
              <textarea
                placeholder="Örn: Frene basınca titreme yapıyor, periyodik yağ bakımı da yapılacak..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
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
                6698 sayılı KVKK kapsamında kişisel verilerimin servis ve randevu süreçleri doğrultusunda işlenmesini ve servis durumu hakkında SMS ile bilgilendirilmeyi kabul ediyorum.
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
                  <span>Randevu Talebini Gönder ({time})</span>
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
