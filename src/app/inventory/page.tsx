"use client"

import { useProducts, useCreateProduct, useStockMovement, type ProductRecord } from "@/features/inventory/api/use-inventory"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  Package,
  AlertTriangle,
  Plus,
  Coins,
  TrendingUp,
  Boxes,
  ListFilter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Product, StockMovementType, ProductCategory } from "@/features/inventory/types"
import { ProductTable } from "@/features/inventory/components/product-table"
import { CreateProductModal } from "@/features/inventory/components/create-product-modal"
import { StockMovementModal } from "@/features/inventory/components/stock-movement-modal"
import { MovementHistoryModal } from "@/features/inventory/components/movement-history-modal"
import { ShelfMatrixView } from "@/features/inventory/components/shelf-matrix-view"

function InventoryPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get("tab")

  const [activeTab, setActiveTab] = React.useState<"LIST" | "SHELVES">(() => {
    if (tabParam === "shelves") return "SHELVES"
    if (tabParam === "list") return "LIST"
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("worksauto_inventory_tab")
      if (saved === "SHELVES") return "SHELVES"
    }
    return "LIST"
  })
  const [products, setProducts] = React.useState<Product[]>([])

  // Tab Kalıcılığı ve URL Senkronizasyonu
  React.useEffect(() => {
    if (tabParam === "shelves") {
      setActiveTab("SHELVES")
      localStorage.setItem("worksauto_inventory_tab", "SHELVES")
    } else if (tabParam === "list") {
      setActiveTab("LIST")
      localStorage.setItem("worksauto_inventory_tab", "LIST")
    } else {
      const saved = localStorage.getItem("worksauto_inventory_tab")
      if (saved === "SHELVES") {
        setActiveTab("SHELVES")
        router.replace("/inventory?tab=shelves")
      } else {
        setActiveTab("LIST")
      }
    }
  }, [tabParam, router])

  const handleTabChange = (tab: "LIST" | "SHELVES") => {
    setActiveTab(tab)
    if (typeof window !== "undefined") {
      localStorage.setItem("worksauto_inventory_tab", tab)
      window.dispatchEvent(new Event("storage"))
    }
    if (tab === "SHELVES") {
      router.replace("/inventory?tab=shelves")
    } else {
      router.replace("/inventory?tab=list")
    }
  }

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [targetCellForNewProduct, setTargetCellForNewProduct] = React.useState<{
    shelfId?: string
    cellId?: string
    cellCode?: string
    shelfLocation?: string
  } | null>(null)

  const handleOpenCreateForCell = (cell: any, shelf: any) => {
    setTargetCellForNewProduct({
      shelfId: shelf?.id,
      cellId: cell.id,
      cellCode: cell.cellCode,
      shelfLocation: `${shelf?.name || shelf?.code || 'Depo'} (Kat ${cell.rowNumber}, Göz ${cell.colNumber})`,
    })
    setIsCreateModalOpen(true)
  }

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
      const mapped: Product[] = apiProducts.map((p: ProductRecord) => ({
        id: p.id,
        tenantId: 'ten_1',
        name: p.name,
        sku: p.oemCode || p.code || p.id.substring(0, 8),
        barcode: p.barcode || '',
        category: (p.category || "GENERAL") as ProductCategory,
        unit: 'ADET',
        shelfLocation: p.shelfLocation || 'Depo',
        shelfCellId: p.shelfCellId,
        aisle: p.aisle,
        rack: p.rack,
        tier: p.tier,
        bin: p.bin,
        purchasePrice: Number(p.purchasePrice || 0),
        salePrice: Number(p.salePrice || 0),
        currentStock: Number(p.stockQuantity || 0),
        minimumStock: Number(p.minStockLevel ?? 5),
        active: true,
        movements: [],
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
        shelfCellId: newProd.shelfCellId,
        aisle: newProd.aisle,
        rack: newProd.rack,
        tier: newProd.tier,
        bin: newProd.bin,
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
    type: StockMovementType,
    quantity: number,
    note?: string
  ) => {
    try {
      await stockMovementMutation.mutateAsync({
        productId,
        data: {
          type: type === "IN_PURCHASE" ? "IN" : type === "OUT_WORK_ORDER" ? "OUT" : "ADJUSTMENT",
          movementType: type === "IN_PURCHASE" ? "IN" : type === "OUT_WORK_ORDER" ? "OUT" : "ADJUSTMENT",
          quantity,
          note,
        },
      })
    } catch (e) {
      console.warn('Movement API fallback:', e)
    }

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p
        const diff = type === "IN_PURCHASE" ? quantity : -quantity
        const nextStock = Math.max(0, p.currentStock + diff)
        return {
          ...p,
          currentStock: nextStock,
          movements: [
            {
              id: "mov_" + Date.now(),
              productId: p.id,
              type,
              quantity: diff,
              previousStock: p.currentStock,
              nextStock,
              note: note || (type === "IN_PURCHASE" ? "Mal Kabul Girişi" : "Depo Çıkışı"),
              performedByName: "Servis Yöneticisi",
              createdAt: new Date().toISOString(),
            },
            ...p.movements,
          ],
        }
      })
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
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
          onClick={() => {
            setTargetCellForNewProduct(null)
            setIsCreateModalOpen(true)
          }}
          className="h-11 px-5 rounded-2xl gap-2 font-semibold text-xs shadow-lg shadow-sky-500/20 cursor-pointer self-start sm:self-auto bg-sky-500 hover:bg-sky-600 text-white"
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
            <p className="text-2xl font-bold text-emerald-600 dark:emerald-400 font-mono">
              {totalPotentialRevenue.toLocaleString("tr-TR")} ₺
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* Görünüm Sekmeleri (Tab Bar) */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 w-fit">
        <button
          type="button"
          onClick={() => handleTabChange("LIST")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "LIST"
              ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <ListFilter size={15} />
          <span>Yedek Parça Listesi</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("SHELVES")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "SHELVES"
              ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Boxes size={15} />
          <span>Depo & Raf Matrisi (WMS)</span>
        </button>
      </div>

      {/* Main Content: Tab'a Göre Render */}
      {activeTab === "LIST" ? (
        <ProductTable
          products={products}
          onOpenMovement={handleOpenMovement}
          onOpenHistory={handleOpenHistory}
        />
      ) : (
        <ShelfMatrixView
          products={products}
          onCreateProductForCell={handleOpenCreateForCell}
        />
      )}

      {/* Create Product Modal */}
      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setTargetCellForNewProduct(null)
        }}
        onCreated={handleCreatedProduct}
        initialShelfId={targetCellForNewProduct?.shelfId}
        initialCellId={targetCellForNewProduct?.cellId}
        initialCellCode={targetCellForNewProduct?.cellCode}
        initialShelfLocation={targetCellForNewProduct?.shelfLocation}
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

export default function InventoryPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px] text-sm text-slate-500">
          Envanter yükleniyor...
        </div>
      }
    >
      <InventoryPageContent />
    </React.Suspense>
  )
}