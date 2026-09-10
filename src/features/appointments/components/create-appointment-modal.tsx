"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  X,
  Calendar,
  User,
  Search,
  UserPlus,
  Plus,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Appointment, AppointmentServiceItem } from "../types"
import { useCustomers, type QuickLeadResponse } from "@/features/customers/api/use-customers"
import { useCreateAppointment } from "@/features/appointments/api/use-appointments"
import { useStaff, type StaffRecord } from "@/features/settings/api/use-settings"
import { useAuth } from "@/features/auth/auth-context"
import { cn } from "@/lib/utils"
import {
  appointmentCreateSchema,
  AppointmentCreateValues,
} from "../schemas/appointment.schema"
import {
  CustomerSearchSelect,
  CustomerOption,
} from "./customer-search-select"
import { QuickLeadSubForm } from "./quick-lead-sub-form"
import {
  ServicePicker,
  DEFAULT_APPOINTMENT_SERVICES,
} from "./service-picker"

interface CreateAppointmentModalProps {
  isOpen: boolean
  initialDate?: string
  initialTime?: string
  onClose: () => void
  onCreated: (appointment: Appointment) => void
}

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
  const { data: staffList = [] } = useStaff()
  const createAppointmentMutation = useCreateAppointment()

  // Filter actual workshop technicians / mechanics (exclude administrative OWNER/CASHIER)
  const mechanicStaffList = React.useMemo(() => {
    return (staffList as StaffRecord[]).filter((s) => {
      if (s.isActive === false) return false
      if (s.role === "OWNER" || s.role === "CASHIER" || s.role === "SUPER_ADMIN") {
        return !!s.mechanic
      }
      return true
    })
  }, [staffList])

  // Mode: "search" vs "quick-lead"
  const [customerMode, setCustomerMode] = React.useState<"search" | "quick-lead">("search")
  const [selectedServices, setSelectedServices] = React.useState<AppointmentServiceItem[]>([])

  const customers: CustomerOption[] = React.useMemo(() => {
    if (!apiCustomers) return []
    return apiCustomers.map((c) => ({
      id: c.id,
      name: c.firstName || c.name,
      surname: c.lastName || c.surname,
      phone: c.phone,
      isLead: Boolean(c.isLead),
      type: (c.type === "CORPORATE" || c.type === "corporate") ? ("corporate" as const) : ("individual" as const),
      companyTitle: c.companyTitle,
      vehicles: (c.vehicles || []).map((v) => ({
        id: v.id,
        plate: v.plate,
        brand: v.brand,
        model: v.model,
        year: v.year,
        kilometer: Number(v.kilometer ?? 0),
      })),
    }))
  }, [apiCustomers])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AppointmentCreateValues>({
    resolver: zodResolver(appointmentCreateSchema),
    defaultValues: {
      customerId: "",
      vehicleId: "",
      date: initialDate || new Date().toISOString().split("T")[0],
      time: initialTime || "10:00",
      assignedStaffId: "Ahmet Usta",
      customerNote: "",
    },
  })

  const selectedCustomerId = watch("customerId") || ""
  const selectedVehicleId = watch("vehicleId") || ""

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (initialDate) setValue("date", initialDate)
    if (initialTime) setValue("time", initialTime)
  }, [initialDate, initialTime, setValue])

  // Update selected vehicle when customer changes
  React.useEffect(() => {
    if (!selectedCustomerId) {
      setValue("vehicleId", "")
      return
    }
    const cust = customers.find((c) => c.id === selectedCustomerId)
    if (cust && cust.vehicles.length > 0) {
      const belongs = cust.vehicles.some((v) => v.id === selectedVehicleId)
      if (!belongs) {
        setValue("vehicleId", cust.vehicles[0].id)
      }
    } else {
      setValue("vehicleId", "")
    }
  }, [selectedCustomerId, selectedVehicleId, customers, setValue])

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
  const selectedVehicle = selectedCustomer?.vehicles.find((v) => v.id === selectedVehicleId)

  const handleToggleService = (item: AppointmentServiceItem) => {
    const exists = selectedServices.some((s) => s.id === item.id)
    if (exists) {
      setSelectedServices(selectedServices.filter((s) => s.id !== item.id))
    } else {
      setSelectedServices([...selectedServices, item])
    }
  }

  const handleQuickLeadSuccess = (customer: QuickLeadResponse["customer"], vehicle: QuickLeadResponse["vehicle"]) => {
    setValue("customerId", customer.id)
    setValue("vehicleId", vehicle.id)
    setCustomerMode("search")
  }

  const onSubmit = async (values: AppointmentCreateValues) => {
    if (!selectedCustomer || !selectedVehicle) return

    const totalDuration = selectedServices.length > 0
      ? selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0)
      : 30
    const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0)

    const [hours, minutes] = (values.time || "10:00").split(":").map(Number)
    const startDateTime = new Date(values.date || new Date())
    startDateTime.setHours(hours || 10, minutes || 0, 0, 0)
    const endDateTime = new Date(startDateTime.getTime() + totalDuration * 60000)

    try {
      const primaryServiceId = selectedServices.length > 0 ? selectedServices[0].id : undefined

      const createdApp = await createAppointmentMutation.mutateAsync({
        customerId: selectedCustomer.id,
        vehicleId: selectedVehicle.id,
        serviceId: primaryServiceId,
        slotDate: values.date,
        slotStartTime: startDateTime.toISOString(),
        slotEndTime: endDateTime.toISOString(),
        customerNotes: values.customerNote?.trim() || undefined,
      })

      const newApp: Appointment = {
        id: createdApp?.id || "app_" + Date.now(),
        tenantId: tenant?.id || "tenant_1",
        customerId: selectedCustomer.id,
        customerName:
          selectedCustomer.type === "corporate" && selectedCustomer.companyTitle
            ? selectedCustomer.companyTitle
            : `${selectedCustomer.name} ${selectedCustomer.surname || ""}`.trim(),
        customerPhone: selectedCustomer.phone,
        vehicleId: selectedVehicle.id,
        plate: selectedVehicle.plate,
        brand: selectedVehicle.brand,
        model: selectedVehicle.model,
        services:
          selectedServices.length > 0
            ? selectedServices
            : [
                {
                  id: "s_diag",
                  name: "Arıza Teşhisi & Ekspertiz (Belirlenecek)",
                  durationMinutes: 30,
                  price: 0,
                },
              ],
        totalDurationMinutes: totalDuration,
        totalEstimatedPrice: totalPrice,
        assignedStaffName: values.assignedStaffId || "Ahmet Usta",
        date: values.date || "",
        time: values.time || "10:00",
        status: "CONFIRMED",
        customerNote: values.customerNote?.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      onCreated(newApp)
      reset()
      setSelectedServices([])
      onClose()
    } catch (err: unknown) {
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
                Müşteri arayın veya hızlı müşteri kaydı oluşturarak randevu tanımlayın.
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
                  <UserPlus size={13} className="text-amber-500" />
                  <span>Hızlı Kayıt (Potansiyel)</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT: SEARCH MODE VS QUICK LEAD */}
            {customerMode === "search" ? (
              <CustomerSearchSelect
                customers={customers}
                selectedCustomerId={selectedCustomerId}
                selectedVehicleId={selectedVehicleId}
                onSelectCustomer={(id) => setValue("customerId", id, { shouldValidate: true })}
                onSelectVehicle={(id) => setValue("vehicleId", id, { shouldValidate: true })}
                onSwitchToQuickLead={() => setCustomerMode("quick-lead")}
                customerError={errors.customerId?.message}
                vehicleError={errors.vehicleId?.message}
              />
            ) : (
              <QuickLeadSubForm
                onSuccess={handleQuickLeadSuccess}
                onCancel={() => setCustomerMode("search")}
              />
            )}
          </div>

          {/* SECTION 2: DATE, TIME & ASSIGNED STAFF */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/70 dark:border-slate-800/70">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Tarih <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                {...register("date")}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              {errors.date && (
                <p className="text-[10px] text-rose-500 font-medium">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Saat Slotu <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                step={1800} // 30 min
                {...register("time")}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Atanan Usta / Teknisyen
              </label>
              <select
                {...register("assignedStaffId")}
                className="w-full h-10 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="">Usta / Teknisyen Seçiniz (Opsiyonel)</option>
                {mechanicStaffList.map((st: StaffRecord) => (
                  <option key={st.id} value={st.id}>
                    {st.name} {st.surname || ""} ({st.specialty || (st.role === "TECHNICIAN" ? "Teknisyen" : st.role)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SECTION 3: REQUESTED SERVICES (OPTIONAL) */}
          <ServicePicker
            services={DEFAULT_APPOINTMENT_SERVICES}
            selectedServices={selectedServices}
            onToggleService={handleToggleService}
          />

          {/* SECTION 4: CUSTOMER NOTES & COMPLAINT */}
          <div className="space-y-1 pt-2 border-t border-slate-200/70 dark:border-slate-800/70">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Müşteri Talebi / Özel Şikayet
            </label>
            <input
              type="text"
              placeholder="Örn: Sabahları soğukken motordan tıkırtı sesi geliyor, sebebini bilmiyor."
              {...register("customerNote")}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {errors.customerNote && (
              <p className="text-[10px] text-rose-500">{errors.customerNote.message}</p>
            )}
          </div>

          {errors.root && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle size={15} />
              <span>{errors.root.message}</span>
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
              onClick={handleSubmit(onSubmit)}
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
