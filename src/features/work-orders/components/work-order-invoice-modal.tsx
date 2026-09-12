"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  X,
  Receipt,
  CreditCard,
  Banknote,
  Building2,
  FileCheck2,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api-client"
import { toast } from "@/components/ui/sonner"
import { WorkOrder } from "../types"

interface WorkOrderInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  order: WorkOrder
  onSuccess: () => void
}

type PaymentOption = "CASH" | "POS" | "BANK_TRANSFER" | "OPEN_ACCOUNT"

export function WorkOrderInvoiceModal({
  isOpen,
  onClose,
  order,
  onSuccess,
}: WorkOrderInvoiceModalProps) {
  const [mounted, setMounted] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form State
  const defaultDueDate = React.useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().split("T")[0]
  }, [])

  const [dueDate, setDueDate] = React.useState(defaultDueDate)
  const [paymentOption, setPaymentOption] = React.useState<PaymentOption>("POS")
  const [paymentAmount, setPaymentAmount] = React.useState<number>(order.grandTotal || 0)
  const [posSlipNo, setPosSlipNo] = React.useState("")
  const [notes, setNotes] = React.useState("")

  // Advance Offset State (Müşteri Avansı Mahsubu)
  const [availableAdvance, setAvailableAdvance] = React.useState<number>(0)
  const [useAdvanceOffset, setUseAdvanceOffset] = React.useState<boolean>(true)
  const [isLoadingAdvance, setIsLoadingAdvance] = React.useState<boolean>(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const subtotal = order.subtotal || Math.round((order.grandTotal || 0) / 1.2)
  const kdvAmount = order.kdvAmount || Math.round((order.grandTotal || 0) - subtotal)
  const grandTotal = order.grandTotal || 0

  const offsetAdvance = React.useMemo(() => {
    if (!useAdvanceOffset || availableAdvance <= 0) return 0
    return Math.min(grandTotal, availableAdvance)
  }, [useAdvanceOffset, availableAdvance, grandTotal])

  const effectiveRemainingToPay = React.useMemo(() => {
    return Math.max(0, grandTotal - offsetAdvance)
  }, [grandTotal, offsetAdvance])

  React.useEffect(() => {
    if (isOpen) {
      setDueDate(defaultDueDate)
      setPosSlipNo("")
      setNotes("")
      setUseAdvanceOffset(true)
      setIsLoadingAdvance(true)
      apiClient
        .get<{ balance: number }>(`/current-accounts/customer/${order.customerId}`)
        .then((res) => {
          if (res && Number(res.balance) < 0) {
            const adv = Math.abs(Number(res.balance))
            setAvailableAdvance(adv)
            const initialOffset = Math.min(grandTotal, adv)
            setPaymentAmount(Math.max(0, grandTotal - initialOffset))
          } else {
            setAvailableAdvance(0)
            setPaymentAmount(grandTotal)
          }
        })
        .catch(() => {
          setAvailableAdvance(0)
          setPaymentAmount(grandTotal)
        })
        .finally(() => {
          setIsLoadingAdvance(false)
        })
    }
  }, [isOpen, order.customerId, grandTotal, defaultDueDate])

  // Sync paymentAmount when remaining amount changes
  React.useEffect(() => {
    setPaymentAmount(effectiveRemainingToPay)
  }, [effectiveRemainingToPay])

  if (!mounted || !isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      // 1. Create Invoice with optional advance offset
      const invoiceRes = await apiClient.post<{ id: string; invoiceNumber: string }>("/invoices", {
        workOrderId: order.id,
        customerId: order.customerId,
        dueDate,
        subtotal,
        kdvAmount,
        grandTotal,
        offsetAdvanceAmount: offsetAdvance > 0 ? offsetAdvance : undefined,
      })

      // 2. If immediate payment was selected for the remaining balance, record Payment
      if (effectiveRemainingToPay > 0 && paymentOption !== "OPEN_ACCOUNT" && paymentAmount > 0) {
        await apiClient.post("/payments", {
          invoiceId: invoiceRes.id,
          customerId: order.customerId,
          amount: Number(paymentAmount),
          paymentMethod: paymentOption,
          posSlipNo: posSlipNo.trim() || undefined,
          notes: notes.trim() || `İş Emri #${order.workOrderNumber} Kalan Fatura Tahsilatı`,
        })
      }

      const advanceDesc = offsetAdvance > 0
        ? ` (${offsetAdvance.toLocaleString("tr-TR")} ₺ cari avansından mahsup edildi)`
        : ""
      const payDesc =
        effectiveRemainingToPay > 0 && paymentOption !== "OPEN_ACCOUNT" && paymentAmount > 0
          ? ` ve ${paymentAmount.toLocaleString("tr-TR")} ₺ tahsil edildi.`
          : "."

      toast.success("Fatura başarıyla oluşturuldu!", {
        description: `Fatura #${invoiceRes.invoiceNumber} oluşturuldu${advanceDesc}${payDesc}`,
      })

      onSuccess()
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Fatura oluşturulurken bir hata oluştu."
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Receipt size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Fatura Kes & Tahsilat Al</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                  {order.workOrderNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Müşteri: <span className="font-semibold text-slate-700 dark:text-slate-300">{order.customerName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Financial Summary Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span className="font-sans">Ara Toplam (KDV Hariç):</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{subtotal.toLocaleString("tr-TR")} ₺</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span className="font-sans">KDV (%20):</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{kdvAmount.toLocaleString("tr-TR")} ₺</span>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-sm font-black text-emerald-600 dark:text-emerald-400">
              <span className="font-sans text-slate-900 dark:text-slate-100">FATURA GENEL TOPLAMI:</span>
              <span>{grandTotal.toLocaleString("tr-TR")} ₺</span>
            </div>
          </div>

          {/* Müşteri Cari Avansı Bilgilendirme ve Mahsup Kartı */}
          {availableAdvance > 0 && (
            <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-300 dark:border-sky-800 space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Receipt size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                      <span>Müşteri Cari Avansı Tespit Edildi</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-200/70 dark:bg-sky-800 text-sky-900 dark:text-sky-100 font-bold">
                        {availableAdvance.toLocaleString("tr-TR")} ₺
                      </span>
                    </h3>
                    <p className="text-[11px] text-sky-700 dark:text-sky-300 mt-0.5">
                      Bu müşterinin daha önce iptal edilen veya önceden tahsil edilen işlerden kalan avansı bulunmaktadır.
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none shrink-0 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-sky-300 dark:border-sky-700 shadow-xs">
                  <input
                    type="checkbox"
                    checked={useAdvanceOffset}
                    disabled={isLoadingAdvance}
                    onChange={(e) => setUseAdvanceOffset(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer disabled:opacity-50"
                  />
                  <span className="text-xs font-bold text-sky-800 dark:text-sky-200">
                    Avanstan Mahsup Et
                  </span>
                </label>
              </div>

              {useAdvanceOffset && (
                <div className="pt-2 border-t border-sky-200/70 dark:border-sky-800/70 flex justify-between items-center text-xs font-mono">
                  <span className="font-sans text-sky-700 dark:text-sky-300 font-medium">
                    Faturadan Düşülecek Avans Tutarı:
                  </span>
                  <span className="font-bold text-sky-900 dark:text-sky-100">
                    -{offsetAdvance.toLocaleString("tr-TR")} ₺
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Vade Tarihi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar size={14} className="text-slate-400" />
              <span>Son Ödeme Vadesi (Due Date)</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
            />
          </div>

          {/* Avans Tamamen Karşılıyorsa Bilgilendirme */}
          {useAdvanceOffset && offsetAdvance >= grandTotal ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-emerald-900 dark:text-emerald-200">
                  Fatura Tutarı Tamamen Avans ile Karşılanıyor
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Faturanın tamamı ({grandTotal.toLocaleString("tr-TR")} ₺) müşterinizin cari hesabındaki avanstan mahsup edilecektir. Kasadan veya POS cihazından ilave tahsilat alınmasına gerek yoktur.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Ödeme / Tahsilat Yöntemi Seçimi */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Kalan Tutar İçin Tahsilat Yöntemi
                  </label>
                  {useAdvanceOffset && offsetAdvance > 0 && (
                    <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                      Kalan: {effectiveRemainingToPay.toLocaleString("tr-TR")} ₺
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentOption("POS")}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      paymentOption === "POS"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <CreditCard size={18} />
                    <span className="text-[11px]">Kredi Kartı</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentOption("CASH")}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      paymentOption === "CASH"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <Banknote size={18} />
                    <span className="text-[11px]">Nakit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentOption("BANK_TRANSFER")}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      paymentOption === "BANK_TRANSFER"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <Building2 size={18} />
                    <span className="text-[11px]">Havale / EFT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentOption("OPEN_ACCOUNT")}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      paymentOption === "OPEN_ACCOUNT"
                        ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold shadow-xs"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <FileCheck2 size={18} />
                    <span className="text-[11px]">Cari Hesap</span>
                  </button>
                </div>
              </div>

              {/* If immediate payment selected, show amount & slip fields */}
              {paymentOption !== "OPEN_ACCOUNT" ? (
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Tahsil Edilen Kalan Tutar
                    </label>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      Anında Kasa Kaydı Alınacak
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0.01"
                      max={effectiveRemainingToPay}
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                      className="w-full h-10 px-3 pr-10 rounded-xl border border-emerald-500/30 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">₺</span>
                  </div>

                  {paymentOption === "POS" && (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        POS Slip / Onay No (Opsiyonel)
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: 984512"
                        value={posSlipNo}
                        onChange={(e) => setPosSlipNo(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                  <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="font-bold">Açık Hesap (Kalan Borç)</p>
                    <p className="text-[11px] text-amber-700/90 dark:text-amber-300/80">
                      Kalan tutar ({effectiveRemainingToPay.toLocaleString("tr-TR")} ₺) müşterinin cari hesabına borç kaydedilecek. Kasa tahsilatı daha sonra yapılabilecektir.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Workflow Notice */}
          <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center gap-2.5 text-[11px] text-sky-800 dark:text-sky-300">
            <CheckCircle2 size={15} className="text-sky-600 dark:text-sky-400 shrink-0" />
            <span>
              Fatura onaylandığında bu iş emri otomatik olarak <strong>"Tamamlandı"</strong> durumuna alınır.
            </span>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onClose}
              className="h-10 px-4 rounded-xl text-xs font-semibold"
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || grandTotal <= 0}
              className="h-10 px-5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Fatura Kesiliyor...</span>
                </>
              ) : (
                <>
                  <Receipt size={15} />
                  <span>Faturayı Kes ve Kaydet</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
