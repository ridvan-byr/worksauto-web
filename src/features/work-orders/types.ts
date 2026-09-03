export type WorkOrderStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"

export type WorkOrderPriority = "NORMAL" | "HIGH" | "URGENT"

export interface WorkOrderService {
  id: string
  name: string
  durationMinutes: number
  laborPrice: number
  mechanicName?: string
  completed: boolean
}

export interface WorkOrderPart {
  id: string
  name: string
  partNumber: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface WorkOrderNote {
  id: string
  authorName: string
  text: string
  createdAt: string
  isInternal: boolean // Müşteriye gösterilmez (Spec Bölüm 19)
}

export interface WorkOrderPhoto {
  id: string
  url: string
  caption: string
  uploadedAt: string
  uploaderName: string
  type: "CHECKIN" | "DAMAGE" | "COMPLETED"
}

export interface WorkOrder {
  id: string
  workOrderNumber: string // e.g. "WO-2026-088"
  tenantId: string
  appointmentId?: string

  // Customer & Vehicle
  customerId: string
  customerName: string
  customerPhone: string
  vehicleId: string
  plate: string
  brand: string
  model: string
  year: number
  kilometer: number
  vin?: string

  // Status & Assignment
  status: WorkOrderStatus
  priority: WorkOrderPriority
  assignedLift: string // e.g. "Lift 1 (Mekanik)"
  assignedMechanicName: string

  // Operations
  services: WorkOrderService[]
  parts: WorkOrderPart[]
  notes: WorkOrderNote[]
  photos: WorkOrderPhoto[]

  // Financial Totals
  laborTotal: number
  partsTotal: number
  taxRate: number // default 0.20 (%20 KDV)
  grandTotal: number

  // Timestamps
  estimatedCompletionTime: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}
