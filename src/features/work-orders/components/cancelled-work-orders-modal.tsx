"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { X, XCircle, ArrowUpRight, RefreshCw, User, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { WorkOrder, WorkOrderStatus } from "../types"

interface CancelledWorkOrdersModalProps {
  isOpen: boolean
  onClose: () => void
  orders: WorkOrder[]
  onStatusChange: (id: string, newStatus: WorkOrderStatus) => void
  onSwitchToList: () => void
}

export function CancelledWorkOrdersModal({
  isOpen,
  onClose,
  orders,
  onStatusChange,
  onSwitchToList,
}: CancelledWorkOrdersModalProps) {
  const [mounted, setMounted] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!mounted || !isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <XCircle size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  İptal Edilen İş Emirleri
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  {orders.length} Kayıt
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                İptal edilen kayıtlar arşiv ve yasal denetim amacıyla saklanır, aktif panoyu meşgul etmez.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Orders Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {orders.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  İptal Edilen İş Emri Bulunmuyor
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Tüm iş emirleri aktif olarak sırada, liftte veya tamamlanmış durumda.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
                >
                  {/* Top: Plate & WO Number */}
                  <div className="flex items-center justify-between gap-2">
                    <PlateBadge plate={order.plate} size="sm" />
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/60">
                      {order.workOrderNumber}
                    </span>
                  </div>

                  {/* Vehicle & Customer */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {order.brand} {order.model} ({order.year || "Belirtilmedi"})
                    </h4>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <User size={12} className="shrink-0" />
                      <span className="truncate">{order.customerName}</span>
                      {order.customerPhone && (
                        <span className="text-slate-400">• {order.customerPhone}</span>
                      )}
                    </div>
                  </div>

                  {/* Cancellation Badge & Price */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                      <XCircle size={12} />
                      İptal Edildi
                    </span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {Number(order.grandTotal || 0).toLocaleString("tr-TR")} ₺
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        router.push(`/work-orders/${order.id}`)
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>İncele</span>
                      <ArrowUpRight size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onStatusChange(order.id, "IN_PROGRESS")
                        onClose()
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white transition-all flex items-center gap-1 cursor-pointer shadow-xs shadow-sky-500/20"
                      title="İşi tekrar lifte / işleme geri al"
                    >
                      <RefreshCw size={12} />
                      <span>İşleme Geri Al</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onSwitchToList}
            className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Liste Tablosunda Ayrıntılı Gör</span>
            <ArrowUpRight size={13} />
          </button>

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs h-9 px-4 rounded-xl cursor-pointer"
          >
            Kapat
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
