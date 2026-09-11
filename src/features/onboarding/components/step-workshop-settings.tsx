"use client"

import * as React from "react"
import { Settings2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepWorkshopSettingsProps {
  data: {
    activeLiftCount: number
    appointmentSlotDuration: 30 | 45 | 60 | number
    autoWorkOrder: boolean
    notifyAppointmentReminder: boolean
    notifyReadyForPickup: boolean
    criticalStockThreshold: number
  }
  onChange: (fields: Partial<{
    activeLiftCount: number
    appointmentSlotDuration: 30 | 45 | 60
    autoWorkOrder: boolean
    notifyAppointmentReminder: boolean
    notifyReadyForPickup: boolean
    criticalStockThreshold: number
  }>) => void
}

export function StepWorkshopSettings({
  data,
  onChange,
}: StepWorkshopSettingsProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Settings2 className="text-slate-600 dark:text-slate-400 shrink-0" size={20} />
          <span>Adım 5: Randevu, Atölye Kapasitesi & Bildirim Ayarları</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          Servisinizin eşzamanlı lift kapasitesini, randevu aralıklarını ve müşteri otomatik bildirim kurallarını yapılandırın.
        </p>
      </div>

      {/* 1. Lift & Workshop Capacity Setting */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span>Aktif Lift / Çalışma İstasyonu Kapasitesi <span className="text-rose-500">*</span></span>
          <span className="text-[11px] text-slate-400">Aynı anda servise alınabilecek araç sayısı</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => onChange({ activeLiftCount: count })}
              className={cn(
                "p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 select-none",
                data.activeLiftCount === count
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white shadow-sm"
                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
              )}
            >
              <span className="text-base font-bold">{count} {count === 5 ? "+" : ""} Lift</span>
              <span className="text-[10px] opacity-75">
                {count === 1 ? "Butik Atölye" : count <= 3 ? "Orta Ölçek" : "Büyük Servis"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Slot Duration */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Randevu Slot Periyodu <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[30, 45, 60].map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => onChange({ appointmentSlotDuration: mins as 30 | 45 | 60 })}
              className={cn(
                "p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 select-none",
                data.appointmentSlotDuration === mins
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white shadow-sm"
                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
              )}
            >
              <span className="text-base font-bold">{mins} Dk</span>
              <span className="text-[10px] opacity-75 leading-tight">
                {mins === 30 ? "Hızlı Kabul" : mins === 45 ? "Dengeli (Önerilen)" : "Kapsamlı Bakım"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Operational & Notification Toggles */}
      <div className="space-y-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
          Otomasyon ve Müşteri Bildirim Tercihleri:
        </p>

        {/* Toggle 1: Auto Work Order */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Randevudan Otomatik İş Emri Aç
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Müşteri servise ulaştığında tek tıkla lifte alma ve iş emri oluşturma.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ autoWorkOrder: !data.autoWorkOrder })}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
              data.autoWorkOrder ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-700"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                data.autoWorkOrder ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>

        {/* Toggle 2: Appointment Reminder SMS */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Randevu Öncesi Otomatik Hatırlatma
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Randevu saatinden 2 saat önce araç sahibine randevu hatırlatması gönderilsin.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ notifyAppointmentReminder: !data.notifyAppointmentReminder })}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
              data.notifyAppointmentReminder ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-700"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                data.notifyAppointmentReminder ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>

        {/* Toggle 3: Ready for pickup SMS */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Araç Hazır / Teslim Bildirimi
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Usta iş emrini tamamlayıp liften indirdiğinde müşteriye "Aracınız Hazır" mesajı gönderilsin.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ notifyReadyForPickup: !data.notifyReadyForPickup })}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
              data.notifyReadyForPickup ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-700"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                data.notifyReadyForPickup ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>
      </div>

      {/* 4. Critical Stock Alert */}
      <div className="space-y-1.5 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Kritik Parça Stok Uyarı Eşiği (Adet)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={50}
            value={data.criticalStockThreshold}
            onChange={(e) => onChange({ criticalStockThreshold: parseInt(e.target.value) || 5 })}
            className="w-28 h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-semibold text-center"
          />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            adet veya altına indiğinde dashboard'da kırmızı stok uyarısı verilir.
          </span>
        </div>
      </div>
    </div>
  )
}
