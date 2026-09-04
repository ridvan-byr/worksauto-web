"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X, Wrench, Play, ArrowRight, ArrowLeft, CheckCircle2, User, Car } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WorkOrder, WorkOrderPriority } from "../types"
import { useCustomers } from "@/features/customers/api/use-customers"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { cn } from "@/lib/utils"

interface CreateWorkOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (order: WorkOrder) => void
}

export function CreateWorkOrderModal({ isOpen, onClose, onCreated }: CreateWorkOrderModalProps) {
  const [mounted, setMounted] = React.useState(false)
  const [step, setStep] = React.useState<1 | 2>(1)
  const { data: apiCustomers } = useCustomers()

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
        kilometer: v.mileage || 0,
        vin: v.vin,
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
  const [assignedLift, setAssignedLift] = React.useState("Lift 1 (Mekanik)")
  const [assignedMechanic, setAssignedMechanic] = React.useState("Ahmet Usta")
  const [priority, setPriority] = React.useState<WorkOrderPriority>("NORMAL")
  const [serviceName, setServiceName] = React.useState("Hızlı Arıza Tespiti & Genel Kontrol")
  const [laborPrice, setLaborPrice] = React.useState<number>(750)
  const [initialNote, setInitialNote] = React.useState("")

  React.useEffect(() => {
    setMounted(true)
  }, [])

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer || !selectedVehicle) return

    const newWONumber = "WO-2026-" + Math.floor(100 + Math.random() * 900)
    const newOrder: WorkOrder = {
      id: "wo_" + Date.now(),
      workOrderNumber: newWONumber,
      tenantId: "tenant_1",
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.type === "corporate" && selectedCustomer.companyTitle ? selectedCustomer.companyTitle : `${selectedCustomer.name} ${selectedCustomer.surname}`,
      customerPhone: selectedCustomer.phone,
      vehicleId: selectedVehicle.id,
      plate: selectedVehicle.plate,
      brand: selectedVehicle.brand,
      model: selectedVehicle.model,
      year: selectedVehicle.year || new Date().getFullYear(),
      kilometer: selectedVehicle.kilometer || 0,
      vin: selectedVehicle.vin,
      status: "IN_PROGRESS", // doğrudan lifte alarak açar
      priority,
      assignedLift,
      assignedMechanicName: assignedMechanic,
      services: [
        {
          id: "srv_" + Date.now(),
          name: serviceName,
          durationMinutes: 45,
          laborPrice,
          completed: false,
        },
      ],
      parts: [],
      notes: initialNote.trim()
        ? [
            {
              id: "nt_" + Date.now(),
              authorName: assignedMechanic,
              text: initialNote.trim(),
              createdAt: new Date().toISOString(),
              isInternal: true,
            },
          ]
        : [],
      photos: [],
      laborTotal: laborPrice,
      partsTotal: 0,
      taxRate: 0.20,
      grandTotal: Math.round(laborPrice * 1.20),
      estimatedCompletionTime: "Bugün, 17:00",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    onCreated(newOrder)
    onClose()
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
                {step === 1 ? "Randevusuz hızlı kabul yapılacak aracı seçin" : "Lift, usta ataması ve yapılacak ilk işlemi belirleyin"}
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
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
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
                Kabul Edilen Araç <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {selectedCustomer?.vehicles.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.plate} — {v.brand} {v.model} ({v.kilometer.toLocaleString("tr-TR")} KM)
                  </option>
                ))}
              </select>
            </div>

            {selectedVehicle && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <PlateBadge plate={selectedVehicle.plate} size="sm" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {selectedVehicle.brand} {selectedVehicle.model}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {selectedVehicle.kilometer.toLocaleString("tr-TR")} KM • {selectedCustomer?.phone}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="h-10 px-4 text-xs font-semibold cursor-pointer">
                Vazgeç
              </Button>
              <Button type="button" onClick={() => setStep(2)} className="h-10 px-5 text-xs font-semibold gap-1.5 cursor-pointer">
                <span>Atölye Detaylarına Geç</span>
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Workshop Operations */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Atanan Lift</label>
                <select
                  value={assignedLift}
                  onChange={(e) => setAssignedLift(e.target.value)}
                  className="w-full h-10 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="Lift 1 (Mekanik)">Lift 1 (Mekanik)</option>
                  <option value="Lift 2 (Binek)">Lift 2 (Binek)</option>
                  <option value="Lift 3 (Elektronik & Teşhis)">Lift 3 (Elektronik)</option>
                  <option value="Hızlı Kabul Alanı">Hızlı Kabul Alanı</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Atanan Usta</label>
                <select
                  value={assignedMechanic}
                  onChange={(e) => setAssignedMechanic(e.target.value)}
                  className="w-full h-10 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="Ahmet Usta">Ahmet Usta (Mekanik)</option>
                  <option value="Mustafa Usta">Mustafa Usta (Elektrik)</option>
                  <option value="Ali Usta">Ali Usta (Ön Takım)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Başlangıç İşlemi</label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Taban İşçilik (TL)</label>
                <input
                  type="number"
                  value={laborPrice}
                  onChange={(e) => setLaborPrice(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">İş Önceliği</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full h-10 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">Yüksek</option>
                  <option value="URGENT">Acil (Öncelikli)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Dahili Not (İsteğe Bağlı)</label>
              <input
                type="text"
                placeholder="Usta veya servis notu..."
                value={initialNote}
                onChange={(e) => setInitialNote(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex justify-between gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-10 px-4 text-xs font-semibold gap-1 cursor-pointer">
                <ArrowLeft size={14} />
                <span>Geri</span>
              </Button>
              <Button type="submit" className="h-10 px-5 text-xs font-semibold gap-1.5 cursor-pointer shadow-md shadow-sky-500/20">
                <Play size={14} fill="currentColor" />
                <span>İş Emrini Başlat (Lifte Al)</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
