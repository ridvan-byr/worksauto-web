export interface User {
  id: string
  name: string
  surname: string
  phone: string
  email: string
  role: "tenant_admin" | "technician" | "service_advisor"
}

export interface ServiceItem {
  id: string
  name: string
  durationMinutes: number
  laborPrice: number
}

export interface StaffMember {
  id: string
  name: string
  surname: string
  phone: string
  expertise: string
}

export interface Tenant {
  id: string
  name: string
  legalName?: string
  taxOffice?: string
  taxNumber?: string
  city?: string
  district?: string
  address?: string
  logo?: string
  primaryColor?: string
  slogan?: string
  // Working hours
  workingDays?: string[]
  workStartTime?: string
  workEndTime?: string
  breakStartTime?: string
  breakEndTime?: string
  // Services & Staff
  services?: ServiceItem[]
  staff?: StaffMember[]
  // Operational Settings
  appointmentSlotDuration?: 30 | 45 | 60
  autoWorkOrder?: boolean
  criticalStockThreshold?: number
  // Status
  onboardingCompleted: boolean
}

export interface AuthState {
  user: User | null
  tenant: Tenant | null
  isAuthenticated: boolean
  isLoading: boolean
}
