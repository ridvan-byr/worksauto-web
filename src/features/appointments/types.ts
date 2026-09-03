export type AppointmentStatus =
  | "PENDING"
  | "APPROVED"
  | "RESCHEDULE_REQUESTED"
  | "CANCELLED"
  | "NO_SHOW"
  | "COMPLETED"

export type CancellationReason =
  | "CUSTOMER_REQUEST" // Müşteri vazgeçti / ertelenmesini istedi
  | "PARTS_UNAVAILABLE" // Yedek parça temin edilemedi
  | "CAPACITY_FULL" // Servis lift kapasitesi yetersiz
  | "PRICE_DISAGREEMENT" // Fiyat konusunda anlaşılamadı
  | "OTHER" // Diğer gerekçe

export interface AppointmentServiceItem {
  id: string
  name: string
  durationMinutes: number
  price: number
}

export interface Appointment {
  id: string
  tenantId: string
  // Customer & Vehicle
  customerId: string
  customerName: string
  customerPhone: string
  vehicleId: string
  plate: string
  brand: string
  model: string
  // Services
  services: AppointmentServiceItem[]
  totalDurationMinutes: number
  totalEstimatedPrice: number
  // Mechanic / Staff
  assignedStaffId?: string
  assignedStaffName?: string
  // Timing
  date: string // YYYY-MM-DD
  time: string // HH:mm
  // Lifecycle
  status: AppointmentStatus
  customerNote?: string
  internalNote?: string
  cancellationReason?: CancellationReason
  cancellationNote?: string
  // Work Order Transition
  workOrderId?: string
  workOrderNumber?: string
  createdAt: string
  updatedAt: string
}
