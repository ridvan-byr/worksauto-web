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
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Appointment, AppointmentServiceItem } from "../types"
import { useCustomers } from "@/features/customers/api/use-customers"
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

  const customers = React.useMemo(() => {
    if (!apiCustomers) return []
    return apiCustomers.map((c: any) => ({
      id: c.id,
      name: c.firstName,
      surname: c.lastName,
      phone: c.phone,
      type: c.type === 'CORPORATE' ? 'corporate' : 'individual',
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

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>("")
  const [selectedVehicleId, setSelectedVehicleId] = React.useState<string>("")

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
  const [selectedServices, setSelectedServices] = React.useState<AppointmentServiceItem[]>([DEFAULT_SERVICES[0]])
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
      setSelectedVehicleId(cust.vehicles[0].id)
    }
  }, [selectedCustomerId, customers])

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
  const selectedVehicle = selectedCustomer?.vehicles.find((v: any) => v.id === selectedVehicleId)

  // Calculations
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0)
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0)

  // Capacity check
  const activeLifts = tenant?.activeLiftCount || 3
  const isCapacityWarning = false // Simule kapasite uyarı bayrağı

  const handleToggleService = (item: AppointmentServiceItem) => {
    const exists = selectedServices.some((s) => s.id === item.id)
    if (exists) {
      if (selectedServices.length === 1) return // en az 1 hizmet kalmalı
      setSelectedServices(selectedServices.filter((s) => s.id !== item.id))
    } else {
      setSelectedServices([...selectedServices, item])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer || !selectedVehicle) {
      setErrors({ customer: "Lütfen geçerli bir müşteri ve araç seçin." })
      return
    }

    const [hours, minutes] = time.split(":").map(Number)
    const startDateTime = new Date(date)
    startDateTime.setHours(hours || 10, minutes || 0, 0, 0)
    const endDateTime = new Date(startDateTime.getTime() + (totalDuration || 60) * 60000)

    try {
      const createdApp: any = await createAppointmentMutation.mutateAsync({
        customerId: selectedCustomer.id,
        vehicleId: selectedVehicle.id,
        slotDate: date,
        slotStartTime: startDateTime.toISOString(),
        slotEndTime: endDateTime.toISOString(),
        customerNotes: customerNote.trim() || undefined,
      })

      const newApp: Appointment = {
        id: createdApp?.id || "app_" + Date.now(),
        tenantId: tenant?.id || "tenant_1",
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.type === "corporate" && selectedCustomer.companyTitle ? selectedCustomer.companyTitle : `${selectedCustomer.name} ${selectedCustomer.surname}`,
        customerPhone: selectedCustomer.phone,
        vehicleId: selectedVehicle.id,
        plate: selectedVehicle.plate,
        brand: selectedVehicle.brand,
        model: selectedVehicle.model,
        services: selectedServices,
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <Calendar size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Yeni Servis Randevusu Oluştur
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Müşteri, araç, tarih slotu ve yapılacak işlemleri belirleyin.
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

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Customer & Vehicle Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Müşteri Seçimi <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.type === "corporate" && c.companyTitle ? c.companyTitle : `${c.name} ${c.surname}`} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Araç & Plaka <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {selectedCustomer?.vehicles.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.plate} — {v.brand} {v.model}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Vehicle Mini Badge Card */}
          {selectedVehicle && (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <PlateBadge plate={selectedVehicle.plate} size="sm" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {selectedVehicle.brand} {selectedVehicle.model}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {selectedVehicle.year ? `${selectedVehicle.year} Model • ` : ""}{(Number(selectedVehicle.kilometer ?? 0)).toLocaleString("tr-TR")} KM
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                Kayıtlı Araç
              </span>
            </div>
          )}

          {/* Date, Time & Mechanic */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                step={1800} // 30 dk
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Atanan Usta
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

          {/* Service Items Selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Talep Edilen Hizmetler ({selectedServices.length}) <span className="text-rose-500">*</span></span>
              <span className="text-[11px] text-sky-600 dark:text-sky-400 font-bold font-mono">
                Toplam: ~{totalDuration} dk • {totalPrice.toLocaleString("tr-TR")} ₺
              </span>
            </label>

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

          {/* Customer Note */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Müşteri Talebi / Özel Şikayet
            </label>
            <input
              type="text"
              placeholder="Örn: Sabahları soğukken motordan tıkırtı geliyor."
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Footer Action */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-500" />
              <span>Kayıt sonrasında müşteriye otomatik SMS onayı simüle edilir.</span>
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
                type="submit"
                className="h-10 px-5 text-xs font-semibold gap-1.5 cursor-pointer shadow-md shadow-sky-500/20"
              >
                <Plus size={14} />
                <span>Randevuyu Kaydet</span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
