"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X, History, ArrowDownRight, ArrowUpRight, Wrench, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Product } from "../types"

interface MovementHistoryModalProps {
  isOpen: boolean
  product: Product | null
  onClose: () => void
}

export function MovementHistoryModal({ isOpen, product, onClose }: MovementHistoryModalProps) {
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

  if (!isOpen || !mounted || !product) return null

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <History size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Stok Hareket Geçmişi
              </h2>
              <p className="text-[11px] text-slate-500 truncate max-w-[240px]">
                {product.name} ({product.sku})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* List of Movements */}
        <div className="p-6 overflow-y-auto space-y-2.5 flex-1">
          {product.movements.length === 0 ? (
            <p className="text-center py-10 text-xs text-slate-400 italic">
              Henüz bu parçaya ait hareket kaydı bulunmuyor.
            </p>
          ) : (
            product.movements.map((mov) => {
              const isPositive = mov.quantity > 0
              return (
                <div
                  key={mov.id}
                  className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                        isPositive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                      }`}
                    >
                      {isPositive ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {mov.type === "PURCHASE" && "Toptancı Satın Alımı (+)"}
                          {mov.type === "WORK_ORDER_USAGE" && "İş Emri Sarfiyatı (-)"}
                          {mov.type === "MANUAL_ADJUSTMENT" && "Sayım Düzeltmesi"}
                          {mov.type === "RETURN" && "İade Girişi (+)"}
                          {mov.type === "SALE" && "Doğrudan Satış (-)"}
                        </span>
                        {mov.referenceNo && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {mov.referenceNo}
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {mov.performedByName} • {new Date(mov.createdAt).toLocaleString("tr-TR")}
                      </p>
                      {mov.note && <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 italic">"{mov.note}"</p>}
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono">
                    <span
                      className={`text-sm font-extrabold block ${
                        isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isPositive ? `+${mov.quantity}` : mov.quantity} {product.unit}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {mov.previousStock} ➔ <strong>{mov.nextStock}</strong>
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200/80 dark:border-slate-800/80 flex justify-end bg-slate-50/50 dark:bg-slate-900/50">
          <Button type="button" variant="outline" onClick={onClose} className="h-9 px-4 text-xs font-semibold cursor-pointer">
            Kapat
          </Button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
