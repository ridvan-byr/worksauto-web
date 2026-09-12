"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { Layers, Plus, Pencil, Trash2, CheckCircle2, Globe, Wrench, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  WorkshopBayRecord,
  CreateWorkshopBayInput,
  UpdateWorkshopBayInput,
} from "@/features/settings/api/use-settings"
import { WorkshopBayModal, BAY_CATEGORIES } from "./workshop-bay-modal"

interface WorkshopBaysTabProps {
  bays: WorkshopBayRecord[]
  onCreateBay: (data: CreateWorkshopBayInput) => Promise<void>
  onUpdateBay: (id: string, data: UpdateWorkshopBayInput) => Promise<void>
  onDeleteBay: (id: string) => Promise<void>
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
}

export function WorkshopBaysTab({
  bays,
  onCreateBay,
  onUpdateBay,
  onDeleteBay,
  isCreating,
  isUpdating,
  isDeleting,
}: WorkshopBaysTabProps) {
  const [mounted, setMounted] = React.useState(false)
  const [filter, setFilter] = React.useState<"all" | "active">("active")
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingBay, setEditingBay] = React.useState<WorkshopBayRecord | null>(null)
  const [deletingBay, setDeletingBay] = React.useState<WorkshopBayRecord | null>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const activeBays = React.useMemo(() => {
    return (bays || []).filter((b) => b.isActive)
  }, [bays])

  const onlineBays = React.useMemo(() => {
    return (bays || []).filter((b) => b.isActive && b.isAvailableForOnline)
  }, [bays])

  const displayedBays = React.useMemo(() => {
    if (filter === "active") return activeBays
    return bays || []
  }, [bays, activeBays, filter])

  const getCategoryLabel = (catId?: string) => {
    const found = BAY_CATEGORIES.find((c) => c.id === catId)
    return found ? found.label : "Genel İstasyon"
  }

  const handleCreateOrUpdate = async (data: {
    name: string
    code?: string
    category: string
    isAvailableForOnline: boolean
    isActive: boolean
    orderIndex?: number
  }) => {
    if (editingBay) {
      await onUpdateBay(editingBay.id, data)
    } else {
      await onCreateBay(data)
    }
    setIsModalOpen(false)
    setEditingBay(null)
  }

  const handleDelete = async () => {
    if (!deletingBay) return
    await onDeleteBay(deletingBay.id)
    setDeletingBay(null)
  }

  return (
    <div className="space-y-6">
      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <Layers size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Toplam Tanımlı İstasyon</p>
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {bays.length} İstasyon / Lift
              </h4>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Aktif Çalışan Liftler</p>
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {activeBays.length} Aktif
              </h4>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Globe size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Online Randevuya Açık</p>
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {onlineBays.length} İstasyon
              </h4>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("active")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              filter === "active"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Aktif İstasyonlar ({activeBays.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              filter === "all"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Tümü ({bays.length})
          </button>
        </div>

        <Button
          type="button"
          onClick={() => {
            setEditingBay(null)
            setIsModalOpen(true)
          }}
          className="h-9 px-3.5 text-xs font-semibold rounded-xl bg-sky-500 hover:bg-sky-600 text-white gap-2 cursor-pointer"
        >
          <Plus size={15} />
          <span>Yeni Lift / İstasyon Ekle</span>
        </Button>
      </div>

      {/* Grid of Bays */}
      {displayedBays.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <Layers className="mx-auto h-10 w-10 text-slate-400 mb-3" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Tanımlı İstasyon Bulunamadı
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Atölyenizde bulunan hidrolik liftleri, bakım kanallarını ve teşhis alanlarını ekleyerek iş emirlerini ve randevuları bu alanlara atayabilirsiniz.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedBays.map((bay) => (
            <Card
              key={bay.id}
              className={`rounded-2xl border transition-all duration-200 hover:shadow-md ${
                bay.isActive
                  ? "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900"
                  : "border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-950/40 opacity-70"
              }`}
            >
              <CardContent className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {bay.name}
                      </h4>
                      {bay.code && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {bay.code}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {getCategoryLabel(bay.category)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBay(bay)
                        setIsModalOpen(true)
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors cursor-pointer"
                      title="Düzenle"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingBay(bay)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Badges / Features */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  {bay.isAvailableForOnline ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 gap-1"
                    >
                      <Globe size={11} />
                      <span>Online Randevuya Açık</span>
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 gap-1"
                    >
                      <Wrench size={11} />
                      <span>Sadece Atölye İçi</span>
                    </Badge>
                  )}

                  {bay.isActive ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    >
                      Aktif
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                    >
                      Kullanım Dışı
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <WorkshopBayModal
        isOpen={isModalOpen}
        editingBay={editingBay}
        onClose={() => {
          setIsModalOpen(false)
          setEditingBay(null)
        }}
        onSubmit={handleCreateOrUpdate}
        isPending={isCreating || isUpdating}
      />

      {/* Delete confirmation modal */}
      {mounted && deletingBay && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setDeletingBay(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  İstasyonu Silmek İstiyor musunuz?
                </h4>
                <p className="text-xs text-slate-500 truncate">{deletingBay.name}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Bu istasyonu sildiğinizde, atölye lift listenizden kaldırılacaktır. Daha önce tamamlanmış geçmiş iş emirleri bu durumdan etkilenmez.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingBay(null)}
                className="h-8 text-xs rounded-xl cursor-pointer"
              >
                Vazgeç
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-8 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs shadow-rose-500/20"
              >
                {isDeleting ? "Siliniyor..." : "Evet, Sil"}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
