"use client"

import * as React from "react"
import { createPortal } from "react-dom"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { useUpdateVehicle } from "../api/use-vehicles"

export interface EditVehicleModalProps {
  isOpen: boolean
  vehicle: any | null
  onClose: () => void
  onUpdated?: (updatedVehicle: any) => void
}

const FUEL_OPTIONS = ["Benzin", "Dizel", "LPG", "Hibrit", "Elektrik"] as const
const TRANSMISSION_OPTIONS = ["Otomatik", "Manuel"] as const

function mapFuelToTR(fuel?: string): string {
  if (!fuel) return "Benzin"
  const upper = fuel.toUpperCase()
  if (upper === "GASOLINE" || upper === "BENZIN") return "Benzin"
  if (upper === "DIESEL" || upper === "DIZEL") return "Dizel"
  if (upper === "LPG") return "LPG"
  if (upper === "HYBRID" || upper === "HIBRIT") return "Hibrit"
  if (upper === "ELECTRIC" || upper === "ELEKTRIK") return "Elektrik"
  return fuel
}

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

function mapTransToTR(trans?: string): string {
  if (!trans) return "Otomatik"
  const upper = trans.toUpperCase()
  if (upper === "MANUAL" || upper === "MANUEL") return "Manuel"
  return "Otomatik"
}

function mapTransToEnum(trans: string): string {
  return trans === "Manuel" ? "MANUAL" : "AUTOMATIC"
}

export function EditVehicleModal({
  isOpen,
  vehicle,
  onClose,
  onUpdated,
}: EditVehicleModalProps) {
  const [mounted, setMounted] = React.useState(false)
  const [plate, setPlate] = React.useState("")
  const [brand, setBrand] = React.useState("")
  const [model, setModel] = React.useState("")
  const [year, setYear] = React.useState<number>(new Date().getFullYear())
  const [kilometer, setKilometer] = React.useState<number | "">(0)
  const [fuelType, setFuelType] = React.useState<string>("Benzin")
  const [transmission, setTransmission] = React.useState<string>("Otomatik")
  const [color, setColor] = React.useState("")
  const [vin, setVin] = React.useState("")
  const [engineNo, setEngineNo] = React.useState("")

  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const updateVehicleMutation = useUpdateVehicle()
  const maxYear = new Date().getFullYear() + 1

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Sync state with incoming vehicle
  React.useEffect(() => {
    if (vehicle) {
      setPlate(vehicle.plate || "")
      setBrand(vehicle.brand || "")
      setModel(vehicle.model || "")
      setYear(Number(vehicle.year) || new Date().getFullYear())
      setKilometer(
        vehicle.kilometer !== undefined
          ? vehicle.kilometer
          : vehicle.currentKm !== undefined
          ? vehicle.currentKm
          : vehicle.mileage !== undefined
          ? vehicle.mileage
          : 0
      )
      setFuelType(mapFuelToTR(vehicle.fuelType))
      setTransmission(mapTransToTR(vehicle.transmission))
      setColor(vehicle.color || "")
      setVin(vehicle.vin || "")
      setEngineNo(vehicle.engineNo || "")
      setErrors({})
    }
  }, [vehicle, isOpen])

  // Body scroll lock
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = "auto"
      }
    }
  }, [isOpen])

  if (!isOpen || !mounted || !vehicle) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}

    const cleanPlate = plate.toUpperCase().trim()
    if (!cleanPlate) {
      errs.plate = "Plaka zorunludur."
    } else if (cleanPlate.length < 2) {
      errs.plate = "Plaka en az 2 karakter olmalıdır."
    }

    if (!brand.trim()) errs.brand = "Marka zorunludur."
    if (!model.trim()) errs.model = "Model zorunludur."

    if (!year || year < 1950 || year > maxYear) {
      errs.year = `Model yılı 1950 ile ${maxYear} arasında olmalıdır.`
    }

    if (kilometer !== "" && Number(kilometer) < 0) {
      errs.kilometer = "Kilometre negatif olamaz."
    }

    if (vin.trim() && vin.trim().length !== 17) {
      errs.vin = "Şasi numarası (VIN) 17 karakter olmalıdır."
    }

    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setIsSubmitting(true)
    try {
      const payload = {
        plate: cleanPlate,
        brand: brand.trim(),
        model: model.trim(),
        year: Number(year),
        currentKm: Number(kilometer) || 0,
        fuelType: mapFuelToEnum(fuelType),
        transmission: mapTransToEnum(transmission),
        color: color.trim() || undefined,
        vin: vin.trim().toUpperCase() || undefined,
        engineNo: engineNo.trim().toUpperCase() || undefined,
      }

      const updated = await updateVehicleMutation.mutateAsync({
        id: vehicle.id,
        data: payload,
      })

      const updatedVehicleObj = {
        ...vehicle,
        ...updated,
        plate: cleanPlate,
        brand: brand.trim(),
        model: model.trim(),
        year: Number(year),
        kilometer: Number(kilometer) || 0,
        currentKm: Number(kilometer) || 0,
        fuelType,
        transmission,
        color: color.trim(),
        vin: vin.trim().toUpperCase(),
        engineNo: engineNo.trim().toUpperCase(),
      }

      if (onUpdated) {
        onUpdated(updatedVehicleObj)
      }

      onClose()
    } catch {
      // Error handled by mutation toast
    } finally {
      setIsSubmitting(false)
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Car size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Araç Bilgilerini Düzenle
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[280px]">
                {vehicle.customerName ? `${vehicle.customerName} • ` : ""}{vehicle.brand} {vehicle.model}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {plate && (
            <div className="flex justify-center pb-1">
              <PlateBadge plate={plate} size="md" />
            </div>
          )}

          <div className="space-y-3">
            {/* Plate Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Araç Plakası <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="34 ABC 123"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-mono font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              {errors.plate && <p className="text-[10px] text-rose-500">{errors.plate}</p>}
            </div>

            {/* Brand & Model */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Marka <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: Volkswagen"
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
                  placeholder="Örn: Golf"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {errors.model && <p className="text-[10px] text-rose-500">{errors.model}</p>}
              </div>
            </div>

            {/* Year & KM */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Calendar size={12} className="text-slate-400" />
                  <span>Model Yılı</span>
                </label>
                <input
                  type="number"
                  min={1950}
                  max={maxYear}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono text-center focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {errors.year && <p className="text-[10px] text-rose-500">{errors.year}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Gauge size={12} className="text-slate-400" />
                  <span>Güncel Kilometre (KM)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={kilometer}
                  onChange={(e) => setKilometer(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {errors.kilometer && <p className="text-[10px] text-rose-500">{errors.kilometer}</p>}
              </div>
            </div>

            {/* Fuel Type & Transmission */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Fuel size={12} className="text-slate-400" />
                  <span>Yakıt Türü</span>
                </label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  {FUEL_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Settings2 size={12} className="text-slate-400" />
                  <span>Şanzıman</span>
                </label>
                <select
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  {TRANSMISSION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Optional Details: VIN & Color */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Fingerprint size={12} className="text-slate-400" />
                  <span>Şasi No (VIN)</span>
                </label>
                <input
                  type="text"
                  placeholder="17 Haneli Şasi No"
                  maxLength={17}
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {errors.vin && <p className="text-[10px] text-rose-500">{errors.vin}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Palette size={12} className="text-slate-400" />
                  <span>Renk</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: Beyaz, Metalik Gri"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-10 px-4 text-xs font-semibold cursor-pointer"
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-5 text-xs font-semibold gap-1.5 cursor-pointer shadow-md shadow-sky-500/20"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Değişiklikleri Kaydet</span>
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
