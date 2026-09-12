"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { CorporatePrintDocument } from "@/components/print/corporate-print-document"
import { WorkOrder } from "../types"

interface WorkOrderPrintModalProps {
  isOpen: boolean
  order: WorkOrder | null
  onClose: () => void
}

export function WorkOrderPrintModal({ isOpen, order, onClose }: WorkOrderPrintModalProps) {
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

  if (!isOpen || !mounted || !order) return null

  const handlePrint = () => {
    const originalTitle = document.title
    document.title = `WorksAuto_Servis_Formu_${order.workOrderNumber}_${order.plate}`
    window.print()
    setTimeout(() => {
      document.title = originalTitle
    }, 1000)
  }

  const subtotal = order.subtotal || (order.laborTotal + order.partsTotal)
  const kdvAmount = order.kdvAmount || Math.round(subtotal * 0.20)
  const grandTotal = order.grandTotal || Math.round(subtotal + kdvAmount)

  const modalContent = (
    <div
      id="invoice-modal-root"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 print:fixed print:inset-0 print:p-0 print:bg-white print:backdrop-blur-none print:z-[9999]"
    >
      {/* Printable Container */}
      <div
        id="invoice-card-container"
        className="w-full max-w-3xl rounded-3xl bg-slate-900/90 dark:bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print:w-full print:m-0 print:bg-white"
      >
        {/* Top Action Bar (Print sırasında gizlenir) */}
        <div className="px-6 py-3.5 border-b border-slate-700/60 flex items-center justify-between bg-slate-900 print:hidden text-white">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg">
              {order.workOrderNumber}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              Servis & Teslim Formu
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-9 px-3 text-xs font-semibold gap-1.5 cursor-pointer bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Printer size={14} />
              <span>Yazdır / PDF</span>
            </Button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Kurumsal Standart A4 Belge Şablonu (Daima Beyaz Zeminli) */}
        <div className="overflow-y-auto flex-1 bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 print:p-0 print:bg-white">
          <CorporatePrintDocument
            title="İŞ EMRİ & SERVİS FORMU"
            documentNumber={order.workOrderNumber}
            date={order.createdAt ? order.createdAt.split("T")[0] : undefined}
            metaBadges={
              <>
                <p>
                  Atanan Teknisyen: <strong className="text-slate-900 font-bold">{order.assignedMechanicName}</strong>
                </p>
                <p>
                  Atölye / Lift: <strong className="text-slate-900 font-bold">{order.assignedLift}</strong>
                </p>
                <p>
                  Durum:{" "}
                  <strong className="text-sky-700 font-bold">
                    {order.status === "COMPLETED"
                      ? "Tamamlandı"
                      : order.status === "IN_PROGRESS"
                      ? "İşlem Devam Ediyor"
                      : "Beklemede"}
                  </strong>
                </p>
              </>
            }
            recipientCard={
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Müşteri Bilgileri</p>
                  <p className="font-bold text-sm text-slate-900">{order.customerName}</p>
                  <p className="text-slate-500 text-[11px]">İletişim Tel: {order.customerPhone}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Araç Bilgisi</p>
                  <div className="flex items-center gap-2 mb-1">
                    <PlateBadge plate={order.plate} size="sm" />
                    <span className="font-bold text-sm text-slate-900">
                      {order.brand} {order.model}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    {order.year} Model • {order.kilometer.toLocaleString("tr-TR")} KM
                  </p>
                  {order.vin && (
                    <p className="text-slate-500 text-[10px] font-mono mt-0.5">
                      Şasi (VIN): {order.vin}
                    </p>
                  )}
                </div>
              </div>
            }
            summarySection={
              <div className="w-64 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-500">
                  <span>İşçilik Toplamı:</span>
                  <span className="text-slate-900 font-bold">{order.laborTotal.toLocaleString("tr-TR")} ₺</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Yedek Parça Toplamı:</span>
                  <span className="text-slate-900 font-bold">{order.partsTotal.toLocaleString("tr-TR")} ₺</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>KDV (%20):</span>
                  <span className="text-slate-900 font-bold">{kdvAmount.toLocaleString("tr-TR")} ₺</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span className="font-sans">GENEL TOPLAM:</span>
                  <span>{grandTotal.toLocaleString("tr-TR")} ₺</span>
                </div>
              </div>
            }
            footerSignatures={{
              leftTitle: "Servis Danışmanı / Yetkili (İmza & Kaşe)",
              rightTitle: "Aracı Teslim Alan Müşteri (İmza)",
            }}
            legalNotice="İşbu servis teslim formu WorksAuto Otomotiv Servis Yönetim Sistemi üzerinden kayıt altına alınmıştır."
          >
            {/* 1. Yapılan İşçilikler Tablosu */}
            {order.services.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-black uppercase text-slate-600 tracking-wider">
                  Yapılan İşlemler & İşçilik ({order.services.length})
                </p>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2 px-3">İşlem / Açıklama</th>
                      <th className="py-2 px-3 text-center">Süre</th>
                      <th className="py-2 px-3 text-right">İşçilik Tutarı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {order.services.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 font-semibold text-slate-800">{s.name}</td>
                        <td className="py-2 px-3 text-center text-slate-500 font-mono">{s.durationMinutes} dk</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {s.laborPrice.toLocaleString("tr-TR")} ₺
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. Kullanılan Yedek Parçalar Tablosu */}
            {order.parts.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <p className="text-[11px] font-black uppercase text-slate-600 tracking-wider">
                  Kullanılan Yedek Parçalar ({order.parts.length})
                </p>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2 px-3">Parça Adı</th>
                      <th className="py-2 px-3 text-center">Parça / OEM No</th>
                      <th className="py-2 px-3 text-center">Miktar</th>
                      <th className="py-2 px-3 text-right">Birim Fiyat</th>
                      <th className="py-2 px-3 text-right">Toplam Fiyat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {order.parts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 font-semibold text-slate-800">{p.name}</td>
                        <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-500">{p.partNumber}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-800">{p.quantity}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600">
                          {p.unitPrice.toLocaleString("tr-TR")} ₺
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {p.totalPrice.toLocaleString("tr-TR")} ₺
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. Atölye & Kabul Notları */}
            {order.notes && order.notes.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <p className="text-[11px] font-black uppercase text-slate-600 tracking-wider">
                  Müşteri Talebi & Atölye Kabul Notları
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 space-y-1">
                  {order.notes.map((n, idx) => (
                    <div key={n.id || idx} className="text-xs">
                      <span className="font-bold text-slate-900">{n.authorName || "Servis Danışmanı"}: </span>
                      <span>{n.text || n.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CorporatePrintDocument>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
