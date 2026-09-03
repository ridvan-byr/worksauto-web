"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Building2,
  Palette,
  Clock,
  Wrench,
  Users,
  Settings2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Plus,
  Trash2,
  ShieldCheck,
  Upload,
  AlertCircle,
  Car,
} from "lucide-react"
import { BrandLogo } from "@/components/shared/brand-logo"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/auth-context"
import { ServiceItem, StaffMember } from "@/features/auth/types"
import { cn } from "@/lib/utils"

const ONBOARDING_STORAGE_KEY = "worksauto_onboarding_draft"

const STEPS = [
  { id: 1, title: "Firma Kimliği", desc: "Servis adı, fatura & adres", icon: Building2 },
  { id: 2, title: "Marka & Logo", desc: "Logo ve kurumsal renk", icon: Palette },
  { id: 3, title: "Mesai Saatleri", desc: "Çalışma günleri ve saatleri", icon: Clock },
  { id: 4, title: "Hizmetler", desc: "İşçilik ve servis kataloğu", icon: Wrench },
  { id: 5, title: "Usta & Kadro", desc: "İlk teknisyen tanımları", icon: Users },
  { id: 6, title: "Randevu & Stok", desc: "Slot ve eşik ayarları", icon: Settings2 },
]

const QUICK_SERVICE_TEMPLATES = [
  { name: "Periyodik Bakım (Yağ + 4 Filtre)", durationMinutes: 60, laborPrice: 1250 },
  { name: "Ön Fren Balata Değişimi", durationMinutes: 45, laborPrice: 850 },
  { name: "Bilgisayarlı Arıza Tespit & Teşhis", durationMinutes: 30, laborPrice: 500 },
  { name: "Klima Gazı Dolumu & Kaçak Kontrolü", durationMinutes: 40, laborPrice: 950 },
  { name: "Rot-Balans & Ön Takım Kontrolü", durationMinutes: 45, laborPrice: 750 },
]

const PRESET_LOGOS = [
  { id: "p1", name: "İki Anahtar", url: "/brand/worksauto-icon-white-tight.png" },
  { id: "p2", name: "Tam Logo (Dark)", url: "/brand/worksauto-logo-dark.png" },
  { id: "p3", name: "Kare Amblem", url: "/brand/worksauto-icon-white-square.png" },
]

const PRESET_COLORS = [
  { name: "Gök Mavisi (Varsayılan)", hex: "#0284c7" },
  { name: "Zümrüt Yeşili", hex: "#059669" },
  { name: "İndigo / Gece Mavisi", hex: "#4f46e5" },
  { name: "Kehribar / Sarı", hex: "#d97706" },
  { name: "Kızıl / Crimson", hex: "#dc2626" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { user, tenant, completeOnboarding } = useAuth()

  const [currentStep, setCurrentStep] = React.useState(1)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [isSuccessModalOpen, setIsSuccessModalOpen] = React.useState(false)

  // Form State
  const [formData, setFormData] = React.useState({
    // Step 1: Company & Invoicing
    name: tenant?.name || "",
    legalName: tenant?.legalName || "",
    taxOffice: tenant?.taxOffice || "",
    taxNumber: tenant?.taxNumber || "",
    city: tenant?.city || "İstanbul",
    district: tenant?.district || "",
    address: tenant?.address || "",
    // Step 2: Branding
    logo: tenant?.logo || "/brand/worksauto-icon-white-tight.png",
    primaryColor: tenant?.primaryColor || "#0284c7",
    slogan: tenant?.slogan || "",
    // Step 3: Working Hours
    workingDays: tenant?.workingDays || ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"],
    workStartTime: tenant?.workStartTime || "08:30",
    workEndTime: tenant?.workEndTime || "18:30",
    breakStartTime: tenant?.breakStartTime || "12:30",
    breakEndTime: tenant?.breakEndTime || "13:30",
    // Step 4: Services (At least 1 required)
    services: (tenant?.services && tenant.services.length > 0) ? tenant.services : [
      { id: "s_init", name: "Periyodik Bakım (Yağ + 4 Filtre)", durationMinutes: 60, laborPrice: 1250 }
    ],
    // Step 5: Staff (At least 1 required)
    staff: (tenant?.staff && tenant.staff.length > 0) ? tenant.staff : [
      { id: "st_init", name: "Ahmet", surname: "Usta", phone: "0532 123 45 67", expertise: "Motor & Mekanik" }
    ],
    // Step 6: Settings
    appointmentSlotDuration: tenant?.appointmentSlotDuration || 45,
    autoWorkOrder: tenant?.autoWorkOrder ?? true,
    criticalStockThreshold: tenant?.criticalStockThreshold || 5,
  })

  // Load draft from localStorage if present
  React.useEffect(() => {
    try {
      const draft = localStorage.getItem(ONBOARDING_STORAGE_KEY)
      if (draft) {
        const parsed = JSON.parse(draft)
        setFormData((prev) => ({ ...prev, ...parsed }))
      }
    } catch (e) {
      // ignore
    }
  }, [])

  // Save to draft whenever formData changes
  const updateForm = (fields: Partial<typeof formData>) => {
    setFormData((prev) => {
      const next = { ...prev, ...fields }
      try {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(next))
      } catch (e) {
        // ignore
      }
      return next
    })
  }

  // Step Validations (Strict requirement compliance)
  const validateCurrentStep = (): boolean => {
    const errs: Record<string, string> = {}

    if (currentStep === 1) {
      if (!formData.name.trim()) errs.name = "Servis adı zorunludur."
      if (!formData.taxOffice.trim()) errs.taxOffice = "Vergi dairesi zorunludur."
      if (!formData.taxNumber.trim()) {
        errs.taxNumber = "Vergi numarası / TCKN zorunludur."
      } else if (formData.taxNumber.length < 10) {
        errs.taxNumber = "Vergi numarası en az 10 hane olmalıdır."
      }
      if (!formData.district.trim()) errs.district = "İlçe zorunludur."
      if (!formData.address.trim()) errs.address = "Açık servis adresi zorunludur."
    }

    if (currentStep === 2) {
      if (!formData.logo) errs.logo = "Lütfen bir servis logosu seçin veya yükleyin."
    }

    if (currentStep === 3) {
      if (!formData.workingDays || formData.workingDays.length === 0) {
        errs.workingDays = "En az bir çalışma günü seçilmelidir."
      }
    }

    if (currentStep === 4) {
      if (!formData.services || formData.services.length === 0) {
        errs.services = "En az 1 adet aktif servis/işçilik tanımı eklemelisiniz."
      }
    }

    if (currentStep === 5) {
      if (!formData.staff || formData.staff.length === 0) {
        errs.staff = "En az 1 adet usta / teknisyen personeli tanımlamalısınız."
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < 6) {
        setCurrentStep((prev) => prev + 1)
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        // Step 6 completed -> Finish Onboarding!
        setIsSuccessModalOpen(true)
      }
    }
  }

  const handlePrev = () => {
    setErrors({})
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleFinish = () => {
    try {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY)
    } catch (e) {
      // ignore
    }
    completeOnboarding(formData)
  }

  // Helper to add quick service
  const handleAddTemplateService = (tmpl: { name: string; durationMinutes: number; laborPrice: number }) => {
    const newItem: ServiceItem = {
      id: "srv_" + Date.now() + Math.random(),
      ...tmpl,
    }
    updateForm({ services: [...formData.services, newItem] })
  }

  // Helper to remove service
  const handleRemoveService = (id: string) => {
    updateForm({ services: formData.services.filter((s) => s.id !== id) })
  }

  // Helper to add staff
  const [newStaff, setNewStaff] = React.useState({ name: "", surname: "", phone: "", expertise: "Motor & Mekanik" })
  const handleAddStaff = () => {
    if (!newStaff.name.trim() || !newStaff.surname.trim()) return
    const member: StaffMember = {
      id: "st_" + Date.now(),
      ...newStaff,
    }
    updateForm({ staff: [...formData.staff, member] })
    setNewStaff({ name: "", surname: "", phone: "", expertise: "Motor & Mekanik" })
  }

  const handleRemoveStaff = (id: string) => {
    updateForm({ staff: formData.staff.filter((s) => s.id !== id) })
  }

  const progressPercent = Math.round((currentStep / 6) * 100)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#070b12]/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo collapsed={false} />
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-semibold border border-sky-500/20">
            Kurulum Sihirbazı
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>Adım <strong>{currentStep}</strong> / 6</span>
          <div className="w-24 sm:w-36 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-sky-500 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="font-bold text-sky-500">%{progressPercent}</span>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-300">
        {/* Welcome Super Admin Pre-fill Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-transparent border border-sky-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-500 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Hoş Geldiniz, Sayın <strong>{user?.name} {user?.surname}</strong>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Yetkili telefon numaranız (<strong>{user?.phone}</strong>) ve e-postanız (<strong>{user?.email}</strong>) platform yöneticisi tarafından onaylandı.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            Lisans Aktif
          </span>
        </div>

        {/* Stepper Tabs */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
          {STEPS.map((s) => {
            const Icon = s.icon
            const isCompleted = s.id < currentStep
            const isCurrent = s.id === currentStep

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  if (s.id < currentStep) {
                    setCurrentStep(s.id)
                  }
                }}
                disabled={s.id > currentStep}
                className={cn(
                  "p-2.5 rounded-2xl border transition-all text-left flex flex-col items-center sm:items-start gap-1",
                  isCurrent
                    ? "bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/20"
                    : isCompleted
                    ? "bg-white dark:bg-slate-900 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 cursor-pointer hover:border-emerald-500"
                    : "bg-slate-100/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 text-slate-400 opacity-60 cursor-not-allowed"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <Icon size={16} />
                  {isCompleted && <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />}
                </div>
                <p className="text-xs font-bold leading-tight mt-1 truncate w-full">{s.title}</p>
                <p className={cn("text-[10px] truncate w-full hidden sm:block", isCurrent ? "text-sky-100" : "text-slate-400")}>
                  {s.desc}
                </p>
              </button>
            )
          })}
        </div>

        {/* Form Card Content */}
        <div className="rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 shadow-sm space-y-6">
          
          {/* STEP 1: Company & Invoicing */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Building2 className="text-sky-500" size={20} />
                  <span>Adım 1: Servis & Fatura Kimliği</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  İş emirlerinde, müşteri randevularında ve fatura çıktılarında yer alacak yasal ve ticari bilgileri tanımlayın.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Service Name */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Servis / Atölye Adı <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateForm({ name: e.target.value })}
                    placeholder="Örn: Ege Motorlu Araçlar Özel Servisi"
                    className={cn(
                      "w-full h-11 px-3.5 rounded-xl border bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all",
                      errors.name ? "border-rose-500" : "border-slate-200 dark:border-slate-800"
                    )}
                  />
                  {errors.name && <p className="text-[11px] text-rose-500">{errors.name}</p>}
                </div>

                {/* Legal Commercial Title */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Ticari Ünvan (Fatura Başlığı)
                  </label>
                  <input
                    type="text"
                    value={formData.legalName}
                    onChange={(e) => updateForm({ legalName: e.target.value })}
                    placeholder="Örn: Ege Otomotiv Sanayi ve Ticaret Ltd. Şti."
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                </div>

                {/* Tax Office */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Vergi Dairesi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.taxOffice}
                    onChange={(e) => updateForm({ taxOffice: e.target.value })}
                    placeholder="Örn: Bornova"
                    className={cn(
                      "w-full h-11 px-3.5 rounded-xl border bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all",
                      errors.taxOffice ? "border-rose-500" : "border-slate-200 dark:border-slate-800"
                    )}
                  />
                  {errors.taxOffice && <p className="text-[11px] text-rose-500">{errors.taxOffice}</p>}
                </div>

                {/* Tax Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Vergi Numarası / TCKN <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    value={formData.taxNumber}
                    onChange={(e) => updateForm({ taxNumber: e.target.value.replace(/\D/g, "") })}
                    placeholder="10 haneli VKN veya 11 haneli TCKN"
                    className={cn(
                      "w-full h-11 px-3.5 rounded-xl border bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all",
                      errors.taxNumber ? "border-rose-500" : "border-slate-200 dark:border-slate-800"
                    )}
                  />
                  {errors.taxNumber && <p className="text-[11px] text-rose-500">{errors.taxNumber}</p>}
                </div>

                {/* City & District */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    İl <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => updateForm({ city: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all cursor-pointer"
                  >
                    <option value="İstanbul">İstanbul</option>
                    <option value="İzmir">İzmir</option>
                    <option value="Ankara">Ankara</option>
                    <option value="Bursa">Bursa</option>
                    <option value="Antalya">Antalya</option>
                    <option value="Kocaeli">Kocaeli</option>
                    <option value="Adana">Adana</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    İlçe <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => updateForm({ district: e.target.value })}
                    placeholder="Örn: Bornova"
                    className={cn(
                      "w-full h-11 px-3.5 rounded-xl border bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all",
                      errors.district ? "border-rose-500" : "border-slate-200 dark:border-slate-800"
                    )}
                  />
                  {errors.district && <p className="text-[11px] text-rose-500">{errors.district}</p>}
                </div>

                {/* Full Address */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Açık Servis Adresi <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => updateForm({ address: e.target.value })}
                    placeholder="Örn: 2. Sanayi Sitesi 352 Sokak No: 18 Bornova / İzmir"
                    className={cn(
                      "w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all resize-none",
                      errors.address ? "border-rose-500" : "border-slate-200 dark:border-slate-800"
                    )}
                  />
                  {errors.address && <p className="text-[11px] text-rose-500">{errors.address}</p>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Branding & Logo */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Palette className="text-sky-500" size={20} />
                  <span>Adım 2: Marka & Görünüm</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Müşterilerinizin randevu sayfasında ve fatura başlıklarında göreceği logo ve kurumsal renginizi belirleyin.
                </p>
              </div>

              {/* Logo Selection / Upload */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Servis Logosu <span className="text-rose-500">*</span></span>
                  <span className="text-[11px] text-slate-400">PNG, SVG veya Hazır Seçim</span>
                </label>

                {/* Logo Preview Box */}
                <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-700 p-2 flex items-center justify-center overflow-hidden shadow-inner">
                      <Image
                        src={formData.logo || "/brand/worksauto-icon-white-tight.png"}
                        alt="Logo Preview"
                        width={64}
                        height={64}
                        className="object-contain max-h-14 max-w-14"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Aktif Seçilen Logo</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Header, sidebar ve servis formlarında kullanılacaktır.</p>
                    </div>
                  </div>

                  {/* Mock Upload Button */}
                  <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 cursor-pointer shadow-sm">
                    <Upload size={14} />
                    <span>Cihazdan Yükle</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          // Mock local preview URL
                          const url = URL.createObjectURL(e.target.files[0])
                          updateForm({ logo: url })
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Preset Logo Choices */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-500">Veya Hazır Kurumsal Amblemlerden Seçin:</p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {PRESET_LOGOS.map((pl) => (
                      <button
                        key={pl.id}
                        type="button"
                        onClick={() => updateForm({ logo: pl.url })}
                        className={cn(
                          "p-3 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer",
                          formData.logo === pl.url
                            ? "border-sky-500 bg-sky-500/10 text-sky-500 font-bold"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 text-slate-600 dark:text-slate-400"
                        )}
                      >
                        <div className="w-10 h-10 rounded-lg bg-slate-900 p-1 flex items-center justify-center">
                          <Image src={pl.url} alt={pl.name} width={32} height={32} className="object-contain max-h-7 max-w-7" />
                        </div>
                        <span className="text-xs">{pl.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Primary Theme Accent Color */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Kurumsal Vurgu Rengi
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => updateForm({ primaryColor: c.hex })}
                      className={cn(
                        "p-2.5 rounded-xl border flex items-center gap-2 text-xs font-medium transition-all cursor-pointer",
                        formData.primaryColor === c.hex
                          ? "border-slate-900 dark:border-white shadow-sm bg-slate-50 dark:bg-slate-800"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      )}
                    >
                      <span className="w-4 h-4 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: c.hex }} />
                      <span className="truncate text-[11px]">{c.name.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Slogan */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Servis Sloganı / Tanıtım Metni
                </label>
                <input
                  type="text"
                  value={formData.slogan}
                  onChange={(e) => updateForm({ slogan: e.target.value })}
                  placeholder="Örn: Güvenilir, Garantili ve Hızlı Oto Bakım Çözümleri"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Working Days & Hours */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Clock className="text-sky-500" size={20} />
                  <span>Adım 3: Çalışma Günleri & Mesai Saatleri</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Randevu takviminizde araç kabul yapılacak günleri ve mesai saatlerini belirleyin.
                </p>
              </div>

              {/* Days Switch */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Açık Olunan Günler <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"].map((day) => {
                    const isSelected = formData.workingDays.includes(day)
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const next = isSelected
                            ? formData.workingDays.filter((d) => d !== day)
                            : [...formData.workingDays, day]
                          updateForm({ workingDays: next })
                        }}
                        className={cn(
                          "p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer",
                          isSelected
                            ? "bg-sky-500 text-white border-sky-500 shadow-sm"
                            : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100"
                        )}
                      >
                        <span>{day}</span>
                        {isSelected && <CheckCircle2 size={14} />}
                      </button>
                    )
                  })}
                </div>
                {errors.workingDays && <p className="text-[11px] text-rose-500">{errors.workingDays}</p>}
              </div>

              {/* Working Hours Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Mesai Başlangıç Saati
                  </label>
                  <input
                    type="time"
                    value={formData.workStartTime}
                    onChange={(e) => updateForm({ workStartTime: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Mesai Bitiş Saati
                  </label>
                  <input
                    type="time"
                    value={formData.workEndTime}
                    onChange={(e) => updateForm({ workEndTime: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Öğle Molası Başlangıcı
                  </label>
                  <input
                    type="time"
                    value={formData.breakStartTime}
                    onChange={(e) => updateForm({ breakStartTime: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Öğle Molası Bitişi
                  </label>
                  <input
                    type="time"
                    value={formData.breakEndTime}
                    onChange={(e) => updateForm({ breakEndTime: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Services & Labor Catalog */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Wrench className="text-sky-500" size={20} />
                  <span>Adım 4: Verilen Hizmetler & İşçilik Kataloğu</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Randevu ve iş emri oluştururken tek tıkla seçeceğiniz temel hizmetleri tanımlayın.
                </p>
              </div>

              {/* Quick Template Clickers */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Hızlı Şablonlardan Tek Tıkla Ekle:
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_SERVICE_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.name}
                      type="button"
                      onClick={() => handleAddTemplateService(tmpl)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sky-500/20 bg-sky-500/5 hover:bg-sky-500/15 text-sky-600 dark:text-sky-400 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>{tmpl.name}</span>
                      <span className="opacity-70 text-[10px]">({tmpl.laborPrice} ₺)</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Added Services List */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Tanımlı Hizmetler ({formData.services.length}) <span className="text-rose-500">*</span></span>
                  <span className="text-[11px] text-slate-400">En az 1 hizmet zorunludur</span>
                </label>

                {formData.services.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-rose-300 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-center text-xs text-rose-500">
                    Henüz hiçbir hizmet eklemediniz. Lütfen yukarıdaki şablonlardan en az birini ekleyin.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {formData.services.map((srv) => (
                      <div
                        key={srv.id}
                        className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between gap-3"
                      >
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{srv.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Süre: {srv.durationMinutes} dk • Taban İşçilik: <strong>{srv.laborPrice} ₺</strong>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveService(srv.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {errors.services && <p className="text-[11px] text-rose-500">{errors.services}</p>}
              </div>
            </div>
          )}

          {/* STEP 5: Staff & Mechanics */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Users className="text-sky-500" size={20} />
                  <span>Adım 5: Personel & Usta Kadrosu</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  İş emirlerini lifte alacak ve randevulara atanacak ilk usta ve teknisyenlerinizi kaydedin.
                </p>
              </div>

              {/* Add Staff Form */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-3">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Yeni Usta / Teknisyen Ekle</p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <input
                    type="text"
                    placeholder="Adı (Örn: Mehmet)"
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                    className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <input
                    type="text"
                    placeholder="Soyadı (Örn: Usta)"
                    value={newStaff.surname}
                    onChange={(e) => setNewStaff({ ...newStaff, surname: e.target.value })}
                    className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <input
                    type="tel"
                    placeholder="Telefon (05XX...)"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <select
                    value={newStaff.expertise}
                    onChange={(e) => setNewStaff({ ...newStaff, expertise: e.target.value })}
                    className="h-10 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value="Motor & Mekanik">Motor & Mekanik</option>
                    <option value="Oto Elektrik & Beyin">Oto Elektrik & Beyin</option>
                    <option value="Ön Takım & Fren">Ön Takım & Fren</option>
                    <option value="Kaporta & Boya">Kaporta & Boya</option>
                    <option value="Periyodik Bakım">Periyodik Bakım</option>
                  </select>
                </div>
                <Button
                  type="button"
                  onClick={handleAddStaff}
                  size="sm"
                  className="text-xs h-9 gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Ustayı Listeye Ekle</span>
                </Button>
              </div>

              {/* Added Staff List */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Kayıtlı Ustalar ({formData.staff.length}) <span className="text-rose-500">*</span></span>
                  <span className="text-[11px] text-slate-400">En az 1 usta tanımlanmalıdır</span>
                </label>

                {formData.staff.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-rose-300 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-center text-xs text-rose-500">
                    Henüz hiçbir usta eklemediniz. Lütfen en az bir usta tanımlayın.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {formData.staff.map((st) => (
                      <div
                        key={st.id}
                        className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-500 font-bold text-xs flex items-center justify-center shrink-0">
                            {st.name.charAt(0)}{st.surname.charAt(0)}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                              {st.name} {st.surname}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {st.expertise} • {st.phone || "Tel yok"}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveStaff(st.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {errors.staff && <p className="text-[11px] text-rose-500">{errors.staff}</p>}
              </div>
            </div>
          )}

          {/* STEP 6: Appointment & Operational Settings */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Settings2 className="text-sky-500" size={20} />
                  <span>Adım 6: Randevu & Operasyonel Ayarlar</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Randevu takvimi slot aralığını, otomatik iş emri açma kuralını ve kritik stok alarm eşiğini belirleyin.
                </p>
              </div>

              {/* Slot Duration */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Randevu Slot Periyodu <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => updateForm({ appointmentSlotDuration: mins as 30 | 45 | 60 })}
                      className={cn(
                        "p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1",
                        formData.appointmentSlotDuration === mins
                          ? "bg-sky-500 text-white border-sky-500 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                      )}
                    >
                      <span className="text-base font-bold">{mins} Dk</span>
                      <span className="text-[10px] opacity-80">
                        {mins === 30 ? "Hızlı Servis" : mins === 45 ? "Dengeli (Önerilen)" : "Kapsamlı Bakım"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto Work Order Switch */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Randevudan Otomatik İş Emri Aç
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Müşteri randevuya geldiğinde "Kabul Et" butonuna basıldığında atölye iş emri otomatik oluşturulsun.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.autoWorkOrder}
                  onChange={(e) => updateForm({ autoWorkOrder: e.target.checked })}
                  className="w-5 h-5 accent-sky-500 cursor-pointer rounded-lg"
                />
              </div>

              {/* Critical Stock Alert */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Kritik Stok Uyarı Eşiği (Adet)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={formData.criticalStockThreshold}
                  onChange={(e) => updateForm({ criticalStockThreshold: parseInt(e.target.value) || 5 })}
                  className="w-full sm:w-48 h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-semibold"
                />
                <p className="text-[11px] text-slate-400">Yedek parça stoğu bu sayının altına düştüğünde sistem bildirim üretir.</p>
              </div>
            </div>
          )}

          {/* Stepper Navigation Footer */}
          <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="h-11 px-4 gap-2 text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>Geri</span>
            </Button>

            <Button
              type="button"
              onClick={handleNext}
              className="h-11 px-6 gap-2 text-xs font-semibold cursor-pointer shadow-sm"
            >
              {currentStep === 6 ? (
                <>
                  <Sparkles size={16} />
                  <span>Kurulumu Tamamla & Paneli Başlat</span>
                </>
              ) : (
                <>
                  <span>Sonraki Adım</span>
                  <ArrowRight size={15} />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* Success Celebration Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-emerald-500 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-500 text-xs font-semibold">
                <Sparkles size={13} />
                <span>Kurulum Başarıyla Tamamlandı</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formData.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Servis kimliğiniz, logonuz, çalışma saatleriniz ve işçilik kataloğunuz başarıyla yapılandırıldı. Artık tüm operasyon paneline tam yetkiyle erişebilirsiniz!
              </p>
            </div>

            <Button
              type="button"
              onClick={handleFinish}
              className="w-full h-12 rounded-2xl text-sm font-semibold gap-2 shadow-lg shadow-sky-500/25 cursor-pointer"
            >
              <span>Servis Yönetim Paneline Geç</span>
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
