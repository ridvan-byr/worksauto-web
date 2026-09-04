"use client"

import { useProducts, useCreateProduct, useStockMovement } from "@/features/inventory/api/use-inventory"

import * as React from "react"
import {
  Package,
  AlertTriangle,
  Plus,
  Coins,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Product, StockMovementType } from "@/features/inventory/types"
import { ProductTable } from "@/features/inventory/components/product-table"
import { CreateProductModal } from "@/features/inventory/components/create-product-modal"
import { StockMovementModal } from "@/features/inventory/components/stock-movement-modal"
import { MovementHistoryModal } from "@/features/inventory/components/movement-history-modal"

export default function InventoryPage() {
  const [products, setProducts] = React.useState<Product[]>([])
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [movementModalState, setMovementModalState] = React.useState<{
    isOpen: boolean
    product: Product | null
    direction: "IN" | "OUT"
  }>({ isOpen: false, product: null, direction: "IN" })

  const [historyModalState, setHistoryModalState] = React.useState<{
    isOpen: boolean
    product: Product | null
  }>({ isOpen: false, product: null })

  const { data: apiProducts } = useProducts()
  const createProductMutation = useCreateProduct()
  const stockMovementMutation = useStockMovement()

  // Pure live API sync (100% PostgreSQL)
  React.useEffect(() => {
    if (apiProducts) {
      const mapped: Product[] = apiProducts.map((p: any) => ({
        id: p.id,
        tenantId: p.tenantId || 'ten_1',
        name: p.name,
        sku: p.oemCode || p.oemNumber || p.id.substring(0, 8),
        barcode: p.barcode || '',
        category: p.category as any,
        unit: 'ADET',
        shelfLocation: p.shelfLocation || 'Depo',
        purchasePrice: Number(p.purchasePrice || 0),
        salePrice: Number(p.salePrice || 0),
        currentStock: Number(p.stockQuantity || 0),
        minimumStock: Number(p.minStockLevel ?? p.minStockThreshold ?? 5),
        active: true,
        movements: [],
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }))
      setProducts(mapped)
    }
  }, [apiProducts])

  // KPI Calculations
  const lowStockCount = products.filter((p) => p.currentStock <= p.minimumStock).length
  const totalInventoryCost = products.reduce((sum, p) => sum + p.purchasePrice * p.currentStock, 0)
  const totalPotentialRevenue = products.reduce((sum, p) => sum + p.salePrice * p.currentStock, 0)
  const totalItemsCount = products.reduce((sum, p) => sum + p.currentStock, 0)

  // Handlers
  const handleCreatedProduct = async (newProd: Product) => {
    try {
      await createProductMutation.mutateAsync({
        name: newProd.name,
        oemCode: newProd.sku,
        barcode: newProd.barcode,
        category: newProd.category.toUpperCase(),
        brand: "Genel",
        purchasePrice: newProd.purchasePrice,
        salePrice: newProd.salePrice,
        kdvRate: 20,
        stockQuantity: newProd.currentStock,
        minStockLevel: newProd.minimumStock,
        shelfLocation: newProd.shelfLocation,
      })
    } catch (e) {
      console.warn('API sync fallback:', e)
    }
    setProducts((prev) => [newProd, ...prev])
  }

  const handleOpenMovement = (product: Product, direction: "IN" | "OUT") => {
    setMovementModalState({ isOpen: true, product, direction })
  }

  const handleOpenHistory = (product: Product) => {
    setHistoryModalState({ isOpen: true, product })
  }

  const handleApplyMovement = async (
    productId: string,
    movementType: StockMovementType,
    qty: number,
    ref?: string,
    note?: string
  ) => {
    try {
      const updated: any = await stockMovementMutation.mutateAsync({
        productId,
        data: {
          movementType,
          quantity: qty,
          referenceId: ref,
          note,
        },
      })
      if (updated?.stockQuantity !== undefined) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, currentStock: updated.stockQuantity } : p))
        )
      }
    } catch (e) {
      console.error('API movement error:', e)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Yedek Parça & Stok Envanteri
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              {products.length} Kalem Parça
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Madeni yağ, filtre, fren balatası stokları, depo raf konumları ve kritik seviye alarmları.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="h-11 px-5 rounded-2xl gap-2 font-semibold text-xs shadow-lg shadow-sky-500/20 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Yeni Parça Kartı Oluştur</span>
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Kritik Stok Uyarısı</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{lowStockCount} Ürün</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Toplam Fiziksel Stok</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalItemsCount} Birim</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Package size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Envanter Maliyet Değeri</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
              {totalInventoryCost.toLocaleString("tr-TR")} ₺
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Coins size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Potansiyel Satış Cirosu</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {totalPotentialRevenue.toLocaleString("tr-TR")} ₺
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <ProductTable
        products={products}
        onOpenMovement={handleOpenMovement}
        onOpenHistory={handleOpenHistory}
      />

      {/* Create Product Modal */}
      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleCreatedProduct}
      />

      {/* Stock Movement Modal */}
      <StockMovementModal
        isOpen={movementModalState.isOpen}
        product={movementModalState.product}
        initialType={movementModalState.direction}
        onClose={() => setMovementModalState({ isOpen: false, product: null, direction: "IN" })}
        onSuccess={handleApplyMovement}
      />

      {/* Movement History Modal */}
      <MovementHistoryModal
        isOpen={historyModalState.isOpen}
        product={historyModalState.product}
        onClose={() => setHistoryModalState({ isOpen: false, product: null })}
      />
    </div>
  )
}