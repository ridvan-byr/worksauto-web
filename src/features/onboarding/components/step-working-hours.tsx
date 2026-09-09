"use client"

import * as React from "react"
import { Clock, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepWorkingHoursProps {
  data: {
    workingDays: string[]
    workStartTime: string
    workEndTime: string
    breakStartTime: string
    breakEndTime: string
  }
  errors: Record<string, string>
  onChange: (fields: Partial<StepWorkingHoursProps["data"]>) => void
}

export function StepWorkingHours({
  data,
  errors,
  onChange,
}: StepWorkingHoursProps) {
  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
      <div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Clock className="text-sky-500 shrink-0" size={20} />
          <span>Adım 3: Çalışma Günleri & Mesai Saatleri</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          Randevu takviminizde araç kabul yapılacak günleri ve mesai saatlerini belirleyin.
        </p>
      </div>

      {/* Days Switch */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Açık Olunan Günler <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"].map((day) => {
            const isSelected = data.workingDays.includes(day)
            return (
              <button
                key={day}
                type="button"
                onClick={() => {
                  const next = isSelected
                    ? data.workingDays.filter((d) => d !== day)
                    : [...data.workingDays, day]
                  onChange({ workingDays: next })
                }}
                className={cn(
                  "p-2.5 sm:p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer",
                  isSelected
                    ? "bg-sky-500 text-white border-sky-500 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100"
                )}
              >
                <span>{day}</span>
                {isSelected && <CheckCircle2 size={14} />}
              </button>
            )
          })}
        </div>
        {errors.workingDays && <p className="text-[11px] text-rose-500">{errors.workingDays}</p>}
      </div>

      {/* Working Hours Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Mesai Başlangıç Saati
          </label>
          <input
            type="time"
            value={data.workStartTime}
            onChange={(e) => onChange({ workStartTime: e.target.value })}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Mesai Bitiş Saati
          </label>
          <input
            type="time"
            value={data.workEndTime}
            onChange={(e) => onChange({ workEndTime: e.target.value })}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Öğle Molası Başlangıcı
          </label>
          <input
            type="time"
            value={data.breakStartTime}
            onChange={(e) => onChange({ breakStartTime: e.target.value })}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Öğle Molası Bitişi
          </label>
          <input
            type="time"
            value={data.breakEndTime}
            onChange={(e) => onChange({ breakEndTime: e.target.value })}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
          />
        </div>
      </div>
    </div>
  )
}
