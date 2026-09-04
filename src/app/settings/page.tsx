"use client"

import * as React from "react"
import {
  Building2,
  Wrench,
  Users,
  Shield,
  Save,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Coins,
  MapPin,
  Phone,
  Mail,
  FileText,
  UserCheck,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/features/auth/auth-context"
import {
  useTenantSettings,
  useUpdateTenantSettings,
  useServices,
  useCreateService,
  useStaff,
  useCreateStaff,
} from "@/features/settings/api/use-settings"

export default function SettingsPage() {
  const { user } = useAuth()
  const userRole = (user?.role || "").toUpperCase()
  const isOwner = userRole === "OWNER" || userRole === "SERVICE_MANAGER" || userRole === "TENANT_ADMIN"

  // Data Hooks
  const { data: tenantData, isLoading: isTenantLoading } = useTenantSettings()
  const updateTenantMutation = useUpdateTenantSettings()

  const { data: servicesData, isLoading: isServicesLoading } = useServices()
  const createServiceMutation = useCreateService()

  const { data: staffData, isLoading: isStaffLoading } = useStaff()
  const createStaffMutation = useCreateStaff()

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

  // Modals
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = React.useState(false)
  const [newServiceName, setNewServiceName] = React.useState("")
  const [newServiceCategory, setNewServiceCategory] = React.useState("Genel Bakım")
  const [newServicePrice, setNewServicePrice] = React.useState(1500)
  const [newServiceDuration, setNewServiceDuration] = React.useState(60)

  const [isNewStaffModalOpen, setIsNewStaffModalOpen] = React.useState(false)
  const [newStaffName, setNewStaffName] = React.useState("")
  const [newStaffSurname, setNewStaffSurname] = React.useState("")
  const [newStaffPhone, setNewStaffPhone] = React.useState("")
  const [newStaffRole, setNewStaffRole] = React.useState("TECHNICIAN")
  const [newStaffLift, setNewStaffLift] = React.useState("Lift-1")

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

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStaffName || !newStaffPhone) return
    try {
      await createStaffMutation.mutateAsync({
        name: newStaffName,
        surname: newStaffSurname,
        phone: newStaffPhone,
        role: newStaffRole,
        assignedLift: newStaffLift,
      })
      setIsNewStaffModalOpen(false)
      setNewStaffName("")
      setNewStaffSurname("")
      setNewStaffPhone("")
    } catch (err) {
      console.error("Personel ekleme hatası:", err)
    }
  }

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
                    placeholder="Örn: info@bayaroto.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Açık Servis & Atölye Adresi
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-sky-500 resize-none"
                  placeholder="Sanayi Sitesi, Ada, Parsel ve Kapı No..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Şehir</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-sky-500"
                    placeholder="İstanbul"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">İlçe</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-sky-500"
                    placeholder="Başakşehir"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tax & Financial Defaults */}
          <Card>
            <CardHeader className="p-6">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText size={18} className="text-emerald-500" />
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Kayıtlı Standart Hizmetler & İşçilikler
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                İş emirlerinde ve randevu formlarında seçilebilecek hazır işçilik tanımları
              </p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(servicesData || []).map((srv: any) => (
              <Card key={srv.id} className="hover:border-sky-500/30 transition-all">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {srv.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Kategori: {srv.category || "Genel Bakım"}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      Aktif
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <Clock size={12} />
                      <span>{srv.estimatedMinutes || 60} Dk</span>
                    </div>
                    <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {Number(srv.basePrice || 0).toLocaleString("tr-TR")} ₺
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PERSONEL & ATOLYE USTALARI */}
      {activeTab === "staff" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Atölye Ustaları & Servis Personeli
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                İş emirlerine atanan teknisyenler ve yetkilendirmeleri
              </p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(staffData || []).map((st: any) => (
              <Card key={st.id} className="hover:border-amber-500/30 transition-all">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/20">
                        {st.user?.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {st.user ? `${st.user.name} ${st.user.surname || ""}` : "Personel"}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {st.user?.phone || "-"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-sky-500/10 text-sky-600 border-sky-500/20">
                      {st.user?.role === "OWNER" ? "Yönetici" : "Usta"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Atanmış Lift: <strong className="text-slate-800 dark:text-slate-200">{st.assignedLift || "Lift-1"}</strong>
                    </span>
                    <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      ● Aktif Görevde
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Yeni Hizmet Ekle */}
      {isNewServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Yeni Standart Hizmet Tanımla
            </h3>
            <form onSubmit={handleCreateService} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Hizmet Adı *</label>
                <input
                  type="text"
                  required
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  placeholder="Örn: Triger Seti Değişimi"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Taban İşçilik (₺)</label>
                  <input
                    type="number"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(Number(e.target.value))}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Tahmini Süre (Dk)</label>
                  <input
                    type="number"
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
                <Button type="submit" size="sm" className="shadow-sky-500/25">
                  Hizmeti Kaydet
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Yeni Personel Ekle */}
      {isNewStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Yeni Personel & Usta Kaydı
            </h3>
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
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Varsayılan Lift</label>
                  <input
                    type="text"
                    value={newStaffLift}
                    onChange={(e) => setNewStaffLift(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    placeholder="Lift-1"
                  />
                </div>
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
                <Button type="submit" size="sm" className="shadow-sky-500/25">
                  Personeli Kaydet
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
