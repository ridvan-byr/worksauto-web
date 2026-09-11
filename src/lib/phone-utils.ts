/**
 * Türkiye GSM Telefon Numarası Doğrulama ve Formatlama Yardımcıları
 * 
 * GSM Standartları:
 * - Türkiye mobil GSM numaraları 10 hanelidir ve 5 ile başlar (5XX XXX XX XX).
 * - Başında 0 ile 11 hane (05XX XXX XX XX), başında +90 ile 12 hane (+90 5XX XXX XX XX).
 * - 2XX, 3XX, 4XX ile başlayan numaralar sabit hat veya il alan kodudur, SMS OTP alamaz.
 */

/**
 * Verilen telefon numarasının geçerli bir Türkiye GSM (cep telefonu) formatında olup olmadığını denetler.
 */
export function isValidTurkishGsm(phone: string | null | undefined): boolean {
  if (!phone) return false
  const digits = phone.replace(/\D/g, "")

  // 10 hane: 5XXXXXXXXX
  if (digits.length === 10 && digits.startsWith("5")) return true
  // 11 hane: 05XXXXXXXXX
  if (digits.length === 11 && digits.startsWith("05")) return true
  // 12 hane: 905XXXXXXXXX
  if (digits.length === 12 && digits.startsWith("905")) return true

  return false
}

/**
 * Telefon numarası için detaylı hata mesajı üretir.
 * Geçerli ise null döner.
 */
export function getTurkishGsmError(phone: string | null | undefined): string | null {
  if (!phone || !phone.trim()) {
    return "Cep telefonu numarası zorunludur."
  }

  const digits = phone.replace(/\D/g, "")
  if (digits.length === 0) {
    return "Lütfen geçerli bir cep telefonu numarası giriniz."
  }

  let clean = digits
  if (clean.startsWith("90")) clean = clean.slice(2)
  if (clean.startsWith("0")) clean = clean.slice(1)

  if (!clean.startsWith("5")) {
    return "Cep telefonu 05 ile başlamalıdır (Örn: 0532 123 45 67). Sabit hat veya geçersiz numara kabul edilmez."
  }

  if (clean.length < 10) {
    return `Telefon numarası eksik (${10 - clean.length} hane daha giriniz).`
  }

  if (clean.length > 10) {
    return "Telefon numarası en fazla 10 haneli (0 hariç) olabilir."
  }

  return null
}

/**
 * Kullanıcı yazı yazarken (onChange) telefon numarasını otomatik maskeleyen fonksiyon:
 * 05XX XXX XX XX formatında yapılandırır.
 */
export function formatTurkishGsmInput(value: string): string {
  if (!value) return ""

  // Sadece rakamları al
  let digits = value.replace(/\D/g, "")
  if (!digits) return ""

  // Eğer kullanıcı +90 veya 90 ile yapıştırdıysa
  if (digits.startsWith("90") && digits.length > 2) {
    digits = "0" + digits.slice(2)
  } else if (digits.startsWith("5")) {
    // 5 ile başladıysa başına otomatik 0 koy
    digits = "0" + digits
  }

  // En fazla 11 hane (05XXXXXXXXX)
  digits = digits.slice(0, 11)

  // Aşamalı boşluklu formatlama: 05XX XXX XX XX
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
 * Görüntüleme amaçlı telefon formatı: 05XX XXX XX XX
 */
export function formatTurkishGsmDisplay(phone: string | null | undefined): string {
  if (!phone) return ""
  let digits = phone.replace(/\D/g, "")
  if (digits.startsWith("90")) digits = digits.slice(2)
  if (!digits.startsWith("0")) digits = "0" + digits

  if (digits.length === 11) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`
  }
  return phone
}

/**
 * Backend için uluslararası E.164 formata getirir (+905XXXXXXXXX)
 */
export function normalizeTurkishGsm(phone: string | null | undefined): string {
  if (!phone) return ""
  let digits = phone.replace(/\D/g, "")
  if (digits.startsWith("90")) digits = digits.slice(2)
  if (digits.startsWith("0")) digits = digits.slice(1)

  if (digits.length === 10 && digits.startsWith("5")) {
    return "+90" + digits
  }
  return phone
}
