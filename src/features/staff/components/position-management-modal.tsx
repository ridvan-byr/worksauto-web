"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  X,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Lock,
  RotateCcw,
  Sparkles,
  Info,
  Shield,
  Briefcase,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/sonner"
import {
  WorkshopPosition,
  BaseSystemRole,
  ROLE_PERMISSIONS,
  getTenantPositions,
  saveTenantPositions,
  DEFAULT_POSITIONS,
} from "../lib/position-types"
import { cn } from "@/lib/utils"

interface PositionManagementModalProps {
  isOpen: boolean
  onClose: () => void
  onPositionsChange?: (positions: WorkshopPosition[]) => void
}

const COLOR_OPTIONS = [
  { id: "sky", label: "Mavi", bg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30" },
  { id: "emerald", label: "Yeşil", bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
  { id: "amber", label: "Turuncu", bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  { id: "purple", label: "Mor", bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30" },
  { id: "indigo", label: "Lacivert", bg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30" },
  { id: "teal", label: "Turkuaz", bg: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30" },
  { id: "slate", label: "Gri", bg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700" },
]

export function PositionManagementModal({
  isOpen,
  onClose,
  onPositionsChange,
}: PositionManagementModalProps) {
  const [positions, setPositions] = React.useState<WorkshopPosition[]>([])
  const [isAddingNew, setIsAddingNew] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)

  // Form fields
  const [formName, setFormName] = React.useState("")
  const [formRole, setFormRole] = React.useState<BaseSystemRole>("TECHNICIAN")
  const [formColor, setFormColor] = React.useState("sky")

  React.useEffect(() => {
    if (isOpen) {
      setPositions(getTenantPositions())
      setIsAddingNew(false)
      setEditingId(null)
    }
  }, [isOpen])

  if (!isOpen || typeof document === "undefined") return null

  const handleStartAdd = () => {
    setFormName("")
    setFormRole("TECHNICIAN")
    setFormColor("sky")
    setEditingId(null)
    setIsAddingNew(true)
  }

  const handleStartEdit = (pos: WorkshopPosition) => {
    setFormName(pos.name)
    setFormRole(pos.baseRole)
    setFormColor(pos.color || "sky")
    setIsAddingNew(false)
    setEditingId(pos.id)
  }

  const handleSavePosition = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = formName.trim()
    if (!trimmed) {
      toast.error("Pozisyon adı boş bırakılamaz.")
      return
    }

    let updated: WorkshopPosition[]
    if (editingId) {
      updated = positions.map((p) =>
        p.id === editingId
          ? { ...p, name: trimmed, baseRole: formRole, color: formColor }
          : p
      )
      toast.success(`"${trimmed}" pozisyonu güncellendi.`)
    } else {
      const id = "pos-" + Date.now().toString(36)
      const newPos: WorkshopPosition = {
        id,
        name: trimmed,
        baseRole: formRole,
        color: formColor,
        isCustom: true,
      }
      updated = [...positions, newPos]
      toast.success(`"${trimmed}" pozisyonu eklendi.`)
    }

    setPositions(updated)
    saveTenantPositions(updated)
    onPositionsChange?.(updated)
    setIsAddingNew(false)
    setEditingId(null)
  }

  const handleDelete = (id: string, name: string) => {
    if (positions.length <= 1) {
      toast.error("En az bir pozisyon bulunmalıdır.")
      return
    }
    const updated = positions.filter((p) => p.id !== id)
    setPositions(updated)
    saveTenantPositions(updated)
    onPositionsChange?.(updated)
    toast.info(`"${name}" pozisyonu silindi.`)
  }

  const handleResetDefaults = () => {
    setPositions(DEFAULT_POSITIONS)
    saveTenantPositions(DEFAULT_POSITIONS)
    onPositionsChange?.(DEFAULT_POSITIONS)
    setIsAddingNew(false)
    setEditingId(null)
    toast.success("Pozisyonlar varsayılan listeye sıfırlandı.")
  }

  const activeRolePermission = ROLE_PERMISSIONS[formRole]

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="my-auto relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
              <Briefcase size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Atölye Pozisyonları & Ünvan Yönetimi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Servisinize özel pozisyonlar tanımlayın ve sistem yetkilerini belirleyin
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Top Actions */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Kayıtlı Pozisyonlar ({positions.length})
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetDefaults}
                className="text-xs h-8 gap-1 text-slate-500 cursor-pointer"
                title="Varsayılan standart atölye pozisyonlarına dön"
              >
                <RotateCcw size={13} />
                <span>Varsayılanlara Dön</span>
              </Button>

              {!isAddingNew && !editingId && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleStartAdd}
                  className="text-xs h-8 gap-1 cursor-pointer bg-sky-600 hover:bg-sky-500 text-white"
                >
                  <Plus size={14} />
                  <span>Yeni Pozisyon Ekle</span>
                </Button>
              )}
            </div>
          </div>

          {/* Create / Edit Form Card */}
          {(isAddingNew || editingId) && (
            <form
              onSubmit={handleSavePosition}
              className="p-4 rounded-2xl border border-sky-500/30 bg-sky-500/5 dark:bg-sky-950/20 space-y-4 animate-in fade-in"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                  <Sparkles size={14} />
                  <span>{editingId ? "Pozisyonu Düzenle" : "Yeni Özel Pozisyon Tanımla"}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false)
                    setEditingId(null)
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  İptal
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Pozisyon / Ünvan Adı <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Örn: Elektrikli Araç Teknisyeni"
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Bağlı Sistem Rolü (Yetki Grubu) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as BaseSystemRole)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value="TECHNICIAN">Atölye Teknisyeni (Usta / Lift İşlemleri)</option>
                    <option value="CONSULTANT">Servis Danışmanı (Kabul / Randevu / Takip)</option>
                    <option value="SERVICE_MANAGER">Servis Yöneticisi (Atölye Şefi / Raporlar)</option>
                  </select>
                </div>
              </div>

              {/* Color Tag Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Rozet Rengi (Çizelgede ve Kartlarda Görünüm)
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFormColor(c.id)}
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer",
                        c.bg,
                        formColor === c.id ? "ring-2 ring-sky-500 font-bold scale-105" : "opacity-80 hover:opacity-100"
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Role Permissions Breakdown Card (Requested by user!) */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <Shield size={15} className="text-sky-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Bu Rolün Sahip Olacağı Sistem Yetkileri:
                    </span>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] font-bold", activeRolePermission.badgeColor)}>
                    {activeRolePermission.roleTitle}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  {/* Allowed permissions */}
                  <div className="space-y-1.5">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      <span>Erişebileceği Alanlar:</span>
                    </span>
                    <ul className="space-y-1 text-slate-600 dark:text-slate-300 pl-1">
                      {activeRolePermission.allowedFeatures.map((f, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-tight">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Restricted permissions */}
                  <div className="space-y-1.5">
                    <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <Lock size={13} />
                      <span>Kısıtlanan Alanlar:</span>
                    </span>
                    <ul className="space-y-1 text-slate-500 dark:text-slate-400 pl-1">
                      {activeRolePermission.restrictedFeatures.map((f, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-tight">
                          <span className="text-rose-400 font-bold">•</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddingNew(false)
                    setEditingId(null)
                  }}
                  className="text-xs h-8 cursor-pointer"
                >
                  Vazgeç
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs h-8 bg-sky-600 hover:bg-sky-500 text-white cursor-pointer"
                >
                  {editingId ? "Güncellemeyi Kaydet" : "Pozisyonu Ekle"}
                </Button>
              </div>
            </form>
          )}

          {/* Position List */}
          <div className="space-y-2">
            {positions.map((pos) => {
              const roleMeta = ROLE_PERMISSIONS[pos.baseRole] || ROLE_PERMISSIONS.TECHNICIAN
              const colorConfig = COLOR_OPTIONS.find((c) => c.id === pos.color) || COLOR_OPTIONS[0]

              return (
                <div
                  key={pos.id}
                  className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={cn("text-xs font-bold px-2.5 py-1 rounded-lg border", colorConfig.bg)}>
                      {pos.name}
                    </span>

                    <Badge variant="outline" className={cn("text-[10px]", roleMeta.badgeColor)}>
                      {roleMeta.roleTitle}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(pos)}
                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                      title="Düzenle"
                    >
                      <Edit2 size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(pos.id, pos.name)}
                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Info size={14} className="text-sky-500" />
            <span>Pozisyonlar personel kartlarında ve vardiya çizelgesinde otomatik gösterilir.</span>
          </span>

          <Button
            type="button"
            size="sm"
            onClick={onClose}
            className="text-xs h-8 px-4 cursor-pointer"
          >
            Tamam
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
