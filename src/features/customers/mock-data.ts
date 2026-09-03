import { Customer, Vehicle } from "./types"

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust_1",
    tenantId: "tenant_1",
    type: "individual",
    name: "Rıdvan",
    surname: "Bayar",
    phone: "0 (532) 111 22 33",
    email: "ridvan@example.com",
    city: "İstanbul",
    district: "Kadıköy",
    address: "Bağdat Caddesi No: 142 D: 6 Kadıköy / İstanbul",
    balance: 0,
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-08-20T14:30:00Z",
    vehicles: [
      {
        id: "veh_1",
        tenantId: "tenant_1",
        customerId: "cust_1",
        plate: "34 RB 1905",
        brand: "BMW",
        model: "320i M Sport",
        year: 2022,
        kilometer: 48500,
        vin: "WBA33AY08NFP19050",
        fuelType: "Benzin",
        transmission: "Otomatik",
        color: "Portimao Mavi",
        notes: "Müşteri orijinal BMW onaylı motor yağı talep ediyor.",
        lastServiceDate: "2026-07-12",
      },
      {
        id: "veh_1_2",
        tenantId: "tenant_1",
        customerId: "cust_1",
        plate: "34 GS 1905",
        brand: "Porsche",
        model: "Macan GTS",
        year: 2023,
        kilometer: 22000,
        vin: "WP1AA2A59PLB19051",
        fuelType: "Benzin",
        transmission: "Otomatik",
        color: "Tebeşir Gri",
        notes: "Spor egzoz valfi kontrol edilecek.",
        lastServiceDate: "2026-08-05",
      },
    ],
    appointments: [
      {
        id: "app_1",
        date: "2026-09-10",
        time: "10:30",
        serviceName: "Periyodik Bakım (Yağ + 4 Filtre)",
        plate: "34 RB 1905",
        status: "CONFIRMED",
        technicianName: "Ahmet Usta",
      },
      {
        id: "app_2",
        date: "2026-07-12",
        time: "14:00",
        serviceName: "Ön Fren Balata Değişimi",
        plate: "34 RB 1905",
        status: "COMPLETED",
        technicianName: "Mustafa Usta",
      },
    ],
    workOrders: [
      {
        id: "wo_1",
        orderNumber: "WO-2026-084",
        plate: "34 RB 1905",
        date: "2026-07-12",
        status: "COMPLETED",
        totalAmount: 4850,
        kilometers: 44200,
        itemsSummary: "Brembo Ön Balata Takımı, Balata Fişi, Fren Temizleme Spreyi, İşçilik",
        technician: "Ahmet Usta",
      },
      {
        id: "wo_2",
        orderNumber: "WO-2026-112",
        plate: "34 GS 1905",
        date: "2026-08-05",
        status: "COMPLETED",
        totalAmount: 9200,
        kilometers: 22000,
        itemsSummary: "Mobil 1 0W-40 Yağ, Yağ Filtresi, Polen Filtresi, İşçilik",
        technician: "Ahmet Usta",
      },
    ],
    invoices: [
      {
        id: "inv_1",
        invoiceNumber: "FTR-2026-00389",
        date: "2026-07-12",
        dueDate: "2026-07-12",
        plate: "34 RB 1905",
        totalAmount: 4850,
        paidAmount: 4850,
        status: "PAID",
      },
      {
        id: "inv_2",
        invoiceNumber: "FTR-2026-00441",
        date: "2026-08-05",
        dueDate: "2026-08-05",
        plate: "34 GS 1905",
        totalAmount: 9200,
        paidAmount: 9200,
        status: "PAID",
      },
    ],
    movements: [
      {
        id: "mov_1",
        date: "2026-07-12 15:30",
        type: "DEBIT",
        amount: 4850,
        balanceAfter: 4850,
        description: "Servis Faturası: FTR-2026-00389 (34 RB 1905)",
        documentNo: "WO-2026-084",
      },
      {
        id: "mov_2",
        date: "2026-07-12 15:45",
        type: "CREDIT",
        amount: 4850,
        balanceAfter: 0,
        description: "Kredi Kartı ile Tahsilat (POS - Garanti BBVA)",
        documentNo: "THS-2026-092",
      },
    ],
  },
  {
    id: "cust_2",
    tenantId: "tenant_1",
    type: "individual",
    name: "Ahmet",
    surname: "Yılmaz",
    phone: "0 (542) 333 44 55",
    email: "ahmet.yilmaz@gmail.com",
    city: "Ankara",
    district: "Çankaya",
    address: "Tunalı Hilmi Caddesi No: 48/3 Çankaya / Ankara",
    balance: 3200, // 3200 TL açık hesap borcu
    createdAt: "2026-02-10T11:20:00Z",
    updatedAt: "2026-08-28T09:15:00Z",
    vehicles: [
      {
        id: "veh_2",
        tenantId: "tenant_1",
        customerId: "cust_2",
        plate: "06 AY 2020",
        brand: "Volkswagen",
        model: "Passat 1.5 TSI Elegance",
        year: 2021,
        kilometer: 62000,
        vin: "WVWZZZ3CZNE062020",
        fuelType: "Benzin",
        transmission: "Otomatik",
        color: "Derin Siyah",
        notes: "Şanzıman kavraması son kontrolde iyi durumda görüldü.",
        lastServiceDate: "2026-08-28",
      },
    ],
    appointments: [],
    workOrders: [
      {
        id: "wo_3",
        orderNumber: "WO-2026-145",
        plate: "06 AY 2020",
        date: "2026-08-28",
        status: "COMPLETED",
        totalAmount: 6200,
        kilometers: 62000,
        itemsSummary: "Periyodik Bakım, Buji Takımı Değişimi, Rot Ayarı",
        technician: "Mehmet Usta",
      },
    ],
    invoices: [
      {
        id: "inv_3",
        invoiceNumber: "FTR-2026-00502",
        date: "2026-08-28",
        dueDate: "2026-09-15",
        plate: "06 AY 2020",
        totalAmount: 6200,
        paidAmount: 3000,
        status: "PARTIAL",
      },
    ],
    movements: [
      {
        id: "mov_3",
        date: "2026-08-28 17:00",
        type: "DEBIT",
        amount: 6200,
        balanceAfter: 6200,
        description: "Servis Faturası: FTR-2026-00502 (06 AY 2020)",
        documentNo: "WO-2026-145",
      },
      {
        id: "mov_4",
        date: "2026-08-28 17:15",
        type: "CREDIT",
        amount: 3000,
        balanceAfter: 3200,
        description: "Nakit Kısmi Tahsilat (Kalan Açık Hesap: 3.200 TL)",
        documentNo: "THS-2026-118",
      },
    ],
  },
  {
    id: "cust_3",
    tenantId: "tenant_1",
    type: "corporate",
    name: "Mustafa",
    surname: "Kaya (Yetkili)",
    companyTitle: "Ege Lojistik Dağıtım Hizmetleri A.Ş.",
    taxOffice: "Bornova",
    taxNumber: "3250481920",
    phone: "0 (533) 987 65 43",
    email: "muhasebe@egelojistik.com.tr",
    city: "İzmir",
    district: "Bornova",
    address: "Işıkkent Nakliyeciler Sitesi 4. Blok No: 12 Bornova / İzmir",
    balance: 14500, // Filo cari borcu
    createdAt: "2026-03-01T08:00:00Z",
    updatedAt: "2026-09-01T16:00:00Z",
    vehicles: [
      {
        id: "veh_3_1",
        tenantId: "tenant_1",
        customerId: "cust_3",
        plate: "35 EGE 01",
        brand: "Ford",
        model: "Transit 350L Panelvan",
        year: 2022,
        kilometer: 118000,
        vin: "NM0XXXTTFXNT35001",
        fuelType: "Dizel",
        transmission: "Manuel",
        color: "Beyaz",
        notes: "Ağır yük taşımacılığı yapıyor, makas ve süspansiyonlara dikkat.",
        lastServiceDate: "2026-08-15",
      },
      {
        id: "veh_3_2",
        tenantId: "tenant_1",
        customerId: "cust_3",
        plate: "35 EGE 02",
        brand: "Mercedes-Benz",
        model: "Sprinter 316 CDI",
        year: 2023,
        kilometer: 84000,
        vin: "WDB9066331P35002",
        fuelType: "Dizel",
        transmission: "Otomatik",
        color: "Gümüş Gri",
        notes: "Soğuk zincir aracı.",
        lastServiceDate: "2026-09-01",
      },
      {
        id: "veh_3_3",
        tenantId: "tenant_1",
        customerId: "cust_3",
        plate: "35 EGE 03",
        brand: "Renault",
        model: "Master 2.3 dCi",
        year: 2021,
        kilometer: 142000,
        vin: "VF1MA00056635003",
        fuelType: "Dizel",
        transmission: "Manuel",
        color: "Beyaz",
        notes: "Ağır bakım zamanı geldi.",
        lastServiceDate: "2026-07-20",
      },
    ],
    appointments: [
      {
        id: "app_3",
        date: "2026-09-08",
        time: "09:00",
        serviceName: "Filo Periyodik Kontrol & Yağ Değişimi",
        plate: "35 EGE 01",
        status: "CONFIRMED",
        technicianName: "Ali Usta",
      },
    ],
    workOrders: [
      {
        id: "wo_4",
        orderNumber: "WO-2026-156",
        plate: "35 EGE 02",
        date: "2026-09-01",
        status: "COMPLETED",
        totalAmount: 14500,
        kilometers: 84000,
        itemsSummary: "Ön & Arka Fren Disk Balata, Şanzıman Yağı, Enjektör Temizliği",
        technician: "Ahmet Usta",
      },
    ],
    invoices: [
      {
        id: "inv_4",
        invoiceNumber: "FTR-2026-00518",
        date: "2026-09-01",
        dueDate: "2026-09-30",
        plate: "35 EGE 02",
        totalAmount: 14500,
        paidAmount: 0,
        status: "UNPAID",
      },
    ],
    movements: [
      {
        id: "mov_5",
        date: "2026-09-01 18:00",
        type: "DEBIT",
        amount: 14500,
        balanceAfter: 14500,
        description: "Kurumsal Filo Faturası: FTR-2026-00518 (35 EGE 02)",
        documentNo: "WO-2026-156",
      },
    ],
  },
  {
    id: "cust_4",
    tenantId: "tenant_1",
    type: "individual",
    name: "Zeynep",
    surname: "Kaya",
    phone: "0 (555) 777 88 99",
    email: "zeynep.kaya@hotmail.com",
    city: "İstanbul",
    district: "Beşiktaş",
    address: "Etiler Mah. Nispetiye Cad. No: 82 Beşiktaş / İstanbul",
    balance: 0,
    createdAt: "2026-04-12T14:10:00Z",
    updatedAt: "2026-08-10T11:00:00Z",
    vehicles: [
      {
        id: "veh_4",
        tenantId: "tenant_1",
        customerId: "cust_4",
        plate: "34 ZK 444",
        brand: "Mercedes-Benz",
        model: "A200 AMG",
        year: 2022,
        kilometer: 31000,
        vin: "W1K1770871J344400",
        fuelType: "Benzin",
        transmission: "Otomatik",
        color: "Dağ Grisi Magno",
        notes: "Müşteri periyodik bakım dışında ön cam sileceklerini değiştirmek istiyor.",
        lastServiceDate: "2026-08-10",
      },
    ],
    appointments: [],
    workOrders: [
      {
        id: "wo_5",
        orderNumber: "WO-2026-099",
        plate: "34 ZK 444",
        date: "2026-08-10",
        status: "COMPLETED",
        totalAmount: 5100,
        kilometers: 31000,
        itemsSummary: "A Bakımı, Orijinal Mercedes Yağ & Filtreler, Silecek Takımı",
        technician: "Ahmet Usta",
      },
    ],
    invoices: [
      {
        id: "inv_5",
        invoiceNumber: "FTR-2026-00420",
        date: "2026-08-10",
        dueDate: "2026-08-10",
        plate: "34 ZK 444",
        totalAmount: 5100,
        paidAmount: 5100,
        status: "PAID",
      },
    ],
    movements: [],
  },
]

// Helper functions for state storage and reactivity
const CUSTOMERS_KEY = "worksauto_customers_data"

export function getStoredCustomers(): Customer[] {
  if (typeof window === "undefined") return INITIAL_CUSTOMERS
  try {
    const raw = localStorage.getItem(CUSTOMERS_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch (e) {
    // fallback
  }
  return INITIAL_CUSTOMERS
}

export function saveStoredCustomers(customers: Customer[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers))
  } catch (e) {
    // ignore
  }
}

export function getCustomerById(id: string): Customer | undefined {
  const list = getStoredCustomers()
  return list.find((c) => c.id === id)
}

export function getAllVehicles(): (Vehicle & { customerName: string; customerPhone: string; customerId: string })[] {
  const customers = getStoredCustomers()
  const result: (Vehicle & { customerName: string; customerPhone: string; customerId: string })[] = []

  customers.forEach((c) => {
    const displayName = c.type === "corporate" && c.companyTitle ? c.companyTitle : `${c.name} ${c.surname}`
    c.vehicles.forEach((v) => {
      result.push({
        ...v,
        customerName: displayName,
        customerPhone: c.phone,
        customerId: c.id,
      })
    })
  })

  return result
}
