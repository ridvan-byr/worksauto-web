"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X, PackagePlus, ArrowRight, ArrowLeft, CheckCircle2, Tag, Layers, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Product, ProductCategory, StockUnit } from "../types"

interface CreateProductModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (product: Product) => void
}

export function CreateProductModal({ isOpen, onClose, onCreated }: CreateProductModalProps) {
  const [mounted, setMounted] = React.useState(false)
  const [step, setStep] = React.useState<1 | 2>(1)

  // Step 1: Identity
  const [name, setName] = React.useState("")
  const [sku, setSku] = React.useState("")
  const [barcode, setBarcode] = React.useState("")
  const [category, setCategory] = React.useState<ProductCategory>("FILTERS")
  const [unit, setUnit] = React.useState<StockUnit>("ADET")
  const [shelfLocation, setShelfLocation] = React.useState("Raf A-1")

  // Step 2: Pricing & Stock
  const [purchasePrice, setPurchasePrice] = React.useState<number | "">(150)
  const [salePrice, setSalePrice] = React.useState<number | "">(280)
  const [currentStock, setCurrentStock] = React.useState<number | "">(10)
  const [minimumStock, setMinimumStock] = React.useState<number | "">(4)

  const [errors, setErrors] = React.useState<Record<string, string>>({})

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

  const handleNext = () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = "Parça adı zorunludur."
    if (!sku.trim()) errs.sku = "OEM / Parça kodu zorunludur."

    setErrors(errs)
    if (Object.keys(errs).length === 0) {
      setStep(2)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newProduct: Product = {
      id: "prod_" + Date.now(),
      tenantId: "tenant_1",
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      barcode: barcode.trim() || undefined,
      category,
      unit,
      shelfLocation: shelfLocation.trim() || undefined,
      purchasePrice: Number(purchasePrice) || 0,
      salePrice: Number(salePrice) || 0,
      currentStock: Number(currentStock) || 0,
      minimumStock: Number(minimumStock) || 0,
      active: true,
      movements: [
        {
          id: "mov_" + Date.now(),
          productId: "prod_" + Date.now(),
          type: "IN_PURCHASE",
          quantity: Number(currentStock) || 0,
          previousStock: 0,
          nextStock: Number(currentStock) || 0,
          note: "Açılış Stok Kaydı",
          performedByName: "Servis Yöneticisi",
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    onCreated(newProduct)
    onClose()
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <PackagePlus size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{step === 1 ? "1. Parça Kimliği & Raf Konumu" : "2. Fiyatlandırma & Stok Seviyeleri"}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-500">
                  Adım {step}/2
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                {step === 1 ? "Ürün adı, OEM parça kodu ve depodaki rafı" : "Alış/satış fiyatı ve kritik stok alarm eşiği"}
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

        {/* Step 1 */}
        {step === 1 && (
          <div className="p-6 space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Parça Adı <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Örn: Castrol 5W-30 LL Motor Yağı"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                autoFocus
              />
              {errors.name && <p className="text-[10px] text-rose-500">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  OEM / Parça Kodu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: MANN-W712"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {errors.sku && <p className="text-[10px] text-rose-500">{errors.sku}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Barkod (İsteğe Bağlı)</label>
                <input
                  type="text"
                  placeholder="8690123456789"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
                  className="w-full h-10 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="OILS">Madeni Yağ</option>
                  <option value="FILTERS">Filtre Grubu</option>
                  <option value="BRAKES">Fren Sistemi</option>
                  <option value="IGNITION">Ateşleme</option>
                  <option value="SUSPENSION">Ön Takım</option>
                  <option value="GENERAL">Genel Sarf</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Birim</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as StockUnit)}
                  className="w-full h-10 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="ADET">Adet</option>
                  <option value="LITRE">Litre</option>
                  <option value="TAKIM">Takım</option>
                  <option value="SET">Set</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Depo Raf Konumu</label>
                <input
                  type="text"
                  placeholder="Örn: Raf C-2"
                  value={shelfLocation}
                  onChange={(e) => setShelfLocation(e.target.value)}
                  className="w-full h-10 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="h-10 px-4 text-xs font-semibold cursor-pointer">
                Vazgeç
              </Button>
              <Button type="button" onClick={handleNext} className="h-10 px-5 text-xs font-semibold gap-1.5 cursor-pointer">
                <span>Fiyat & Stok Seviyelerine Geç</span>
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Alış Fiyatı (TL) *</label>
                <input
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Satış Fiyatı (TL) *</label>
                <input
                  type="number"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold text-sky-600 dark:text-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Başlangıç Mevcut Stok ({unit})</label>
                <input
                  type="number"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Kritik Stok Alarm Eşiği</label>
                <input
                  type="number"
                  value={minimumStock}
                  onChange={(e) => setMinimumStock(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold text-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-900 dark:text-amber-200">
              💡 Stok {minimumStock} veya altına düştüğünde sistem otomatik sarı/kırmızı uyarı rozeti verecektir.
            </div>

            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex justify-between gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-10 px-4 text-xs font-semibold gap-1 cursor-pointer">
                <ArrowLeft size={14} />
                <span>Geri</span>
              </Button>
              <Button type="submit" className="h-10 px-5 text-xs font-semibold gap-1.5 cursor-pointer shadow-md shadow-sky-500/20">
                <CheckCircle2 size={14} />
                <span>Parça Kartını Oluştur</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
