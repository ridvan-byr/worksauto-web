"use client"

import * as React from "react"
import { createPortal } from "react-dom"
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
  Edit2,
  Trash2,
  Loader2,
  Check,
  Image as ImageIcon,
} from "lucide-react"
import { WorkOrderPhoto } from "../types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/features/auth/auth-context"

interface PhotoGalleryProps {
  photos: WorkOrderPhoto[]
  onUploadPhoto: (file: File, caption: string, photoType: "CHECKIN" | "DAMAGE" | "COMPLETED") => Promise<void>
  onUpdatePhoto?: (photoId: string, caption: string, photoType: "CHECKIN" | "DAMAGE" | "COMPLETED") => Promise<void>
  onDeletePhoto?: (photoId: string) => Promise<void>
  isLocked?: boolean
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "")

function formatUploaderName(
  nameOrId?: string,
  currentUserId?: string,
  currentUserName?: string
): string {
  if (!nameOrId) return "Personel"
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nameOrId)
  if (isUuid) {
    if (currentUserId && nameOrId.toLowerCase() === currentUserId.toLowerCase()) {
      return currentUserName || "Siz"
    }
    return "Personel"
  }
  return nameOrId
}

function getDisplayUrl(url?: string): string {
  if (!url) return "/brand/worksauto-icon-white-tight.png"
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("blob:")) {
    return url
  }
  const clean = url.startsWith("/") ? url.slice(1) : url
  const key = clean.replace(/^api\/v1\/media\/files\//, "")
  if (typeof window !== "undefined") {
    return `/api/v1/media/files/${key}`
  }
  return `${API_BASE_URL}/media/files/${key}`
}

export function PhotoGallery({
  photos,
  onUploadPhoto,
  onUpdatePhoto,
  onDeletePhoto,
  isLocked = false,
}: PhotoGalleryProps) {
  const { user } = useAuth()
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null)
  const [activeTab, setActiveTab] = React.useState<"ALL" | "CHECKIN" | "DAMAGE" | "COMPLETED">("ALL")
  const [isAdding, setIsAdding] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  // Upload Form State
  const cameraInputRef = React.useRef<HTMLInputElement | null>(null)
  const galleryInputRef = React.useRef<HTMLInputElement | null>(null)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [captionInput, setCaptionInput] = React.useState("")
  const [photoType, setPhotoType] = React.useState<"CHECKIN" | "DAMAGE" | "COMPLETED">("CHECKIN")
  const [isUploading, setIsUploading] = React.useState(false)

  // Edit Modal State
  const [editingPhoto, setEditingPhoto] = React.useState<WorkOrderPhoto | null>(null)
  const [editCaption, setEditCaption] = React.useState("")
  const [editType, setEditType] = React.useState<"CHECKIN" | "DAMAGE" | "COMPLETED">("CHECKIN")
  const [isUpdating, setIsUpdating] = React.useState(false)

  // Deleting State
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Keyboard navigation for lightbox & edit dialog
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingPhoto) {
        if (e.key === "Escape") {
          e.stopPropagation()
          setEditingPhoto(null)
        }
        return
      }

      if (lightboxIndex === null) return

      if (e.key === "Escape") {
        setLightboxIndex(null)
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : photos.length - 1))
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev !== null && prev < photos.length - 1 ? prev + 1 : 0))
      }
    }

    if (lightboxIndex !== null || editingPhoto !== null) {
      window.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      if (lightboxIndex === null && editingPhoto === null) {
        document.body.style.overflow = "auto"
      }
    }
  }, [lightboxIndex, editingPhoto, photos.length])

  // Filter photos by tab
  const filteredPhotos = React.useMemo(() => {
    if (activeTab === "ALL") return photos
    return photos.filter((p) => (p.type || p.photoType || "CHECKIN") === activeTab)
  }, [photos, activeTab])

  const counts = React.useMemo(() => {
    return {
      ALL: photos.length,
      CHECKIN: photos.filter((p) => (p.type || p.photoType || "CHECKIN") === "CHECKIN").length,
      DAMAGE: photos.filter((p) => (p.type || p.photoType) === "DAMAGE").length,
      COMPLETED: photos.filter((p) => (p.type || p.photoType) === "COMPLETED").length,
    }
  }, [photos])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    if (!captionInput.trim()) {
      setCaptionInput(
        photoType === "CHECKIN"
          ? "Araç kabul görseli"
          : photoType === "DAMAGE"
          ? "Kaporta hasar tespiti"
          : "İşlem tamamlandı kontrolü"
      )
    }
  }

  const handleClearSelectedFile = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ""
    }
    if (galleryInputRef.current) {
      galleryInputRef.current.value = ""
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || isUploading) return

    setIsUploading(true)
    try {
      await onUploadPhoto(
        selectedFile,
        captionInput.trim() || "Araç görseli",
        photoType
      )
      handleClearSelectedFile()
      setCaptionInput("")
      setIsAdding(false)
    } finally {
      setIsUploading(false)
    }
  }

  const handleOpenEdit = (photo: WorkOrderPhoto, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setEditingPhoto(photo)
    setEditCaption(photo.caption || "")
    setEditType((photo.type || photo.photoType || "CHECKIN") as "CHECKIN" | "DAMAGE" | "COMPLETED")
  }

  const handleSaveEdit = async () => {
    if (!editingPhoto || !onUpdatePhoto || isUpdating) return
    setIsUpdating(true)
    try {
      await onUpdatePhoto(editingPhoto.id, editCaption.trim(), editType)
      setEditingPhoto(null)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeletePhoto = async (photoId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!onDeletePhoto || deletingId) return
    if (!window.confirm("Bu fotoğrafı kalıcı olarak silmek istediğinize emin misiniz?")) return

    setDeletingId(photoId)
    try {
      await onDeletePhoto(photoId)
      if (lightboxIndex !== null) {
        setLightboxIndex(null)
      }
    } finally {
      setDeletingId(null)
    }
  }

  const activeLightboxPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null

  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Camera size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Araç Kabul & Hasar Fotoğrafları</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                {photos.length}
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">
              Ekspertiz, kilometre ve kaporta hasar tespit görselleri
            </p>
          </div>
        </div>

        {!isLocked && (
          <Button
            type="button"
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
            className="h-8 px-3 text-xs font-semibold gap-1.5 cursor-pointer bg-sky-600 hover:bg-sky-700 text-white self-start sm:self-auto"
          >
            {isAdding ? <X size={13} /> : <Plus size={13} />}
            <span>{isAdding ? "Vazgeç" : "Fotoğraf Çek / Yükle"}</span>
          </Button>
        )}
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("ALL")}
          className={cn(
            "px-3 py-1 rounded-xl font-semibold transition-all cursor-pointer text-[11px] whitespace-nowrap",
            activeTab === "ALL"
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          Tümü ({counts.ALL})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("CHECKIN")}
          className={cn(
            "px-3 py-1 rounded-xl font-semibold transition-all cursor-pointer text-[11px] whitespace-nowrap",
            activeTab === "CHECKIN"
              ? "bg-sky-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          Araç Kabul ({counts.CHECKIN})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("DAMAGE")}
          className={cn(
            "px-3 py-1 rounded-xl font-semibold transition-all cursor-pointer text-[11px] whitespace-nowrap",
            activeTab === "DAMAGE"
              ? "bg-amber-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          Hasar & Çizik ({counts.DAMAGE})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("COMPLETED")}
          className={cn(
            "px-3 py-1 rounded-xl font-semibold transition-all cursor-pointer text-[11px] whitespace-nowrap",
            activeTab === "COMPLETED"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          Tamamlanan ({counts.COMPLETED})
        </button>
      </div>

      {/* Real Upload Box */}
      {isAdding && (
        <form
          onSubmit={handleUploadSubmit}
          className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/20 space-y-3.5 animate-in fade-in duration-200"
        >
          {/* Hidden inputs for Camera and Gallery */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {!previewUrl ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Live Photo Capture */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="group p-4 sm:p-5 rounded-2xl border-2 border-dashed border-sky-400/50 hover:border-sky-500 bg-white/80 dark:bg-slate-900/80 hover:bg-sky-50/70 dark:hover:bg-sky-950/30 transition-all flex flex-col items-center justify-center text-center gap-2.5 cursor-pointer shadow-xs hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-white transition-all flex items-center justify-center shadow-xs">
                  <Camera size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    Fotoğraf Çek
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Kamerayı doğrudan açarak anlık çekin
                  </p>
                </div>
                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300">
                  Mobil / Canlı Kamera
                </span>
              </button>

              {/* Option 2: Gallery or File Picker */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="group p-4 sm:p-5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-white/80 dark:bg-slate-900/80 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/30 transition-all flex flex-col items-center justify-center text-center gap-2.5 cursor-pointer shadow-xs hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all flex items-center justify-center shadow-xs">
                  <ImageIcon size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Galeriden / Dosyadan Seç
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Cihazınızdaki fotoğraf albümünden seçin
                  </p>
                </div>
                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                  Galeri / Dosya
                </span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <img
                src={previewUrl}
                alt="Önizleme"
                className="w-16 h-16 rounded-lg object-cover border border-slate-200 dark:border-slate-800"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {selectedFile?.name}
                </p>
                <p className="text-[10px] text-slate-400">
                  {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ""}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearSelectedFile}
                className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50"
              >
                Değiştir
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                Fotoğraf Türü
              </label>
              <select
                value={photoType}
                onChange={(e) => setPhotoType(e.target.value as "CHECKIN" | "DAMAGE" | "COMPLETED")}
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
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAdding(false)
                handleClearSelectedFile()
              }}
              disabled={isUploading}
              className="h-8 text-xs cursor-pointer"
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!selectedFile || isUploading}
              className="h-8 px-4 text-xs font-bold gap-1.5 cursor-pointer bg-sky-600 hover:bg-sky-700 text-white"
            >
              {isUploading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Yükleniyor...</span>
                </>
              ) : (
                <>
                  <Camera size={13} />
                  <span>Fotoğrafı Kaydet</span>
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Visual Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {filteredPhotos.length === 0 ? (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5">
            <Camera size={26} className="opacity-40 mb-1 text-slate-400" />
            <span className="font-medium">
              {photos.length === 0
                ? "Henüz araç fotoğrafı yüklenmemiş."
                : "Bu kategoride kayıtlı fotoğraf bulunmuyor."}
            </span>
            <span className="text-[10px] text-slate-400">
              Araç kabul, hasar tespiti veya işlem bitiminde görsel ekleyin.
            </span>
          </div>
        ) : (
          filteredPhotos.map((photo, idx) => {
            const displayUrl = getDisplayUrl(photo.url)
            const type = photo.type || photo.photoType || "CHECKIN"

            return (
              <div
                key={photo.id}
                onClick={() => setLightboxIndex(idx)}
                className="group relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 bg-slate-950 aspect-[4/3] cursor-pointer hover:border-sky-500/70 shadow-xs hover:shadow-md transition-all duration-300"
              >
                {/* Actual Image */}
                <img
                  src={displayUrl}
                  alt={photo.caption || "Araç Fotoğrafı"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback on error
                    ;(e.target as HTMLImageElement).src = "/brand/worksauto-icon-white-tight.png"
                  }}
                />

                {/* Gradient Scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent pointer-events-none" />

                {/* Type Badge on Top Left */}
                <div className="absolute top-2 left-2 pointer-events-none">
                  {type === "CHECKIN" && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-500/90 text-white shadow-xs backdrop-blur-xs">
                      Kabul
                    </span>
                  )}
                  {type === "DAMAGE" && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/90 text-white shadow-xs backdrop-blur-xs flex items-center gap-1">
                      <ShieldAlert size={10} />
                      <span>Hasar</span>
                    </span>
                  )}
                  {type === "COMPLETED" && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/90 text-white shadow-xs backdrop-blur-xs flex items-center gap-1">
                      <CheckCircle2 size={10} />
                      <span>Bitti</span>
                    </span>
                  )}
                </div>

                {/* Top Right Actions (Edit / Delete) */}
                {!isLocked && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {onUpdatePhoto && (
                      <button
                        type="button"
                        onClick={(e) => handleOpenEdit(photo, e)}
                        className="w-7 h-7 rounded-lg bg-slate-900/80 hover:bg-sky-600 text-white flex items-center justify-center transition-colors shadow-xs"
                        title="Fotoğrafı Düzenle"
                      >
                        <Edit2 size={12} />
                      </button>
                    )}
                    {onDeletePhoto && (
                      <button
                        type="button"
                        onClick={(e) => handleDeletePhoto(photo.id, e)}
                        className="w-7 h-7 rounded-lg bg-slate-900/80 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-xs"
                        title="Fotoğrafı Sil"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                )}

                {/* Bottom Caption */}
                <div className="absolute bottom-2 left-2 right-2 text-white pointer-events-none">
                  <p className="text-[11px] font-semibold truncate drop-shadow-xs">
                    {photo.caption}
                  </p>
                  <p className="text-[9px] text-slate-300 drop-shadow-xs flex items-center gap-1 mt-0.5">
                    <span>{formatUploaderName(photo.uploaderName || photo.uploadedBy, user?.id, user?.name)}</span>
                  </p>
                </div>

                {/* Center Hover Icon */}
                <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <div className="w-8 h-8 rounded-full bg-white/25 backdrop-blur-md text-white flex items-center justify-center shadow-lg">
                    <Maximize2 size={15} />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Edit Photo Dialog - Portaled to document.body with z-[160] to stay above lightbox & screen-centered */}
      {mounted &&
        editingPhoto &&
        createPortal(
          <div
            className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setEditingPhoto(null)}
          >
            <div
              className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Edit2 size={15} className="text-sky-500" />
                  <span>Fotoğraf Bilgilerini Düzenle</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingPhoto(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Kapat"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-center p-2 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200/80 dark:border-slate-800/80">
                  <img
                    src={getDisplayUrl(editingPhoto.url)}
                    alt="Fotoğraf"
                    className="max-h-36 w-auto object-contain rounded-xl shadow-xs"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = "/brand/worksauto-icon-white-tight.png"
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Fotoğraf Türü
                  </label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as "CHECKIN" | "DAMAGE" | "COMPLETED")}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
                  >
                    <option value="CHECKIN">Araç Kabul (KM / Ön-Arka)</option>
                    <option value="DAMAGE">Mevcut Hasar / Kaporta Çiziği</option>
                    <option value="COMPLETED">İşlem Tamamlandı / Hazır</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Açıklama / Not
                  </label>
                  <input
                    type="text"
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    placeholder="Fotoğraf açıklaması girin..."
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200/70 dark:border-slate-800/70">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingPhoto(null)}
                  disabled={isUpdating}
                  className="h-9 px-4 text-xs cursor-pointer text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Vazgeç
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isUpdating || !editCaption.trim()}
                  className="h-9 px-5 text-xs font-bold gap-1.5 cursor-pointer bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20"
                >
                  {isUpdating ? <Loader2 size={13} className="animate-spin mr-1" /> : <Check size={13} className="mr-1" />}
                  <span>Kaydet</span>
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}

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
                    {(activeLightboxPhoto.type || activeLightboxPhoto.photoType) === "CHECKIN" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                        Araç Kabul Fotoğrafı
                      </span>
                    )}
                    {(activeLightboxPhoto.type || activeLightboxPhoto.photoType) === "DAMAGE" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <ShieldAlert size={11} />
                        <span>Mevcut Hasar Tespiti</span>
                      </span>
                    )}
                    {(activeLightboxPhoto.type || activeLightboxPhoto.photoType) === "COMPLETED" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 size={11} />
                        <span>Tamamlanan İşlem</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      <span>{formatUploaderName(activeLightboxPhoto.uploaderName || activeLightboxPhoto.uploadedBy, user?.id, user?.name)}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>
                        {new Date(
                          activeLightboxPhoto.uploadedAt || activeLightboxPhoto.createdAt || Date.now()
                        ).toLocaleString("tr-TR")}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isLocked && onUpdatePhoto && (
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(activeLightboxPhoto)}
                      className="p-2 rounded-xl text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Fotoğrafı Düzenle"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                  {!isLocked && onDeletePhoto && (
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(activeLightboxPhoto.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Fotoğrafı Sil"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <a
                    href={getDisplayUrl(activeLightboxPhoto.url)}
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
                  src={getDisplayUrl(activeLightboxPhoto.url)}
                  alt={activeLightboxPhoto.caption || "Araç Görseli"}
                  className="max-h-[60vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = "/brand/worksauto-icon-white-tight.png"
                  }}
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
