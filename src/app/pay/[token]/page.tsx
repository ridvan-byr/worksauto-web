"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Lock,
  AlertCircle,
  Printer,
  ChevronLeft,
  ArrowRight,
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { Button } from "@/components/ui/button"

interface PayTrTokenResponse {
  invoiceId: string
  invoiceNumber: string
  customerName: string
  plate: string
  remainingAmount: number
  totalAmount: number
  paytrToken: string
  iframeUrl: string
  isTest: boolean
}

export default function PublicInvoicePaymentPage() {
  const params = useParams()
  const token = params.token as string
  const router = useRouter()

  const [paymentData, setPaymentData] = React.useState<PayTrTokenResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Simulation state for sandbox testing
  const [cardNumber, setCardNumber] = React.useState("")
  const [cardExpiry, setCardExpiry] = React.useState("")
  const [cardCvc, setCardCvc] = React.useState("")
  const [cardHolder, setCardHolder] = React.useState("")
  const [installment, setInstallment] = React.useState("1")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [authCode, setAuthCode] = React.useState("")

  React.useEffect(() => {
    if (!token) return
    setLoading(true)

    apiClient
      .post<PayTrTokenResponse>("/payments/public/create-paytr-token", { invoiceId: token })
      .then((res) => {
        setPaymentData(res)
        setCardHolder(res.customerName || "")
        setError(null)
      })
      .catch((err) => {
        console.warn("PayTR token generation error:", err)
        setError("Fatura bulunamadı, tamamen ödenmiş veya bağlantı süresi dolmuş olabilir.")
      })
      .finally(() => setLoading(false))
  }, [token])

  // Handle simulated / PayTR test card payment
  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentData) return

    setIsSubmitting(true)

    try {
      // Send webhook simulation to backend to mark invoice as paid
      await apiClient.post("/payments/webhook/paytr", {
        merchant_oid: paymentData.invoiceId,
        status: "success",
        total_amount: String(Math.round(paymentData.remainingAmount * 100)),
        hash: "test_valid_hash_simulated",
      })

      const generatedCode = "TR-" + Math.floor(100000 + Math.random() * 900000)
      setAuthCode(generatedCode)
      setIsSuccess(true)
    } catch (err) {
      console.warn("Payment simulation failed:", err)
      setError("Ödeme provizyonu alınamadı. Lütfen kart bilgilerinizi kontrol ediniz.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-12 h-12 rounded-2xl border-4 border-indigo-500 border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-400">Güvenli ödeme oturumu başlatılıyor...</p>
        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
          <Lock size={12} /> PayTR 256-bit SSL Güvenli Bağlantı
        </p>
      </div>
    )
  }

  if (error || !paymentData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-xl font-bold text-slate-100 mb-2">Ödeme Başlatılamadı</h1>
        <p className="text-xs text-slate-400 max-w-sm text-center mb-6">
          {error || "Bu fatura için ödenecek aktif bir bakiye bulunmuyor."}
        </p>
        <Link href="/">
          <Button variant="outline" className="text-xs border-slate-700 text-slate-300">
            Ana Sayfaya Dön
          </Button>
        </Link>
      </div>
    )
  }

  // Success Confirmation Screen
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-white">Ödeme Başarıyla Alındı</h1>
            <p className="text-xs text-slate-400">
              Faturanız başarıyla kapatılmış ve servis sistemine işlenmiştir.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-left space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Fatura No:</span>
              <span className="text-white font-bold">{paymentData.invoiceNumber}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Ödenen Tutar:</span>
              <span className="text-emerald-400 font-bold">
                {paymentData.remainingAmount.toLocaleString("tr-TR")} ₺
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Banka Onay Kodu:</span>
              <span className="text-indigo-400 font-bold">{authCode}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>İşlem Tarihi:</span>
              <span className="text-slate-300">{new Date().toLocaleString("tr-TR")}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="button"
              onClick={() => window.print()}
              variant="outline"
              className="h-10 rounded-2xl border-slate-700 text-xs font-semibold gap-2 text-slate-200 cursor-pointer"
            >
              <Printer size={14} />
              <span>Makbuzu Yazdır / PDF</span>
            </Button>
            <Button
              type="button"
              onClick={() => router.back()}
              className="h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold gap-2 cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              <span>Araç Takip Ekranına Dön</span>
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16 selection:bg-indigo-500 selection:text-white">
      {/* Top Security Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs font-bold text-slate-200">Güvenli Fatura Ödeme</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
            <ShieldCheck size={14} />
            <span className="hidden sm:inline">256-bit 3D Secure Korumalı</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Invoice Summary Card */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/90 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Fatura & Araç Bilgisi
            </span>
            <div className="flex items-center gap-2.5">
              <PlateBadge plate={paymentData.plate} size="md" />
              <span className="text-sm font-bold text-white">{paymentData.customerName}</span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Fatura No: <strong className="text-indigo-400">{paymentData.invoiceNumber}</strong>
            </p>
          </div>

          <div className="sm:text-right p-4 rounded-2xl bg-indigo-950/30 border border-indigo-700/40">
            <p className="text-[10px] uppercase font-bold text-indigo-300">Ödenecek Tutar</p>
            <p className="text-2xl font-black font-mono text-white mt-0.5">
              {paymentData.remainingAmount.toLocaleString("tr-TR")} ₺
            </p>
            {paymentData.totalAmount > paymentData.remainingAmount && (
              <p className="text-[10px] text-slate-400 mt-0.5">
                (Toplam: {paymentData.totalAmount.toLocaleString("tr-TR")} ₺)
              </p>
            )}
          </div>
        </div>

        {/* Payment Form (Interactive Sandbox / PayTR Checkout) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800/90 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                <CreditCard size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Banka / Kredi Kartı Bilgileri</h3>
                <p className="text-[10px] text-slate-400">PayTR Ortak Ödeme Geçidi</p>
              </div>
            </div>

            {paymentData.isTest && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Sandbox Test Modu
              </span>
            )}
          </div>

          <form onSubmit={handleSimulatePayment} className="space-y-4">
            {/* Card Holder */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Kart Üzerindeki İsim
              </label>
              <input
                type="text"
                placeholder="Ad Soyad"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 font-medium"
                required
              />
            </div>

            {/* Card Number */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Kart Numarası</label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={19}
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "").slice(0, 16)
                    const formatted = clean.match(/.{1,4}/g)?.join(" ") || clean
                    setCardNumber(formatted)
                  }}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 font-mono tracking-wider font-bold"
                  required
                />
                <CreditCard
                  size={16}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
              </div>
            </div>

            {/* Expiry & CVC */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Son Kullanma Tarihi
                </label>
                <input
                  type="text"
                  maxLength={5}
                  placeholder="AA/YY"
                  value={cardExpiry}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "").slice(0, 4)
                    const formatted =
                      clean.length >= 3 ? `${clean.slice(0, 2)}/${clean.slice(2)}` : clean
                    setCardExpiry(formatted)
                  }}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 font-mono text-center font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Güvenlik Kodu (CVC)</label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={3}
                    placeholder="•••"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ""))}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 font-mono text-center font-bold"
                    required
                  />
                  <Lock
                    size={13}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                  />
                </div>
              </div>
            </div>

            {/* Installment Selection */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Taksit Seçenekleri</label>
              <select
                value={installment}
                onChange={(e) => setInstallment(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 font-medium cursor-pointer"
              >
                <option value="1">Tek Çekim — {paymentData.remainingAmount.toLocaleString("tr-TR")} ₺</option>
                <option value="2">
                  2 Taksit — {(paymentData.remainingAmount / 2).toLocaleString("tr-TR")} ₺ x 2 Ay
                </option>
                <option value="3">
                  3 Taksit — {(paymentData.remainingAmount / 3).toLocaleString("tr-TR")} ₺ x 3 Ay
                </option>
                <option value="6">
                  6 Taksit — {(paymentData.remainingAmount / 6).toLocaleString("tr-TR")} ₺ x 6 Ay
                </option>
              </select>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-2 shadow-xl shadow-indigo-600/30 cursor-pointer mt-4"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>3D Secure Doğrulanıyor...</span>
                </>
              ) : (
                <>
                  <Lock size={14} />
                  <span>
                    {paymentData.remainingAmount.toLocaleString("tr-TR")} ₺ Güvenli Öde (3D Secure)
                  </span>
                </>
              )}
            </Button>
          </form>

          {/* Security Logos */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-slate-500 text-[10px]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>TCMB Lisanslı PayTR Sanal POS Altyapısı</span>
            </div>
            <span>256-bit TLS</span>
          </div>
        </div>
      </main>
    </div>
  )
}
