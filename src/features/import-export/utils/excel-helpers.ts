import * as XLSX from "xlsx"

export interface TargetFieldDef {
  key: string
  label: string
  group: "customer" | "vehicle" | "other"
  required?: boolean
  description?: string
}

export const TARGET_FIELDS: TargetFieldDef[] = [
  // Müşteri Alanları
  { key: "fullName", label: "Müşteri Adı Soyadı (Birleşik)", group: "customer", description: "Örn: Ahmet Yılmaz veya Ayşe Kaya Yılmaz" },
  { key: "firstName", label: "Müşteri Adı (Ayrı Sütun)", group: "customer", description: "Örn: Ahmet" },
  { key: "lastName", label: "Müşteri Soyadı (Ayrı Sütun)", group: "customer", description: "Örn: Yılmaz veya Kaya Yılmaz" },
  { key: "phone", label: "Telefon Numarası *", group: "customer", required: true, description: "Örn: 0532 123 45 67" },
  { key: "companyTitle", label: "Şirket / Firma Ünvanı", group: "customer", description: "Kurumsal müşteriler için ünvan" },
  { key: "email", label: "E-Posta Adresi", group: "customer" },
  { key: "taxNumber", label: "Vergi Kimlik Numarası (VKN/TCKN)", group: "customer" },
  { key: "taxOffice", label: "Vergi Dairesi", group: "customer" },
  
  // Araç Alanları
  { key: "plate", label: "Araç Plakası *", group: "vehicle", required: true, description: "Örn: 34 ABC 123" },
  { key: "brand", label: "Araç Markası", group: "vehicle", description: "Örn: Renault, Fiat, Volkswagen" },
  { key: "model", label: "Araç Modeli", group: "vehicle", description: "Örn: Megane, Egea, Passat" },
  { key: "year", label: "Model Yılı", group: "vehicle", description: "Örn: 2022" },
  { key: "kilometer", label: "Güncel Kilometre (KM)", group: "vehicle", description: "Örn: 85000" },
  { key: "vin", label: "Şasi Numarası (VIN)", group: "vehicle" },
  { key: "fuelType", label: "Yakıt Tipi", group: "vehicle", description: "Benzin, Dizel, LPG, Hibrit, Elektrik" },
  { key: "transmission", label: "Vites Türü", group: "vehicle", description: "Manuel, Otomatik" },

  // Diğer
  { key: "notes", label: "Müşteri / Araç Notu", group: "other" },
]

/**
 * Akıllı Türkçe İsim Ayrıştırma Algoritması
 * Çift soyadlı kadınlar (Örn: "Ayşe Kaya Yılmaz") veya 2 ön isimli kişiler (Örn: "Fatma Zehra Kaya Yılmaz")
 * için akıllı parçalama yapar.
 */
export function parseFullName(input: string): { firstName: string; lastName: string } {
  if (!input || !input.trim()) return { firstName: "İsimsiz", lastName: "" }
  const words = input.trim().replace(/\s+/g, " ").split(" ")

  if (words.length === 1) {
    return { firstName: words[0], lastName: "" }
  }
  if (words.length === 2) {
    return { firstName: words[0], lastName: words[1] }
  }
  if (words.length === 3) {
    // Örn: Ayşe Kaya Yılmaz -> Ayşe | Kaya Yılmaz (Çift soyad önceliği)
    return { firstName: words[0], lastName: `${words[1]} ${words[2]}` }
  }
  // 4 ve daha fazla kelime (Örn: Fatma Zehra Kaya Yılmaz)
  return {
    firstName: `${words[0]} ${words[1]}`,
    lastName: words.slice(2).join(" "),
  }
}

/**
 * Sütun başlığından hedef alanı akıllı tahmin etme (Smart Guess)
 */
export function guessTargetField(columnHeader: string): string {
  const norm = columnHeader.toLowerCase().trim().replace(/[^a-z0-9ğüşıöç]/gi, "")

  // Plaka
  if (norm.includes("plaka") || norm.includes("plate") || norm === "aracplaka") return "plate"

  // Telefon
  if (norm.includes("tel") || norm.includes("phone") || norm.includes("gsm") || norm.includes("mobil") || norm.includes("cep")) return "phone"

  // Şirket Ünvanı
  if (norm.includes("unvan") || norm.includes("ünvan") || norm.includes("sirket") || norm.includes("şirket") || norm.includes("firma")) return "companyTitle"

  // Ad Soyad Birleşik
  if (
    norm.includes("adsoyad") ||
    norm.includes("isimsoyisim") ||
    norm.includes("musteriadi") ||
    norm.includes("musteri") ||
    norm === "advesoyad" ||
    norm === "adveyasoyad"
  ) {
    return "fullName"
  }

  // Soyad Ayrı
  if (norm.includes("soyad") || norm.includes("surname") || norm.includes("soyisim")) return "lastName"

  // Ad Ayrı
  if (norm.includes("ad") || norm.includes("isim") || norm.includes("name") || norm === "first") return "firstName"

  // Marka
  if (norm.includes("marka") || norm.includes("brand") || norm.includes("make")) return "brand"

  // Model
  if (norm.includes("model")) return "model"

  // Yıl
  if (norm.includes("yil") || norm.includes("yıl") || norm.includes("year")) return "year"

  // Kilometre
  if (norm.includes("km") || norm.includes("kilo") || norm.includes("mileage") || norm.includes("sayac")) return "kilometer"

  // Şasi No
  if (norm.includes("sasi") || norm.includes("şasi") || norm.includes("vin") || norm.includes("chassis")) return "vin"

  // E-Posta
  if (norm.includes("mail") || norm.includes("eposta") || norm.includes("e-posta")) return "email"

  // Vergi No
  if (norm.includes("vergi") || norm.includes("vkn") || norm.includes("tckn") || norm.includes("tc")) return "taxNumber"

  // Yakıt
  if (norm.includes("yakit") || norm.includes("yakıt") || norm.includes("fuel")) return "fuelType"

  // Vites
  if (norm.includes("vites") || norm.includes("trans")) return "transmission"

  // Not
  if (norm.includes("not") || norm.includes("aciklama") || norm.includes("açıklama") || norm.includes("note")) return "notes"

  return ""
}

/**
 * Excel dosyasını tarayıcıda okur
 */
export async function readExcelFile(file: File): Promise<{
  headers: string[]
  rows: Record<string, any>[]
  rawRows: any[][]
  sheetName: string
  totalCount: number
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) {
          throw new Error("Excel dosyasında çalışma sayfası bulunamadı.")
        }

        const worksheet = workbook.Sheets[sheetName]
        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" })

        if (rawRows.length === 0) {
          throw new Error("Seçilen Excel dosyası boş.")
        }

        // 1. Satır başlıklar
        const headers = (rawRows[0] || []).map((h: any) => String(h || "").trim()).filter(Boolean)
        
        // Veri satırları
        const objectRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "" })

        resolve({
          headers,
          rows: objectRows,
          rawRows: rawRows.slice(1),
          sheetName,
          totalCount: objectRows.length,
        })
      } catch (err: any) {
        reject(new Error(err?.message || "Excel dosyası okunamadı. Lütfen geçerli bir .xlsx veya .xls dosyası seçin."))
      }
    }

    reader.onerror = () => {
      reject(new Error("Dosya okunurken bir hata meydana geldi."))
    }

    reader.readAsArrayBuffer(file)
  })
}

/**
 * Örnek Excel Şablonu Üretip İndirir
 */
export function downloadSampleTemplate(type: "all" | "customer" | "vehicle" = "all") {
  let sampleData: any[] = []

  if (type === "all") {
    sampleData = [
      {
        "Müşteri Adı Soyadı": "Ahmet Yılmaz",
        "Telefon": "05321112233",
        "Plaka": "34 ABC 123",
        "Marka": "Renault",
        "Model": "Megane 1.5 dCi",
        "Model Yılı": 2021,
        "Kilometre": 68000,
        "Yakıt Tipi": "Dizel",
        "Vites": "Manuel",
        "E-Posta": "ahmet@ornek.com",
        "Firma Ünvanı": "",
        "Notlar": "VIP Müşteri",
      },
      {
        "Müşteri Adı Soyadı": "Ayşe Kaya Yılmaz",
        "Telefon": "05423334455",
        "Plaka": "06 ANK 06",
        "Marka": "Volkswagen",
        "Model": "Golf 1.0 TSI",
        "Model Yılı": 2023,
        "Kilometre": 24000,
        "Yakıt Tipi": "Benzin",
        "Vites": "Otomatik",
        "E-Posta": "ayse@ornek.com",
        "Firma Ünvanı": "",
        "Notlar": "Periyodik bakım takip edilecek",
      },
      {
        "Müşteri Adı Soyadı": "Mehmet Demir",
        "Telefon": "05559998877",
        "Plaka": "35 IZM 35",
        "Marka": "Fiat",
        "Model": "Egea Sedan",
        "Model Yılı": 2022,
        "Kilometre": 92000,
        "Yakıt Tipi": "Dizel",
        "Vites": "Manuel",
        "E-Posta": "mehmet@filo.com",
        "Firma Ünvanı": "Demir Lojistik A.Ş.",
        "Notlar": "Filo aracı",
      },
    ]
  }

  const worksheet = XLSX.utils.json_to_sheet(sampleData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Örnek Şablon")

  // Otomatik sütun genişliği
  worksheet["!cols"] = [
    { wch: 24 }, // Ad Soyad
    { wch: 16 }, // Telefon
    { wch: 14 }, // Plaka
    { wch: 16 }, // Marka
    { wch: 20 }, // Model
    { wch: 12 }, // Yıl
    { wch: 14 }, // KM
    { wch: 12 }, // Yakıt
    { wch: 12 }, // Vites
    { wch: 20 }, // Eposta
    { wch: 24 }, // Firma
    { wch: 24 }, // Notlar
  ]

  XLSX.writeFile(workbook, `WorksAuto_Sablon_${new Date().toISOString().split("T")[0]}.xlsx`)
}

/**
 * Tablodaki Verileri Excel Dosyası Olarak İndirir (Export)
 */
export function exportToExcel(data: any[], fileName: string, sheetName: string = "Veriler") {
  if (!data || data.length === 0) {
    throw new Error("Dışa aktarılacak veri bulunamadı.")
  }

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split("T")[0]}.xlsx`)
}
