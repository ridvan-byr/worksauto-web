"use client"

import * as React from "react"
import { toast } from "@/components/ui/sonner"
import {
  useAdminStats,
  useAdminTenants,
  useAdminTenantDetail,
  useUpdateTenantStatus,
  useCreateTenant,
  useDeleteTenant,
  useAdminAuditLogs,
  useAdminHealth,
  CreateTenantInput,
} from "@/features/admin/api/use-admin"
import { Building2, ShieldCheck } from "lucide-react"
import { AdminStatsGrid } from "@/features/admin/components/admin-stats-grid"
import { TenantsTable } from "@/features/admin/components/tenants-table"
import { TenantDetailModal } from "@/features/admin/components/tenant-detail-modal"
import { TenantLicenseModal } from "@/features/admin/components/tenant-license-modal"
import { TenantDeleteModal } from "@/features/admin/components/tenant-delete-modal"
import { CreateTenantModal } from "@/features/admin/components/create-tenant-modal"
import { AdminAuditLogs } from "@/features/admin/components/admin-audit-logs"
import { AdminUsersTab } from "@/features/admin/components/admin-users-tab"

export default function AdminDashboardPage() {
  const { data: stats } = useAdminStats()
  const { data: health } = useAdminHealth()

  const [activeTab, setActiveTab] = React.useState<"tenants" | "admins">("tenants")

  // Tenants State & Queries
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL")

  const { data: tenants } = useAdminTenants({
    search: searchQuery || undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
  })

  const updateStatusMutation = useUpdateTenantStatus()
  const createTenantMutation = useCreateTenant()
  const deleteTenantMutation = useDeleteTenant()

  // Selected Tenant for Drawer/Modal Inspection
  const [selectedTenantId, setSelectedTenantId] = React.useState<string | null>(null)
  const { data: selectedTenantDetail, isLoading: isDetailLoading } = useAdminTenantDetail(
    selectedTenantId || undefined
  )

  // Create Tenant Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [createError, setCreateError] = React.useState<string | null>(null)

  // Delete Tenant Confirmation Modal State
  const [tenantToDelete, setTenantToDelete] = React.useState<{ id: string; title: string } | null>(null)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  // License Status Toggle Modal State
  const [statusModalState, setStatusModalState] = React.useState<{
    isOpen: boolean
    tenantId: string
    title: string
    currentActive: boolean
  } | null>(null)

  // Audit Logs State (Pagination & Filters)
  const [auditPage, setAuditPage] = React.useState(1)
  const [auditActionFilter, setAuditActionFilter] = React.useState("ALL")
  const [auditSearchQuery, setAuditSearchQuery] = React.useState("")
  const [debouncedAuditSearch, setDebouncedAuditSearch] = React.useState("")

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAuditSearch(auditSearchQuery.trim())
    }, 250)
    return () => clearTimeout(timer)
  }, [auditSearchQuery])

  const { data: auditResponse, isLoading: isAuditLoading, isFetching: isAuditFetching } = useAdminAuditLogs({
    page: auditPage,
    limit: 10,
    action: auditActionFilter,
    search: debouncedAuditSearch || undefined,
  })

  // Yalnızca sunucu yanıtı geldiğinde ve seçili sayfa mevcut toplam sayfayı aşıyorsa 1'e çek
  React.useEffect(() => {
    if (auditResponse?.meta?.totalPages && auditPage > auditResponse.meta.totalPages) {
      setAuditPage(1)
    }
  }, [auditResponse?.meta?.totalPages, auditPage])

  const handleConfirmStatusToggle = async () => {
    if (!statusModalState) return
    const nextStatus = !statusModalState.currentActive

    try {
      await updateStatusMutation.mutateAsync({
        id: statusModalState.tenantId,
        isActive: nextStatus,
        reason: nextStatus ? "Süper Yönetici lisans onayladı." : "Süper Yönetici servisi dondurdu.",
      })
      toast.success(
        nextStatus
          ? `${statusModalState.title} lisansı onaylandı ve erişime açıldı.`
          : `${statusModalState.title} lisansı başarıyla askıya alındı.`
      )
      setStatusModalState(null)
    } catch (err: unknown) {
      console.error("Lisans durumu değiştirilemedi:", err)
      const msg = err instanceof Error ? err.message : "Lisans durumu güncellenirken hata oluştu."
      toast.error(msg)
    }
  }

  const handleCreateSubmit = async (formData: CreateTenantInput) => {
    setCreateError(null)

    if (!formData.title || !formData.ownerName || !formData.ownerSurname || !formData.phone || !formData.email) {
      const msg = "Lütfen zorunlu alanları (Servis Adı, Yetkili Adı-Soyadı, Telefon, E-posta) doldurunuz."
      setCreateError(msg)
      toast.warning(msg)
      return
    }

    try {
      await createTenantMutation.mutateAsync(formData)
      toast.success(`${formData.title} platforma başarıyla kaydedildi.`, {
        description: `Yetkili ${formData.ownerName} ${formData.ownerSurname} SMS OTP ile giriş yapabilir.`,
      })
      setIsCreateModalOpen(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Servis oluşturulurken bir hata meydana geldi."
      setCreateError(msg)
      toast.error(msg)
    }
  }

  const handleDeleteTenant = async () => {
    if (!tenantToDelete) return
    setDeleteError(null)

    try {
      await deleteTenantMutation.mutateAsync(tenantToDelete.id)
      toast.success(`${tenantToDelete.title} başarıyla silindi.`, {
        description: "Servise ait tüm iş emirleri, cari hareketler ve müşteri verileri temizlendi.",
      })
      setTenantToDelete(null)
      if (selectedTenantId === tenantToDelete.id) {
        setSelectedTenantId(null)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Servis silinirken hata oluştu."
      setDeleteError(msg)
      toast.error(msg)
    }
  }

  const auditLogs = auditResponse?.data || []
  const auditMeta = auditResponse?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* 1. KPI Stats & Latency */}
      <AdminStatsGrid stats={stats} health={health} />

      {/* 2. Platform Ana Navigasyon Sekmeleri */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("tenants")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "tenants"
              ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          }`}
        >
          <Building2 size={16} />
          <span>Kayıtlı Servisler & Lisanslar</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
            {tenants?.length || stats?.totalTenants || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("admins")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "admins"
              ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          }`}
        >
          <ShieldCheck size={16} />
          <span>Platform Yöneticileri</span>
        </button>
      </div>

      {/* 3. Aktif Sekme İçeriği */}
      {activeTab === "tenants" && (
        <TenantsTable
          tenants={tenants}
          stats={stats}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onOpenCreate={() => {
            setCreateError(null)
            setIsCreateModalOpen(true)
          }}
          onSelectTenant={(id) => setSelectedTenantId(id)}
          onToggleStatus={(t) =>
            setStatusModalState({
              isOpen: true,
              tenantId: t.id,
              title: t.title,
              currentActive: t.currentActive,
            })
          }
          onDeleteTenant={(t) => {
            setDeleteError(null)
            setTenantToDelete(t)
          }}
          isUpdatingStatus={updateStatusMutation.isPending}
        />
      )}

      {activeTab === "admins" && <AdminUsersTab />}

      {/* 4. Platform Güvenlik & Denetim İzi (Her zaman altta) */}
      <AdminAuditLogs
        logs={auditLogs}
        meta={auditMeta}
        isLoading={isAuditLoading}
        isFetching={isAuditFetching}
        currentPage={auditPage}
        onPageChange={(p) => setAuditPage(p)}
        actionFilter={auditActionFilter}
        onActionFilterChange={(action) => {
          setAuditActionFilter(action)
          setAuditPage(1)
        }}
        searchQuery={auditSearchQuery}
        onSearchChange={(search) => {
          setAuditSearchQuery(search)
          setAuditPage(1)
        }}
      />

      {/* Modals */}
      <TenantDetailModal
        tenantId={selectedTenantId}
        tenantDetail={selectedTenantDetail}
        isLoading={isDetailLoading}
        onClose={() => setSelectedTenantId(null)}
        onDelete={(t) => {
          setDeleteError(null)
          setTenantToDelete(t)
        }}
      />

      <TenantLicenseModal
        state={statusModalState}
        onClose={() => setStatusModalState(null)}
        onConfirm={handleConfirmStatusToggle}
        isPending={updateStatusMutation.isPending}
      />

      <TenantDeleteModal
        tenant={tenantToDelete}
        onClose={() => {
          setTenantToDelete(null)
          setDeleteError(null)
        }}
        onConfirm={handleDeleteTenant}
        isPending={deleteTenantMutation.isPending}
        error={deleteError}
      />

      <CreateTenantModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        isPending={createTenantMutation.isPending}
        error={createError}
      />
    </div>
  )
}
