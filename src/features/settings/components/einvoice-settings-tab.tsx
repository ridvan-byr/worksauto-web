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
  Server,
  RefreshCw,
  ExternalLink,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/sonner"
import { apiClient } from "@/lib/api-client"

export type InvoiceProvider = "INTERNAL" | "PARASUT" | "NILVERA" | "BIZIMHESAP"

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

export function EInvoiceSettingsTab() {
  const [loading, setLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isTesting, setIsTesting] = React.useState(false)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <Loader2 className="animate-spin mr-2" size={20} />
        <span>Entegrasyon ayarları yükleniyor...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-in fade-in duration-200 max-w-4xl">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-transparent border border-sky-500/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/25">
            <Receipt size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Çoklu E-Fatura & Muhasebe Entegrasyonu
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                GİB & VUK Uyumlu
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Servisinizin faturalama sağlayıcısını seçin. Paraşüt, Nilvera gibi sağlayıcıları bağlayabilir veya ücretsiz iç fatura modunda devam edebilirsiniz.
            </p>
          </div>
        </div>
      </div>

      {/* Provider Selector Cards */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Aktif Fatura Sağlayıcısı
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Internal */}
          <div
            onClick={() => setProvider("INTERNAL")}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              provider === "INTERNAL"
                ? "border-sky-500 bg-sky-500/5 dark:bg-sky-500/10 shadow-sm"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
                  Dahili
                </div>
                {provider === "INTERNAL" && <CheckCircle2 className="text-sky-500" size={18} />}
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">İç Fatura & Ön Muhasebe</h4>
              <p className="text-xs text-slate-500 mt-1">
                Sıfır maliyet, kontör gerektirmez. Kurumsal servis makbuzu ve PDF dökümü oluşturur.
              </p>
            </div>
            <div className="mt-3 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <Sparkles size={12} /> Ücretsiz & Hazır
            </div>
          </div>

          {/* Parasut */}
          <div
            onClick={() => setProvider("PARASUT")}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              provider === "PARASUT"
                ? "border-sky-500 bg-sky-500/5 dark:bg-sky-500/10 shadow-sm"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs">
                  P
                </div>
                {provider === "PARASUT" && <CheckCircle2 className="text-sky-500" size={18} />}
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Paraşüt</h4>
              <p className="text-xs text-slate-500 mt-1">
                GİB E-Fatura & E-Arşiv API entegrasyonu, otomatik cari bakiye ve tahsilat eşlemesi.
              </p>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 font-medium">Resmi Entegratör</div>
          </div>

          {/* Nilvera */}
          <div
            onClick={() => setProvider("NILVERA")}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              provider === "NILVERA"
                ? "border-sky-500 bg-sky-500/5 dark:bg-sky-500/10 shadow-sm"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs">
                  N
                </div>
                {provider === "NILVERA" && <CheckCircle2 className="text-sky-500" size={18} />}
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Nilvera</h4>
              <p className="text-xs text-slate-500 mt-1">
                Doğrudan GİB portalı, e-imza, karekodlu resmi PDF ve e-arşiv portal gönderimi.
              </p>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 font-medium">Resmi Entegratör</div>
          </div>
        </div>
      </div>

      {/* Provider Details & Credentials (Only shown if external provider is selected) */}
      {provider !== "INTERNAL" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Key className="text-sky-500" size={18} />
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {provider === "PARASUT" ? "Paraşüt API Kimlik Bilgileri" : "Nilvera API Kimlik Bilgileri"}
              </h4>
            </div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
              <ShieldCheck size={15} /> AES-256 Şifreli Saklanır
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                API Key / Client ID {maskedApiKey && <span className="text-emerald-500 font-mono">({maskedApiKey})</span>}
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={maskedApiKey ? "Değiştirmek için yeni anahtar girin" : "API Anahtarı"}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                API Secret / Client Secret
              </label>
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Kullanıcı Adı / Entegratör E-Postası
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ornek@servis.com"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Test Connection Button */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="cursor-pointer gap-2 h-9 text-xs font-bold border-sky-500/30 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10"
            >
              {isTesting ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>Bağlantı Test Ediliyor...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={14} />
                  <span>Bağlantıyı Test Et</span>
                </>
              )}
            </Button>

            {testResult && (
              <span
                className={`text-xs font-semibold flex items-center gap-1.5 ${
                  testResult.success ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                }`}
              >
                {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {testResult.message}
              </span>
            )}
          </div>
        </div>
      )}

      {/* GİB Fatura Serisi ve Vergi Ayarları */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Hash className="text-sky-500" size={18} />
          <span>Fatura Serisi & Vergi Bilgileri</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              GİB Seri Ön Eki (3 Hane)
            </label>
            <input
              type="text"
              maxLength={5}
              value={seriesPrefix}
              onChange={(e) => setSeriesPrefix(e.target.value.toUpperCase())}
              placeholder="ATW"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">Örn: {seriesPrefix}2026000000001</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              İşletme VKN / TCKN
            </label>
            <input
              type="text"
              value={companyTaxId}
              onChange={(e) => setCompanyTaxId(e.target.value)}
              placeholder="1234567890"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Vergi Dairesi
            </label>
            <input
              type="text"
              value={taxOffice}
              onChange={(e) => setTaxOffice(e.target.value)}
              placeholder="Zincirlikuyu V.D."
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Switches */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isTestMode}
              onChange={(e) => setIsTestMode(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
            />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Sandbox / Test Modu</p>
              <p className="text-[11px] text-slate-500">
                Açık olduğunda gerçek GİB mali kaydı yerine test faturası oluşturulur (kontör harcanmaz).
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoSendOnCompletion}
              onChange={(e) => setAutoSendOnCompletion(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
            />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                İş Emri Kapanınca Otomatik Fatura Oluştur
              </p>
              <p className="text-[11px] text-slate-500">
                Usta veya yönetici iş emrini "TAMAMLANDI" yaptığında arka planda faturayı otomatik kuyruğa alır.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={isSaving}
          className="h-10 px-6 font-bold text-xs gap-2 cursor-pointer bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-600/20"
        >
          {isSaving ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              <span>Kaydediliyor...</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={16} />
              <span>Entegrasyon Ayarlarını Kaydet</span>
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
