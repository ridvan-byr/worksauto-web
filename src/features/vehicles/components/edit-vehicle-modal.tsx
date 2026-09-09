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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { useUpdateVehicle } from "../api/use-vehicles"
import {
  editVehicleSchema,
  EditVehicleFormValues,
} from "../schemas/vehicle.schema"

export interface EditVehicleModalProps {
  isOpen: boolean
  vehicle: any | null
  onClose: () => void
  onUpdated?: (updatedVehicle: any) => void
}

const FUEL_OPTIONS = ["Benzin", "Dizel", "LPG", "Hibrit", "Elektrik"] as const
const TRANSMISSION_OPTIONS = ["Otomatik", "Manuel"] as const

function mapFuelToTR(fuel?: string): (typeof FUEL_OPTIONS)[number] {
  if (!fuel) return "Benzin"
  const upper = fuel.toUpperCase()
  if (upper === "GASOLINE" || upper === "BENZIN") return "Benzin"
  if (upper === "DIESEL" || upper === "DIZEL") return "Dizel"
  if (upper === "LPG") return "LPG"
  if (upper === "HYBRID" || upper === "HIBRIT") return "Hibrit"
  if (upper === "ELECTRIC" || upper === "ELEKTRIK") return "Elektrik"
  return "Benzin"
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

function mapTransToTR(trans?: string): (typeof TRANSMISSION_OPTIONS)[number] {
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
  const updateVehicleMutation = useUpdateVehicle()
  const maxYear = new Date().getFullYear() + 1

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditVehicleFormValues>({
    resolver: zodResolver(editVehicleSchema),
    defaultValues: {
      plate: "",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      kilometer: 0,
      fuelType: "Benzin",
      transmission: "Otomatik",
      color: "",
      vin: "",
      engineNo: "",
    },
  })

  const currentPlate = watch("plate")

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Sync form with incoming vehicle
  React.useEffect(() => {
    if (vehicle) {
      const initialKm =
        vehicle.kilometer !== undefined
          ? vehicle.kilometer
          : vehicle.currentKm !== undefined
          ? vehicle.currentKm
          : vehicle.mileage !== undefined
          ? vehicle.mileage
          : 0

      reset({
        plate: vehicle.plate || "",
        brand: vehicle.brand || "",
        model: vehicle.model || "",
        year: Number(vehicle.year) || new Date().getFullYear(),
        kilometer: Number(initialKm) || 0,
        fuelType: mapFuelToTR(vehicle.fuelType),
        transmission: mapTransToTR(vehicle.transmission),
        color: vehicle.color || "",
        vin: vehicle.vin || "",
        engineNo: vehicle.engineNo || "",
      })
    }
  }, [vehicle, reset, isOpen])

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

  const onSubmit = async (values: EditVehicleFormValues) => {
    const cleanPlate = values.plate.toUpperCase().trim()

    try {
      const payload = {
        plate: cleanPlate,
        brand: values.brand.trim(),
        model: values.model.trim(),
        year: Number(values.year),
        currentKm: Number(values.kilometer) || 0,
        fuelType: mapFuelToEnum(values.fuelType),
        transmission: mapTransToEnum(values.transmission),
        color: values.color?.trim() || undefined,
        vin: values.vin?.trim().toUpperCase() || undefined,
        engineNo: values.engineNo?.trim().toUpperCase() || undefined,
      }

      const updated = await updateVehicleMutation.mutateAsync({
        id: vehicle.id,
        data: payload,
      })

      const updatedVehicleObj = {
        ...vehicle,
        ...updated,
        plate: cleanPlate,
        brand: values.brand.trim(),
        model: values.model.trim(),
        year: Number(values.year),
        kilometer: Number(values.kilometer) || 0,
        currentKm: Number(values.kilometer) || 0,
        fuelType: values.fuelType,
        transmission: values.transmission,
        color: values.color?.trim(),
        vin: values.vin?.trim().toUpperCase(),
        engineNo: values.engineNo?.trim().toUpperCase(),
      }

      if (onUpdated) {
        onUpdated(updatedVehicleObj)
      }

      onClose()
    } catch {
      // Error handled by mutation toast
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
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {currentPlate && (
            <div className="flex justify-center pb-1">
              <PlateBadge plate={currentPlate} size="md" />
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
                {...register("plate")}
                onChange={(e) => setValue("plate", e.target.value.toUpperCase())}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-mono font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              {errors.plate && <p className="text-[10px] text-rose-500">{errors.plate.message}</p>}
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
                  {...register("brand")}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {errors.brand && <p className="text-[10px] text-rose-500">{errors.brand.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Model <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: Golf"
                  {...register("model")}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {errors.model && <p className="text-[10px] text-rose-500">{errors.model.message}</p>}
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
                  {...register("year", { valueAsNumber: true })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono text-center focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {errors.year && <p className="text-[10px] text-rose-500">{errors.year.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Gauge size={12} className="text-slate-400" />
                  <span>Güncel Kilometre (KM)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  {...register("kilometer", { valueAsNumber: true })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {errors.kilometer && (
                  <p className="text-[10px] text-rose-500">{errors.kilometer.message}</p>
                )}
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
                  {...register("fuelType")}
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
                  {...register("transmission")}
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
                  {...register("vin")}
                  onChange={(e) => setValue("vin", e.target.value.toUpperCase())}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {errors.vin && <p className="text-[10px] text-rose-500">{errors.vin.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Palette size={12} className="text-slate-400" />
                  <span>Renk</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: Beyaz, Metalik Gri"
                  {...register("color")}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {errors.color && <p className="text-[10px] text-rose-500">{errors.color.message}</p>}
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
