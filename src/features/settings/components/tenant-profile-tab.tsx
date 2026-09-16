"use client"

import * as React from "react"
import {
  Building2,
  MapPin,
  Navigation,
  ExternalLink,
  Loader2,
  Check,
  Link2,
  AlertTriangle,
  Upload,
  Trash2,
  ImageIcon,
  Star,
  Sliders,
  Sun,
  Moon,
  RotateCcw,
  Eye,
  Sparkles,
} from "lucide-react"
import { UnsavedChangesBar } from "./unsaved-changes-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { TenantSettings } from "@/features/settings/api/use-settings"
import { TURKEY_PROVINCES, getDistrictsForProvince } from "@/lib/turkey-locations"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { formatSmartPhone, formatTaxNumber } from "@/lib/input-formatters"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/features/auth/auth-context"
import { resolveMediaUrl } from "@/lib/utils"
import { toast } from "sonner"

interface TenantProfileTabProps {
  initialData?: TenantSettings
  onSave: (data: Partial<TenantSettings>) => Promise<void>
  isPending: boolean
}

export function TenantProfileTab({
  initialData,
  onSave,
  isPending,
}: TenantProfileTabProps) {
  const { updateTenant } = useAuth()
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

  // New Corporate Fields: Logo
  const [logoUrl, setLogoUrl] = React.useState("")
  const [logoFailed, setLogoFailed] = React.useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const [googleReviewUrl, setGoogleReviewUrl] = React.useState("")
  const [logoWidth, setLogoWidth] = React.useState(36)
  const [logoHeight, setLogoHeight] = React.useState(36)
  const [previewTheme, setPreviewTheme] = React.useState<"light" | "dark">("dark")
  const [aspectRatio, setAspectRatio] = React.useState<number | null>(null)

  // Otomatik görsel oranını (Aspect Ratio) önceden tespit et
  React.useEffect(() => {
    if (!logoUrl) return
    const img = new window.Image()
    img.src = resolveMediaUrl(logoUrl)
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setAspectRatio(img.naturalWidth / img.naturalHeight)
      }
    }
  }, [logoUrl])

  // Tekil Logo Boyutlandırma / Ölçeklendirme (Header yüksekliğine göre orantılı)
  const handleScaleChange = (val: number) => {
    const clampedHeight = Math.min(Math.max(val, 20), 52)
    setLogoHeight(clampedHeight)
    if (aspectRatio) {
      const calculatedWidth = Math.min(Math.max(Math.round(clampedHeight * aspectRatio), 20), 240)
      setLogoWidth(calculatedWidth)
    } else {
      setLogoWidth(clampedHeight)
    }
  }

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
      setLogoUrl(initialData.logoUrl || "")
      setLogoWidth(initialData.logoWidth || 36)
      setLogoHeight(initialData.logoHeight || 36)
      setGoogleReviewUrl(initialData.googleReviewUrl || "")
      setLogoFailed(false)
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

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await apiClient.upload<{ url: string }>("/media/tenant/logo", formData)
      const freshUrl = res.url ? `${res.url.split("?")[0]}?t=${Date.now()}` : ""
      setLogoUrl(freshUrl)
      setLogoFailed(false)
      updateTenant({ logoUrl: res.url.split("?")[0] })
      toast.success("Kurumsal logo başarıyla yüklendi!")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Logo yüklenirken hata oluştu."
      toast.error(msg)
    } finally {
      setIsUploadingLogo(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleRemoveLogo = () => {
    setLogoUrl("")
    setLogoFailed(false)
    updateTenant({ logoUrl: "" })
    toast.info("Logo kaldırıldı. Kaydet butonuna basarak onaylayabilirsiniz.")
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
      longitude !== initLng ||
      logoUrl !== (initialData.logoUrl || "") ||
      logoWidth !== (initialData.logoWidth || 36) ||
      logoHeight !== (initialData.logoHeight || 36) ||
      googleReviewUrl !== (initialData.googleReviewUrl || "")
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
    logoUrl,
    logoWidth,
    logoHeight,
    googleReviewUrl,
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
    setLogoUrl(initialData.logoUrl || "")
    setLogoWidth(initialData.logoWidth || 36)
    setLogoHeight(initialData.logoHeight || 36)
    setGoogleReviewUrl(initialData.googleReviewUrl || "")
    toast.info("Değişiklikler geri alındı.")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsedLat = latitude.trim() !== "" ? parseFloat(latitude.replace(",", ".")) : null
    const parsedLng = longitude.trim() !== "" ? parseFloat(longitude.replace(",", ".")) : null

    const cleanLogo = logoUrl ? logoUrl.split("?")[0] : null

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
      logoUrl: cleanLogo,
      logoWidth,
      logoHeight,
      googleReviewUrl: googleReviewUrl.trim() || null,
    })

    updateTenant({
      title,
      legalName,
      phone,
      email,
      address,
      city,
      district,
      logoUrl: cleanLogo || undefined,
      logoWidth,
      logoHeight,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Kurumsal Servis Logosu Card */}
      <Card>
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ImageIcon size={18} className="text-sky-500" />
            <span>Kurumsal Servis Logosu</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Panel üst menüsünde (Header), e-fatura başlıklarında, müşteri araç takip ekranında ve teklif çıktılarında yer alacak resmi servis amblemi
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
            {/* Logo Preview Box */}
            <div className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 flex items-center justify-center p-2 shrink-0 shadow-inner group overflow-hidden">
              {logoUrl && !logoFailed ? (
                <img
                  src={resolveMediaUrl(logoUrl)}
                  alt="Kurumsal Logo"
                  className="w-full h-full object-contain"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-2 text-slate-400">
                  {logoFailed ? (
                    <div className="flex flex-col items-center justify-center text-amber-600 dark:text-amber-400">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 mb-1">
                        <Building2 size={22} />
                      </div>
                      <span className="text-[9px] font-bold">Logo Yüklenemedi</span>
                    </div>
                  ) : (
                    <>
                      <Building2 size={24} className="mb-1 text-slate-300 dark:text-slate-600" />
                      <span className="text-[10px] font-semibold">Logo Yok</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons & Info */}
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {logoUrl ? "Kurumsal Logo Aktif" : "Henüz bir kurumsal logo yüklenmedi"}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  PNG, JPG, WEBP veya SVG formatında (Maks. 5MB). Şeffaf (transparent) arka planlı logolar en iyi sonucu verir.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploadingLogo || isPending}
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs h-9 gap-1.5 border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  {isUploadingLogo ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Yükleniyor...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span>{logoUrl ? "Logoyu Değiştir" : "Logo Yükle"}</span>
                    </>
                  )}
                </Button>

                {logoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isUploadingLogo || isPending}
                    onClick={handleRemoveLogo}
                    className="text-xs h-9 gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>Kaldır</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Header Logo Boyutlandırma & Canlı Önizleme */}
          {logoUrl && !logoFailed && (
            <div className="mt-6 pt-6 border-t border-slate-200/80 dark:border-slate-800 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Sliders size={16} className="text-sky-500" />
                    <span>Üst Menü (Header) Logo Boyutu & Canlı Önizleme</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Logonuzun üst menüde (Header) nasıl duracağını canlı olarak görüp genişlik ve yüksekliğini ayarlayabilirsiniz.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleScaleChange(36)}
                    className="h-8 text-xs gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>Varsayılana Sıfırla (36px)</span>
                  </Button>
                </div>
              </div>

              {/* Canlı Header Mockup Önizlemesi */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Eye size={14} className="text-sky-500" />
                    <span>Header Canlı Önizleme Simülatörü</span>
                  </span>
                  {/* Tema Değiştirici */}
                  <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800/80 p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setPreviewTheme("light")}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                        previewTheme === "light"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <Sun size={11} />
                      <span>Açık Tema</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTheme("dark")}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                        previewTheme === "dark"
                          ? "bg-slate-900 text-slate-100 shadow-xs"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <Moon size={11} />
                      <span>Koyu Tema</span>
                    </button>
                  </div>
                </div>

                {/* Header Bar Mockup */}
                <div
                  className={`rounded-2xl border transition-all p-3 sm:px-6 flex items-center justify-between shadow-xs ${
                    previewTheme === "dark"
                      ? "bg-[#070b12] border-slate-800 text-slate-100"
                      : "bg-white border-slate-200 text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Logo (Doğrudan Boyutlanan Resim) */}
                    <img
                      src={resolveMediaUrl(logoUrl)}
                      alt={title || "Servis"}
                      onLoad={(e) => {
                        const img = e.currentTarget
                        if (img.naturalWidth && img.naturalHeight) {
                          setAspectRatio(img.naturalWidth / img.naturalHeight)
                        }
                      }}
                      style={{
                        maxHeight: `${logoHeight}px`,
                        maxWidth: `${logoWidth}px`,
                        width: "auto",
                        height: "auto",
                      }}
                      className="object-contain shrink-0 transition-all"
                    />

                    {/* Servis Başlık & Şehir */}
                    <div className="flex flex-col text-left">
                      <span
                        className={`text-xs sm:text-sm font-bold truncate max-w-[200px] sm:max-w-xs ${
                          previewTheme === "dark" ? "text-slate-100" : "text-slate-900"
                        }`}
                      >
                        {title || "WorksAuto Servis"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium leading-none mt-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        {city ? `${city}${district ? ` / ${district}` : ""}` : "İstanbul / Kadıköy - Oto Servis"}
                      </span>
                    </div>
                  </div>

                  {/* Mockup Header Sağ İkonlar */}
                  <div className="hidden sm:flex items-center gap-2 opacity-50">
                    <div
                      className={`w-28 h-8 rounded-xl border text-[11px] flex items-center px-2.5 ${
                        previewTheme === "dark"
                          ? "border-slate-800 bg-slate-900 text-slate-500"
                          : "border-slate-200 bg-slate-100 text-slate-400"
                      }`}
                    >
                      Hızlı arama...
                    </div>
                    <div
                      className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                        previewTheme === "dark"
                          ? "border-slate-800 bg-slate-900"
                          : "border-slate-200 bg-slate-100"
                      }`}
                    >
                      <Star size={13} className="text-amber-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tekil Logo Boyutlandırma / Ölçeklendirme Sürgüsü */}
              <div className="space-y-3 pt-1">
                <div className="space-y-2.5 p-4 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Sliders size={14} className="text-sky-500" />
                      <span>Logo Boyutu (Ölçek)</span>
                      {aspectRatio && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          (En-Boy Oranı: {aspectRatio.toFixed(2)}:1)
                        </span>
                      )}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-md">
                        {aspectRatio
                          ? `${Math.round(logoHeight * aspectRatio)} × ${logoHeight} px`
                          : `${logoHeight} px`}
                      </span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={20}
                    max={52}
                    step={1}
                    value={logoHeight}
                    onChange={(e) => handleScaleChange(Number(e.target.value))}
                    className="w-full accent-sky-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
                  />

                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>Min: 20px (Kompakt)</span>
                    <span>Standart: 36px</span>
                    <span>Maks: 52px (Header Sınırı)</span>
                  </div>
                </div>

                {/* Hızlı Boyut Şablonları */}
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Sparkles size={12} className="text-amber-500" />
                      <span>Hızlı Boyut:</span>
                    </span>
                    {[
                      { label: "Kompakt (28px)", h: 28 },
                      { label: "Standart (36px)", h: 36 },
                      { label: "Büyük (44px)", h: 44 },
                      { label: "Maksimum (52px)", h: 52 },
                    ].map((preset) => {
                      const isActive = logoHeight === preset.h
                      return (
                        <button
                          key={preset.h}
                          type="button"
                          onClick={() => handleScaleChange(preset.h)}
                          className={`px-3 py-1 text-xs rounded-lg border font-medium transition-colors cursor-pointer ${
                            isActive
                              ? "bg-sky-50 dark:bg-sky-950/40 border-sky-400 text-sky-700 dark:text-sky-300 shadow-xs"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                          }`}
                        >
                          {preset.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
              <MapPin size={15} className="text-sky-500 shrink-0" />
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

          {/* Google Review & Rating URL */}
          <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Star className="text-amber-500 fill-amber-500" size={14} />
                <span>Google İşletme / Dükkan Yorum Linki (Google Review URL)</span>
              </label>
              {googleReviewUrl && (
                <a
                  href={googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  <span>Linki Test Et</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Müşterileriniz canlı araç takip ekranında servisinize 5 yıldız verdiğinde bu bağlantı açılarak doğrudan Google Haritalar profilinizde yorum ve puanlama yapmaya yönlendirilir.
            </p>
            <input
              type="url"
              value={googleReviewUrl}
              onChange={(e) => setGoogleReviewUrl(e.target.value)}
              placeholder="Örn: https://g.page/r/CWd8xyz/review veya https://maps.app.goo.gl/..."
              className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-sky-500 font-mono"
            />
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
        </CardContent>
      </Card>

      {/* Shopify tarzı yüzen kayıt barı — her zaman ekranın altında, içerikte ortalı */}
      <UnsavedChangesBar
        visible={hasUnsavedChanges}
        onDiscard={handleReset}
        onSave={handleSubmit}
        isSaving={isPending}
        saveButtonType="submit"
      />
    </form>
  )
}
