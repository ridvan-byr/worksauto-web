"use client"

import * as React from "react"
import { Camera, Plus, X, Maximize2, ShieldCheck, Image as ImageIcon } from "lucide-react"
import { WorkOrderPhoto } from "../types"
import { Button } from "@/components/ui/button"

interface PhotoGalleryProps {
  photos: WorkOrderPhoto[]
  onAddPhoto: (caption: string, type: "CHECKIN" | "DAMAGE" | "COMPLETED") => void
}

export function PhotoGallery({ photos, onAddPhoto }: PhotoGalleryProps) {
  const [lightboxPhoto, setLightboxPhoto] = React.useState<WorkOrderPhoto | null>(null)
  const [captionInput, setCaptionInput] = React.useState("")
  const [photoType, setPhotoType] = React.useState<"CHECKIN" | "DAMAGE" | "COMPLETED">("CHECKIN")
  const [isAdding, setIsAdding] = React.useState(false)

  const handleSimulateUpload = (e: React.FormEvent) => {
    e.preventDefault()
    onAddPhoto(captionInput || "Araç kabul / hasar fotoğrafı", photoType)
    setCaptionInput("")
    setIsAdding(false)
  }

  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Camera size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Araç Kabul & Hasar Fotoğrafları
            </h3>
            <p className="text-[10px] text-slate-400">
              Ekspertiz ve kaporta tespit görselleri
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

      {/* Photo Add Box */}
      {isAdding && (
        <form onSubmit={handleSimulateUpload} className="p-3.5 rounded-2xl bg-sky-500/5 border border-sky-500/20 space-y-3 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Fotoğraf Tipi</label>
              <select
                value={photoType}
                onChange={(e) => setPhotoType(e.target.value as any)}
                className="w-full h-9 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
              >
                <option value="CHECKIN">Araç Kabul (KM / Ön-Arka)</option>
                <option value="DAMAGE">Mevcut Hasar / Çizik</option>
                <option value="COMPLETED">İşlem Sonrası / Hazır</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Açıklama</label>
              <input
                type="text"
                placeholder="Örn: Sağ çamurluk çizik..."
                value={captionInput}
                onChange={(e) => setCaptionInput(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="h-8 text-xs">
              Vazgeç
            </Button>
            <Button type="submit" size="sm" className="h-8 px-4 text-xs font-bold">
              Kameradan / Galeriden Yükle
            </Button>
          </div>
        </form>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.length === 0 ? (
          <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
            <ImageIcon size={24} className="mx-auto mb-1 opacity-40" />
            <span>Henüz araç fotoğrafı yüklenmemiş.</span>
          </div>
        ) : (
          photos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setLightboxPhoto(photo)}
              className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 aspect-video cursor-pointer hover:border-sky-500 transition-all flex items-center justify-center"
            >
              {/* Fallback pattern preview */}
              <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center p-2 text-center text-white">
                <Camera size={20} className="mb-1 text-sky-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold line-clamp-1">{photo.caption}</span>
                <span className="text-[8px] text-slate-400 mt-0.5">{photo.type}</span>
              </div>

              <div className="absolute inset-0 bg-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1">
                <Maximize2 size={14} />
                <span>Büyüt</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-md w-full rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold">{lightboxPhoto.caption}</h4>
                <p className="text-[10px] text-slate-400">{lightboxPhoto.uploaderName} • {new Date(lightboxPhoto.uploadedAt).toLocaleString("tr-TR")}</p>
              </div>
              <button onClick={() => setLightboxPhoto(null)} className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="rounded-2xl bg-slate-950 aspect-video flex flex-col items-center justify-center border border-slate-800 p-4 text-center">
              <Camera size={48} className="text-sky-400 mb-2" />
              <p className="text-xs font-mono font-bold text-slate-200">{lightboxPhoto.caption}</p>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 mt-2 font-bold">{lightboxPhoto.type}</span>
            </div>

            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={() => setLightboxPhoto(null)} className="h-9 px-4 text-xs font-semibold text-slate-900 dark:text-white cursor-pointer">
                Kapat
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
