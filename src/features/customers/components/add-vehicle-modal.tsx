"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X, Car, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Vehicle } from "../types"
import { PlateBadge } from "./plate-badge"

interface AddVehicleModalProps {
  isOpen: boolean
  customerId: string
  customerName: string
  onClose: () => void
  onAdded: (vehicle: Vehicle) => void
}

export function AddVehicleModal({
  isOpen,
  customerId,
  customerName,
  onClose,
  onAdded,
}: AddVehicleModalProps) {
  const [mounted, setMounted] = React.useState(false)
  const [plate, setPlate] = React.useState("")
  const [brand, setBrand] = React.useState("")
  const [model, setModel] = React.useState("")
  const [year, setYear] = React.useState(new Date().getFullYear())
  const [kilometer, setKilometer] = React.useState<number | "">(50000)
  const [vin, setVin] = React.useState("")
  const [fuelType, setFuelType] = React.useState<"Benzin" | "Dizel" | "LPG" | "Hibrit" | "Elektrik">("Benzin")
  const [transmission, setTransmission] = React.useState<"Manuel" | "Otomatik">("Otomatik")

  const [errors, setErrors] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    setMounted(true)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}

    if (!plate.trim()) errs.plate = "Plaka zorunludur."
    if (!brand.trim()) errs.brand = "Marka zorunludur."
    if (!model.trim()) errs.model = "Model zorunludur."

    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    const newVehicle: Vehicle = {
      id: "veh_" + Date.now(),
      tenantId: "tenant_1",
      customerId,
      plate: plate.toUpperCase().trim(),
      brand: brand.trim(),
      model: model.trim(),
      year: Number(year) || new Date().getFullYear(),
      kilometer: Number(kilometer) || 0,
      vin: vin.trim().toUpperCase() || undefined,
      fuelType,
      transmission,
      lastServiceDate: new Date().toISOString().split("T")[0],
    }

    onAdded(newVehicle)
    onClose()
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Car size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Müşteriye Yeni Araç Ekle
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[240px]">
                {customerName}
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {plate && (
            <div className="flex justify-center pb-1">
              <PlateBadge plate={plate} size="sm" />
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Plaka <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="34 ABC 123"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-mono font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-sky-500"
                autoFocus
              />
              {errors.plate && <p className="text-[10px] text-rose-500">{errors.plate}</p>}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Marka *</label>
                <input
                  type="text"
                  placeholder="Örn: Audi"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Model *</label>
                <input
                  type="text"
                  placeholder="Örn: A4"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Model Yılı</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono text-center focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Mevcut KM</label>
                <input
                  type="number"
                  value={kilometer}
                  onChange={(e) => setKilometer(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

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
              type="submit"
              className="h-10 px-5 text-xs font-semibold gap-1.5 cursor-pointer shadow-md shadow-sky-500/20"
            >
              <CheckCircle2 size={14} />
              <span>Aracı Kaydet</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
