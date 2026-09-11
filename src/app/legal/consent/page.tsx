"use client"

import * as React from "react"
import { useAuth } from "@/features/auth/auth-context"
import { apiClient } from "@/lib/api-client"
import { ShieldAlert, FileText, CheckCircle2, Lock, ArrowRight } from "lucide-react"
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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Brand Header */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between pb-6 border-b border-neutral-800/80">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-neutral-950 font-black shadow-lg shadow-amber-500/20">
            W
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              WorksAuto <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Yasal Onay Kapısı</span>
            </h1>
            <p className="text-xs text-neutral-400">Bulut Servis Yönetim Platformu &bull; B2B Lisans Sözleşmesi</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-medium text-neutral-300">{tenant?.title || "İşletme"}</span>
            <span className="text-[11px] text-neutral-500">{user?.name} {user?.surname} ({user?.role})</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-neutral-800"
          >
            Çıkış Yap
          </Button>
        </div>
      </header>

      {/* Main Container: Split Layout (Document on Left, Legal Form on Right) */}
      <main className="max-w-6xl mx-auto w-full my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Contract Document Viewer */}
        <section className="lg:col-span-7 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 flex flex-col h-[560px] shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
              <FileText className="h-4 w-4" />
              <span>B2B Hizmet Şartları & KVKK Veri İşleyen Protokolü</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
              v{contractVersion}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs leading-relaxed text-neutral-300 font-sans whitespace-pre-line border border-neutral-800/60 rounded-xl p-4 bg-neutral-950/60 selection:bg-amber-500/30">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-neutral-500">
                Sözleşme metni hazırlanıyor...
              </div>
            ) : (
              contractText
            )}
          </div>

          <div className="pt-4 mt-2 flex items-center justify-between text-[11px] text-neutral-500">
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-emerald-400" />
              6100 sayılı HMK uyarınca elektronik delil niteliğindedir.
            </span>
            <span>SHA-256 Kriptografik İmza Mührü</span>
          </div>
        </section>

        {/* Right Column: Gatekeeper Action Card */}
        <section className="lg:col-span-5 bg-neutral-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl shadow-amber-500/5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-2.5 text-amber-400 mb-3">
              <ShieldAlert className="h-5 w-5" />
              <h2 className="text-base font-bold text-white tracking-tight">Sisteme Giriş Öncesi Zorunlu Onay</h2>
            </div>
            
            <p className="text-xs text-neutral-400 leading-relaxed mb-6">
              WorksAuto platformunu ve oto servis modüllerini kullanabilmeniz için işletmeniz adına yasal B2B hizmet sözleşmesi ve KVKK veri işleme taahhüdünü onaylamanız zorunludur.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Checkbox 1: SaaS Terms */}
              <div className="flex items-start gap-3 p-3 rounded-xl border border-neutral-800 bg-neutral-950/50 hover:border-neutral-700 transition-colors">
                <Checkbox
                  id="saas"
                  checked={saasAccepted}
                  onCheckedChange={(checked) => setSaasAccepted(!!checked)}
                  className="mt-0.5 border-neutral-600 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 data-[state=checked]:text-black"
                />
                <label htmlFor="saas" className="text-xs text-neutral-300 leading-snug cursor-pointer select-none">
                  <strong className="text-white">WorksAuto B2B SaaS Lisans Sözleşmesi</strong>&apos;ni okudum, hizmet ve lisans şartlarını gayrikabili rücu kabul ediyorum. <span className="text-amber-400">*</span>
                </label>
              </div>

              {/* Checkbox 2: KVKK Data Processing */}
              <div className="flex items-start gap-3 p-3 rounded-xl border border-neutral-800 bg-neutral-950/50 hover:border-neutral-700 transition-colors">
                <Checkbox
                  id="kvkk"
                  checked={dataProcessingAccepted}
                  onCheckedChange={(checked) => setDataProcessingAccepted(!!checked)}
                  className="mt-0.5 border-neutral-600 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 data-[state=checked]:text-black"
                />
                <label htmlFor="kvkk" className="text-xs text-neutral-300 leading-snug cursor-pointer select-none">
                  6698 sayılı KVKK kapsamında platforma kaydedilecek araç sahiplerine ait kişisel verilerde <strong className="text-white">Veri Sorumlusu</strong> sıfatıyla hareket edeceğimi taahhüt ederim. <span className="text-amber-400">*</span>
                </label>
              </div>

              {/* Checkbox 3: Operational Notifications */}
              <div className="flex items-start gap-3 p-3 rounded-xl border border-neutral-800 bg-neutral-950/50 hover:border-neutral-700 transition-colors">
                <Checkbox
                  id="marketing"
                  checked={marketingAccepted}
                  onCheckedChange={(checked) => setMarketingAccepted(!!checked)}
                  className="mt-0.5 border-neutral-600 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 data-[state=checked]:text-black"
                />
                <label htmlFor="marketing" className="text-xs text-neutral-300 leading-snug cursor-pointer select-none">
                  Fatura, kritik stok, platform güncellemeleri ve teknik bakım bildirimlerinin <strong className="text-neutral-200">WhatsApp ve E-Posta</strong> ile tarafıma iletilmesini onaylıyorum.
                </label>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold py-3 text-xs rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

          <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center gap-2 text-[11px] text-neutral-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Onay sonrasında atölye yönetim panelinize doğrudan erişebilirsiniz.</span>
          </div>
        </section>
      </main>

      {/* Footer Notice */}
      <footer className="max-w-6xl mx-auto w-full text-center text-[11px] text-neutral-400 border-t border-neutral-800/80 pt-4">
        WorksAuto Enterprise Systems &bull; 6698 Sayılı KVKK ve HMK Elektronik İmza Güvencesi Altındadır.
      </footer>
    </div>
  )
}
