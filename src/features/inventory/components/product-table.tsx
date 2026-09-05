"use client"

import * as React from "react"
import {
  Search,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  History,
  AlertTriangle,
  Layers,
  MapPin,
} from "lucide-react"
import { Product, ProductCategory } from "../types"
import { StockBadge } from "./stock-badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ProductTableProps {
  products: Product[]
  onOpenMovement: (product: Product, direction: "IN" | "OUT") => void
  onOpenHistory: (product: Product) => void
}

export function ProductTable({ products, onOpenMovement, onOpenHistory }: ProductTableProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all")

  const filtered = React.useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter === "low_stock") {
        if (p.currentStock > p.minimumStock) return false
      } else if (categoryFilter !== "all" && p.category !== categoryFilter) {
        return false
      }

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      const cleanQ = q.replace(/[\s\-\.]/g, "")
      const matchName = p.name.toLowerCase().includes(q)
      const cleanSku = (p.sku || "").toLowerCase().replace(/[\s\-\.]/g, "")
      const matchSku = p.sku.toLowerCase().includes(q) || (cleanQ.length > 1 && cleanSku.includes(cleanQ))
      const matchShelf = p.shelfLocation?.toLowerCase().includes(q) || false
      const matchBarcode = p.barcode?.toLowerCase().includes(q) || false
      return matchName || matchSku || matchShelf || matchBarcode
    })
  }, [products, categoryFilter, searchQuery])

  return (
    <div className="space-y-4">
      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Parça adı, OEM kodu (W712), barkod veya raf konumu ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: "all", label: "Tüm Parçalar" },
            { id: "low_stock", label: "⚠️ Kritik Stoktakiler", highlight: true },
            { id: "OILS", label: "Madeni Yağ & Sıvılar" },
            { id: "FILTERS", label: "Filtre Grubu" },
            { id: "BRAKES", label: "Fren Sistemi" },
            { id: "IGNITION", label: "Ateşleme & Buji" },
            { id: "GENERAL", label: "Genel Sarf" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategoryFilter(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border",
                categoryFilter === tab.id
                  ? tab.highlight
                    ? "bg-rose-500 text-white border-rose-500 shadow-xs font-bold"
                    : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs"
                  : tab.highlight
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Parça Adı & OEM Kodu</th>
                <th className="py-3.5 px-4">Depo Rafı</th>
                <th className="py-3.5 px-4">Stok Durumu</th>
                <th className="py-3.5 px-4">Alış Fiyatı</th>
                <th className="py-3.5 px-4">Satış Fiyatı</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Hızlı İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Aranan kriterlere uygun parça bulunamadı.
                  </td>
                </tr>
              ) : (
                filtered.map((product) => {
                  const profitMargin = Math.round(
                    ((product.salePrice - product.purchasePrice) / product.purchasePrice) * 100
                  )
                  const healthRatio = Math.min(100, Math.round((product.currentStock / (product.minimumStock * 2)) * 100))

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Name & OEM */}
                      <td className="py-4 px-4 sm:px-6">
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {product.sku}
                          </span>
                          {product.barcode && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              Barkod: {product.barcode}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Shelf Location */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                          <MapPin size={11} className="text-sky-500" />
                          <span>{product.shelfLocation || "Raf Tanımsız"}</span>
                        </span>
                      </td>

                      {/* Stock Status & Visual Bar */}
                      <td className="py-4 px-4">
                        <div className="space-y-1.5">
                          <StockBadge
                            currentStock={product.currentStock}
                            minimumStock={product.minimumStock}
                            unit={product.unit}
                          />

                          {/* Mini Health Bar */}
                          <div className="w-24 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                product.currentStock <= product.minimumStock
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              )}
                              style={{ width: `${healthRatio}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Purchase Price */}
                      <td className="py-4 px-4 font-mono text-slate-500 text-xs">
                        {product.purchasePrice.toLocaleString("tr-TR")} ₺
                      </td>

                      {/* Sale Price & Profit */}
                      <td className="py-4 px-4 font-mono">
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                          {product.salePrice.toLocaleString("tr-TR")} ₺
                        </p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans font-semibold">
                          +{profitMargin}% Kâr
                        </p>
                      </td>

                      {/* Quick Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenMovement(product, "IN")}
                            className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Stok Girişi Yap (+)"
                          >
                            <ArrowDownRight size={13} />
                            <span>Giriş</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenMovement(product, "OUT")}
                            className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Stok Çıkışı Yap (-)"
                          >
                            <ArrowUpRight size={13} />
                            <span>Çıkış</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenHistory(product)}
                            className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Hareket Geçmişi"
                          >
                            <History size={13} />
                            <span>Geçmiş</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
