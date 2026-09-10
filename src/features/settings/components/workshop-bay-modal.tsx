"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WorkshopBayRecord } from "@/features/settings/api/use-settings"

export const BAY_CATEGORIES = [
  { id: "TWO_POST_LIFT", label: "2 Direkli Lift (Binek & Hafif Ticari)" },
  { id: "FOUR_POST_LIFT", label: "4 Direkli Lift (Ağır Vasıta & Şanzıman)" },
  { id: "SCISSOR_LIFT", label: "Makaslı Lift (Hızlı Bakım & Yağ)" },
  { id: "ALIGNMENT", label: "Rot & Balans Kanalı / Lifti" },
  { id: "DIAGNOSTIC", label: "Diyagnostik & Elektronik İstasyonu" },
  { id: "WASH", label: "Yıkama / Karşılama Alanı" },
  { id: "GENERAL", label: "Genel Kabul / Açık Atölye Alanı" },
]

interface WorkshopBayModalProps {
  isOpen: boolean
  editingBay?: WorkshopBayRecord | null
  onClose: () => void
  onSubmit: (data: {
    name: string
    code?: string
    category: string
    isAvailableForOnline: boolean
    isActive: boolean
    orderIndex?: number
  }) => Promise<void>
  isPending: boolean
}

export function WorkshopBayModal({
  isOpen,
  editingBay,
  onClose,
  onSubmit,
  isPending,
}: WorkshopBayModalProps) {
  const isEdit = !!editingBay

  const [name, setName] = React.useState("")
  const [code, setCode] = React.useState("")
  const [category, setCategory] = React.useState("TWO_POST_LIFT")
  const [isAvailableForOnline, setIsAvailableForOnline] = React.useState(true)
  const [isActive, setIsActive] = React.useState(true)
  const [orderIndex, setOrderIndex] = React.useState(1)

  React.useEffect(() => {
    if (editingBay) {
      setName(editingBay.name || "")
      setCode(editingBay.code || "")
      setCategory(editingBay.category || "TWO_POST_LIFT")
      setIsAvailableForOnline(editingBay.isAvailableForOnline !== false)
      setIsActive(editingBay.isActive !== false)
      setOrderIndex(editingBay.orderIndex || 1)
    } else {
      setName("")
      setCode("")
      setCategory("TWO_POST_LIFT")
      setIsAvailableForOnline(true)
      setIsActive(true)
      setOrderIndex(1)
    }
  }, [editingBay, isOpen])

  if (!isOpen || typeof document === "undefined") return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    onSubmit({
      name: name.trim(),
      code: code.trim() || undefined,
      category,
      isAvailableForOnline,
      isActive,
      orderIndex: Number(orderIndex) || 0,
    })
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {isEdit ? "İstasyon / Lift Düzenle" : "Yeni İstasyon / Lift Tanımla"}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Atölye çalışma alanınızı veya hidrolik liftinizi yapılandırın
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              İstasyon / Lift Adı <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Lift 5 (Ağır Vasıta) veya Rot-Balans Kanalı"
              className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                İstasyon Kodu / No
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Örn: L-05, ROT-1"
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Sıralama Önceliği
              </label>
              <input
                type="number"
                min={0}
                value={orderIndex}
                onChange={(e) => setOrderIndex(Number(e.target.value))}
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              İstasyon Türü / Ekipman Tipi
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              {BAY_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Toggles */}
          <div className="pt-2 space-y-2.5 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors">
              <div>
                <span className="text-xs font-medium text-slate-900 dark:text-slate-100 block">
                  Çevrimiçi Randevu Tahsisi
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Webden alınan müşteri randevuları bu alana atanabilsin mi?
                </span>
              </div>
              <input
                type="checkbox"
                checked={isAvailableForOnline}
                onChange={(e) => setIsAvailableForOnline(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
              />
            </label>

            {isEdit && (
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors">
                <div>
                  <span className="text-xs font-medium text-slate-900 dark:text-slate-100 block">
                    Aktif İstasyon Durumu
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pasife alırsanız iş emri veya randevu açılamaz.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                />
              </label>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 px-4 text-xs rounded-xl cursor-pointer"
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-9 px-4 text-xs font-semibold rounded-xl bg-sky-500 hover:bg-sky-600 text-white cursor-pointer"
            >
              {isPending ? "Kaydediliyor..." : isEdit ? "Değişiklikleri Kaydet" : "İstasyonu Ekle"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
