"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  X,
  Calendar,
  Clock,
  Car,
  User,
  Wrench,
  Users,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  UserPlus,
  Check,
  Building2,
  Sparkles,
  Info,
  ChevronRight,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Appointment, AppointmentServiceItem } from "../types"
import { useCustomers, useQuickLeadCustomer } from "@/features/customers/api/use-customers"
import { useCreateAppointment } from "@/features/appointments/api/use-appointments"
import { useAuth } from "@/features/auth/auth-context"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { cn } from "@/lib/utils"

interface CreateAppointmentModalProps {
  isOpen: boolean
  initialDate?: string
  initialTime?: string
  onClose: () => void
  onCreated: (appointment: Appointment) => void
}

const DEFAULT_SERVICES = [
  { id: "s1", name: "Periyodik Bakım (Yağ + 4 Filtre)", durationMinutes: 60, price: 1250 },
  { id: "s2", name: "Ön Fren Balata Değişimi", durationMinutes: 45, price: 850 },
  { id: "s3", name: "Bilgisayarlı Arıza Tespit & Teşhis", durationMinutes: 30, price: 500 },
  { id: "s4", name: "Klima Gazı Dolumu & Kaçak Testi", durationMinutes: 40, price: 950 },
  { id: "s5", name: "Rot-Balans & Ön Takım Kontrolü", durationMinutes: 45, price: 750 },
]

export function CreateAppointmentModal({
  isOpen,
  initialDate,
  initialTime,
  onClose,
  onCreated,
}: CreateAppointmentModalProps) {
  const [mounted, setMounted] = React.useState(false)
  const { tenant } = useAuth()
  const { data: apiCustomers } = useCustomers()
  const createAppointmentMutation = useCreateAppointment()
  const quickLeadMutation = useQuickLeadCustomer()

  // Mode: "search" vs "quick-lead"
  const [customerMode, setCustomerMode] = React.useState<"search" | "quick-lead">("search")

  // Customer search & dropdown state
  const [customerSearch, setCustomerSearch] = React.useState("")
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Quick Lead Form State
  const [quickLeadFirstName, setQuickLeadFirstName] = React.useState("")
  const [quickLeadLastName, setQuickLeadLastName] = React.useState("")
  const [quickLeadPhone, setQuickLeadPhone] = React.useState("")
  const [quickLeadPlate, setQuickLeadPlate] = React.useState("")
  const [quickLeadBrand, setQuickLeadBrand] = React.useState("")
  const [quickLeadModel, setQuickLeadModel] = React.useState("")
  const [quickLeadYear, setQuickLeadYear] = React.useState<number>(new Date().getFullYear())
  const [quickLeadErrors, setQuickLeadErrors] = React.useState<Record<string, string>>({})

  // Fleet vehicle filter (for customers with 4+ vehicles)
  const [vehicleSearch, setVehicleSearch] = React.useState("")

  const customers = React.useMemo(() => {
    if (!apiCustomers) return []
    return apiCustomers.map((c: any) => ({
      id: c.id,
      name: c.firstName,
      surname: c.lastName,
      phone: c.phone,
      isLead: Boolean(c.isLead),
      type: c.type === "CORPORATE" ? ("corporate" as const) : ("individual" as const),
      companyTitle: c.companyTitle,
      vehicles: (c.vehicles || []).map((v: any) => ({
        id: v.id,
        plate: v.plate,
        brand: v.brand,
        model: v.model,
        year: v.year,
        kilometer: Number(v.currentKm ?? v.kilometer ?? v.mileage ?? 0),
      })),
    }))
  }, [apiCustomers])

  // Form Selection State
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>("")
  const [selectedVehicleId, setSelectedVehicleId] = React.useState<string>("")

  // Initial customer auto-select if none selected
  React.useEffect(() => {
    if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id)
      if (customers[0].vehicles.length > 0) {
        setSelectedVehicleId(customers[0].vehicles[0].id)
      }
    }
  }, [customers, selectedCustomerId])

  const [date, setDate] = React.useState<string>(initialDate || new Date().toISOString().split("T")[0])
  const [time, setTime] = React.useState<string>(initialTime || "10:00")
  
  // Optional services: user can select empty array
  const [selectedServices, setSelectedServices] = React.useState<AppointmentServiceItem[]>([])
  const [assignedStaff, setAssignedStaff] = React.useState<string>("Ahmet Usta")
  const [customerNote, setCustomerNote] = React.useState<string>("")
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (initialDate) setDate(initialDate)
    if (initialTime) setTime(initialTime)
  }, [initialDate, initialTime])

  // Update selected vehicle when customer changes
  React.useEffect(() => {
    const cust = customers.find((c) => c.id === selectedCustomerId)
    if (cust && cust.vehicles.length > 0) {
      // If current selected vehicle doesn't belong to this customer, pick first
      const belongs = cust.vehicles.some((v: any) => v.id === selectedVehicleId)
      if (!belongs) {
        setSelectedVehicleId(cust.vehicles[0].id)
      }
    } else {
      setSelectedVehicleId("")
    }
    setVehicleSearch("")
  }, [selectedCustomerId, customers])

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = "auto"
      }
    }
  }, [isOpen])

  if (!isOpen || !mounted) return null

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)
  const customerVehicles = selectedCustomer?.vehicles || []
  const selectedVehicle = customerVehicles.find((v: any) => v.id === selectedVehicleId)

  // Filtered customers for search combobox
  const searchResults = customers.filter((c) => {
    if (!customerSearch.trim()) return true
    const q = customerSearch.toLowerCase().trim()
    const cleanDigits = q.replace(/\D/g, "")
    const matchName = `${c.name} ${c.surname}`.toLowerCase().includes(q)
    const matchCompany = c.companyTitle?.toLowerCase().includes(q) || false
    const matchPhone = cleanDigits.length >= 3 && c.phone.replace(/\D/g, "").includes(cleanDigits)
    const matchPlates = c.vehicles.some((v: any) => v.plate.toLowerCase().replace(/\s/g, "").includes(q.replace(/\s/g, "")))
    return matchName || matchCompany || matchPhone || matchPlates
  })

  // Filtered vehicles for fleet view (4+ vehicles)
  const filteredVehicles = customerVehicles.filter((v: any) => {
    if (!vehicleSearch.trim()) return true
    const q = vehicleSearch.toLowerCase().trim()
    const matchPlate = v.plate.toLowerCase().replace(/\s/g, "").includes(q.replace(/\s/g, ""))
    const matchModel = `${v.brand} ${v.model}`.toLowerCase().includes(q)
    return matchPlate || matchModel
  })

  // Calculations (Optional Services: duration defaults to 30 min diagnostic slot if empty)
  const totalDuration = selectedServices.length > 0
    ? selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0)
    : 30 // Default 30 min for fault diagnosis slot
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0)

  const handleToggleService = (item: AppointmentServiceItem) => {
    const exists = selectedServices.some((s) => s.id === item.id)
    if (exists) {
      setSelectedServices(selectedServices.filter((s) => s.id !== item.id))
    } else {
      setSelectedServices([...selectedServices, item])
    }
  }

  // Handle Quick Lead Submit
  const handleQuickLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!quickLeadFirstName.trim()) newErrors.firstName = "Ad gereklidir."
    if (!quickLeadPhone.trim()) newErrors.phone = "Telefon gereklidir."
    if (!quickLeadPlate.trim()) newErrors.plate = "Plaka gereklidir."

    if (Object.keys(newErrors).length > 0) {
      setQuickLeadErrors(newErrors)
      return
    }

    try {
      const res = await quickLeadMutation.mutateAsync({
        firstName: quickLeadFirstName.trim(),
        lastName: quickLeadLastName.trim() || undefined,
        phone: quickLeadPhone.trim(),
        plate: quickLeadPlate.trim().toUpperCase(),
        brand: quickLeadBrand.trim() || undefined,
        model: quickLeadModel.trim() || undefined,
        year: quickLeadYear || undefined,
      })

      // Switch to search mode and auto-select new customer + vehicle
      setSelectedCustomerId(res.customer.id)
      setSelectedVehicleId(res.vehicle.id)
      setCustomerMode("search")
      setIsDropdownOpen(false)
      setQuickLeadFirstName("")
      setQuickLeadLastName("")
      setQuickLeadPhone("")
      setQuickLeadPlate("")
      setQuickLeadBrand("")
      setQuickLeadModel("")
      setQuickLeadErrors({})
    } catch (err) {
      console.error("Quick lead creation error:", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) {
      setErrors({ customer: "Lütfen bir müşteri seçin veya hızlı kayıt yapın." })
      return
    }
    if (!selectedVehicle) {
      setErrors({ customer: "Lütfen müşteriye ait bir araç seçin." })
      return
    }

    const [hours, minutes] = time.split(":").map(Number)
    const startDateTime = new Date(date)
    startDateTime.setHours(hours || 10, minutes || 0, 0, 0)
    const endDateTime = new Date(startDateTime.getTime() + (totalDuration || 30) * 60000)

    try {
      // If service selected, pass first service id (or null if none selected)
      const primaryServiceId = selectedServices.length > 0 ? selectedServices[0].id : undefined

      const createdApp: any = await createAppointmentMutation.mutateAsync({
        customerId: selectedCustomer.id,
        vehicleId: selectedVehicle.id,
        serviceId: primaryServiceId,
        slotDate: date,
        slotStartTime: startDateTime.toISOString(),
        slotEndTime: endDateTime.toISOString(),
        customerNotes: customerNote.trim() || undefined,
      })

      const newApp: Appointment = {
        id: createdApp?.id || "app_" + Date.now(),
        tenantId: tenant?.id || "tenant_1",
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.type === "corporate" && selectedCustomer.companyTitle
          ? selectedCustomer.companyTitle
          : `${selectedCustomer.name} ${selectedCustomer.surname || ""}`.trim(),
        customerPhone: selectedCustomer.phone,
        vehicleId: selectedVehicle.id,
        plate: selectedVehicle.plate,
        brand: selectedVehicle.brand,
        model: selectedVehicle.model,
        services: selectedServices.length > 0 ? selectedServices : [
          { id: "s_diag", name: "Arıza Teşhisi & Ekspertiz (Belirlenecek)", durationMinutes: 30, price: 0 }
        ],
        totalDurationMinutes: totalDuration,
        totalEstimatedPrice: totalPrice,
        assignedStaffName: assignedStaff,
        date,
        time,
        status: "CONFIRMED" as any,
        customerNote: customerNote.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      onCreated(newApp)
      onClose()
    } catch (err: any) {
      console.error("Appointment creation error:", err)
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Yeni Servis Randevusu Oluştur</span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Müşteri arayın veya hızlı potansiyel müşteri kaydı oluşturarak randevu tanımlayın.
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

        {/* Form Body with Scroll */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* SECTION 1: CUSTOMER SELECTION & QUICK LEAD TABS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <User size={15} className="text-sky-500" />
                Müşteri Belirleme
              </span>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <button
                  type="button"
                  onClick={() => setCustomerMode("search")}
                  className={cn(
                    "px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                    customerMode === "search"
                      ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  )}
                >
                  <Search size={12} />
                  <span>Kayıtlı Müşteri Ara</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode("quick-lead")}
                  className={cn(
                    "px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                    customerMode === "quick-lead"
                      ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  )}
                >
                  <Sparkles size={12} className="text-amber-500" />
                  <span>⚡ Hızlı Kayıt (Lead)</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT: SEARCH MODE (AUTOCOMPLETE COMBOBOX) */}
            {customerMode === "search" && (
              <div className="space-y-3">
                {/* Search Input Box */}
                <div ref={dropdownRef} className="relative">
                  <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Müşteri adı, şirket ünvanı, telefon veya plaka ile ara..."
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value)
                        setIsDropdownOpen(true)
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      className="w-full h-11 pl-10 pr-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                    />
                  </div>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 animate-in fade-in zoom-in-95 duration-150">
                      {searchResults.length === 0 ? (
                        <div className="p-4 text-center space-y-2">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            Eşleşen müşteri bulunamadı.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomerMode("quick-lead")
                              setIsDropdownOpen(false)
                            }}
                            className="inline-flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer"
                          >
                            <Plus size={14} />
                            Hızlı Potansiyel Müşteri Kaydı Aç
                          </button>
                        </div>
                      ) : (
                        searchResults.map((c) => {
                          const isSel = c.id === selectedCustomerId
                          const displayName = c.type === "corporate" && c.companyTitle ? c.companyTitle : `${c.name} ${c.surname || ""}`.trim()
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedCustomerId(c.id)
                                setIsDropdownOpen(false)
                                setCustomerSearch("")
                              }}
                              className={cn(
                                "w-full p-3 text-left flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-xs",
                                isSel && "bg-sky-500/10 dark:bg-sky-950/30"
                              )}
                            >
                              <div className="flex items-center gap-2.5 overflow-hidden">
                                <div className={cn(
                                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold",
                                  c.type === "corporate"
                                    ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                                    : "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                                )}>
                                  {c.type === "corporate" ? <Building2 size={15} /> : <User size={15} />}
                                </div>
                                <div className="overflow-hidden">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                      {displayName}
                                    </span>
                                    {c.isLead && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                                        ⚡ Lead
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-400 font-mono">
                                    {c.phone} {c.vehicles.length > 0 && `• ${c.vehicles.length} Araç`}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {c.vehicles.slice(0, 2).map((v: any) => (
                                  <span key={v.id} className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                                    {v.plate}
                                  </span>
                                ))}
                                {isSel && <Check size={16} className="text-sky-500 ml-1" />}
                              </div>
                            </button>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Customer Card Preview */}
                {selectedCustomer && (
                  <div className="p-3.5 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-900/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs",
                        selectedCustomer.type === "corporate"
                          ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                          : "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                      )}>
                        {selectedCustomer.type === "corporate" ? <Building2 size={18} /> : <User size={18} />}
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {selectedCustomer.type === "corporate" && selectedCustomer.companyTitle
                              ? selectedCustomer.companyTitle
                              : `${selectedCustomer.name} ${selectedCustomer.surname || ""}`.trim()}
                          </p>
                          {selectedCustomer.isLead ? (
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              ⚡ Potansiyel (Lead)
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              Kayıtlı Müşteri
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          {selectedCustomer.phone} • {customerVehicles.length} Kayıtlı Araç
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(true)
                        setCustomerSearch("")
                      }}
                      className="text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline cursor-pointer shrink-0"
                    >
                      Değiştir
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: QUICK LEAD REGISTRATION FORM */}
            {customerMode === "quick-lead" && (
              <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-900 dark:text-amber-300">
                        1 Adımda Hızlı Potansiyel Müşteri & Araç Kaydı
                      </p>
                      <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                        İlk telefon veya dükkan temasında ad, telefon ve plaka alarak anında randevu oluşturun.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomerMode("search")}
                    className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Vazgeç
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Müşteri Adı <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Mehmet"
                      value={quickLeadFirstName}
                      onChange={(e) => setQuickLeadFirstName(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    {quickLeadErrors.firstName && (
                      <p className="text-[10px] text-rose-500">{quickLeadErrors.firstName}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Soyadı (Opsiyonel)
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Yılmaz"
                      value={quickLeadLastName}
                      onChange={(e) => setQuickLeadLastName(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Telefon Numarası <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="05XX XXX XX XX"
                      value={quickLeadPhone}
                      onChange={(e) => setQuickLeadPhone(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    {quickLeadErrors.phone && (
                      <p className="text-[10px] text-rose-500">{quickLeadErrors.phone}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Araç Plakası <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="34 ABC 123"
                      value={quickLeadPlate}
                      onChange={(e) => setQuickLeadPlate(e.target.value.toUpperCase())}
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    {quickLeadErrors.plate && (
                      <p className="text-[10px] text-rose-500">{quickLeadErrors.plate}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Araç Marka & Model
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        placeholder="Marka (Fiat)"
                        value={quickLeadBrand}
                        onChange={(e) => setQuickLeadBrand(e.target.value)}
                        className="w-full h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <input
                        type="text"
                        placeholder="Model (Egea)"
                        value={quickLeadModel}
                        onChange={(e) => setQuickLeadModel(e.target.value)}
                        className="w-full h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Model Yılı
                    </label>
                    <input
                      type="number"
                      placeholder="2022"
                      value={quickLeadYear}
                      onChange={(e) => setQuickLeadYear(Number(e.target.value))}
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    onClick={handleQuickLeadSubmit}
                    disabled={quickLeadMutation.isPending}
                    className="h-9 px-4 rounded-xl text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    <Sparkles size={13} />
                    <span>{quickLeadMutation.isPending ? "Kaydediliyor..." : "Kaydet ve Randevuya Seç"}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: ADAPTIVE VEHICLE SELECTION (HANDLES 1, 2-3, OR 20-30 FLEET VEHICLES) */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-800/70">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Car size={15} className="text-sky-500" />
                <span>Randevu Alınacak Araç ({customerVehicles.length})</span>
                <span className="text-rose-500">*</span>
              </label>

              {customerVehicles.length > 3 && (
                <span className="text-[11px] text-slate-400">
                  Kurumsal Filo Modu (Arama Aktif)
                </span>
              )}
            </div>

            {customerVehicles.length === 0 ? (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-center space-y-2">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Bu müşteriye ait kayıtlı araç bulunamadı.
                </p>
                <button
                  type="button"
                  onClick={() => setCustomerMode("quick-lead")}
                  className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  + Hızlı Kayıt ile Araç Ekle
                </button>
              </div>
            ) : customerVehicles.length === 1 ? (
              /* CASE 1: Exactly 1 vehicle -> Auto-selected card */
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <PlateBadge plate={customerVehicles[0].plate} size="md" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {customerVehicles[0].brand} {customerVehicles[0].model}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {customerVehicles[0].year ? `${customerVehicles[0].year} Model • ` : ""}
                      {(Number(customerVehicles[0].kilometer ?? 0)).toLocaleString("tr-TR")} KM
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl">
                  <CheckCircle2 size={14} />
                  <span>Otomatik Seçildi</span>
                </div>
              </div>
            ) : customerVehicles.length <= 3 ? (
              /* CASE 2: 2 or 3 vehicles -> Segmented pill buttons */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {customerVehicles.map((v: any) => {
                  const isSel = v.id === selectedVehicleId
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVehicleId(v.id)}
                      className={cn(
                        "p-2.5 rounded-2xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer",
                        isSel
                          ? "bg-sky-500/15 border-sky-500 text-slate-900 dark:text-slate-100 shadow-sm"
                          : "bg-slate-50/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                      )}
                    >
                      <div className="space-y-1 overflow-hidden">
                        <PlateBadge plate={v.plate} size="sm" />
                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                          {v.brand} {v.model}
                        </p>
                      </div>
                      {isSel && <CheckCircle2 size={16} className="text-sky-500 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            ) : (
              /* CASE 3: 4+ Vehicles (Fleets with 20-30 cars) -> Filter bar + Scrollable List */
              <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filo içinde plaka veya model ara (örn: 34...)"
                    value={vehicleSearch}
                    onChange={(e) => setVehicleSearch(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1 divide-y divide-slate-100 dark:divide-slate-800/50 pr-1">
                  {filteredVehicles.length === 0 ? (
                    <p className="text-center py-3 text-[11px] text-slate-400">
                      Aramanıza uygun araç bulunamadı.
                    </p>
                  ) : (
                    filteredVehicles.map((v: any) => {
                      const isSel = v.id === selectedVehicleId
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVehicleId(v.id)}
                          className={cn(
                            "w-full pt-1.5 pb-1.5 px-2 rounded-xl text-left flex items-center justify-between gap-2 transition-colors cursor-pointer",
                            isSel ? "bg-sky-500/15 font-bold" : "hover:bg-slate-100 dark:hover:bg-slate-800/60"
                          )}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <PlateBadge plate={v.plate} size="sm" />
                            <span className="text-xs text-slate-800 dark:text-slate-200 truncate">
                              {v.brand} {v.model} ({v.year || "Yıl yok"})
                            </span>
                          </div>
                          {isSel ? (
                            <CheckCircle2 size={15} className="text-sky-500 shrink-0" />
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {v.kilometer ? `${v.kilometer} km` : ""}
                            </span>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: DATE, TIME & ASSIGNED STAFF */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/70 dark:border-slate-800/70">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Tarih <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Saat Slotu <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                value={time}
                step={1800} // 30 min
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Atanan Usta / Teknisyen
              </label>
              <select
                value={assignedStaff}
                onChange={(e) => setAssignedStaff(e.target.value)}
                className="w-full h-10 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="Ahmet Usta">Ahmet Usta (Motor & Mekanik)</option>
                <option value="Mustafa Usta">Mustafa Usta (Oto Elektrik)</option>
                <option value="Ali Usta">Ali Usta (Ön Takım & Fren)</option>
              </select>
            </div>
          </div>

          {/* SECTION 4: REQUESTED SERVICES (NOW FULLY OPTIONAL) */}
          <div className="space-y-2 pt-2 border-t border-slate-200/70 dark:border-slate-800/70">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Wrench size={15} className="text-sky-500" />
                  <span>Talep Edilen Hizmetler ({selectedServices.length})</span>
                  <span className="text-[11px] text-slate-400 font-normal">(Opsiyonel)</span>
                </label>
              </div>

              <span className="text-xs text-sky-600 dark:text-sky-400 font-bold font-mono">
                {selectedServices.length > 0 ? (
                  <>~{totalDuration} dk • {totalPrice.toLocaleString("tr-TR")} ₺</>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400">Arıza tespiti sonrası belirlenecek (~30 dk)</span>
                )}
              </span>
            </div>

            {/* Info callout regarding optional service selection */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2 text-[11px] text-slate-500">
              <Info size={14} className="text-sky-500 shrink-0" />
              <span>
                Müşterinin şikayet sebebi randevu anında kesinleşmemişse hizmet seçimi yapılması zorunlu değildir.
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {DEFAULT_SERVICES.map((srv) => {
                const isSelected = selectedServices.some((s) => s.id === srv.id)
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => handleToggleService(srv)}
                    className={cn(
                      "p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer text-xs focus:outline-none focus:ring-0 select-none",
                      isSelected
                        ? "bg-sky-500/15 border-sky-500 text-slate-900 dark:text-slate-100 shadow-sm font-semibold"
                        : "bg-slate-50/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200 active:bg-slate-200 dark:active:bg-slate-800"
                    )}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div
                        className={cn(
                          "w-4 h-4 rounded-md border flex items-center justify-center text-white shrink-0 transition-colors",
                          isSelected ? "bg-sky-500 border-sky-500" : "border-slate-300 dark:border-slate-700"
                        )}
                      >
                        {isSelected && <CheckCircle2 size={12} />}
                      </div>
                      <span className="truncate">{srv.name}</span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px] shrink-0">
                      <span className="text-slate-400">{srv.durationMinutes} dk</span>
                      <span className="font-bold text-sky-600 dark:text-sky-400">{srv.price} ₺</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* SECTION 5: CUSTOMER NOTES & COMPLAINT */}
          <div className="space-y-1 pt-2 border-t border-slate-200/70 dark:border-slate-800/70">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Müşteri Talebi / Özel Şikayet
            </label>
            <input
              type="text"
              placeholder="Örn: Sabahları soğukken motordan tıkırtı sesi geliyor, sebebini bilmiyor."
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {errors.customer && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle size={15} />
              <span>{errors.customer}</span>
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-500" />
            <span>Kayıt sonrasında randevu takvimi anında güncellenir.</span>
          </div>

          <div className="flex items-center gap-2">
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
              onClick={handleSubmit}
              disabled={createAppointmentMutation.isPending}
              className="h-10 px-5 text-xs font-semibold gap-1.5 cursor-pointer shadow-md shadow-sky-500/20"
            >
              <Plus size={14} />
              <span>{createAppointmentMutation.isPending ? "Kaydediliyor..." : "Randevuyu Kaydet"}</span>
            </Button>
          </div>
        </div>

      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
