"use client"

import * as React from "react"
import { Building2, Wrench, Users, Shield, Check, Layers, MessageSquare } from "lucide-react"
import { toast } from "@/components/ui/sonner"
import { useAuth } from "@/features/auth/auth-context"
import {
  useTenantSettings,
  useUpdateTenantSettings,
  useServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
  useStaff,
  useCreateStaff,
  useUpdateStaff,
  useDeleteStaff,
  useWorkshopBays,
  useCreateWorkshopBay,
  useUpdateWorkshopBay,
  useDeleteWorkshopBay,
  type TenantSettings,
  type ServiceRecord,
  type StaffRecord,
  type CreateStaffInput,
  type UpdateStaffInput,
} from "@/features/settings/api/use-settings"
import { TenantProfileTab } from "@/features/settings/components/tenant-profile-tab"
import { ServicesTab } from "@/features/settings/components/services-tab"
import { StaffTab } from "@/features/settings/components/staff-tab"
import { WorkshopBaysTab } from "@/features/settings/components/workshop-bays-tab"
import { NotificationSettingsTab } from "@/features/settings/components/notification-settings-tab"

export default function SettingsPage() {
  const { user } = useAuth()
  const userRole = (user?.role || "").toUpperCase()
  const isOwner = userRole === "OWNER" || userRole === "SERVICE_MANAGER" || userRole === "TENANT_ADMIN"

  // Data Hooks
  const { data: tenantData } = useTenantSettings()
  const updateTenantMutation = useUpdateTenantSettings()

  const { data: servicesData } = useServices()
  const createServiceMutation = useCreateService()
  const updateServiceMutation = useUpdateService()
  const deleteServiceMutation = useDeleteService()

  const { data: staffData } = useStaff()
  const createStaffMutation = useCreateStaff()
  const updateStaffMutation = useUpdateStaff()
  const deleteStaffMutation = useDeleteStaff()

  const { data: baysData } = useWorkshopBays()
  const createBayMutation = useCreateWorkshopBay()
  const updateBayMutation = useUpdateWorkshopBay()
  const deleteBayMutation = useDeleteWorkshopBay()

  type SettingsTab = "profile" | "services" | "staff" | "bays" | "notifications"
  const VALID_TABS: SettingsTab[] = ["profile", "services", "staff", "bays", "notifications"]

  // Tab State
  const [activeTab, setActiveTabState] = React.useState<SettingsTab>("profile")
  const [saveSuccess, setSaveSuccess] = React.useState(false)

  // Local soft-delete tracking
  const [deletedServiceIds, setDeletedServiceIds] = React.useState<string[]>([])
  const [deletedStaffIds, setDeletedStaffIds] = React.useState<string[]>([])

  // Sayfa yenilendiğinde veya URL'de tab parametresi olduğunda aktif sekmeyi koru
  React.useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const tabParam = params.get("tab") as SettingsTab | null

    if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveTabState(tabParam)
      localStorage.setItem("worksauto_settings_active_tab", tabParam)
    } else {
      const savedTab = localStorage.getItem("worksauto_settings_active_tab") as SettingsTab | null
      if (savedTab && VALID_TABS.includes(savedTab)) {
        setActiveTabState(savedTab)
        const url = new URL(window.location.href)
        url.searchParams.set("tab", savedTab)
        window.history.replaceState({}, "", url.toString())
      }
    }

    const handlePopState = () => {
      const currentParams = new URLSearchParams(window.location.search)
      const currentTab = currentParams.get("tab") as SettingsTab | null
      if (currentTab && VALID_TABS.includes(currentTab)) {
        setActiveTabState(currentTab)
      }
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  const setActiveTab = React.useCallback((tab: SettingsTab) => {
    setActiveTabState(tab)
    if (typeof window !== "undefined") {
      localStorage.setItem("worksauto_settings_active_tab", tab)
      const url = new URL(window.location.href)
      url.searchParams.set("tab", tab)
      window.history.replaceState({}, "", url.toString())
    }
  }, [])

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
          <Shield size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Bu Sayfaya Erişim Yetkiniz Bulunmuyor
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
          Servis ve işletme ayarları, personel yönetimi ve hizmet tarifeleri yalnızca Servis Yöneticisi (Patron) hesapları tarafından görüntülenebilir ve düzenlenebilir.
        </p>
      </div>
    )
  }

  // Profile save handler
  const handleSaveProfile = async (formData: Partial<TenantSettings>) => {
    try {
      await updateTenantMutation.mutateAsync(formData)
      setSaveSuccess(true)
      toast.success("Ayarlar başarıyla kaydedildi!")
      setTimeout(() => setSaveSuccess(false), 3500)
    } catch (err: unknown) {
      console.error("Profil güncelleme hatası:", err)
      const msg = err instanceof Error ? err.message : "Profil güncellenirken hata oluştu."
      toast.error(msg)
    }
  }

  // Service handlers
  const handleCreateService = async (data: { name: string; category?: string; basePrice: number; duration?: number }) => {
    try {
      await createServiceMutation.mutateAsync({
        name: data.name,
        category: data.category,
        basePrice: Number(data.basePrice),
        estimatedMinutes: Number(data.duration),
        isActive: true,
      })
      toast.success(`${data.name} hizmet kataloğuna eklendi`)
    } catch (err: unknown) {
      console.error("Hizmet ekleme hatası:", err)
      const msg = err instanceof Error ? err.message : "Hizmet eklenirken hata oluştu."
      toast.error(msg)
    }
  }

  const handleUpdateService = async (id: string, data: { name?: string; category?: string; basePrice?: number; duration?: number; isActive?: boolean }) => {
    try {
      await updateServiceMutation.mutateAsync({
        id,
        data: {
          name: data.name,
          category: data.category,
          basePrice: data.basePrice !== undefined ? Number(data.basePrice) : undefined,
          defaultDurationMin: data.duration !== undefined ? Number(data.duration) : undefined,
          isActive: data.isActive,
        },
      })
      toast.success("Hizmet bilgileri güncellendi")
    } catch (err: unknown) {
      console.error("Hizmet güncelleme hatası:", err)
      const msg = err instanceof Error ? err.message : "Hizmet güncellenirken hata oluştu."
      toast.error(msg)
    }
  }

  const handleDeleteService = async (id: string) => {
    setDeletedServiceIds((prev) => [...prev, id])
    try {
      await deleteServiceMutation.mutateAsync(id)
      toast.success("Hizmet katalogdan kaldırıldı")
    } catch (err: unknown) {
      console.error("Hizmet silme hatası:", err)
      setDeletedServiceIds((prev) => prev.filter((item) => item !== id))
      const msg = err instanceof Error ? err.message : "Hizmet silinirken hata oluştu."
      toast.error(msg)
    }
  }

  const handleReactivateService = async (srv: ServiceRecord) => {
    setDeletedServiceIds((prev) => prev.filter((id) => id !== srv.id))
    try {
      await updateServiceMutation.mutateAsync({
        id: srv.id,
        data: { isActive: true },
      })
      toast.success(`${srv.name} tekrar aktifleştirildi`)
    } catch (err: unknown) {
      console.error("Hizmet aktifleştirme hatası:", err)
      const msg = err instanceof Error ? err.message : "Hizmet aktifleştirilemedi."
      toast.error(msg)
    }
  }

  // Staff handlers
  const handleCreateStaff = async (data: CreateStaffInput) => {
    try {
      await createStaffMutation.mutateAsync({
        name: data.name,
        surname: data.surname,
        phone: data.phone,
        email: data.email || undefined,
        role: data.role,
        assignedLift: data.role === "TECHNICIAN" ? data.assignedLift : undefined,
        specialty: data.specialty,
      })
      toast.success(`${data.name} personele eklendi`)
    } catch (err: unknown) {
      console.error("Personel ekleme hatası:", err)
      const msg = err instanceof Error ? err.message : "Personel eklenirken hata oluştu."
      toast.error(msg)
    }
  }

  const handleUpdateStaff = async (id: string, data: UpdateStaffInput) => {
    try {
      await updateStaffMutation.mutateAsync({
        id,
        data: {
          name: data.name,
          surname: data.surname,
          phone: data.phone,
          email: data.email || undefined,
          role: data.role,
          assignedLift: data.role === "TECHNICIAN" ? data.assignedLift : null,
          specialty: data.specialty,
          isActive: data.isActive,
        },
      })
      toast.success("Personel bilgileri başarıyla güncellendi")
    } catch (err: unknown) {
      console.error("Personel güncelleme hatası:", err)
      const msg = err instanceof Error ? err.message : "Personel güncellenirken bir hata oluştu"
      toast.error(msg)
    }
  }

  const handleDeleteStaff = async (id: string) => {
    setDeletedStaffIds((prev) => [...prev, id])
    try {
      await deleteStaffMutation.mutateAsync(id)
      toast.success("Personel pasife alındı")
    } catch (err: unknown) {
      console.error("Personel silme hatası:", err)
      setDeletedStaffIds((prev) => prev.filter((item) => item !== id))
      const msg = err instanceof Error ? err.message : "Personel silinirken hata oluştu."
      toast.error(msg)
    }
  }

  const handleReactivateStaff = async (st: StaffRecord) => {
    const u = st.user || st
    setDeletedStaffIds((prev) => prev.filter((id) => id !== u.id))
    try {
      await updateStaffMutation.mutateAsync({
        id: u.id,
        data: { isActive: true },
      })
      toast.success(`${u.name} tekrar aktif personellere alındı`)
    } catch (err: unknown) {
      console.error("Personel aktifleştirme hatası:", err)
      const msg = err instanceof Error ? err.message : "Personel aktifleştirilemedi."
      toast.error(msg)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Servis & İşletme Ayarları
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              B2B Kurumsal
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Firma profili, atölye işçilik kataloğu ve personel yetkilendirmeleri
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-medium animate-in fade-in">
            <Check size={16} />
            <span>Ayarlar başarıyla kaydedildi!</span>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "profile"
              ? "bg-sky-500 text-white shadow-sm shadow-sky-500/25"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Building2 size={15} />
          <span>Firma & Servis Profili</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("services")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "services"
              ? "bg-sky-500 text-white shadow-sm shadow-sky-500/25"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Wrench size={15} />
          <span>Hizmet & İşçilik Kataloğu</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("staff")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "staff"
              ? "bg-sky-500 text-white shadow-sm shadow-sky-500/25"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Users size={15} />
          <span>Personel & Atölye Ustaları</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("bays")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "bays"
              ? "bg-sky-500 text-white shadow-sm shadow-sky-500/25"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Layers size={15} />
          <span>İstasyonlar & Liftler</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "notifications"
              ? "bg-sky-500 text-white shadow-sm shadow-sky-500/25"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <MessageSquare size={15} />
          <span>Bildirim & WhatsApp</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "profile" && (
        <TenantProfileTab
          initialData={tenantData}
          onSave={handleSaveProfile}
          isPending={updateTenantMutation.isPending}
        />
      )}

      {activeTab === "services" && (
        <ServicesTab
          services={servicesData || []}
          deletedServiceIds={deletedServiceIds}
          onCreateService={handleCreateService}
          onUpdateService={handleUpdateService}
          onDeleteService={handleDeleteService}
          onReactivateService={handleReactivateService}
          isCreating={createServiceMutation.isPending}
          isUpdating={updateServiceMutation.isPending}
          isDeleting={deleteServiceMutation.isPending}
        />
      )}

      {activeTab === "staff" && (
        <StaffTab
          staff={staffData || []}
          deletedStaffIds={deletedStaffIds}
          currentUserId={user?.id}
          currentUserPhone={user?.phone}
          onCreateStaff={handleCreateStaff}
          onUpdateStaff={handleUpdateStaff}
          onDeleteStaff={handleDeleteStaff}
          onReactivateStaff={handleReactivateStaff}
          isCreating={createStaffMutation.isPending}
          isUpdating={updateStaffMutation.isPending}
          isDeleting={deleteStaffMutation.isPending}
        />
      )}

      {activeTab === "bays" && (
        <WorkshopBaysTab
          bays={baysData || []}
          onCreateBay={async (data) => {
            await createBayMutation.mutateAsync(data)
          }}
          onUpdateBay={async (id, data) => {
            await updateBayMutation.mutateAsync({ id, data })
          }}
          onDeleteBay={async (id) => {
            await deleteBayMutation.mutateAsync(id)
          }}
          isCreating={createBayMutation.isPending}
          isUpdating={updateBayMutation.isPending}
          isDeleting={deleteBayMutation.isPending}
        />
      )}

      {activeTab === "notifications" && (
        <NotificationSettingsTab />
      )}
    </div>
  )
}
