export interface WorkshopLiftDef {
  id: string
  label: string
}

export const DEFAULT_LIFTS: WorkshopLiftDef[] = [
  { id: "Lift 1", label: "Lift 1 (Genel Mekanik)" },
  { id: "Lift 2", label: "Lift 2 (Hızlı Bakım & Yağ)" },
  { id: "Lift 3", label: "Lift 3 (Ağır Bakım & Şanzıman)" },
  { id: "Lift 4", label: "Lift 4 (Rot & Balans)" },
  { id: "İstasyon A", label: "İstasyon A (Elektrik & Teşhis)" },
  { id: "Atanmamış", label: "Atanmamış (Ortak Havuz / Gezici)" },
]

export interface ServiceCategoryDef {
  id: string
  label: string
  icon: string
  badgeClass: string
}

export const SERVICE_CATEGORIES: ServiceCategoryDef[] = [
  { id: "PERIYODIK_BAKIM", label: "Periyodik Bakım & Sıvılar", icon: "🛢️", badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  { id: "FREN_SISTEMI", label: "Fren & Güvenlik Sistemleri", icon: "🛑", badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
  { id: "MOTOR_MEKANIK", label: "Motor & Mekanik Onarım", icon: "⚙️", badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  { id: "ELEKTRIK_ELEKTRONIK", label: "Elektrik & Elektronik / Akü", icon: "⚡", badgeClass: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20" },
  { id: "ON_TAKIM_SUSPANSIYON", label: "Ön Takım & Süspansiyon", icon: "🚗", badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  { id: "KLIMA_SOGUTMA", label: "Klima & Soğutma Sistemleri", icon: "❄️", badgeClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20" },
  { id: "TESHIS_EKSPERTIZ", label: "Arıza Tespiti & Diyagnostik", icon: "🔍", badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  { id: "KAPORTA_BOYA", label: "Kaporta & Boya Onarımı", icon: "🚙", badgeClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" },
  { id: "DIGER", label: "Diğer / Genel İşçilik", icon: "📦", badgeClass: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20" },
]

export function formatServiceCategory(categoryCode?: string): { label: string; icon: string; badgeClass: string } {
  if (!categoryCode) {
    return { label: "Genel Bakım", icon: "🔧", badgeClass: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20" }
  }

  const normalized = categoryCode.trim().toUpperCase()
  const found = SERVICE_CATEGORIES.find(
    (c) => c.id === normalized || c.label.toUpperCase() === normalized || c.id === normalized.replace(/\s+/g, '_')
  )
  if (found) {
    return found
  }

  // Fallback for custom or legacy categories
  return {
    label: categoryCode,
    icon: "🏷️",
    badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  }
}
