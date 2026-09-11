"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X, History, ArrowDownRight, ArrowUpRight, Loader2, Calendar, User, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Product } from "../types"
import { useStockMovements, type StockMovementRecord } from "../api/use-inventory"

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

  const { data: serverMovements = [], isLoading } = useStockMovements(product?.id)

  if (!isOpen || !mounted || !product) return null

  // Server'dan gelen hareketler veya varsa lokal hareketler
  const movements: StockMovementRecord[] = serverMovements.length > 0
    ? serverMovements
    : (product.movements || []).map((m) => ({
        id: m.id,
        productId: m.productId,
        type: m.type,
        movementType: m.type,
        quantity: m.quantity,
        note: m.note,
        referenceId: m.referenceNo,
        createdBy: m.performedByName,
        createdAt: m.createdAt,
      }))

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
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Stok Hareket Geçmişi
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  {movements.length} Kayıt
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-[280px]">
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
        <div className="p-6 overflow-y-auto space-y-2.5 flex-1 min-h-[220px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2.5">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              <span className="text-xs font-semibold">Stok hareketleri yükleniyor...</span>
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-3">
                <History size={24} />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Henüz Kayıtlı Stok Hareketi Yok
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                Bu parçaya ait henüz bir toptancı alımı (+), iş emrinde servis sarfiyatı (-) veya sayım düzeltmesi gerçekleşmedi.
              </p>
            </div>
          ) : (
            movements.map((mov) => {
              const rawType = (mov.movementType || mov.type || "").toUpperCase()
              const isPositive =
                rawType.includes("IN") ||
                rawType.includes("RETURN") ||
                (typeof mov.quantity === "number" && mov.quantity > 0)

              let typeLabel = "Stok Hareketi"
              let typeClass = "bg-slate-500/10 text-slate-600 dark:text-slate-400"
              if (rawType.includes("PURCHASE") || rawType === "IN") {
                typeLabel = "Mal Kabul / Toptancı Alımı (+)"
                typeClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              } else if (rawType.includes("WORK_ORDER") || rawType === "OUT") {
                typeLabel = "İş Emri / Sarfiyat Çıkışı (-)"
                typeClass = "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              } else if (rawType.includes("ADJUSTMENT")) {
                typeLabel = "Depo Sayım Düzeltmesi"
                typeClass = "bg-sky-500/10 text-sky-600 dark:text-sky-400"
              } else if (rawType.includes("RETURN")) {
                typeLabel = "Parça İadesi (+)"
                typeClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }

              const performer =
                mov.createdBy ||
                (mov.user ? `${mov.user.name} ${mov.user.surname || ""}`.trim() : "Servis Yöneticisi")

              const formattedDate = mov.createdAt
                ? new Date(mov.createdAt).toLocaleString("tr-TR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })
                : "-"

              return (
                <div
                  key={mov.id}
                  className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 text-xs hover:border-purple-500/30 transition-all"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 mt-0.5 ${
                        isPositive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                      }`}
                    >
                      {isPositive ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${typeClass}`}>
                          {typeLabel}
                        </span>
                        {mov.referenceId && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <FileText size={10} />
                            <span>{mov.referenceId}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User size={10} />
                          <span>{performer}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          <span>{formattedDate}</span>
                        </span>
                      </div>

                      {mov.note && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 italic truncate max-w-xs">
                          "{mov.note}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono">
                    <span
                      className={`text-sm font-extrabold block ${
                        isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isPositive ? `+${Math.abs(mov.quantity)}` : `-${Math.abs(mov.quantity)}`} {product.unit}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Adet/Birim
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <p className="text-[11px] text-slate-400">
            Mevcut Stok: <strong className="text-slate-700 dark:text-slate-200 font-mono">{product.currentStock} {product.unit}</strong>
          </p>
          <Button type="button" variant="outline" onClick={onClose} className="h-9 px-4 text-xs font-semibold cursor-pointer">
            Kapat
          </Button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
