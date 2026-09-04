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

interface CreateCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (customer: Customer) => void
}

export function CreateCustomerModal({ isOpen, onClose, onCreated }: CreateCustomerModalProps) {
  const [mounted, setMounted] = React.useState(false)
  const [currentStep, setCurrentStep] = React.useState<1 | 2>(1)
  const [customerType, setCustomerType] = React.useState<"individual" | "corporate">("individual")
  
  // Step 1: Customer Info
  const [name, setName] = React.useState("")
  const [surname, setSurname] = React.useState("")
  const [companyTitle, setCompanyTitle] = React.useState("")
  const [taxOffice, setTaxOffice] = React.useState("")
  const [taxNumber, setTaxNumber] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [city, setCity] = React.useState("İstanbul")
  const [district, setDistrict] = React.useState("")

  // Step 2: Vehicle Info
  const [plate, setPlate] = React.useState("")
  const [brand, setBrand] = React.useState("")
  const [model, setModel] = React.useState("")
  const [year, setYear] = React.useState(new Date().getFullYear())
  const [kilometer, setKilometer] = React.useState<number | "">(45000)
  const [fuelType, setFuelType] = React.useState<"Benzin" | "Dizel" | "LPG" | "Hibrit" | "Elektrik">("Benzin")
  const [transmission, setTransmission] = React.useState<"Manuel" | "Otomatik">("Otomatik")

  const [errors, setErrors] = React.useState<Record<string, string>>({})

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
      setPhone("")
      return
    }
    let formatted = raw.startsWith("0") ? raw.slice(0, 11) : "0" + raw.slice(0, 10)
    let res = "0"
    if (formatted.length > 1) res += " (" + formatted.slice(1, 4)
    if (formatted.length >= 4) res += ") " + formatted.slice(4, 7)
    if (formatted.length >= 7) res += " " + formatted.slice(7, 9)
    if (formatted.length >= 9) res += " " + formatted.slice(9, 11)
    setPhone(res)
  }

  // Validate Step 1
  const handleNextStep = () => {
    const errs: Record<string, string> = {}
    if (customerType === "individual") {
      if (!name.trim()) errs.name = "Ad zorunludur."
      if (!surname.trim()) errs.surname = "Soyad zorunludur."
    } else {
      if (!companyTitle.trim()) errs.companyTitle = "Şirket ünvanı zorunludur."
      if (!name.trim()) errs.name = "Yetkili adı zorunludur."
      if (!taxNumber.trim() || taxNumber.trim().length < 10) {
        errs.taxNumber = "Kurumsal müşteriler için 10 haneli Vergi Numarası zorunludur."
      }
    }
    if (!phone.trim() || phone.length < 17) {
      errs.phone = "Geçerli bir telefon numarası giriniz."
    }

    setErrors(errs)
    if (Object.keys(errs).length === 0) {
      setCurrentStep(2)
    }
  }

  // Submit Step 2
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    const currentYear = new Date().getFullYear()
    const maxYear = currentYear + 1 // 2026 yılı için en fazla 2027

    if (!plate.trim()) errs.plate = "Plaka zorunludur."
    if (!brand.trim()) errs.brand = "Marka zorunludur."
    if (!model.trim()) errs.model = "Model zorunludur."
    if (Number(year) < 1950 || Number(year) > maxYear) {
      errs.year = `Model yılı 1950 ile ${maxYear} arasında olmalıdır.`
    }
    if (kilometer !== "" && Number(kilometer) < 0) {
      errs.kilometer = "Kilometre negatif olamaz."
    }

    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    const newCustomerId = "cust_" + Date.now()
    const newVehicleId = "veh_" + Date.now()

    const initialVehicle: Vehicle = {
      id: newVehicleId,
      tenantId: "tenant_1",
      customerId: newCustomerId,
      plate: plate.toUpperCase().trim(),
      brand: brand.trim(),
      model: model.trim(),
      year: Number(year) || currentYear,
      kilometer: Number(kilometer) || 0,
      fuelType,
      transmission,
      lastServiceDate: new Date().toISOString().split("T")[0],
    }

    const newCustomer: Customer = {
      id: newCustomerId,
      tenantId: "tenant_1",
      type: customerType,
      name: name.trim(),
      surname: surname.trim(),
      companyTitle: customerType === "corporate" ? companyTitle.trim() : undefined,
      taxOffice: customerType === "corporate" ? taxOffice.trim() : undefined,
      taxNumber: customerType === "corporate" ? taxNumber.trim() : undefined,
      phone,
      email: email.trim() || undefined,
      city,
      district: district.trim() || undefined,
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
                onClick={() => setCustomerType("individual")}
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
                onClick={() => setCustomerType("corporate")}
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
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Şirket Ticari Ünvanı <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Ege Lojistik A.Ş."
                    value={companyTitle}
                    onChange={(e) => setCompanyTitle(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  {errors.companyTitle && <p className="text-[10px] text-rose-500">{errors.companyTitle}</p>}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {customerType === "corporate" ? "Yetkili Adı" : "Müşteri Adı"} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Rıdvan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  {errors.name && <p className="text-[10px] text-rose-500">{errors.name}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {customerType === "corporate" ? "Yetkili Soyadı" : "Müşteri Soyadı"} {customerType === "individual" && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Bayar"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  {errors.surname && <p className="text-[10px] text-rose-500">{errors.surname}</p>}
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
                    value={phone}
                    onChange={handlePhoneChange}
                    maxLength={17}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  {errors.phone && <p className="text-[10px] text-rose-500">{errors.phone}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    E-Posta (İsteğe Bağlı)
                  </label>
                  <input
                    type="email"
                    placeholder="musteri@eposta.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">İl</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">İlçe</label>
                  <input
                    type="text"
                    placeholder="Örn: Kadıköy"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
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
          <form onSubmit={handleSubmit} className="p-6 space-y-4 animate-in fade-in duration-200">
            {/* Live Plate Badge Preview */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="text-xs">
                <p className="font-bold text-slate-900 dark:text-slate-100">
                  {customerType === "corporate" ? companyTitle : `${name} ${surname}`}
                </p>
                <p className="text-[10px] text-slate-500">{phone}</p>
              </div>
              {plate ? (
                <PlateBadge plate={plate} size="sm" />
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
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-mono font-bold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-sky-500"
                  autoFocus
                />
                {errors.plate && <p className="text-[10px] text-rose-500">{errors.plate}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Marka <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: BMW"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {errors.brand && <p className="text-[10px] text-rose-500">{errors.brand}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Model <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: 320i M Sport"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {errors.model && <p className="text-[10px] text-rose-500">{errors.model}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Model Yılı</label>
                <input
                  type="number"
                  min={1950}
                  max={new Date().getFullYear() + 1}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono text-center focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {errors.year && <p className="text-[10px] text-rose-500">{errors.year}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Mevcut KM</label>
                <input
                  type="number"
                  min={0}
                  value={kilometer}
                  onChange={(e) => setKilometer(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {errors.kilometer && <p className="text-[10px] text-rose-500">{errors.kilometer}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Yakıt</label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value as any)}
                  className="w-full h-10 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="Benzin">Benzin</option>
                  <option value="Dizel">Dizel</option>
                  <option value="Hibrit">Hibrit</option>
                  <option value="Elektrik">Elektrik</option>
                  <option value="LPG">LPG</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Vites</label>
                <select
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value as any)}
                  className="w-full h-10 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="Otomatik">Otomatik</option>
                  <option value="Manuel">Manuel</option>
                </select>
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
