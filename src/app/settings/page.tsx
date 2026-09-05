"use client"

import * as React from "react"
import {
  Building2,
  Wrench,
  Users,
  Shield,
  Save,
  Plus,
  Clock,
  Phone,
  Mail,
  Check,
  Pencil,
  Trash2,
  AlertTriangle,
  X,
  Briefcase,
  Eye,
  ChevronLeft,
  ChevronRight,
  Copy,
  Terminal,
  Sparkles,
  ArrowRight,
  Tag,
  RefreshCw,
  Calendar,
  FileText,
  CreditCard,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
} from "@/features/settings/api/use-settings"
import { DEFAULT_LIFTS, SERVICE_CATEGORIES, formatServiceCategory } from "@/lib/workshop-constants"
import { createPortal } from "react-dom"

export default function SettingsPage() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const { user } = useAuth()
  const userRole = (user?.role || "").toUpperCase()
  const isOwner = userRole === "OWNER" || userRole === "SERVICE_MANAGER" || userRole === "TENANT_ADMIN"

  // Data Hooks
  const { data: tenantData, isLoading: isTenantLoading } = useTenantSettings()
  const updateTenantMutation = useUpdateTenantSettings()

  const { data: servicesData, isLoading: isServicesLoading } = useServices()
  const createServiceMutation = useCreateService()
  const updateServiceMutation = useUpdateService()
  const deleteServiceMutation = useDeleteService()

  const { data: staffData, isLoading: isStaffLoading } = useStaff()
  const createStaffMutation = useCreateStaff()
  const updateStaffMutation = useUpdateStaff()
  const deleteStaffMutation = useDeleteStaff()

  // Tab State
  const [activeTab, setActiveTab] = React.useState<"profile" | "services" | "staff">("profile")

  // Form States - Tenant Profile
  const [title, setTitle] = React.useState("")
  const [legalName, setLegalName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [city, setCity] = React.useState("")
  const [district, setDistrict] = React.useState("")
  const [taxOffice, setTaxOffice] = React.useState("")
  const [taxNumber, setTaxNumber] = React.useState("")
  const [autoInvoice, setAutoInvoice] = React.useState(false)
  const [saveSuccess, setSaveSuccess] = React.useState(false)

  // Service Modals State
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = React.useState(false)
  const [newServiceName, setNewServiceName] = React.useState("")
  const [newServiceCategory, setNewServiceCategory] = React.useState("PERIYODIK_BAKIM")
  const [newServicePrice, setNewServicePrice] = React.useState(1500)
  const [newServiceDuration, setNewServiceDuration] = React.useState(60)

  const [editingService, setEditingService] = React.useState<any | null>(null)
  const [editServiceName, setEditServiceName] = React.useState("")
  const [editServiceCategory, setEditServiceCategory] = React.useState("PERIYODIK_BAKIM")
  const [editServicePrice, setEditServicePrice] = React.useState(0)
  const [editServiceDuration, setEditServiceDuration] = React.useState(60)
  const [editServiceActive, setEditServiceActive] = React.useState(true)

  const [deletingService, setDeletingService] = React.useState<any | null>(null)
  const [deletedServiceIds, setDeletedServiceIds] = React.useState<string[]>([])
  const [serviceView, setServiceView] = React.useState<"active" | "all">("active")

  // Staff Modals State
  const [isNewStaffModalOpen, setIsNewStaffModalOpen] = React.useState(false)
  const [newStaffName, setNewStaffName] = React.useState("")
  const [newStaffSurname, setNewStaffSurname] = React.useState("")
  const [newStaffPhone, setNewStaffPhone] = React.useState("")
  const [newStaffEmail, setNewStaffEmail] = React.useState("")
  const [newStaffRole, setNewStaffRole] = React.useState("TECHNICIAN")
  const [newStaffLift, setNewStaffLift] = React.useState("Lift 1")
  const [newStaffSpecialty, setNewStaffSpecialty] = React.useState("Genel Mekanik")

  const [editingStaff, setEditingStaff] = React.useState<any | null>(null)
  const [editStaffName, setEditStaffName] = React.useState("")
  const [editStaffSurname, setEditStaffSurname] = React.useState("")
  const [editStaffPhone, setEditStaffPhone] = React.useState("")
  const [editStaffEmail, setEditStaffEmail] = React.useState("")
  const [editStaffRole, setEditStaffRole] = React.useState("TECHNICIAN")
  const [editStaffLift, setEditStaffLift] = React.useState("Lift 1")
  const [editStaffSpecialty, setEditStaffSpecialty] = React.useState("")
  const [editStaffActive, setEditStaffActive] = React.useState(true)

  const [deletingStaff, setDeletingStaff] = React.useState<any | null>(null)
  const [deletedStaffIds, setDeletedStaffIds] = React.useState<string[]>([])
  const [staffView, setStaffView] = React.useState<"active" | "all">("active")

  // Hydrate tenant state from backend
  React.useEffect(() => {
    if (tenantData) {
      setTitle(tenantData.title || "")
      setLegalName(tenantData.legalName || "")
      setPhone(tenantData.phone || "")
      setEmail(tenantData.email || "")
      setAddress(tenantData.address || "")
      setCity(tenantData.city || "")
      setDistrict(tenantData.district || "")
      setTaxOffice(tenantData.taxOffice || "")
      setTaxNumber(tenantData.taxNumber || "")
      setAutoInvoice(tenantData.autoInvoiceOnComplete ?? true)
    }
  }, [tenantData])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateTenantMutation.mutateAsync({
        title,
        legalName,
        phone,
        email,
        address,
        city,
        district,
        taxOffice,
        taxNumber,
        autoInvoiceOnComplete: autoInvoice,
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3500)
    } catch (err) {
      console.error("Profil güncelleme hatası:", err)
    }
  }

  // Service Handlers
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newServiceName) return
    try {
      await createServiceMutation.mutateAsync({
        name: newServiceName,
        category: newServiceCategory,
        basePrice: Number(newServicePrice),
        estimatedMinutes: Number(newServiceDuration),
        isActive: true,
      })
      setIsNewServiceModalOpen(false)
      setNewServiceName("")
    } catch (err) {
      console.error("Hizmet ekleme hatası:", err)
    }
  }

  const handleOpenEditService = (srv: any) => {
    setEditingService(srv)
    setEditServiceName(srv.name || "")
    setEditServiceCategory(srv.category || "PERIYODIK_BAKIM")
    setEditServicePrice(Number(srv.basePrice || 0))
    setEditServiceDuration(Number(srv.defaultDurationMin || srv.estimatedMinutes || 60))
    setEditServiceActive(srv.isActive !== false)
  }

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingService || !editServiceName) return
    try {
      await updateServiceMutation.mutateAsync({
        id: editingService.id,
        data: {
          name: editServiceName,
          category: editServiceCategory,
          basePrice: Number(editServicePrice),
          defaultDurationMin: Number(editServiceDuration),
          isActive: editServiceActive,
        },
      })
      setEditingService(null)
    } catch (err) {
      console.error("Hizmet güncelleme hatası:", err)
    }
  }

  const handleDeleteService = async () => {
    if (!deletingService) return
    const id = deletingService.id
    setDeletedServiceIds((prev) => [...prev, id])
    setDeletingService(null)
    try {
      await deleteServiceMutation.mutateAsync(id)
    } catch (err) {
      console.error("Hizmet silme hatası:", err)
      setDeletedServiceIds((prev) => prev.filter((item) => item !== id))
    }
  }

  const handleReactivateService = async (srv: any) => {
    setDeletedServiceIds((prev) => prev.filter((id) => id !== srv.id))
    try {
      await updateServiceMutation.mutateAsync({
        id: srv.id,
        data: { isActive: true },
      })
    } catch (err) {
      console.error("Hizmet aktifleştirme hatası:", err)
    }
  }

  // Staff Handlers
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStaffName || !newStaffPhone) return
    try {
      await createStaffMutation.mutateAsync({
        name: newStaffName,
        surname: newStaffSurname,
        phone: newStaffPhone,
        email: newStaffEmail || undefined,
        role: newStaffRole,
        assignedLift: newStaffRole === "TECHNICIAN" ? newStaffLift : undefined,
        specialty: newStaffSpecialty || (newStaffRole === "TECHNICIAN" ? "Genel Mekanik" : "Ofis / Yönetim"),
      })
      setIsNewStaffModalOpen(false)
      setNewStaffName("")
      setNewStaffSurname("")
      setNewStaffPhone("")
      setNewStaffEmail("")
      setNewStaffLift("Lift 1")
      setNewStaffSpecialty("Genel Mekanik")
    } catch (err) {
      console.error("Personel ekleme hatası:", err)
    }
  }

  const handleOpenEditStaff = (st: any) => {
    const u = st.user || st
    const mechanic = st.mechanic || u.mechanic
    setEditingStaff(st)
    setEditStaffName(u.name || "")
    setEditStaffSurname(u.surname || "")
    setEditStaffPhone(u.phone || "")
    setEditStaffEmail(u.email || "")
    setEditStaffRole(u.role || "TECHNICIAN")
    setEditStaffLift(mechanic?.assignedLift || st.assignedLift || "Lift 1")
    setEditStaffSpecialty(mechanic?.specialty || st.specialty || "Genel Mekanik")
    setEditStaffActive(u.isActive !== false)
  }

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStaff || !editStaffName) return
    const u = editingStaff.user || editingStaff
    try {
      await updateStaffMutation.mutateAsync({
        id: u.id,
        data: {
          name: editStaffName,
          surname: editStaffSurname,
          phone: editStaffPhone,
          email: editStaffEmail || undefined,
          role: editStaffRole,
          assignedLift: editStaffRole === "TECHNICIAN" ? editStaffLift : null,
          specialty: editStaffSpecialty,
          isActive: editStaffActive,
        },
      })
      toast.success("Personel bilgileri başarıyla güncellendi")
      setEditingStaff(null)
    } catch (err: any) {
      console.error("Personel güncelleme hatası:", err)
      toast.error(err.message || "Personel güncellenirken bir hata oluştu")
    }
  }

  const handleDeleteStaff = async () => {
    if (!deletingStaff) return
    const u = deletingStaff.user || deletingStaff
    const id = u.id
    setDeletedStaffIds((prev) => [...prev, id])
    setDeletingStaff(null)
    try {
      await deleteStaffMutation.mutateAsync(id)
    } catch (err) {
      console.error("Personel silme hatası:", err)
      setDeletedStaffIds((prev) => prev.filter((item) => item !== id))
    }
  }

  const handleReactivateStaff = async (st: any) => {
    const u = st.user || st
    setDeletedStaffIds((prev) => prev.filter((id) => id !== u.id))
    try {
      await updateStaffMutation.mutateAsync({
        id: u.id,
        data: { isActive: true },
      })
    } catch (err) {
      console.error("Personel aktifleştirme hatası:", err)
    }
  }

  // Filtered lists
  const activeServices = React.useMemo(() => {
    return (servicesData || []).filter(
      (srv: any) => srv.isActive !== false && !deletedServiceIds.includes(srv.id)
    )
  }, [servicesData, deletedServiceIds])

  const displayedServices = React.useMemo(() => {
    if (serviceView === "active") return activeServices
    return (servicesData || []).filter((s: any) => !deletedServiceIds.includes(s.id))
  }, [servicesData, activeServices, serviceView, deletedServiceIds])

  const activeStaff = React.useMemo(() => {
    return (staffData || []).filter((st: any) => {
      const u = st.user || st
      return u.isActive !== false && !deletedStaffIds.includes(u.id)
    })
  }, [staffData, deletedStaffIds])

  const displayedStaff = React.useMemo(() => {
    if (staffView === "active") return activeStaff
    return (staffData || []).filter((st: any) => {
      const u = st.user || st
      return !deletedStaffIds.includes(u.id)
    })
  }, [staffData, activeStaff, staffView, deletedStaffIds])

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
      </div>

      {/* TAB 1: FIRMA & SERVIS PROFILI */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <Card>
            <CardHeader className="p-6">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 size={18} className="text-sky-500" />
                <span>Genel İşletme Bilgileri</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Müşteri tekliflerinde, fatura başlıklarında ve SMS bildirimlerinde yer alan resmi servis verileri
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Servis Tabelası / İşletme Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-sky-500"
                    placeholder="Örn: Bayar Oto Servis & Ekspertiz"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Resmi Şirket Ticari Ünvanı
                  </label>
                  <input
                    type="text"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-sky-500"
                    placeholder="Örn: Bayar Otomotiv San. ve Tic. Ltd. Şti."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Sabit / İletişim Telefonu
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-sky-500"
                    placeholder="Örn: 0212 555 01 23"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    İşletme E-Posta Adresi
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-sky-500"
                    placeholder="info@bayaroto.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Açık Servis Adresi
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-sky-500"
                  placeholder="Maslak Oto Sanayi Sitesi 2. Kısım 34. Sokak No: 12 Sarıyer / İstanbul"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Şehir / İl
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-sky-500"
                    placeholder="İstanbul"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    İlçe / Semt
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-sky-500"
                    placeholder="Sarıyer"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-6">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 size={18} className="text-sky-500" />
                <span>Maliye, Vergi & Otomasyon Ayarları</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Fatura şablonlarında görünecek vergi dairesi ve otomatik faturalandırma kuralları
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Vergi Dairesi
                  </label>
                  <input
                    type="text"
                    value={taxOffice}
                    onChange={(e) => setTaxOffice(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-sky-500"
                    placeholder="İkitelli Vergi Dairesi"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Vergi Numarası / VKN
                  </label>
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-sky-500"
                    placeholder="1234567890"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    İş Emri Tamamlandığında Otomatik Fatura Oluştur
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Araç teslim edildiğinde iş emri içerisindeki kalemlerden otomatik Açık Fatura kesilir.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoInvoice}
                  onChange={(e) => setAutoInvoice(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={updateTenantMutation.isPending}
                  className="gap-2 cursor-pointer shadow-sky-500/25"
                >
                  <Save size={15} />
                  <span>{updateTenantMutation.isPending ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}

      {/* TAB 2: HIZMET & ISCILIK KATALOGU */}
      {activeTab === "services" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Kayıtlı Standart Hizmetler & İşçilikler
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                İş emirlerinde ve randevu formlarında seçilebilecek hazır işçilik tanımları
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs">
                <button
                  type="button"
                  onClick={() => setServiceView("active")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    serviceView === "active"
                      ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Aktif ({activeServices.length})
                </button>
                <button
                  type="button"
                  onClick={() => setServiceView("all")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    serviceView === "all"
                      ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Tümü ({(servicesData || []).length - deletedServiceIds.length})
                </button>
              </div>
              <Button
                size="sm"
                onClick={() => setIsNewServiceModalOpen(true)}
                className="gap-1.5 cursor-pointer shadow-sky-500/25"
              >
                <Plus size={15} />
                <span>Yeni Hizmet Ekle</span>
              </Button>
            </div>
          </div>

          {displayedServices.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <Wrench size={32} className="mx-auto text-slate-400 opacity-50" />
              <p className="text-xs font-semibold text-slate-500">
                {serviceView === "active"
                  ? "Kayıtlı aktif hizmet bulunamadı. Yeni bir hizmet tanımlayabilirsiniz."
                  : "Gösterilebilecek hizmet kaydı bulunamadı."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedServices.map((srv: any) => {
                const isActive = srv.isActive !== false && !deletedServiceIds.includes(srv.id)
                return (
                  <Card key={srv.id} className="hover:border-sky-500/30 transition-all group">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {srv.name}
                          </h3>
                          <div className="mt-1 flex items-center">
                            {(() => {
                              const cat = formatServiceCategory(srv.category)
                              return (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${cat.badgeClass}`}>
                                  {cat.icon && <span>{cat.icon}</span>}
                                  <span>{cat.label}</span>
                                </span>
                              )
                            })()}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            isActive
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                          }`}
                        >
                          {isActive ? "Aktif" : "Pasif"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <Clock size={12} />
                          <span>{srv.defaultDurationMin || srv.estimatedMinutes || 60} Dk</span>
                        </div>
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {Number(srv.basePrice || 0).toLocaleString("tr-TR")} ₺
                        </div>
                      </div>

                      {/* Actions: Edit & Delete / Reactivate */}
                      <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditService(srv)}
                          className="h-7 px-2 text-[11px] text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 gap-1 cursor-pointer"
                        >
                          <Pencil size={12} />
                          <span>Düzenle</span>
                        </Button>
                        {isActive ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingService(srv)}
                            className="h-7 px-2 text-[11px] text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 gap-1 cursor-pointer"
                          >
                            <Trash2 size={12} />
                            <span>Kaldır</span>
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReactivateService(srv)}
                            className="h-7 px-2 text-[11px] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1 cursor-pointer"
                          >
                            <Check size={12} />
                            <span>Aktifleştir</span>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PERSONEL & ATOLYE USTALARI */}
      {activeTab === "staff" && (
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
                  Tümü ({(staffData || []).length - deletedStaffIds.length})
                </button>
              </div>
              <Button
                size="sm"
                onClick={() => setIsNewStaffModalOpen(true)}
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
              {displayedStaff.map((st: any) => {
                const u = st.user || st
                const fullName = u.name ? `${u.name} ${u.surname || ""}`.trim() : "Personel"
                const initial = (u.name?.charAt(0) || "U").toUpperCase()
                const phone = u.phone || "-"
                const role = u.role || "TECHNICIAN"
                const mechanic = st.mechanic || u.mechanic
                const lift = mechanic?.assignedLift || st.assignedLift || "Lift-1"
                const specialty = mechanic?.specialty || st.specialty || "Genel Mekanik"
                const isActive = u.isActive !== false && !deletedStaffIds.includes(u.id)

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

                const isCurrentUser = user?.id === u.id || user?.phone === u.phone

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
                          onClick={() => handleOpenEditStaff(st)}
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
                              onClick={() => handleReactivateStaff(st)}
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
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALS */}
      {/* ======================================================== */}

      {/* Modal 1: Yeni Hizmet Ekle */}
      {mounted && isNewServiceModalOpen && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setIsNewServiceModalOpen(false) }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Yeni Standart Hizmet Tanımla
              </h3>
              <button
                type="button"
                onClick={() => setIsNewServiceModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateService} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Hizmet / İşçilik Adı *</label>
                <input
                  type="text"
                  required
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  placeholder="Örn: Triger Seti Değişimi"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Hizmet Kategorisi *
                </label>
                <select
                  value={newServiceCategory}
                  onChange={(e) => setNewServiceCategory(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
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
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(Number(e.target.value))}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Tahmini Süre (Dk)</label>
                  <input
                    type="number"
                    min={5}
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNewServiceModalOpen(false)}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createServiceMutation.isPending}
                  className="shadow-sky-500/25"
                >
                  {createServiceMutation.isPending ? "Kaydediliyor..." : "Hizmeti Kaydet"}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 2: Hizmeti Düzenle */}
      {mounted && editingService && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setEditingService(null) }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Hizmeti Düzenle
              </h3>
              <button
                type="button"
                onClick={() => setEditingService(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleUpdateService} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Hizmet / İşçilik Adı *</label>
                <input
                  type="text"
                  required
                  value={editServiceName}
                  onChange={(e) => setEditServiceName(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Hizmet Kategorisi *
                </label>
                <select
                  value={editServiceCategory}
                  onChange={(e) => setEditServiceCategory(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  {editServiceCategory && !SERVICE_CATEGORIES.some((c) => c.id === editServiceCategory || c.label === editServiceCategory) && (
                    <option value={editServiceCategory}>
                      {editServiceCategory} (Mevcut Kategori)
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
                    value={editServicePrice}
                    onChange={(e) => setEditServicePrice(Number(e.target.value))}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Tahmini Süre (Dk)</label>
                  <input
                    type="number"
                    min={5}
                    value={editServiceDuration}
                    onChange={(e) => setEditServiceDuration(Number(e.target.value))}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-medium">Katalogda Aktif Olarak Göster</span>
                <input
                  type="checkbox"
                  checked={editServiceActive}
                  onChange={(e) => setEditServiceActive(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingService(null)}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateServiceMutation.isPending}
                  className="shadow-sky-500/25"
                >
                  {updateServiceMutation.isPending ? "Kaydediliyor..." : "Güncellemeleri Kaydet"}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 3: Hizmeti Silme Onayı */}
      {mounted && deletingService && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setDeletingService(null) }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 text-center my-auto">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
              <Trash2 size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Hizmeti Kaldır
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <strong>{deletingService.name}</strong> hizmetini servis kataloğundan kaldırmak istediğinize emin misiniz?
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingService(null)}
              >
                Vazgeç
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={deleteServiceMutation.isPending}
                onClick={handleDeleteService}
                className="bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/25"
              >
                {deleteServiceMutation.isPending ? "Kaldırılıyor..." : "Evet, Kaldır"}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 4: Yeni Personel Ekle */}
      {mounted && isNewStaffModalOpen && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setIsNewStaffModalOpen(false) }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Yeni Personel & Usta Kaydı
              </h3>
              <button
                type="button"
                onClick={() => setIsNewStaffModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Ad *</label>
                  <input
                    type="text"
                    required
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    placeholder="Ahmet"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Soyad</label>
                  <input
                    type="text"
                    value={newStaffSurname}
                    onChange={(e) => setNewStaffSurname(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    placeholder="Yılmaz"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Cep Telefonu *</label>
                  <input
                    type="text"
                    required
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    placeholder="05551234567"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">E-Posta (İsteğe bağlı)</label>
                  <input
                    type="email"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    placeholder="usta@servis.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Sistem Rolü</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  >
                    <option value="TECHNICIAN">Atölye Teknisyeni / Usta</option>
                    <option value="SERVICE_MANAGER">Servis Müdürü</option>
                    <option value="CASHIER">Kasa / Ön Muhasebe</option>
                    <option value="OWNER">Yönetici / Ortak</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Varsayılan Lift
                  </label>
                  {newStaffRole === "TECHNICIAN" ? (
                    <select
                      value={newStaffLift}
                      onChange={(e) => setNewStaffLift(e.target.value)}
                      className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                    >
                      {DEFAULT_LIFTS.map((lift) => (
                        <option key={lift.id} value={lift.id}>
                          {lift.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full h-9 px-3 flex items-center text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 text-slate-400 italic select-none">
                      Gerekmez (Ofis/Yönetim)
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Uzmanlık Alanı</label>
                <input
                  type="text"
                  value={newStaffSpecialty}
                  onChange={(e) => setNewStaffSpecialty(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  placeholder="Motor Mekanik, Fren, Elektrik-Elektronik vb."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNewStaffModalOpen(false)}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createStaffMutation.isPending}
                  className="shadow-sky-500/25"
                >
                  {createStaffMutation.isPending ? "Kaydediliyor..." : "Personeli Kaydet"}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 5: Personeli Düzenle */}
      {mounted && editingStaff && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setEditingStaff(null) }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Personel Bilgilerini Düzenle
              </h3>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleUpdateStaff} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Ad *</label>
                  <input
                    type="text"
                    required
                    value={editStaffName}
                    onChange={(e) => setEditStaffName(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Soyad</label>
                  <input
                    type="text"
                    value={editStaffSurname}
                    onChange={(e) => setEditStaffSurname(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Cep Telefonu *</label>
                  <input
                    type="text"
                    required
                    value={editStaffPhone}
                    onChange={(e) => setEditStaffPhone(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">E-Posta</label>
                  <input
                    type="email"
                    value={editStaffEmail}
                    onChange={(e) => setEditStaffEmail(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Sistem Rolü</label>
                  <select
                    value={editStaffRole}
                    onChange={(e) => setEditStaffRole(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  >
                    <option value="TECHNICIAN">Atölye Teknisyeni / Usta</option>
                    <option value="SERVICE_MANAGER">Servis Müdürü</option>
                    <option value="CASHIER">Kasa / Ön Muhasebe</option>
                    <option value="OWNER">Yönetici / Ortak</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Varsayılan Lift
                  </label>
                  {editStaffRole === "TECHNICIAN" ? (
                    <select
                      value={editStaffLift}
                      onChange={(e) => setEditStaffLift(e.target.value)}
                      className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                    >
                      {editStaffLift && !DEFAULT_LIFTS.some((l) => l.id === editStaffLift || l.label.startsWith(editStaffLift)) && (
                        <option value={editStaffLift}>
                          {editStaffLift} (Mevcut)
                        </option>
                      )}
                      {DEFAULT_LIFTS.map((lift) => (
                        <option key={lift.id} value={lift.id}>
                          {lift.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full h-9 px-3 flex items-center text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 text-slate-400 italic select-none">
                      Gerekmez (Ofis/Yönetim)
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Uzmanlık Alanı</label>
                <input
                  type="text"
                  value={editStaffSpecialty}
                  onChange={(e) => setEditStaffSpecialty(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  placeholder="Motor Mekanik, Şanzıman, Fren vb."
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-medium">Aktif Çalışan Durumu</span>
                <input
                  type="checkbox"
                  checked={editStaffActive}
                  onChange={(e) => setEditStaffActive(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingStaff(null)}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateStaffMutation.isPending}
                  className="shadow-sky-500/25"
                >
                  {updateStaffMutation.isPending ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 6: Personeli Silme Onayı */}
      {mounted && deletingStaff && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setDeletingStaff(null) }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 text-center my-auto">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Personeli Sil / Pasife Al
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <strong>
                  {(deletingStaff.user || deletingStaff).name} {(deletingStaff.user || deletingStaff).surname || ""}
                </strong>{" "}
                adlı personeli kadrodan çıkarmak istediğinize emin misiniz?
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingStaff(null)}
              >
                Vazgeç
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={deleteStaffMutation.isPending}
                onClick={handleDeleteStaff}
                className="bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/25"
              >
                {deleteStaffMutation.isPending ? "Siliniyor..." : "Evet, Çıkar"}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
