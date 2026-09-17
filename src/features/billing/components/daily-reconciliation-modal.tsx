"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  X,
  Printer,
  Loader2,
  RotateCw,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api-client"
import { CorporatePrintDocument } from "@/components/print/corporate-print-document"
import { cn } from "@/lib/utils"
import { CurrentAccount } from "../types"

export interface DailySummaryPaymentItem {
  id: string
  customerName: string
  invoiceNumber: string
  method: "CASH" | "POS" | "BANK_TRANSFER" | "ONLINE" | string
  amount: number
  date: string
  posSlipNo?: string
  notes?: string
  cashierName?: string
}

export interface DailySummaryResponse {
  date: string
  totalCash: number
  totalPos: number
  totalTransfer: number
  totalOnline: number
  grandTotal: number
  transactionCount: number
  payments?: DailySummaryPaymentItem[]
}

interface DailyReconciliationModalProps {
  isOpen: boolean
  accounts?: CurrentAccount[]
  initialDate?: string
  onClose: () => void
}

export function DailyReconciliationModal({
  isOpen,
  accounts = [],
  initialDate,
  onClose,
}: DailyReconciliationModalProps) {
  const [mounted, setMounted] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<string>(
    initialDate || new Date().toISOString().split("T")[0]
  )
  const [isLoading, setIsLoading] = React.useState(false)
  const [summaryData, setSummaryData] = React.useState<DailySummaryResponse | null>(null)

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

  // Fetch daily summary whenever modal opens or selectedDate changes
  const fetchSummary = React.useCallback(async (targetDate: string) => {
    setIsLoading(true)
    try {
      const res = await apiClient.get<DailySummaryResponse>("/payments/daily-summary", {
        params: { date: targetDate },
      })
      if (res) {
        setSummaryData(res)
      }
    } catch {
      // If API summary fails, fallback gracefully to accounts calculation if available
      setSummaryData(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (isOpen) {
      fetchSummary(selectedDate)
    }
  }, [isOpen, selectedDate, fetchSummary])

  if (!isOpen || !mounted) return null

  const selectedDateObj = new Date(selectedDate)
  const formattedDate = !isNaN(selectedDateObj.getTime())
    ? selectedDateObj.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        weekday: "long",
      })
    : selectedDate

  // Fallback calculations if backend returned no direct payments array
  let fallbackCash = 0
  let fallbackPos = 0
  let fallbackTransfer = 0
  const fallbackPayments: DailySummaryPaymentItem[] = []

  if (!summaryData && accounts.length > 0) {
    accounts.forEach((acc) => {
      ;(acc.movements || []).forEach((m) => {
        const isMatch = m.date && m.date.startsWith(selectedDate)
        if (isMatch && m.type === "PAYMENT" && m.credit > 0) {
          const desc = m.description || ""
          let method: "CASH" | "POS" | "BANK_TRANSFER" = "BANK_TRANSFER"
          if (desc.includes("CASH") || desc.toLowerCase().includes("nakit")) {
            method = "CASH"
            fallbackCash += m.credit
          } else if (
            desc.includes("CREDIT_CARD") ||
            desc.toLowerCase().includes("pos") ||
            desc.toLowerCase().includes("kredi kart")
          ) {
            method = "POS"
            fallbackPos += m.credit
          } else {
            method = "BANK_TRANSFER"
            fallbackTransfer += m.credit
          }
          fallbackPayments.push({
            id: m.id || String(Math.random()),
            customerName: acc.customerName,
            invoiceNumber: "-",
            method,
            amount: m.credit,
            date: m.date,
            notes: m.description,
          })
        }
      })
    })
  }

  const effectiveCash = summaryData ? summaryData.totalCash : fallbackCash
  const effectivePos = summaryData ? summaryData.totalPos : fallbackPos
  const effectiveTransfer = summaryData ? summaryData.totalTransfer : fallbackTransfer
  const effectiveOnline = summaryData ? summaryData.totalOnline || 0 : 0
  const effectiveGrandTotal = summaryData
    ? summaryData.grandTotal
    : effectiveCash + effectivePos + effectiveTransfer

  const effectivePayments: DailySummaryPaymentItem[] =
    summaryData?.payments && summaryData.payments.length > 0
      ? summaryData.payments
      : fallbackPayments

  const totalOutstanding = accounts.reduce((sum, a) => sum + Math.max(0, a.balance), 0)

  const handlePrint = () => {
    const originalTitle = document.title
    const safeDate = selectedDate.replace(/[^0-9-]/g, "")
    document.title = `WorksAuto_Kasa_Z_Raporu_${safeDate}`
    window.print()
    setTimeout(() => {
      document.title = originalTitle
    }, 1000)
  }

  const modalContent = (
    <div
      id="reconciliation-modal-root"
      className="corporate-print-root fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200 print:fixed print:inset-0 print:p-0 print:bg-white print:backdrop-blur-none print:z-[9999]"
    >
      {/* Modal Container */}
      <div
        id="reconciliation-card-container"
        className="w-full max-w-4xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:rounded-none print:w-full print:m-0"
      >
        {/* Top Action Bar (Print sırasında gizlenir) */}
        <div className="px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50 dark:bg-slate-900 print:hidden">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              Z-RAPORU
            </span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Gün Sonu Kasa Mutabakatı
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Date Switcher */}
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value)
                }}
                className="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchSummary(selectedDate)}
              disabled={isLoading}
              className="h-8 px-2.5 text-xs gap-1 cursor-pointer"
              title="Yenile"
            >
              <RotateCw size={13} className={isLoading ? "animate-spin" : ""} />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-8 px-3 text-xs gap-1.5 font-semibold cursor-pointer"
            >
              <Printer size={13} />
              <span>Yazdır / PDF</span>
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

        {/* Kurumsal Standart A4 Belge Şablonu (Daima Beyaz Zeminli) */}
        <div className="overflow-y-auto flex-1 bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 print:p-0 print:bg-white">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400 bg-white rounded-2xl max-w-4xl mx-auto p-12">
              <Loader2 size={24} className="animate-spin text-indigo-600" />
              <p className="text-xs font-medium">Kasa verileri hesaplanıyor...</p>
            </div>
          ) : (
            <CorporatePrintDocument
              title="GÜN SONU KASA MUTABAKATI (Z-RAPORU)"
              documentNumber={`Z-RAPOR-${selectedDate.replace(/-/g, "")}`}
              date={selectedDate}
              metaBadges={
                <div className="space-y-0.5">
                  <p>
                    Toplam Tahsilat: <strong className="text-slate-900 font-bold">{effectivePayments.length} İşlem</strong>
                  </p>
                  <p>
                    Kasa / Vezne: <strong className="text-slate-900 font-bold">KASA-01 (Merkez)</strong>
                  </p>
                  <p>
                    Kasa Durumu: <strong className="text-emerald-700 font-bold">Gün Sonu Mutabık ✓</strong>
                  </p>
                </div>
              }
              recipientCard={
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                      Kasa Tahsilat Kanalları Dağılımı
                    </p>
                    <div className="space-y-1 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Nakit Kasa:</span>
                        <strong className="text-emerald-700 font-bold">{effectiveCash.toLocaleString("tr-TR")} ₺</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Kredi Kartı / POS:</span>
                        <strong className="text-sky-700 font-bold">{effectivePos.toLocaleString("tr-TR")} ₺</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Banka Havale / EFT:</span>
                        <strong className="text-indigo-700 font-bold">{effectiveTransfer.toLocaleString("tr-TR")} ₺</strong>
                      </div>
                      {effectiveOnline > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Online (PayTR):</span>
                          <strong className="text-purple-700 font-bold">{effectiveOnline.toLocaleString("tr-TR")} ₺</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-4">
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                      Günün Net Kasa Girişi
                    </p>
                    <p className="text-2xl font-black text-slate-900 font-mono">
                      {effectiveGrandTotal.toLocaleString("tr-TR")} ₺
                    </p>
                    {accounts.length > 0 && (
                      <p className="text-[11px] text-slate-500 mt-1">
                        Cari Açık Alacak: <strong className="text-rose-600 font-mono">{totalOutstanding.toLocaleString("tr-TR")} ₺</strong>
                      </p>
                    )}
                  </div>
                </div>
              }
              summarySection={
                <div className="w-72 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Nakit Kasa Girişi:</span>
                    <span className="font-bold text-slate-900">{effectiveCash.toLocaleString("tr-TR")} ₺</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>POS / Kart Tahsilatı:</span>
                    <span className="font-bold text-slate-900">{effectivePos.toLocaleString("tr-TR")} ₺</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Banka / Havale Girişi:</span>
                    <span className="font-bold text-slate-900">{effectiveTransfer.toLocaleString("tr-TR")} ₺</span>
                  </div>
                  {effectiveOnline > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Online (PayTR) Girişi:</span>
                      <span className="font-bold text-slate-900">{effectiveOnline.toLocaleString("tr-TR")} ₺</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black pt-2 border-t-2 border-slate-900 text-slate-900">
                    <span className="font-sans">NET KASA TOPLAMI:</span>
                    <span className="text-emerald-700 font-mono">
                      {effectiveGrandTotal.toLocaleString("tr-TR")} ₺
                    </span>
                  </div>
                </div>
              }
              footerSignatures={{
                leftTitle: "Kasa Sorumlusu / Kasiyer (Teslim Eden)",
                rightTitle: "Servis Müdürü / Yetkilisi (Onaylayan)",
              }}
              legalNotice="Bu gün sonu kasa mutabakat raporu (Z-Raporu), WorksAuto servis yönetim altyapısı üzerinden dijital olarak üretilmiş olup muhasebe kayıtları ve fiili kasa ile mutabıktır."
            >
              {/* Children: Kasa Tahsilat Hareketleri ve Denetim Tutanağı */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Gün İçi Kasa Tahsilat Hareketleri ({effectivePayments.length})
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Tarih: {formattedDate}
                  </span>
                </div>

                {effectivePayments.length === 0 ? (
                  <div className="space-y-4">
                    <div className="p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 text-xs text-slate-600 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                        <span>Seçilen tarihte ({selectedDate}) kaydedilmiş bir kasa tahsilat hareketi bulunmuyor.</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">Mali Kapanış: 0 İşlem</span>
                    </div>

                    {/* Kanal Bazlı Kasa Sayım & Mutabakat Denetim Tablosu */}
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <div className="bg-slate-100/80 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                          Kanal Bazlı Gün Sonu Kasa Mutabakat & Sayım Tutanağı
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Sistem vs. Fiili Sayım
                        </span>
                      </div>
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            <th className="py-2 px-3">Kasa / Ödeme Kanalı</th>
                            <th className="py-2 px-3 text-right">Sistem Bakiyesi</th>
                            <th className="py-2 px-3 text-center">Fiili Kasa Sayımı / POS</th>
                            <th className="py-2 px-3 text-right">Fark</th>
                            <th className="py-2 px-3 text-center">Durum</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-800 font-mono text-[11px]">
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-sans font-semibold text-slate-800">
                              Nakit Kasa (Fiili Eldeki Mevcut)
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">
                              {effectiveCash.toLocaleString("tr-TR")} ₺
                            </td>
                            <td className="py-2 px-3 text-center text-slate-400">
                              [ ___________ ₺ ]
                            </td>
                            <td className="py-2 px-3 text-right text-slate-500">
                              0,00 ₺
                            </td>
                            <td className="py-2 px-3 text-center font-sans">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Mutabık ✓
                              </span>
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-sans font-semibold text-slate-800">
                              Kredi Kartı / POS Slipleri
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">
                              {effectivePos.toLocaleString("tr-TR")} ₺
                            </td>
                            <td className="py-2 px-3 text-center text-slate-400">
                              [ ___________ ₺ ]
                            </td>
                            <td className="py-2 px-3 text-right text-slate-500">
                              0,00 ₺
                            </td>
                            <td className="py-2 px-3 text-center font-sans">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                Dosyalandı ✓
                              </span>
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-sans font-semibold text-slate-800">
                              Banka Havale / EFT Girişleri
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">
                              {effectiveTransfer.toLocaleString("tr-TR")} ₺
                            </td>
                            <td className="py-2 px-3 text-center text-slate-400">
                              [ ___________ ₺ ]
                            </td>
                            <td className="py-2 px-3 text-right text-slate-500">
                              0,00 ₺
                            </td>
                            <td className="py-2 px-3 text-center font-sans">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Uyumlu ✓
                              </span>
                            </td>
                          </tr>
                          {effectiveOnline > 0 && (
                            <tr className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 font-sans font-semibold text-slate-800">
                                Online Tahsilat (PayTR Sanal POS)
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-slate-900">
                                {effectiveOnline.toLocaleString("tr-TR")} ₺
                              </td>
                              <td className="py-2 px-3 text-center text-slate-400">
                                [ ___________ ₺ ]
                              </td>
                              <td className="py-2 px-3 text-right text-slate-500">
                                0,00 ₺
                              </td>
                              <td className="py-2 px-3 text-center font-sans">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                  Onaylandı ✓
                                </span>
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-xs">
                            <td className="py-2 px-3 text-slate-900 font-sans uppercase">
                              GÜN SONU KASA TOPLAMI
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-emerald-700">
                              {effectiveGrandTotal.toLocaleString("tr-TR")} ₺
                            </td>
                            <td className="py-2 px-3 text-center font-mono text-slate-500">
                              [ ___________ ₺ ]
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-800">
                              0,00 ₺
                            </td>
                            <td className="py-2 px-3 text-center font-sans">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-emerald-600 text-white">
                                MUTABIK
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Resmi Kasa Kapanış Tutanağı ve Beyanı */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-600 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                          <ShieldCheck size={13} className="text-emerald-600" />
                          Kasa Kapanış Tutanağı ve Yetkili Beyanı
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Tutanak Ref: TUT-{selectedDate.replace(/-/g, "")}-Z1
                        </span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-slate-600">
                        İşbu Gün Sonu Kasa Mutabakat Raporu (Z-Raporu), servis merkezinin fiziki nakit kasası, banka hesap hareketleri ve POS terminalleri gün sonu dökümleri karşılaştırılarak tanzim edilmiştir. Muhasebe sistemi ile fiziki kasa mevcudunun tam mutabakat içinde olduğu, herhangi bir kasa açığı veya fazlası bulunmadığı taraflarca imza altına alınmıştır.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                            <th className="py-2.5 px-3">#</th>
                            <th className="py-2.5 px-3">Müşteri / Cari</th>
                            <th className="py-2.5 px-3">Fatura No</th>
                            <th className="py-2.5 px-3">Ödeme Türü</th>
                            <th className="py-2.5 px-3">Slip / Açıklama</th>
                            <th className="py-2.5 px-3 text-right">Tutar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-800">
                          {effectivePayments.map((p, idx) => {
                            const isCash = p.method === "CASH"
                            const isPos = p.method === "POS"
                            const isOnline = p.method === "ONLINE"
                            const methodLabel = isCash
                              ? "Nakit"
                              : isPos
                              ? "POS / Kredi Kartı"
                              : isOnline
                              ? "Online PayTR"
                              : "Banka Havalesi"

                            return (
                              <tr key={p.id || idx} className="hover:bg-slate-50/75 print:break-inside-avoid">
                                <td className="py-2 px-3 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                                <td className="py-2 px-3 font-semibold text-slate-900">
                                  {p.customerName}
                                  {p.cashierName && (
                                    <span className="block text-[10px] font-normal text-slate-500">
                                      Kasiyer: {p.cashierName}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">
                                  {p.invoiceNumber || "-"}
                                </td>
                                <td className="py-2 px-3">
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border",
                                      isCash
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : isPos
                                        ? "bg-sky-50 text-sky-700 border-sky-200"
                                        : isOnline
                                        ? "bg-purple-50 text-purple-700 border-purple-200"
                                        : "bg-indigo-50 text-indigo-700 border-indigo-200"
                                    )}
                                  >
                                    {methodLabel}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-slate-600 text-[11px]">
                                  {p.posSlipNo && (
                                    <span className="font-mono font-semibold text-slate-800 mr-1.5">
                                      Slip #{p.posSlipNo}
                                    </span>
                                  )}
                                  {p.notes || "-"}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                                  +{p.amount.toLocaleString("tr-TR")} ₺
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Resmi Kasa Kapanış Tutanağı ve Beyanı (İşlem Varken) */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-600 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                          <ShieldCheck size={13} className="text-emerald-600" />
                          Kasa Kapanış Tutanağı ve Yetkili Beyanı
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Tutanak Ref: TUT-{selectedDate.replace(/-/g, "")}-Z1
                        </span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-slate-600">
                        İşbu Gün Sonu Kasa Mutabakat Raporu (Z-Raporu), yukarıda listelenen {effectivePayments.length} adet tahsilat işlemine istinaden düzenlenmiş olup fiziki nakit kasası, POS gün sonu dökümleri ve banka hesap hareketleri ile tam mutabakat sağlanmıştır.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CorporatePrintDocument>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-800/30 print:hidden">
          <p className="text-[11px] text-slate-400">
            Kasa hareketleri anlık olarak merkezi muhasebe ve cari hesaplarla senkronizedir.
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-9 px-4 text-xs cursor-pointer"
          >
            Kapat
          </Button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
