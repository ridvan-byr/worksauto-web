export type CustomerType = "individual" | "corporate"

export interface Vehicle {
  id: string
  tenantId: string
  customerId: string
  plate: string
  brand: string
  model: string
  year?: number
  kilometer: number
  vin?: string // Şasi No
  fuelType?: "Benzin" | "Dizel" | "LPG" | "Hibrit" | "Elektrik"
  transmission?: "Manuel" | "Otomatik"
  color?: string
  notes?: string
  lastServiceDate?: string
}

export interface AppointmentSummary {
  id: string
  date: string
  time: string
  serviceName: string
  plate: string
  status: "CONFIRMED" | "COMPLETED" | "CANCELLED" | "PENDING"
  technicianName: string
}

export interface WorkOrderSummary {
  id: string
  orderNumber: string
  plate: string
  date: string
  status: "OPEN" | "IN_PROGRESS" | "WAITING_PARTS" | "COMPLETED"
  totalAmount: number
  kilometers: number
  itemsSummary: string
  technician: string
}

export interface InvoiceSummary {
  id: string
  invoiceNumber: string
  date: string
  dueDate: string
  plate: string
  totalAmount: number
  paidAmount: number
  status: "PAID" | "PARTIAL" | "UNPAID"
}

export interface CariMovement {
  id: string
  date: string
  type: "DEBIT" | "CREDIT" // Borç / Alacak
  amount: number
  balanceAfter: number
  description: string
  documentNo?: string
}

export interface Customer {
  id: string
  tenantId: string
  type: CustomerType
  name: string
  surname: string
  companyTitle?: string
  taxOffice?: string
  taxNumber?: string
  phone: string
  email?: string
  city?: string
  district?: string
  address?: string
  notes?: string
  balance: number // Pozitif: Müşterinin servise borcu var, Negatif: Alacaklı
  vehicles: Vehicle[]
  appointments: AppointmentSummary[]
  workOrders: WorkOrderSummary[]
  invoices: InvoiceSummary[]
  movements: CariMovement[]
  createdAt: string
  updatedAt: string
}
