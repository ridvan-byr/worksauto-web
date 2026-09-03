import { WorkOrder, WorkOrderStatus, WorkOrderService, WorkOrderPart, WorkOrderNote, WorkOrderPhoto } from "./types"

export const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: "wo_101",
    workOrderNumber: "WO-2026-088",
    tenantId: "tenant_1",
    appointmentId: "app_103",
    customerId: "cust_3",
    customerName: "Ege Lojistik A.Ş. (Mustafa Kaya)",
    customerPhone: "0 (533) 987 65 43",
    vehicleId: "veh_3_1",
    plate: "35 EGE 01",
    brand: "Ford",
    model: "Transit 350L",
    year: 2022,
    kilometer: 118400,
    vin: "WF0XXXTTFXP12345",
    status: "IN_PROGRESS",
    priority: "HIGH",
    assignedLift: "Lift 1 (Ağır Ticari)",
    assignedMechanicName: "Ahmet Usta",
    services: [
      { id: "s1", name: "Periyodik Bakım İşçiliği", durationMinutes: 60, laborPrice: 1250, completed: true },
      { id: "s2", name: "Rot-Balans & Ön Takım Ayarı", durationMinutes: 45, laborPrice: 750, completed: false },
    ],
    parts: [
      { id: "p1", name: "5W-30 Motor Yağı (7 Litre)", partNumber: "ENG-OIL-5W30", quantity: 7, unitPrice: 220, totalPrice: 1540 },
      { id: "p2", name: "Yağ Filtresi - Ford Orijinal", partNumber: "FLT-OIL-FD", quantity: 1, unitPrice: 280, totalPrice: 280 },
      { id: "p3", name: "Hava Filtresi", partNumber: "FLT-AIR-FD", quantity: 1, unitPrice: 320, totalPrice: 320 },
    ],
    notes: [
      {
        id: "n1",
        authorName: "Ahmet Usta",
        text: "Sol rot kolunda hafif boşluk tespit edildi, müşteri aranıp bilgi verildi, değişim onaylandı.",
        createdAt: "2026-09-03T11:20:00Z",
        isInternal: true,
      },
    ],
    photos: [
      {
        id: "ph1",
        url: "/assets/brand/preview.html", // mockup reference
        caption: "Araç kabul ön tampon ve kilometre göstergesi",
        uploadedAt: "2026-09-03T09:15:00Z",
        uploaderName: "Servis Danışmanı",
        type: "CHECKIN",
      },
    ],
    laborTotal: 2000,
    partsTotal: 2140,
    taxRate: 0.20,
    grandTotal: 4968, // (2000 + 2140) * 1.20
    estimatedCompletionTime: "Bugün, 16:30",
    createdAt: "2026-09-03T09:00:00Z",
    updatedAt: "2026-09-03T11:30:00Z",
  },
  {
    id: "wo_102",
    workOrderNumber: "WO-2026-042",
    tenantId: "tenant_1",
    appointmentId: "app_101",
    customerId: "cust_1",
    customerName: "Rıdvan Bayar",
    customerPhone: "0 (532) 111 22 33",
    vehicleId: "veh_1",
    plate: "34 RB 1905",
    brand: "BMW",
    model: "320i M Sport",
    year: 2023,
    kilometer: 45000,
    vin: "WBA33AY08P190500",
    status: "PENDING",
    priority: "NORMAL",
    assignedLift: "Lift 2 (Binek)",
    assignedMechanicName: "Ahmet Usta",
    services: [
      { id: "s1", name: "Periyodik Bakım (Yağ + 4 Filtre)", durationMinutes: 60, laborPrice: 1250, completed: false },
      { id: "s2", name: "Ön Fren Balata Değişimi", durationMinutes: 45, laborPrice: 850, completed: false },
    ],
    parts: [
      { id: "p4", name: "Brembo Ön Balata Takımı", partNumber: "BRM-P06088", quantity: 1, unitPrice: 2450, totalPrice: 2450 },
    ],
    notes: [
      {
        id: "n2",
        authorName: "Servis Danışmanı",
        text: "Müşteri öğleden önce teslim rica etti.",
        createdAt: "2026-09-03T09:30:00Z",
        isInternal: true,
      },
    ],
    photos: [],
    laborTotal: 2100,
    partsTotal: 2450,
    taxRate: 0.20,
    grandTotal: 5460,
    estimatedCompletionTime: "Bugün, 14:00",
    createdAt: "2026-09-03T09:30:00Z",
    updatedAt: "2026-09-03T09:30:00Z",
  },
  {
    id: "wo_103",
    workOrderNumber: "WO-2026-015",
    tenantId: "tenant_1",
    customerId: "cust_2",
    customerName: "Ahmet Yılmaz",
    customerPhone: "0 (542) 333 44 55",
    vehicleId: "veh_2",
    plate: "06 AY 2020",
    brand: "Volkswagen",
    model: "Passat 1.5 TSI",
    year: 2020,
    kilometer: 74200,
    status: "IN_PROGRESS",
    priority: "NORMAL",
    assignedLift: "Lift 3 (Elektronik & Teşhis)",
    assignedMechanicName: "Mustafa Usta",
    services: [
      { id: "s3", name: "Bilgisayarlı Arıza Tespit & Diagnostik", durationMinutes: 30, laborPrice: 500, completed: true },
      { id: "s4", name: "Buji Takımı Değişimi", durationMinutes: 30, laborPrice: 600, completed: false },
    ],
    parts: [
      { id: "p5", name: "NGK İridyum Buji (4 Adet)", partNumber: "NGK-ILZKR7B", quantity: 4, unitPrice: 350, totalPrice: 1400 },
    ],
    notes: [
      {
        id: "n3",
        authorName: "Mustafa Usta",
        text: "3. silindir ateşleme bobini soketinde temassızlık var, temizlenip test edildi.",
        createdAt: "2026-09-03T11:45:00Z",
        isInternal: true,
      },
    ],
    photos: [],
    laborTotal: 1100,
    partsTotal: 1400,
    taxRate: 0.20,
    grandTotal: 3000,
    estimatedCompletionTime: "Bugün, 15:00",
    createdAt: "2026-09-03T11:00:00Z",
    updatedAt: "2026-09-03T11:50:00Z",
  },
  {
    id: "wo_104",
    workOrderNumber: "WO-2026-021",
    tenantId: "tenant_1",
    customerId: "cust_4",
    customerName: "Zeynep Kaya",
    customerPhone: "0 (555) 777 88 99",
    vehicleId: "veh_4",
    plate: "34 ZK 444",
    brand: "Mercedes-Benz",
    model: "A200 AMG",
    year: 2021,
    kilometer: 52000,
    status: "COMPLETED",
    priority: "NORMAL",
    assignedLift: "Mekanik Alan",
    assignedMechanicName: "Mustafa Usta",
    services: [
      { id: "s5", name: "Klima Gazı Dolumu & Kaçak Testi", durationMinutes: 40, laborPrice: 950, completed: true },
    ],
    parts: [
      { id: "p6", name: "R134a Klima Gazı (500gr)", partNumber: "GAS-R134A", quantity: 1, unitPrice: 650, totalPrice: 650 },
    ],
    notes: [
      {
        id: "n4",
        authorName: "Mustafa Usta",
        text: "Klima gazı basıldı, kaçak testi başarılı. İç soğutma 6 dereceye düştü.",
        createdAt: "2026-09-03T10:40:00Z",
        isInternal: true,
      },
    ],
    photos: [],
    laborTotal: 950,
    partsTotal: 650,
    taxRate: 0.20,
    grandTotal: 1920,
    estimatedCompletionTime: "Tamamlandı",
    createdAt: "2026-09-03T10:00:00Z",
    updatedAt: "2026-09-03T11:15:00Z",
    completedAt: "2026-09-03T11:15:00Z",
  },
]

const WORK_ORDERS_STORAGE_KEY = "worksauto_work_orders_data"

export function getStoredWorkOrders(): WorkOrder[] {
  if (typeof window === "undefined") return INITIAL_WORK_ORDERS
  try {
    const raw = localStorage.getItem(WORK_ORDERS_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch (e) {
    // fallback
  }
  return INITIAL_WORK_ORDERS
}

export function saveStoredWorkOrders(orders: WorkOrder[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(WORK_ORDERS_STORAGE_KEY, JSON.stringify(orders))
  } catch (e) {
    // ignore
  }
}

export function getWorkOrderById(id: string): WorkOrder | undefined {
  const orders = getStoredWorkOrders()
  return orders.find((o) => o.id === id || o.workOrderNumber === id)
}

export function updateWorkOrderStatus(id: string, status: WorkOrderStatus): WorkOrder {
  const orders = getStoredWorkOrders()
  const wo = orders.find((o) => o.id === id)
  if (!wo) throw new Error("İş emri bulunamadı")

  const updated: WorkOrder = {
    ...wo,
    status,
    updatedAt: new Date().toISOString(),
    completedAt: status === "COMPLETED" ? new Date().toISOString() : wo.completedAt,
  }

  const next = orders.map((o) => (o.id === id ? updated : o))
  saveStoredWorkOrders(next)
  return updated
}

export function addServiceToWorkOrder(id: string, service: Omit<WorkOrderService, "id">): WorkOrder {
  const orders = getStoredWorkOrders()
  const wo = orders.find((o) => o.id === id)
  if (!wo) throw new Error("İş emri bulunamadı")

  const newService: WorkOrderService = {
    ...service,
    id: "srv_" + Date.now(),
  }

  const newServices = [...wo.services, newService]
  const newLaborTotal = newServices.reduce((sum, s) => sum + s.laborPrice, 0)
  const newGrandTotal = Math.round((newLaborTotal + wo.partsTotal) * (1 + wo.taxRate))

  const updated: WorkOrder = {
    ...wo,
    services: newServices,
    laborTotal: newLaborTotal,
    grandTotal: newGrandTotal,
    updatedAt: new Date().toISOString(),
  }

  const next = orders.map((o) => (o.id === id ? updated : o))
  saveStoredWorkOrders(next)
  return updated
}

export function addPartToWorkOrder(id: string, part: Omit<WorkOrderPart, "id" | "totalPrice">): WorkOrder {
  const orders = getStoredWorkOrders()
  const wo = orders.find((o) => o.id === id)
  if (!wo) throw new Error("İş emri bulunamadı")

  const totalPrice = part.quantity * part.unitPrice
  const newPart: WorkOrderPart = {
    ...part,
    id: "prt_" + Date.now(),
    totalPrice,
  }

  const newParts = [...wo.parts, newPart]
  const newPartsTotal = newParts.reduce((sum, p) => sum + p.totalPrice, 0)
  const newGrandTotal = Math.round((wo.laborTotal + newPartsTotal) * (1 + wo.taxRate))

  const updated: WorkOrder = {
    ...wo,
    parts: newParts,
    partsTotal: newPartsTotal,
    grandTotal: newGrandTotal,
    updatedAt: new Date().toISOString(),
  }

  const next = orders.map((o) => (o.id === id ? updated : o))
  saveStoredWorkOrders(next)
  return updated
}

export function addNoteToWorkOrder(id: string, text: string, authorName: string): WorkOrder {
  const orders = getStoredWorkOrders()
  const wo = orders.find((o) => o.id === id)
  if (!wo) throw new Error("İş emri bulunamadı")

  const newNote: WorkOrderNote = {
    id: "nt_" + Date.now(),
    authorName,
    text: text.trim(),
    createdAt: new Date().toISOString(),
    isInternal: true,
  }

  const updated: WorkOrder = {
    ...wo,
    notes: [newNote, ...wo.notes],
    updatedAt: new Date().toISOString(),
  }

  const next = orders.map((o) => (o.id === id ? updated : o))
  saveStoredWorkOrders(next)
  return updated
}

export function addPhotoToWorkOrder(id: string, photo: Omit<WorkOrderPhoto, "id" | "uploadedAt">): WorkOrder {
  const orders = getStoredWorkOrders()
  const wo = orders.find((o) => o.id === id)
  if (!wo) throw new Error("İş emri bulunamadı")

  const newPhoto: WorkOrderPhoto = {
    ...photo,
    id: "ph_" + Date.now(),
    uploadedAt: new Date().toISOString(),
  }

  const updated: WorkOrder = {
    ...wo,
    photos: [newPhoto, ...wo.photos],
    updatedAt: new Date().toISOString(),
  }

  const next = orders.map((o) => (o.id === id ? updated : o))
  saveStoredWorkOrders(next)
  return updated
}

export function createQuickWorkOrder(
  data: Omit<WorkOrder, "id" | "workOrderNumber" | "createdAt" | "updatedAt">
): WorkOrder {
  const newNumber = "WO-2026-" + Math.floor(100 + Math.random() * 900)
  const newOrder: WorkOrder = {
    ...data,
    id: "wo_" + Date.now(),
    workOrderNumber: newNumber,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const current = getStoredWorkOrders()
  const next = [newOrder, ...current]
  saveStoredWorkOrders(next)
  return newOrder
}
