export type UserRole =
  | "OWNER"
  | "SERVICE_MANAGER"
  | "TECHNICIAN"
  | "CASHIER"
  | "WAREHOUSE_KEEPER"
  | "tenant_admin"
  | "technician"
  | "service_advisor"

export interface User {
  id: string
  name: string
  surname: string
  phone: string
  email?: string
  role: UserRole
  annualLeaveDays?: number
  transferredLeaveDays?: number
  leaveBalance?: {
    annualDays: number
    transferredDays: number
    totalDays: number
    usedDays: number
    remainingDays: number
  }
  todayLeave?: {
    id: string
    leaveType: string
    startDate: string
    endDate: string
    totalDays: number
  } | null
  mechanic?: {
    id?: string
    specialty?: string | null
    assignedLift?: string | null
    dailyCapacityHours?: number
  } | null
}

export interface ServiceItem {
  id: string
  name: string
  category?: string
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
  title?: string
  legalName?: string
  taxOffice?: string
  taxNumber?: string
  city?: string
  district?: string
  address?: string
  phone?: string
  email?: string
  logo?: string
  logoUrl?: string
  logoWidth?: number | null
  logoHeight?: number | null
  googleReviewUrl?: string
  bankName?: string
  iban?: string
  accountHolder?: string
  paytrMerchantId?: string
  paytrMerchantKey?: string
  paytrMerchantSalt?: string
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
  appointmentSlotDuration?: number
  activeLiftCount?: number
  autoWorkOrder?: boolean
  notifyAppointmentReminder?: boolean
  notifyReadyForPickup?: boolean
  criticalStockThreshold?: number
  // Status
  onboardingCompleted: boolean
  b2bConsentAccepted?: boolean
  b2bConsentAcceptedAt?: string | null
  b2bContractVersion?: string
}

export interface AuthState {
  user: User | null
  tenant: Tenant | null
  isAuthenticated: boolean
  isLoading: boolean
}
