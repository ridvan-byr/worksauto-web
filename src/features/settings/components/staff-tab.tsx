"use client"

import * as React from "react"
import { Users, Plus, Phone, Briefcase, Pencil, Trash2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StaffRecord, CreateStaffInput, UpdateStaffInput } from "@/features/settings/api/use-settings"
import { StaffModal } from "./staff-modal"
import { StaffDeleteModal } from "./staff-delete-modal"

interface StaffTabProps {
  staff: StaffRecord[]
  deletedStaffIds: string[]
  currentUserId?: string
  currentUserPhone?: string
  onCreateStaff: (data: CreateStaffInput) => Promise<void>
  onUpdateStaff: (id: string, data: UpdateStaffInput) => Promise<void>
  onDeleteStaff: (id: string) => Promise<void>
  onReactivateStaff: (staff: StaffRecord) => Promise<void>
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
}

export function StaffTab({
  staff,
  deletedStaffIds,
  currentUserId,
  currentUserPhone,
  onCreateStaff,
  onUpdateStaff,
  onDeleteStaff,
  onReactivateStaff,
  isCreating,
  isUpdating,
  isDeleting,
}: StaffTabProps) {
  const [staffView, setStaffView] = React.useState<"active" | "all">("active")
  const [isNewModalOpen, setIsNewModalOpen] = React.useState(false)
  const [editingStaff, setEditingStaff] = React.useState<StaffRecord | null>(null)
  const [deletingStaff, setDeletingStaff] = React.useState<StaffRecord | null>(null)

  const activeStaff = React.useMemo(() => {
    return (staff || []).filter((st: StaffRecord) => {
      const u = st.user || st
      return u.isActive !== false && !deletedStaffIds.includes(u.id || st.id)
    })
  }, [staff, deletedStaffIds])

  const displayedStaff = React.useMemo(() => {
    if (staffView === "active") return activeStaff
    return (staff || []).filter((st: StaffRecord) => {
      const u = st.user || st
      return !deletedStaffIds.includes(u.id || st.id)
    })
  }, [staff, activeStaff, staffView, deletedStaffIds])

  const handleCreate = async (data: CreateStaffInput) => {
    await onCreateStaff(data)
    setIsNewModalOpen(false)
  }

  const handleUpdate = async (data: UpdateStaffInput) => {
    if (!editingStaff) return
    const u = editingStaff.user || editingStaff
    await onUpdateStaff(u.id || editingStaff.id, data)
    setEditingStaff(null)
  }

  const handleDelete = async () => {
    if (!deletingStaff) return
    const u = deletingStaff.user || deletingStaff
    const id = u.id || deletingStaff.id
    setDeletingStaff(null)
    await onDeleteStaff(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Atölye Ustaları & Servis Personeli
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            İş emirlerine atanan teknisyenler ve yetkilendirmeleri
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs">
            <button
              type="button"
              onClick={() => setStaffView("active")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                staffView === "active"
                  ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Aktif ({activeStaff.length})
            </button>
            <button
              type="button"
              onClick={() => setStaffView("all")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                staffView === "all"
                  ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Tümü ({(staff || []).length - deletedStaffIds.length})
            </button>
          </div>
          <Button
            size="sm"
            onClick={() => setIsNewModalOpen(true)}
            className="gap-1.5 cursor-pointer shadow-sky-500/25"
          >
            <Plus size={15} />
            <span>Yeni Personel Ekle</span>
          </Button>
        </div>
      </div>

      {displayedStaff.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
          <Users size={32} className="mx-auto text-slate-400 opacity-50" />
          <p className="text-xs font-semibold text-slate-500">
            {staffView === "active"
              ? "Kayıtlı aktif personel bulunamadı. Yeni bir personel ekleyebilirsiniz."
              : "Gösterilebilecek personel kaydı bulunamadı."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedStaff.map((st: StaffRecord) => {
            const u = st.user || st
            const fullName = u.name ? `${u.name} ${u.surname || ""}`.trim() : "Personel"
            const initial = (u.name?.charAt(0) || "U").toUpperCase()
            const phone = u.phone || "-"
            const role = u.role || "TECHNICIAN"
            const mechanic = st.mechanic || u.mechanic
            const lift = mechanic?.assignedLift || st.assignedLift || "Lift-1"
            const specialty = mechanic?.specialty || st.specialty || "Genel Mekanik"
            const isActive = u.isActive !== false && !deletedStaffIds.includes(u.id || st.id)

            const roleLabel =
              role === "OWNER"
                ? "İşletme Sahibi"
                : role === "SERVICE_MANAGER"
                ? "Servis Müdürü"
                : role === "CASHIER"
                ? "Kasa & Muhasebe"
                : "Usta / Teknisyen"

            const roleBadgeColor =
              role === "OWNER"
                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                : role === "SERVICE_MANAGER"
                ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
                : role === "CASHIER"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"

            const isCurrentUser = (currentUserId && (currentUserId === u.id || currentUserId === st.id)) || (currentUserPhone && currentUserPhone === u.phone)

            return (
              <Card key={st.id || u.id} className="hover:border-amber-500/30 transition-all">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm border border-amber-500/20 shadow-xs">
                        {initial}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{fullName}</span>
                          {isCurrentUser && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                              Sen
                            </span>
                          )}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone size={10} className="text-slate-400" />
                          <span>{phone}</span>
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${roleBadgeColor}`}>
                      {roleLabel}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 py-2 border-y border-slate-100 dark:border-slate-800/80 text-[11px]">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Briefcase size={11} className="text-slate-400" />
                        <span>Uzmanlık:</span>
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{specialty}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>{role === "TECHNICIAN" ? "Atanmış Lift:" : "Çalışma Alanı:"}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px]">
                        {role === "TECHNICIAN" ? lift : "Ofis / Danışma"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>Durum:</span>
                      {isActive ? (
                        <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Aktif Görevde
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Pasif / İzinli
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions: Edit & Delete / Reactivate */}
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingStaff(st)}
                      className="h-7 px-2.5 text-[11px] text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 gap-1 cursor-pointer"
                    >
                      <Pencil size={12} />
                      <span>Düzenle</span>
                    </Button>
                    {!isCurrentUser && (
                      isActive ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingStaff(st)}
                          className="h-7 px-2.5 text-[11px] text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 gap-1 cursor-pointer"
                        >
                          <Trash2 size={12} />
                          <span>Sil</span>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onReactivateStaff(st)}
                          className="h-7 px-2.5 text-[11px] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1 cursor-pointer"
                        >
                          <Check size={12} />
                          <span>Aktifleştir</span>
                        </Button>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <StaffModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSubmit={handleCreate}
        isPending={isCreating}
      />

      <StaffModal
        isOpen={!!editingStaff}
        editingStaff={editingStaff}
        onClose={() => setEditingStaff(null)}
        onSubmit={handleUpdate}
        isPending={isUpdating}
      />

      <StaffDeleteModal
        staff={deletingStaff}
        onClose={() => setDeletingStaff(null)}
        onConfirm={handleDelete}
        isPending={isDeleting}
      />
    </div>
  )
}
