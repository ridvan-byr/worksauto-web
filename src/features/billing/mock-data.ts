import { Invoice, Payment, CurrentAccount, CariMovementItem, PaymentMethod } from "./types"

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: "inv_101",
    invoiceNumber: "INV-2026-088",
    workOrderId: "wo_101",
    workOrderNumber: "WO-2026-088",
    tenantId: "tenant_1",
    customerId: "cust_3",
    customerName: "Mustafa Kaya",
    customerPhone: "0 (533) 987 65 43",
    customerType: "corporate",
    companyTitle: "Ege Lojistik A.Ş.",
    taxOffice: "Konak Vergi Dairesi",
    taxNumber: "3250198421",
    vehiclePlate: "35 EGE 01",
    vehicleBrand: "Ford",
    vehicleModel: "Transit 350L",
    vehicleYear: 2022,
    vehicleKm: 118400,
    vehicleVin: "WF0XXXTTFXP12345",
    items: [
      { id: "i1", type: "SERVICE", name: "Periyodik Bakım İşçiliği", quantity: 1, unitPrice: 1250, totalPrice: 1250 },
      { id: "i2", type: "SERVICE", name: "Rot-Balans & Ön Takım Ayarı", quantity: 1, unitPrice: 750, totalPrice: 750 },
      { id: "i3", type: "PART", name: "5W-30 Motor Yağı (7 Litre)", code: "ENG-OIL-5W30", quantity: 7, unitPrice: 220, totalPrice: 1540 },
      { id: "i4", type: "PART", name: "Yağ Filtresi - Ford Orijinal", code: "FLT-OIL-FD", quantity: 1, unitPrice: 280, totalPrice: 280 },
      { id: "i5", type: "PART", name: "Hava Filtresi", code: "FLT-AIR-FD", quantity: 1, unitPrice: 320, totalPrice: 320 },
    ],
    subtotal: 4140,
    taxAmount: 828,
    grandTotal: 4968,
    paidAmount: 2000,
    remainingAmount: 2968,
    status: "PARTIALLY_PAID",
    payments: [
      {
        id: "pay_1",
        invoiceId: "inv_101",
        customerId: "cust_3",
        amount: 2000,
        method: "POS",
        referenceNo: "POS-SLIP-4412",
        note: "İşlem başlangıcı kaparo ödemesi",
        performedByName: "Servis Danışmanı",
        createdAt: "2026-09-03T09:30:00Z",
      },
    ],
    issueDate: "2026-09-03",
    dueDate: "2026-09-17",
    createdAt: "2026-09-03T09:30:00Z",
    updatedAt: "2026-09-03T11:00:00Z",
  },
  {
    id: "inv_102",
    invoiceNumber: "INV-2026-042",
    workOrderId: "wo_102",
    workOrderNumber: "WO-2026-042",
    tenantId: "tenant_1",
    customerId: "cust_1",
    customerName: "Rıdvan Bayar",
    customerPhone: "0 (532) 111 22 33",
    customerType: "individual",
    vehiclePlate: "34 RB 1905",
    vehicleBrand: "BMW",
    vehicleModel: "320i M Sport",
    vehicleYear: 2023,
    vehicleKm: 45000,
    vehicleVin: "WBA33AY08P190500",
    items: [
      { id: "i6", type: "SERVICE", name: "Periyodik Bakım (Yağ + 4 Filtre)", quantity: 1, unitPrice: 1250, totalPrice: 1250 },
      { id: "i7", type: "SERVICE", name: "Ön Fren Balata Değişimi", quantity: 1, unitPrice: 850, totalPrice: 850 },
      { id: "i8", type: "PART", name: "Brembo Ön Balata Takımı", code: "BRM-P06088", quantity: 1, unitPrice: 2450, totalPrice: 2450 },
    ],
    subtotal: 4550,
    taxAmount: 910,
    grandTotal: 5460,
    paidAmount: 0,
    remainingAmount: 5460,
    status: "UNPAID",
    payments: [],
    issueDate: "2026-09-03",
    dueDate: "2026-09-03",
    createdAt: "2026-09-03T10:00:00Z",
    updatedAt: "2026-09-03T10:00:00Z",
  },
  {
    id: "inv_103",
    invoiceNumber: "INV-2026-021",
    workOrderId: "wo_104",
    workOrderNumber: "WO-2026-021",
    tenantId: "tenant_1",
    customerId: "cust_4",
    customerName: "Zeynep Kaya",
    customerPhone: "0 (555) 777 88 99",
    customerType: "individual",
    vehiclePlate: "34 ZK 444",
    vehicleBrand: "Mercedes-Benz",
    vehicleModel: "A200 AMG",
    vehicleYear: 2021,
    vehicleKm: 52000,
    items: [
      { id: "i9", type: "SERVICE", name: "Klima Gazı Dolumu & Kaçak Testi", quantity: 1, unitPrice: 950, totalPrice: 950 },
      { id: "i10", type: "PART", name: "R134a Klima Gazı (500gr)", code: "GAS-R134A", quantity: 1, unitPrice: 650, totalPrice: 650 },
    ],
    subtotal: 1600,
    taxAmount: 320,
    grandTotal: 1920,
    paidAmount: 1920,
    remainingAmount: 0,
    status: "PAID",
    payments: [
      {
        id: "pay_2",
        invoiceId: "inv_103",
        customerId: "cust_4",
        amount: 1920,
        method: "CASH",
        note: "Nakit tahsil edildi, fiş kesildi.",
        performedByName: "Servis Danışmanı",
        createdAt: "2026-09-03T11:20:00Z",
      },
    ],
    issueDate: "2026-09-03",
    dueDate: "2026-09-03",
    createdAt: "2026-09-03T11:15:00Z",
    updatedAt: "2026-09-03T11:20:00Z",
  },
  {
    id: "inv_104",
    invoiceNumber: "INV-2026-015",
    workOrderId: "wo_103",
    workOrderNumber: "WO-2026-015",
    tenantId: "tenant_1",
    customerId: "cust_2",
    customerName: "Ahmet Yılmaz",
    customerPhone: "0 (542) 333 44 55",
    customerType: "individual",
    vehiclePlate: "06 AY 2020",
    vehicleBrand: "Volkswagen",
    vehicleModel: "Passat 1.5 TSI",
    vehicleYear: 2020,
    vehicleKm: 74200,
    items: [
      { id: "i11", type: "SERVICE", name: "Bilgisayarlı Arıza Tespit & Teşhis", quantity: 1, unitPrice: 500, totalPrice: 500 },
      { id: "i12", type: "SERVICE", name: "Buji Değişimi İşçiliği", quantity: 1, unitPrice: 600, totalPrice: 600 },
      { id: "i13", type: "PART", name: "NGK İridyum Buji (4 Adet)", code: "NGK-ILZKR7B", quantity: 4, unitPrice: 350, totalPrice: 1400 },
    ],
    subtotal: 2500,
    taxAmount: 500,
    grandTotal: 3000,
    paidAmount: 0,
    remainingAmount: 3000,
    status: "UNPAID",
    payments: [],
    issueDate: "2026-09-03",
    dueDate: "2026-09-03",
    createdAt: "2026-09-03T11:50:00Z",
    updatedAt: "2026-09-03T11:50:00Z",
  },
]

export const INITIAL_CURRENT_ACCOUNTS: CurrentAccount[] = [
  {
    customerId: "cust_3",
    customerName: "Mustafa Kaya",
    customerPhone: "0 (533) 987 65 43",
    customerType: "corporate",
    companyTitle: "Ege Lojistik A.Ş.",
    totalDebits: 14450,
    totalCredits: 2000,
    balance: 12450, // Açık Borç
    creditLimit: 25000, // Limit: 25.000 TL (Güvenli)
    movements: [
      {
        id: "cm_1",
        customerId: "cust_3",
        date: "2026-08-15",
        type: "INVOICE",
        description: "Fatura #INV-2026-031 (Filo Yağ Bakımı)",
        referenceNo: "INV-2026-031",
        debit: 9482,
        credit: 0,
        balanceAfter: 9482,
      },
      {
        id: "cm_2",
        customerId: "cust_3",
        date: "2026-09-03",
        type: "INVOICE",
        description: "Fatura #INV-2026-088 (35 EGE 01 Transit Bakımı)",
        referenceNo: "INV-2026-088",
        debit: 4968,
        credit: 0,
        balanceAfter: 14450,
      },
      {
        id: "cm_3",
        customerId: "cust_3",
        date: "2026-09-03",
        type: "PAYMENT",
        description: "POS Tahsilatı (Fatura #INV-2026-088)",
        referenceNo: "POS-SLIP-4412",
        debit: 0,
        credit: 2000,
        balanceAfter: 12450,
      },
    ],
  },
  {
    customerId: "cust_2",
    customerName: "Ahmet Yılmaz",
    customerPhone: "0 (542) 333 44 55",
    customerType: "individual",
    totalDebits: 3000,
    totalCredits: 0,
    balance: 3000,
    creditLimit: 2000, // KRİTİK: BORÇ LİMİTİ AŞILDI (3000 > 2000)!
    movements: [
      {
        id: "cm_4",
        customerId: "cust_2",
        date: "2026-09-03",
        type: "INVOICE",
        description: "Fatura #INV-2026-015 (Passat Arıza & Buji)",
        referenceNo: "INV-2026-015",
        debit: 3000,
        credit: 0,
        balanceAfter: 3000,
      },
    ],
  },
  {
    customerId: "cust_1",
    customerName: "Rıdvan Bayar",
    customerPhone: "0 (532) 111 22 33",
    customerType: "individual",
    totalDebits: 5460,
    totalCredits: 0,
    balance: 5460,
    creditLimit: 10000,
    movements: [
      {
        id: "cm_5",
        customerId: "cust_1",
        date: "2026-09-03",
        type: "INVOICE",
        description: "Fatura #INV-2026-042 (BMW 320i Bakım & Fren)",
        referenceNo: "INV-2026-042",
        debit: 5460,
        credit: 0,
        balanceAfter: 5460,
      },
    ],
  },
  {
    customerId: "cust_4",
    customerName: "Zeynep Kaya",
    customerPhone: "0 (555) 777 88 99",
    customerType: "individual",
    totalDebits: 1920,
    totalCredits: 1920,
    balance: 0, // Sıfır bakiye
    creditLimit: 5000,
    movements: [
      {
        id: "cm_6",
        customerId: "cust_4",
        date: "2026-09-03",
        type: "INVOICE",
        description: "Fatura #INV-2026-021 (Mercedes A200 Klima)",
        referenceNo: "INV-2026-021",
        debit: 1920,
        credit: 0,
        balanceAfter: 1920,
      },
      {
        id: "cm_7",
        customerId: "cust_4",
        date: "2026-09-03",
        type: "PAYMENT",
        description: "Nakit Tahsilat (Fatura #INV-2026-021)",
        debit: 0,
        credit: 1920,
        balanceAfter: 0,
      },
    ],
  },
]

const INVOICES_STORAGE_KEY = "worksauto_invoices_data"
const CARI_STORAGE_KEY = "worksauto_cari_data"

export function getStoredInvoices(): Invoice[] {
  if (typeof window === "undefined") return INITIAL_INVOICES
  try {
    const raw = localStorage.getItem(INVOICES_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return INITIAL_INVOICES
}

export function saveStoredInvoices(invoices: Invoice[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices))
  } catch (e) {}
}

export function getInvoiceById(id: string): Invoice | undefined {
  const invoices = getStoredInvoices()
  return invoices.find((inv) => inv.id === id || inv.invoiceNumber === id)
}

export function getStoredCurrentAccounts(): CurrentAccount[] {
  if (typeof window === "undefined") return INITIAL_CURRENT_ACCOUNTS
  try {
    const raw = localStorage.getItem(CARI_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return INITIAL_CURRENT_ACCOUNTS
}

export function saveStoredCurrentAccounts(accounts: CurrentAccount[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(CARI_STORAGE_KEY, JSON.stringify(accounts))
  } catch (e) {}
}

export function recordInvoicePayment(
  invoiceId: string,
  amount: number,
  method: PaymentMethod,
  referenceNo?: string,
  note?: string
): { success: boolean; invoice: Invoice } {
  const invoices = getStoredInvoices()
  const inv = invoices.find((i) => i.id === invoiceId)
  if (!inv) throw new Error("Fatura bulunamadı")

  const payAmount = Math.min(amount, inv.remainingAmount)
  const nextPaid = inv.paidAmount + payAmount
  const nextRemaining = inv.grandTotal - nextPaid
  const nextStatus = nextRemaining <= 0 ? "PAID" : "PARTIALLY_PAID"

  const newPayment: Payment = {
    id: "pay_" + Date.now(),
    invoiceId: inv.id,
    customerId: inv.customerId,
    amount: payAmount,
    method,
    referenceNo,
    note,
    performedByName: "Servis Danışmanı",
    createdAt: new Date().toISOString(),
  }

  const updatedInvoice: Invoice = {
    ...inv,
    paidAmount: nextPaid,
    remainingAmount: Math.max(0, nextRemaining),
    status: nextStatus,
    payments: [...inv.payments, newPayment],
    updatedAt: new Date().toISOString(),
  }

  const nextInvoices = invoices.map((i) => (i.id === invoiceId ? updatedInvoice : i))
  saveStoredInvoices(nextInvoices)

  // Also update customer's cari account
  updateCariOnPayment(inv.customerId, payAmount, `Fatura Tahsilatı (${inv.invoiceNumber})`, referenceNo)

  return { success: true, invoice: updatedInvoice }
}

function updateCariOnPayment(customerId: string, amount: number, desc: string, ref?: string) {
  const accounts = getStoredCurrentAccounts()
  const acc = accounts.find((a) => a.customerId === customerId)
  if (!acc) return

  const nextCredits = acc.totalCredits + amount
  const nextBalance = acc.totalDebits - nextCredits

  const newMov: CariMovementItem = {
    id: "cm_" + Date.now(),
    customerId,
    date: new Date().toISOString().split("T")[0],
    type: "PAYMENT",
    description: desc,
    referenceNo: ref,
    debit: 0,
    credit: amount,
    balanceAfter: nextBalance,
  }

  const updatedAcc: CurrentAccount = {
    ...acc,
    totalCredits: nextCredits,
    balance: nextBalance,
    movements: [...acc.movements, newMov],
  }

  const nextAccs = accounts.map((a) => (a.customerId === customerId ? updatedAcc : a))
  saveStoredCurrentAccounts(nextAccs)
}

export function recordManualCariCollection(
  customerId: string,
  amount: number,
  method: PaymentMethod,
  referenceNo?: string,
  note?: string
): CurrentAccount {
  const accounts = getStoredCurrentAccounts()
  const acc = accounts.find((a) => a.customerId === customerId)
  if (!acc) throw new Error("Cari hesap bulunamadı")

  const nextCredits = acc.totalCredits + amount
  const nextBalance = acc.totalDebits - nextCredits

  const newMov: CariMovementItem = {
    id: "cm_" + Date.now(),
    customerId,
    date: new Date().toISOString().split("T")[0],
    type: "MANUAL_COLLECTION",
    description: `Manuel Cari Tahsilat (${method}) ${note ? `- ${note}` : ""}`,
    referenceNo,
    debit: 0,
    credit: amount,
    balanceAfter: nextBalance,
  }

  const updatedAcc: CurrentAccount = {
    ...acc,
    totalCredits: nextCredits,
    balance: nextBalance,
    movements: [...acc.movements, newMov],
  }

  const nextAccs = accounts.map((a) => (a.customerId === customerId ? updatedAcc : a))
  saveStoredCurrentAccounts(nextAccs)
  return updatedAcc
}

export function getDailyCashSummary() {
  const invoices = getStoredInvoices()
  let cash = 0
  let pos = 0
  let bank = 0

  invoices.forEach((inv) => {
    inv.payments.forEach((p) => {
      if (p.method === "CASH") cash += p.amount
      else if (p.method === "POS") pos += p.amount
      else if (p.method === "BANK_TRANSFER") bank += p.amount
    })
  })

  return { cash, pos, bank, total: cash + pos + bank }
}
