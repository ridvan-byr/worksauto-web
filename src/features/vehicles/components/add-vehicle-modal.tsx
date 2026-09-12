"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  X,
  Car,
  CheckCircle2,
  Gauge,
  Calendar,
  Fuel,
  Settings2,
  Palette,
  Fingerprint,
  User,
  Building2,
  Search,
  ChevronDown,
  PlusCircle,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { useCreateVehicle, type VehicleRecord } from "../api/use-vehicles"
import { useCustomers, useCreateCustomer } from "@/features/customers/api/use-customers"
import {
  formatSmartPlate,
  formatKilometer,
  formatVinNumber,
} from "@/lib/input-formatters"
import { formatTurkishGsmInput } from "@/lib/phone-utils"
import {
  createVehicleSchema,
  CreateVehicleFormValues,
} from "../schemas/vehicle.schema"
import { cn } from "@/lib/utils"

export interface AddVehicleModalProps {
  isOpen: boolean
  onClose: () => void
  onAdded?: (createdVehicle: VehicleRecord) => void
  initialCustomerId?: string
}

const FUEL_OPTIONS = ["Benzin", "Dizel", "LPG", "Hibrit", "Elektrik"] as const
const TRANSMISSION_OPTIONS = ["Otomatik", "Manuel"] as const

function mapFuelToEnum(fuel: string): string {
  switch (fuel) {
    case "Benzin":
      return "GASOLINE"
    case "Dizel":
      return "DIESEL"
    case "LPG":
      return "LPG"
    case "Hibrit":
      return "HYBRID"
    case "Elektrik":
      return "ELECTRIC"
    default:
      return "GASOLINE"
  }
}

function mapTransToEnum(trans: string): string {
  return trans === "Manuel" ? "MANUAL" : "AUTOMATIC"
}

export function AddVehicleModal({
  isOpen,
  onClose,
  onAdded,
  initialCustomerId,
}: AddVehicleModalProps) {
  const [mounted, setMounted] = React.useState(false)
  const currentYear = new Date().getFullYear()
  const maxYear = currentYear + 1

  const createVehicleMutation = useCreateVehicle()
  const { data: apiCustomers = [], isLoading: isLoadingCustomers } = useCustomers()
  const createCustomerMutation = useCreateCustomer()

  // Customer dropdown & search state
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = React.useState(false)
  const [customerSearchQuery, setCustomerSearchQuery] = React.useState("")
  const customerDropdownRef = React.useRef<HTMLDivElement>(null)

  // Quick customer create state
  const [showQuickCustomer, setShowQuickCustomer] = React.useState(false)
  const [quickFirstName, setQuickFirstName] = React.useState("")
  const [quickLastName, setQuickLastName] = React.useState("")
  const [quickPhone, setQuickPhone] = React.useState("")
  const [quickCustomerError, setQuickCustomerError] = React.useState("")
  const [isCreatingQuickCustomer, setIsCreatingQuickCustomer] = React.useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateVehicleFormValues>({
    resolver: zodResolver(createVehicleSchema),
    defaultValues: {
      customerId: initialCustomerId || "",
      plate: "",
      brand: "",
      model: "",
      year: currentYear,
      kilometer: 0,
      fuelType: "Benzin",
      transmission: "Otomatik",
      color: "",
      vin: "",
      engineNo: "",
    },
  })

  const currentPlate = watch("plate")
  const selectedCustomerId = watch("customerId")
  const selectedFuel = watch("fuelType")
  const selectedTransmission = watch("transmission")

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(e.target as Node)
      ) {
        setIsCustomerDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Lock body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = "auto"
      }
    }
  }, [isOpen])

  // Reset form when opened/closed
  React.useEffect(() => {
    if (isOpen) {
      reset({
        customerId: initialCustomerId || "",
        plate: "",
        brand: "",
        model: "",
        year: currentYear,
        kilometer: 0,
        fuelType: "Benzin",
        transmission: "Otomatik",
        color: "",
        vin: "",
        engineNo: "",
      })
      setShowQuickCustomer(false)
      setCustomerSearchQuery("")
    }
  }, [isOpen, initialCustomerId, currentYear, reset])

  // Find selected customer
  const selectedCustomer = React.useMemo(() => {
    return apiCustomers.find((c) => c.id === selectedCustomerId)
  }, [apiCustomers, selectedCustomerId])

  // Filter customers for dropdown
  const filteredCustomers = React.useMemo(() => {
    if (!customerSearchQuery.trim()) return apiCustomers.slice(0, 50)
    const q = customerSearchQuery.toLowerCase().trim()
    const cleanPhone = q.replace(/\D/g, "")
    return apiCustomers
      .filter((c) => {
        const fullName = `${c.firstName || c.name || ""} ${c.lastName || c.surname || ""}`.toLowerCase()
        const company = (c.companyTitle || "").toLowerCase()
        const phone = (c.phone || "").replace(/\D/g, "")
        return (
          fullName.includes(q) ||
          company.includes(q) ||
          (cleanPhone.length >= 3 && phone.includes(cleanPhone))
        )
      })
      .slice(0, 50)
  }, [apiCustomers, customerSearchQuery])

  // Quick customer create handler
  const handleQuickCustomerSubmit = async () => {
    setQuickCustomerError("")
    if (!quickFirstName.trim()) {
      setQuickCustomerError("Müşteri adı zorunludur.")
      return
    }
    const rawPhone = quickPhone.replace(/\D/g, "")
    if (rawPhone.length < 10) {
      setQuickCustomerError("Geçerli bir telefon numarası giriniz (en az 10 hane).")
      return
    }

    setIsCreatingQuickCustomer(true)
    try {
      const created = await createCustomerMutation.mutateAsync({
        firstName: quickFirstName.trim(),
        lastName: quickLastName.trim(),
        phone: quickPhone.trim(),
        type: "INDIVIDUAL",
      })
      if (created?.id) {
        setValue("customerId", created.id, { shouldValidate: true })
        setShowQuickCustomer(false)
        setIsCustomerDropdownOpen(false)
        setQuickFirstName("")
        setQuickLastName("")
        setQuickPhone("")
      }
    } catch {
      setQuickCustomerError("Müşteri oluşturulurken bir sorun oluştu.")
    } finally {
      setIsCreatingQuickCustomer(false)
    }
  }

  const onSubmit = async (data: CreateVehicleFormValues) => {
    try {
      const created = await createVehicleMutation.mutateAsync({
        customerId: data.customerId,
        plate: data.plate.toUpperCase().trim(),
        brand: data.brand.trim(),
        model: data.model.trim(),
        year: Number(data.year),
        currentKm: Number(data.kilometer) || 0,
        vin: data.vin?.trim().toUpperCase() || undefined,
        color: data.color?.trim() || undefined,
        engineNo: data.engineNo?.trim() || undefined,
        fuelType: mapFuelToEnum(data.fuelType),
        transmission: mapTransToEnum(data.transmission),
      })

      if (onAdded && created) {
        onAdded(created)
      }
      onClose()
    } catch {
      // Handled by react-query mutation toast
    }
  }

  if (!isOpen || !mounted) return null

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[90vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Car size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Yeni Araç Kaydı
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Sisteme yeni bir araç kaydedin ve bir müşteriye bağlayın.
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-6 space-y-4 flex-1">
          {/* Customer Selection Section */}
          <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <User size={13} className="text-sky-500" />
                <span>Araç Sahibi / Müşteri</span>
                <span className="text-rose-500">*</span>
              </label>

              {!showQuickCustomer && (
                <button
                  type="button"
                  onClick={() => setShowQuickCustomer(true)}
                  className="text-[11px] font-medium text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle size={12} />
                  <span>Hızlı Müşteri Ekle</span>
                </button>
              )}
            </div>

            {/* Quick Customer Sub-form */}
            {showQuickCustomer ? (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-sky-500/30 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-300">
                    Yeni Müşteri Bilgileri
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowQuickCustomer(false)}
                    className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Listeden Seç
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Ad *"
                    value={quickFirstName}
                    onChange={(e) => setQuickFirstName(e.target.value)}
                    className="h-8.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-sky-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Soyad"
                    value={quickLastName}
                    onChange={(e) => setQuickLastName(e.target.value)}
                    className="h-8.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-sky-500 outline-none"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Telefon (Örn: 0532 123 45 67) *"
                  value={quickPhone}
                  onChange={(e) => setQuickPhone(formatTurkishGsmInput(e.target.value))}
                  className="w-full h-8.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-sky-500 outline-none font-mono"
                />

                {quickCustomerError && (
                  <p className="text-[10px] text-rose-500 flex items-center gap-1">
                    <AlertCircle size={11} /> {quickCustomerError}
                  </p>
                )}

                <div className="flex justify-end gap-1.5 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQuickCustomer(false)}
                    className="h-7 px-2.5 text-[11px]"
                  >
                    Vazgeç
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleQuickCustomerSubmit}
                    disabled={isCreatingQuickCustomer}
                    className="h-7 px-3 text-[11px]"
                  >
                    {isCreatingQuickCustomer ? "Oluşturuluyor..." : "Müşteriyi Kaydet ve Seç"}
                  </Button>
                </div>
              </div>
            ) : selectedCustomer ? (
              /* Selected Customer Card */
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    {selectedCustomer.type === "corporate" ? (
                      <Building2 size={15} />
                    ) : (
                      <User size={15} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {selectedCustomer.firstName || selectedCustomer.name}{" "}
                        {selectedCustomer.lastName || selectedCustomer.surname || ""}
                      </span>
                      {selectedCustomer.companyTitle && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                          ({selectedCustomer.companyTitle})
                        </span>
                      )}
                      {selectedCustomer.isLead && (
                        <span className="h-[18px] px-2.5 rounded-full inline-flex items-center justify-center leading-none pt-[0.5px] text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Potansiyel
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {selectedCustomer.phone || "Telefon yok"}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setValue("customerId", "", { shouldValidate: true })}
                  className="h-7 px-2.5 text-[11px] text-slate-500 hover:text-rose-600 cursor-pointer"
                >
                  Değiştir
                </Button>
              </div>
            ) : (
              /* Searchable Customer Dropdown */
              <div ref={customerDropdownRef} className="relative">
                <div
                  onClick={() => setIsCustomerDropdownOpen((prev) => !prev)}
                  className={cn(
                    "w-full h-10 px-3 rounded-xl border bg-white dark:bg-slate-900 flex items-center justify-between cursor-pointer transition-all text-xs",
                    errors.customerId
                      ? "border-rose-500 ring-1 ring-rose-500/20"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  )}
                >
                  <span className="text-slate-400">
                    {isLoadingCustomers ? "Müşteriler yükleniyor..." : "Bir müşteri arayın veya seçin..."}
                  </span>
                  <ChevronDown size={14} className="text-slate-400" />
                </div>

                {isCustomerDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in duration-150">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="relative">
                        <Search
                          size={13}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                        <input
                          type="text"
                          placeholder="Müşteri adı, şirket veya telefon..."
                          value={customerSearchQuery}
                          onChange={(e) => setCustomerSearchQuery(e.target.value)}
                          className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1">
                      {filteredCustomers.length === 0 ? (
                        <div className="py-6 text-center text-slate-400 text-xs">
                          Eşleşen müşteri bulunamadı.
                        </div>
                      ) : (
                        filteredCustomers.map((c) => {
                          const fullName = `${c.firstName || c.name || ""} ${c.lastName || c.surname || ""}`
                          return (
                            <div
                              key={c.id}
                              onClick={() => {
                                setValue("customerId", c.id, { shouldValidate: true })
                                setIsCustomerDropdownOpen(false)
                                setCustomerSearchQuery("")
                              }}
                              className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 flex items-center justify-between cursor-pointer transition-colors"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                    {fullName}
                                  </span>
                                  {c.isLead && (
                                    <span className="h-[18px] px-2 rounded-full inline-flex items-center justify-center leading-none pt-[0.5px] text-[9px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                      Potansiyel
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                  <span className="font-mono">{c.phone || "Telefon yok"}</span>
                                  {c.companyTitle && <span>• {c.companyTitle}</span>}
                                  {c.vehicles && c.vehicles.length > 0 && (
                                    <span>• {c.vehicles.length} araç</span>
                                  )}
                                </div>
                              </div>
                              <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 shrink-0">
                                Seç
                              </span>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {errors.customerId && (
              <p className="text-[10px] text-rose-500 font-medium">
                {errors.customerId.message}
              </p>
            )}
          </div>

          {/* Plate Live Preview */}
          {currentPlate && (
            <div className="flex flex-col items-center justify-center py-1">
              <span className="text-[10px] font-medium text-slate-400 mb-1">
                Plaka Önizleme
              </span>
              <PlateBadge plate={currentPlate} size="md" />
            </div>
          )}

          {/* Primary Details */}
          <div className="space-y-3">
            {/* Plaka */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>
                  Plaka <span className="text-rose-500">*</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Yabancı plaka formatı da desteklenir (Örn: M-AB 1234)
                </span>
              </label>
              <input
                type="text"
                placeholder="Örn: 34 RB 1905 veya M-AB 1234"
                value={currentPlate}
                onChange={(e) => {
                  const formatted = formatSmartPlate(e.target.value)
                  setValue("plate", formatted, { shouldValidate: true })
                }}
                className={cn(
                  "w-full h-11 px-3.5 rounded-xl border bg-slate-50 dark:bg-slate-900 text-sm font-mono font-bold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all",
                  errors.plate
                    ? "border-rose-500 ring-1 ring-rose-500/20"
                    : "border-slate-200 dark:border-slate-800"
                )}
              />
              {errors.plate && (
                <p className="text-[10px] text-rose-500">{errors.plate.message}</p>
              )}
            </div>

            {/* Brand & Model */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Marka <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: Volkswagen"
                  {...register("brand")}
                  className={cn(
                    "w-full h-10 px-3 rounded-xl border bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all",
                    errors.brand
                      ? "border-rose-500 ring-1 ring-rose-500/20"
                      : "border-slate-200 dark:border-slate-800"
                  )}
                />
                {errors.brand && (
                  <p className="text-[10px] text-rose-500">{errors.brand.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Model <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: Passat 1.5 TSI"
                  {...register("model")}
                  className={cn(
                    "w-full h-10 px-3 rounded-xl border bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all",
                    errors.model
                      ? "border-rose-500 ring-1 ring-rose-500/20"
                      : "border-slate-200 dark:border-slate-800"
                  )}
                />
                {errors.model && (
                  <p className="text-[10px] text-rose-500">{errors.model.message}</p>
                )}
              </div>
            </div>

            {/* Year & Mileage */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-400" />
                  <span>Model Yılı</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1950}
                  max={maxYear}
                  {...register("year", { valueAsNumber: true })}
                  className={cn(
                    "w-full h-10 px-3 rounded-xl border bg-slate-50 dark:bg-slate-900 text-xs font-mono text-center focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all",
                    errors.year
                      ? "border-rose-500 ring-1 ring-rose-500/20"
                      : "border-slate-200 dark:border-slate-800"
                  )}
                />
                {errors.year && (
                  <p className="text-[10px] text-rose-500">{errors.year.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Gauge size={13} className="text-slate-400" />
                  <span>Mevcut Kilometre</span>
                </label>
                <input
                  type="text"
                  placeholder="0"
                  value={formatKilometer(watch("kilometer") ?? 0).formatted}
                  onChange={(e) => {
                    const rawVal = formatKilometer(e.target.value).raw
                    setValue("kilometer", rawVal, { shouldValidate: true })
                  }}
                  className={cn(
                    "w-full h-10 px-3 rounded-xl border bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all",
                    errors.kilometer
                      ? "border-rose-500 ring-1 ring-rose-500/20"
                      : "border-slate-200 dark:border-slate-800"
                  )}
                />
                {errors.kilometer && (
                  <p className="text-[10px] text-rose-500">{errors.kilometer.message}</p>
                )}
              </div>
            </div>

            {/* Fuel Type & Transmission */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Fuel size={13} className="text-slate-400" />
                  <span>Yakıt Türü</span>
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {FUEL_OPTIONS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setValue("fuelType", f, { shouldValidate: true })}
                      className={cn(
                        "h-8 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer flex items-center justify-center",
                        selectedFuel === f
                          ? "bg-sky-500 text-white border-sky-500 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Settings2 size={13} className="text-slate-400" />
                  <span>Vites Türü</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {TRANSMISSION_OPTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setValue("transmission", t, { shouldValidate: true })}
                      className={cn(
                        "h-8 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer flex items-center justify-center",
                        selectedTransmission === t
                          ? "bg-sky-500 text-white border-sky-500 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Color & VIN */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Palette size={13} className="text-slate-400" />
                  <span>Renk</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: Beyaz, Füme, Siyah"
                  {...register("color")}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Fingerprint size={13} className="text-slate-400" />
                    <span>Şasi No (VIN)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {watch("vin")?.length || 0}/17
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="17 Haneli Şasi No"
                  value={watch("vin") || ""}
                  onChange={(e) => {
                    const formatted = formatVinNumber(e.target.value)
                    setValue("vin", formatted, { shouldValidate: true })
                  }}
                  className={cn(
                    "w-full h-10 px-3 rounded-xl border bg-slate-50 dark:bg-slate-900 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all",
                    errors.vin
                      ? "border-rose-500 ring-1 ring-rose-500/20"
                      : "border-slate-200 dark:border-slate-800"
                  )}
                />
                {errors.vin && (
                  <p className="text-[10px] text-rose-500">{errors.vin.message}</p>
                )}
              </div>
            </div>

            {/* Motor No */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Motor Numarası (Opsiyonel)
              </label>
              <input
                type="text"
                placeholder="Örn: CAXA123456"
                {...register("engineNo")}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-10 px-4 text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-5 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-500 text-white gap-2 cursor-pointer shadow-md shadow-sky-500/20"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Aracı Kaydet</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
