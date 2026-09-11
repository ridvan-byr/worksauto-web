/**
 * İsim ve Soyisim Doğrulama ve Formatlama Yardımcıları
 * 
 * Standartlar:
 * - Yalnızca Türkçe ve Latin harflerine izin verilir (a-z, A-Z, çÇ, ğĞ, ıI, İi, öÖ, şŞ, üÜ).
 * - Rakamlar (0-9) ve özel simgeler (!@#$%^&* vb.) kesinlikle kabul edilmez.
 * - İsimler Title Case formatına (her kelimenin ilk harfi büyük, kalanı küçük) çevrilir.
 */

/**
 * Kullanıcı klavyeden yazarken veya yapıştırırken rakam ve özel simgeleri anında süzen fonksiyon.
 */
export function filterPersonNameInput(value: string): string {
  if (!value) return ""
  // Sadece Türkçe/Latin harfler ve boşlukları kabul et, birden fazla ardışık boşluğu teke indir
  return value
    .replace(/[^a-zA-ZçÇğĞıIİiöÖşŞüÜ\s]/g, "")
    .replace(/\s{2,}/g, " ")
}

/**
 * İsmi düzgün büyük/küçük harf formatına (Title Case) çevirir.
 * Örn: "mehmet ali" -> "Mehmet Ali", "öztürk" -> "Öztürk", "ışık" -> "Işık"
 */
export function formatPersonName(name: string): string {
  if (!name) return ""
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (word.length === 0) return ""
      const firstLetter = word.charAt(0).toLocaleUpperCase("tr-TR")
      const rest = word.slice(1).toLocaleLowerCase("tr-TR")
      return firstLetter + rest
    })
    .join(" ")
}

/**
 * Ad veya soyad alanının geçerliliğini denetler.
 */
export function validatePersonName(
  value: string | null | undefined,
  fieldLabel = "Ad"
): { isValid: boolean; error: string | null; formatted: string } {
  if (!value || !value.trim()) {
    return {
      isValid: false,
      error: `${fieldLabel} alanı boş bırakılamaz.`,
      formatted: "",
    }
  }

  const trimmed = value.trim()

  // Sadece harf ve boşluk kontrolü
  const regex = /^[a-zA-ZçÇğĞıIİiöÖşŞüÜ\s]+$/
  if (!regex.test(trimmed)) {
    return {
      isValid: false,
      error: `${fieldLabel} yalnızca harflerden oluşmalıdır. Sayı, rakam veya özel simge içeremez.`,
      formatted: trimmed,
    }
  }

  const clean = trimmed.replace(/\s+/g, " ")
  if (clean.length < 2) {
    return {
      isValid: false,
      error: `${fieldLabel} en az 2 harften oluşmalıdır.`,
      formatted: clean,
    }
  }

  if (clean.length > 50) {
    return {
      isValid: false,
      error: `${fieldLabel} en fazla 50 karakter olabilir.`,
      formatted: clean,
    }
  }

  return {
    isValid: true,
    error: null,
    formatted: formatPersonName(clean),
  }
}
