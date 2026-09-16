"use client"

export type BaseSystemRole = "TECHNICIAN" | "CONSULTANT" | "SERVICE_MANAGER"

export interface WorkshopPosition {
  id: string
  name: string
  baseRole: BaseSystemRole
  color: string
  description?: string
  isCustom?: boolean
}

export interface RolePermissionInfo {
  role: BaseSystemRole
  roleTitle: string
  badgeColor: string
  allowedFeatures: string[]
  restrictedFeatures: string[]
}

export const ROLE_PERMISSIONS: Record<BaseSystemRole, RolePermissionInfo> = {
  TECHNICIAN: {
    role: "TECHNICIAN",
    roleTitle: "Atölye Teknisyeni / Usta",
    badgeColor: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    allowedFeatures: [
      "Kendisine ve liftine atanan iş emirlerini görme",
      "İş emri işçilik adımlarını tamamlama ve süre girme",
      "Araç ekspertiz ve parça hasar fotoğrafları yükleme",
      "Haftalık ve aylık çalışma/vardiya takvimini görüntüleme",
      "Atölye istasyon panosunu canlı takip etme",
    ],
    restrictedFeatures: [
      "Günlük, aylık ciro ve kasa finans raporlarını göremez",
      "E-Fatura veya e-arşiv belgesi kesemez",
      "İşletme ayarlarını, PayTR ve entegratörleri değiştiremez",
      "Diğer çalışanların bilgilerini ve yetkilerini düzenleyemez",
    ],
  },
  CONSULTANT: {
    role: "CONSULTANT",
    roleTitle: "Servis Danışmanı / Müşteri Kabul",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    allowedFeatures: [
      "Yeni müşteri ve araç kabulü (Hızlı Kabul)",
      "Randevu oluşturma, düzenleme ve erteleme",
      "Yeni iş emri oluşturma ve durum güncelleme",
      "Müşteriye WhatsApp / SMS ile canlı takip linki gönderme",
      "Yedek parça ve stok sorgulama",
    ],
    restrictedFeatures: [
      "Ana ciro, kar/zarar ve şirket finans raporlarını göremez",
      "Banka/IBAN ve PayTR ödeme ayarlarını değiştiremez",
      "Firma yasal unvan ve şirket bilgilerini güncelleyemez",
    ],
  },
  SERVICE_MANAGER: {
    role: "SERVICE_MANAGER",
    roleTitle: "Servis Yöneticisi / Atölye Şefi",
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    allowedFeatures: [
      "Tüm atölye operasyonu, ustalar ve lift yönetimi",
      "Tüm iş emirleri, faturalar ve tahsilat takibi",
      "Günlük kasa, ciro ve performans raporlarına tam erişim",
      "Personel ekleme, vardiya planlama ve izin onaylama",
      "Stok kataloğu ve fiyatlandırma yönetimi",
    ],
    restrictedFeatures: [
      "Şirket aboneliği ve yasal devir yetkisi yalnızca Ana İşletme Sahibine (Owner) aittir",
    ],
  },
}

export const DEFAULT_POSITIONS: WorkshopPosition[] = [
  { id: "bas-usta", name: "Baş Usta", baseRole: "TECHNICIAN", color: "sky" },
  { id: "motor-mekanik", name: "Motor & Mekanik Ustası", baseRole: "TECHNICIAN", color: "blue" },
  { id: "oto-elektrik", name: "Oto Elektrik & Elektronik", baseRole: "TECHNICIAN", color: "amber" },
  { id: "on-duzen", name: "Ön Düzen & Rot-Balans", baseRole: "TECHNICIAN", color: "emerald" },
  { id: "sanziman", name: "Şanzıman & Aktarma Uzmanı", baseRole: "TECHNICIAN", color: "indigo" },
  { id: "klima-gaz", name: "Klima & Gaz Dolum Teknisyeni", baseRole: "TECHNICIAN", color: "cyan" },
  { id: "hasar-danismani", name: "Hasar & Ekspertiz Danışmanı", baseRole: "CONSULTANT", color: "teal" },
  { id: "servis-danismani", name: "Müşteri Kabul & Servis Danışmanı", baseRole: "CONSULTANT", color: "emerald" },
  { id: "yedek-parca", name: "Yedek Parça & Depo Sorumlusu", baseRole: "CONSULTANT", color: "violet" },
  { id: "servis-muduru", name: "Atölye Şefi / Servis Müdürü", baseRole: "SERVICE_MANAGER", color: "purple" },
  { id: "cirak-kalfa", name: "Çırak / Kalfa", baseRole: "TECHNICIAN", color: "slate" },
]

const STORAGE_KEY = "worksauto_tenant_positions"

export function getTenantPositions(): WorkshopPosition[] {
  if (typeof window === "undefined") return DEFAULT_POSITIONS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_POSITIONS
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
  } catch {}
  return DEFAULT_POSITIONS
}

export function saveTenantPositions(positions: WorkshopPosition[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions))
  } catch {}
}
