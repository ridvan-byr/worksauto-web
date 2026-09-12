/**
 * WorksAuto Akıllı ve Esnek İnput Formatlama / Maskeleme Yardımcıları
 * 
 * Bu modül, veri bütünlüğünü sağlarken yabancı plaka, uluslararası GSM numaraları
 * gibi gerçek hayat durumlarında kullanıcıyı engellemeyen esnek yardımcı fonksiyonlar içerir.
 */

/**
 * Akıllı Plaka Formatlayıcı:
 * - Harfleri Türkçe standartlarında büyütür (i -> İ, ı -> I).
 * - TR Standart Plaka (2 Hane İl Kodu + Harf Grubu + Sayı Grubu):
 *   Kullanıcı bitişik yazsa bile (örn: "34abc123", "06a1234", "35ab123")
 *   otomatik olarak "34 ABC 123", "06 A 1234" standardına böler.
 * - Yabancı / Özel / Diplomatik Plakalar:
 *   (Örn: "M-AB 1234", "AA-123-BB", "CB 8888 BP", "06 CD 123")
 *   Sistemi asla kilitlemez; harfleri büyütüp gereksiz çift boşlukları temizleyerek kabul eder.
 */
export function formatSmartPlate(value: string | null | undefined): string {
  if (!value) return ""
  
  // Türkçe büyük harfe çevir ve baştaki/sondaki fazla boşlukları temizle
  const upper = value.toLocaleUpperCase("tr-TR").replace(/\s+/g, " ")

  // Kullanıcı tire kullanmışsa yabancı plaka olabilir, tireyi ve boşluğu koru
  if (upper.includes("-")) {
    return upper.replace(/[^A-ZÇĞIİÖŞÜ0-9\s-]/g, "").slice(0, 15)
  }

  const cleaned = upper.replace(/[^A-ZÇĞIİÖŞÜ0-9]/g, "")
  if (!cleaned) return ""

  // Türk Plaka Algoritması: 2 rakamla başlar (01-81)
  const startsWithTrCity = /^[0-8][0-9]/.test(cleaned)

  if (startsWithTrCity) {
    const city = cleaned.slice(0, 2)
    const rest = cleaned.slice(2)

    // Sadece il kodu girildiyse
    if (!rest) return city

    // İl kodundan sonra harfler ve ardından rakamlar
    const match = rest.match(/^([A-ZÇĞIİÖŞÜ]+)(\d*)$/)
    if (match) {
      const letters = match[1].slice(0, 4) // En fazla 3-4 harf
      const digits = match[2].slice(0, 5) // En fazla 4-5 rakam
      return digits ? `${city} ${letters} ${digits}` : `${city} ${letters}`
    }
  }

  // Yabancı veya standart dışı plaka (örn: harfle başlayanlar "M AB 1234", "AA 123")
  return upper.slice(0, 15)
}

/**
 * Akıllı Telefon Formatlayıcı:
 * - "+" ile başlıyorsa uluslararası formatı korur (Örn: +49 170 1234567, +33 6 12 34 56 78).
 * - "05" veya "5" ile başlıyorsa Türkiye GSM maskesini işletir: 05XX XXX XX XX
 * - "02", "03", "04" ile başlıyorsa Türkiye sabit hat maskesini işletir: 0XXX XXX XX XX
 */
export function formatSmartPhone(value: string | null | undefined): string {
  if (!value) return ""

  const trimmed = value.trim()

  // 1. Uluslararası Telefon Numarası (+ ile başlayan)
  if (trimmed.startsWith("+")) {
    // Sadece + ve rakamları ve tek boşlukları al
    const cleanPlus = "+" + trimmed.slice(1).replace(/[^\d\s]/g, "").replace(/\s+/g, " ")
    return cleanPlus.slice(0, 20)
  }

  // 2. Türkiye Numaraları (Sadece rakamları ayıkla)
  let digits = value.replace(/\D/g, "")
  if (!digits) return ""

  // Kullanıcı 90 ile yapıştırdıysa
  if (digits.startsWith("90") && digits.length > 2) {
    digits = "0" + digits.slice(2)
  } else if (digits.startsWith("5")) {
    digits = "0" + digits
  }

  // En fazla 11 hane (0XXXXXXXXXX)
  digits = digits.slice(0, 11)

  // Aşamalı boşluklu formatlama: 0XXX XXX XX XX
  if (digits.length <= 4) {
    return digits
  }
  if (digits.length <= 7) {
    return `${digits.slice(0, 4)} ${digits.slice(4)}`
  }
  if (digits.length <= 9) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
  }
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`
}

/**
 * Kilometre Formatlayıcı:
 * - Sadece rakam kabul eder.
 * - Binlik basamakları nokta ile ayırır (örn: 145000 -> "145.000").
 * - Form durumunu beslemek için hem formatlı string hem de ham number döner.
 */
export function formatKilometer(value: string | number | null | undefined): {
  formatted: string
  raw: number
} {
  if (value === null || value === undefined || value === "") {
    return { formatted: "", raw: 0 }
  }

  const digits = String(value).replace(/\D/g, "").slice(0, 7) // max 9.999.999 km
  if (!digits) {
    return { formatted: "", raw: 0 }
  }

  const raw = parseInt(digits, 10) || 0
  const formatted = raw.toLocaleString("tr-TR")

  return { formatted, raw }
}

/**
 * Şasi Numarası (VIN) Formatlayıcı:
 * - Uluslararası ISO 3779 standardına göre 17 karakterdir.
 * - 'I', 'O', 'Q' harfleri (1 ve 0 ile karışmaması için) yasaktır, otomatik temizlenir.
 * - Tamamı büyük harfe dönüştürülür.
 */
export function formatVinNumber(value: string | null | undefined): string {
  if (!value) return ""
  return value
    .toUpperCase()
    .replace(/[^A-HJ-NPR-Z0-9]/g, "") // I, O, Q harfleri hariç A-Z ve 0-9
    .slice(0, 17)
}

/**
 * Vergi Numarası / TCKN Formatlayıcı:
 * - Sadece rakam kabul eder.
 * - Kurumsal VKN ise 10 haneye sınırlandırır.
 * - Bireysel TCKN ise 11 haneye sınırlandırır.
 */
export function formatTaxNumber(
  value: string | null | undefined,
  type: "vkn" | "tckn" | "auto" = "auto"
): string {
  if (!value) return ""
  const digits = value.replace(/\D/g, "")
  const maxLen = type === "vkn" ? 10 : 11
  return digits.slice(0, maxLen)
}

/**
 * IBAN Formatlayıcı:
 * - Rakam yazıldıkça başına otomatik 'TR' koyar.
 * - 4'erli bloklar halinde boşluklandırır: TR00 0000 0000 0000 0000 0000 00
 * - Maksimum 26 hane (boşluklarla 32 karakter).
 */
export function formatIban(value: string | null | undefined): string {
  if (!value) return ""
  
  let cleaned = value.replace(/\s+/g, "").toUpperCase()
  if (!cleaned) return ""

  // Başında TR yoksa ve rakamla başladıysa TR ekle
  if (/^\d/.test(cleaned)) {
    cleaned = "TR" + cleaned
  }

  // İlk 2 harf TR olmalı, kalanı sadece rakam
  const letters = cleaned.slice(0, 2).replace(/[^A-Z]/g, "")
  const numbers = cleaned.slice(2).replace(/\D/g, "").slice(0, 24)

  const raw = letters + numbers
  if (raw.length <= 2) return raw

  // 4'erli bloklara böl
  const parts: string[] = []
  for (let i = 0; i < raw.length; i += 4) {
    parts.push(raw.slice(i, i + 4))
  }

  return parts.join(" ")
}

/**
 * Baş Harf Büyütme (Title Case):
 * - Kullanıcı yazarken ad, soyad ve şirket isimlerini düzgün baş harfle biçimlendirir.
 */
export function formatTitleCase(value: string | null | undefined): string {
  if (!value) return ""
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/(?:^|\s)\S/g, (a) => a.toLocaleUpperCase("tr-TR"))
}
