"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { X, Wrench, Play, ArrowRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WorkOrder } from "../types"
import { useCustomers } from "@/features/customers/api/use-customers"
import { useCreateWorkOrder } from "@/features/work-orders/api/use-work-orders"
import { useStaff, useWorkshopBays } from "@/features/settings/api/use-settings"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import {
  createWorkOrderModalSchema,
  CreateWorkOrderModalValues,
} from "../schemas/work-order.schema"

interface ModalVehicle {
  id: string
  plate: string
  brand: string
  model: string
  year?: number
  kilometer: number
  vin?: string
}

interface ModalCustomer {
  id: string
  name: string
  surname?: string
  phone: string
  type: "corporate" | "individual"
  companyTitle?: string
  vehicles: ModalVehicle[]
}

interface CreateWorkOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (order: WorkOrder) => void
}

export function CreateWorkOrderModal({ isOpen, onClose, onCreated }: CreateWorkOrderModalProps) {
  const [mounted, setMounted] = React.useState(false)
  const [step, setStep] = React.useState<1 | 2>(1)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const { data: apiCustomers } = useCustomers()
  const { data: staffList = [] } = useStaff()
  const { data: bays = [] } = useWorkshopBays()
  const createOrderMutation = useCreateWorkOrder()

  // Only actual workshop technicians / mechanics (exclude administrative OWNER/CASHIER)
  const mechanicStaffList = React.useMemo(() => {
    return staffList.filter((s) => {
      if (s.isActive === false) return false
      if (s.role === "OWNER" || s.role === "CASHIER" || s.role === "SUPER_ADMIN") {
        return !!s.mechanic
      }
      return s.role === "TECHNICIAN" || !!s.mechanic
    })
  }, [staffList])

  const customers: ModalCustomer[] = React.useMemo(() => {
    if (!apiCustomers) return []
    return apiCustomers.map((c) => ({
      id: c.id,
      name: c.firstName || c.name,
      surname: c.lastName || c.surname,
      phone: c.phone,
      type: (c.type === "CORPORATE" || c.type === "corporate") ? "corporate" : "individual",
      companyTitle: c.companyTitle,
      vehicles: (c.vehicles || []).map((v) => ({
        id: v.id,
        plate: v.plate,
        brand: v.brand,
        model: v.model,
        year: v.year,
        kilometer: Number(v.kilometer ?? 0),
        vin: v.vin,
      })),
    }))
  }, [apiCustomers])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    reset,
    formState: { errors },
  } = useForm<CreateWorkOrderModalValues>({
    resolver: zodResolver(createWorkOrderModalSchema),
    defaultValues: {
      customerId: "",
      vehicleId: "",
      assignedLift: "",
      assignedMechanic: "",
      priority: "NORMAL",
      serviceName: "Hızlı Arıza Tespiti & Genel Kontrol",
      laborPrice: 750,
      initialNote: "",
    },
  })

  const selectedCustomerId = watch("customerId")
  const selectedVehicleId = watch("vehicleId")

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-select first customer & vehicle if none selected
  React.useEffect(() => {
    if (customers.length > 0 && !selectedCustomerId) {
      setValue("customerId", customers[0].id)
      if (customers[0].vehicles.length > 0) {
        setValue("vehicleId", customers[0].vehicles[0].id)
      }
    }
  }, [customers, selectedCustomerId, setValue])

  // Sync vehicle when customer changes
  React.useEffect(() => {
    const cust = customers.find((c) => c.id === selectedCustomerId)
    if (cust && cust.vehicles.length > 0) {
      const exists = cust.vehicles.some((v: ModalVehicle) => v.id === selectedVehicleId)
      if (!exists) {
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

  const handleNextStep = async () => {
    const isValid = await trigger(["customerId", "vehicleId"])
    if (isValid) {
      setStep(2)
    }
  }

  const onSubmit = async (values: CreateWorkOrderModalValues) => {
    if (!selectedCustomer || !selectedVehicle) return
    setIsSubmitting(true)

    try {
      // Find mechanic ID from filtered mechanic staff list if assigned
      let assignedMechanicId: string | undefined = undefined
      if (values.assignedMechanic) {
        const staffObj = mechanicStaffList.find(
          (s) => s.id === values.assignedMechanic || s.mechanic?.id === values.assignedMechanic
        )
        assignedMechanicId = staffObj?.mechanic?.id || (staffObj?.role === "TECHNICIAN" ? staffObj.id : undefined)
      }

      const createdOrder = await createOrderMutation.mutateAsync({
        customerId: selectedCustomer.id,
        vehicleId: selectedVehicle.id,
        assignedLift: values.assignedLift ? values.assignedLift : undefined,
        assignedMechanicId: assignedMechanicId || undefined,
        initialKm: Number(selectedVehicle.kilometer || 0),
        items: [
          {
            itemType: "SERVICE",
            name: values.serviceName,
            quantity: 1,
            unitPrice: Number(values.laborPrice || 0),
            kdvRate: 20,
          },
        ],
      })

      onCreated(createdOrder)
      reset()
      setStep(1)
      onClose()
    } catch (err) {
      console.error("İş emri oluşturulamadı:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <Wrench size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{step === 1 ? "1. Müşteri & Araç Seçimi" : "2. Atölye & İşlem Tanımı"}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-500">
                  Adım {step}/2
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {step === 1
                  ? "Randevusuz hızlı kabul yapılacak aracı seçin"
                  : "Lift, usta ataması ve yapılacak ilk işlemi belirleyin"}
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

        {/* Step 1: Customer & Vehicle */}
        {step === 1 && (
          <div className="p-6 space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Müşteri Seçin <span className="text-rose-500">*</span>
              </label>
              <select
                {...register("customerId")}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.type === "corporate" && c.companyTitle
                      ? c.companyTitle
                      : `${c.name} ${c.surname || ""}`.trim()}{" "}
                    ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Kabul Edilen Araç <span className="text-rose-500">*</span>
              </label>
              <select
                {...register("vehicleId")}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {selectedCustomer?.vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate} — {v.brand} {v.model} (
                    {Number(v.kilometer ?? 0).toLocaleString("tr-TR")} KM)
                  </option>
                ))}
              </select>
            </div>

            {errors.customerId && (
              <p className="text-[11px] text-rose-500 font-medium">{errors.customerId.message}</p>
            )}
            {errors.vehicleId && (
              <p className="text-[11px] text-rose-500 font-medium">{errors.vehicleId.message}</p>
            )}

            {selectedVehicle && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <PlateBadge plate={selectedVehicle.plate} size="sm" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {selectedVehicle.brand} {selectedVehicle.model}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {Number(selectedVehicle.kilometer ?? 0).toLocaleString("tr-TR")} KM •{" "}
                      {selectedCustomer?.phone}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex justify-end gap-2">
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
                <span>Atölye Detaylarına Geç</span>
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Workshop Operations */}
        {step === 2 && (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Atanan Lift
                </label>
                <select
                  {...register("assignedLift")}
                  className="w-full h-10 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="">Lift Seçilmedi (Kuyrukta)</option>
                  {bays && bays.length > 0 ? (
                    bays.filter((b) => b.isActive !== false).map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name} ({b.category || "Lift"})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Lift 1">Lift 1</option>
                      <option value="Lift 2">Lift 2</option>
                      <option value="Lift 3">Lift 3</option>
                    </>
                  )}
                </select>
                {errors.assignedLift && (
                  <p className="text-[10px] text-rose-500">{errors.assignedLift.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Atanan Usta / Teknisyen
                </label>
                <select
                  {...register("assignedMechanic")}
                  className="w-full h-10 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="">Atanmamış (Havuzda Beklesin)</option>
                  {mechanicStaffList && mechanicStaffList.length > 0 && (
                    mechanicStaffList.map((s) => {
                      const fullName = `${s.name} ${s.surname || ""}`.trim()
                      const specialty = s.specialty || s.mechanic?.specialty || "Mekanik Teknisyeni"
                      const idVal = s.mechanic?.id || s.id
                      return (
                        <option key={s.id} value={idVal}>
                          {fullName} ({specialty})
                        </option>
                      )
                    })
                  )}
                </select>
                {errors.assignedMechanic && (
                  <p className="text-[10px] text-rose-500">{errors.assignedMechanic.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Başlangıç İşlemi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register("serviceName")}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              {errors.serviceName && (
                <p className="text-[10px] text-rose-500">{errors.serviceName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Taban İşçilik (TL) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  {...register("laborPrice", { valueAsNumber: true })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {errors.laborPrice && (
                  <p className="text-[10px] text-rose-500">{errors.laborPrice.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  İş Önceliği
                </label>
                <select
                  {...register("priority")}
                  className="w-full h-10 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">Yüksek</option>
                  <option value="URGENT">Acil (Öncelikli)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Dahili Not (İsteğe Bağlı)
              </label>
              <input
                type="text"
                placeholder="Usta veya servis notu..."
                {...register("initialNote")}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="h-10 px-4 text-xs font-semibold gap-1 cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Geri</span>
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-5 text-xs font-semibold gap-1.5 cursor-pointer shadow-md shadow-sky-500/20"
              >
                {isSubmitting ? (
                  <span>Kaydediliyor...</span>
                ) : (
                  <>
                    <Play size={14} fill="currentColor" />
                    <span>İş Emrini Başlat</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
