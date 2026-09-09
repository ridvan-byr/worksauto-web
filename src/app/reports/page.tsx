"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import {
  BarChart3,
  TrendingUp,
  Wrench,
  CreditCard,
  Calendar,
  Printer,
  RefreshCw,
  Search,
  Car,
  FileSpreadsheet,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/features/auth/auth-context"
import {
  useFinancialReport,
  type ReportPeriod,
  type WorkOrderReportRow,
} from "@/features/dashboard/api/use-financial-reports"
import { exportFinancialReportToExcel } from "@/features/import-export/utils/aesthetic-excel"
import { ExcelPreviewModal } from "@/features/dashboard/components/excel-preview-modal"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { toast } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

export default function ReportsPage() {
  const { tenant, user } = useAuth()
  const [period, setPeriod] = React.useState<ReportPeriod>("this_month")
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [searchFilter, setSearchFilter] = React.useState("")
  const [isExporting, setIsExporting] = React.useState(false)
  const [isManualRefreshing, setIsManualRefreshing] = React.useState(false)
  const [isExcelPreviewOpen, setIsExcelPreviewOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const { data: report, isLoading, refetch, isFetching } = useFinancialReport({
    period,
    startDate: period === "custom" && startDate ? new Date(startDate).toISOString() : undefined,
    endDate: period === "custom" && endDate ? new Date(endDate + "T23:59:59").toISOString() : undefined,
  })

  const tenantName = tenant?.name || "AutoWorks Servis"

  // Animated Refresh Handler
  const handleRefresh = async () => {
    setIsManualRefreshing(true)
    try {
      await refetch()
      toast.success("Rapor verileri başarıyla güncellendi.", { duration: 1800 })
    } catch {
      toast.error("Veriler yenilenirken hata oluştu.")
    } finally {
      setTimeout(() => {
        setIsManualRefreshing(false)
      }, 750)
    }
  }

  // Print Handler (Single Page PDF Export)
  const handlePrint = () => {
    const originalTitle = document.title
    document.title = `WorksAuto_Finansal_Rapor_${new Date().toISOString().slice(0, 10)}`
    window.print()
    setTimeout(() => {
      document.title = originalTitle
    }, 1000)
  }

  // Excel Export Handler
  const handleExportExcel = async () => {
    if (!report) {
      toast.error("İndirilecek rapor verisi bulunamadı.")
      return
    }
    setIsExporting(true)
    try {
      await exportFinancialReportToExcel(report, tenantName)
      toast.success("Excel kârlılık raporu başarıyla indirildi.")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bilinmeyen hata"
      toast.error("Excel oluşturulurken hata oluştu: " + msg)
    } finally {
      setIsExporting(false)
    }
  }

  // Filtered orders in the table
  const filteredOrders = React.useMemo(() => {
    if (!report?.recentCompletedOrders) return []
    const q = searchFilter.trim().toLowerCase()
    if (!q) return report.recentCompletedOrders
    return report.recentCompletedOrders.filter(
      (o) =>
        o.plate.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.workOrderNumber.toLowerCase().includes(q) ||
        o.vehicle.toLowerCase().includes(q)
    )
  }, [report, searchFilter])

  // Helpers for currency formatting
  const fmt = (val: number | undefined) =>
    (val || 0).toLocaleString("tr-TR", { maximumFractionDigits: 0 })

  const summary = report?.summary

  // Period label translator
  const getPeriodDisplay = () => {
    if (!report) return ""
    const s = new Date(report.startDate).toLocaleDateString("tr-TR")
    const e = new Date(report.endDate).toLocaleDateString("tr-TR")
    return `${s} – ${e}`
  }

  return (
    <div id="reports-print-area" className="pb-16 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. INTERACTIVE SCREEN DASHBOARD (Hidden during print) */}
      {/* ========================================================================= */}
      <div className="no-print space-y-6">
        {/* Header Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  <BarChart3 size={24} />
                </div>
                <span>Finansal & Operasyonel Raporlar</span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {tenantName} — Günlük/aylık ciro, net kâr, işçilik vs. parça gelir ayrımı ve kasa icmali.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Animated Refresh Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isManualRefreshing || isFetching}
              className={cn(
                "h-10 px-3.5 text-xs font-semibold gap-2 cursor-pointer bg-white dark:bg-slate-900 transition-all duration-300",
                isManualRefreshing && "ring-2 ring-sky-500/50 bg-sky-50/70 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-bold"
              )}
            >
              <RefreshCw
                size={14}
                className={cn(
                  "transition-transform",
                  (isManualRefreshing || isFetching) && "animate-spin text-sky-500"
                )}
              />
              <span>{isManualRefreshing ? "Yenileniyor..." : "Yenile"}</span>
            </Button>

            {/* Excel Preview Modal Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsExcelPreviewOpen(true)}
              disabled={isLoading || !report}
              className="h-10 px-3.5 text-xs font-semibold gap-1.5 cursor-pointer bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
            >
              <Eye size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>Excel Önizle</span>
            </Button>

            {/* Excel Export Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={isExporting || isLoading || !report}
              className="h-10 px-3.5 text-xs font-semibold gap-1.5 cursor-pointer bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
            >
              <FileSpreadsheet size={15} className="text-emerald-600 dark:text-emerald-400" />
              <span>Excel İndir</span>
            </Button>

            {/* Print / PDF Button */}
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              disabled={isLoading || !report}
              className="h-10 px-4 text-xs font-semibold gap-1.5 cursor-pointer bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-500/20"
            >
              <Printer size={15} />
              <span>Yazdır / PDF</span>
            </Button>
          </div>
        </div>

      {/* ========================================================================= */}
      {/* 3. DATE FILTER BAR (Hidden during print) */}
      {/* ========================================================================= */}
      <div className="no-print p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <Calendar size={13} />
            Dönem:
          </span>

          {(
            [
              { id: "today", label: "Bugün" },
              { id: "yesterday", label: "Dün" },
              { id: "this_week", label: "Bu Hafta" },
              { id: "this_month", label: "Bu Ay" },
              { id: "last_month", label: "Geçen Ay" },
              { id: "custom", label: "Özel Tarih" },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                period === p.id
                  ? "bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950 shadow-sm font-bold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom date range pickers if 'custom' is active */}
        {period === "custom" && (
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none focus:border-sky-500"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none focus:border-sky-500"
            />
          </div>
        )}

        {/* Active Range Display Badge */}
        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 self-start lg:self-auto">
          📅 Kapsam: <strong className="font-mono text-sky-600 dark:text-sky-400">{getPeriodDisplay()}</strong>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. 5 EXECUTIVE KPI CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* KPI 1: Toplam Ciro */}
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-sm bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                Toplam Brüt Ciro
              </span>
              <div className="p-1.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <TrendingUp size={15} />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
              ₺ {fmt(summary?.totalRevenue)}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <span>İşçilik: ₺{fmt(summary?.totalLabourRevenue)}</span>
              <span>•</span>
              <span>Parça: ₺{fmt(summary?.totalPartsRevenue)}</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Net Kâr ve Marj */}
        <Card className="rounded-3xl border-emerald-500/25 dark:border-emerald-500/20 shadow-sm bg-gradient-to-br from-emerald-50/30 via-white to-emerald-50/10 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider text-[10px]">
                Net Kâr & Marj
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white shadow-sm">
                %{summary?.profitMargin ?? 0}
              </span>
            </div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
              ₺ {fmt(summary?.netProfit)}
            </p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
              İşçilik + (Parça Satış − Maliyet)
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: İşçilik Geliri (Usta Hasılatı) */}
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-sm bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                Saf İşçilik Geliri
              </span>
              <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Wrench size={15} />
              </div>
            </div>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight font-mono">
              ₺ {fmt(summary?.totalLabourRevenue)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Cironun %{summary?.totalRevenue ? Math.round(((summary.totalLabourRevenue || 0) / summary.totalRevenue) * 100) : 0}&apos;si • %100 Katma Değer
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Kasa Girişi vs Açık Hesap */}
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-sm bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                Kasa Girişi (Tahsilat)
              </span>
              <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <CreditCard size={15} />
              </div>
            </div>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight font-mono">
              ₺ {fmt(summary?.cashCollected)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium truncate" title={`Açık Hesap (Veresiye): ₺${fmt(summary?.unpaidReceivables)}`}>
              Açık Hesap: <strong>₺{fmt(summary?.unpaidReceivables)}</strong>
            </p>
          </CardContent>
        </Card>

        {/* KPI 5: Araç Başı Sepet Ortalaması */}
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-sm bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                Sepet Ortalaması
              </span>
              <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Car size={15} />
              </div>
            </div>
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400 tracking-tight font-mono">
              ₺ {fmt(summary?.averageOrderValue)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Toplam <strong>{summary?.totalVehiclesServiced ?? 0} Araç</strong> ({summary?.completedWorkOrdersCount ?? 0} İş Emri)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 5. VISUAL ANALYTICS BREAKDOWNS (Ciro Kompozisyonu & Kasa Dağılımı) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ciro Kompozisyonu (İşçilik vs Parça) */}
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-sm p-5 space-y-4 bg-white dark:bg-slate-900">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Wrench size={16} className="text-sky-500" />
              <span>Ciro Kompozisyonu (İşçilik vs. Parça)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hasılatın yüzde kaçı saf işçilikten, yüzde kaçı yedek parçadan oluşuyor?
            </p>
          </div>

          {/* Dual Segment Progress Bar */}
          {summary && summary.totalRevenue > 0 ? (
            <div className="space-y-3">
              <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div
                  style={{
                    width: `${Math.round(((summary.totalLabourRevenue || 0) / summary.totalRevenue) * 100)}%`,
                  }}
                  className="bg-indigo-600 h-full transition-all duration-500"
                  title={`İşçilik: %${Math.round(((summary.totalLabourRevenue || 0) / summary.totalRevenue) * 100)}`}
                />
                <div
                  style={{
                    width: `${Math.round(((summary.totalPartsRevenue || 0) / summary.totalRevenue) * 100)}%`,
                  }}
                  className="bg-emerald-600 h-full transition-all duration-500"
                  title={`Yedek Parça: %${Math.round(((summary.totalPartsRevenue || 0) / summary.totalRevenue) * 100)}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="p-2.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    <span>İşçilik Payı</span>
                  </div>
                  <p className="text-base font-bold font-mono text-indigo-900 dark:text-indigo-200 mt-1">
                    ₺ {fmt(summary.totalLabourRevenue)}
                  </p>
                  <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400">
                    %{Math.round(((summary.totalLabourRevenue || 0) / summary.totalRevenue) * 100)} Hasılat Payı
                  </p>
                </div>

                <div className="p-2.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <span>Yedek Parça</span>
                  </div>
                  <p className="text-base font-bold font-mono text-emerald-900 dark:text-emerald-200 mt-1">
                    ₺ {fmt(summary.totalPartsRevenue)}
                  </p>
                  <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400">
                    Maliyet: ₺{fmt(summary.totalPartsCost)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-6 text-center">Bu dönemde tamamlanan iş emri bulunmuyor.</p>
          )}
        </Card>

        {/* Kasa & Tahsilat Türleri Dağılımı */}
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-sm p-5 space-y-4 bg-white dark:bg-slate-900">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CreditCard size={16} className="text-emerald-500" />
              <span>Kasa ve Tahsilat Yöntemleri</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kasaya fiilen giren ödemelerin kanallara göre dökümü.
            </p>
          </div>

          <div className="space-y-2.5">
            {report?.paymentBreakdown && report.paymentBreakdown.length > 0 ? (
              report.paymentBreakdown.map((item) => (
                <div
                  key={item.method}
                  className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        item.method === "CASH"
                          ? "bg-emerald-500"
                          : item.method === "POS"
                          ? "bg-sky-500"
                          : item.method === "BANK_TRANSFER"
                          ? "bg-indigo-500"
                          : "bg-amber-500"
                      )}
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {item.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      ₺ {fmt(item.amount)}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1.5 font-bold">
                      (%{item.percentage})
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic py-6 text-center">Bu dönemde tahsilat kaydı bulunmuyor.</p>
            )}
          </div>
        </Card>

        {/* Günlük Ciro & Kâr Trendi Mini Barları */}
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-sm p-5 space-y-4 bg-white dark:bg-slate-900">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp size={16} className="text-purple-500" />
              <span>Dönemsel Günlük Trend</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              İş emri tamamlanan günlerin ciro ve kâr seyri.
            </p>
          </div>

          {report?.dailyTrend && report.dailyTrend.length > 0 ? (
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {report.dailyTrend.map((d) => (
                <div
                  key={d.date}
                  className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {d.label}
                    </span>
                    <span className="text-[11px] text-slate-500">{d.orderCount} İş Emri</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-slate-900 dark:text-slate-100 font-bold">₺{fmt(d.revenue)}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                      +₺{fmt(d.profit)} kâr
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-6 text-center">Bu aralıkta günlük hareket verisi yok.</p>
          )}
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 6. COMPLETED WORK ORDERS PROFITABILITY TABLE */}
      {/* ========================================================================= */}
      <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Tamamlanan İş Emirleri ve Kârlılık Dökümü</span>
              <Badge variant="secondary" className="font-mono text-xs font-semibold">
                {filteredOrders.length} Adet
              </Badge>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              İş emri bazında parça satışı, parça maliyeti, işçilik geliri ve hesaplanan net kâr.
            </p>
          </div>

          {/* Search in table (hidden in print) */}
          <div className="no-print relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Plaka, müşteri veya iş emri..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition-all"
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3.5">İş Emri</th>
                <th className="py-3 px-3">Tarih</th>
                <th className="py-3 px-3">Plaka / Araç</th>
                <th className="py-3 px-3">Müşteri</th>
                <th className="py-3 px-3 text-right">İşçilik (₺)</th>
                <th className="py-3 px-3 text-right">Parça Satış (₺)</th>
                <th className="py-3 px-3 text-right">Parça Maliyeti (₺)</th>
                <th className="py-3 px-3 text-right">Toplam Ciro (₺)</th>
                <th className="py-3 px-3.5 text-right font-black text-emerald-700 dark:text-emerald-400">Net Kâr (₺)</th>
                <th className="py-3 px-3.5 text-center">Marj</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70 font-medium">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order: WorkOrderReportRow) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {order.workOrderNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(order.completedAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <PlateBadge plate={order.plate} />
                        <span className="text-slate-500 truncate max-w-[110px]" title={order.vehicle}>
                          {order.vehicle}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                      {order.customerName}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                      ₺{fmt(order.labourTotal)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      ₺{fmt(order.partsTotal)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400">
                      ₺{fmt(order.partsCost)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      ₺{fmt(order.grandTotal)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                      ₺{fmt(order.estimatedProfit)}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold",
                          order.profitMargin >= 40
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : order.profitMargin >= 20
                            ? "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                        )}
                      >
                        %{order.profitMargin}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-xs italic">
                    {isLoading
                      ? "Rapor verileri hesaplanıyor..."
                      : "Bu dönem aralığında tamamlanmış iş emri bulunamadı."}
                  </td>
                </tr>
              )}
            </tbody>
            {/* Table Footer Totals */}
            {filteredOrders.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold">
                  <td colSpan={4} className="py-3 px-3.5 text-right uppercase text-[10px] tracking-wider">
                    Dönem Toplamları ({filteredOrders.length} İş Emri):
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-indigo-700 dark:text-indigo-400">
                    ₺{fmt(filteredOrders.reduce((s, o) => s + o.labourTotal, 0))}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    ₺{fmt(filteredOrders.reduce((s, o) => s + o.partsTotal, 0))}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-500">
                    ₺{fmt(filteredOrders.reduce((s, o) => s + o.partsCost, 0))}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-base">
                    ₺{fmt(filteredOrders.reduce((s, o) => s + o.grandTotal, 0))}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono text-base text-emerald-600 dark:text-emerald-400">
                    ₺{fmt(filteredOrders.reduce((s, o) => s + o.estimatedProfit, 0))}
                  </td>
                  <td className="py-3 px-3.5 text-center font-bold">
                    %{summary?.profitMargin ?? 0}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      </div>

      {/* ========================================================================= */}
      {/* 2. DEDICATED PIXEL-PERFECT SINGLE-PAGE A4 PRINT LAYOUT (PORTALED TO BODY) */}
      {/* Fits cleanly on 1 page with WorksAuto Logo, Header, KPI, Breakdown & Signatures */}
      {/* ========================================================================= */}
      {mounted &&
        createPortal(
          <div
            id="reports-print-root"
            className="hidden print:block text-slate-900 bg-white font-sans text-xs w-full max-w-none print:p-0 print:m-0 print:border-none print:shadow-none"
          >
            {/* PRINT HEADER */}
            <div className="flex items-center justify-between pb-2 border-b-2 border-sky-600">
              <div className="flex items-center gap-3">
                <Image
                  src="/brand/worksauto-logo-dark.png"
                  alt="WorksAuto"
                  width={150}
                  height={32}
                  className="h-7 w-auto object-contain"
                  priority
                />
                <span className="text-[10px] font-bold text-slate-500 border-l border-slate-300 pl-2.5 uppercase tracking-wider my-auto">
                  Bulut Servis & Atölye Yönetim Platformu
                </span>
              </div>
              <div className="text-right">
                <h2 className="text-xs font-black uppercase tracking-tight text-slate-900">
                  {tenantName}
                </h2>
                <p className="text-[11px] font-black text-sky-800 uppercase tracking-tight">
                  RESMİ FİNANSAL VE KÂRLILIK RAPORU
                </p>
                <p className="text-[9px] text-slate-600 mt-0.5">
                  Kapsam: <strong>{getPeriodDisplay()}</strong> • Düzenleme: {new Date().toLocaleDateString("tr-TR")}
                </p>
              </div>
            </div>

            {/* 5 EXECUTIVE KPI CARDS IN 1 COMPACT ROW */}
            <div className="grid grid-cols-5 gap-1.5 mt-2">
              <div className="p-2 rounded-lg border border-slate-300 bg-slate-50/50">
                <p className="text-[9px] font-bold text-slate-500 uppercase">Toplam Ciro</p>
                <p className="text-sm font-black text-slate-900 mt-0.5">₺{fmt(summary?.totalRevenue)}</p>
                <p className="text-[8px] text-slate-500">İşçilik + Parça</p>
              </div>

              <div className="p-2 rounded-lg border border-emerald-300 bg-emerald-50/30">
                <p className="text-[9px] font-bold text-emerald-800 uppercase">Net Faaliyet Kârı</p>
                <p className="text-sm font-black text-emerald-700 mt-0.5">₺{fmt(summary?.netProfit)}</p>
                <p className="text-[8px] text-emerald-800 font-bold">Kâr Marjı: %{summary?.profitMargin}</p>
              </div>

              <div className="p-2 rounded-lg border border-slate-300 bg-slate-50/50">
                <p className="text-[9px] font-bold text-slate-500 uppercase">İşçilik Hasılatı</p>
                <p className="text-sm font-black text-indigo-700 mt-0.5">₺{fmt(summary?.totalLabourRevenue)}</p>
                <p className="text-[8px] text-slate-500">
                  Ciro Payı: %{summary && summary.totalRevenue > 0 ? Math.round((summary.totalLabourRevenue / summary.totalRevenue) * 100) : 0}
                </p>
              </div>

              <div className="p-2 rounded-lg border border-slate-300 bg-slate-50/50">
                <p className="text-[9px] font-bold text-slate-500 uppercase">Kasa Tahsilatı</p>
                <p className="text-sm font-black text-teal-700 mt-0.5">₺{fmt(summary?.cashCollected)}</p>
                <p className="text-[8px] text-amber-700 font-medium">Açık Hesap: ₺{fmt(summary?.unpaidReceivables)}</p>
              </div>

              <div className="p-2 rounded-lg border border-slate-300 bg-slate-50/50">
                <p className="text-[9px] font-bold text-slate-500 uppercase">Araç Başı Sepet</p>
                <p className="text-sm font-black text-slate-900 mt-0.5">₺{fmt(summary?.averageOrderValue)}</p>
                <p className="text-[8px] text-slate-500">{summary?.completedWorkOrdersCount} Araç Tamamlandı</p>
              </div>
            </div>

            {/* 2-COLUMN BREAKDOWN: LABOUR VS PARTS & CASH PAYMENT CHANNELS */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              {/* Left: Revenue & Cost Structure */}
              <div className="p-2 rounded-lg border border-slate-300 bg-slate-50/40 space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-800 border-b border-slate-200 pb-0.5">
                  Hasılat & Maliyet Dağılımı
                </p>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-600">İşçilik Emeği Hasılatı:</span>
                  <strong className="text-indigo-700">
                    ₺{fmt(summary?.totalLabourRevenue)} (%{summary && summary.totalRevenue > 0 ? Math.round((summary.totalLabourRevenue / summary.totalRevenue) * 100) : 0})
                  </strong>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-600">Yedek Parça Satış Tutarı:</span>
                  <strong>
                    ₺{fmt(summary?.totalPartsRevenue)} (%{summary && summary.totalRevenue > 0 ? 100 - Math.round((summary.totalLabourRevenue / summary.totalRevenue) * 100) : 0})
                  </strong>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-600">Yedek Parça Alış Maliyeti:</span>
                  <span className="text-rose-700 font-semibold">₺{fmt(summary?.totalPartsCost)}</span>
                </div>
                <div className="flex justify-between text-[10px] pt-0.5 border-t border-slate-200 font-bold">
                  <span>Net Parça Kârı:</span>
                  <span className="text-emerald-700">₺{fmt((summary?.totalPartsRevenue || 0) - (summary?.totalPartsCost || 0))}</span>
                </div>
              </div>

              {/* Right: Payment Channels */}
              <div className="p-2 rounded-lg border border-slate-300 bg-slate-50/40 space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-800 border-b border-slate-200 pb-0.5">
                  Kasa Tahsilat Kanalları
                </p>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-600">Nakit Tahsilat:</span>
                  <strong>₺{fmt(report?.paymentBreakdown?.find(p => p.method === "CASH")?.amount)}</strong>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-600">Kredi Kartı / POS:</span>
                  <strong>₺{fmt(report?.paymentBreakdown?.find(p => p.method === "POS")?.amount)}</strong>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-600">Banka Transferi / Havale:</span>
                  <strong>₺{fmt(report?.paymentBreakdown?.find(p => p.method === "BANK_TRANSFER")?.amount)}</strong>
                </div>
                <div className="flex justify-between text-[10px] pt-0.5 border-t border-slate-200 font-bold text-amber-800">
                  <span>Açık Hesap (Veresiye Cari Alacak):</span>
                  <span>₺{fmt(summary?.unpaidReceivables)}</span>
                </div>
              </div>
            </div>

            {/* COMPLETED WORK ORDERS PROFITABILITY TABLE */}
            <div className="border border-slate-300 rounded-lg overflow-hidden mt-2">
              <div className="bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-800 flex justify-between border-b border-slate-300">
                <span>TAMAMLANAN İŞ EMİRLERİ KÂRLILIK DÖKÜMÜ ({filteredOrders.length} Kayıt{filteredOrders.length > 6 ? " • İlk 6 Kayıt Gösteriliyor" : ""})</span>
                <span>Para Birimi: TRY (₺)</span>
              </div>
              <table className="w-full text-left text-[9px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-300">
                    <th className="py-1 px-1.5">İş Emri</th>
                    <th className="py-1 px-1.5">Tarih</th>
                    <th className="py-1 px-1.5">Plaka</th>
                    <th className="py-1 px-1.5">Müşteri</th>
                    <th className="py-1 px-1 text-right">İşçilik</th>
                    <th className="py-1 px-1 text-right">Parça</th>
                    <th className="py-1 px-1 text-right">Maliyet</th>
                    <th className="py-1 px-1.5 text-right">Toplam Ciro</th>
                    <th className="py-1 px-1.5 text-right font-black">Net Kâr</th>
                    <th className="py-1 px-1 text-center">Marj</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredOrders.slice(0, 6).map((order) => (
                    <tr key={order.id}>
                      <td className="py-0.5 px-1.5 font-mono font-bold">{order.workOrderNumber}</td>
                      <td className="py-0.5 px-1.5 whitespace-nowrap">{new Date(order.completedAt).toLocaleDateString("tr-TR")}</td>
                      <td className="py-0.5 px-1.5 font-bold">{order.plate}</td>
                      <td className="py-0.5 px-1.5 truncate max-w-[110px]">{order.customerName}</td>
                      <td className="py-0.5 px-1 text-right font-mono">₺{fmt(order.labourTotal)}</td>
                      <td className="py-0.5 px-1 text-right font-mono">₺{fmt(order.partsTotal)}</td>
                      <td className="py-0.5 px-1 text-right font-mono text-slate-500">₺{fmt(order.partsCost)}</td>
                      <td className="py-0.5 px-1.5 text-right font-mono font-bold">₺{fmt(order.grandTotal)}</td>
                      <td className="py-0.5 px-1.5 text-right font-mono font-black text-emerald-700">₺{fmt(order.estimatedProfit)}</td>
                      <td className="py-0.5 px-1 text-center font-bold">%{order.profitMargin}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-400 text-slate-900 text-[9.5px]">
                    <td colSpan={4} className="py-1 px-1.5 text-right">DÖNEM TOPLAMLARI:</td>
                    <td className="py-1 px-1 text-right font-mono">₺{fmt(filteredOrders.reduce((s, o) => s + o.labourTotal, 0))}</td>
                    <td className="py-1 px-1 text-right font-mono">₺{fmt(filteredOrders.reduce((s, o) => s + o.partsTotal, 0))}</td>
                    <td className="py-1 px-1 text-right font-mono text-slate-600">₺{fmt(filteredOrders.reduce((s, o) => s + o.partsCost, 0))}</td>
                    <td className="py-1 px-1.5 text-right font-mono font-black">₺{fmt(filteredOrders.reduce((s, o) => s + o.grandTotal, 0))}</td>
                    <td className="py-1 px-1.5 text-right font-mono font-black text-emerald-800">₺{fmt(filteredOrders.reduce((s, o) => s + o.estimatedProfit, 0))}</td>
                    <td className="py-1 px-1 text-center font-bold">%{summary?.profitMargin ?? 0}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* PRINT SIGNATURE BLOCK & LEGAL FOOTER */}
            <div className="pt-2 border-t border-slate-300 mt-2">
              <div className="grid grid-cols-3 gap-6 text-center text-[9.5px] text-slate-800 mb-1.5">
                <div className="space-y-3">
                  <p className="font-bold">Raporu Düzenleyen</p>
                  <div className="border-b border-slate-400 w-28 mx-auto" />
                  <p className="text-[8.5px] text-slate-500">{user ? `${user.name} ${user.surname || ""}` : "Servis Yetkilisi"}</p>
                </div>
                <div className="space-y-3">
                  <p className="font-bold">Mali İşler / Muhasebe</p>
                  <div className="border-b border-slate-400 w-28 mx-auto" />
                  <p className="text-[8.5px] text-slate-500">İmza & Paraf</p>
                </div>
                <div className="space-y-3">
                  <p className="font-bold">Servis Müdürü Onayı</p>
                  <div className="border-b border-slate-400 w-28 mx-auto" />
                  <p className="text-[8.5px] text-slate-500">Yetkili İmza & Kaşe</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[8px] text-slate-400 border-t border-slate-200 pt-1">
                <span>Bu resmi finansal icmal WorksAuto Bulut Servis Yönetim Sistemi tarafından üretilmiştir.</span>
                <span>Resmi İcra Raporu • Sayfa 1 / 1</span>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* 3. IN-APP EXCEL SPREADSHEET PREVIEW MODAL */}
      {/* ========================================================================= */}
      <ExcelPreviewModal
        isOpen={isExcelPreviewOpen}
        onClose={() => setIsExcelPreviewOpen(false)}
        report={report}
        tenantName={tenantName}
      />
    </div>
  )
}
