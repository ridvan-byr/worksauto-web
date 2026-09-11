"use client"

import * as React from "react"
import { Settings2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepWorkshopSettingsProps {
  data: {
    activeLiftCount: number
    appointmentSlotDuration: number
    autoWorkOrder: boolean
    notifyAppointmentReminder: boolean
    notifyReadyForPickup: boolean
    criticalStockThreshold: number
  }
  onChange: (fields: Partial<StepWorkshopSettingsProps["data"]>) => void
  errors?: Record<string, string>
}

const PRESET_SLOTS = [
  { mins: 15, label: "15 Dk", sub: "Ekspres" },
  { mins: 30, label: "30 Dk", sub: "Hızlı Kabul" },
  { mins: 45, label: "45 Dk", sub: "Dengeli (Önerilen)" },
  { mins: 60, label: "60 Dk", sub: "Kapsamlı" },
  { mins: 90, label: "90 Dk", sub: "Ağır Bakım" },
]

export function StepWorkshopSettings({
  data,
  onChange,
  errors = {},
}: StepWorkshopSettingsProps) {
  // Local state for stock input so user can backspace freely
  const [stockInput, setStockInput] = React.useState<string>(
    String(data.criticalStockThreshold ?? 5)
  )

  // Local state for 5+ custom lift count
  const [customLiftInput, setCustomLiftInput] = React.useState<string>(
    data.activeLiftCount >= 5 ? String(data.activeLiftCount) : "5"
  )

  // Track if custom slot duration is selected
  const isCustomSlot = !PRESET_SLOTS.some((s) => s.mins === data.appointmentSlotDuration)
  const [customSlotInput, setCustomSlotInput] = React.useState<string>(
    isCustomSlot ? String(data.appointmentSlotDuration) : "75"
  )

  React.useEffect(() => {
    setStockInput(String(data.criticalStockThreshold ?? 5))
  }, [data.criticalStockThreshold])

  React.useEffect(() => {
    if (data.activeLiftCount >= 5) {
      setCustomLiftInput(String(data.activeLiftCount))
    }
  }, [data.activeLiftCount])

  React.useEffect(() => {
    if (isCustomSlot) {
      setCustomSlotInput(String(data.appointmentSlotDuration))
    }
  }, [data.appointmentSlotDuration, isCustomSlot])

  const handleLiftSelect = (count: number) => {
    if (count === 5) {
      const nextLift = data.activeLiftCount >= 5 ? data.activeLiftCount : 5
      onChange({ activeLiftCount: nextLift })
      setCustomLiftInput(String(nextLift))
    } else {
      onChange({ activeLiftCount: count })
    }
  }

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

      {errors.workshop && (
        <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-xs text-rose-600 dark:text-rose-400 font-medium">
          {errors.workshop}
        </div>
      )}

      {/* 1. Lift & Workshop Capacity Setting */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span>Aktif Lift / Çalışma İstasyonu Kapasitesi <span className="text-rose-500">*</span></span>
          <span className="text-[11px] text-slate-400">Aynı anda servise alınabilecek araç sayısı</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((count) => {
            const isSelected = count === 5 ? data.activeLiftCount >= 5 : data.activeLiftCount === count
            return (
              <button
                key={count}
                type="button"
                onClick={() => handleLiftSelect(count)}
                className={cn(
                  "p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 select-none",
                  isSelected
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                )}
              >
                <span className="text-base font-bold">
                  {count === 5 ? (data.activeLiftCount > 5 ? `${data.activeLiftCount} Lift` : "5+ Lift") : `${count} Lift`}
                </span>
                <span className="text-[10px] opacity-75">
                  {count === 1 ? "Butik Atölye" : count <= 3 ? "Orta Ölçek" : "Büyük Servis"}
                </span>
              </button>
            )
          })}
        </div>

        {/* Extra Input when 5+ Lifts selected */}
        {data.activeLiftCount >= 5 && (
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                5+ Lift Kapasitesi: Toplam Lift Sayısını Giriniz
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Atölyenizdeki toplam aktif çalışma lifti sayısını belirtin (5 ile 50 arası).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={5}
                max={50}
                value={customLiftInput}
                onChange={(e) => {
                  const val = e.target.value
                  setCustomLiftInput(val)
                  if (val !== "") {
                    const parsed = parseInt(val)
                    if (!isNaN(parsed) && parsed >= 5) {
                      onChange({ activeLiftCount: Math.min(50, parsed) })
                    }
                  }
                }}
                onBlur={() => {
                  const parsed = parseInt(customLiftInput)
                  const clamped = isNaN(parsed) || parsed < 5 ? 5 : Math.min(50, parsed)
                  setCustomLiftInput(String(clamped))
                  onChange({ activeLiftCount: clamped })
                }}
                className="w-24 h-10 px-3 text-center text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 font-mono"
              />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Adet Lift</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Expanded Slot Duration & Custom Option */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span>Randevu Slot Periyodu <span className="text-rose-500">*</span></span>
          <span className="text-[11px] text-slate-400">Takvimin bölüneceği dakika aralığı</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {PRESET_SLOTS.map((slot) => {
            const isSelected = !isCustomSlot && data.appointmentSlotDuration === slot.mins
            return (
              <button
                key={slot.mins}
                type="button"
                onClick={() => onChange({ appointmentSlotDuration: slot.mins })}
                className={cn(
                  "p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 select-none",
                  isSelected
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                )}
              >
                <span className="text-base font-bold">{slot.label}</span>
                <span className="text-[10px] opacity-75 leading-tight truncate w-full text-center">
                  {slot.sub}
                </span>
              </button>
            )
          })}

          {/* Custom Slot Button */}
          <button
            type="button"
            onClick={() => {
              const customVal = parseInt(customSlotInput) || 75
              onChange({ appointmentSlotDuration: customVal })
            }}
            className={cn(
              "p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 select-none",
              isCustomSlot
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white shadow-sm"
                : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
            )}
          >
            <span className="text-base font-bold">
              {isCustomSlot ? `${data.appointmentSlotDuration} Dk` : "Özel"}
            </span>
            <span className="text-[10px] opacity-75 leading-tight">
              {isCustomSlot ? "Özel Süre" : "Farklı Dakika"}
            </span>
          </button>
        </div>

        {/* Custom Slot Duration Box */}
        {isCustomSlot && (
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Özel Randevu Slot Süresi (Dakika)
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Takvim düzeninin bozulmaması için 15 ve katlarını (örn: 75, 120 dk) seçmeniz tavsiye edilir.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={15}
                max={240}
                step={15}
                value={customSlotInput}
                onChange={(e) => {
                  const val = e.target.value
                  setCustomSlotInput(val)
                  if (val !== "") {
                    const parsed = parseInt(val)
                    if (!isNaN(parsed) && parsed >= 15) {
                      onChange({ appointmentSlotDuration: Math.min(240, parsed) })
                    }
                  }
                }}
                onBlur={() => {
                  const parsed = parseInt(customSlotInput)
                  const clamped = isNaN(parsed) || parsed < 15 ? 45 : Math.min(240, parsed)
                  setCustomSlotInput(String(clamped))
                  onChange({ appointmentSlotDuration: clamped })
                }}
                className="w-24 h-10 px-3 text-center text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 font-mono"
              />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Dakika</span>
            </div>
          </div>
        )}
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
              data.autoWorkOrder ? "bg-slate-900 dark:bg-white" : "bg-slate-300 dark:bg-slate-700"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-sm ring-0 transition duration-200 ease-in-out",
                data.autoWorkOrder
                  ? "translate-x-5 bg-white dark:bg-slate-950"
                  : "translate-x-0 bg-white dark:bg-slate-300"
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
              data.notifyAppointmentReminder ? "bg-slate-900 dark:bg-white" : "bg-slate-300 dark:bg-slate-700"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-sm ring-0 transition duration-200 ease-in-out",
                data.notifyAppointmentReminder
                  ? "translate-x-5 bg-white dark:bg-slate-950"
                  : "translate-x-0 bg-white dark:bg-slate-300"
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
              Usta iş emrini tamamlayıp liftten indirdiğinde müşteriye "Aracınız Hazır" mesajı gönderilsin.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ notifyReadyForPickup: !data.notifyReadyForPickup })}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
              data.notifyReadyForPickup ? "bg-slate-900 dark:bg-white" : "bg-slate-300 dark:bg-slate-700"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-sm ring-0 transition duration-200 ease-in-out",
                data.notifyReadyForPickup
                  ? "translate-x-5 bg-white dark:bg-slate-950"
                  : "translate-x-0 bg-white dark:bg-slate-300"
              )}
            />
          </button>
        </div>
      </div>

      {/* 4. Critical Stock Alert (Cannot be left empty) */}
      <div className="space-y-1.5 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span>Kritik Parça Stok Uyarı Eşiği (Adet) <span className="text-rose-500">*</span></span>
          <span className="text-[11px] text-slate-400 font-normal">Boş bırakılamaz (Min: 1)</span>
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={100}
            value={stockInput}
            onChange={(e) => {
              const val = e.target.value
              setStockInput(val)
              if (val !== "") {
                const parsed = parseInt(val)
                if (!isNaN(parsed) && parsed >= 1) {
                  onChange({ criticalStockThreshold: Math.min(100, parsed) })
                }
              }
            }}
            onBlur={() => {
              // Cannot be left empty: if empty or < 1, restore safe default 5
              const parsed = parseInt(stockInput)
              const clamped = isNaN(parsed) || parsed < 1 ? 5 : Math.min(100, parsed)
              setStockInput(String(clamped))
              onChange({ criticalStockThreshold: clamped })
            }}
            className={cn(
              "w-28 h-11 px-3.5 rounded-xl border bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none transition-all font-semibold text-center font-mono",
              stockInput === ""
                ? "border-amber-500 focus:border-amber-500"
                : "border-slate-200 dark:border-slate-800 focus:border-slate-400 dark:focus:border-slate-600"
            )}
          />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            adet veya altına indiğinde dashboard'da kırmızı stok uyarısı verilir.
          </span>
        </div>
        {stockInput === "" && (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 pt-0.5">
            <AlertCircle size={13} />
            <span>Stok eşiği boş bırakılamaz. Sayı girmediğinizde otomatik olarak 5 adet kabul edilir.</span>
          </div>
        )}
      </div>
    </div>
  )
}
