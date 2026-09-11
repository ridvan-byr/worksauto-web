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

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (isOpen) {
      setPaymentAmount(order.grandTotal || 0)
      setDueDate(defaultDueDate)
      setPosSlipNo("")
      setNotes("")
    }
  }, [isOpen, order.grandTotal, defaultDueDate])

  if (!mounted || !isOpen) return null

  const subtotal = order.subtotal || Math.round((order.grandTotal || 0) / 1.2)
  const kdvAmount = order.kdvAmount || Math.round((order.grandTotal || 0) - subtotal)
  const grandTotal = order.grandTotal || 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      // 1. Create Invoice
      const invoiceRes = await apiClient.post<{ id: string; invoiceNumber: string }>("/invoices", {
        workOrderId: order.id,
        customerId: order.customerId,
        dueDate,
        subtotal,
        kdvAmount,
        grandTotal,
      })

      // 2. If immediate payment was selected, record Payment
      if (paymentOption !== "OPEN_ACCOUNT" && paymentAmount > 0) {
        await apiClient.post("/payments", {
          invoiceId: invoiceRes.id,
          customerId: order.customerId,
          amount: Number(paymentAmount),
          paymentMethod: paymentOption,
          posSlipNo: posSlipNo.trim() || undefined,
          notes: notes.trim() || `İş Emri #${order.workOrderNumber} Fatura Tahsilatı`,
        })
      }

      toast.success("Fatura başarıyla oluşturuldu!", {
        description:
          paymentOption === "OPEN_ACCOUNT"
            ? `Fatura #${invoiceRes.invoiceNumber} cari hesaba borç kaydedildi.`
            : `Fatura #${invoiceRes.invoiceNumber} oluşturuldu ve ${paymentAmount.toLocaleString("tr-TR")} ₺ tahsilat kaydedildi.`,
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
              <span className="font-sans text-slate-900 dark:text-slate-100">ÖDENECEK TUTAR:</span>
              <span>{grandTotal.toLocaleString("tr-TR")} ₺</span>
            </div>
          </div>

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

          {/* Ödeme / Tahsilat Yöntemi Seçimi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Ödeme / Tahsilat Yöntemi
            </label>
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
                  Tahsil Edilen Tutar
                </label>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Anında Kasa Kaydı Alınacak
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0.01"
                  max={grandTotal}
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
                <p className="font-bold">Açık Hesap (Veresiye)</p>
                <p className="text-[11px] text-amber-700/90 dark:text-amber-300/80">
                  Bu fatura tutarı ({grandTotal.toLocaleString("tr-TR")} ₺) anında müşterinin cari hesabına borç kaydedilecek. Kasa tahsilatı daha sonra "Kasa & Tahsilat" veya "Cari Hesap" ekranından yapılabilecektir.
                </p>
              </div>
            </div>
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
