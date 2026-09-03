"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X, CreditCard, Banknote, Building2, CheckCircle2, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Invoice, PaymentMethod } from "../types"

interface RecordPaymentModalProps {
  isOpen: boolean
  invoice: Invoice | null
  onClose: () => void
  onSuccess: (invoiceId: string, amount: number, method: PaymentMethod, ref?: string, note?: string) => void
}

export function RecordPaymentModal({ isOpen, invoice, onClose, onSuccess }: RecordPaymentModalProps) {
  const [mounted, setMounted] = React.useState(false)
  const [amount, setAmount] = React.useState<number | "">("")
  const [method, setMethod] = React.useState<PaymentMethod>("POS")
  const [referenceNo, setReferenceNo] = React.useState("")
  const [note, setNote] = React.useState("")

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (invoice) {
      setAmount(invoice.remainingAmount)
    }
  }, [invoice, isOpen])

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = "auto"
      }
    }
  }, [isOpen])

  if (!isOpen || !mounted || !invoice) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return
    onSuccess(invoice.id, Number(amount), method, referenceNo.trim() || undefined, note.trim() || undefined)
    onClose()
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Receipt size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Tahsilat / Ödeme Girişi
              </h2>
              <p className="text-[11px] text-slate-500">
                {invoice.invoiceNumber} • {invoice.customerName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Invoice Summary Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">Fatura Toplamı</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {invoice.grandTotal.toLocaleString("tr-TR")} ₺
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Ödenen</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {invoice.paidAmount.toLocaleString("tr-TR")} ₺
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Kalan Borç</span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                {invoice.remainingAmount.toLocaleString("tr-TR")} ₺
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {/* Amount */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Tahsil Edilen Tutar (TL) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAmount(invoice.remainingAmount)}
                  className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Kalanın Tamamı ({invoice.remainingAmount.toLocaleString("tr-TR")} ₺)
                </button>
              </div>
              <input
                type="number"
                min={1}
                max={invoice.remainingAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
                autoFocus
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Ödeme Yöntemi</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod("POS")}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    method === "POS"
                      ? "border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                  }`}
                >
                  <CreditCard size={15} />
                  <span>POS / Kart</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("CASH")}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    method === "CASH"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                  }`}
                >
                  <Banknote size={15} />
                  <span>Nakit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("BANK_TRANSFER")}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    method === "BANK_TRANSFER"
                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                  }`}
                >
                  <Building2 size={15} />
                  <span>Havale / EFT</span>
                </button>
              </div>
            </div>

            {/* Reference */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Slip No / Dekont No</label>
              <input
                type="text"
                placeholder="Örn: SLIP-98412 veya Dekont No"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Note */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Tahsilat Notu</label>
              <input
                type="text"
                placeholder="İsteğe bağlı not..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="h-10 px-4 text-xs font-semibold cursor-pointer">
              Vazgeç
            </Button>
            <Button type="submit" className="h-10 px-5 text-xs font-bold gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20">
              <CheckCircle2 size={15} />
              <span>Tahsilatı Onayla</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
