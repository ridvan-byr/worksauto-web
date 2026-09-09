"use client"

import * as React from "react"
import Image from "next/image"
import { Palette, Upload } from "lucide-react"
import { cn } from "@/lib/utils"

export const PRESET_LOGOS = [
  { id: "p1", name: "İki Anahtar", url: "/brand/worksauto-icon-white-tight.png" },
  { id: "p2", name: "Tam Logo (Dark)", url: "/brand/worksauto-logo-dark.png" },
  { id: "p3", name: "Kare Amblem", url: "/brand/worksauto-icon-white-square.png" },
]

export const PRESET_COLORS = [
  { name: "Gök Mavisi", hex: "#0284c7" },
  { name: "Zümrüt Yeşili", hex: "#059669" },
  { name: "İndigo Gece", hex: "#4f46e5" },
  { name: "Kehribar", hex: "#d97706" },
  { name: "Crimson Kırmızı", hex: "#dc2626" },
]

interface StepBrandingProps {
  data: {
    logo: string
    primaryColor: string
    slogan: string
  }
  errors: Record<string, string>
  onChange: (fields: Partial<StepBrandingProps["data"]>) => void
}

export function StepBranding({
  data,
  onChange,
}: StepBrandingProps) {
  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
      <div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Palette className="text-sky-500 shrink-0" size={20} />
          <span>Adım 2: Marka & Görünüm</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          Müşterilerinizin randevu sayfasında ve fatura başlıklarında göreceği logo ve kurumsal renginizi belirleyin.
        </p>
      </div>

      {/* Logo Selection / Upload */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span>Servis Logosu <span className="text-rose-500">*</span></span>
          <span className="text-[11px] text-slate-400">PNG veya Hazır Seçim</span>
        </label>

        {/* Logo Preview Box */}
        <div className="p-4 sm:p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900 border border-slate-700 p-2 flex items-center justify-center shrink-0 shadow-inner">
              <Image
                src={data.logo || "/brand/worksauto-icon-white-tight.png"}
                alt="Logo Preview"
                width={64}
                height={64}
                className="object-contain max-h-12 max-w-12 sm:max-h-14 sm:max-w-14"
              />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Aktif Seçilen Logo</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                Header, sidebar ve servis formlarında kullanılacaktır.
              </p>
            </div>
          </div>

          {/* Mock Upload Button */}
          <label className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 cursor-pointer shadow-sm">
            <Upload size={14} />
            <span>Cihazdan Yükle</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const url = URL.createObjectURL(e.target.files[0])
                  onChange({ logo: url })
                }
              }}
            />
          </label>
        </div>

        {/* Preset Logo Choices */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-500">Veya Hazır Kurumsal Amblemlerden Seçin:</p>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_LOGOS.map((pl) => (
              <button
                key={pl.id}
                type="button"
                onClick={() => onChange({ logo: pl.url })}
                className={cn(
                  "p-2.5 sm:p-3 rounded-xl border flex flex-col items-center gap-1.5 sm:gap-2 transition-all cursor-pointer",
                  data.logo === pl.url
                    ? "border-sky-500 bg-sky-500/10 text-sky-500 font-bold"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 text-slate-600 dark:text-slate-400"
                )}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-900 p-1 flex items-center justify-center">
                  <Image src={pl.url} alt={pl.name} width={32} height={32} className="object-contain max-h-6 max-w-6 sm:max-h-7 sm:max-w-7" />
                </div>
                <span className="text-[10px] sm:text-xs truncate w-full text-center">{pl.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Theme Accent Color */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Kurumsal Vurgu Rengi
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => onChange({ primaryColor: c.hex })}
              className={cn(
                "p-2.5 rounded-xl border flex items-center gap-2 text-xs font-medium transition-all cursor-pointer",
                data.primaryColor === c.hex
                  ? "border-slate-900 dark:border-white shadow-sm bg-slate-50 dark:bg-slate-800"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              )}
            >
              <span className="w-4 h-4 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: c.hex }} />
              <span className="truncate text-[11px]">{c.name.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Slogan */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Servis Sloganı / Tanıtım Metni
        </label>
        <input
          type="text"
          value={data.slogan}
          onChange={(e) => onChange({ slogan: e.target.value })}
          placeholder="Örn: Güvenilir, Garantili ve Hızlı Oto Bakım Çözümleri"
          className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
        />
      </div>
    </div>
  )
}
