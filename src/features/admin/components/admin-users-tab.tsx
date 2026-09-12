"use client"

import * as React from "react"
import {
  ShieldCheck,
  Plus,
  Search,
  UserCheck,
  UserX,
  Trash2,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  useSuperAdmins,
  useCreateSuperAdmin,
  useUpdateSuperAdminStatus,
  useDeleteSuperAdmin,
  getAdminUser,
  type SuperAdminUserRecord,
  type CreateSuperAdminInput,
} from "@/features/admin/api/use-admin"
import { CreateAdminModal } from "./create-admin-modal"
import { toast } from "@/components/ui/sonner"

export function AdminUsersTab() {
  const currentAdmin = getAdminUser()
  const { data: admins = [], isLoading, error: fetchError } = useSuperAdmins()

  const createMutation = useCreateSuperAdmin()
  const updateStatusMutation = useUpdateSuperAdminStatus()
  const deleteMutation = useDeleteSuperAdmin()

  const [search, setSearch] = React.useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [createError, setCreateError] = React.useState<string | null>(null)

  // Silme & Dondurma onay modal durumları
  const [confirmState, setConfirmState] = React.useState<{
    isOpen: boolean
    action: "STATUS" | "DELETE"
    targetAdmin: SuperAdminUserRecord | null
    nextStatus?: boolean
  }>({
    isOpen: false,
    action: "STATUS",
    targetAdmin: null,
  })

  const filteredAdmins = React.useMemo(() => {
    if (!search.trim()) return admins
    const q = search.toLowerCase()
    return admins.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.surname && a.surname.toLowerCase().includes(q)) ||
        a.email.toLowerCase().includes(q) ||
        a.phone.toLowerCase().includes(q)
    )
  }, [admins, search])

  const handleCreateSubmit = async (data: CreateSuperAdminInput) => {
    setCreateError(null)
    try {
      await createMutation.mutateAsync(data)
      setIsCreateModalOpen(false)
      toast.success("Yeni Super Admin başarıyla oluşturuldu.", {
        description: `${data.name} (${data.email}) artık platform yönetim konsoluna erişebilir.`,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Yönetici hesabı oluşturulamadı."
      setCreateError(msg)
      toast.error(msg)
    }
  }

  const handleConfirmAction = async () => {
    const { action, targetAdmin, nextStatus } = confirmState
    if (!targetAdmin) return

    try {
      if (action === "STATUS" && typeof nextStatus === "boolean") {
        await updateStatusMutation.mutateAsync({ id: targetAdmin.id, isActive: nextStatus })
        toast.success(
          nextStatus
            ? `${targetAdmin.name} hesabı yeniden aktifleştirildi.`
            : `${targetAdmin.name} hesabı başarıyla askıya alındı.`
        )
      } else if (action === "DELETE") {
        await deleteMutation.mutateAsync(targetAdmin.id)
        toast.success(`${targetAdmin.name} (${targetAdmin.email}) hesabı silindi.`)
      }
      setConfirmState({ isOpen: false, action: "STATUS", targetAdmin: null })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "İşlem gerçekleştirilemedi."
      toast.error(msg)
    }
  }

  return (
    <div className="space-y-6">
      {/* Üst Bar: Başlık, Arama ve Yeni Ekle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="text-sky-600 dark:text-sky-400" size={20} />
            <span>Platform Yöneticileri (Super Admin Ekibi)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            WorksAuto yönetim konsoluna, sunucu metriklerine ve kiracı ayarlarına tam yetkili erişime sahip hesaplar
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative w-64">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Yönetici ara (Ad, E-Posta)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <Button
            onClick={() => {
              setCreateError(null)
              setIsCreateModalOpen(true)
            }}
            className="h-9 px-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-sky-600/20 cursor-pointer"
          >
            <Plus size={15} />
            <span>Yeni Yönetici Ekle</span>
          </Button>
        </div>
      </div>

      {/* Yöneticiler Tablosu */}
      <div className="bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Yöneticiler yükleniyor...
          </div>
        ) : fetchError ? (
          <div className="p-8 text-center text-xs text-rose-500">
            Yöneticiler listelenirken bir hata oluştu.
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShieldCheck className="mx-auto text-slate-300 dark:text-slate-700" size={36} />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Eşleşen Super Admin bulunamadı
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Yönetici</th>
                  <th className="py-3 px-4">İletişim</th>
                  <th className="py-3 px-4">Rol & Kapsam</th>
                  <th className="py-3 px-4">Durum</th>
                  <th className="py-3 px-4">Kayıt Tarihi</th>
                  <th className="py-3 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredAdmins.map((admin) => {
                  const isMe = currentAdmin?.id === admin.id || currentAdmin?.email === admin.email
                  return (
                    <tr
                      key={admin.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold flex items-center justify-center shrink-0">
                            {admin.name[0]}
                            {admin.surname ? admin.surname[0] : ""}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                              <span>
                                {admin.name} {admin.surname || ""}
                              </span>
                              {isMe && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                                  Siz
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              ID: {admin.id.substring(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                          <Mail size={13} className="text-slate-400" />
                          <span>{admin.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                          <Phone size={13} className="text-slate-400" />
                          <span>{admin.phone}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold text-[11px] border border-sky-500/20">
                          <ShieldCheck size={12} />
                          SUPER_ADMIN
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Tüm Platform</p>
                      </td>

                      <td className="py-3.5 px-4">
                        {admin.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Askıya Alındı
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" />
                          <span>
                            {new Date(admin.createdAt).toLocaleDateString("tr-TR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Aktif / Pasif Değiştirme */}
                          <button
                            type="button"
                            disabled={isMe || updateStatusMutation.isPending}
                            onClick={() =>
                              setConfirmState({
                                isOpen: true,
                                action: "STATUS",
                                targetAdmin: admin,
                                nextStatus: !admin.isActive,
                              })
                            }
                            className={`p-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                              admin.isActive
                                ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                                : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                            }`}
                            title={
                              isMe
                                ? "Kendi hesabınızı askıya alamazsınız"
                                : admin.isActive
                                ? "Hesabı Askıya Al"
                                : "Hesabı Aktifleştir"
                            }
                          >
                            {admin.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                          </button>

                          {/* Silme */}
                          <button
                            type="button"
                            disabled={isMe || deleteMutation.isPending}
                            onClick={() =>
                              setConfirmState({
                                isOpen: true,
                                action: "DELETE",
                                targetAdmin: admin,
                              })
                            }
                            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title={
                              isMe
                                ? "Kendi hesabınızı silemezsiniz"
                                : "Super Admin Hesabını Kalıcı Olarak Sil"
                            }
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Yeni Yönetici Ekle Modalı */}
      <CreateAdminModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        isPending={createMutation.isPending}
        error={createError}
      />

      {/* Onay Modalı (Dondurma / Silme) */}
      {confirmState.isOpen && confirmState.targetAdmin && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  confirmState.action === "DELETE"
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}
              >
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {confirmState.action === "DELETE"
                    ? "Super Admin Hesabını Sil"
                    : confirmState.nextStatus
                    ? "Hesabı Aktifleştir"
                    : "Hesabı Askıya Al"}
                </h3>
                <p className="text-xs text-slate-500">
                  {confirmState.targetAdmin.name} ({confirmState.targetAdmin.email})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {confirmState.action === "DELETE" ? (
                <>
                  Bu yönetici hesabını kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri
                  alınamaz ve kullanıcı konsola bir daha giriş yapamaz.
                </>
              ) : confirmState.nextStatus ? (
                <>Bu yönetici hesabını yeniden aktifleştirmek istiyor musunuz?</>
              ) : (
                <>
                  Bu yönetici hesabını askıya almak üzeresiniz. Askıdaki yönetici platforma giriş
                  yapamaz.
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setConfirmState({ isOpen: false, action: "STATUS", targetAdmin: null })
                }
                className="rounded-xl text-xs"
              >
                Vazgeç
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmAction}
                disabled={updateStatusMutation.isPending || deleteMutation.isPending}
                className={`rounded-xl text-xs font-semibold text-white ${
                  confirmState.action === "DELETE"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-sky-600 hover:bg-sky-700"
                }`}
              >
                {confirmState.action === "DELETE" ? "Evet, Sil" : "Evet, Onayla"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
