"use client"

import * as React from "react"
import {
  Car,
  UserPlus,
  Plus,
  Trash2,
  Sparkles,
  Phone,
  User,
  Calendar,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { formatTurkishGsmInput, isValidTurkishGsm } from "@/lib/phone-utils"
import { validatePersonName } from "@/lib/name-utils"
import { formatSmartPlate } from "@/lib/input-formatters"

export interface InitialCustomerVehicle {
  id: string
  firstName: string
  lastName?: string
  phone: string
  plate: string
  brand?: string
  model?: string
  year?: number
}

interface StepInitialCustomersProps {
  initialCustomers: InitialCustomerVehicle[]
  onAddCustomer: (customer: InitialCustomerVehicle) => void
  onRemoveCustomer: (id: string) => void
  onSkip: () => void
}

export function StepInitialCustomers({
  initialCustomers,
  onAddCustomer,
  onRemoveCustomer,
  onSkip,
}: StepInitialCustomersProps) {
  // Input fields state
  const [fullName, setFullName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [plate, setPlate] = React.useState("")
  const [brand, setBrand] = React.useState("")
  const [model, setModel] = React.useState("")
  const [year, setYear] = React.useState<string>("")
  const [formError, setFormError] = React.useState<string | null>(null)

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setFormError(null)

    const cleanPlate = plate.trim().toUpperCase()
    if (!cleanPlate || cleanPlate.length < 5) {
      setFormError("Lütfen geçerli bir araç plakası giriniz (örn: 34 ABC 123).")
      return
    }

    const cleanName = fullName.trim()
    if (!cleanName || cleanName.length < 2) {
      setFormError("Lütfen müşteri adını giriniz.")
      return
    }

    const nameValidation = validatePersonName(cleanName, "Müşteri adı")
    if (!nameValidation.isValid) {
      setFormError(nameValidation.error || "Müşteri adı yalnızca harflerden oluşmalıdır.")
      return
    }

    const cleanPhone = phone.trim()
    if (!cleanPhone || !isValidTurkishGsm(cleanPhone)) {
      setFormError("Lütfen geçerli bir cep telefonu numarası giriniz (05XX XXX XX XX).")
      return
    }

    // Split name into first and last
    const nameParts = cleanName.split(" ")
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(" ") || undefined

    const parsedYear = year ? parseInt(year, 10) : undefined

    const newRecord: InitialCustomerVehicle = {
      id: "cust_" + Date.now(),
      firstName,
      lastName,
      phone: cleanPhone,
      plate: cleanPlate,
      brand: brand.trim() || undefined,
      model: model.trim() || undefined,
      year: parsedYear && !isNaN(parsedYear) ? parsedYear : undefined,
    }

    onAddCustomer(newRecord)

    // Reset fields for next entry
    setFullName("")
    setPhone("")
    setPlate("")
    setBrand("")
    setModel("")
    setYear("")
    setFormError(null)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              İlk Müşteri & Araç Kaydı
            </h3>
            <Badge
              variant="outline"
              className="text-[10px] font-bold border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10"
            >
              İsteğe Bağlı
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Atölyenizde işlem görmüş hazır müşterilerinizi ve araçlarını sisteme önceden kaydedebilirsiniz. Dilerseniz bu adımı atlayıp doğrudan panele geçebilirsiniz.
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={onSkip}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer self-start sm:self-auto shrink-0"
        >
          Bu Adımı Atla
        </Button>
      </div>

      {/* Form Card for Adding a Customer + Vehicle */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
          <UserPlus size={16} className="text-sky-500" />
          <span>Yeni Müşteri & Araç Bilgileri</span>
        </div>

        {formError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Customer Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <User size={12} className="text-slate-400" />
              <span>Müşteri Adı Soyadı</span>
            </label>
            <Input
              type="text"
              placeholder="Örn: Mehmet Kaya"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-10 rounded-xl text-xs bg-white dark:bg-slate-950"
            />
          </div>

          {/* Customer Phone */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Phone size={12} className="text-slate-400" />
              <span>Cep Telefonu</span>
            </label>
            <Input
              type="tel"
              placeholder="05XX XXX XX XX"
              value={phone}
              onChange={(e) => setPhone(formatTurkishGsmInput(e.target.value))}
              className="h-10 rounded-xl text-xs font-mono bg-white dark:bg-slate-950"
            />
          </div>

          {/* Plate */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Car size={12} className="text-slate-400" />
              <span>Araç Plakası</span>
            </label>
            <Input
              type="text"
              placeholder="34 ABC 123"
              value={plate}
              onChange={(e) => setPlate(formatSmartPlate(e.target.value))}
              className="h-10 rounded-xl text-xs font-mono font-bold tracking-wider uppercase bg-white dark:bg-slate-950"
            />
          </div>

          {/* Brand */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Marka (İsteğe Bağlı)
            </label>
            <Input
              type="text"
              placeholder="Örn: Volkswagen"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="h-10 rounded-xl text-xs bg-white dark:bg-slate-950"
            />
          </div>

          {/* Model */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Model (İsteğe Bağlı)
            </label>
            <Input
              type="text"
              placeholder="Örn: Golf 1.5 TSI"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="h-10 rounded-xl text-xs bg-white dark:bg-slate-950"
            />
          </div>

          {/* Year */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Calendar size={12} className="text-slate-400" />
              <span>Model Yılı (İsteğe Bağlı)</span>
            </label>
            <Input
              type="number"
              placeholder="Örn: 2021"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              min={1970}
              max={2030}
              className="h-10 rounded-xl text-xs font-mono bg-white dark:bg-slate-950"
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-2">
          <Button
            type="button"
            onClick={() => handleAdd()}
            className="h-9 px-4 rounded-xl text-xs font-bold gap-1.5 cursor-pointer bg-sky-600 hover:bg-sky-500 text-white shadow-xs"
          >
            <Plus size={14} />
            <span>Listeye Ekle</span>
          </Button>
        </div>
      </div>

      {/* List of Added Initial Customers/Vehicles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span>Tanımlanan Müşteriler & Araçlar</span>
            <span className="text-[11px] font-mono text-slate-400 font-semibold">
              ({initialCustomers.length} Adet)
            </span>
          </h4>
        </div>

        {initialCustomers.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2 bg-slate-50/40 dark:bg-slate-900/20">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <Car size={20} />
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Henüz ön müşteri kaydı eklenmedi.
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Yukarıdaki formdan ilk müşterilerinizi ekleyebilir ya da bu adımı atlayarak kurulumu hemen tamamlayabilirsiniz.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {initialCustomers.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3 group hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <PlateBadge plate={item.plate} size="sm" />
                    {(item.brand || item.model) && (
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {[item.brand, item.model, item.year].filter(Boolean).join(" ")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {item.firstName} {item.lastName || ""}
                    </span>
                    <span>•</span>
                    <span className="font-mono">{item.phone}</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveCustomer(item.id)}
                  className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer shrink-0 transition-colors"
                  title="Kaydı Kaldır"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Helpful Info Note */}
      <div className="p-3 rounded-xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-900/40 flex items-center gap-2.5 text-xs text-sky-800 dark:text-sky-300">
        <Sparkles size={16} className="text-sky-500 shrink-0" />
        <span>
          Müşterilerinizi ve araçlarınızı daha sonra panel içerisindeki <strong>Müşteriler</strong> sayfasından dilediğiniz zaman tek tek veya <strong>Excel ile toplu olarak</strong> da yükleyebilirsiniz.
        </span>
      </div>
    </div>
  )
}
