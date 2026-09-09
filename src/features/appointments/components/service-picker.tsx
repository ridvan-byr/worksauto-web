"use client"

import * as React from "react"
import { Wrench, CheckCircle2, Info } from "lucide-react"
import { AppointmentServiceItem } from "../types"
import { cn } from "@/lib/utils"

export const DEFAULT_APPOINTMENT_SERVICES: AppointmentServiceItem[] = [
  { id: "s1", name: "Periyodik Bakım (Yağ + 4 Filtre)", durationMinutes: 60, price: 1250 },
  { id: "s2", name: "Ön Fren Balata Değişimi", durationMinutes: 45, price: 850 },
  { id: "s3", name: "Bilgisayarlı Arıza Tespit & Teşhis", durationMinutes: 30, price: 500 },
  { id: "s4", name: "Klima Gazı Dolumu & Kaçak Testi", durationMinutes: 40, price: 950 },
  { id: "s5", name: "Rot-Balans & Ön Takım Kontrolü", durationMinutes: 45, price: 750 },
]

interface ServicePickerProps {
  services?: AppointmentServiceItem[]
  selectedServices: AppointmentServiceItem[]
  onToggleService: (service: AppointmentServiceItem) => void
}

export function ServicePicker({
  services = DEFAULT_APPOINTMENT_SERVICES,
  selectedServices,
  onToggleService,
}: ServicePickerProps) {
  const totalDuration = React.useMemo(() => {
    return selectedServices.length > 0
      ? selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0)
      : 30
  }, [selectedServices])

  const totalPrice = React.useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.price, 0)
  }, [selectedServices])

  return (
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

      {/* Info callout */}
      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2 text-[11px] text-slate-500">
        <Info size={14} className="text-sky-500 shrink-0" />
        <span>
          Müşterinin şikayet sebebi randevu anında kesinleşmemişse hizmet seçimi yapılması zorunlu değildir.
        </span>
      </div>

      {/* Service Item List */}
      <div className="grid grid-cols-1 gap-1.5">
        {services.map((srv) => {
          const isSelected = selectedServices.some((s) => s.id === srv.id)
          return (
            <button
              key={srv.id}
              type="button"
              onClick={() => onToggleService(srv)}
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
  )
}
