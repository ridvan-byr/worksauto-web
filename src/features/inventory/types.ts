export type ProductCategory =
  | "OILS" // Madeni Yağlar & Sıvılar
  | "FILTERS" // Filtre Grubu (Yağ, Hava, Polen, Yakıt)
  | "BRAKES" // Fren Sistemi (Balata, Disk, Hidrolik)
  | "IGNITION" // Ateşleme & Buji & Bobin
  | "SUSPENSION" // Ön Takım & Amortisör & Rot
  | "GENERAL" // Genel Sarf Malzeme & Diğer

export type StockUnit = "ADET" | "LITRE" | "TAKIM" | "SET"

export type StockMovementType =
  | "PURCHASE" // Satın alma / İrsaliye girişi (+)
  | "SALE" // Doğrudan tezgâh satışı (-)
  | "WORK_ORDER_USAGE" // İş emrinde servis kullanımı (-)
  | "MANUAL_ADJUSTMENT" // Sayım düzeltmesi / Fire (+/-)
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
  shelfLocation?: string // Depo Raf / Konum kodu (Örn: "Raf A-3", "Kutu 12")

  // Prices
  purchasePrice: number // Alış Fiyatı (TL)
  salePrice: number // Satış Fiyatı (TL)

  // Stock Levels
  currentStock: number
  minimumStock: number // Kritik Stok Eşiği

  active: boolean
  movements: StockMovement[]
  createdAt: string
  updatedAt: string
}
