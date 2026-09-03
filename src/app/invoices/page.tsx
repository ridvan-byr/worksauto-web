"use client"

import * as React from "react"
import {
  Receipt,
  Search,
  CreditCard,
  Banknote,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Printer,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { InvoiceStatusBadge } from "@/features/billing/components/invoice-status-badge"
import { RecordPaymentModal } from "@/features/billing/components/record-payment-modal"
import { InvoiceDetailModal } from "@/features/billing/components/invoice-detail-modal"
import {
  getStoredInvoices,
  recordInvoicePayment,
  getDailyCashSummary,
} from "@/features/billing/mock-data"
import { Invoice, PaymentMethod } from "@/features/billing/types"
import { cn } from "@/lib/utils"

export default function InvoicesPage() {
  const [invoices, setInvoices] = React.useState<Invoice[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  // Modals
  const [paymentModalState, setPaymentModalState] = React.useState<{
    isOpen: boolean
    invoice: Invoice | null
  }>({ isOpen: false, invoice: null })

  const [detailModalState, setDetailModalState] = React.useState<{
    isOpen: boolean
    invoice: Invoice | null
  }>({ isOpen: false, invoice: null })

  React.useEffect(() => {
    setInvoices(getStoredInvoices())
  }, [])

  const cashSummary = React.useMemo(() => getDailyCashSummary(), [invoices])

  // KPIs
  const totalReceivables = invoices.reduce((sum, i) => sum + i.remainingAmount, 0)
  const totalPaid = invoices.reduce((sum, i) => sum + i.paidAmount, 0)
  const unpaidCount = invoices.filter((i) => i.status === "UNPAID").length
  const partialCount = invoices.filter((i) => i.status === "PARTIALLY_PAID").length

  const filteredInvoices = React.useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== "all" && inv.status !== statusFilter) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      const matchNum = inv.invoiceNumber.toLowerCase().includes(q)
      const matchCust = inv.customerName.toLowerCase().includes(q) || (inv.companyTitle?.toLowerCase().includes(q) || false)
      const matchPlate = inv.vehiclePlate.toLowerCase().includes(q)
      const matchWO = inv.workOrderNumber?.toLowerCase().includes(q) || false
      return matchNum || matchCust || matchPlate || matchWO
    })
  }, [invoices, statusFilter, searchQuery])

  const handleApplyPayment = (
    invoiceId: string,
    amount: number,
    method: PaymentMethod,
    ref?: string,
    note?: string
  ) => {
    recordInvoicePayment(invoiceId, amount, method, ref, note)
    setInvoices(getStoredInvoices())
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Faturalar & Kasa Yönetimi
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {invoices.length} Fatura
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Servis iş emirlerinden kesilen faturalar, kısmi ödemeler ve günlük kasa hareketleri.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Açık / Bekleyen Alacak</p>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">
              {totalReceivables.toLocaleString("tr-TR")} ₺
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Toplam Tahsil Edilen</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {totalPaid.toLocaleString("tr-TR")} ₺
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Ödeme Bekleyenler</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
              {unpaidCount + partialCount} Adet
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertCircle size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Günlük Kasa Hacmi</p>
            <p className="text-2xl font-bold text-sky-600 dark:text-sky-400 font-mono">
              {cashSummary.total.toLocaleString("tr-TR")} ₺
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
            <Receipt size={20} />
          </div>
        </div>
      </div>

      {/* Daily Cashier Breakdown Ribbon */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Receipt size={14} className="text-sky-500" />
          <span>Kasa Tahsilat Dağılımı:</span>
        </span>

        <div className="flex flex-wrap items-center gap-4 font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            <Banknote size={14} />
            <span>Nakit: <strong>{cashSummary.cash.toLocaleString("tr-TR")} ₺</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
            <CreditCard size={14} />
            <span>POS / Kart: <strong>{cashSummary.pos.toLocaleString("tr-TR")} ₺</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
            <Building2 size={14} />
            <span>Havale / EFT: <strong>{cashSummary.bank.toLocaleString("tr-TR")} ₺</strong></span>
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Fatura no (INV-2026), müşteri, plaka (35 EGE 01) veya iş emri ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "Tüm Faturalar" },
            { id: "UNPAID", label: "Ödenmemişler" },
            { id: "PARTIALLY_PAID", label: "Kısmi Ödenenler" },
            { id: "PAID", label: "Ödenenler" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border",
                statusFilter === tab.id
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs"
                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Fatura & İş Emri</th>
                <th className="py-3.5 px-4">Müşteri & Araç</th>
                <th className="py-3.5 px-4">Tarih</th>
                <th className="py-3.5 px-4">Toplam Tutar</th>
                <th className="py-3.5 px-4">Kalan Bakiye</th>
                <th className="py-3.5 px-4">Durum</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Aranan kriterlere uygun fatura bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => setDetailModalState({ isOpen: true, invoice: inv })}
                  >
                    {/* Invoice & WO */}
                    <td className="py-4 px-4 sm:px-6">
                      <p className="font-bold font-mono text-slate-900 dark:text-slate-100 text-xs">
                        {inv.invoiceNumber}
                      </p>
                      {inv.workOrderNumber && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          İş Emri: #{inv.workOrderNumber}
                        </p>
                      )}
                    </td>

                    {/* Customer & Vehicle */}
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                        {inv.companyTitle || inv.customerName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <PlateBadge plate={inv.vehiclePlate} size="xs" />
                        <span className="text-[10px] text-slate-400">
                          {inv.vehicleBrand} {inv.vehicleModel}
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 text-slate-500 font-mono text-xs">
                      {inv.issueDate}
                    </td>

                    {/* Grand Total */}
                    <td className="py-4 px-4 font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                      {inv.grandTotal.toLocaleString("tr-TR")} ₺
                    </td>

                    {/* Remaining */}
                    <td className="py-4 px-4 font-mono text-xs">
                      <span className={inv.remainingAmount > 0 ? "font-bold text-rose-600 dark:text-rose-400" : "text-slate-400"}>
                        {inv.remainingAmount.toLocaleString("tr-TR")} ₺
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 sm:px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5">
                        {inv.status !== "PAID" && (
                          <button
                            type="button"
                            onClick={() => setPaymentModalState({ isOpen: true, invoice: inv })}
                            className="h-8 px-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                            title="Tahsilat Girişi Yap"
                          >
                            <Receipt size={13} />
                            <span>Tahsilat</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setDetailModalState({ isOpen: true, invoice: inv })}
                          className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Faturayı İncele & Yazdır"
                        >
                          <FileText size={13} />
                          <span>Görüntüle</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={paymentModalState.isOpen}
        invoice={paymentModalState.invoice}
        onClose={() => setPaymentModalState({ isOpen: false, invoice: null })}
        onSuccess={handleApplyPayment}
      />

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        isOpen={detailModalState.isOpen}
        invoice={detailModalState.invoice}
        onClose={() => setDetailModalState({ isOpen: false, invoice: null })}
        onOpenPayment={(inv) => setPaymentModalState({ isOpen: true, invoice: inv })}
      />
    </div>
  )
}
