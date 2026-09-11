"use client"

import * as React from "react"
import { useAuth } from "@/features/auth/auth-context"
import { apiClient } from "@/lib/api-client"
import { FileText, CheckCircle2, Lock, ArrowRight, LogOut, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/sonner"

export default function LegalConsentPage() {
  const { user, tenant, completeB2bConsent, logout } = useAuth()

  const [contractText, setContractText] = React.useState<string>("")
  const [contractVersion, setContractVersion] = React.useState<string>("1.0")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form checkbox states
  const [saasAccepted, setSaasAccepted] = React.useState(false)
  const [dataProcessingAccepted, setDataProcessingAccepted] = React.useState(false)
  const [marketingAccepted, setMarketingAccepted] = React.useState(true)

  React.useEffect(() => {
    async function fetchContract() {
      try {
        const res = await apiClient.get<{
          version: string
          contractText: string
          payloadHash: string
        }>("/legal/contract-details")
        setContractText(res.contractText)
        setContractVersion(res.version)
      } catch {
        toast.error("Sözleşme metni sunucudan yüklenemedi.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchContract()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!saasAccepted || !dataProcessingAccepted) {
      toast.warning("Lütfen zorunlu yasal sözleşme şartlarını onaylayınız.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await apiClient.post<{
        success: boolean
        message: string
        tenant: {
          id: string
          title: string
          b2bConsentAccepted: boolean
          b2bConsentAcceptedAt: string
        }
      }>("/legal/sign", {
        saasTermsAccepted: saasAccepted,
        dataProcessingAccepted: dataProcessingAccepted,
        marketingAccepted: marketingAccepted,
      })

      if (res.success && res.tenant) {
        completeB2bConsent(res.tenant)
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string }
      const msg = errorObj.response?.data?.message || errorObj.message || "Sözleşme onaylanırken bir hata oluştu."
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = saasAccepted && dataProcessingAccepted

  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-slate-700 selection:text-white">
      {/* Top Brand Header */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            W
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              WorksAuto <span className="text-[11px] font-normal px-2.5 py-0.5 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700/60">Sözleşme Onayı</span>
            </h1>
            <p className="text-xs text-slate-400">Bulut Servis Yönetim Platformu &bull; B2B Lisans ve KVKK Protokolü</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-medium text-slate-200">{tenant?.title || "İşletme"}</span>
            <span className="text-[11px] text-slate-500">{user?.name} {user?.surname} ({user?.role})</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Çıkış Yap</span>
          </Button>
        </div>
      </header>

      {/* Main Container: Split Layout (Document on Left, Legal Form on Right) */}
      <main className="max-w-6xl mx-auto w-full my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Contract Document Viewer */}
        <section className="lg:col-span-7 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col h-[560px] shadow-xl backdrop-blur-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/60">
            <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs sm:text-sm">
              <FileText className="h-4 w-4 text-slate-400" />
              <span>B2B Hizmet Şartları & KVKK Veri İşleyen Protokolü</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 font-mono border border-slate-700/50">
              v{contractVersion}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs leading-relaxed text-slate-300 font-sans whitespace-pre-line border border-slate-800/60 rounded-xl p-4 bg-slate-950/70">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Sözleşme metni hazırlanıyor...
              </div>
            ) : (
              contractText
            )}
          </div>

          <div className="pt-4 mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              6100 sayılı HMK uyarınca elektronik delil niteliğindedir.
            </span>
            <span className="font-mono text-[10px] text-slate-500">SHA-256 Kriptografik İmza Mührü</span>
          </div>
        </section>

        {/* Right Column: Gatekeeper Action Card */}
        <section className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl relative flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-200 mb-3">
              <ShieldAlert className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">Sisteme Giriş Öncesi Zorunlu Onay</h2>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              WorksAuto platformunu ve oto servis yönetim modüllerini kullanabilmeniz için işletmeniz adına yasal B2B hizmet sözleşmesi ve KVKK veri işleme taahhüdünü onaylamanız zorunludur.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Checkbox 1: SaaS Terms */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/50 hover:border-slate-700/80 transition-colors">
                <Checkbox
                  id="saas"
                  checked={saasAccepted}
                  onCheckedChange={(checked) => setSaasAccepted(!!checked)}
                  className="mt-0.5"
                />
                <label htmlFor="saas" className="text-xs text-slate-300 leading-snug cursor-pointer select-none">
                  <strong className="text-slate-100 font-medium">WorksAuto B2B SaaS Lisans Sözleşmesi</strong>&apos;ni okudum, hizmet ve lisans şartlarını gayrikabili rücu kabul ediyorum. <span className="text-slate-400">*</span>
                </label>
              </div>

              {/* Checkbox 2: KVKK Data Processing */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/50 hover:border-slate-700/80 transition-colors">
                <Checkbox
                  id="dataProcessing"
                  checked={dataProcessingAccepted}
                  onCheckedChange={(checked) => setDataProcessingAccepted(!!checked)}
                  className="mt-0.5"
                />
                <label htmlFor="dataProcessing" className="text-xs text-slate-300 leading-snug cursor-pointer select-none">
                  6698 sayılı KVKK kapsamında platforma kaydedilecek araç sahiplerine ait kişisel verilerde <strong className="text-slate-100 font-medium">Veri Sorumlusu</strong> sıfatıyla hareket edeceğimi taahhüt ederim. <span className="text-slate-400">*</span>
                </label>
              </div>

              {/* Checkbox 3: Marketing & Notifications (Optional) */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/50 hover:border-slate-700/80 transition-colors">
                <Checkbox
                  id="marketing"
                  checked={marketingAccepted}
                  onCheckedChange={(checked) => setMarketingAccepted(!!checked)}
                  className="mt-0.5"
                />
                <label htmlFor="marketing" className="text-xs text-slate-300 leading-snug cursor-pointer select-none">
                  Fatura, kritik stok, platform güncellemeleri ve teknik bildirimlerin <strong className="text-slate-100 font-medium">WhatsApp ve E-Posta</strong> ile tarafıma iletilmesini onaylıyorum.
                </label>
              </div>

              <div className="pt-3">
                <Button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className="w-full bg-white hover:bg-slate-200 text-slate-950 font-semibold py-2.5 text-xs rounded-xl transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    "Yasal İmza Mühürleniyor..."
                  ) : (
                    <>
                      <span>Sözleşmeyi Onayla ve Sistemi Aktif Et</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center gap-2 text-[11px] text-slate-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Onay sonrasında atölye yönetim panelinize doğrudan erişebilirsiniz.</span>
          </div>
        </section>
      </main>

      {/* Footer Notice */}
      <footer className="max-w-6xl mx-auto w-full text-center text-[11px] text-slate-500 border-t border-slate-800/60 pt-4">
        WorksAuto Enterprise Systems &bull; 6698 Sayılı KVKK ve HMK Elektronik İmza Güvencesi Altındadır.
      </footer>
    </div>
  )
}
