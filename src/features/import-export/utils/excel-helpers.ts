import * as XLSX from "xlsx"
import {
  generateAestheticExcel,
  triggerDownloadBlob,
  ExportColumnDef,
} from "./aesthetic-excel"

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
 * Türkçe karakter duyarlı, otomobil istisnası ve zengin eşanlamlı sözlük içerir.
 */
export function guessTargetField(columnHeader: string): string {
  if (!columnHeader || typeof columnHeader !== "string") return ""

  const raw = columnHeader.trim()
  const lower = raw.toLocaleLowerCase("tr-TR")
  const norm = lower.replace(/[^a-z0-9ğüşıöç]/gi, "")

  // 1. Plaka
  if (norm.includes("plaka") || norm.includes("plate") || norm === "aracplaka" || norm.includes("plakano")) {
    return "plate"
  }

  // 2. Yakıt (Öncelikli: "yakıt cinsi" içindeki t+c harflerinin vergi no ile çakışmasını önler)
  if (norm.includes("yakit") || norm.includes("yakıt") || norm.includes("fuel")) {
    return "fuelType"
  }

  // 3. Telefon (Önemli: "otomobil" içindeki "mobil" telefon sayılmamalı!)
  const isOtomobil = norm.includes("otomobil")
  const hasPhoneKeywords =
    norm.includes("telefon") ||
    norm.includes("phone") ||
    norm.includes("gsm") ||
    norm.includes("cep") ||
    norm.includes("telno") ||
    norm.includes("iletisim") ||
    norm.includes("iletişim") ||
    norm === "tel" ||
    (!isOtomobil && norm.includes("mobil"))

  if (hasPhoneKeywords) {
    return "phone"
  }

  // 4. Marka / Üretici (Örn: "Otomobil Üreticisi / Marka")
  if (
    norm.includes("marka") ||
    norm.includes("brand") ||
    norm.includes("make") ||
    norm.includes("uretici") ||
    norm.includes("üretici")
  ) {
    return "brand"
  }

  // 5. Model Yılı / Sene (Örn: "Üretim Senesi", "Model Yılı", "Yıl")
  if (
    norm.includes("modelyili") ||
    norm.includes("modelyılı") ||
    norm.includes("uretimsenesi") ||
    norm.includes("üretimsenesi") ||
    norm.includes("imalatyili") ||
    norm.includes("imalatyılı") ||
    norm.includes("sene") ||
    norm.includes("yil") ||
    norm.includes("yıl") ||
    norm.includes("year")
  ) {
    return "year"
  }

  // 6. Araç Modeli (Not: Yıl kelimesi içermiyorsa)
  if (norm.includes("model") || norm.includes("tip") || norm.includes("kasa") || norm.includes("seri")) {
    return "model"
  }

  // 7. Şirket / Firma Ünvanı
  if (
    norm.includes("unvan") ||
    norm.includes("ünvan") ||
    norm.includes("sirket") ||
    norm.includes("şirket") ||
    norm.includes("firma") ||
    norm.includes("kurum") ||
    norm.includes("kuruluş") ||
    norm.includes("kurulus")
  ) {
    return "companyTitle"
  }

  // 8. Müşteri Adı Soyadı (Birleşik veya tek sütun)
  const hasAd = norm.includes("ad") || norm.includes("isim") || norm.includes("name")
  const hasSoyad = norm.includes("soyad") || norm.includes("surname") || norm.includes("soyisim")
  const hasMusteri = norm.includes("musteri") || norm.includes("müşteri") || norm.includes("cari")

  if (
    (hasAd && hasSoyad) ||
    norm.includes("adsoyad") ||
    norm.includes("isimsoyisim") ||
    norm.includes("advesoyad") ||
    (hasMusteri && !hasSoyad && !hasAd)
  ) {
    return "fullName"
  }

  // 9. Soyad Tek Başına
  if (hasSoyad) {
    return "lastName"
  }

  // 10. Ad Tek Başına
  if (hasAd || norm === "first") {
    return "firstName"
  }

  // 11. Kilometre
  if (norm.includes("km") || norm.includes("kilo") || norm.includes("mileage") || norm.includes("sayac") || norm.includes("sayaç")) {
    return "kilometer"
  }

  // 12. Şasi No (VIN)
  if (norm.includes("sasi") || norm.includes("şasi") || norm.includes("vin") || norm.includes("chassis")) {
    return "vin"
  }

  // 13. E-Posta
  if (norm.includes("mail") || norm.includes("eposta") || norm.includes("e-posta") || norm.includes("posta")) {
    return "email"
  }

  // 14. Vergi No
  if (
    norm.includes("vergi") ||
    norm.includes("vkn") ||
    norm.includes("tckn") ||
    norm.includes("tckimlik") ||
    norm.includes("tcno") ||
    norm === "tc"
  ) {
    return "taxNumber"
  }

  // 15. Vergi Dairesi
  if (norm.includes("daire") || norm.includes("dairesi")) {
    return "taxOffice"
  }

  // 16. Vites / Şanzıman
  if (
    norm.includes("vites") ||
    norm.includes("trans") ||
    norm.includes("gear") ||
    norm.includes("şanzıman") ||
    norm.includes("sanziman")
  ) {
    return "transmission"
  }

  // 17. Not
  if (norm.includes("not") || norm.includes("aciklama") || norm.includes("açıklama") || norm.includes("note")) {
    return "notes"
  }

  return ""
}

/**
 * Verilen sütun başlığı için dosyadaki satırlardan ilk birkaç boş olmayan örnek veriyi çeker
 */
export function getColumnSampleValues(header: string, rows: Record<string, any>[], maxCount = 2): string[] {
  if (!header || !rows || rows.length === 0) return []
  const samples: string[] = []
  for (const row of rows) {
    const val = row[header]
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      const str = String(val).trim()
      if (!samples.includes(str)) {
        samples.push(str)
      }
      if (samples.length >= maxCount) break
    }
  }
  return samples
}

/**
 * Telefon numarasını Türkiye standart formatına (05XXXXXXXXX) temizler ve normalize eder.
 * +90, 90, parantez ve boşluk farklılıklarını ortadan kaldırır.
 */
export function normalizePhoneNumber(raw: string): string {
  if (!raw) return ""
  let digits = raw.replace(/\D/g, "")
  if (digits.startsWith("90") && digits.length === 12) {
    digits = digits.slice(2)
  }
  if (digits.length === 10 && digits.startsWith("5")) {
    digits = "0" + digits
  }
  return digits
}

export interface RowSuitabilityAnalysis {
  isLikelyHeader: boolean
  isLikelyData: boolean
  isTooEmpty: boolean
  filledCellsCount: number
  matchedHeadersCount: number
  warning?: string
}

/**
 * Bir satırın başlık mı, müşteri verisi mi yoksa boş/çöp satır mı olduğunu analiz eder
 */
export function analyzeRowSuitability(row: any[]): RowSuitabilityAnalysis {
  if (!row || row.length === 0) {
    return {
      isLikelyHeader: false,
      isLikelyData: false,
      isTooEmpty: true,
      filledCellsCount: 0,
      matchedHeadersCount: 0,
      warning: "Bu satır tamamen boş.",
    }
  }

  const filled = row.filter((c) => c !== undefined && c !== null && String(c).trim() !== "")
  if (filled.length <= 1) {
    return {
      isLikelyHeader: false,
      isLikelyData: false,
      isTooEmpty: true,
      filledCellsCount: filled.length,
      matchedHeadersCount: 0,
      warning: "Yetersiz hücre verisi (boş veya tek hücreli satır).",
    }
  }

  let matchedHeadersCount = 0
  let looksLikeData = false

  for (const cell of filled) {
    const str = String(cell).trim()
    if (guessTargetField(str) !== "") {
      matchedHeadersCount++
    }
    // Telefon, plaka, email veya sayısal ID tespiti
    const digitsOnly = str.replace(/\D/g, "")
    if (
      (digitsOnly.length >= 10 && digitsOnly.startsWith("5")) ||
      (digitsOnly.length === 11 && digitsOnly.startsWith("05")) ||
      (digitsOnly.length === 12 && digitsOnly.startsWith("905"))
    ) {
      looksLikeData = true
    }
    if (/^[0-8][0-9]\s*[A-Z]{1,3}\s*[0-9]{2,4}$/i.test(str)) {
      looksLikeData = true
    }
    if (str.includes("@") && str.includes(".")) {
      looksLikeData = true
    }
  }

  const isLikelyHeader = matchedHeadersCount >= 2
  const isLikelyData = looksLikeData && matchedHeadersCount < 2

  let warning: string | undefined
  if (isLikelyData) {
    warning = "Bu satır başlık yerine müşteri verisine benziyor (telefon, plaka vb.)."
  }

  return {
    isLikelyHeader,
    isLikelyData,
    isTooEmpty: false,
    filledCellsCount: filled.length,
    matchedHeadersCount,
    warning,
  }
}

/**
 * Seçilen başlık satırı indeksine göre Excel satırlarını nesneye (Object) dönüştürür
 */
export function parseRowsFromHeaderIndex(allRawRows: any[][], headerRowIndex: number): {
  headers: string[]
  rows: Record<string, any>[]
  totalCount: number
} {
  const headerRow = allRawRows[headerRowIndex] || []
  const headers = headerRow.map((h: any, idx: number) => {
    const s = String(h || "").trim()
    return s || `Sütun_${idx + 1}`
  })

  const rawDataRows = allRawRows.slice(headerRowIndex + 1)
  const objectRows: Record<string, any>[] = rawDataRows
    .filter((r) => r && r.some((c: any) => c !== "" && c !== undefined && c !== null))
    .map((r) => {
      const obj: Record<string, any> = {}
      headers.forEach((h, cIdx) => {
        obj[h] = r[cIdx] !== undefined ? r[cIdx] : ""
      })
      return obj
    })

  // Sadece dolu veya verisi olan sütunları tut
  const meaningfulHeaders = headers.filter(
    (h) => !h.startsWith("Sütun_") || objectRows.some((row) => row[h] !== "" && row[h] !== undefined)
  )

  return {
    headers: meaningfulHeaders,
    rows: objectRows,
    totalCount: objectRows.length,
  }
}

/**
 * Excel dosyasını tarayıcıda okur ve tüm ham satırları döndürür
 */
export async function readExcelFile(file: File): Promise<{
  headers: string[]
  rows: Record<string, any>[]
  allRawRows: any[][]
  detectedHeaderRowIndex: number
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
        const allRawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" })

        if (allRawRows.length === 0) {
          throw new Error("Seçilen Excel dosyası boş.")
        }

        // Akıllı Başlık Satırı Tespiti (İlk 15 satırı tara)
        let detectedHeaderRowIndex = 0
        for (let i = 0; i < Math.min(allRawRows.length, 15); i++) {
          const row = allRawRows[i] || []
          const analysis = analyzeRowSuitability(row)
          if (analysis.isLikelyHeader) {
            detectedHeaderRowIndex = i
            break
          }
        }

        const parsed = parseRowsFromHeaderIndex(allRawRows, detectedHeaderRowIndex)

        resolve({
          headers: parsed.headers,
          rows: parsed.rows,
          allRawRows,
          detectedHeaderRowIndex,
          sheetName,
          totalCount: parsed.totalCount,
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
 * WorksAuto Kurumsal Tasarımlı Örnek Excel Şablonu Üretip İndirir
 */
export async function downloadSampleTemplate(_type: "all" | "customer" | "vehicle" = "all"): Promise<void> {
  const columns: ExportColumnDef[] = [
    { key: "fullName", label: "Müşteri Adı Soyadı", type: "text" },
    { key: "phone", label: "Telefon Numarası", type: "phone" },
    { key: "plate", label: "Araç Plakası", type: "plate" },
    { key: "brand", label: "Araç Markası", type: "text" },
    { key: "model", label: "Araç Modeli", type: "text" },
    { key: "year", label: "Model Yılı", type: "number" },
    { key: "kilometer", label: "Güncel KM", type: "number" },
    { key: "fuelType", label: "Yakıt Tipi", type: "text" },
    { key: "transmission", label: "Vites Türü", type: "text" },
    { key: "email", label: "E-Posta", type: "text" },
    { key: "companyTitle", label: "Firma Ünvanı", type: "text" },
    { key: "notes", label: "Notlar", type: "text" },
  ]

  const sampleData = [
    {
      fullName: "Ahmet Yılmaz",
      phone: "05321112233",
      plate: "34 ABC 123",
      brand: "Renault",
      model: "Megane 1.5 dCi",
      year: 2021,
      kilometer: 68000,
      fuelType: "Dizel",
      transmission: "Manuel",
      email: "ahmet@ornek.com",
      companyTitle: "",
      notes: "VIP Müşteri",
    },
    {
      fullName: "Ayşe Kaya Yılmaz",
      phone: "05423334455",
      plate: "06 ANK 06",
      brand: "Volkswagen",
      model: "Golf 1.0 TSI",
      year: 2023,
      kilometer: 24000,
      fuelType: "Benzin",
      transmission: "Otomatik",
      email: "ayse@ornek.com",
      companyTitle: "",
      notes: "Periyodik bakım takip edilecek",
    },
    {
      fullName: "Mehmet Demir",
      phone: "05559998877",
      plate: "35 IZM 35",
      brand: "Fiat",
      model: "Egea Sedan",
      year: 2022,
      kilometer: 92000,
      fuelType: "Dizel",
      transmission: "Manuel",
      email: "mehmet@filo.com",
      companyTitle: "Demir Lojistik A.Ş.",
      notes: "Filo aracı",
    },
  ]

  const blob = await generateAestheticExcel({
    title: "MÜŞTERİ & ARAÇ VERİ AKTARIM ŞABLONU",
    subtitle: "WorksAuto Müşteri ve Araç Bilgi Yükleme Formatı (Örnek Kayıtlar İçerir)",
    sheetName: "Veri Şablonu",
    columns,
    data: sampleData,
    author: "WorksAuto Sistem",
  })

  const dateStr = new Date().toISOString().split("T")[0]
  triggerDownloadBlob(blob, `WorksAuto_Sablon_${dateStr}.xlsx`)
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
