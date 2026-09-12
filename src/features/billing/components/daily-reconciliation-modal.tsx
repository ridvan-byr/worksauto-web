"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  X,
  Printer,
  Banknote,
  CreditCard,
  Building2,
  Calendar,
  FileSpreadsheet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CurrentAccount } from "../types"

interface DailyReconciliationModalProps {
  isOpen: boolean
  accounts: CurrentAccount[]
  onClose: () => void
}

export function DailyReconciliationModal({
  isOpen,
  accounts,
  onClose,
}: DailyReconciliationModalProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = "auto"
      }
    }
  }, [isOpen])

  if (!isOpen || !mounted) return null

  const todayStr = new Date().toISOString().split("T")[0]
  const todayFormatted = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  // Extract all movements for today
  const todayPayments: Array<{
    customerName: string
    method: "CASH" | "POS" | "BANK_TRANSFER"
    amount: number
    description: string
  }> = []

  let totalCash = 0
  let totalPos = 0
  let totalTransfer = 0

  accounts.forEach((acc) => {
    (acc.movements || []).forEach((m) => {
      const isToday =
        m.date &&
        (m.date.startsWith(todayStr) ||
          m.date === todayFormatted ||
          m.date === todayStr)

      if (isToday && m.type === "PAYMENT" && m.credit > 0) {
        const desc = m.description || ""
        let method: "CASH" | "POS" | "BANK_TRANSFER" = "BANK_TRANSFER"
        if (desc.includes("CASH") || desc.toLowerCase().includes("nakit")) {
          method = "CASH"
          totalCash += m.credit
        } else if (
          desc.includes("CREDIT_CARD") ||
          desc.toLowerCase().includes("pos") ||
          desc.toLowerCase().includes("kredi kart")
        ) {
          method = "POS"
          totalPos += m.credit
        } else {
          method = "BANK_TRANSFER"
          totalTransfer += m.credit
        }

        todayPayments.push({
          customerName: acc.customerName,
          method,
          amount: m.credit,
          description: m.description,
        })
      }
    })
  })

  const totalCollected = totalCash + totalPos + totalTransfer
  const totalOutstanding = accounts.reduce((sum, a) => sum + Math.max(0, a.balance), 0)

  const handlePrint = () => {
    window.print()
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200 print:fixed print:inset-0 print:p-0 print:bg-white">
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh] print:max-h-none print:border-none print:shadow-none print:rounded-none">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30 print:border-b-2 print:border-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Gün Sonu Kasa Özeti (Z-Raporu)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Calendar size={12} />
                <span>{todayFormatted}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-8 px-3 text-xs gap-1.5 cursor-pointer"
            >
              <Printer size={13} />
              <span>Yazdır</span>
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 print:p-4">
          {/* Summary Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Nakit Kasa */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-2">
                <span className="text-xs font-semibold">Nakit Kasa</span>
                <Banknote size={16} />
              </div>
              <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 font-mono">
                {totalCash.toLocaleString("tr-TR")} ₺
              </p>
            </div>

            {/* POS Slipleri */}
            <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between text-sky-700 dark:text-sky-400 mb-2">
                <span className="text-xs font-semibold">Kredi Kartı / POS</span>
                <CreditCard size={16} />
              </div>
              <p className="text-xl font-extrabold text-sky-700 dark:text-sky-300 font-mono">
                {totalPos.toLocaleString("tr-TR")} ₺
              </p>
            </div>

            {/* Banka Havale/EFT */}
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-400 mb-2">
                <span className="text-xs font-semibold">Banka Havalesi</span>
                <Building2 size={16} />
              </div>
              <p className="text-xl font-extrabold text-indigo-700 dark:text-indigo-300 font-mono">
                {totalTransfer.toLocaleString("tr-TR")} ₺
              </p>
            </div>
          </div>

          {/* Macro Totals */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Günün Toplam Tahsilatı
              </span>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                {totalCollected.toLocaleString("tr-TR")} ₺
              </p>
            </div>
            <div className="sm:text-right">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Açık Kalan Toplam Borç
              </span>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400 font-mono mt-0.5">
                {totalOutstanding.toLocaleString("tr-TR")} ₺
              </p>
            </div>
          </div>

          {/* Today Transactions Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Bugün Gerçekleşen Tahsilatlar ({todayPayments.length})
            </h3>
            {todayPayments.length === 0 ? (
              <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                Bugün için henüz kaydedilmiş bir tahsilat hareketi bulunmuyor.
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Müşteri</th>
                      <th className="py-2.5 px-3">Ödeme Türü</th>
                      <th className="py-2.5 px-3">Açıklama</th>
                      <th className="py-2.5 px-3 text-right">Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {todayPayments.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                          {p.customerName}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              p.method === "CASH"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : p.method === "POS"
                                ? "bg-sky-500/10 text-sky-600"
                                : "bg-indigo-500/10 text-indigo-600"
                            }`}
                          >
                            {p.method === "CASH"
                              ? "Nakit"
                              : p.method === "POS"
                              ? "Kredi Kartı / POS"
                              : "Banka Havalesi"}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                          {p.description}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          +{p.amount.toLocaleString("tr-TR")} ₺
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-800/30 print:hidden">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-9 px-4 text-xs"
          >
            Kapat
          </Button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
