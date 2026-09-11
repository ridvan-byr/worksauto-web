"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

function OptOutContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get("id") || searchParams.get("tenantId") || searchParams.get("phone") || searchParams.get("email") || ""

  const [inputVal, setInputVal] = React.useState(id)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [resultMessage, setResultMessage] = React.useState<string | null>(null)
  const [isSuccess, setIsSuccess] = React.useState(false)

  const handleOptOut = async (targetId: string) => {
    if (!targetId || !targetId.trim()) return
    setIsProcessing(true)
    try {
      const res = await apiClient.post<{ success: boolean; message: string; tenantTitle?: string }>(
        "/legal/opt-out",
        { identifier: targetId.trim() }
      )
      setIsSuccess(true)
      setResultMessage(
        res.message || "Ticari elektronik ileti izniniz 6563 sayılı Kanun kapsamında başarıyla iptal edilmiştir."
      )
    } catch {
      setIsSuccess(false)
      setResultMessage("Ret talebiniz işlenirken bir hata oluştu. Lütfen geçerli bir telefon veya e-posta giriniz.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Auto-trigger if identifier is present in query parameters
  React.useEffect(() => {
    if (id) {
      handleOptOut(id)
    }
  }, [id])

  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-sans">
      {/* Top Header */}
      <header className="max-w-md mx-auto w-full flex items-center justify-between pb-6">
        <div className="relative h-8 w-[140px] flex items-center">
          <Image
            src="/brand/worksauto-logo-white.png"
            alt="WorksAuto"
            width={140}
            height={30}
            priority
            className="h-7 w-auto object-contain"
          />
        </div>
        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
          6563 s. ETK Ret Portalı
        </span>
      </header>

      {/* Main Card */}
      <main className="max-w-md mx-auto w-full my-auto">
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xs space-y-5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-200">
            {isSuccess ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            ) : (
              <ShieldCheck className="h-6 w-6 text-slate-300" />
            )}
          </div>

          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              Ticari Elektronik İleti Ret Bildirimi
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun uyarınca WorksAuto kampanya ve ticari bildirim listesinden ücretsiz ayrılabilirsiniz.
            </p>
          </div>

          {resultMessage ? (
            <div
              className={`p-4 rounded-xl border text-xs leading-relaxed text-left ${
                isSuccess
                  ? "bg-emerald-950/30 border-emerald-800/60 text-emerald-300"
                  : "bg-rose-950/30 border-rose-800/60 text-rose-300"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {isSuccess ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>{resultMessage}</div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleOptOut(inputVal)
              }}
              className="space-y-3 pt-2 text-left"
            >
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Kayıtlı Telefon veya E-Posta Adresiniz:
                </label>
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="05xx xxx xx xx veya firma@eposta.com"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-colors"
                />
              </div>

              <Button
                type="submit"
                disabled={isProcessing || !inputVal.trim()}
                className="w-full bg-white hover:bg-slate-200 text-slate-950 font-semibold py-2.5 text-xs rounded-xl transition-all disabled:opacity-40"
              >
                {isProcessing ? "Ret Talebi İşleniyor..." : "Ticari İleti İznimi İptal Et"}
              </Button>
            </form>
          )}

          <div className="pt-3 border-t border-slate-800/60 text-[11px] text-slate-500">
            Tercihlerinizi dilediğiniz an WorksAuto yönetim panelinizdeki <strong>Ayarlar &gt; Bildirim</strong> sekmesinden yeniden güncelleyebilirsiniz.
          </div>

          <div className="pt-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Giriş Paneline Dön</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-md mx-auto w-full text-center text-[11px] text-slate-600 pt-6">
        WorksAuto &bull; 6563 Sayılı ETK ve İYS Uyumlu Ret Altyapısı
      </footer>
    </div>
  )
}

export default function OptOutPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#070a11]" />}>
      <OptOutContent />
    </React.Suspense>
  )
}
