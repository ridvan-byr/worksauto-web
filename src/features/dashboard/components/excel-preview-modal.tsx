"use client"

import * as React from "react"
import {
  FileSpreadsheet,
  Download,
  X,
  Search,
  Table as TableIcon,
  Layers,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import type { FinancialReportResponse } from "@/features/dashboard/api/use-financial-reports"
import { exportFinancialReportToExcel } from "@/features/import-export/utils/aesthetic-excel"
import { toast } from "@/components/ui/sonner"

interface ExcelPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  report: FinancialReportResponse | null | undefined
  tenantName: string
}

type TabType = "summary" | "orders" | "payments"

export function ExcelPreviewModal({
  isOpen,
  onClose,
  report,
  tenantName,
}: ExcelPreviewModalProps) {
  const [activeTab, setActiveTab] = React.useState<TabType>("summary")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isExporting, setIsExporting] = React.useState(false)

  if (!isOpen || !report) return null

  const summary = report.summary
  const fmt = (v: number | undefined) =>
    (v || 0).toLocaleString("tr-TR", { maximumFractionDigits: 0 }) + " ₺"

  const fmtPercent = (v: number | undefined) => `%${(v || 0).toFixed(1)}`

  const handleDownloadExcel = async () => {
    setIsExporting(true)
    try {
      await exportFinancialReportToExcel(report, tenantName)
      toast.success("Excel kârlılık raporu başarıyla indirildi.")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bilinmeyen hata"
      toast.error("Excel indirme hatası: " + msg)
    } finally {
      setIsExporting(false)
    }
  }


  // Filtered orders for tab 2
  const filteredOrders = (report.recentCompletedOrders || []).filter((o) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      o.plate.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.workOrderNumber.toLowerCase().includes(q) ||
      o.vehicle.toLowerCase().includes(q)
    )
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[88vh] max-h-[850px] bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-800 flex flex-col overflow-hidden font-sans">
        {/* ================================================================= */}
        {/* 1. EXCEL APPLICATION TOP BAR */}
        {/* ================================================================= */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0d5c3a] text-white border-b border-emerald-800/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-white shadow-inner">
              <FileSpreadsheet size={18} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wide uppercase bg-emerald-950/60 px-1.5 py-0.5 rounded text-emerald-300 font-mono">
                  XLSX
                </span>
                <h3 className="text-sm font-bold tracking-tight">
                  Finansal_ve_Karlilik_Raporu_{new Date().toISOString().slice(0, 10)}.xlsx
                </h3>
              </div>
              <p className="text-[11px] text-emerald-100/80">
                WorksAuto Canlı Elektronik Tablo Önizleme Modu • {tenantName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleDownloadExcel}
              disabled={isExporting}
              className="h-8 px-3 text-xs font-bold gap-1.5 bg-white text-emerald-900 hover:bg-emerald-50 border-none cursor-pointer shadow-sm"
            >
              <Download size={13} />
              <span>Excel Olarak İndir</span>
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-800/80 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2. FORMULA / SEARCH & NAVIGATION BAR */}
        {/* ================================================================= */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-950/80 border-b border-slate-800 text-xs text-slate-400 shrink-0 gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              fx
            </span>
            <span className="text-[11px] text-slate-400 font-mono truncate max-w-xs sm:max-w-md">
              =SUM(İşçilik + (Yedek Parça Satış - Alış Maliyeti))
            </span>
          </div>

          {activeTab === "orders" && (
            <div className="relative w-48 sm:w-64">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Plaka, müşteri ara..."
                className="w-full h-7 pl-7 pr-2 text-[11px] rounded-lg bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* 3. SPREADSHEET MAIN GRID AREA */}
        {/* ================================================================= */}
        <div className="flex-1 overflow-auto bg-slate-900 text-slate-200 relative select-text">
          {/* TAB 1: YÖNETİCİ ÖZETİ İCMALİ */}
          {activeTab === "summary" && (
            <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
              <div className="border border-emerald-500/30 rounded-xl overflow-hidden bg-slate-950/60 shadow-lg">
                <div className="bg-emerald-950/70 border-b border-emerald-500/30 px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TableIcon size={15} className="text-emerald-400" />
                    <span className="font-bold text-xs uppercase tracking-wider text-emerald-300">
                      Sayfa 1: Finansal ve Kârlılık Yönetici Göstergeleri
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Hücre Aralığı: A1:D12
                  </span>
                </div>

                <table className="w-full text-xs font-mono border-collapse">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-400 text-[11px] border-b border-slate-800">
                      <th className="w-10 p-2 text-center border-r border-slate-800">#</th>
                      <th className="p-2 text-left border-r border-slate-800 w-1/3">A (Metrik Tanımı)</th>
                      <th className="p-2 text-right border-r border-slate-800 w-1/3">B (Tutar / Değer)</th>
                      <th className="p-2 text-left border-slate-800">C (Açıklama / Formül)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-2 text-center text-slate-600 bg-slate-950/40 border-r border-slate-800">1</td>
                      <td className="p-2.5 font-bold text-white border-r border-slate-800">Brüt Toplam Hasılat (Ciro)</td>
                      <td className="p-2.5 text-right font-black text-emerald-400 border-r border-slate-800 text-sm">
                        {fmt(summary?.totalRevenue)}
                      </td>
                      <td className="p-2.5 text-slate-400 text-[11px]">İşçilik + Yedek Parça Satış Toplamı</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-2 text-center text-slate-600 bg-slate-950/40 border-r border-slate-800">2</td>
                      <td className="p-2.5 font-bold text-sky-400 border-r border-slate-800">Net Faaliyet Kârı</td>
                      <td className="p-2.5 text-right font-black text-sky-400 border-r border-slate-800 text-sm">
                        {fmt(summary?.netProfit)}
                      </td>
                      <td className="p-2.5 text-slate-400 text-[11px]">Ciro - Yedek Parça Alış Maliyeti</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-2 text-center text-slate-600 bg-slate-950/40 border-r border-slate-800">3</td>
                      <td className="p-2.5 font-semibold border-r border-slate-800">Genel Kâr Marjı</td>
                      <td className="p-2.5 text-right font-bold text-emerald-400 border-r border-slate-800">
                        {fmtPercent(summary?.profitMargin)}
                      </td>
                      <td className="p-2.5 text-slate-400 text-[11px]">(Net Kâr / Brüt Ciro) * 100</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-2 text-center text-slate-600 bg-slate-950/40 border-r border-slate-800">4</td>
                      <td className="p-2.5 font-semibold border-r border-slate-800">İşçilik Hasılatı</td>
                      <td className="p-2.5 text-right font-bold text-amber-400 border-r border-slate-800">
                        {fmt(summary?.totalLabourRevenue)}
                      </td>
                      <td className="p-2.5 text-slate-400 text-[11px]">Doğrudan Atölye Emeği (%100 Marj)</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-2 text-center text-slate-600 bg-slate-950/40 border-r border-slate-800">5</td>
                      <td className="p-2.5 font-semibold border-r border-slate-800">Yedek Parça Satış Tutarı</td>
                      <td className="p-2.5 text-right font-bold text-violet-400 border-r border-slate-800">
                        {fmt(summary?.totalPartsRevenue)}
                      </td>
                      <td className="p-2.5 text-slate-400 text-[11px]">Takılan parçaların müşteriye satış bedeli</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-2 text-center text-slate-600 bg-slate-950/40 border-r border-slate-800">6</td>
                      <td className="p-2.5 font-semibold border-r border-slate-800">Yedek Parça Alış Maliyeti</td>
                      <td className="p-2.5 text-right font-bold text-rose-400 border-r border-slate-800">
                        {fmt(summary?.totalPartsCost)}
                      </td>
                      <td className="p-2.5 text-slate-400 text-[11px]">Toptancıdan parça alış gideri</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-2 text-center text-slate-600 bg-slate-950/40 border-r border-slate-800">7</td>
                      <td className="p-2.5 font-semibold border-r border-slate-800">Net Parça Satış Kârı</td>
                      <td className="p-2.5 text-right font-bold text-indigo-400 border-r border-slate-800">
                        {fmt((summary?.totalPartsRevenue || 0) - (summary?.totalPartsCost || 0))}
                      </td>
                      <td className="p-2.5 text-slate-400 text-[11px]">Parça Satış - Parça Alış</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-2 text-center text-slate-600 bg-slate-950/40 border-r border-slate-800">8</td>
                      <td className="p-2.5 font-semibold border-r border-slate-800">Fiili Kasa Tahsilatı</td>
                      <td className="p-2.5 text-right font-bold text-teal-400 border-r border-slate-800">
                        {fmt(summary?.cashCollected)}
                      </td>
                      <td className="p-2.5 text-slate-400 text-[11px]">Nakit + POS + Havale kasaya giren</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-2 text-center text-slate-600 bg-slate-950/40 border-r border-slate-800">9</td>
                      <td className="p-2.5 font-semibold border-r border-slate-800">Açık Hesap / Veresiye (Cari)</td>
                      <td className="p-2.5 text-right font-bold text-amber-500 border-r border-slate-800">
                        {fmt(summary?.unpaidReceivables)}
                      </td>
                      <td className="p-2.5 text-slate-400 text-[11px]">Dönem faturalarından henüz tahsil edilmeyen</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-2 text-center text-slate-600 bg-slate-950/40 border-r border-slate-800">10</td>
                      <td className="p-2.5 font-semibold border-r border-slate-800">Tamamlanan İş Emri Sayısı</td>
                      <td className="p-2.5 text-right font-bold text-white border-r border-slate-800">
                        {summary?.completedWorkOrdersCount || 0} Adet
                      </td>
                      <td className="p-2.5 text-slate-400 text-[11px]">Serviste onarımı biten araç adedi</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-2 text-center text-slate-600 bg-slate-950/40 border-r border-slate-800">11</td>
                      <td className="p-2.5 font-semibold border-r border-slate-800">Ortalama Araç Başı Sepet</td>
                      <td className="p-2.5 text-right font-bold text-sky-300 border-r border-slate-800">
                        {fmt(summary?.averageOrderValue)}
                      </td>
                      <td className="p-2.5 text-slate-400 text-[11px]">Toplam Ciro / İş Emri Adedi</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: İŞ EMİRLERİ KÂRLILIK TABLOSU */}
          {activeTab === "orders" && (
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-xs font-mono border-collapse min-w-[850px]">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 text-[11px] border-b border-slate-800">
                    <th className="w-10 p-2 text-center border-r border-slate-800">#</th>
                    <th className="p-2 text-left border-r border-slate-800">A (İş Emri No)</th>
                    <th className="p-2 text-left border-r border-slate-800">B (Tarih)</th>
                    <th className="p-2 text-left border-r border-slate-800">C (Plaka)</th>
                    <th className="p-2 text-left border-r border-slate-800">D (Müşteri)</th>
                    <th className="p-2 text-right border-r border-slate-800">E (Parça)</th>
                    <th className="p-2 text-right border-r border-slate-800">F (İşçilik)</th>
                    <th className="p-2 text-right border-r border-slate-800">G (Maliyet)</th>
                    <th className="p-2 text-right border-r border-slate-800">H (Toplam Ciro)</th>
                    <th className="p-2 text-right border-r border-slate-800">I (Net Kâr)</th>
                    <th className="p-2 text-center">J (Marj)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center py-12 text-slate-500">
                        Eşleşen iş emri kârlılık kaydı bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-2 text-center text-slate-600 bg-slate-950/40 border-r border-slate-800 text-[10px]">
                          {idx + 1}
                        </td>
                        <td className="p-2 font-bold text-sky-400 border-r border-slate-800">
                          {row.workOrderNumber}
                        </td>
                        <td className="p-2 text-slate-400 border-r border-slate-800 whitespace-nowrap">
                          {new Date(row.completedAt).toLocaleDateString("tr-TR")}
                        </td>
                        <td className="p-2 border-r border-slate-800">
                          <PlateBadge plate={row.plate} size="sm" />
                        </td>
                        <td className="p-2 text-slate-200 border-r border-slate-800 font-sans font-medium truncate max-w-[150px]">
                          {row.customerName}
                        </td>
                        <td className="p-2 text-right border-r border-slate-800 text-slate-300">
                          {fmt(row.partsTotal)}
                        </td>
                        <td className="p-2 text-right border-r border-slate-800 text-amber-400">
                          {fmt(row.labourTotal)}
                        </td>
                        <td className="p-2 text-right border-r border-slate-800 text-rose-400">
                          {fmt(row.partsCost)}
                        </td>
                        <td className="p-2 text-right border-r border-slate-800 font-bold text-white">
                          {fmt(row.grandTotal)}
                        </td>
                        <td className="p-2 text-right border-r border-slate-800 font-black text-emerald-400">
                          {fmt(row.estimatedProfit)}
                        </td>
                        <td className="p-2 text-center font-bold text-sky-300">
                          {fmtPercent(row.profitMargin)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredOrders.length > 0 && (
                  <tfoot>
                    <tr className="bg-emerald-950/60 font-bold border-t-2 border-emerald-500/40 text-emerald-300">
                      <td colSpan={5} className="p-2.5 text-right border-r border-slate-800">
                        TOPLAM ({filteredOrders.length} İş Emri):
                      </td>
                      <td className="p-2.5 text-right border-r border-slate-800">
                        {fmt(filteredOrders.reduce((s, r) => s + r.partsTotal, 0))}
                      </td>
                      <td className="p-2.5 text-right border-r border-slate-800">
                        {fmt(filteredOrders.reduce((s, r) => s + r.labourTotal, 0))}
                      </td>
                      <td className="p-2.5 text-right border-r border-slate-800 text-rose-300">
                        {fmt(filteredOrders.reduce((s, r) => s + r.partsCost, 0))}
                      </td>
                      <td className="p-2.5 text-right border-r border-slate-800 text-white font-black">
                        {fmt(filteredOrders.reduce((s, r) => s + r.grandTotal, 0))}
                      </td>
                      <td className="p-2.5 text-right border-r border-slate-800 text-emerald-300 font-black">
                        {fmt(filteredOrders.reduce((s, r) => s + r.estimatedProfit, 0))}
                      </td>
                      <td className="p-2.5 text-center text-emerald-300">
                        {fmtPercent(summary?.profitMargin)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {/* TAB 3: ÖDEME KANALLARI DAĞILIMI */}
          {activeTab === "payments" && (
            <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto">
              <div className="border border-emerald-500/30 rounded-xl overflow-hidden bg-slate-950/60 shadow-lg">
                <div className="bg-emerald-950/70 border-b border-emerald-500/30 px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TableIcon size={15} className="text-emerald-400" />
                    <span className="font-bold text-xs uppercase tracking-wider text-emerald-300">
                      Sayfa 3: Kasa Tahsilat Kanalları Dağılım İcmali
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Hücre Aralığı: A1:D6
                  </span>
                </div>

                <table className="w-full text-xs font-mono border-collapse">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-400 text-[11px] border-b border-slate-800">
                      <th className="w-10 p-2 text-center border-r border-slate-800">#</th>
                      <th className="p-2 text-left border-r border-slate-800 w-1/3">A (Tahsilat Kanalı)</th>
                      <th className="p-2 text-right border-r border-slate-800 w-1/3">B (Tahsil Edilen Tutar)</th>
                      <th className="p-2 text-right border-slate-800">C (Pay %)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {(report.paymentBreakdown || []).map((p, idx) => (
                      <tr key={p.method} className="hover:bg-slate-800/40">
                        <td className="p-2 text-center text-slate-600 bg-slate-950/40 border-r border-slate-800">
                          {idx + 1}
                        </td>
                        <td className="p-2.5 font-bold text-white border-r border-slate-800">
                          {p.label}
                        </td>
                        <td className="p-2.5 text-right font-black text-emerald-400 border-r border-slate-800">
                          {fmt(p.amount)}
                        </td>
                        <td className="p-2.5 text-right text-slate-300 font-bold">
                          {fmtPercent(p.percentage)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-emerald-950/60 font-bold border-t-2 border-emerald-500/40 text-emerald-300">
                      <td colSpan={2} className="p-2.5 text-right border-r border-slate-800">
                        TOPLAM KASA TAHSİLATI:
                      </td>
                      <td className="p-2.5 text-right border-r border-slate-800 text-white font-black">
                        {fmt(summary?.cashCollected)}
                      </td>
                      <td className="p-2.5 text-right">%100.0</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* 4. EXCEL SHEET TABS (Bottom Bar) */}
        {/* ================================================================= */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border-t border-slate-800 text-xs shrink-0 select-none">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("summary")}
              className={`px-3 py-1.5 rounded-t font-semibold transition-colors cursor-pointer flex items-center gap-1.5 border-t-2 ${
                activeTab === "summary"
                  ? "bg-slate-900 text-emerald-400 border-emerald-500 shadow-sm"
                  : "bg-transparent text-slate-400 border-transparent hover:text-white"
              }`}
            >
              <TableIcon size={12} />
              <span>1. Yönetici Özeti</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`px-3 py-1.5 rounded-t font-semibold transition-colors cursor-pointer flex items-center gap-1.5 border-t-2 ${
                activeTab === "orders"
                  ? "bg-slate-900 text-emerald-400 border-emerald-500 shadow-sm"
                  : "bg-transparent text-slate-400 border-transparent hover:text-white"
              }`}
            >
              <Layers size={12} />
              <span>2. İş Emirleri Kârlılık ({report.recentCompletedOrders?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("payments")}
              className={`px-3 py-1.5 rounded-t font-semibold transition-colors cursor-pointer flex items-center gap-1.5 border-t-2 ${
                activeTab === "payments"
                  ? "bg-slate-900 text-emerald-400 border-emerald-500 shadow-sm"
                  : "bg-transparent text-slate-400 border-transparent hover:text-white"
              }`}
            >
              <Sparkles size={12} />
              <span>3. Ödeme Kanalları</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500">
            <span>Microsoft Excel OpenXML (.xlsx) Uyumlu</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Hazır</span>
          </div>
        </div>
      </div>
    </div>
  )
}
