export type ProductCategory =
  | "OILS" // Madeni Yağlar & Sıvılar
  | "FILTERS" // Filtre Grubu (Yağ, Hava, Polen, Yakıt)
  | "BRAKES" // Fren Sistemi (Balata, Disk, Hidrolik)
  | "IGNITION" // Ateşleme & Buji & Bobin
  | "SUSPENSION" // Ön Takım & Amortisör & Rot
  | "GENERAL" // Genel Sarf Malzeme & Diğer

export type StockUnit = "ADET" | "LITRE" | "TAKIM" | "SET"

export type StockMovementType =
  | "IN_PURCHASE" // Satın alma / İrsaliye girişi (+)
  | "OUT_WORK_ORDER" // İş emrinde servis kullanımı / Sarfiyat (-)
  | "ADJUSTMENT" // Sayım düzeltmesi (+/-)
  | "RETURN" // İade / Müşteri iadesi (+)

export interface StockMovement {
  id: string
  productId: string
  type: StockMovementType
  quantity: number // e.g. +5 or -2
  previousStock: number
  nextStock: number
  referenceNo?: string // e.g. "IRS-2026-941" or "WO-2026-088"
  note?: string
  performedByName: string
  createdAt: string
}

export interface Product {
  id: string
  tenantId: string
  name: string
  sku: string // OEM / Parça Kodu (Örn: "ENG-OIL-5W30", "MANN-W712")
  barcode?: string
  category: ProductCategory
  unit: StockUnit
  shelfLocation?: string // Depo Raf / Konum kodu (Örn: "RAF-A01-K1-G2")

  // WMS Fields
  aisle?: string
  rack?: string
  tier?: string
  bin?: string
  shelfCellId?: string

  // Prices
  purchasePrice: number // Alış Fiyatı (TL)
  salePrice: number // Satış Fiyatı (TL)

  // Stock Levels
  currentStock: number
  minimumStock: number // Kritik Stok Eşiği

  active: boolean
  movements: StockMovement[]
  createdAt?: string
  updatedAt?: string
}

export interface ShelfCell {
  id: string
  shelfId: string
  cellCode: string
  rowNumber: number
  colNumber: number
  barcode?: string
  maxCapacity?: number
  products?: Array<{
    id: string
    name: string
    oemCode: string
    brand: string
    category: string
    stockQuantity: number
    minStockLevel: number
    salePrice: number
    shelfLocation?: string
  }>
}

export interface WarehouseShelf {
  id: string
  name: string
  code: string
  zone?: string | null
  rows: number
  columns: number
  description?: string | null
  createdAt?: string
  totalCells: number
  occupiedCells: number
  totalProducts: number
  occupancyRate: number
  cells?: ShelfCell[]
}

