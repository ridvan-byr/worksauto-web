"use client"

import * as React from "react"
import { Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { TURKEY_PROVINCES, getDistrictsForProvince } from "@/lib/turkey-locations"
import { SearchableSelect } from "@/components/ui/searchable-select"

interface StepCompanyInfoProps {
  data: {
    name: string
    legalName: string
    taxOffice: string
    taxNumber: string
    city: string
    district: string
    address: string
  }
  errors: Record<string, string>
  onChange: (fields: Partial<StepCompanyInfoProps["data"]>) => void
}

export function StepCompanyInfo({
  data,
  errors,
  onChange,
}: StepCompanyInfoProps) {
  const availableDistricts = React.useMemo(() => {
    return getDistrictsForProvince(data.city)
  }, [data.city])

  const handleCityChange = (newCity: string) => {
    const newDistricts = getDistrictsForProvince(newCity)
    const keepDistrict = newDistricts.includes(data.district) ? data.district : ""
    onChange({ city: newCity, district: keepDistrict })
  }

  const handleDistrictChange = (newDistrict: string) => {
    onChange({ district: newDistrict })
  }
  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
      <div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Building2 className="text-slate-600 dark:text-slate-400 shrink-0" size={20} />
          <span>Adım 1: Servis & Fatura Kimliği</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          İş emirlerinde, müşteri randevularında ve fatura çıktılarında yer alacak yasal ve ticari bilgileri tanımlayın.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        {/* Service Name */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Servis / Atölye Adı <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Örn: Ege Motorlu Araçlar Özel Servisi"
            className={cn(
              "w-full h-11 px-3.5 rounded-xl border bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-all",
              errors.name ? "border-rose-500" : "border-slate-200 dark:border-slate-800"
            )}
          />
          {errors.name && <p className="text-[11px] text-rose-500">{errors.name}</p>}
        </div>

        {/* Legal Commercial Title */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Ticari Ünvan (Fatura Başlığı)
          </label>
          <input
            type="text"
            value={data.legalName}
            onChange={(e) => onChange({ legalName: e.target.value })}
            placeholder="Örn: Ege Otomotiv San. ve Tic. Ltd. Şti."
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-all"
          />
        </div>

        {/* Tax Office */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Vergi Dairesi <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={data.taxOffice}
            onChange={(e) => onChange({ taxOffice: e.target.value })}
            placeholder="Örn: Bornova"
            className={cn(
              "w-full h-11 px-3.5 rounded-xl border bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-all",
              errors.taxOffice ? "border-rose-500" : "border-slate-200 dark:border-slate-800"
            )}
          />
          {errors.taxOffice && <p className="text-[11px] text-rose-500">{errors.taxOffice}</p>}
        </div>

        {/* Tax Number */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Vergi Numarası / TCKN <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            maxLength={11}
            value={data.taxNumber}
            onChange={(e) => onChange({ taxNumber: e.target.value.replace(/\D/g, "") })}
            placeholder="10 haneli VKN veya 11 TCKN"
            className={cn(
              "w-full h-11 px-3.5 rounded-xl border bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-all",
              errors.taxNumber ? "border-rose-500" : "border-slate-200 dark:border-slate-800"
            )}
          />
          {errors.taxNumber && <p className="text-[11px] text-rose-500">{errors.taxNumber}</p>}
        </div>

        {/* City & District (Searchable Combobox) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>
              İl <span className="text-rose-500">*</span>
            </span>
            <span className="text-[11px] text-slate-400 font-normal">81 İl</span>
          </label>
          <SearchableSelect
            options={TURKEY_PROVINCES as unknown as string[]}
            value={data.city}
            onChange={handleCityChange}
            placeholder="İl seçiniz veya arayınız..."
            searchPlaceholder="81 il içinde ara..."
            error={!!errors.city}
          />
          {errors.city && <p className="text-[11px] text-rose-500">{errors.city}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>
              İlçe <span className="text-rose-500">*</span>
            </span>
            {data.city && availableDistricts.length > 0 && (
              <span className="text-[11px] text-slate-400 font-normal">
                {availableDistricts.length} İlçe
              </span>
            )}
          </label>
          <SearchableSelect
            options={availableDistricts}
            value={data.district}
            onChange={handleDistrictChange}
            disabled={!data.city}
            disabledMessage="Önce İl Seçiniz"
            placeholder={
              data.city ? "İlçe seçiniz veya arayınız..." : "Önce İl Seçiniz"
            }
            searchPlaceholder={`${data.city || "İlçe"} ilçelerinde ara...`}
            error={!!errors.district}
          />
          {errors.district && <p className="text-[11px] text-rose-500">{errors.district}</p>}
        </div>

        {/* Full Address */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Açık Servis Adresi <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            value={data.address}
            onChange={(e) => onChange({ address: e.target.value })}
            placeholder="Örn: 2. Sanayi Sitesi 352 Sokak No: 18 Bornova / İzmir"
            className={cn(
              "w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all resize-none",
              errors.address ? "border-rose-500" : "border-slate-200 dark:border-slate-800"
            )}
          />
          {errors.address && <p className="text-[11px] text-rose-500">{errors.address}</p>}
        </div>
      </div>
    </div>
  )
}
