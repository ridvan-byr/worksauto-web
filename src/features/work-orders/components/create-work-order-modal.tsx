"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { X, Wrench, Play, ArrowRight, ArrowLeft, User, Search, UserPlus, AlertTriangle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { WorkOrder } from "../types"
import { useCustomers } from "@/features/customers/api/use-customers"
import { useCreateWorkOrder, useWorkOrders } from "@/features/work-orders/api/use-work-orders"
import { useStaff, useWorkshopBays } from "@/features/settings/api/use-settings"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import {
  CustomerSearchSelect,
  CustomerOption,
} from "@/features/appointments/components/customer-search-select"
import { QuickLeadSubForm } from "@/features/appointments/components/quick-lead-sub-form"
import {
  createWorkOrderModalSchema,
  CreateWorkOrderModalValues,
} from "../schemas/work-order.schema"

interface CreateWorkOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (order: WorkOrder) => void
}

export function CreateWorkOrderModal({ isOpen, onClose, onCreated }: CreateWorkOrderModalProps) {
  const router = useRouter()
  const [mounted, setMounted] = React.useState(false)
  const [step, setStep] = React.useState<1 | 2>(1)
  const [customerMode, setCustomerMode] = React.useState<"search" | "quick-lead">("search")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const { data: apiCustomers } = useCustomers()
  const { data: allWorkOrders = [] } = useWorkOrders()
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

  const customers: CustomerOption[] = React.useMemo(() => {
    if (!apiCustomers) return []
    return apiCustomers.map((c) => ({
      id: c.id,
      name: c.firstName || c.name,
      surname: c.lastName || c.surname,
      phone: c.phone,
      isLead: Boolean(c.isLead),
      type: (c.type === "CORPORATE" || c.type === "corporate") ? "corporate" : "individual",
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

  // Sync vehicle when customer changes
  React.useEffect(() => {
    if (!selectedCustomerId) {
      setValue("vehicleId", "")
      return
    }
    const cust = customers.find((c) => c.id === selectedCustomerId)
    if (cust && cust.vehicles.length > 0) {
      const exists = cust.vehicles.some((v) => v.id === selectedVehicleId)
      if (!exists) {
        setValue("vehicleId", cust.vehicles[0].id, { shouldValidate: true })
      }
    } else {
      setValue("vehicleId", "", { shouldValidate: true })
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

  // Detect if selected vehicle already has an active, unfinished work order
  const activeWorkOrderForVehicle = React.useMemo(() => {
    if (!selectedVehicleId || !allWorkOrders) return null
    return allWorkOrders.find(
      (wo) =>
        wo.vehicleId === selectedVehicleId &&
        wo.status !== "COMPLETED" &&
        wo.status !== "CANCELLED"
    )
  }, [selectedVehicleId, allWorkOrders])

  const handleClose = () => {
    reset()
    setStep(1)
    setCustomerMode("search")
    onClose()
  }

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
      setCustomerMode("search")
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
                  ? "Randevusuz hızlı kabul yapılacak aracı seçin veya anında kaydedin"
                  : "Lift, usta ataması ve yapılacak ilk işlemi belirleyin"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step 1: Customer & Vehicle */}
        {step === 1 && (
          <div className="p-6 space-y-4 animate-in fade-in duration-200">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <User size={15} className="text-sky-500" />
                Müşteri Belirleme
              </span>

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
                onSuccess={(cust, veh) => {
                  setValue("customerId", cust.id, { shouldValidate: true })
                  setValue("vehicleId", veh.id, { shouldValidate: true })
                  setCustomerMode("search")
                }}
                onCancel={() => setCustomerMode("search")}
                submitLabel="Kaydet ve İş Emrine Seç"
                description="Servise ilk kez gelen müşteri ve aracı tek adımda kaydedip doğrudan iş emri başlatın."
              />
            )}

            {selectedVehicle && activeWorkOrderForVehicle && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 p-4 text-amber-900 dark:text-amber-200 animate-in fade-in duration-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                    <AlertTriangle size={18} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-amber-900 dark:text-amber-300">
                        Bu Araca Ait Halen Devam Eden Bir İş Emri Var!
                      </p>
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300">
                        #{activeWorkOrderForVehicle.workOrderNumber}
                      </span>
                    </div>
                    <p className="text-xs text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                      <strong>{selectedVehicle.plate}</strong> plakalı araç şu anda atölyede{" "}
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {activeWorkOrderForVehicle.status === "IN_PROGRESS"
                          ? "İşlemde (Onarımda)"
                          : "Kuyrukta (Sırada)"}
                      </span>{" "}
                      durumundadır. Çifte kayıt ve mükerrer fatura oluşmaması için mevcut iş emrine gidebilirsiniz.
                    </p>
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5 cursor-pointer shadow-xs"
                        onClick={() => {
                          handleClose()
                          router.push(`/work-orders/${activeWorkOrderForVehicle.id}`)
                        }}
                      >
                        <ExternalLink size={13} />
                        <span>Mevcut İş Emrine Git (#{activeWorkOrderForVehicle.workOrderNumber})</span>
                      </Button>
                      <span className="text-[11px] text-amber-800/70 dark:text-amber-400/70 italic">
                        (Ayrı bir işlem ise aşağıdan "Atölye Detaylarına Geç" ile devam edebilirsiniz)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {customerMode === "search" && (
              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="h-10 px-4 text-xs font-semibold cursor-pointer"
                >
                  Vazgeç
                </Button>
                <Button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!selectedCustomerId || !selectedVehicleId}
                  className="h-10 px-5 text-xs font-semibold gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>Atölye Detaylarına Geç</span>
                  <ArrowRight size={14} />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Workshop Operations */}
        {step === 2 && (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 animate-in fade-in duration-200">
            {selectedVehicle && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <PlateBadge plate={selectedVehicle.plate} size="sm" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {selectedVehicle.brand} {selectedVehicle.model}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {selectedCustomer?.type === "corporate" && selectedCustomer.companyTitle
                        ? selectedCustomer.companyTitle
                        : `${selectedCustomer?.name} ${selectedCustomer?.surname || ""}`.trim()}{" "}
                      • {selectedCustomer?.phone}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold hover:underline cursor-pointer"
                >
                  Değiştir
                </button>
              </div>
            )}

            {selectedVehicle && activeWorkOrderForVehicle && (
              <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                <AlertTriangle size={15} className="text-amber-500 shrink-0" />
                <span>
                  <strong>Hatırlatma:</strong> Bu araç için halen açık olan <strong>#{activeWorkOrderForVehicle.workOrderNumber}</strong> iş emri bulunmaktadır. Onaylamanız halinde <strong>ek 2. bir iş emri</strong> açılacaktır.
                </span>
              </div>
            )}

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
