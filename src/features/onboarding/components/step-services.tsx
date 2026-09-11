"use client"

import * as React from "react"
import { Wrench, Plus, CheckCircle2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ServiceItem } from "@/features/auth/types"
import { cn } from "@/lib/utils"

export const QUICK_SERVICE_TEMPLATES = [
  { name: "Periyodik Bakım (Yağ + 4 Filtre)", category: "Periyodik Bakım", durationMinutes: 60, laborPrice: 1250 },
  { name: "Ön Fren Balata Değişimi", category: "Fren Sistemi", durationMinutes: 45, laborPrice: 850 },
  { name: "Bilgisayarlı Arıza Tespit & Teşhis", category: "Diagnostik", durationMinutes: 30, laborPrice: 500 },
  { name: "Klima Gazı Dolumu & Kaçak Testi", category: "Klima & Soğutma", durationMinutes: 40, laborPrice: 950 },
  { name: "Rot-Balans & Ön Takım Kontrolü", category: "Alt Takım", durationMinutes: 45, laborPrice: 750 },
  { name: "Akü Değişimi & Şarj Kontrolü", category: "Oto Elektrik", durationMinutes: 25, laborPrice: 400 },
]

interface StepServicesProps {
  services: ServiceItem[]
  errors: Record<string, string>
  onAddTemplateService: (tmpl: { name: string; category: string; durationMinutes: number; laborPrice: number }) => void
  onAddCustomService: (service: Omit<ServiceItem, "id">) => void
  onUpdateServiceItem: (id: string, updates: Partial<ServiceItem>) => void
  onRemoveService: (id: string) => void
}

export function StepServices({
  services,
  errors,
  onAddTemplateService,
  onAddCustomService,
  onUpdateServiceItem,
  onRemoveService,
}: StepServicesProps) {
  const [customService, setCustomService] = React.useState({
    name: "",
    category: "Motor & Mekanik",
    durationMinutes: 45,
    laborPrice: 800,
  })

  const handleCustomSubmit = () => {
    if (!customService.name.trim()) return
    onAddCustomService({
      name: customService.name.trim(),
      category: customService.category,
      durationMinutes: Number(customService.durationMinutes) || 45,
      laborPrice: Number(customService.laborPrice) || 500,
    })
    setCustomService({ name: "", category: "Motor & Mekanik", durationMinutes: 45, laborPrice: 800 })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Wrench className="text-slate-600 dark:text-slate-400 shrink-0" size={20} />
            <span>Adım 3: Verilen Hizmetler & İşçilik Kataloğu</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Randevu ve iş emirlerinde kullanılacak işçilik kalemlerini şablonlardan seçin veya özel hizmetinizi ekleyin.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
          {services.length} Hizmet Kayıtlı
        </span>
      </div>

      {/* 1. Quick Template Clickers */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Hazır Oto Servis Şablonları (Tek Tıkla Ekle):
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_SERVICE_TEMPLATES.map((tmpl) => {
            const isAlreadyAdded = services.some(
              (s) => s.name.toLowerCase() === tmpl.name.toLowerCase()
            )

            return (
              <button
                key={tmpl.name}
                type="button"
                disabled={isAlreadyAdded}
                onClick={() => onAddTemplateService(tmpl)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border select-none",
                  isAlreadyAdded
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white opacity-90 cursor-default"
                    : "bg-slate-100/70 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 shadow-2xs"
                )}
              >
                {isAlreadyAdded ? (
                  <>
                    <CheckCircle2 size={13} className="shrink-0" />
                    <span>{tmpl.name}</span>
                    <span className="text-[10px] opacity-75 font-normal">
                      (Eklendi)
                    </span>
                  </>
                ) : (
                  <>
                    <Plus size={13} className="text-slate-500" />
                    <span>{tmpl.name}</span>
                    <span className="opacity-70 text-[10px]">({tmpl.laborPrice} ₺)</span>
                  </>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. Custom Service Addition Box */}
      <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Kendi Özel Hizmetinizi / İşçiliğinizi Tanımlayın</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <input
            type="text"
            placeholder="Hizmet Adı (Örn: Şanzıman Yağ Değişimi)"
            value={customService.name}
            onChange={(e) => setCustomService({ ...customService, name: e.target.value })}
            className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600"
          />
          <select
            value={customService.category}
            onChange={(e) => setCustomService({ ...customService, category: e.target.value })}
            className="h-10 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 cursor-pointer"
          >
            <option value="Motor & Mekanik">Motor & Mekanik</option>
            <option value="Fren Sistemi">Fren Sistemi</option>
            <option value="Periyodik Bakım">Periyodik Bakım</option>
            <option value="Oto Elektrik">Oto Elektrik</option>
            <option value="Alt Takım">Alt Takım</option>
            <option value="Klima & Soğutma">Klima & Soğutma</option>
            <option value="Diagnostik">Diagnostik</option>
          </select>

          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Süre dk"
              title="Tahmini Süre (dakika)"
              value={customService.durationMinutes}
              onChange={(e) => setCustomService({ ...customService, durationMinutes: Number(e.target.value) })}
              className="w-1/2 h-10 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 text-center"
            />
            <input
              type="number"
              placeholder="Fiyat ₺"
              title="İşçilik Fiyatı (TL)"
              value={customService.laborPrice}
              onChange={(e) => setCustomService({ ...customService, laborPrice: Number(e.target.value) })}
              className="w-1/2 h-10 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 text-center font-bold"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button
            type="button"
            onClick={handleCustomSubmit}
            size="sm"
            className="text-xs h-9 gap-1.5 cursor-pointer bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-950 font-semibold"
          >
            <Plus size={14} />
            <span>Özel Hizmeti Kataloğa Ekle</span>
          </Button>
        </div>
      </div>

      {/* 3. Added Services List */}
      <div className="space-y-2 pt-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span>Kayıtlı Hizmetler ({services.length}) <span className="text-rose-500">*</span></span>
          <span className="text-[11px] text-slate-400">Fiyat ve süreyi kutulardan doğrudan değiştirebilirsiniz</span>
        </label>

        {services.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-rose-300 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-center text-xs text-rose-500">
            Henüz hiçbir hizmet eklemediniz. Lütfen en az bir hizmet tanımlayın.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map((srv) => (
              <div
                key={srv.id}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex flex-col justify-between gap-3 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="overflow-hidden">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 mb-1">
                      {srv.category || "Genel Servis"}
                    </span>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {srv.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveService(srv.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                    title="Hizmeti Sil"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Inline Editable Duration & Price Inputs */}
                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">Süre:</span>
                    <input
                      type="number"
                      min={5}
                      step={5}
                      value={srv.durationMinutes}
                      onChange={(e) =>
                        onUpdateServiceItem(srv.id, { durationMinutes: Number(e.target.value) })
                      }
                      className="w-14 h-7 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                    <span className="text-[11px] text-slate-500">dk</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">İşçilik:</span>
                    <input
                      type="number"
                      min={0}
                      step={50}
                      value={srv.laborPrice}
                      onChange={(e) =>
                        onUpdateServiceItem(srv.id, { laborPrice: Number(e.target.value) })
                      }
                      className="w-20 h-7 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-sky-600 dark:text-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">₺</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {errors.services && <p className="text-[11px] text-rose-500">{errors.services}</p>}
      </div>
    </div>
  )
}
