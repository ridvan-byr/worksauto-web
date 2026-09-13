"use client"

import * as React from "react"
import { Building2, Save, MapPin, Navigation, ExternalLink, Loader2, Compass } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { TenantSettings } from "@/features/settings/api/use-settings"
import { TURKEY_PROVINCES, getDistrictsForProvince } from "@/lib/turkey-locations"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { formatSmartPhone, formatTaxNumber } from "@/lib/input-formatters"
import { toast } from "sonner"

interface TenantProfileTabProps {
  initialData?: TenantSettings
  onSave: (data: {
    title: string
    legalName: string
    phone: string
    email: string
    address: string
    city: string
    district: string
    taxOffice: string
    taxNumber: string
    autoInvoiceOnComplete: boolean
    latitude?: number | null
    longitude?: number | null
  }) => Promise<void>
  isPending: boolean
}

export function TenantProfileTab({
  initialData,
  onSave,
  isPending,
}: TenantProfileTabProps) {
  const [title, setTitle] = React.useState("")
  const [legalName, setLegalName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [city, setCity] = React.useState("")
  const [district, setDistrict] = React.useState("")
  const [taxOffice, setTaxOffice] = React.useState("")
  const [taxNumber, setTaxNumber] = React.useState("")
  const [autoInvoice, setAutoInvoice] = React.useState(false)
  const [latitude, setLatitude] = React.useState<string>("")
  const [longitude, setLongitude] = React.useState<string>("")
  const [isLocating, setIsLocating] = React.useState(false)

  React.useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "")
      setLegalName(initialData.legalName || "")
      setPhone(initialData.phone || "")
      setEmail(initialData.email || "")
      setAddress(initialData.address || "")
      setCity(initialData.city || "")
      setDistrict(initialData.district || "")
      setTaxOffice(initialData.taxOffice || "")
      setTaxNumber(initialData.taxNumber || "")
      setAutoInvoice(initialData.autoInvoiceOnComplete ?? true)
      setLatitude(
        initialData.latitude !== undefined && initialData.latitude !== null
          ? String(initialData.latitude)
          : ""
      )
      setLongitude(
        initialData.longitude !== undefined && initialData.longitude !== null
          ? String(initialData.longitude)
          : ""
      )
    }
  }, [initialData])

  const availableDistricts = React.useMemo(() => {
    return getDistrictsForProvince(city)
  }, [city])

  const handleCityChange = (newCity: string) => {
    setCity(newCity)
    const newDistricts = getDistrictsForProvince(newCity)
    if (!newDistricts.includes(district)) {
      setDistrict("")
    }
  }

  const handleGetLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("Tarayıcınız konum servisini desteklemiyor.")
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false)
        const lat = Number(pos.coords.latitude.toFixed(6))
        const lng = Number(pos.coords.longitude.toFixed(6))
        setLatitude(String(lat))
        setLongitude(String(lng))
        toast.success(`Konum başarıyla alındı: ${lat}, ${lng}`)
      },
      (err) => {
        setIsLocating(false)
        if (err.code === 1) {
          toast.error("Konum izni reddedildi. Tarayıcı izinlerinden aktif edebilir veya koordinatları elle girebilirsiniz.")
        } else {
          toast.error("Konum alınırken bir hata oluştu: " + err.message)
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsedLat = latitude.trim() !== "" ? parseFloat(latitude.replace(",", ".")) : null
    const parsedLng = longitude.trim() !== "" ? parseFloat(longitude.replace(",", ".")) : null

    onSave({
      title,
      legalName,
      phone,
      email,
      address,
      city,
      district,
      taxOffice,
      taxNumber,
      autoInvoiceOnComplete: autoInvoice,
      latitude: parsedLat !== null && !isNaN(parsedLat) ? parsedLat : null,
      longitude: parsedLng !== null && !isNaN(parsedLng) ? parsedLng : null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader className="p-6">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Building2 size={18} className="text-sky-500" />
            <span>Genel İşletme Bilgileri</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Müşteri tekliflerinde, fatura başlıklarında ve SMS bildirimlerinde yer alan resmi servis verileri
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Servis Tabelası / İşletme Adı *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-sky-500"
                placeholder="Örn: Bayar Oto Servis & Ekspertiz"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Resmi Şirket Ticari Ünvanı
              </label>
              <input
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-sky-500"
                placeholder="Örn: Bayar Otomotiv San. ve Tic. Ltd. Şti."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Sabit / İletişim Telefonu
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(formatSmartPhone(e.target.value))}
                className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-sky-500"
                placeholder="Örn: 0212 555 01 23 veya 0532..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                İşletme E-Posta Adresi
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-sky-500"
                placeholder="info@bayaroto.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Açık Servis Adresi
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-sky-500"
              placeholder="Maslak Oto Sanayi Sitesi 2. Kısım 34. Sokak No: 12 Sarıyer / İstanbul"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Şehir / İl</span>
                <span className="text-[10px] text-slate-400 font-normal">81 İl</span>
              </label>
              <SearchableSelect
                options={TURKEY_PROVINCES as unknown as string[]}
                value={city}
                onChange={handleCityChange}
                placeholder="İl seçiniz veya arayınız..."
                searchPlaceholder="81 il içinde ara..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>İlçe / Semt</span>
                {city && availableDistricts.length > 0 && (
                  <span className="text-[10px] text-slate-400 font-normal">
                    {availableDistricts.length} İlçe
                  </span>
                )}
              </label>
              <SearchableSelect
                options={availableDistricts}
                value={district}
                onChange={setDistrict}
                disabled={!city}
                disabledMessage="Önce İl Seçiniz"
                placeholder={city ? "İlçe seçiniz veya arayınız..." : "Önce İl Seçiniz"}
                searchPlaceholder={`${city || "İlçe"} ilçelerinde ara...`}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workshop Exact GPS Coordinates & Pinning */}
      <Card className="border-sky-200/60 dark:border-sky-900/30 overflow-hidden shadow-xs">
        <CardHeader className="p-6 bg-gradient-to-r from-sky-500/5 via-transparent to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <MapPin size={18} className="text-rose-500" />
                <span>Atölye GPS Konumu & Navigasyon Pinleme</span>
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Müşteri takip sayfasındaki &quot;Yol Tarifi Al&quot; butonunun dükkanınızın tam kapısına ve liftine rota çizmesini sağlar. Sanayi sitelerinde kaybolmayı önler.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGetLocation}
              disabled={isLocating}
              className="h-9 px-3 text-xs font-semibold gap-1.5 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 shrink-0 cursor-pointer"
            >
              {isLocating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Navigation size={14} className="text-sky-500" />
              )}
              <span>{isLocating ? "Konum Alınıyor..." : "Mevcut Konumumu Al (GPS)"}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Enlem (Latitude)</span>
                <span className="text-[10px] text-slate-400 font-normal">Örn: 41.008234</span>
              </label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                placeholder="41.008234"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Boylam (Longitude)</span>
                <span className="text-[10px] text-slate-400 font-normal">Örn: 28.978456</span>
              </label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                placeholder="28.978456"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Compass size={16} className="text-sky-500 shrink-0" />
              <span>
                {latitude && longitude
                  ? `Pinlenen Koordinat: ${latitude}, ${longitude}`
                  : "Henüz koordinat girilmedi. Dükkandayken tek tıkla GPS alabilir veya haritadan koordinat yapıştırabilirsiniz."}
              </span>
            </div>
            {latitude && longitude && (
              <a
                href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 font-semibold text-[11px] transition-colors shrink-0"
              >
                <span>Google Haritada Doğrula</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-6">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Building2 size={18} className="text-sky-500" />
            <span>Maliye, Vergi & Otomasyon Ayarları</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Fatura şablonlarında görünecek vergi dairesi ve otomatik faturalandırma kuralları
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Vergi Dairesi
              </label>
              <input
                type="text"
                value={taxOffice}
                onChange={(e) => setTaxOffice(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-sky-500"
                placeholder="İkitelli Vergi Dairesi"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Vergi Numarası / VKN
              </label>
              <input
                type="text"
                maxLength={10}
                value={taxNumber}
                onChange={(e) => setTaxNumber(formatTaxNumber(e.target.value, "vkn"))}
                className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                placeholder="10 Haneli VKN"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                İş Emri Tamamlandığında Otomatik Fatura Oluştur
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Araç teslim edildiğinde iş emri içerisindeki kalemlerden otomatik Açık Fatura kesilir.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoInvoice}
              onChange={(e) => setAutoInvoice(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="gap-2 cursor-pointer shadow-sky-500/25"
            >
              <Save size={15} />
              <span>{isPending ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
