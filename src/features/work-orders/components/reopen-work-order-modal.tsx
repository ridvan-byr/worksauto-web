"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X, RotateCcw, AlertTriangle, FileText, ArrowRight, Wrench, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ReopenWorkOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  isLoading?: boolean
  workOrderNumber: string
  invoiceNumber: string
  plate?: string
  grandTotal?: number
}

export function ReopenWorkOrderModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  workOrderNumber,
  invoiceNumber,
  plate,
  grandTotal,
}: ReopenWorkOrderModalProps) {
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

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose()
      }}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
              <RotateCcw size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>İş Emrini Yeniden Aç</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300">
                  Fatura İptali Gerekir
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tamamlanmış ve faturası kesilmiş aracı atölye işlemlerine geri alma
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          {/* Target Record Badges */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">İş Emri & Araç</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">#{workOrderNumber}</span>
                {plate && (
                  <span className="font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[11px] font-semibold">
                    {plate}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Bağlı Fatura</span>
              <p className="font-mono font-bold text-rose-600 dark:text-rose-400">#{invoiceNumber}</p>
            </div>
          </div>

          {/* Explanation Box */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 p-4 space-y-2.5 text-xs text-amber-950 dark:text-amber-200">
            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
              <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Bu işlem gerçekleştirildiğinde şu adımlar uygulanır:</span>
            </div>

            <ul className="space-y-2 text-[11.5px] leading-relaxed text-amber-900/90 dark:text-amber-200/90 pl-1">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                <span>
                  <strong>Fatura İptal Edilir:</strong> <span className="font-mono">#{invoiceNumber}</span> numaralı fatura resmi olarak iptal statüsüne alınır.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                <span>
                  <strong>Cari Hesap Dengelenir:</strong> Müşteri carisine işlenen fatura borcu ve varsa tahsilat tutarları otomatik olarak mahsup edilir/dengelenir.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                <span>
                  <strong>İş Emri Lifte Döner:</strong> İş emri statüsü tekrar <strong>"İşlemde (Onarımda)"</strong> durumuna getirilir; böylece ilave yedek parça ve işçilik kalemleri ekleyebilirsiniz.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                <span>
                  <strong>Yeniden Faturalandırma:</strong> Ek onarımlar bittiğinde güncel liste üzerinden tek tıkla yeni ve eksiksiz bir fatura kesebilirsiniz.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-end gap-2.5 bg-slate-50/50 dark:bg-slate-900/50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="h-10 px-4 text-xs font-semibold cursor-pointer"
          >
            Vazgeç
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="h-10 px-5 text-xs font-bold gap-2 bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-lg shadow-amber-600/20 disabled:opacity-50"
          >
            {isLoading ? (
              <span>İşlem Yapılıyor...</span>
            ) : (
              <>
                <RotateCcw size={14} />
                <span>Faturayı İptal Et ve İşi Yeniden Aç</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
