"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  X,
  UserPlus,
  Car,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Customer, Vehicle } from "../types"
import { PlateBadge } from "./plate-badge"
import { cn } from "@/lib/utils"
import {
  createCustomerStep1Schema,
  createCustomerStep2Schema,
} from "../schemas/customer.schema"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

interface CreateCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (customer: Customer) => void
}

// Unified multi-step customer + vehicle form schema
const fullCustomerFormSchema = z.object({
  customerType: z.enum(["individual", "corporate"]),
  name: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
  surname: z.string().default(""),
  companyTitle: z.string().default(""),
  taxOffice: z.string().default(""),
  taxNumber: z.string().default(""),
  phone: z.string().min(10, "Geçerli bir telefon numarası giriniz (en az 10 hane)"),
  email: z.string().default(""),
  city: z.string().default("İstanbul"),
  district: z.string().default(""),
  plate: z.string().min(2, "Plaka zorunludur."),
  brand: z.string().min(1, "Marka zorunludur."),
  model: z.string().min(1, "Model zorunludur."),
  year: z.number().min(1950, "Model yılı 1950 den küçük olamaz").max(new Date().getFullYear() + 1),
  kilometer: z.number().min(0, "Kilometre negatif olamaz."),
  fuelType: z.enum(["Benzin", "Dizel", "LPG", "Hibrit", "Elektrik"]),
  transmission: z.enum(["Manuel", "Otomatik"]),
}).superRefine((data, ctx) => {
  if (data.customerType === "individual") {
    if (!data.surname || data.surname.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Soyad zorunludur.",
        path: ["surname"],
      });
    }
  } else {
    if (!data.companyTitle || data.companyTitle.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Şirket ünvanı zorunludur.",
        path: ["companyTitle"],
      });
    }
    if (!data.taxNumber || data.taxNumber.trim().length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Kurumsal müşteriler için en az 10 haneli Vergi Numarası zorunludur.",
        path: ["taxNumber"],
      });
    }
  }
});

type FullCustomerFormValues = z.infer<typeof fullCustomerFormSchema>;

export function CreateCustomerModal({ isOpen, onClose, onCreated }: CreateCustomerModalProps) {
  const [mounted, setMounted] = React.useState(false)
  const [currentStep, setCurrentStep] = React.useState<1 | 2>(1)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    reset,
    formState: { errors },
  } = useForm<FullCustomerFormValues>({
    resolver: zodResolver(fullCustomerFormSchema) as any,
    defaultValues: {
      customerType: "individual",
      name: "",
      surname: "",
      companyTitle: "",
      taxOffice: "",
      taxNumber: "",
      phone: "",
      email: "",
      city: "İstanbul",
      district: "",
      plate: "",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      kilometer: 45000,
      fuelType: "Benzin",
      transmission: "Otomatik",
    },
    mode: "onTouched",
  })

  const customerType = watch("customerType")
  const plateValue = watch("plate")

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = "auto"
      }
    }
  }, [isOpen])

  if (!isOpen || !mounted) return null

  // Phone Formatter
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "")
    if (raw.length === 0) {
      setValue("phone", "", { shouldValidate: true })
      return
    }
    let formatted = raw.startsWith("0") ? raw.slice(0, 11) : "0" + raw.slice(0, 10)
    let res = "0"
    if (formatted.length > 1) res += " (" + formatted.slice(1, 4)
    if (formatted.length >= 4) res += ") " + formatted.slice(4, 7)
    if (formatted.length >= 7) res += " " + formatted.slice(7, 9)
    if (formatted.length >= 9) res += " " + formatted.slice(9, 11)
    setValue("phone", res, { shouldValidate: true })
  }

  // Validate Step 1 before transitioning to Step 2
  const handleNextStep = async () => {
    const isValid = await trigger([
      "customerType",
      "name",
      "surname",
      "companyTitle",
      "taxOffice",
      "taxNumber",
      "phone",
      "email",
      "city",
      "district",
    ])

    if (isValid) {
      setCurrentStep(2)
    }
  }

  // Form Submission
  const onFormSubmit = (data: FullCustomerFormValues) => {
    const newCustomerId = "cust_" + Date.now()
    const newVehicleId = "veh_" + Date.now()

    const initialVehicle: Vehicle = {
      id: newVehicleId,
      tenantId: "tenant_1",
      customerId: newCustomerId,
      plate: data.plate.toUpperCase().trim(),
      brand: data.brand.trim(),
      model: data.model.trim(),
      year: Number(data.year) || new Date().getFullYear(),
      kilometer: Number(data.kilometer) || 0,
      fuelType: data.fuelType,
      transmission: data.transmission,
      lastServiceDate: new Date().toISOString().split("T")[0],
    }

    const newCustomer: Customer = {
      id: newCustomerId,
      tenantId: "tenant_1",
      type: data.customerType,
      name: data.name.trim(),
      surname: data.surname ? data.surname.trim() : "",
      companyTitle: data.customerType === "corporate" ? data.companyTitle?.trim() : undefined,
      taxOffice: data.customerType === "corporate" ? data.taxOffice?.trim() : undefined,
      taxNumber: data.customerType === "corporate" ? data.taxNumber?.trim() : undefined,
      phone: data.phone,
      email: data.email ? data.email.trim() : undefined,
      city: data.city,
      district: data.district ? data.district.trim() : undefined,
      balance: 0,
      vehicles: [initialVehicle],
      appointments: [],
      workOrders: [],
      invoices: [],
      movements: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    onCreated(newCustomer)
    reset()
    setCurrentStep(1)
    onClose()
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              {currentStep === 1 ? <UserPlus size={18} /> : <Car size={18} />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{currentStep === 1 ? "1. Müşteri İletişim Bilgileri" : "2. İlk Araç Bilgileri"}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-500">
                  Adım {currentStep}/2
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {currentStep === 1 ? "Araç sahibinin iletişim ve fatura detayları" : "Müşteriye ait ilk plaka ve teknik bilgiler"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* STEP 1: CUSTOMER CONTACT */}
        {currentStep === 1 && (
          <div className="p-6 space-y-4 animate-in fade-in duration-200">
            {/* Type Switch */}
            <div className="flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setValue("customerType", "individual", { shouldValidate: true })}
                className={cn(
                  "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                  customerType === "individual"
                    ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                )}
              >
                <User size={13} />
                <span>Bireysel Müşteri</span>
              </button>
              <button
                type="button"
                onClick={() => setValue("customerType", "corporate", { shouldValidate: true })}
                className={cn(
                  "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                  customerType === "corporate"
                    ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                )}
              >
                <Building2 size={13} />
                <span>Kurumsal (Şirket / Filo)</span>
              </button>
            </div>

            {/* Fields */}
            <div className="space-y-3">
              {customerType === "corporate" && (
                <>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Şirket Ticari Ünvanı <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Ege Lojistik A.Ş."
                      {...register("companyTitle")}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    {errors.companyTitle && <p className="text-[10px] text-rose-500">{errors.companyTitle.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Vergi Dairesi
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: İkitelli V.D."
                        {...register("taxOffice")}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                      {errors.taxOffice && <p className="text-[10px] text-rose-500">{errors.taxOffice.message}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Vergi No <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="10 veya 11 haneli"
                        maxLength={11}
                        {...register("taxNumber", {
                          onChange: (e) => setValue("taxNumber", e.target.value.replace(/\D/g, '')),
                        })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                      {errors.taxNumber && <p className="text-[10px] text-rose-500">{errors.taxNumber.message}</p>}
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {customerType === "corporate" ? "Yetkili Adı" : "Müşteri Adı"} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Rıdvan"
                    {...register("name")}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  {errors.name && <p className="text-[10px] text-rose-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {customerType === "corporate" ? "Yetkili Soyadı" : "Müşteri Soyadı"} {customerType === "individual" && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Bayar"
                    {...register("surname")}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  {errors.surname && <p className="text-[10px] text-rose-500">{errors.surname.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Telefon Numarası <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="0 (5XX) XXX XX XX"
                    value={watch("phone")}
                    onChange={handlePhoneChange}
                    maxLength={17}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  {errors.phone && <p className="text-[10px] text-rose-500">{errors.phone.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    E-Posta (İsteğe Bağlı)
                  </label>
                  <input
                    type="email"
                    placeholder="musteri@eposta.com"
                    {...register("email")}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  {errors.email && <p className="text-[10px] text-rose-500">{errors.email.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">İl</label>
                  <input
                    type="text"
                    {...register("city")}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  {errors.city && <p className="text-[10px] text-rose-500">{errors.city.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">İlçe</label>
                  <input
                    type="text"
                    placeholder="Örn: Kadıköy"
                    {...register("district")}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  {errors.district && <p className="text-[10px] text-rose-500">{errors.district.message}</p>}
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-10 px-4 text-xs font-semibold cursor-pointer"
              >
                Vazgeç
              </Button>
              <Button
                type="button"
                onClick={handleNextStep}
                className="h-10 px-5 text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <span>Araç Bilgilerine Geç</span>
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: VEHICLE INFO */}
        {currentStep === 2 && (
          <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-4 animate-in fade-in duration-200">
            {/* Live Plate Badge Preview */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="text-xs">
                <p className="font-bold text-slate-900 dark:text-slate-100">
                  {customerType === "corporate" ? watch("companyTitle") : `${watch("name")} ${watch("surname") || ""}`}
                </p>
                <p className="text-[10px] text-slate-500">{watch("phone")}</p>
              </div>
              {plateValue ? (
                <PlateBadge plate={plateValue} size="sm" />
              ) : (
                <span className="text-[10px] text-slate-400 italic">Plaka bekleniyor...</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="col-span-2 space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Plaka <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="34 ABC 123"
                  value={watch("plate")}
                  onChange={(e) => setValue("plate", e.target.value.toUpperCase(), { shouldValidate: true })}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-mono font-bold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-sky-500"
                  autoFocus
                />
                {errors.plate && <p className="text-[10px] text-rose-500">{errors.plate.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Marka <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: BMW"
                  {...register("brand")}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {errors.brand && <p className="text-[10px] text-rose-500">{errors.brand.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Model <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: 320i M Sport"
                  {...register("model")}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {errors.model && <p className="text-[10px] text-rose-500">{errors.model.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Model Yılı</label>
                <input
                  type="number"
                  min={1950}
                  max={new Date().getFullYear() + 1}
                  {...register("year", { valueAsNumber: true })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono text-center focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {errors.year && <p className="text-[10px] text-rose-500">{errors.year.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Mevcut KM</label>
                <input
                  type="number"
                  min={0}
                  {...register("kilometer", { valueAsNumber: true })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {errors.kilometer && <p className="text-[10px] text-rose-500">{errors.kilometer.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Yakıt</label>
                <select
                  {...register("fuelType")}
                  className="w-full h-10 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="Benzin">Benzin</option>
                  <option value="Dizel">Dizel</option>
                  <option value="Hibrit">Hibrit</option>
                  <option value="Elektrik">Elektrik</option>
                  <option value="LPG">LPG</option>
                </select>
                {errors.fuelType && <p className="text-[10px] text-rose-500">{errors.fuelType.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Vites</label>
                <select
                  {...register("transmission")}
                  className="w-full h-10 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="Otomatik">Otomatik</option>
                  <option value="Manuel">Manuel</option>
                </select>
                {errors.transmission && <p className="text-[10px] text-rose-500">{errors.transmission.message}</p>}
              </div>
            </div>

            {/* Action */}
            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="h-10 px-4 text-xs font-semibold gap-1 cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Geri</span>
              </Button>
              <Button
                type="submit"
                className="h-10 px-5 text-xs font-semibold gap-1.5 cursor-pointer shadow-md shadow-sky-500/20"
              >
                <CheckCircle2 size={14} />
                <span>Müşteri & Aracı Kaydet</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
