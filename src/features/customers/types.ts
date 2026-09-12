export type CustomerType = "INDIVIDUAL" | "CORPORATE" | "individual" | "corporate"

export interface CurrentAccountMovement {
  id?: string
  amount?: number
  type?: string
  description?: string
  createdAt?: string
}

export interface CurrentAccountInfo {
  id?: string
  balance: number
  totalDebit?: number
  totalCredit?: number
  movements?: CurrentAccountMovement[]
}

export interface Customer {
  id: string
  tenantId: string
  type: CustomerType
  name: string
  surname: string
  isLead?: boolean
  firstName?: string
  lastName?: string
  companyTitle?: string
  taxOffice?: string
  taxNumber?: string
  phone: string
  email?: string
  city?: string
  district?: string
  address?: string
  notes?: string
  balance: number
  currentAccount?: CurrentAccountInfo
  vehicles: Vehicle[]
  appointments: AppointmentSummary[]
  workOrders: WorkOrderSummary[]
  invoices: InvoiceSummary[]
  movements: CariMovement[]
  createdAt: string
  updatedAt: string
}

export interface Vehicle {
  id: string
  tenantId: string
  customerId: string
  plate: string
  brand: string
  model: string
  year?: number
  kilometer: number
  currentKm?: number
  mileage?: number
  vin?: string // Şasi No
  fuelType?: "Benzin" | "Dizel" | "LPG" | "Hibrit" | "Elektrik" | string
  transmission?: "Manuel" | "Otomatik" | string
  color?: string
  engineNo?: string
  notes?: string
  inspectionValidUntil?: string | null
  insuranceValidUntil?: string | null
  lastServiceDate?: string
  createdAt?: string
  updatedAt?: string
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


