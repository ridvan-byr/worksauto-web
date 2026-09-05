"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  Building2,
  Users,
  Wrench,
  Car,
  CheckCircle2,
  AlertTriangle,
  Search,
  Check,
  Pause,
  Play,
  Eye,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Server,
  Calendar,
  FileText,
  TrendingUp,
  X,
  Phone,
  Mail,
  MapPin,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  Globe,
  Terminal,
  ChevronLeft,
  ChevronRight,
  Copy,
  Filter,
  Cpu,
  Clock,
  CreditCard,
  Tag,
  ArrowRight,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { formatStatus } from "@/lib/audit-formatters"

export default function AdminDashboardPage() {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const { data: stats, isLoading: isStatsLoading } = useAdminStats()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL")

  const { data: tenants, isLoading: isTenantsLoading } = useAdminTenants({
    search: searchQuery || undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
  })

  const updateStatusMutation = useUpdateTenantStatus()
  const createTenantMutation = useCreateTenant()
  const deleteTenantMutation = useDeleteTenant()

  // Audit Logs State (Pagination & Filters)
  const [auditPage, setAuditPage] = React.useState(1)
  const [auditActionFilter, setAuditActionFilter] = React.useState("PLATFORM")
  const [auditSearchQuery, setAuditSearchQuery] = React.useState("")
  const [selectedLogForDetail, setSelectedLogForDetail] = React.useState<any | null>(null)
  const [copiedState, setCopiedState] = React.useState(false)

  const { data: auditResponse, isLoading: isAuditLoading } = useAdminAuditLogs({
    page: auditPage,
    limit: 10,
    action: auditActionFilter,
    search: auditSearchQuery || undefined,
  })

  const { data: health } = useAdminHealth()

  // Selected Tenant for Drawer/Modal Inspection
  const [selectedTenantId, setSelectedTenantId] = React.useState<string | null>(null)
  const { data: selectedTenantDetail, isLoading: isDetailLoading } = useAdminTenantDetail(
    selectedTenantId || undefined
  )

  // Create Tenant Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [createForm, setCreateForm] = React.useState<CreateTenantInput>({
    title: "",
    legalName: "",
    ownerName: "",
    ownerSurname: "",
    phone: "",
    email: "",
    city: "İstanbul",
    district: "",
    address: "",
    taxNumber: "",
    taxOffice: "",
    isActive: true,
  })
  const [createError, setCreateError] = React.useState<string | null>(null)

  // Delete Tenant Confirmation Modal State
  const [tenantToDelete, setTenantToDelete] = React.useState<{ id: string; title: string } | null>(null)
  const [deleteConfirmInput, setDeleteConfirmInput] = React.useState("")
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  // License Status Toggle Modal State
  const [statusModalState, setStatusModalState] = React.useState<{
    isOpen: boolean
    tenantId: string
    title: string
    currentActive: boolean
  } | null>(null)

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
    } catch (err: any) {
      console.error("Lisans durumu değiştirilemedi:", err)
      toast.error(err?.message || "Lisans durumu güncellenirken hata oluştu.")
    }
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)

    if (!createForm.title || !createForm.ownerName || !createForm.ownerSurname || !createForm.phone || !createForm.email) {
      const msg = "Lütfen zorunlu alanları (Servis Adı, Yetkili Adı-Soyadı, Telefon, E-posta) doldurunuz."
      setCreateError(msg)
      toast.warning(msg)
      return
    }

    try {
      await createTenantMutation.mutateAsync(createForm)
      toast.success(`${createForm.title} platforma başarıyla kaydedildi.`, {
        description: `Yetkili ${createForm.ownerName} ${createForm.ownerSurname} SMS OTP ile giriş yapabilir.`,
      })
      setIsCreateModalOpen(false)
      setCreateForm({
        title: "",
        legalName: "",
        ownerName: "",
        ownerSurname: "",
        phone: "",
        email: "",
        city: "İstanbul",
        district: "",
        address: "",
        taxNumber: "",
        taxOffice: "",
        isActive: true,
      })
    } catch (err: any) {
      const msg = err.message || "Servis oluşturulurken bir hata meydana geldi."
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
      setDeleteConfirmInput("")
      if (selectedTenantId === tenantToDelete.id) {
        setSelectedTenantId(null)
      }
    } catch (err: any) {
      const msg = err.message || "Servis silinirken hata oluştu."
      setDeleteError(msg)
      toast.error(msg)
    }
  }

  const handleCopyJson = (content: any) => {
    try {
      navigator.clipboard.writeText(JSON.stringify(content, null, 2))
      setCopiedState(true)
      toast.info("Olay güvenlik verisi (JSON) panoya kopyalandı.")
      setTimeout(() => setCopiedState(false), 2000)
    } catch {
      toast.error("Panoya kopyalama başarısız oldu.")
    }
  }

  const formatIpAddress = (ip: string | null | undefined) => {
    if (!ip || ip === "::1" || ip === "127.0.0.1" || ip.toLowerCase() === "localhost") {
      return "127.0.0.1 (Yerel)"
    }
    return ip
  }

  const formatRoleName = (role: string | undefined) => {
    if (!role) return "Kullanıcı"
    switch (role) {
      case "SUPER_ADMIN": return "Platform Yöneticisi"
      case "OWNER": return "Servis Sahibi"
      case "SERVICE_MANAGER": return "Servis Yöneticisi"
      case "TECHNICIAN": return "Atölye Ustası"
      case "CASHIER": return "Kasa & Muhasebe"
      default: return role
    }
  }

  const getActionTitle = (action: string) => {
    switch (action) {
      case "SECURITY_LOGIN_SUCCESS": return "Platform Girişi Başarılı"
      case "SECURITY_LOGIN_FAILED": return "Yetkisiz veya Hatalı Giriş Denemesi"
      case "TENANT_CREATED": return "Yeni Servis (Tenant) Kaydı Açıldı"
      case "TENANT_DELETED": return "Servis Kaydı ve Verileri Silindi"
      case "TENANT_ACTIVATED": return "Servis Lisansı Onaylandı ve Aktifleştirildi"
      case "TENANT_SUSPENDED": return "Servis Hesabı Donduruldu / Askıya Alındı"
      case "service.deactivated": return "Standart Hizmet Pasife Alındı"
      case "service.deleted": return "Hizmet Kataloğundan Silindi"
      case "service.created": return "Yeni Standart Hizmet Tanımlandı"
      case "service.updated": return "Hizmet Bilgileri Güncellendi"
      case "appointment.created": return "Yeni Servis Randevusu Oluşturuldu"
      case "appointment.status_changed": return "Randevu Durumu Güncellendi"
      case "appointment.cancelled": return "Servis Randevusu İptal Edildi"
      case "work_order.status_changed": return "İş Emri Süreç / Aşama Değişikliği"
      case "work_order.created": return "Yeni Araç Kabul ve İş Emri Açıldı"
      case "invoice.auto_created_on_wo_complete": return "İş Emri Tamamlanması Sonrası Otomatik Fatura"
      case "invoice.created": return "Servis Faturası Düzenlendi"
      case "payment.created": return "Tahsilat / Ödeme Kaydı Alındı"
      default: return action.replace(/_/g, " ").replace(/\./g, " › ")
    }
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case "SECURITY_LOGIN_SUCCESS":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <ShieldCheck size={12} />
            <span>Başarılı Giriş</span>
          </span>
        )
      case "SECURITY_LOGIN_FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-500 dark:text-rose-300 border border-rose-500/30">
            <ShieldAlert size={12} />
            <span>Yetkisiz / Hatalı Giriş</span>
          </span>
        )
      case "TENANT_CREATED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
            <Building2 size={12} />
            <span>Yeni Servis Eklendi</span>
          </span>
        )
      case "TENANT_DELETED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-500 dark:text-rose-400 border border-rose-500/30">
            <Trash2 size={12} />
            <span>Servis Silindi</span>
          </span>
        )
      case "TENANT_ACTIVATED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={12} />
            <span>Lisans Onaylandı</span>
          </span>
        )
      case "TENANT_SUSPENDED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Pause size={12} />
            <span>Servis Askıya Alındı</span>
          </span>
        )
      case "service.deactivated":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Pause size={12} />
            <span>Hizmet Pasife Alındı</span>
          </span>
        )
      case "service.deleted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <Trash2 size={12} />
            <span>Hizmet Silindi</span>
          </span>
        )
      case "service.created":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <Plus size={12} />
            <span>Hizmet Tanımlandı</span>
          </span>
        )
      case "service.updated":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            <Wrench size={12} />
            <span>Hizmet Güncellendi</span>
          </span>
        )
      case "appointment.created":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
            <Calendar size={12} />
            <span>Randevu Oluşturuldu</span>
          </span>
        )
      case "appointment.status_changed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
            <Clock size={12} />
            <span>Randevu Durumu Değişti</span>
          </span>
        )
      case "appointment.cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <AlertCircle size={12} />
            <span>Randevu İptal Edildi</span>
          </span>
        )
      case "work_order.status_changed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <RefreshCw size={12} />
            <span>İş Emri Aşaması Değişti</span>
          </span>
        )
      case "work_order.created":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30">
            <Wrench size={12} />
            <span>Yeni İş Emri Açıldı</span>
          </span>
        )
      case "invoice.auto_created_on_wo_complete":
      case "invoice.created":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <FileText size={12} />
            <span>Fatura Kesildi</span>
          </span>
        )
      case "payment.created":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CreditCard size={12} />
            <span>Tahsilat Alındı</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Tag size={10} />
            <span className="capitalize">{action.replace(/_/g, " ").replace(/\./g, " › ")}</span>
          </span>
        )
    }
  }

  const auditLogs = auditResponse?.data || []
  const auditMeta = auditResponse?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Platform Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Platform Yönetim Konsolu
            </h1>
            <Badge variant="outline" className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 text-xs font-semibold">
              Canlı Sistem
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kayıtlı oto servisleri, lisans onayları, platform işlem hacmi ve altyapı metrikleri.
          </p>
        </div>

        {/* Infrastructure Badge (PostgreSQL ve Redis Gecikmesi) */}
        <div
          className="flex items-center gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 shadow-xs"
          title="Bu değer doğrudan PostgreSQL veritabanı ile yapılan canlı 'SELECT 1' sorgusunun anlık gidiş-dönüş yanıt süresidir."
        >
          <Server size={14} className="text-sky-600 dark:text-sky-400" />
          <span>
            Veritabanı Gecikmesi: <strong className="text-emerald-500 dark:text-emerald-400 font-mono">{health?.database?.latencyMs ?? 1} ms</strong>
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tenants */}
        <Card className="border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0e1524]/60 backdrop-blur-xl shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Toplam Kayıtlı Servis</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {stats?.totalTenants ?? 0}
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 size={12} /> {stats?.activeTenants ?? 0} aktif lisanslı
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
              <Building2 size={22} />
            </div>
          </CardContent>
        </Card>

        {/* Pending / Suspended */}
        <Card className="border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0e1524]/60 backdrop-blur-xl shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Bekleyen / Askıda</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {stats?.inactiveTenants ?? 0}
              </p>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                <AlertTriangle size={12} /> Lisans müdahalesi gerekebilir
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Shield size={22} />
            </div>
          </CardContent>
        </Card>

        {/* Total Work Orders */}
        <Card className="border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0e1524]/60 backdrop-blur-xl shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Toplam İş Emri</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {stats?.totalWorkOrders ?? 0}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {stats?.totalCustomers ?? 0} kayıtlı müşteri
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
              <Wrench size={22} />
            </div>
          </CardContent>
        </Card>

        {/* Platform Total Volume */}
        <Card className="border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0e1524]/60 backdrop-blur-xl shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Platform İşlem Hacmi</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {Number(stats?.totalPlatformVolume ?? 0).toLocaleString("tr-TR")} ₺
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <TrendingUp size={12} /> Tamamlanan servis işleri
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <TrendingUp size={22} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenants Table & License Management */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-sky-500 text-white shadow-sm shadow-sky-500/25 font-semibold"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
              }`}
            >
              Tüm Servisler ({stats?.totalTenants ?? 0})
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === "ACTIVE"
                  ? "bg-sky-500 text-white shadow-sm shadow-sky-500/25 font-semibold"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
              }`}
            >
              Aktif Lisanslılar ({stats?.activeTenants ?? 0})
            </button>
            <button
              onClick={() => setStatusFilter("INACTIVE")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === "INACTIVE"
                  ? "bg-sky-500 text-white shadow-sm shadow-sky-500/25 font-semibold"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
              }`}
            >
              Onay Bekleyen / Dondurulan ({stats?.inactiveTenants ?? 0})
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Servis adı, şehir veya telefon..."
                className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold text-xs gap-1.5 shadow-md shadow-sky-500/20 shrink-0 cursor-pointer"
            >
              <Plus size={15} />
              <span>Yeni Servis Ekle</span>
            </Button>
          </div>
        </div>

        {/* Table Container */}
        <Card className="border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0e1524]/60 backdrop-blur-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Servis Ünvanı & Şehir</th>
                  <th className="p-4">Yetkili / İletişim</th>
                  <th className="p-4">Atölye Kadrosu</th>
                  <th className="p-4">Kayıt Tarihi</th>
                  <th className="p-4">Lisans Durumu</th>
                  <th className="p-4 text-right">Yönetim Aksiyonu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
                {(tenants || []).map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{t.title}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-slate-400 dark:text-slate-500" />
                        <span>{t.city} {t.district ? `• ${t.district}` : ""}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-300">{t.owner}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <Phone size={11} className="text-slate-400 dark:text-slate-500" />
                        <span>{t.ownerPhone}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-700 dark:text-slate-300">
                          <strong>{t.stats?.totalStaff ?? 0}</strong> Personel
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          <strong>{t.stats?.totalWorkOrders ?? 0}</strong> İş Emri
                        </span>
                      </div>
                    </td>

                    <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {new Date(t.createdAt).toLocaleDateString("tr-TR")}
                    </td>

                    <td className="p-4">
                      {t.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 size={12} />
                          <span>Aktif Lisans</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          <AlertTriangle size={12} />
                          <span>Onay Bekliyor / Askıda</span>
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTenantId(t.id)}
                          className="h-8 text-xs border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 gap-1 cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>İncele</span>
                        </Button>

                        {t.isActive ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setStatusModalState({ isOpen: true, tenantId: t.id, title: t.title, currentActive: true })}
                            disabled={updateStatusMutation.isPending}
                            className="h-8 text-xs border-amber-500/30 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/15 hover:bg-amber-500/20 hover:text-amber-700 dark:hover:text-amber-300 gap-1.5 cursor-pointer font-medium"
                          >
                            <Pause size={13} />
                            <span>Askıya Al</span>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setStatusModalState({ isOpen: true, tenantId: t.id, title: t.title, currentActive: false })}
                            disabled={updateStatusMutation.isPending}
                            className="h-8 text-xs border-emerald-500/30 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 hover:bg-emerald-500/20 hover:text-emerald-700 dark:hover:text-emerald-300 gap-1.5 cursor-pointer font-medium"
                          >
                            <Check size={13} />
                            <span>Lisansı Aktif Et</span>
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setTenantToDelete({ id: t.id, title: t.title })}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-rose-500 border-slate-200 dark:border-slate-800 hover:border-rose-500/30 hover:bg-rose-500/10 cursor-pointer"
                          title="Servisi Kalıcı Olarak Sil"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {(tenants || []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                      Arama kriterlerine uygun servis kaydı bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* CREATE NEW TENANT MODAL */}
      {isCreateModalOpen && mounted && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[88vh] overflow-y-auto">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
            >
              <X size={16} />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-xs font-semibold">
                <Building2 size={13} />
                <span>Yeni Kiracı Kaydı</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Yeni Oto Servis / Atölye Ekle</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Platforma yeni bir servis tanımlayın. Kurucu yetkili, oluşturulan telefon numarası üzerinden SMS OTP ile servisine erişebilir.
              </p>
            </div>

            {createError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30 text-xs">
                <AlertCircle size={15} className="shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Servis Tabelası / Adı *</label>
                  <input
                    type="text"
                    required
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    placeholder="Örn: Acar Oto Mekanik Servis"
                    className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Resmi Ticari Ünvan</label>
                  <input
                    type="text"
                    value={createForm.legalName || ""}
                    onChange={(e) => setCreateForm({ ...createForm, legalName: e.target.value })}
                    placeholder="Örn: Acar Motorlu Araçlar Ltd. Şti."
                    className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                  <Users size={14} />
                  <span>Kurucu Yetkili Bilgileri (Atölye Sahibi)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Yetkili Adı *</label>
                    <input
                      type="text"
                      required
                      value={createForm.ownerName}
                      onChange={(e) => setCreateForm({ ...createForm, ownerName: e.target.value })}
                      placeholder="Örn: Ahmet"
                      className="w-full h-9 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Yetkili Soyadı *</label>
                    <input
                      type="text"
                      required
                      value={createForm.ownerSurname}
                      onChange={(e) => setCreateForm({ ...createForm, ownerSurname: e.target.value })}
                      placeholder="Örn: Acar"
                      className="w-full h-9 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Telefon (SMS Girişi İçin) *</label>
                    <input
                      type="tel"
                      required
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                      placeholder="+905321112233"
                      className="w-full h-9 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">E-Posta *</label>
                    <input
                      type="email"
                      required
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      placeholder="ahmet@acaroto.com"
                      className="w-full h-9 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Şehir</label>
                  <input
                    type="text"
                    value={createForm.city || ""}
                    onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                    placeholder="İstanbul, Ankara, İzmir..."
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">İlçe</label>
                  <input
                    type="text"
                    value={createForm.district || ""}
                    onChange={(e) => setCreateForm({ ...createForm, district: e.target.value })}
                    placeholder="Başakşehir, Ostim..."
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Açık Adres</label>
                <input
                  type="text"
                  value={createForm.address || ""}
                  onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                  placeholder="Sanayi Sitesi 4. Blok No: 12"
                  className="w-full h-9 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Vergi Dairesi (Opsiyonel)</label>
                  <input
                    type="text"
                    value={createForm.taxOffice || ""}
                    onChange={(e) => setCreateForm({ ...createForm, taxOffice: e.target.value })}
                    placeholder="İkitelli VD"
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Vergi Numarası (Opsiyonel)</label>
                  <input
                    type="text"
                    value={createForm.taxNumber || ""}
                    onChange={(e) => setCreateForm({ ...createForm, taxNumber: e.target.value })}
                    placeholder="1234567890"
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={createForm.isActive}
                  onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-sky-500"
                />
                <label htmlFor="isActive" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  Servisi hemen aktif et (Lisans onayı verilsin)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={createTenantMutation.isPending}
                  className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold text-xs gap-2 shadow-lg shadow-sky-500/25"
                >
                  <span>{createTenantMutation.isPending ? "Servis Oluşturuluyor..." : "Servisi Sisteme Kaydet"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {tenantToDelete && mounted && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#0f111a] border border-rose-500/30 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
              <Trash2 size={24} />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Servisi Kalıcı Olarak Sil</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong className="text-rose-600 dark:text-rose-400 font-bold">{tenantToDelete.title}</strong> adlı oto servisini silmek üzeresiniz.
              </p>
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-700 dark:text-rose-200">
                Bu işlem servise bağlı tüm <strong>iş emirlerini, müşteri kayıtlarını, araçları, faturaları ve personel hesaplarını</strong> veritabanından kalıcı olarak kaldıracaktır. Bu işlem geri alınamaz!
              </div>
            </div>

            {deleteError && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-300 text-xs">
                <AlertCircle size={14} className="shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs text-slate-600 dark:text-slate-400">
                Onaylamak için servisin adını (<strong>{tenantToDelete.title}</strong>) yazınız:
              </label>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder={tenantToDelete.title}
                className="w-full h-9 px-3 text-xs rounded-xl border border-rose-500/30 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTenantToDelete(null)
                  setDeleteConfirmInput("")
                }}
                className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Vazgeç
              </Button>
              <Button
                size="sm"
                disabled={deleteConfirmInput !== tenantToDelete.title || deleteTenantMutation.isPending}
                onClick={handleDeleteTenant}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold gap-1.5 shadow-md shadow-rose-600/30 disabled:opacity-40"
              >
                <span>{deleteTenantMutation.isPending ? "Siliniyor..." : "Evet, Kalıcı Olarak Sil"}</span>
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Tenant Inspection Modal */}
      {selectedTenantId && mounted && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 space-y-6 shadow-2xl relative max-h-[88vh] overflow-y-auto">
            {/* Header: Title on Left, Close Button on Right */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {selectedTenantDetail?.title || "Servis Detayı"}
                  </h3>
                  {selectedTenantDetail && (
                    <Badge
                      variant="outline"
                      className={
                        selectedTenantDetail.isActive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs"
                      }
                    >
                      {selectedTenantDetail.isActive ? "Aktif Lisans" : "Onay Bekliyor / Askıda"}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {selectedTenantDetail?.legalName || "Ticari ünvan girilmemiş"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTenantId(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors shrink-0"
                title="Pencereyi Kapat"
              >
                <X size={18} />
              </button>
            </div>

            {isDetailLoading ? (
              <div className="py-16 text-center text-xs text-slate-400 font-mono">
                Servis detayları yükleniyor...
              </div>
            ) : selectedTenantDetail ? (
              <div className="space-y-6">
                {/* 4 Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Kayıtlı Usta</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                      {selectedTenantDetail.users?.length ?? 0}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">İş Emri</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                      {selectedTenantDetail._count?.workOrders ?? 0}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Müşteri</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                      {selectedTenantDetail._count?.customers ?? 0}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Araç</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                      {selectedTenantDetail._count?.vehicles ?? 0}
                    </p>
                  </div>
                </div>

                {/* Contact & Tax Info */}
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-slate-800 dark:text-slate-300">İletişim & Vergi Bilgileri</h4>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2 text-slate-700 dark:text-slate-300">
                    <p><strong>Telefon:</strong> {selectedTenantDetail.phone || "-"}</p>
                    <p><strong>E-Posta:</strong> {selectedTenantDetail.email || "-"}</p>
                    <p><strong>Adres:</strong> {selectedTenantDetail.address || "-"} ({selectedTenantDetail.city} / {selectedTenantDetail.district})</p>
                    <p><strong>Vergi Dairesi & No:</strong> {selectedTenantDetail.taxOffice || "-"} / {selectedTenantDetail.taxNumber || "-"}</p>
                  </div>
                </div>

                {/* Staff List */}
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-slate-800 dark:text-slate-300">Kayıtlı Servis Personelleri</h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {(selectedTenantDetail.users || []).map((u: any) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                      >
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {u.name} {u.surname}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{u.phone}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[10px] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        >
                          {u.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer: Delete Button on Left, Close on Right */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setTenantToDelete({ id: selectedTenantDetail.id, title: selectedTenantDetail.title })
                    }}
                    className="border-rose-500/30 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs gap-1.5 cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Servisi Sil</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => setSelectedTenantId(null)}
                    className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Kapat
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>,
        document.body
      )}

      {/* CUSTOM LICENSE ACTIVATION / SUSPENSION CONFIRMATION MODAL */}
      {statusModalState && mounted && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setStatusModalState(null)}
              className="absolute top-5 right-5 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${
                  statusModalState.currentActive
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                }`}
              >
                {statusModalState.currentActive ? <Pause size={22} /> : <CheckCircle2 size={22} />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {statusModalState.currentActive ? "Lisansı Askıya Al" : "Lisansı Aktif Et"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {statusModalState.title}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {statusModalState.currentActive ? (
                  <>
                    <strong className="text-slate-900 dark:text-white">{statusModalState.title}</strong> servisinin lisansını askıya almak üzeresiniz.
                  </>
                ) : (
                  <>
                    <strong className="text-slate-900 dark:text-white">{statusModalState.title}</strong> servisine tam erişim yetkisi verilecek ve lisansı onaylanacaktır.
                  </>
                )}
              </p>

              <div
                className={`p-3 rounded-2xl text-[11px] leading-relaxed border ${
                  statusModalState.currentActive
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-200"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-200"
                }`}
              >
                {statusModalState.currentActive
                  ? "⚠️ Lisans askıya alındığı anda, servise bağlı tüm yönetici ve usta oturumları anında geçersiz kılınır. Servis çalışanları sisteme giriş yapamaz ve hiçbir veriye erişemez."
                  : "✓ Lisans aktif edildiğinde yetkili ve ustalar sisteme SMS OTP ile giriş yapabilir, randevu ve iş emri oluşturabilirler."}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStatusModalState(null)}
                className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Vazgeç
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={updateStatusMutation.isPending}
                onClick={handleConfirmStatusToggle}
                className={`font-bold gap-1.5 shadow-md cursor-pointer ${
                  statusModalState.currentActive
                    ? "bg-amber-600 hover:bg-amber-500 dark:bg-amber-600 dark:hover:bg-amber-500 text-white dark:text-white shadow-amber-600/30"
                    : "bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white dark:text-white shadow-emerald-600/30"
                }`}
              >
                {updateStatusMutation.isPending ? (
                  <span>İşleniyor...</span>
                ) : statusModalState.currentActive ? (
                  <>
                    <Pause size={14} />
                    <span>Evet, Lisansı Askıya Al</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Evet, Lisansı Onayla</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ENTERPRISE AUDIT LOG CONSOLE (WITH SEARCH, FILTER & PAGINATION) */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2">
              <Shield size={16} className="text-sky-600 dark:text-sky-400" />
              <span>Platform & Güvenlik Olay Günlüğü (Audit Log)</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              IP tabanlı girişler, lisans güncellemeleri ve tüm kritik sistem hareketleri.
            </p>
          </div>

          {/* Audit Action Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => { setAuditActionFilter("PLATFORM"); setAuditPage(1); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                auditActionFilter === "PLATFORM"
                  ? "bg-sky-500 text-white font-semibold shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
              }`}
            >
              <ShieldCheck size={12} />
              <span>Platform & Güvenlik</span>
            </button>
            <button
              onClick={() => { setAuditActionFilter("TENANT"); setAuditPage(1); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                auditActionFilter === "TENANT"
                  ? "bg-sky-500 text-white font-semibold shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
              }`}
            >
              <Building2 size={12} />
              <span>Servis & Lisans</span>
            </button>
            <button
              onClick={() => { setAuditActionFilter("SECURITY"); setAuditPage(1); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                auditActionFilter === "SECURITY"
                  ? "bg-sky-500 text-white font-semibold shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
              }`}
            >
              <ShieldAlert size={12} />
              <span>Giriş Denemeleri</span>
            </button>
            <button
              onClick={() => { setAuditActionFilter("OPERATIONS"); setAuditPage(1); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                auditActionFilter === "OPERATIONS"
                  ? "bg-sky-500 text-white font-semibold shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
              }`}
            >
              <Wrench size={12} />
              <span>Servis Operasyonları</span>
            </button>
            <button
              onClick={() => { setAuditActionFilter("ALL"); setAuditPage(1); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                auditActionFilter === "ALL"
                  ? "bg-sky-500 text-white font-semibold shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
              }`}
            >
              Tüm Kayıtlar
            </button>
          </div>
        </div>

        {/* Audit Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={auditSearchQuery}
              onChange={(e) => { setAuditSearchQuery(e.target.value); setAuditPage(1); }}
              placeholder="Aktör, servis adı, işlem türü (fatura, randevu...), IP veya ID ara..."
              className="w-full h-8 pl-8 pr-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>
        </div>

        {/* Audit Table Card */}
        <Card className="border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0e1524]/60 backdrop-blur-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto min-h-[520px]">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Olay / Aksiyon</th>
                  <th className="p-3.5">Aktör / Kullanıcı</th>
                  <th className="p-3.5">İlgili Servis</th>
                  <th className="p-3.5">İstemci IP & Cihaz</th>
                  <th className="p-3.5">Tarih & Saat</th>
                  <th className="p-3.5 text-right">Detay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {auditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/25 transition-colors">
                    <td className="p-3.5">
                      {getActionBadge(log.action)}
                    </td>

                    <td className="p-3.5">
                      {log.user ? (
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white text-xs">
                            {log.user.name} {log.user.surname}
                          </div>
                          {`${log.user.name || ""} ${log.user.surname || ""}`.trim().toLowerCase() !== formatRoleName(log.user.role).toLowerCase() && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              {formatRoleName(log.user.role)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">
                          Sistem
                        </span>
                      )}
                    </td>

                    <td className="p-3.5">
                      {log.tenant ? (
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {log.tenant.title}
                        </span>
                      ) : (
                        <span className="text-sky-600 dark:text-sky-400 font-mono text-[11px] bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md">
                          Platform Geneli
                        </span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20 inline-block w-fit">
                            {formatIpAddress(log.ipAddress)}
                          </span>
                        </div>
                        {log.userAgent && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={log.userAgent}>
                            {log.userAgent}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("tr-TR")}
                    </td>

                    <td className="p-3.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedLogForDetail(log)}
                        className="h-7 px-2.5 text-[11px] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 gap-1 cursor-pointer"
                      >
                        <Eye size={12} />
                        <span>İncele</span>
                      </Button>
                    </td>
                  </tr>
                ))}

                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                      {isAuditLoading ? "Audit kayıtları yükleniyor..." : "Filtre kriterlerine uygun log kaydı bulunamadı."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 dark:text-slate-400 text-[11px]">
              Toplam <strong className="text-slate-900 dark:text-white font-mono">{auditMeta.total}</strong> olay kaydı • Sayfa <strong className="text-slate-900 dark:text-white font-mono">{auditMeta.page}</strong> / <strong className="text-slate-900 dark:text-white font-mono">{auditMeta.totalPages}</strong>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <Button
                size="sm"
                variant="outline"
                type="button"
                disabled={auditMeta.page <= 1}
                onClick={(e) => {
                  e.preventDefault()
                  setAuditPage((prev) => Math.max(1, prev - 1))
                }}
                className="h-7 px-2 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs gap-1 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft size={13} />
                <span>Önceki</span>
              </Button>

              {/* Page numbers (up to 5 pages) */}
              {Array.from({ length: Math.min(5, auditMeta.totalPages) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      setAuditPage(pageNum)
                    }}
                    className={`w-7 h-7 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                      auditMeta.page === pageNum
                        ? "bg-sky-500 text-white font-bold shadow-xs"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}

              <Button
                size="sm"
                variant="outline"
                type="button"
                disabled={auditMeta.page >= auditMeta.totalPages}
                onClick={(e) => {
                  e.preventDefault()
                  setAuditPage((prev) => Math.min(auditMeta.totalPages, prev + 1))
                }}
                className="h-7 px-2 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs gap-1 disabled:opacity-30 cursor-pointer"
              >
                <span>Sonraki</span>
                <ChevronRight size={13} />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* AUDIT LOG PAYLOAD DETAIL MODAL */}
      {selectedLogForDetail && mounted && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#0b101a] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl p-6 space-y-5 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedLogForDetail(null)}
              className="absolute top-5 right-5 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
            >
              <X size={16} />
            </button>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-[11px] font-semibold">
                  <Terminal size={12} />
                  <span>Olay Güvenlik İncelemesi</span>
                </div>
                {getActionBadge(selectedLogForDetail.action)}
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {getActionTitle(selectedLogForDetail.action)}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Log ID: {selectedLogForDetail.id}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">İstemci IP Adresi</span>
                <p className="font-mono text-sky-600 dark:text-sky-400 font-bold">
                  {formatIpAddress(selectedLogForDetail.ipAddress)}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Kayıt Tarihi</span>
                <p className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                  {new Date(selectedLogForDetail.createdAt).toLocaleString("tr-TR")}
                </p>
              </div>
            </div>

            {/* İşlemi Yapan Aktör / Kullanıcı Kartı */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">İşlemi Yapan Aktör</span>
              {selectedLogForDetail.user ? (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedLogForDetail.user.name} {selectedLogForDetail.user.surname}
                  </span>
                  {`${selectedLogForDetail.user.name || ""} ${selectedLogForDetail.user.surname || ""}`.trim().toLowerCase() !== formatRoleName(selectedLogForDetail.user.role).toLowerCase() && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                      {formatRoleName(selectedLogForDetail.user.role)}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">
                  Sistem
                </span>
              )}
            </div>

            {selectedLogForDetail.userAgent && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">İstemci Tarayıcısı (User-Agent)</span>
                <p className="font-mono text-slate-600 dark:text-slate-400 text-[11px] break-all">{selectedLogForDetail.userAgent}</p>
              </div>
            )}

            {/* Structured Visual Summary if changesBefore / changesAfter has values */}
            {(() => {
              const before = selectedLogForDetail.changesBefore || {}
              const after = selectedLogForDetail.changesAfter || {}
              const hasDiff = Object.keys(before).length > 0 || Object.keys(after).length > 0
              if (!hasDiff) return null

              return (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-500" />
                    <span>Özet Değişiklik Bilgileri</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5 text-[11px]">
                    {(before.name || after.name || after.serviceName) && (
                      <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                        <span className="text-slate-500 block text-[10px]">Hizmet Tanımı</span>
                        <span className="font-medium text-slate-900 dark:text-white">{before.name || after.name || after.serviceName}</span>
                      </div>
                    )}
                    {(before.plate || after.plate) && (
                      <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                        <span className="text-slate-500 block text-[10px]">İlgili Araç Plaka</span>
                        <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{before.plate || after.plate}</span>
                      </div>
                    )}
                    {(before.customerName || after.customerName) && (
                      <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                        <span className="text-slate-500 block text-[10px]">Müşteri</span>
                        <span className="font-medium text-slate-900 dark:text-white">{before.customerName || after.customerName}</span>
                      </div>
                    )}
                    {(before.workOrderNumber || after.workOrderNumber) && (
                      <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                        <span className="text-slate-500 block text-[10px]">İş Emri No</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{before.workOrderNumber || after.workOrderNumber}</span>
                      </div>
                    )}
                    {(before.status || after.status) && (
                      <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 sm:col-span-2 flex items-center justify-between">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Aşama / Durum Değişimi</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            {before.status && (
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px] line-through">
                                {formatStatus(before.status)}
                              </span>
                            )}
                            {before.status && after.status && <ArrowRight size={12} className="text-slate-400" />}
                            {after.status && (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono text-[10px] font-bold">
                                {formatStatus(after.status)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {after.reason && (
                      <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 sm:col-span-2">
                        <span className="text-slate-500 block text-[10px]">İşlem Sebebi / Notu</span>
                        <span className="text-slate-700 dark:text-slate-300 italic">{after.reason}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Changes / Payload Data */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-300">Olay Değişiklik Verisi (Tam JSON)</span>
                <button
                  onClick={() => handleCopyJson(selectedLogForDetail.changesAfter || selectedLogForDetail.changesBefore)}
                  className="text-[11px] text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                >
                  {copiedState ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  <span>{copiedState ? "Kopyalandı" : "JSON Kopyala"}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-48">
                <pre>{JSON.stringify(selectedLogForDetail.changesAfter || selectedLogForDetail.changesBefore || { info: "Ek detay verisi bulunmuyor" }, null, 2)}</pre>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button size="sm" variant="outline" onClick={() => setSelectedLogForDetail(null)} className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                Kapat
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
