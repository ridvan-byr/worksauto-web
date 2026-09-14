"use client"

import * as React from "react"
import { Building2, Save, MapPin, Navigation, ExternalLink, Loader2, Compass, Check, Link2, AlertTriangle } from "lucide-react"
import { UnsavedChangesBar } from "./unsaved-changes-bar"
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
  const [mapsLink, setMapsLink] = React.useState("")
  const [linkParsed, setLinkParsed] = React.useState(false)

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

  const parseGoogleMapsLink = (link: string): { lat: number; lng: number } | null => {
    // Pattern 1: google.com/maps?q=41.008234,28.978456
    const qMatch = link.match(/[?&]q=(-?\d+\.\d+),\s*(-?\d+\.\d+)/)
    if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) }

    // Pattern 2: google.com/maps/@41.008234,28.978456
    const atMatch = link.match(/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/)
    if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) }

    // Pattern 3: google.com/maps/place/.../@41.008234,28.978456
    const placeMatch = link.match(/place\/.*?\/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/)
    if (placeMatch) return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) }

    // Pattern 4: maps.app.goo.gl short links — user may paste full resolved URL
    const llMatch = link.match(/ll=(-?\d+\.\d+),\s*(-?\d+\.\d+)/)
    if (llMatch) return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) }

    // Pattern 5: Raw coordinates: "41.008234, 28.978456" or "41.008234,28.978456"
    const rawMatch = link.trim().match(/^(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)$/)
    if (rawMatch) return { lat: parseFloat(rawMatch[1]), lng: parseFloat(rawMatch[2]) }

    return null
  }

  const handleParseMapsLink = () => {
    const parsed = parseGoogleMapsLink(mapsLink)
    if (parsed) {
      setLatitude(String(parsed.lat))
      setLongitude(String(parsed.lng))
      setLinkParsed(true)
      setTimeout(() => setLinkParsed(false), 3000)
      toast.success(`Koordinatlar alındı: ${parsed.lat}, ${parsed.lng}`)
    } else {
      toast.error("Bu linkten koordinat çözümlenemedi. Google Maps linki veya koordinat yapıştırın.")
    }
  }

  const handleMapsLinkPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    setTimeout(() => {
      const val = e.currentTarget?.value || mapsLink
      const parsed = parseGoogleMapsLink(val)
      if (parsed) {
        setLatitude(String(parsed.lat))
        setLongitude(String(parsed.lng))
        setLinkParsed(true)
        setTimeout(() => setLinkParsed(false), 3000)
        toast.success(`Koordinatlar otomatik alındı: ${parsed.lat}, ${parsed.lng}`)
      }
    }, 100)
  }

  const handleGetLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("Tarayıcınız konum servisini desteklemiyor.")
      return
    }

    // HTTPS check — Geolocation API requires secure context
    const isSecure = window.isSecureContext
    if (!isSecure) {
      toast.error(
        "Konum servisi yalnızca HTTPS üzerinden çalışır. Lütfen Google Maps'ten link yapıştırarak konum belirleyin.",
        { duration: 6000 }
      )
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
          toast.error(
            "Konum izni reddedildi. Tarayıcı ayarlarından konum iznini aktif edin veya Google Maps linkinden koordinat yapıştırın.",
            { duration: 6000 }
          )
        } else if (err.code === 2) {
          toast.error("Konum servisi kullanılamıyor. GPS kapalı olabilir.")
        } else {
          toast.error("Konum alınırken zaman aşımı oluştu. Tekrar deneyin veya link yapıştırın.")
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  const hasUnsavedChanges = React.useMemo(() => {
    if (!initialData) return false
    const initLat = initialData.latitude !== undefined && initialData.latitude !== null ? String(initialData.latitude) : ""
    const initLng = initialData.longitude !== undefined && initialData.longitude !== null ? String(initialData.longitude) : ""
    return (
      title !== (initialData.title || "") ||
      legalName !== (initialData.legalName || "") ||
      phone !== (initialData.phone || "") ||
      email !== (initialData.email || "") ||
      address !== (initialData.address || "") ||
      city !== (initialData.city || "") ||
      district !== (initialData.district || "") ||
      taxOffice !== (initialData.taxOffice || "") ||
      taxNumber !== (initialData.taxNumber || "") ||
      autoInvoice !== (initialData.autoInvoiceOnComplete ?? true) ||
      latitude !== initLat ||
      longitude !== initLng
    )
  }, [
    initialData,
    title,
    legalName,
    phone,
    email,
    address,
    city,
    district,
    taxOffice,
    taxNumber,
    autoInvoice,
    latitude,
    longitude,
  ])

  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  const handleReset = () => {
    if (!initialData) return
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
    toast.info("Değişiklikler geri alındı.")
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
      <Card className="border-sky-200/60 dark:border-sky-900/30 shadow-xs">
        <CardHeader className="p-6 bg-gradient-to-r from-sky-500/5 via-transparent to-transparent">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <MapPin size={18} className="text-rose-500" />
              <span>Atölye GPS Konumu & Navigasyon Pinleme</span>
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Müşteri takip sayfasındaki &quot;Yol Tarifi Al&quot; butonunun dükkanınızın tam kapısına rota çizmesini sağlar.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
          {/* Google Maps Link Paste — Primary Method */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Link2 size={13} className="text-sky-500" />
              <span>Google Maps Linki Yapıştır</span>
              <span className="ml-auto text-[10px] font-normal text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">Önerilen Yöntem</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={mapsLink}
                  onChange={(e) => setMapsLink(e.target.value)}
                  onPaste={handleMapsLinkPaste}
                  className="w-full h-9 pl-3 pr-8 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-sky-500"
                  placeholder="https://maps.google.com/... veya 41.008234, 28.978456"
                />
                {linkParsed && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <Check size={14} className="text-emerald-500" />
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleParseMapsLink}
                disabled={!mapsLink.trim()}
                className="h-9 px-3 text-xs font-semibold gap-1.5 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 shrink-0 cursor-pointer"
              >
                <MapPin size={13} />
                <span className="hidden sm:inline">Konumu Al</span>
              </Button>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Google Maps'te dükkanınızı bulun → Paylaş → Bağlantıyı kopyala → Buraya yapıştırın. Koordinatlar otomatik algılanır.
            </p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800" /></div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-slate-900 px-3 text-[10px] font-medium text-slate-400">veya</span>
            </div>
          </div>

          {/* GPS Auto-detect — Secondary Method */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGetLocation}
              disabled={isLocating}
              className="h-9 px-3 text-xs font-semibold gap-1.5 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950/40 cursor-pointer"
            >
              {isLocating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Navigation size={14} className="text-sky-500" />
              )}
              <span>{isLocating ? "Konum Alınıyor..." : "Mevcut Konumumu Al (GPS)"}</span>
            </Button>
            {typeof window !== "undefined" && !window.isSecureContext && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle size={11} className="shrink-0" />
                <span>GPS yalnızca HTTPS&apos;te çalışır. Link yapıştırma yöntemini kullanın.</span>
              </p>
            )}
          </div>

          {/* Parsed coordinates display */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-slate-400">Enlem</label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 focus:outline-none focus:border-sky-500 font-mono text-slate-600 dark:text-slate-300"
                placeholder="41.008234"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-slate-400">Boylam</label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 focus:outline-none focus:border-sky-500 font-mono text-slate-600 dark:text-slate-300"
                placeholder="28.978456"
              />
            </div>
          </div>

          {/* Status bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Compass size={15} className="text-sky-500 shrink-0" />
              <span>
                {latitude && longitude
                  ? `Pinlenen Koordinat: ${latitude}, ${longitude}`
                  : "Henüz koordinat belirlenmedi."}
              </span>
            </div>
            {latitude && longitude && (
              <a
                href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 font-semibold text-[11px] transition-colors shrink-0"
              >
                <span>Haritada Doğrula</span>
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

      {/* Shopify tarzı yüzen kayıt barı — her zaman ekranın altında, içerikte ortalı */}
      <UnsavedChangesBar
        visible={hasUnsavedChanges}
        onDiscard={handleReset}
        isSaving={isPending}
        saveButtonType="submit"
      />
    </form>
  )
}
