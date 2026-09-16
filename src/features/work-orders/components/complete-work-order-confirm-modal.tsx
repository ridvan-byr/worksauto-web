"use client"

import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { CheckCircle2, AlertTriangle, X, ShieldAlert } from "lucide-react"
import { WorkOrder } from "../types"
import { Button } from "@/components/ui/button"

interface CompleteWorkOrderConfirmModalProps {
  isOpen: boolean
  workOrder: WorkOrder | null
  onClose: () => void
  onConfirm: (orderId: string) => void
  isLoading?: boolean
}

export function CompleteWorkOrderConfirmModal({
  isOpen,
  workOrder,
  onClose,
  onConfirm,
  isLoading = false,
}: CompleteWorkOrderConfirmModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = "auto"
      }
    }
  }, [isOpen])

  if (!isOpen || !workOrder || !mounted) return null

  const modalContent = (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose()
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md my-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                İş Emrini Tamamla
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {workOrder.workOrderNumber} • {workOrder.plate}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
              <ShieldAlert size={16} className="shrink-0" />
              <span>Önemli Uyarı: Bu işlem iş emrini kilitler</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed opacity-90 pl-1">
              <li>
                İş emri tamamlandığında personel tarafından <strong>doğrudan tekrar devam ediyor aşamasına alınamaz</strong>.
              </li>
              <li>
                Sehven tamamlanan iş emirleri yalnızca <strong>Servis Müdürü</strong> veya <strong>İşletme Sahibi</strong> tarafından geri alınabilir.
              </li>
              <li>
                Varsa otomatik fatura kaydı ve müşteriye aracın hazır olduğuna dair bildirim süreçleri tetiklenir.
              </li>
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Toplam Tutar:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {workOrder.grandTotal.toLocaleString("tr-TR")} ₺
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 text-center font-medium pt-1">
            Aracın tüm servis işlemleri bitti mi? Tamamlamak istediğinize emin misiniz?
          </p>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="h-9 px-4 rounded-xl text-xs font-semibold"
          >
            Vazgeç
          </Button>
          <Button
            type="button"
            onClick={() => onConfirm(workOrder.id)}
            disabled={isLoading}
            className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-xs"
          >
            <CheckCircle2 size={15} />
            <span>Evet, İşi Tamamla</span>
          </Button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
