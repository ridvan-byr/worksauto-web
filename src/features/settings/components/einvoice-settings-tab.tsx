"use client"

import * as React from "react"
import {
  Receipt,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Hash,
  RefreshCw,
  Sparkles,
  Eye,
  EyeOff,
  Copy,
  Check,
  HelpCircle,
  FlaskConical,
  Zap,
  Undo2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/sonner"
import { apiClient } from "@/lib/api-client"

export type InvoiceProvider =
  | "INTERNAL"
  | "PARASUT"
  | "NILVERA"
  | "BIZIMHESAP"
  | "KOLAYBI"
  | "QNB_EFINANS"

interface InvoiceSettingsResponse {
  provider: InvoiceProvider
  hasApiKey: boolean
  hasApiSecret: boolean
  hasPassword: boolean
  maskedApiKey: string | null
  username: string | null
  companyTaxId: string | null
  taxOffice: string | null
  seriesPrefix: string
  isTestMode: boolean
  autoSendOnCompletion: boolean
}

/* =========================================================================
   Resmi Entegratör Logoları (WebP / PNG Yüksek Çözünürlüklü Marka Varlıkları)
========================================================================= */

function ParasutLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl bg-white p-1.5 shadow-sm border border-slate-200/80 dark:border-slate-700/80 shrink-0 overflow-hidden ${className}`}
    >
      <img
        src="/integrators/parasut.webp"
        alt="Paraşüt Logo"
        className="w-full h-full object-contain"
        onError={(e) => {
          e.currentTarget.src = "/integrators/parasut.png"
        }}
      />
    </div>
  )
}

function NilveraLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl bg-white p-1.5 shadow-sm border border-slate-200/80 dark:border-slate-700/80 shrink-0 overflow-hidden ${className}`}
    >
      <img
        src="/integrators/nilvera.webp"
        alt="Nilvera Logo"
        className="w-full h-full object-contain"
        onError={(e) => {
          e.currentTarget.src = "/integrators/nilvera.png"
        }}
      />
    </div>
  )
}

function BizimHesapLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl bg-[#20554f] shadow-sm border border-slate-200/80 dark:border-slate-700/80 shrink-0 overflow-hidden ${className}`}
    >
      <img
        src="/integrators/bizimhesap.webp"
        alt="BizimHesap Logo"
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.src = "/integrators/bizimhesap.png"
        }}
      />
    </div>
  )
}

function KolayBiLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl bg-white p-1 shadow-sm border border-slate-200/80 dark:border-slate-700/80 shrink-0 overflow-hidden ${className}`}
    >
      <img
        src="/integrators/kolaybi.webp"
        alt="KolayBi' Logo"
        className="w-full h-full object-contain"
        onError={(e) => {
          e.currentTarget.src = "/integrators/kolaybi.png"
        }}
      />
    </div>
  )
}

function QnbFinansLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl bg-white p-1.5 shadow-sm border border-slate-200/80 dark:border-slate-700/80 shrink-0 overflow-hidden ${className}`}
    >
      <img
        src="/integrators/qnb-efinans.webp"
        alt="QNB e-Finans Logo"
        className="w-full h-full object-contain"
        onError={(e) => {
          e.currentTarget.src = "/integrators/qnb-efinans.png"
        }}
      />
    </div>
  )
}

function InternalDraftLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div
      className={`${className} rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-sky-500 p-0.5 shadow-md shadow-emerald-500/20 flex items-center justify-center`}
    >
      <div className="w-full h-full rounded-[14px] bg-white dark:bg-slate-900 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
        <Receipt size={22} className="stroke-[2.2]" />
      </div>
    </div>
  )
}

/* =========================================================================
   Ana Bileşen: EInvoiceSettingsTab
========================================================================= */

export function EInvoiceSettingsTab() {
  const [loading, setLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isTesting, setIsTesting] = React.useState(false)
  const [showSecret, setShowSecret] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [copiedKey, setCopiedKey] = React.useState(false)

  const [testResult, setTestResult] = React.useState<{
    success: boolean
    message: string
    balance?: number
  } | null>(null)

  // Form State
  const [provider, setProvider] = React.useState<InvoiceProvider>("INTERNAL")
  const [apiKey, setApiKey] = React.useState("")
  const [apiSecret, setApiSecret] = React.useState("")
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [companyTaxId, setCompanyTaxId] = React.useState("")
  const [taxOffice, setTaxOffice] = React.useState("")
  const [seriesPrefix, setSeriesPrefix] = React.useState("ATW")
  const [isTestMode, setIsTestMode] = React.useState(false)
  const [autoSendOnCompletion, setAutoSendOnCompletion] = React.useState(false)
  const [maskedApiKey, setMaskedApiKey] = React.useState<string | null>(null)

  // Track initially loaded settings to detect unsaved changes
  const [initialSettings, setInitialSettings] = React.useState<{
    provider: InvoiceProvider
    username: string
    companyTaxId: string
    taxOffice: string
    seriesPrefix: string
    isTestMode: boolean
    autoSendOnCompletion: boolean
  } | null>(null)

  // Load Settings
  React.useEffect(() => {
    let isMounted = true
    apiClient
      .get<InvoiceSettingsResponse>("/settings/invoice")
      .then((data) => {
        if (!isMounted || !data) return
        const loadedProvider = data.provider || "INTERNAL"
        const loadedUsername = data.username || ""
        const loadedTaxId = data.companyTaxId || ""
        const loadedTaxOffice = data.taxOffice || ""
        const loadedPrefix = data.seriesPrefix || "ATW"
        const loadedTestMode = Boolean(data.isTestMode)
        const loadedAutoSend = Boolean(data.autoSendOnCompletion)

        setProvider(loadedProvider)
        setMaskedApiKey(data.maskedApiKey)
        setUsername(loadedUsername)
        setCompanyTaxId(loadedTaxId)
        setTaxOffice(loadedTaxOffice)
        setSeriesPrefix(loadedPrefix)
        setIsTestMode(loadedTestMode)
        setAutoSendOnCompletion(loadedAutoSend)

        setInitialSettings({
          provider: loadedProvider,
          username: loadedUsername,
          companyTaxId: loadedTaxId,
          taxOffice: loadedTaxOffice,
          seriesPrefix: loadedPrefix,
          isTestMode: loadedTestMode,
          autoSendOnCompletion: loadedAutoSend,
        })
      })
      .catch((err) => {
        console.warn("Fatura ayarları yüklenemedi:", err)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  // VKN / TCKN Formatlaması (Sadece Rakam, En Fazla 11 Hane)
  const handleTaxIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 11)
    setCompanyTaxId(raw)
  }

  // Seri Ön Eki Formatlaması (Sadece Büyük Harf, En Fazla 3 Hane)
  const handleSeriesPrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 3)
    setSeriesPrefix(raw)
  }

  // Vergi Dairesi Formatlaması (İlk Harfler Büyük)
  const handleTaxOfficeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    // Basit Türkçe büyük harf desteği
    const formatted = val
      .split(" ")
      .map((word) =>
        word.length > 0
          ? word.charAt(0).toLocaleUpperCase("tr-TR") + word.slice(1).toLocaleLowerCase("tr-TR")
          : ""
      )
      .join(" ")
    setTaxOffice(formatted)
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      const res = await apiClient.post<{
        success: boolean
        message: string
        balance?: number
      }>("/settings/invoice/test", {
        provider,
        apiKey: apiKey.trim() || undefined,
        apiSecret: apiSecret.trim() || undefined,
        username: username.trim() || undefined,
        password: password.trim() || undefined,
        companyTaxId: companyTaxId.trim() || undefined,
        isTestMode,
      })

      setTestResult(res)
      if (res.success) {
        toast.success("Bağlantı Başarılı!", {
          description: res.message,
        })
      } else {
        toast.error("Bağlantı Başarısız", {
          description: res.message,
        })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bağlantı testi sırasında hata oluştu."
      setTestResult({ success: false, message: msg })
      toast.error(msg)
    } finally {
      setIsTesting(false)
    }
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (provider !== "INTERNAL") {
      const hasKey = Boolean(apiKey.trim() || maskedApiKey)
      if (!hasKey) {
        toast.warning(`${provider} entegrasyonu için lütfen API Anahtarını giriniz veya bağlantıyı test ediniz.`)
        return
      }
    }

    setIsSaving(true)
    try {
      const updated = await apiClient.put<InvoiceSettingsResponse>("/settings/invoice", {
        provider,
        apiKey: apiKey.trim() ? apiKey.trim() : undefined,
        apiSecret: apiSecret.trim() ? apiSecret.trim() : undefined,
        username: username.trim() ? username.trim() : undefined,
        password: password.trim() ? password.trim() : undefined,
        companyTaxId: companyTaxId.trim() || undefined,
        taxOffice: taxOffice.trim() || undefined,
        seriesPrefix: seriesPrefix.trim().toUpperCase() || "ATW",
        isTestMode,
        autoSendOnCompletion,
      })

      if (updated) {
        setMaskedApiKey(updated.maskedApiKey)
        setApiKey("")
        setApiSecret("")
        setPassword("")
        setInitialSettings({
          provider: updated.provider || provider,
          username: updated.username || "",
          companyTaxId: updated.companyTaxId || "",
          taxOffice: updated.taxOffice || "",
          seriesPrefix: updated.seriesPrefix || "ATW",
          isTestMode: Boolean(updated.isTestMode),
          autoSendOnCompletion: Boolean(updated.autoSendOnCompletion),
        })
      }

      toast.success("Fatura & Entegrasyon ayarları başarıyla kaydedildi!")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ayarlar kaydedilirken hata oluştu."
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  // Reset all fields back to initial saved state
  const handleReset = () => {
    if (!initialSettings) return
    setProvider(initialSettings.provider)
    setUsername(initialSettings.username)
    setCompanyTaxId(initialSettings.companyTaxId)
    setTaxOffice(initialSettings.taxOffice)
    setSeriesPrefix(initialSettings.seriesPrefix)
    setIsTestMode(initialSettings.isTestMode)
    setAutoSendOnCompletion(initialSettings.autoSendOnCompletion)
    setApiKey("")
    setApiSecret("")
    setPassword("")
    toast.info("Değişiklikler geri alındı.")
  }

  const copyMaskedKey = () => {
    if (maskedApiKey) {
      navigator.clipboard.writeText(maskedApiKey)
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400 space-y-3">
        <Loader2 className="animate-spin text-sky-500" size={28} />
        <span className="text-xs font-semibold">Entegrasyon ayarları yükleniyor...</span>
      </div>
    )
  }

  // VKN Doğrulama Rozeti
  const isVknValid = companyTaxId.length === 10
  const isTcknValid = companyTaxId.length === 11

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-in fade-in duration-200 max-w-5xl pb-12">
      {/* Header Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-transparent border border-sky-500/20">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/25 shrink-0">
            <Receipt size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
              <span>E-Fatura & Çoklu Muhasebe Sağlayıcıları</span>
              <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                GİB & VUK Uyumlu
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              İşletmenizin kullandığı muhasebe yazılımını seçin. API anahtarınızı girerek iş emirlerinizi tek tıkla resmi e-faturaya dönüştürün.
            </p>
          </div>
        </div>
      </div>

      {/* Provider Selector Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Fatura Sağlayıcısını Seçin
          </label>
          <span className="text-[11px] text-slate-400 font-medium">
            Seçili: <strong className="text-sky-600 dark:text-sky-400">{provider}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* 1. DAHİLİ TASLAK (Yerel & Ücretsiz) */}
          <div
            onClick={() => setProvider("INTERNAL")}
            className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
              provider === "INTERNAL"
                ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <InternalDraftLogo className="w-10 h-10" />
                {provider === "INTERNAL" ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                    <Check size={14} className="stroke-[3]" />
                  </div>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Sıfır Maliyet
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>Dahili Belge / Ön Muhasebe</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Ek entegratör veya kontör maliyeti olmadan sistem içi kurumsal A4 servis makbuzu ve PDF dökümü oluşturur.
              </p>
            </div>
            <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="flex items-center gap-1">
                <Sparkles size={13} /> Entegrasyonsuz & Hızlı
              </span>
              <span className="font-mono text-[10px] text-slate-400">Dahili</span>
            </div>
          </div>

          {/* 2. PARAŞÜT */}
          <div
            onClick={() => setProvider("PARASUT")}
            className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
              provider === "PARASUT"
                ? "border-sky-500 bg-sky-500/5 dark:bg-sky-500/10 shadow-md shadow-sky-500/10 ring-2 ring-sky-500/20"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <ParasutLogo className="w-10 h-10 shadow-sm rounded-2xl" />
                {provider === "PARASUT" ? (
                  <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-sm">
                    <Check size={14} className="stroke-[3]" />
                  </div>
                ) : (
                  <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">
                    Popüler
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Paraşüt</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Mikro Grup altyapısıyla GİB e-Fatura & e-Arşiv API entegrasyonu, otomatik cari bakiye ve kasa tahsilatı.
              </p>
            </div>
            <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-medium text-sky-600 dark:text-sky-400">OAuth 2.0 & REST API</span>
              <span className="font-mono text-[10px] text-slate-400">GİB Onaylı</span>
            </div>
          </div>

          {/* 3. NILVERA */}
          <div
            onClick={() => setProvider("NILVERA")}
            className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
              provider === "NILVERA"
                ? "border-rose-500 bg-rose-500/5 dark:bg-rose-500/10 shadow-md shadow-rose-500/10 ring-2 ring-rose-500/20"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <NilveraLogo className="w-10 h-10 shadow-sm rounded-2xl" />
                {provider === "NILVERA" ? (
                  <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm">
                    <Check size={14} className="stroke-[3]" />
                  </div>
                ) : (
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                    Resmi Entegratör
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Nilvera</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Doğrudan GİB portalı, e-imza, karekodlu resmi PDF indirme ve e-arşiv portal gönderimi.
              </p>
            </div>
            <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-medium text-rose-600 dark:text-rose-400">API Key & Webhook</span>
              <span className="font-mono text-[10px] text-slate-400">GİB Onaylı</span>
            </div>
          </div>

          {/* 4. BİZİMHESAP */}
          <div
            onClick={() => setProvider("BIZIMHESAP")}
            className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
              provider === "BIZIMHESAP"
                ? "border-blue-600 bg-blue-600/5 dark:bg-blue-600/10 shadow-md shadow-blue-600/10 ring-2 ring-blue-600/20"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <BizimHesapLogo className="w-10 h-10 shadow-sm rounded-2xl" />
                {provider === "BIZIMHESAP" ? (
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
                    <Check size={14} className="stroke-[3]" />
                  </div>
                ) : (
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                    KOBİ Dostu
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">BizimHesap</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Online ön muhasebe, cari takibi ve GİB e-fatura / e-arşiv fatura otomatik aktarımı.
              </p>
            </div>
            <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-medium text-blue-600 dark:text-blue-400">API Token & Token Sync</span>
              <span className="font-mono text-[10px] text-slate-400">Bulut Muhasebe</span>
            </div>
          </div>

          {/* 5. KOLAYBİ' */}
          <div
            onClick={() => setProvider("KOLAYBI")}
            className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
              provider === "KOLAYBI"
                ? "border-purple-500 bg-purple-500/5 dark:bg-purple-500/10 shadow-md shadow-purple-500/10 ring-2 ring-purple-500/20"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <KolayBiLogo className="w-10 h-10 shadow-sm rounded-2xl" />
                {provider === "KOLAYBI" ? (
                  <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-sm">
                    <Check size={14} className="stroke-[3]" />
                  </div>
                ) : (
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                    Bulut Ofis
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">KolayBi'</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                KolayBi' Ofis & E-Dönüşüm altyapısıyla hızlı e-arşiv faturalandırma ve tahsilat takibi.
              </p>
            </div>
            <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-medium text-purple-600 dark:text-purple-400">REST API</span>
              <span className="font-mono text-[10px] text-slate-400">E-Dönüşüm</span>
            </div>
          </div>

          {/* 6. QNB E-FİNANS */}
          <div
            onClick={() => setProvider("QNB_EFINANS")}
            className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
              provider === "QNB_EFINANS"
                ? "border-rose-900 bg-rose-900/5 dark:bg-rose-900/10 shadow-md shadow-rose-900/10 ring-2 ring-rose-900/20"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <QnbFinansLogo className="w-10 h-10 shadow-sm rounded-2xl" />
                {provider === "QNB_EFINANS" ? (
                  <div className="w-6 h-6 rounded-full bg-rose-900 text-white flex items-center justify-center shadow-sm">
                    <Check size={14} className="stroke-[3]" />
                  </div>
                ) : (
                  <span className="text-[10px] font-bold text-rose-800 dark:text-rose-400 bg-rose-900/10 px-2 py-0.5 rounded-full">
                    Banka Güvencesi
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">QNB e-Finans</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                QNB Finansbank kurumsal e-dönüşüm, saklama ve resmi e-fatura portalı bağlantısı.
              </p>
            </div>
            <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-medium text-rose-800 dark:text-rose-400">Web Servis (SOAP/REST)</span>
              <span className="font-mono text-[10px] text-slate-400">Kurumsal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Details & Credentials (Yalnızca Dış Entegratör Seçildiğinde Gösterilir) */}
      {provider !== "INTERNAL" && (
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-2">
            <div className="flex items-center gap-3">
              {provider === "PARASUT" && <ParasutLogo className="w-10 h-10 rounded-xl" />}
              {provider === "NILVERA" && <NilveraLogo className="w-10 h-10 rounded-xl" />}
              {provider === "BIZIMHESAP" && <BizimHesapLogo className="w-10 h-10 rounded-xl" />}
              {provider === "KOLAYBI" && <KolayBiLogo className="w-10 h-10 rounded-xl" />}
              {provider === "QNB_EFINANS" && <QnbFinansLogo className="w-10 h-10 rounded-xl" />}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {provider === "PARASUT" && "Paraşüt API Kimlik Bilgileri"}
                  {provider === "NILVERA" && "Nilvera API Kimlik Bilgileri"}
                  {provider === "BIZIMHESAP" && "BizimHesap API Token Bilgileri"}
                  {provider === "KOLAYBI" && "KolayBi' API Kimlik Bilgileri"}
                  {provider === "QNB_EFINANS" && "QNB e-Finans Web Servis Bilgileri"}
                </h4>
                <p className="text-xs text-slate-500">
                  Entegratör portalınızdaki &quot;Geliştirici / API&quot; bölümünden aldığınız bilgileri giriniz.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold self-start sm:self-auto border border-emerald-500/20">
              <ShieldCheck size={14} />
              <span>AES-256-GCM ile Korumalı</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* API Key / Client ID */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {provider === "PARASUT" ? "Client ID / Uygulama Anahtarı" : "API Anahtarı (API Key)"}
                </label>
                {maskedApiKey && (
                  <button
                    type="button"
                    onClick={copyMaskedKey}
                    className="text-[11px] text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey ? <Check size={12} /> : <Copy size={12} />}
                    <span className="font-mono">{maskedApiKey}</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value.trim())}
                placeholder={maskedApiKey ? "Değiştirmek için yeni anahtarı yapıştırın" : "örn. pk_live_9a8b7c6d5e4f..."}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all placeholder:font-sans placeholder:text-slate-400"
              />
              <p className="text-[11px] text-slate-400">
                {provider === "PARASUT" && "Paraşüt Geliştirici sayfanızdaki Client ID değeridir."}
                {provider === "NILVERA" && "Nilvera Portal > Ayarlar > API Anahtarları sayfasından üretilir."}
                {provider === "BIZIMHESAP" && "BizimHesap Ayarlar > Entegrasyonlar sekmesindeki API Token'dır."}
                {provider === "KOLAYBI" && "KolayBi' Ofis Ayarlar > API Erişim anahtarıdır."}
                {provider === "QNB_EFINANS" && "QNB e-Finans portal kullanıcı API yetki anahtarıdır."}
              </p>
            </div>

            {/* API Secret / Client Secret */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {provider === "PARASUT" ? "Client Secret / Gizli Anahtar" : "API Gizli Anahtarı (Secret)"}
              </label>
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value.trim())}
                  placeholder="••••••••••••••••••••••••"
                  className="w-full h-11 pl-3.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                >
                  {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Veritabanında şifrelenir; sistem yöneticileri dahil hiç kimse düz metin olarak göremez.
              </p>
            </div>

            {/* Kullanıcı Adı / E-Posta */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Entegratör Kullanıcı Adı / E-Posta
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.trim())}
                placeholder="muhasebe@servis.com"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              />
              <p className="text-[11px] text-slate-400">
                Sağlayıcı portalına giriş yaparken kullandığınız yetkili e-posta adresi.
              </p>
            </div>

            {/* Entegratör Şifresi */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Entegratör Şifresi
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-11 pl-3.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                API oturum açma (Basic/OAuth token) işlemlerinde kullanılır.
              </p>
            </div>
          </div>

          {/* Test Connection Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="cursor-pointer gap-2 h-10 px-4 text-xs font-bold border-sky-500/30 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 shadow-xs"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="animate-spin" size={15} />
                    <span>Bağlantı Doğrulanıyor...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={15} />
                    <span>Bağlantıyı & Kontörü Test Et</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                onClick={() => handleSave()}
                disabled={isSaving}
                className="cursor-pointer gap-2 h-10 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin" size={15} />
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <Check size={15} />
                    <span>{provider} Entegrasyonunu Kaydet</span>
                  </>
                )}
              </Button>

              {testResult && (
                <div
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border animate-in fade-in ${
                    testResult.success
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20"
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  ) : (
                    <AlertCircle size={16} className="text-rose-600" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <HelpCircle size={13} />
              <span>Kaydetmeden önce bağlantıyı test etmeniz önerilir.</span>
            </div>
          </div>
        </div>
      )}

      {/* GİB Fatura Serisi ve Vergi Kimlik Bilgileri */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Hash size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              GİB Fatura Serisi & Şirket Mali Kaydı
            </h4>
            <p className="text-xs text-slate-500">
              Resmi faturaların üzerine basılacak 3 haneli seri kodu ve Vergi Kimlik Numarası formatı.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Seri Ön Eki */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                GİB Seri Ön Eki (3 Harf)
              </label>
              <span className="text-[10px] font-mono font-bold text-sky-600 bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.5 rounded">
                {seriesPrefix.length}/3
              </span>
            </div>
            <input
              type="text"
              maxLength={3}
              value={seriesPrefix}
              onChange={handleSeriesPrefixChange}
              placeholder="ATW"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-mono font-black tracking-widest text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            />
            <div className="p-2 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-[11px] font-mono text-slate-600 dark:text-slate-400 flex items-center justify-between">
              <span>Fatura Önizleme:</span>
              <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                {seriesPrefix || "ATW"}{new Date().getFullYear()}000000001
              </strong>
            </div>
          </div>

          {/* VKN / TCKN */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                İşletme VKN / TCKN
              </label>
              {isVknValid && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Check size={10} /> 10 Hane (VKN)
                </span>
              )}
              {isTcknValid && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Check size={10} /> 11 Hane (TCKN)
                </span>
              )}
            </div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={11}
              value={companyTaxId}
              onChange={handleTaxIdChange}
              placeholder="10 haneli VKN veya 11 haneli TCKN"
              className={`w-full h-11 px-3.5 rounded-xl border bg-slate-50 dark:bg-slate-950 text-xs font-mono font-bold tracking-wider focus:outline-none focus:ring-2 transition-all ${
                isVknValid || isTcknValid
                  ? "border-emerald-500 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                  : "border-slate-200 dark:border-slate-800 focus:ring-sky-500"
              }`}
            />
            <p className="text-[11px] text-slate-400">
              GİB mükellefiyeti için tüzel şirketlerde 10 hane, şahıs işletmelerinde 11 haneli TC kimlik no giriniz.
            </p>
          </div>

          {/* Vergi Dairesi */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Bağlı Olunan Vergi Dairesi
            </label>
            <input
              type="text"
              value={taxOffice}
              onChange={handleTaxOfficeChange}
              placeholder="örn. Maslak Vergi Dairesi"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            />
            <p className="text-[11px] text-slate-400">
              Resmi fatura çıktısının başlık kısmında gösterilir.
            </p>
          </div>
        </div>

        {/* Akıllı Otomasyon Switch'leri */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Sandbox / Test Ortamı */}
          <div
            role="switch"
            aria-checked={isTestMode}
            tabIndex={0}
            onClick={() => setIsTestMode(!isTestMode)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                setIsTestMode(!isTestMode)
              }
            }}
            className={`group relative flex items-start justify-between gap-3 p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none ${
              isTestMode
                ? "bg-amber-500/10 dark:bg-amber-950/30 border-amber-500/40 shadow-sm shadow-amber-500/5 ring-1 ring-amber-500/20"
                : "bg-slate-50/80 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-900/60"
            }`}
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors mt-0.5 ${
                  isTestMode
                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                    : "bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                }`}
              >
                <FlaskConical size={18} />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Sandbox / Test Ortamı
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Aktif olduğunda kesilen faturalar GİB mali kaydı oluşturmaz, test sunucusuna gönderilir ve kontör harcanmaz.
                </p>
              </div>
            </div>

            {/* iOS Style Custom Toggle Switch */}
            <div className="shrink-0 pt-0.5 ml-2">
              <div
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                  isTestMode ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                    isTestMode ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* 2. İş Emri Kapanışında Otomatik Gönder */}
          <div
            role="switch"
            aria-checked={autoSendOnCompletion}
            tabIndex={0}
            onClick={() => setAutoSendOnCompletion(!autoSendOnCompletion)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                setAutoSendOnCompletion(!autoSendOnCompletion)
              }
            }}
            className={`group relative flex items-start justify-between gap-3 p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none ${
              autoSendOnCompletion
                ? "bg-sky-500/10 dark:bg-sky-950/30 border-sky-500/40 shadow-sm shadow-sky-500/5 ring-1 ring-sky-500/20"
                : "bg-slate-50/80 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-900/60"
            }`}
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors mt-0.5 ${
                  autoSendOnCompletion
                    ? "bg-sky-500/20 text-sky-600 dark:text-sky-400"
                    : "bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                }`}
              >
                <Zap size={18} />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    İş Emri Kapanışında Otomatik Gönder
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  İş emri tamamlanıp &quot;Teslim Edildi&quot; aşamasına geçtiğinde faturayı beklemeden otomatik GİB sırasına alır.
                </p>
              </div>
            </div>

            {/* iOS Style Custom Toggle Switch */}
            <div className="shrink-0 pt-0.5 ml-2">
              <div
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                  autoSendOnCompletion ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                    autoSendOnCompletion ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Global Save Bar */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Aktif Sağlayıcı:</span>
            <span className="text-sky-600 dark:text-sky-400 font-mono font-bold">{provider}</span>
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Fatura serisi, şirket vergi bilgileri ve otomatik gönderim ayarlarını kaydetmek için butona tıklayınız.
          </p>
        </div>
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isSaving}
            className="h-10 px-4 text-xs font-semibold rounded-xl cursor-pointer w-full sm:w-auto justify-center"
          >
            <Undo2 size={14} className="mr-1" />
            <span>Sıfırla</span>
          </Button>
          <Button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="h-10 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            <span>Fatura & Entegrasyon Ayarlarını Kaydet</span>
          </Button>
        </div>
      </div>
    </form>
  )
}
