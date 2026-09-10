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
import { AdminStatsGrid } from "@/features/admin/components/admin-stats-grid"
import { TenantsTable } from "@/features/admin/components/tenants-table"
import { TenantDetailModal } from "@/features/admin/components/tenant-detail-modal"
import { TenantLicenseModal } from "@/features/admin/components/tenant-license-modal"
import { TenantDeleteModal } from "@/features/admin/components/tenant-delete-modal"
import { CreateTenantModal } from "@/features/admin/components/create-tenant-modal"
import { AdminAuditLogs } from "@/features/admin/components/admin-audit-logs"

export default function AdminDashboardPage() {
  const { data: stats } = useAdminStats()
  const { data: health } = useAdminHealth()

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

  const { data: auditResponse, isLoading: isAuditLoading } = useAdminAuditLogs({
    page: auditPage,
    limit: 10,
    action: auditActionFilter,
    search: auditSearchQuery || undefined,
  })

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

      {/* 2. Tenants Table & Search/Filter */}
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
        onToggleStatus={(t) => setStatusModalState({ isOpen: true, tenantId: t.id, title: t.title, currentActive: t.currentActive })}
        onDeleteTenant={(t) => {
          setDeleteError(null)
          setTenantToDelete(t)
        }}
        isUpdatingStatus={updateStatusMutation.isPending}
      />

      {/* 3. Audit Logs Section */}
      <AdminAuditLogs
        logs={auditLogs}
        meta={auditMeta}
        isLoading={isAuditLoading}
        onPageChange={setAuditPage}
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
