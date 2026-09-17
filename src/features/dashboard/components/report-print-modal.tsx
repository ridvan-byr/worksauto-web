"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { X, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { resolveMediaUrl } from "@/lib/utils"
import type { FinancialReportResponse, WorkOrderReportRow } from "../api/use-financial-reports"
import type { Tenant, User } from "@/features/auth/types"

interface ReportPrintModalProps {
  isOpen: boolean
  onClose: () => void
  report: FinancialReportResponse | null | undefined
  tenant: Tenant | null | undefined
  user: User | null | undefined
  tenantName: string
  getPeriodDisplay: () => string
  filteredOrders: WorkOrderReportRow[]
  fmt: (val: number | undefined) => string
}

export function ReportPrintModal({
  isOpen,
  onClose,
  report,
  tenant,
  user,
  tenantName,
  getPeriodDisplay,
  filteredOrders,
  fmt,
}: ReportPrintModalProps) {
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

  if (!isOpen || !mounted || !report) return null

  const summary = report.summary

  const handlePrint = () => {
    const originalTitle = document.title
    document.title = `WorksAuto_Finansal_Rapor_${new Date().toISOString().slice(0, 10)}`
    window.print()
    setTimeout(() => {
      document.title = originalTitle
    }, 1000)
  }

  const modalContent = (
    <div
      id="reports-modal-root"
      className="corporate-print-root fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 print:fixed print:inset-0 print:p-0 print:bg-white print:backdrop-blur-none print:z-[9999]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Modal Container */}
      <div
        id="reports-card-container"
        className="relative w-full max-w-4xl h-[92vh] max-h-[94vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 print:h-auto print:max-h-none print:shadow-none print:border-none print:rounded-none print:w-full print:m-0 print:bg-white"
      >
        {/* Top Action Bar (Hidden during print) */}
        <div className="px-5 py-3 sm:px-6 sm:py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50 dark:bg-slate-900 print:hidden flex-wrap gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-sky-600 bg-sky-50 dark:bg-sky-950/60 dark:text-sky-400 border border-sky-200 dark:border-sky-800/80 px-2.5 py-1 rounded-lg">
              FİNANSAL & KÂRLILIK RAPORU
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {getPeriodDisplay()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="h-9 px-3.5 text-xs font-semibold gap-1.5 cursor-pointer bg-sky-600 hover:bg-sky-500 text-white shadow-xs"
            >
              <Printer size={14} />
              <span>A4 Yazdır / PDF İndir</span>
            </Button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Kapat"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Area */}
        <div className="overflow-y-auto flex-1 p-3 sm:p-6 bg-slate-100/70 dark:bg-slate-950/60 print:p-0 print:bg-white print:overflow-visible flex justify-center">
          {/* A4 Paper Sheet Preview */}
          <div
            id="reports-print-root"
            className="w-full max-w-3xl bg-white text-slate-900 font-sans text-xs p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full flex flex-col justify-between min-h-[285mm] print:h-[285mm] print:min-h-[285mm] print:max-h-[286mm] box-border"
          >
            {/* TOP CONTENT: Header, KPIs, Breakdowns, Table */}
            <div className="space-y-2">
              {/* PRINT HEADER */}
              <div className="flex items-center justify-between pb-2 border-b-2 border-sky-600">
                {/* Sol: SADECE Firma Logosu & Resmi Bilgiler (Asıl Marka Sahibi) */}
                <div className="flex items-center gap-3">
                  {tenant?.logoUrl || tenant?.logo ? (
                    <img
                      src={resolveMediaUrl(tenant.logoUrl || tenant.logo)}
                      alt={tenantName}
                      style={{
                        maxHeight: `${tenant?.logoHeight || 44}px`,
                        maxWidth: `${tenant?.logoWidth || 180}px`,
                      }}
                      className="object-contain"
                    />
                  ) : (
                    /* Logo yüklenmemişse monogram mühür */
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-xs shadow-xs border border-slate-800 shrink-0">
                        {tenantName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 leading-tight tracking-tight">
                          {tenantName}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          Yetkili Servis Merkezi
                        </p>
                      </div>
                    </div>
                  )}

                  {(tenant?.logoUrl || tenant?.logo) && (
                    <div className="border-l border-slate-300 pl-2.5 my-auto">
                      <h2 className="text-xs font-black uppercase tracking-tight text-slate-900 leading-tight">
                        {tenantName}
                      </h2>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        Yetkili Servis Merkezi
                      </p>
                    </div>
                  )}
                </div>

                {/* Sağ: Belge Başlığı & Referans Bilgileri */}
                <div className="text-right space-y-0.5">
                  <p className="text-xs font-black text-sky-800 uppercase tracking-tight font-mono">
                    RESMİ FİNANSAL VE KÂRLILIK RAPORU
                  </p>
                  <p className="text-[9px] text-slate-600 font-mono">
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
                    <strong>₺{fmt(summary?.totalPartsRevenue)}</strong>
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
            </div>

            {/* PRINT SIGNATURE BLOCK & LEGAL FOOTER (PINNED EXACTLY TO THE BOTTOM OF THE A4 PAGE) */}
            <div className="mt-auto pt-4 border-t border-slate-300">
              <div className="grid grid-cols-3 gap-6 text-center text-[9.5px] text-slate-800 mb-3">
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

              <div className="flex items-center justify-between text-[8px] text-slate-400 border-t border-slate-200 pt-2 pb-0.5 font-mono">
                <div className="flex items-center gap-2">
                  <Image
                    src="/brand/worksauto-logo-dark.png"
                    alt="WorksAuto"
                    width={70}
                    height={14}
                    className="h-3 w-auto object-contain shrink-0"
                  />
                  <span>|</span>
                  <span>Bu resmi finansal icmal WorksAuto Bulut Servis Yönetim Sistemi tarafından üretilmiştir.</span>
                </div>
                <span>Resmi İcra Raporu • Sayfa 1 / 1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
