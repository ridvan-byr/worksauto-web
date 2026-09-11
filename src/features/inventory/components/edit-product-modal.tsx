"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X, Pencil, ArrowRight, ArrowLeft, CheckCircle2, Boxes, Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Product, ProductCategory, StockUnit } from "../types"
import {
  useShelves,
  useShelfMatrix,
  useUpdateProduct,
  type ShelfSummaryRecord,
  type ShelfCellRecord,
} from "../api/use-inventory"

interface EditProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onUpdated?: (product: Product) => void
  onDelete?: (product: Product) => void
}

export function EditProductModal({
  isOpen,
  onClose,
  product,
  onUpdated,
  onDelete,
}: EditProductModalProps) {
  const [mounted, setMounted] = React.useState(false)
  const [step, setStep] = React.useState<1 | 2>(1)

  const { data: shelves = [] } = useShelves()
  const [selectedShelfId, setSelectedShelfId] = React.useState<string>("")
  const [selectedCellId, setSelectedCellId] = React.useState<string>("")
  const [isCustomShelf, setIsCustomShelf] = React.useState(false)
  const [onlyEmptyCells, setOnlyEmptyCells] = React.useState(false)

  const { data: shelfMatrix } = useShelfMatrix(selectedShelfId || undefined)

  const updateProductMutation = useUpdateProduct()

  const cellMap = React.useMemo(() => {
    const map = new Map<string, ShelfCellRecord>()
    shelfMatrix?.cells?.forEach((cell: ShelfCellRecord) => {
      map.set(`${cell.rowNumber}-${cell.colNumber}`, cell)
    })
    return map
  }, [shelfMatrix?.cells])

  const floorNumbers = React.useMemo(() => {
    if (!shelfMatrix) return []
    const floors: number[] = []
    for (let r = shelfMatrix.rows; r >= 1; r--) {
      floors.push(r)
    }
    return floors
  }, [shelfMatrix])

  const colNumbers = React.useMemo(() => {
    if (!shelfMatrix) return []
    return Array.from({ length: shelfMatrix.columns }, (_, i) => i + 1)
  }, [shelfMatrix])

  const selectedCell = React.useMemo(() => {
    if (!selectedCellId || !shelfMatrix?.cells) return null
    return shelfMatrix.cells.find((c: ShelfCellRecord) => c.id === selectedCellId) || null
  }, [selectedCellId, shelfMatrix])

  // Form states
  const [name, setName] = React.useState("")
  const [sku, setSku] = React.useState("")
  const [barcode, setBarcode] = React.useState("")
  const [category, setCategory] = React.useState<ProductCategory>("GENERAL")
  const [unit, setUnit] = React.useState<StockUnit>("ADET")
  const [shelfLocation, setShelfLocation] = React.useState("")

  const [purchasePrice, setPurchasePrice] = React.useState<number | "">(0)
  const [salePrice, setSalePrice] = React.useState<number | "">(0)
  const [currentStock, setCurrentStock] = React.useState<number | "">(0)
  const [minimumStock, setMinimumStock] = React.useState<number | "">(5)

  const [errors, setErrors] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Sync state with product when modal opens
  React.useEffect(() => {
    if (isOpen && product) {
      document.body.style.overflow = "hidden"
      setName(product.name || "")
      setSku(product.sku || "")
      setBarcode(product.barcode || "")
      setCategory(product.category || "GENERAL")
      setUnit(product.unit || "ADET")
      setShelfLocation(product.shelfLocation || "")
      setPurchasePrice(product.purchasePrice ?? 0)
      setSalePrice(product.salePrice ?? 0)
      setCurrentStock(product.currentStock ?? 0)
      setMinimumStock(product.minimumStock ?? 5)

      if (product.shelfCellId) {
        setSelectedCellId(product.shelfCellId)
        setIsCustomShelf(false)
      } else {
        setSelectedCellId("")
        setIsCustomShelf(!!product.shelfLocation && product.shelfLocation !== "Depo")
      }

      // Determine the matching shelf ID for this specific product
      let matchedShelfId = ""
      if (product.shelfId && shelves.some((s: ShelfSummaryRecord) => s.id === product.shelfId)) {
        matchedShelfId = product.shelfId
      } else if (product.rack) {
        const found = shelves.find((s: ShelfSummaryRecord) => s.code === product.rack || s.name === product.rack)
        if (found) matchedShelfId = found.id
      } else if (product.shelfLocation) {
        const found = shelves.find(
          (s: ShelfSummaryRecord) =>
            product.shelfLocation?.startsWith(s.code) || product.shelfLocation?.includes(s.code)
        )
        if (found) matchedShelfId = found.id
      }

      if (!matchedShelfId && shelves.length > 0) {
        matchedShelfId = shelves[0].id
      }

      setSelectedShelfId(matchedShelfId)

      setStep(1)
      setErrors({})
      return () => {
        document.body.style.overflow = "auto"
      }
    }
  }, [isOpen, product, shelves])

  // If shelves finish loading after modal opened, ensure correct shelf is chosen
  React.useEffect(() => {
    if (isOpen && product && shelves.length > 0) {
      setSelectedShelfId((prev) => {
        if (product.shelfId && shelves.some((s: ShelfSummaryRecord) => s.id === product.shelfId)) {
          return product.shelfId
        }
        if (product.rack) {
          const found = shelves.find((s: ShelfSummaryRecord) => s.code === product.rack || s.name === product.rack)
          if (found) return found.id
        }
        if (product.shelfLocation) {
          const found = shelves.find(
            (s: ShelfSummaryRecord) =>
              product.shelfLocation?.startsWith(s.code) || product.shelfLocation?.includes(s.code)
          )
          if (found) return found.id
        }
        if (prev && shelves.some((s: ShelfSummaryRecord) => s.id === prev)) {
          return prev
        }
        return shelves[0]?.id || ""
      })
    }
  }, [isOpen, product, shelves])

  if (!isOpen || !mounted || !product) return null

  const handleNext = () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = "Parça adı zorunludur"
    if (!sku.trim()) errs.sku = "OEM / Parça kodu zorunludur"
    setErrors(errs)
    if (Object.keys(errs).length === 0) {
      setStep(2)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const resolvedShelfLocation = isCustomShelf
      ? shelfLocation
      : selectedCell
      ? selectedCell.cellCode
      : shelfLocation

    try {
      await updateProductMutation.mutateAsync({
        id: product.id,
        name,
        oemCode: sku,
        barcode: barcode || undefined,
        category,
        brand: product.brand || "Genel",
        unit,
        shelfLocation: resolvedShelfLocation,
        shelfId: !isCustomShelf && selectedShelfId ? selectedShelfId : null,
        shelfCellId: !isCustomShelf && selectedCellId ? selectedCellId : null,
        purchasePrice: typeof purchasePrice === "number" ? purchasePrice : 0,
        salePrice: typeof salePrice === "number" ? salePrice : 0,
        stockQuantity: typeof currentStock === "number" ? currentStock : 0,
        minStockLevel: typeof minimumStock === "number" ? minimumStock : 5,
      })

      if (onUpdated) {
        onUpdated({
          ...product,
          name,
          sku,
          barcode,
          category,
          unit,
          shelfLocation: resolvedShelfLocation,
          shelfId: !isCustomShelf && selectedShelfId ? selectedShelfId : undefined,
          shelfCellId: !isCustomShelf && selectedCellId ? selectedCellId : undefined,
          purchasePrice: typeof purchasePrice === "number" ? purchasePrice : 0,
          salePrice: typeof salePrice === "number" ? salePrice : 0,
          currentStock: typeof currentStock === "number" ? currentStock : 0,
          minimumStock: typeof minimumStock === "number" ? minimumStock : 5,
        })
      }

      onClose()
    } catch {
      // Error handled by mutation toast
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <Pencil size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Parça Kartını Düzenle
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {product.name} ({product.sku})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Steps Tab Indicator */}
        <div className="flex items-center px-6 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-800/60 text-xs">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 font-semibold cursor-pointer transition-colors ${
              step === 1 ? "text-sky-600 dark:text-sky-400" : "text-slate-500"
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-sky-500/10 text-sky-600 flex items-center justify-center text-[10px] font-bold">
              1
            </span>
            <span>Parça Tanımı & Depo Rafı</span>
          </button>
          <span className="mx-3 text-slate-300 dark:text-slate-700">/</span>
          <button
            type="button"
            onClick={handleNext}
            className={`flex items-center gap-2 font-semibold cursor-pointer transition-colors ${
              step === 2 ? "text-sky-600 dark:text-sky-400" : "text-slate-500"
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center text-[10px] font-bold">
              2
            </span>
            <span>Fiyat & Stok Seviyeleri</span>
          </button>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="p-6 space-y-4 overflow-y-auto flex-1 animate-in fade-in duration-200">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Parça Adı *
              </label>
              <input
                type="text"
                placeholder="Örn: Yağ Filtresi (W 712/75)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full h-10 px-3 rounded-xl border ${
                  errors.name
                    ? "border-rose-500 ring-1 ring-rose-500"
                    : "border-slate-200 dark:border-slate-800"
                } bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500`}
              />
              {errors.name && <p className="text-[10px] text-rose-500 font-medium">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  OEM / Parça Kodu *
                </label>
                <input
                  type="text"
                  placeholder="Örn: 03L115562"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  className={`w-full h-10 px-3 rounded-xl border ${
                    errors.sku
                      ? "border-rose-500 ring-1 ring-rose-500"
                      : "border-slate-200 dark:border-slate-800"
                  } bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500`}
                />
                {errors.sku && <p className="text-[10px] text-rose-500 font-medium">{errors.sku}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Barkod No
                </label>
                <input
                  type="text"
                  placeholder="869..."
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="OILS">Madeni Yağ & Sıvılar</option>
                  <option value="FILTERS">Filtre Grubu</option>
                  <option value="BRAKES">Fren Sistemi</option>
                  <option value="IGNITION">Ateşleme & Buji</option>
                  <option value="GENERAL">Genel Sarf Malzeme</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Birim
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as StockUnit)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="ADET">Adet</option>
                  <option value="LITRE">Litre</option>
                  <option value="SET">Set / Takım</option>
                  <option value="METRE">Metre</option>
                </select>
              </div>
            </div>

            {/* Raf / Depo Konumu Seçimi */}
            <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Boxes size={14} className="text-sky-500" />
                  <span>Depo Raf Konumu</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomShelf(!isCustomShelf)}
                  className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold hover:underline cursor-pointer"
                >
                  {isCustomShelf ? "← Raflardan Seç" : "Manuel Metin Gir"}
                </button>
              </div>

              {!isCustomShelf ? (
                <div className="space-y-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedShelfId}
                      onChange={(e) => {
                        setSelectedShelfId(e.target.value)
                        setSelectedCellId("")
                      }}
                      className="flex-1 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                    >
                      <option value="">Depo Rafı Seçin...</option>
                      {shelves.map((s: ShelfSummaryRecord) => (
                        <option key={s.id} value={s.id}>
                          {s.code} - {s.name} ({s.occupiedCells}/{s.totalCells} Dolu)
                        </option>
                      ))}
                    </select>

                    {selectedCell && (
                      <span className="h-9 px-3 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-xs font-mono font-bold flex items-center gap-1">
                        <Check size={13} />
                        <span>{selectedCell.cellCode}</span>
                      </span>
                    )}
                  </div>

                  {shelfMatrix && (
                    <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">
                          {shelfMatrix.name} ({shelfMatrix.rows} Kat x {shelfMatrix.columns} Göz)
                        </span>
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-500">
                          <input
                            type="checkbox"
                            checked={onlyEmptyCells}
                            onChange={(e) => setOnlyEmptyCells(e.target.checked)}
                            className="rounded border-slate-300 text-sky-500 focus:ring-sky-500"
                          />
                          <span>Sadece Boş Gözleri Vurgula</span>
                        </label>
                      </div>

                      {/* 2D Mini Raf Grid */}
                      <div className="overflow-x-auto p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[160px]">
                        <div
                          className="grid gap-1 min-w-full"
                          style={{
                            gridTemplateColumns: `36px repeat(${shelfMatrix.columns}, minmax(40px, 1fr))`,
                          }}
                        >
                          <div className="text-[9px] font-mono font-bold text-slate-400 flex items-center justify-center">
                            K/G
                          </div>
                          {colNumbers.map((c) => (
                            <div
                              key={`c-${c}`}
                              className="text-center font-mono font-bold text-[9px] text-slate-500 py-0.5"
                            >
                              G{c}
                            </div>
                          ))}

                          {floorNumbers.map((r) => (
                            <React.Fragment key={`r-${r}`}>
                              <div className="text-[9px] font-mono font-bold text-slate-400 flex items-center justify-center">
                                K{r}
                              </div>
                              {colNumbers.map((c) => {
                                const cell = cellMap.get(`${r}-${c}`)
                                if (!cell) return <div key={`empty-${r}-${c}`} className="w-8 h-8 rounded bg-slate-50" />

                                const isSelected = selectedCellId === cell.id
                                const isOccupied = (cell.products?.length || 0) > 0
                                const dim = onlyEmptyCells && isOccupied

                                return (
                                  <button
                                    key={cell.id}
                                    type="button"
                                    onClick={() => setSelectedCellId(cell.id)}
                                    className={`h-8 rounded-lg border font-mono text-[10px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                                      isSelected
                                        ? "bg-sky-500 text-white border-sky-400 ring-2 ring-sky-300 scale-105 shadow-md z-10"
                                        : isOccupied
                                        ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                                        : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-sky-300"
                                    } ${dim ? "opacity-30" : ""}`}
                                    title={`${cell.cellCode} (${isOccupied ? `${cell.products?.length} ürün` : "Boş"})`}
                                  >
                                    <span>G{cell.colNumber}</span>
                                  </button>
                                )
                              })}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Örn: RAF-A01-K1-G2 veya Kutu 4"
                  value={shelfLocation}
                  onChange={(e) => setShelfLocation(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              )}
            </div>

            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2">
              {onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onDelete(product)}
                  className="h-10 px-3 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1.5 cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Parçayı Sil</span>
                </Button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="h-10 px-4 text-xs font-semibold cursor-pointer"
                >
                  Vazgeç
                </Button>
                <Button
                  type="button"
                  onClick={handleNext}
                  className="h-10 px-5 text-xs font-semibold gap-1.5 cursor-pointer bg-sky-500 hover:bg-sky-600 text-white"
                >
                  <span>Fiyat & Stok Seviyelerine Geç</span>
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Alış Fiyatı (TL) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Satış Fiyatı (TL) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold text-sky-600 dark:text-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Mevcut Stok Miktarı ({unit})
                </label>
                <input
                  type="number"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Kritik Stok Alarm Eşiği
                </label>
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

            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="h-10 px-4 text-xs font-semibold gap-1 cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Geri</span>
                </Button>
                {onDelete && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onDelete(product)}
                    className="h-10 px-3 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1.5 cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>Parçayı Sil</span>
                  </Button>
                )}
              </div>
              <Button
                type="submit"
                disabled={updateProductMutation.isPending}
                className="h-10 px-5 text-xs font-semibold gap-1.5 cursor-pointer shadow-md shadow-sky-500/20 bg-sky-500 hover:bg-sky-600 text-white"
              >
                <CheckCircle2 size={14} />
                <span>{updateProductMutation.isPending ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
