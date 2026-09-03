export type InvoiceStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID"

export type PaymentMethod = "CASH" | "POS" | "BANK_TRANSFER" | "OTHER"

export interface InvoiceItem {
  id: string
  type: "SERVICE" | "PART"
  name: string
  code?: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface Payment {
  id: string
  invoiceId?: string
  customerId: string
  amount: number
  method: PaymentMethod
  referenceNo?: string // e.g. "POS Slip No" or "Dekont"
  note?: string
  performedByName: string
  createdAt: string
}

export interface Invoice {
  id: string
  invoiceNumber: string // e.g. "INV-2026-088"
  workOrderId?: string
  workOrderNumber?: string
  tenantId: string

  // Customer & Vehicle info
  customerId: string
  customerName: string
  customerPhone: string
  customerType: "individual" | "corporate"
  companyTitle?: string
  taxOffice?: string
  taxNumber?: string

  vehiclePlate: string
  vehicleBrand: string
  vehicleModel: string
  vehicleYear: number
  vehicleKm: number
  vehicleVin?: string

  // Financials
  items: InvoiceItem[]
  subtotal: number // KDV Hariç
  taxAmount: number // %20 KDV
  grandTotal: number // Genel Toplam
  paidAmount: number // Şu ana kadar ödenen
  remainingAmount: number // Kalan Borç
  status: InvoiceStatus

  payments: Payment[]
  issueDate: string // YYYY-MM-DD
  dueDate: string // Vade Tarihi
  createdAt: string
  updatedAt: string
}

export interface CariMovementItem {
  id: string
  customerId: string
  date: string
  type: "INVOICE" | "PAYMENT" | "MANUAL_COLLECTION"
  description: string
  referenceNo?: string
  debit: number // Borç (+)
  credit: number // Alacak / Ödeme (-)
  balanceAfter: number // İşlem sonrası bakiye
}

export interface CurrentAccount {
  customerId: string
  customerName: string
  customerPhone: string
  customerType: "individual" | "corporate"
  companyTitle?: string
  totalDebits: number // Toplam Borç
  totalCredits: number // Toplam Ödenen
  balance: number // Kalan Açık Bakiye
  creditLimit: number // Tanımlı Borç Limiti
  movements: CariMovementItem[]
}
