"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import {
  Camera,
  Plus,
  X,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  User,
  Sparkles,
} from "lucide-react"
import { WorkOrderPhoto } from "../types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PhotoGalleryProps {
  photos: WorkOrderPhoto[]
  onAddPhoto: (caption: string, type: "CHECKIN" | "DAMAGE" | "COMPLETED", url?: string) => void
}

const SAMPLE_PRESETS = [
  {
    label: "Araç Kabul Ön / Plaka",
    url: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1200&auto=format&fit=crop",
    type: "CHECKIN" as const,
  },
  {
    label: "KM Gösterge Paneli",
    url: "https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=1200&auto=format&fit=crop",
    type: "CHECKIN" as const,
  },
  {
    label: "Fren / Disk Hasar Tespiti",
    url: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?q=80&w=1200&auto=format&fit=crop",
    type: "DAMAGE" as const,
  },
  {
    label: "Motor Bölümü Bakımı",
    url: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?q=80&w=1200&auto=format&fit=crop",
    type: "COMPLETED" as const,
  },
]

export function PhotoGallery({ photos, onAddPhoto }: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null)
  const [captionInput, setCaptionInput] = React.useState("")
  const [photoType, setPhotoType] = React.useState<"CHECKIN" | "DAMAGE" | "COMPLETED">("CHECKIN")
  const [selectedPresetUrl, setSelectedPresetUrl] = React.useState<string>(SAMPLE_PRESETS[0].url)
  const [isAdding, setIsAdding] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Keyboard navigation for lightbox (Arrow keys & Escape)
  React.useEffect(() => {
    if (lightboxIndex === null) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxIndex(null)
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : photos.length - 1))
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev !== null && prev < photos.length - 1 ? prev + 1 : 0))
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "auto"
    }
  }, [lightboxIndex, photos.length])

  const handleSimulateUpload = (e: React.FormEvent) => {
    e.preventDefault()
    onAddPhoto(
      captionInput.trim() || "Araç kabul / hasar fotoğrafı",
      photoType,
      selectedPresetUrl
    )
    setCaptionInput("")
    setIsAdding(false)
  }

  const activeLightboxPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null

  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Camera size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>Araç Kabul & Hasar Fotoğrafları</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {photos.length}
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">
              Ekspertiz, kilometre ve kaporta hasar tespit görselleri
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
          className="h-8 px-3 text-xs font-semibold gap-1.5 cursor-pointer"
        >
          <Plus size={13} />
          <span>Fotoğraf Çek / Yükle</span>
        </Button>
      </div>

      {/* Upload Box */}
      {isAdding && (
        <form
          onSubmit={handleSimulateUpload}
          className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/20 space-y-3 animate-in fade-in duration-200"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                Fotoğraf Türü
              </label>
              <select
                value={photoType}
                onChange={(e) => setPhotoType(e.target.value as any)}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="CHECKIN">Araç Kabul (KM / Ön-Arka)</option>
                <option value="DAMAGE">Mevcut Hasar / Kaporta Çiziği</option>
                <option value="COMPLETED">İşlem Tamamlandı / Hazır</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                Açıklama / Not
              </label>
              <input
                type="text"
                placeholder="Örn: Sağ ön çamurluk derin çizik..."
                value={captionInput}
                onChange={(e) => setCaptionInput(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
              Örnek Görsel Şablonu
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SAMPLE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setSelectedPresetUrl(preset.url)
                    setPhotoType(preset.type)
                    if (!captionInput) setCaptionInput(preset.label)
                  }}
                  className={cn(
                    "p-2 rounded-xl border text-[10px] font-semibold text-left transition-all cursor-pointer truncate",
                    selectedPresetUrl === preset.url
                      ? "border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold shadow-xs"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(false)}
              className="h-8 text-xs cursor-pointer"
            >
              Vazgeç
            </Button>
            <Button type="submit" size="sm" className="h-8 px-4 text-xs font-bold gap-1 cursor-pointer">
              <Camera size={13} />
              <span>Fotoğrafı Kaydet</span>
            </Button>
          </div>
        </form>
      )}

      {/* Modern Visual Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {photos.length === 0 ? (
          <div className="col-span-full py-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 text-xs flex flex-col items-center justify-center gap-1">
            <Camera size={24} className="opacity-40 mb-1" />
            <span>Henüz araç fotoğrafı yüklenmemiş.</span>
          </div>
        ) : (
          photos.map((photo, idx) => (
            <div
              key={photo.id}
              onClick={() => setLightboxIndex(idx)}
              className="group relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 bg-slate-950 aspect-[4/3] cursor-pointer hover:border-sky-500/70 shadow-xs hover:shadow-md transition-all duration-300"
            >
              {/* Actual Image */}
              <img
                src={photo.url}
                alt={photo.caption}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />

              {/* Type Badge on Top Left */}
              <div className="absolute top-2 left-2 pointer-events-none">
                {photo.type === "CHECKIN" && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-500/90 text-white shadow-xs backdrop-blur-xs">
                    Kabul
                  </span>
                )}
                {photo.type === "DAMAGE" && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/90 text-white shadow-xs backdrop-blur-xs flex items-center gap-1">
                    <ShieldAlert size={10} />
                    <span>Hasar / Çizik</span>
                  </span>
                )}
                {photo.type === "COMPLETED" && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/90 text-white shadow-xs backdrop-blur-xs flex items-center gap-1">
                    <CheckCircle2 size={10} />
                    <span>Bitti</span>
                  </span>
                )}
              </div>

              {/* Bottom Caption */}
              <div className="absolute bottom-2 left-2 right-2 text-white pointer-events-none">
                <p className="text-[11px] font-semibold truncate drop-shadow-xs">
                  {photo.caption}
                </p>
                <p className="text-[9px] text-slate-300 drop-shadow-xs flex items-center gap-1 mt-0.5">
                  <span>{photo.uploaderName}</span>
                </p>
              </div>

              {/* Hover Overlay Icon */}
              <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <div className="w-9 h-9 rounded-full bg-white/25 backdrop-blur-md text-white flex items-center justify-center shadow-lg">
                  <Maximize2 size={16} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cinematic Fullscreen Lightbox Modal */}
      {mounted &&
        activeLightboxPhoto &&
        createPortal(
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200"
            onClick={() => setLightboxIndex(null)}
          >
            <div
              className="relative w-full max-w-4xl rounded-3xl bg-slate-900 border border-slate-800/80 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Lightbox Top Header */}
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">
                      {activeLightboxPhoto.caption}
                    </h4>
                    {activeLightboxPhoto.type === "CHECKIN" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                        Araç Kabul Fotoğrafı
                      </span>
                    )}
                    {activeLightboxPhoto.type === "DAMAGE" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <ShieldAlert size={11} />
                        <span>Mevcut Hasar / Ekspertiz Tespiti</span>
                      </span>
                    )}
                    {activeLightboxPhoto.type === "COMPLETED" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 size={11} />
                        <span>Tamamlanan İşlem</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      <span>{activeLightboxPhoto.uploaderName}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{new Date(activeLightboxPhoto.uploadedAt).toLocaleString("tr-TR")}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={activeLightboxPhoto.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Orijinal Görseli Yeni Sekmede Aç"
                  >
                    <ExternalLink size={16} />
                  </a>
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(null)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Kapat (Esc)"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Main Photo Showcase */}
              <div className="relative w-full bg-black/60 flex items-center justify-center p-2 min-h-[350px] max-h-[65vh] overflow-hidden select-none">
                <img
                  src={activeLightboxPhoto.url}
                  alt={activeLightboxPhoto.caption}
                  className="max-h-[60vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
                />

                {/* Left/Right Arrow Controls */}
                {photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : photos.length - 1))
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-900/80 hover:bg-sky-600 text-white flex items-center justify-center transition-all shadow-xl backdrop-blur-md cursor-pointer group"
                      title="Önceki Fotoğraf (Sol Ok)"
                    >
                      <ChevronLeft size={22} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setLightboxIndex((prev) => (prev !== null && prev < photos.length - 1 ? prev + 1 : 0))
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-900/80 hover:bg-sky-600 text-white flex items-center justify-center transition-all shadow-xl backdrop-blur-md cursor-pointer group"
                      title="Sonraki Fotoğraf (Sağ Ok)"
                    >
                      <ChevronRight size={22} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </>
                )}
              </div>

              {/* Lightbox Footer Bar */}
              <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono font-bold text-slate-300">
                  Fotoğraf {lightboxIndex! + 1} / {photos.length}
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    Geçiş için klavyedeki ◄ ► yön tuşlarını kullanabilirsiniz
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLightboxIndex(null)}
                    className="h-8 px-4 text-xs font-semibold text-white border-slate-700 hover:bg-slate-800 cursor-pointer"
                  >
                    Kapat
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
