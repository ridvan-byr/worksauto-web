"use client"

import * as React from "react"
import { ArrowRight, ArrowLeft, Sparkles, ShieldCheck } from "lucide-react"
import { BrandLogo } from "@/components/shared/brand-logo"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/auth-context"
import { ServiceItem, StaffMember } from "@/features/auth/types"
import { OnboardingStepper } from "@/features/onboarding/components/onboarding-stepper"
import { StepCompanyInfo } from "@/features/onboarding/components/step-company-info"
import { StepWorkingHours } from "@/features/onboarding/components/step-working-hours"
import { StepServices } from "@/features/onboarding/components/step-services"
import { StepStaff } from "@/features/onboarding/components/step-staff"
import { StepWorkshopSettings } from "@/features/onboarding/components/step-workshop-settings"
import { OnboardingSuccessModal } from "@/features/onboarding/components/onboarding-success-modal"
import { useTenantSettings } from "@/features/settings/api/use-settings"

const ONBOARDING_STORAGE_KEY = "worksauto_onboarding_draft"

export default function OnboardingPage() {
  const { user, tenant, completeOnboarding } = useAuth()
  const { data: serverTenant } = useTenantSettings()

  const [currentStep, setCurrentStep] = React.useState(1)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [isSuccessModalOpen, setIsSuccessModalOpen] = React.useState(false)

  // Form State
  const [formData, setFormData] = React.useState({
    name: tenant?.name || "",
    legalName: tenant?.legalName || "",
    taxOffice: tenant?.taxOffice || "",
    taxNumber: tenant?.taxNumber || "",
    city: tenant?.city || "İstanbul",
    district: tenant?.district || "",
    address: tenant?.address || "",
    workingDays: tenant?.workingDays || ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"],
    workStartTime: tenant?.workStartTime || "08:30",
    workEndTime: tenant?.workEndTime || "18:30",
    breakStartTime: tenant?.breakStartTime || "12:30",
    breakEndTime: tenant?.breakEndTime || "13:30",
    services: (tenant?.services && tenant.services.length > 0) ? tenant.services : [
      { id: "s_init", name: "Periyodik Bakım (Yağ + 4 Filtre)", category: "Periyodik Bakım", durationMinutes: 60, laborPrice: 1250 }
    ],
    staff: (tenant?.staff && tenant.staff.length > 0) ? tenant.staff : [
      { id: "st_init", name: "Ahmet", surname: "Usta", phone: "0532 123 45 67", expertise: "Motor & Mekanik" }
    ],
    appointmentSlotDuration: tenant?.appointmentSlotDuration || 45,
    activeLiftCount: tenant?.activeLiftCount || 3,
    autoWorkOrder: tenant?.autoWorkOrder ?? true,
    notifyAppointmentReminder: tenant?.notifyAppointmentReminder ?? true,
    notifyReadyForPickup: tenant?.notifyReadyForPickup ?? true,
    criticalStockThreshold: tenant?.criticalStockThreshold || 5,
  })

  // Prefill from server tenant if available (Superadmin entries)
  React.useEffect(() => {
    if (serverTenant) {
      setFormData((prev) => ({
        ...prev,
        name: serverTenant.title || prev.name,
        legalName: serverTenant.legalName || prev.legalName,
        taxOffice: serverTenant.taxOffice || prev.taxOffice,
        taxNumber: serverTenant.taxNumber || prev.taxNumber,
        city: serverTenant.city || prev.city,
        district: serverTenant.district || prev.district,
        address: serverTenant.address || prev.address,
      }))
    }
  }, [serverTenant])

  // Load draft from localStorage if present
  React.useEffect(() => {
    try {
      const draft = localStorage.getItem(ONBOARDING_STORAGE_KEY)
      if (draft) {
        const parsed = JSON.parse(draft)
        setFormData((prev) => ({ ...prev, ...parsed }))
      }
    } catch {
      // ignore
    }
  }, [])

  const updateForm = (fields: Partial<typeof formData>) => {
    setFormData((prev) => {
      const next = { ...prev, ...fields }
      try {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }

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
      if (!formData.workingDays || formData.workingDays.length === 0) {
        errs.workingDays = "En az bir çalışma günü seçilmelidir."
      }
    }

    if (currentStep === 3) {
      if (!formData.services || formData.services.length === 0) {
        errs.services = "En az 1 adet aktif servis/işçilik tanımı eklemelisiniz."
      }
    }

    if (currentStep === 4) {
      if (!formData.staff || formData.staff.length === 0) {
        errs.staff = "En az 1 adet usta / teknisyen personeli tanımlamalısınız."
      } else {
        const invalidStaff = formData.staff.find(
          (s) => !s.phone || s.phone.replace(/\D/g, "").length < 10
        )
        if (invalidStaff) {
          errs.staff = `"${invalidStaff.name} ${invalidStaff.surname}" personeli için geçerli bir cep telefonu numarası (05xx...) zorunludur. Personel panele telefon numarasıyla giriş yapmaktadır.`
        }
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < 5) {
        setCurrentStep((prev) => prev + 1)
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else {
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
    } catch {
      // ignore
    }
    completeOnboarding(formData)
  }

  // Service helper handlers
  const handleAddTemplateService = (tmpl: { name: string; category: string; durationMinutes: number; laborPrice: number }) => {
    const isAlreadyAdded = formData.services.some((s) => s.name.toLowerCase() === tmpl.name.toLowerCase())
    if (isAlreadyAdded) return

    const newItem: ServiceItem = {
      id: "srv_" + Date.now() + Math.random(),
      ...tmpl,
    }
    updateForm({ services: [...formData.services, newItem] })
  }

  const handleAddCustomService = (service: Omit<ServiceItem, "id">) => {
    const isAlreadyAdded = formData.services.some((s) => s.name.toLowerCase() === service.name.toLowerCase())
    if (isAlreadyAdded) return

    const newItem: ServiceItem = {
      id: "srv_" + Date.now(),
      ...service,
    }
    updateForm({ services: [...formData.services, newItem] })
  }

  const handleUpdateServiceItem = (id: string, updates: Partial<ServiceItem>) => {
    updateForm({
      services: formData.services.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })
  }

  const handleRemoveService = (id: string) => {
    updateForm({ services: formData.services.filter((s) => s.id !== id) })
  }

  // Staff helper handlers
  const handleAddStaff = (staffMember: Omit<StaffMember, "id">) => {
    const member: StaffMember = {
      id: "st_" + Date.now(),
      ...staffMember,
    }
    updateForm({ staff: [...formData.staff, member] })
  }

  const handleRemoveStaff = (id: string) => {
    updateForm({ staff: formData.staff.filter((s) => s.id !== id) })
  }

  const progressPercent = Math.round((currentStep / 5) * 100)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      {/* Top Sticky Header */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#070b12]/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <BrandLogo collapsed={true} className="sm:hidden" />
          <BrandLogo collapsed={false} className="hidden sm:flex" />
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs font-semibold border border-slate-200 dark:border-slate-700 whitespace-nowrap">
            Kurulum
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium">Adım <strong>{currentStep}</strong>/5</span>
          <div className="w-16 sm:w-32 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-slate-900 dark:bg-slate-100 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">%{progressPercent}</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-7 animate-in fade-in duration-300">
        {/* Welcome Account Info Banner */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Hoş Geldiniz, <strong>{user?.name} {user?.surname}</strong>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                Tel: <strong>{user?.phone}</strong> • Mail: <strong>{user?.email}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Stepper Navigation */}
        <OnboardingStepper currentStep={currentStep} onStepClick={setCurrentStep} />

        {/* Form Card Content */}
        <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-8 shadow-sm space-y-5 sm:space-y-6">
          {currentStep === 1 && (
            <StepCompanyInfo data={formData} errors={errors} onChange={updateForm} />
          )}

          {currentStep === 2 && (
            <StepWorkingHours data={formData} errors={errors} onChange={updateForm} />
          )}

          {currentStep === 3 && (
            <StepServices
              services={formData.services}
              errors={errors}
              onAddTemplateService={handleAddTemplateService}
              onAddCustomService={handleAddCustomService}
              onUpdateServiceItem={handleUpdateServiceItem}
              onRemoveService={handleRemoveService}
            />
          )}

          {currentStep === 4 && (
            <StepStaff
              staff={formData.staff}
              errors={errors}
              onAddStaff={handleAddStaff}
              onRemoveStaff={handleRemoveStaff}
            />
          )}

          {currentStep === 5 && (
            <StepWorkshopSettings data={formData} onChange={updateForm} />
          )}

          {/* Navigation Footer Buttons */}
          <div className="pt-5 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="h-11 px-3.5 sm:px-4 gap-1.5 text-xs font-semibold cursor-pointer border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft size={14} />
              <span>Geri</span>
            </Button>

            <Button
              type="button"
              onClick={handleNext}
              className="h-11 px-5 sm:px-6 gap-1.5 text-xs font-semibold cursor-pointer shadow-sm flex-1 sm:flex-none justify-center bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-950"
            >
              {currentStep === 5 ? (
                <>
                  <Sparkles size={15} />
                  <span>Kurulumu Tamamla</span>
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
      <OnboardingSuccessModal
        isOpen={isSuccessModalOpen}
        companyName={formData.name}
        onFinish={handleFinish}
      />
    </div>
  )
}
