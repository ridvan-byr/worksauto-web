"use client"

import * as React from "react"
import {
  Receipt,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Key,
  ShieldCheck,
  Building2,
  Hash,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Eye,
  EyeOff,
  Copy,
  Check,
  HelpCircle,
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
   Özgün Vektörel Sağlayıcı Logoları (SVG Brand Icons)
========================================================================= */

function ParasutLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="14" fill="#00A3B5" />
      {/* Paraşüt İkonik Origami Figürü */}
      <path
        d="M24 10C17.3726 10 12 15.3726 12 22C12 24.5 13.5 25.5 16 25.5C18.5 25.5 20 24 21 22C22 20 23 20 24 20C25 20 26 20 27 22C28 24 29.5 25.5 32 25.5C34.5 25.5 36 24.5 36 22C36 15.3726 30.6274 10 24 10Z"
        fill="white"
      />
      <path d="M16 25.5L23 37" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 25.5L25 37" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="37.5" r="2.5" fill="#FFE600" />
    </svg>
  )
}

function NilveraLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="nilveraGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E50914" />
          <stop offset="1" stopColor="#8A001A" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#nilveraGrad)" />
      {/* Nilvera İkonik N Harfi */}
      <path
        d="M15 14H20.5L30 30V14H34V34H28.5L19 18V34H15V14Z"
        fill="white"
      />
      <circle cx="34" cy="14" r="2" fill="#FFD700" />
    </svg>
  )
}

function BizimHesapLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bizimGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1877F2" />
          <stop offset="1" stopColor="#0B4FB8" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#bizimGrad)" />
      {/* B Harfi ve Bulut Muhasebe Çizgisi */}
      <path
        d="M16 13H26C29.3137 13 32 15.6863 32 19C32 21.4 30.5 23.4 28.5 24.3C31 25.2 33 27.5 33 30.5C33 34.0899 30.0899 37 26.5 37H16V13ZM21 17.5V23H25.5C26.8807 23 28 21.8807 28 20.5C28 19.1193 26.8807 17.5 25.5 17.5H21ZM21 27.5V32.5H26.5C27.8807 32.5 29 31.3807 29 30C29 28.6193 27.8807 27.5 26.5 27.5H21Z"
        fill="white"
      />
      <circle cx="33" cy="15" r="3" fill="#FF7A00" />
    </svg>
  )
}

function KolayBiLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="kolaybiGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6C5CE7" />
          <stop offset="1" stopColor="#4834D4" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#kolaybiGrad)" />
      {/* KolayBi K Monogramı */}
      <path
        d="M17 14V34M17 24L31 14M22 20.5L32 34"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="31" cy="14" r="2.5" fill="#00CEC9" />
    </svg>
  )
}

function QnbFinansLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="qnbGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8A0035" />
          <stop offset="1" stopColor="#5E0024" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#qnbGrad)" />
      <path
        d="M24 13C17.9249 13 13 17.9249 13 24C13 30.0751 17.9249 35 24 35C26.5 35 28.8 34.1 30.6 32.7L33.5 35.5L35.5 33.5L32.7 30.6C34.1 28.8 35 26.5 35 24C35 17.9249 30.0751 13 24 13ZM24 17C27.866 17 31 20.134 31 24C31 27.866 27.866 31 24 31C20.134 31 17 27.866 17 24C17 20.134 20.134 17 24 17Z"
        fill="white"
      />
      <path d="M28 21L33 16" stroke="#E5B869" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
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

  // Load Settings
  React.useEffect(() => {
    let isMounted = true
    apiClient
      .get<InvoiceSettingsResponse>("/settings/invoice")
      .then((data) => {
        if (!isMounted || !data) return
        setProvider(data.provider || "INTERNAL")
        setMaskedApiKey(data.maskedApiKey)
        setUsername(data.username || "")
        setCompanyTaxId(data.companyTaxId || "")
        setTaxOffice(data.taxOffice || "")
        setSeriesPrefix(data.seriesPrefix || "ATW")
        setIsTestMode(Boolean(data.isTestMode))
        setAutoSendOnCompletion(Boolean(data.autoSendOnCompletion))
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
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
      }

      toast.success("Fatura & Entegrasyon ayarları başarıyla kaydedildi!")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ayarlar kaydedilirken hata oluştu."
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
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
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Key size={18} />
              </div>
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
            <div className="flex items-center gap-3">
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
          <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={isTestMode}
              onChange={(e) => setIsTestMode(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 mt-0.5 cursor-pointer"
            />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>Sandbox / Test Ortamı</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600">
                  Güvenli Mod
                </span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Aktif olduğunda kesilen faturalar GİB mali kaydı oluşturmaz, test sunucusuna gönderilir ve kontör harcanmaz.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={autoSendOnCompletion}
              onChange={(e) => setAutoSendOnCompletion(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 mt-0.5 cursor-pointer"
            />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>İş Emri Kapanışında Otomatik Gönder</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-600">
                  Otomasyon
                </span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                İş emri tamamlanıp &quot;Teslim Edildi&quot; aşamasına geçtiğinde faturayı beklemeden otomatik GİB sırasına alır.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="submit"
          disabled={isSaving}
          className="h-11 px-6 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white cursor-pointer shadow-md shadow-sky-600/20 gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              <span>Ayarlar Kaydediliyor...</span>
            </>
          ) : (
            <>
              <Check size={16} />
              <span>Entegrasyon Ayarlarını Kaydet</span>
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
