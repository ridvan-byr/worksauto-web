"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SERVICE_CATEGORIES } from "@/lib/workshop-constants"

import { ServiceRecord } from "@/features/settings/api/use-settings"

interface ServiceModalProps {
  isOpen: boolean
  editingService?: ServiceRecord | null
  onClose: () => void
  onSubmit: (data: {
    name: string
    category: string
    basePrice: number
    duration: number
    isActive?: boolean
  }) => Promise<void>
  isPending: boolean
}

export function ServiceModal({
  isOpen,
  editingService,
  onClose,
  onSubmit,
  isPending,
}: ServiceModalProps) {
  const isEdit = !!editingService

  const [name, setName] = React.useState("")
  const [category, setCategory] = React.useState("PERIYODIK_BAKIM")
  const [price, setPrice] = React.useState(1500)
  const [duration, setDuration] = React.useState(60)
  const [isActive, setIsActive] = React.useState(true)

  React.useEffect(() => {
    if (editingService) {
      setName(editingService.name || "")
      setCategory(editingService.category || "PERIYODIK_BAKIM")
      setPrice(Number(editingService.basePrice || 0))
      setDuration(Number(editingService.defaultDurationMin || editingService.estimatedMinutes || 60))
      setIsActive(editingService.isActive !== false)
    } else {
      setName("")
      setCategory("PERIYODIK_BAKIM")
      setPrice(1500)
      setDuration(60)
      setIsActive(true)
    }
  }, [editingService, isOpen])

  if (!isOpen || typeof document === "undefined") return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    onSubmit({
      name,
      category,
      basePrice: Number(price),
      duration: Number(duration),
      isActive,
    })
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {isEdit ? "Hizmeti Düzenle" : "Yeni Standart Hizmet Tanımla"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Hizmet / İşçilik Adı *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              placeholder="Örn: Triger Seti Değişimi"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Hizmet Kategorisi *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              {category && !SERVICE_CATEGORIES.some((c) => c.id === category || c.label === category) && (
                <option value={category}>
                  {category} (Mevcut Kategori)
                </option>
              )}
              {SERVICE_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Taban İşçilik (₺)</label>
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Tahmini Süre (Dk)</label>
              <input
                type="number"
                min={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono"
              />
            </div>
          </div>

          {isEdit && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-medium">Katalogda Aktif Olarak Göster</span>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="cursor-pointer"
            >
              İptal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="shadow-sky-500/25 cursor-pointer"
            >
              {isPending
                ? "Kaydediliyor..."
                : isEdit
                ? "Güncellemeleri Kaydet"
                : "Hizmeti Kaydet"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
