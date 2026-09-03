import { Product, StockMovement, StockMovementType } from "./types"

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod_1",
    tenantId: "tenant_1",
    name: "Castrol Edge 5W-30 LL Motor Yağı",
    sku: "ENG-OIL-5W30",
    barcode: "8690123456789",
    category: "OILS",
    unit: "LITRE",
    shelfLocation: "Yağ Deposu A-1",
    purchasePrice: 165,
    salePrice: 245,
    currentStock: 48,
    minimumStock: 15,
    active: true,
    movements: [
      {
        id: "mov_1",
        productId: "prod_1",
        type: "PURCHASE",
        quantity: 60,
        previousStock: 0,
        nextStock: 60,
        referenceNo: "IRS-2026-104",
        note: "Castrol Ana Bayi Toplu Sevkiyatı",
        performedByName: "Servis Yöneticisi",
        createdAt: "2026-08-25T09:00:00Z",
      },
      {
        id: "mov_2",
        productId: "prod_1",
        type: "WORK_ORDER_USAGE",
        quantity: -7,
        previousStock: 60,
        nextStock: 53,
        referenceNo: "WO-2026-088",
        note: "35 EGE 01 Ford Transit Yağ Değişimi",
        performedByName: "Ahmet Usta",
        createdAt: "2026-09-03T10:30:00Z",
      },
      {
        id: "mov_3",
        productId: "prod_1",
        type: "WORK_ORDER_USAGE",
        quantity: -5,
        previousStock: 53,
        nextStock: 48,
        referenceNo: "WO-2026-042",
        note: "34 RB 1905 BMW 320i Periyodik Bakım",
        performedByName: "Ahmet Usta",
        createdAt: "2026-09-03T11:15:00Z",
      },
    ],
    createdAt: "2026-08-25T09:00:00Z",
    updatedAt: "2026-09-03T11:15:00Z",
  },
  {
    id: "prod_2",
    tenantId: "tenant_1",
    name: "Motul 8100 X-Clean 5W-40 Tam Sentetik",
    sku: "ENG-OIL-MOTUL-5W40",
    barcode: "8690987654321",
    category: "OILS",
    unit: "LITRE",
    shelfLocation: "Yağ Deposu A-2",
    purchasePrice: 195,
    salePrice: 295,
    currentStock: 6,
    minimumStock: 12, // KRİTİK SEVİYEDE
    active: true,
    movements: [
      {
        id: "mov_4",
        productId: "prod_2",
        type: "PURCHASE",
        quantity: 20,
        previousStock: 0,
        nextStock: 20,
        referenceNo: "IRS-2026-082",
        performedByName: "Servis Danışmanı",
        createdAt: "2026-08-20T10:00:00Z",
      },
      {
        id: "mov_5",
        productId: "prod_2",
        type: "WORK_ORDER_USAGE",
        quantity: -14,
        previousStock: 20,
        nextStock: 6,
        referenceNo: "WO-2026-012",
        note: "Mercedes & Audi araç servis sarfiyatı",
        performedByName: "Mustafa Usta",
        createdAt: "2026-09-02T16:00:00Z",
      },
    ],
    createdAt: "2026-08-20T10:00:00Z",
    updatedAt: "2026-09-02T16:00:00Z",
  },
  {
    id: "prod_3",
    tenantId: "tenant_1",
    name: "Mann Filter Orijinal Yağ Filtresi",
    sku: "MANN-W712/94",
    barcode: "4011558021115",
    category: "FILTERS",
    unit: "ADET",
    shelfLocation: "Raf B-1",
    purchasePrice: 140,
    salePrice: 280,
    currentStock: 18,
    minimumStock: 5,
    active: true,
    movements: [],
    createdAt: "2026-08-15T09:00:00Z",
    updatedAt: "2026-09-01T10:00:00Z",
  },
  {
    id: "prod_4",
    tenantId: "tenant_1",
    name: "Bosch Hava Filtresi - VAG Grubu",
    sku: "BOSCH-F026-AIR",
    barcode: "4047024888123",
    category: "FILTERS",
    unit: "ADET",
    shelfLocation: "Raf B-2",
    purchasePrice: 160,
    salePrice: 320,
    currentStock: 2,
    minimumStock: 6, // KRİTİK SEVİYEDE
    active: true,
    movements: [],
    createdAt: "2026-08-10T12:00:00Z",
    updatedAt: "2026-09-03T09:00:00Z",
  },
  {
    id: "prod_5",
    tenantId: "tenant_1",
    name: "Brembo Ön Fren Balata Takımı",
    sku: "BRM-P06088",
    barcode: "8020584061234",
    category: "BRAKES",
    unit: "TAKIM",
    shelfLocation: "Raf C-1 (Fren)",
    purchasePrice: 1550,
    salePrice: 2450,
    currentStock: 8,
    minimumStock: 3,
    active: true,
    movements: [],
    createdAt: "2026-08-12T14:00:00Z",
    updatedAt: "2026-09-02T11:00:00Z",
  },
  {
    id: "prod_6",
    tenantId: "tenant_1",
    name: "TRW Arka Fren Balatası",
    sku: "TRW-GDB1956",
    barcode: "3322937984561",
    category: "BRAKES",
    unit: "TAKIM",
    shelfLocation: "Raf C-2 (Fren)",
    purchasePrice: 950,
    salePrice: 1650,
    currentStock: 1,
    minimumStock: 4, // TÜKENMEK ÜZERE / KRİTİK
    active: true,
    movements: [],
    createdAt: "2026-08-18T11:00:00Z",
    updatedAt: "2026-09-03T08:30:00Z",
  },
  {
    id: "prod_7",
    tenantId: "tenant_1",
    name: "NGK Laser Iridium Buji Takımı (4 Adet)",
    sku: "NGK-ILZKR7B",
    barcode: "087295159423",
    category: "IGNITION",
    unit: "SET",
    shelfLocation: "Kutu D-12 (Ateşleme)",
    purchasePrice: 850,
    salePrice: 1400,
    currentStock: 12,
    minimumStock: 4,
    active: true,
    movements: [],
    createdAt: "2026-08-22T15:00:00Z",
    updatedAt: "2026-09-01T14:00:00Z",
  },
  {
    id: "prod_8",
    tenantId: "tenant_1",
    name: "R134a Klima Gazı (12kg Tüp Sarfiyatı)",
    sku: "GAS-R134A-12KG",
    category: "GENERAL",
    unit: "LITRE",
    shelfLocation: "Klima İstasyonu",
    purchasePrice: 380,
    salePrice: 650,
    currentStock: 5,
    minimumStock: 2,
    active: true,
    movements: [],
    createdAt: "2026-08-05T10:00:00Z",
    updatedAt: "2026-09-02T17:00:00Z",
  },
]

const INVENTORY_STORAGE_KEY = "worksauto_inventory_data"

export function getStoredProducts(): Product[] {
  if (typeof window === "undefined") return INITIAL_PRODUCTS
  try {
    const raw = localStorage.getItem(INVENTORY_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch (e) {
    // fallback
  }
  return INITIAL_PRODUCTS
}

export function saveStoredProducts(products: Product[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(products))
  } catch (e) {
    // ignore
  }
}

export function getProductById(id: string): Product | undefined {
  const products = getStoredProducts()
  return products.find((p) => p.id === id || p.sku === id)
}

export function createProduct(data: Omit<Product, "id" | "movements" | "createdAt" | "updatedAt">): Product {
  const newProduct: Product = {
    ...data,
    id: "prod_" + Date.now(),
    movements: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const current = getStoredProducts()
  const next = [newProduct, ...current]
  saveStoredProducts(next)
  return newProduct
}

export function updateProduct(id: string, data: Partial<Product>): Product {
  const current = getStoredProducts()
  const p = current.find((item) => item.id === id)
  if (!p) throw new Error("Ürün bulunamadı")

  const updated: Product = {
    ...p,
    ...data,
    updatedAt: new Date().toISOString(),
  }

  const next = current.map((item) => (item.id === id ? updated : item))
  saveStoredProducts(next)
  return updated
}

export function addStockMovement(
  productId: string,
  type: StockMovementType,
  quantityChange: number, // e.g. +10 or -3
  referenceNo?: string,
  note?: string,
  performedByName: string = "Servis Danışmanı"
): Product {
  const current = getStoredProducts()
  const p = current.find((item) => item.id === productId)
  if (!p) throw new Error("Ürün bulunamadı")

  const prev = p.currentStock
  const nextStock = Math.max(0, prev + quantityChange)

  const newMovement: StockMovement = {
    id: "mov_" + Date.now(),
    productId,
    type,
    quantity: quantityChange,
    previousStock: prev,
    nextStock,
    referenceNo,
    note,
    performedByName,
    createdAt: new Date().toISOString(),
  }

  const updated: Product = {
    ...p,
    currentStock: nextStock,
    movements: [newMovement, ...p.movements],
    updatedAt: new Date().toISOString(),
  }

  const nextList = current.map((item) => (item.id === productId ? updated : item))
  saveStoredProducts(nextList)
  return updated
}

export function getLowStockProducts(): Product[] {
  const products = getStoredProducts()
  return products.filter((p) => p.currentStock <= p.minimumStock)
}
