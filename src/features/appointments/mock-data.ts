import { Appointment, CancellationReason } from "./types"

// Helper to get today or offset dates YYYY-MM-DD
function getDayOffset(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().split("T")[0]
}

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: "app_101",
    tenantId: "tenant_1",
    customerId: "cust_1",
    customerName: "Rıdvan Bayar",
    customerPhone: "0 (532) 111 22 33",
    vehicleId: "veh_1",
    plate: "34 RB 1905",
    brand: "BMW",
    model: "320i M Sport",
    services: [
      { id: "s1", name: "Periyodik Bakım (Yağ + 4 Filtre)", durationMinutes: 60, price: 1250 },
      { id: "s2", name: "Ön Fren Balata Değişimi", durationMinutes: 45, price: 850 },
    ],
    totalDurationMinutes: 105,
    totalEstimatedPrice: 2100,
    assignedStaffId: "st_1",
    assignedStaffName: "Ahmet Usta",
    date: getDayOffset(0), // Bugün
    time: "09:30",
    status: "APPROVED",
    customerNote: "Fren pedalında hafif sürtünme sesi var, diskler de kontrol edilsin.",
    createdAt: "2026-09-01T09:00:00Z",
    updatedAt: "2026-09-02T10:00:00Z",
  },
  {
    id: "app_102",
    tenantId: "tenant_1",
    customerId: "cust_2",
    customerName: "Ahmet Yılmaz",
    customerPhone: "0 (542) 333 44 55",
    vehicleId: "veh_2",
    plate: "06 AY 2020",
    brand: "Volkswagen",
    model: "Passat 1.5 TSI",
    services: [
      { id: "s3", name: "Bilgisayarlı Arıza Tespit", durationMinutes: 30, price: 500 },
    ],
    totalDurationMinutes: 30,
    totalEstimatedPrice: 500,
    assignedStaffId: "st_2",
    assignedStaffName: "Mustafa Usta",
    date: getDayOffset(0), // Bugün
    time: "11:00",
    status: "PENDING", // Onay bekliyor
    customerNote: "Motor arıza lambası sarı yanıp sönüyor.",
    createdAt: "2026-09-03T08:00:00Z",
    updatedAt: "2026-09-03T08:00:00Z",
  },
  {
    id: "app_103",
    tenantId: "tenant_1",
    customerId: "cust_3",
    customerName: "Mustafa Kaya (Ege Lojistik)",
    customerPhone: "0 (533) 987 65 43",
    vehicleId: "veh_3_1",
    plate: "35 EGE 01",
    brand: "Ford",
    model: "Transit 350L",
    services: [
      { id: "s1", name: "Periyodik Bakım (Yağ + 4 Filtre)", durationMinutes: 60, price: 1250 },
      { id: "s4", name: "Rot-Balans & Ön Takım Kontrolü", durationMinutes: 45, price: 750 },
    ],
    totalDurationMinutes: 105,
    totalEstimatedPrice: 2000,
    assignedStaffId: "st_1",
    assignedStaffName: "Ahmet Usta",
    date: getDayOffset(0), // Bugün
    time: "14:00",
    status: "COMPLETED",
    workOrderId: "wo_104",
    workOrderNumber: "WO-2026-088",
    customerNote: "Filo aracı, mesai bitimine kadar teslim rica ediyoruz.",
    createdAt: "2026-08-30T10:00:00Z",
    updatedAt: "2026-09-03T16:00:00Z",
  },
  {
    id: "app_104",
    tenantId: "tenant_1",
    customerId: "cust_4",
    customerName: "Zeynep Kaya",
    customerPhone: "0 (555) 777 88 99",
    vehicleId: "veh_4",
    plate: "34 ZK 444",
    brand: "Mercedes-Benz",
    model: "A200 AMG",
    services: [
      { id: "s5", name: "Klima Gazı Dolumu & Kaçak Testi", durationMinutes: 40, price: 950 },
    ],
    totalDurationMinutes: 40,
    totalEstimatedPrice: 950,
    assignedStaffId: "st_2",
    assignedStaffName: "Mustafa Usta",
    date: getDayOffset(1), // Yarın
    time: "10:00",
    status: "APPROVED",
    createdAt: "2026-09-02T11:00:00Z",
    updatedAt: "2026-09-02T12:00:00Z",
  },
  {
    id: "app_105",
    tenantId: "tenant_1",
    customerId: "cust_2",
    customerName: "Ahmet Yılmaz",
    customerPhone: "0 (542) 333 44 55",
    vehicleId: "veh_2",
    plate: "06 AY 2020",
    brand: "Volkswagen",
    model: "Passat 1.5 TSI",
    services: [
      { id: "s2", name: "Ön Fren Balata Değişimi", durationMinutes: 45, price: 850 },
    ],
    totalDurationMinutes: 45,
    totalEstimatedPrice: 850,
    date: getDayOffset(-2),
    time: "15:30",
    status: "NO_SHOW", // Gelmedi
    internalNote: "Müşteri randevu saatinde gelmedi, telefona yanıt vermedi.",
    createdAt: "2026-08-29T10:00:00Z",
    updatedAt: "2026-09-01T16:00:00Z",
  },
  {
    id: "app_106",
    tenantId: "tenant_1",
    customerId: "cust_1",
    customerName: "Rıdvan Bayar",
    customerPhone: "0 (532) 111 22 33",
    vehicleId: "veh_1_2",
    plate: "34 GS 1905",
    brand: "Porsche",
    model: "Macan GTS",
    services: [
      { id: "s1", name: "Periyodik Bakım", durationMinutes: 60, price: 1500 },
    ],
    totalDurationMinutes: 60,
    totalEstimatedPrice: 1500,
    date: getDayOffset(-1),
    time: "16:00",
    status: "CANCELLED",
    cancellationReason: "CUSTOMER_REQUEST",
    cancellationNote: "Müşteri şehir dışına çıkacağı için iptal etti.",
    createdAt: "2026-08-28T12:00:00Z",
    updatedAt: "2026-09-02T09:00:00Z",
  },
]

const APPOINTMENTS_STORAGE_KEY = "worksauto_appointments_data"

export function getStoredAppointments(): Appointment[] {
  if (typeof window === "undefined") return INITIAL_APPOINTMENTS
  try {
    const raw = localStorage.getItem(APPOINTMENTS_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch (e) {
    // fallback
  }
  return INITIAL_APPOINTMENTS
}

export function saveStoredAppointments(appointments: Appointment[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments))
  } catch (e) {
    // ignore
  }
}

// Actions
export function createAppointment(data: Omit<Appointment, "id" | "createdAt" | "updatedAt">): Appointment {
  const newApp: Appointment = {
    ...data,
    id: "app_" + Date.now(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  const current = getStoredAppointments()
  const next = [newApp, ...current]
  saveStoredAppointments(next)
  return newApp
}

// Convert Appointment to Work Order
export function approveAndConvertToWorkOrder(
  appointmentId: string
): { success: boolean; workOrderNumber: string; updatedAppointment: Appointment } {
  const current = getStoredAppointments()
  const app = current.find((a) => a.id === appointmentId)
  if (!app) throw new Error("Randevu bulunamadı")

  const generatedWONumber = "WO-2026-" + Math.floor(100 + Math.random() * 900)
  const updated: Appointment = {
    ...app,
    status: "APPROVED",
    workOrderId: "wo_" + Date.now(),
    workOrderNumber: generatedWONumber,
    updatedAt: new Date().toISOString(),
  }

  const next = current.map((a) => (a.id === appointmentId ? updated : a))
  saveStoredAppointments(next)

  return { success: true, workOrderNumber: generatedWONumber, updatedAppointment: updated }
}

export function rescheduleAppointment(
  appointmentId: string,
  newDate: string,
  newTime: string
): Appointment {
  const current = getStoredAppointments()
  const app = current.find((a) => a.id === appointmentId)
  if (!app) throw new Error("Randevu bulunamadı")

  const updated: Appointment = {
    ...app,
    date: newDate,
    time: newTime,
    status: "APPROVED",
    updatedAt: new Date().toISOString(),
  }

  const next = current.map((a) => (a.id === appointmentId ? updated : a))
  saveStoredAppointments(next)
  return updated
}

export function cancelAppointment(
  appointmentId: string,
  reason: CancellationReason,
  note?: string
): Appointment {
  const current = getStoredAppointments()
  const app = current.find((a) => a.id === appointmentId)
  if (!app) throw new Error("Randevu bulunamadı")

  const updated: Appointment = {
    ...app,
    status: "CANCELLED",
    cancellationReason: reason,
    cancellationNote: note,
    updatedAt: new Date().toISOString(),
  }

  const next = current.map((a) => (a.id === appointmentId ? updated : a))
  saveStoredAppointments(next)
  return updated
}

export function markNoShow(appointmentId: string): Appointment {
  const current = getStoredAppointments()
  const app = current.find((a) => a.id === appointmentId)
  if (!app) throw new Error("Randevu bulunamadı")

  const updated: Appointment = {
    ...app,
    status: "NO_SHOW",
    updatedAt: new Date().toISOString(),
  }

  const next = current.map((a) => (a.id === appointmentId ? updated : a))
  saveStoredAppointments(next)
  return updated
}

// Check Lift Capacity for a specific date and time slot
export function getSlotBookingCount(date: string, time: string): number {
  const current = getStoredAppointments()
  return current.filter(
    (a) => a.date === date && a.time === time && a.status !== "CANCELLED" && a.status !== "NO_SHOW"
  ).length
}
