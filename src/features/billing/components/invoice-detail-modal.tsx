"use client"

import Image from "next/image"

import * as React from "react"
import { createPortal } from "react-dom"
import { X, Printer, Receipt, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { InvoiceStatusBadge } from "./invoice-status-badge"
import { Invoice } from "../types"

interface InvoiceDetailModalProps {
  isOpen: boolean
  invoice: Invoice | null
  onClose: () => void
  onOpenPayment?: (invoice: Invoice) => void
}

export function InvoiceDetailModal({ isOpen, invoice, onClose, onOpenPayment }: InvoiceDetailModalProps) {
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

  if (!isOpen || !mounted || !invoice) return null

  const handlePrint = () => {
    const originalTitle = document.title
    document.title = `WorksAuto_Fatura_${invoice.invoiceNumber}`
    window.print()
    setTimeout(() => {
      document.title = originalTitle
    }, 1000)
  }

  const modalContent = (
    <div
      id="invoice-modal-root"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 print:fixed print:inset-0 print:p-0 print:bg-white print:backdrop-blur-none print:z-[9999]"
    >
      {/* Printable Invoice Card */}
      <div
        id="invoice-card-container"
        className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print:w-full print:m-0"
      >
        
        {/* Top Action Bar (Print sırasında gizlenir) */}
        <div className="px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50 dark:bg-slate-900 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              {invoice.invoiceNumber}
            </span>
            <InvoiceStatusBadge status={invoice.status} />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-9 px-3 text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <Printer size={14} />
              <span>Yazdır / PDF</span>
            </Button>

            {invoice.status !== "PAID" && onOpenPayment && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onClose()
                  onOpenPayment(invoice)
                }}
                className="h-9 px-3.5 text-xs font-bold gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Receipt size={14} />
                <span>Tahsilat Al</span>
              </Button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Orijinal Zengin & Şık Fatura Şablonu */}
        <div className="p-8 overflow-y-auto space-y-6 flex-1 bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans print:overflow-visible print:p-6 print:space-y-4">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <Image
                  src="/brand/worksauto-logo-dark.png"
                  alt="WorksAuto Servis Merkezi"
                  width={160}
                  height={34}
                  className="h-8 w-auto object-contain dark:invert print:invert-0"
                />
                <span className="text-xs font-bold text-slate-400 tracking-wider uppercase border-l border-slate-300 dark:border-slate-700 pl-2.5 my-auto">
                  Servis Merkezi
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Maslak Oto Sanayi Sitesi 4. Blok No: 18, Sarıyer / İstanbul<br />
                Maslak V.D. • Vergi No: 9871234567 • Tel: 0 (212) 444 0 123
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-2xl font-black font-mono text-sky-600 dark:text-sky-400">
                {invoice.invoiceNumber}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Düzenleme Tarihi: <strong>{invoice.issueDate}</strong><br />
                İş Emri No: <strong>#{invoice.workOrderNumber || "N/A"}</strong>
              </p>
            </div>
          </div>

          {/* Müşteri ve Araç Bilgi Kartları */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-xs">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Müşteri Bilgileri</p>
              <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {invoice.companyTitle || invoice.customerName}
              </p>
              {invoice.companyTitle && (
                <p className="text-slate-500 text-[11px]">Yetkili: {invoice.customerName}</p>
              )}
              <p className="text-slate-500 text-[11px]">Tel: {invoice.customerPhone}</p>
              {invoice.taxOffice && (
                <p className="text-slate-400 text-[10px] font-mono mt-0.5">
                  {invoice.taxOffice} V.D. - V.No: {invoice.taxNumber}
                </p>
              )}
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Araç & Servis Bilgisi</p>
              <div className="flex items-center gap-2 mb-1">
                <PlateBadge plate={invoice.vehiclePlate} size="sm" />
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {invoice.vehicleBrand} {invoice.vehicleModel}
                </span>
              </div>
              <p className="text-slate-500 text-[11px]">
                {invoice.vehicleYear} Model • {invoice.vehicleKm.toLocaleString("tr-TR")} KM
              </p>
              {invoice.vehicleVin && (
                <p className="text-slate-400 text-[10px] font-mono mt-0.5">
                  Şasi (VIN): {invoice.vehicleVin}
                </p>
              )}
            </div>
          </div>

          {/* Hizmet & Parça Kalemleri Tablosu */}
          <div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Hizmet / Yedek Parça</th>
                  <th className="py-3 px-3 text-center">Tür</th>
                  <th className="py-3 px-3 text-center">Miktar</th>
                  <th className="py-3 px-3 text-right">Birim Fiyat</th>
                  <th className="py-3 px-3 text-right">Toplam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {invoice.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                    <td className="py-3 px-3 font-medium">
                      <p className="text-slate-900 dark:text-slate-100 font-bold text-xs">{item.name}</p>
                      {item.code && <span className="text-[10px] font-mono text-slate-400">{item.code}</span>}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          item.type === "SERVICE"
                            ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                            : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                        }`}
                      >
                        {item.type === "SERVICE" ? "İşçilik" : "Parça"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold">{item.quantity}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      {item.unitPrice.toLocaleString("tr-TR")} ₺
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {item.totalPrice.toLocaleString("tr-TR")} ₺
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Finansal Hesaplama Özeti */}
          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="w-64 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-500">
                <span>Ara Toplam (Matrah):</span>
                <span>{invoice.subtotal.toLocaleString("tr-TR")} ₺</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>KDV (%20):</span>
                <span>{invoice.taxAmount.toLocaleString("tr-TR")} ₺</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="font-sans">GENEL TOPLAM:</span>
                <span>{invoice.grandTotal.toLocaleString("tr-TR")} ₺</span>
              </div>

              {invoice.paidAmount > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 font-bold pt-1">
                  <span>Tahsil Edilen:</span>
                  <span>-{invoice.paidAmount.toLocaleString("tr-TR")} ₺</span>
                </div>
              )}

              <div className="flex justify-between text-xs font-bold pt-1 border-t border-dashed border-slate-300 dark:border-slate-700 text-rose-600 dark:text-rose-400">
                <span>KALAN BAKİYE:</span>
                <span>{invoice.remainingAmount.toLocaleString("tr-TR")} ₺</span>
              </div>
            </div>
          </div>

          {/* Kaşe & İmza Alanı */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800">
            <div>
              <p className="font-bold text-slate-600 dark:text-slate-300 mb-8">Servis Yetkilisi (Kaşe / İmza)</p>
              <div className="border-b border-dashed border-slate-300 dark:border-slate-700 mx-auto w-40" />
            </div>
            <div>
              <p className="font-bold text-slate-600 dark:text-slate-300 mb-8">Aracı ve Faturayı Teslim Alan</p>
              <div className="border-b border-dashed border-slate-300 dark:border-slate-700 mx-auto w-40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
