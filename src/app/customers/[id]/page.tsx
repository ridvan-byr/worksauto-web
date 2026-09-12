"use client"

import { useCustomer, useCustomerStats, useDeleteCustomer } from "@/features/customers/api/use-customers"
import { useDeleteVehicle, type VehicleRecord } from "@/features/vehicles/api/use-vehicles"

import * as React from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Car,
  Plus,
  Calendar,
  Wrench,
  Receipt,
  CreditCard,
  Trash2,
  AlertTriangle,
  Edit3,
  Eye,
  Printer,
  CheckCircle2,
  ShieldAlert,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Customer, Vehicle } from "@/features/customers/types"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { AddVehicleModal } from "@/features/customers/components/add-vehicle-modal"
import { EditCustomerModal } from "@/features/customers/components/edit-customer-modal"
import { EditVehicleModal } from "@/features/vehicles/components/edit-vehicle-modal"
import { KvkkConsentBadge } from "@/features/customers/components/kvkk-consent-badge"
import { InvoiceDetailModal } from "@/features/billing/components/invoice-detail-modal"
import { CariHistoryModal } from "@/features/billing/components/cari-history-modal"
import { Invoice } from "@/features/billing/types"
import { formatFuelType, formatTransmission } from "@/features/vehicles/utils/vehicle-formatters"
import { cn } from "@/lib/utils"

export const formatDateDisplay = (val?: string | null) => {
  if (!val || val === "-" || val === "null" || val === "undefined") return "-"
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return val
    return d.toLocaleDateString("tr-TR")
  } catch {
    return val
  }
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string

  const [mounted, setMounted] = React.useState(false)
  const [customer, setCustomer] = React.useState<Customer | null>(null)
  const [activeTab, setActiveTab] = React.useState<"appointments" | "workOrders" | "invoices" | "movements">("workOrders")
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = React.useState(false)
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = React.useState(false)
  const [isDeleteCustomerModalOpen, setIsDeleteCustomerModalOpen] = React.useState(false)
  const [vehicleToDelete, setVehicleToDelete] = React.useState<Vehicle | null>(null)
  const [vehicleToEdit, setVehicleToEdit] = React.useState<Vehicle | null>(null)
  const [selectedInvoice, setSelectedInvoice] = React.useState<Invoice | null>(null)
  const [isCariModalOpen, setIsCariModalOpen] = React.useState(false)

  const { data: apiCustomer } = useCustomer(customerId)
  const { data: stats } = useCustomerStats(customerId)
  const deleteVehicleMutation = useDeleteVehicle()
  const deleteCustomerMutation = useDeleteCustomer()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Load customer data with live API sync and mock fallback
  React.useEffect(() => {
    if (apiCustomer) {
      setCustomer({
        id: apiCustomer.id,
        tenantId: apiCustomer.tenantId || 'ten_1',
        type: apiCustomer.type === 'CORPORATE' ? 'corporate' : 'individual',
        name: apiCustomer.firstName || apiCustomer.name || '',
        surname: apiCustomer.lastName || apiCustomer.surname || '',
        companyTitle: apiCustomer.companyTitle,
        phone: apiCustomer.phone,
        email: apiCustomer.email,
        taxNumber: apiCustomer.taxNumber,
        taxOffice: apiCustomer.taxOffice,
        balance: apiCustomer.currentAccount ? Number(apiCustomer.currentAccount.balance) : 0,
        vehicles: (apiCustomer.vehicles || []).map((v) => ({
          id: v.id,
          tenantId: v.tenantId || 'ten_1',
          customerId: apiCustomer.id,
          plate: v.plate,
          brand: v.brand,
          model: v.model,
          year: v.year,
          kilometer: v.kilometer ?? 0,
          fuelType: formatFuelType(v.fuelType),
          transmission: formatTransmission(v.transmission),
        })),
        appointments: (apiCustomer.appointments || []).map((app) => ({
          id: app.id,
          date: app.date || '-',
          time: app.time || '10:00',
          serviceName: app.serviceName || 'Genel Bakım',
          plate: app.plate || '34XX000',
          status: app.status || 'CONFIRMED',
          technicianName: app.technicianName || 'Atölye Ustası',
        })),
        workOrders: (apiCustomer.workOrders || []).map((w) => ({
          id: w.id,
          orderNumber: w.orderNumber || 'İEM-000',
          date: w.date || '-',
          status: w.status || 'OPEN',
          totalAmount: Number(w.totalAmount ?? 0),
          kilometers: Number(w.kilometers ?? 0),
          plate: w.plate || '34XX000',
          itemsSummary: w.itemsSummary || 'Periyodik Bakım & Kontrol',
          technician: w.technician || 'Atölye Ustası',
        })),
        invoices: (apiCustomer.invoices || []).map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber || 'FTR-000',
          date: inv.date || '-',
          dueDate: inv.dueDate || '-',
          plate: inv.plate || '34XX000',
          totalAmount: Number(inv.totalAmount ?? 0),
          paidAmount: Number(inv.paidAmount ?? 0),
          status: inv.status || 'PAID',
        })),
        movements: (apiCustomer.movements || []).map((m) => ({
          id: m.id,
          date: m.date || '-',
          type: m.type || 'DEBIT',
          amount: Number(m.amount || 0),
          balanceAfter: Number(m.balanceAfter || 0),
          description: m.description || '-',
          documentNo: m.documentNo || '',
        })),
        createdAt: apiCustomer.createdAt,
        updatedAt: apiCustomer.updatedAt || apiCustomer.createdAt,
      })
    }
  }, [customerId, apiCustomer])

  const handleVehicleAdded = (newVehicle: Vehicle) => {
    if (!customer) return
    const updatedCustomer: Customer = {
      ...customer,
      vehicles: [...customer.vehicles, newVehicle],
      updatedAt: new Date().toISOString(),
    }
    setCustomer(updatedCustomer)
  }

  const handleVehicleUpdated = (updatedVehicle: VehicleRecord | Vehicle) => {
    if (!customer) return
    const nextVehicles = customer.vehicles.map((v) =>
      v.id === updatedVehicle.id ? { ...v, ...updatedVehicle } : v
    )
    setCustomer({
      ...customer,
      vehicles: nextVehicles,
      updatedAt: new Date().toISOString(),
    })
    setVehicleToEdit(null)
  }

  const handleCustomerUpdated = (updatedData: Partial<Customer>) => {
    if (!customer) return
    setCustomer({
      ...customer,
      ...updatedData,
      updatedAt: new Date().toISOString(),
    })
  }

  if (!customer) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-slate-500">Müşteri kaydı yükleniyor veya bulunamadı...</p>
        <Button variant="outline" onClick={() => router.push("/customers")} className="text-xs cursor-pointer">
          Müşteri Listesine Dön
        </Button>
      </div>
    )
  }

  const displayName = customer.type === "corporate" && customer.companyTitle ? customer.companyTitle : `${customer.name} ${customer.surname}`

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Müşteri Listesine Dön</span>
        </Link>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[11px] font-bold px-3 py-1 rounded-full border",
              customer.type === "corporate"
                ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
            )}
          >
            {customer.type === "corporate" ? "Kurumsal Filo / Şirket" : "Bireysel Müşteri"}
          </span>

          <KvkkConsentBadge
            customerId={customer.id}
            customerName={displayName}
            customerPhone={customer.phone}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditCustomerModalOpen(true)}
            className="h-8 px-3 rounded-xl gap-1.5 text-xs font-semibold cursor-pointer border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Edit3 size={13} />
            <span>Bilgileri Düzenle</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteCustomerModalOpen(true)}
            className="h-8 px-3 rounded-xl gap-1.5 text-xs font-semibold cursor-pointer border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40"
          >
            <Trash2 size={13} />
            <span>Müşteriyi Sil</span>
          </Button>
        </div>
      </div>

      {/* Customer Header Profile Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0 shadow-xs",
              customer.type === "corporate"
                ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                : "bg-sky-500/15 text-sky-600 dark:text-sky-400"
            )}
          >
            {customer.type === "corporate" ? <Building2 size={26} /> : <User size={26} />}
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {displayName}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <a href={`tel:${customer.phone}`} className="flex items-center gap-1.5 hover:text-sky-500 transition-colors font-mono">
                <Phone size={13} className="text-slate-400" />
                <span>{customer.phone}</span>
              </a>
              {customer.email && (
                <a href={`mailto:${customer.email}`} className="flex items-center gap-1.5 hover:text-sky-500 transition-colors">
                  <Mail size={13} className="text-slate-400" />
                  <span>{customer.email}</span>
                </a>
              )}
              {customer.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-slate-400" />
                  <span>{customer.district ? `${customer.district} / ${customer.city}` : customer.city}</span>
                </span>
              )}
            </div>

            {customer.type === "corporate" && (
              <p className="text-[11px] text-slate-400 pt-0.5">
                Yetkili: <strong>{customer.name} {customer.surname}</strong> • V.D: {customer.taxOffice || "-"} (VKN: {customer.taxNumber || "-"})
              </p>
            )}
          </div>
        </div>

        {/* Balance Status Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between md:flex-col md:items-end gap-3 min-w-[200px]">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Güncel Cari Bakiye</span>
          <div className="text-right">
            {customer.balance > 0 ? (
              <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
                +{customer.balance.toLocaleString("tr-TR")} ₺
              </p>
            ) : (
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                0.00 ₺
              </p>
            )}
            <p className="text-[10px] text-slate-400 mt-0.5">
              {customer.balance > 0 ? "Açık Hesap Borcu Var" : "Borçsuz / Bakiye Sıfır"}
            </p>
          </div>
        </div>
      </div>

      {/* Customer Attendance & No-Show Scorecard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Toplam Randevu */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Toplam Randevu</span>
            <Calendar size={16} className="text-sky-500" />
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats?.totalAppointments ?? customer.appointments.length}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats?.completedAppointments ?? 0} Tamamlandı • {stats?.cancelledAppointments ?? 0} İptal
            </p>
          </div>
        </div>

        {/* Randevu Devam Oranı */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Randevu Sadakati</span>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                %{stats?.attendanceScore ?? 100}
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Devam Oranı</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, stats?.attendanceScore ?? 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* No-Show Sayısı ve Risk Rozeti */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">No-Show (Gelmeme)</span>
            <AlertTriangle
              size={16}
              className={cn(
                (stats?.noShowCount ?? 0) > 1 ? "text-rose-500" : (stats?.noShowCount ?? 0) === 1 ? "text-amber-500" : "text-slate-400"
              )}
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {stats?.noShowCount ?? 0}
              </span>
              <span
                className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                  (stats?.noShowCount ?? 0) === 0
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : (stats?.noShowCount ?? 0) <= 2
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                )}
              >
                {(stats?.noShowCount ?? 0) === 0 ? "Güvenilir" : (stats?.noShowCount ?? 0) <= 2 ? "Dikkat" : "Yüksek Risk"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Gelmeme Oranı: %{stats?.noShowRate ?? "0"}
            </p>
          </div>
        </div>

        {/* Kredi Limiti & Cari Güvenlik */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Kredi Limiti</span>
            <CreditCard size={16} className="text-indigo-500" />
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
              {stats?.creditLimit ? `${Number(stats.creditLimit).toLocaleString("tr-TR")} ₺` : "Limitsiz"}
            </span>
            <div className="mt-1">
              {stats?.limitExceeded ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                  <ShieldAlert size={12} /> Limit Aşıldı
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={12} /> Cari Limit Uygun
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Missing VKN Warning for Corporate Customers */}
      {(customer.type === "corporate" || String(customer.type) === "CORPORATE") && !customer.taxNumber && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-800 dark:text-amber-200">
          <div className="flex items-start sm:items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-sm font-semibold">Vergi Kimlik Numarası (VKN) Eksik</p>
              <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                Bu kurumsal müşteri için henüz VKN girilmemiştir. Servis ve iş emri oluşturabilirsiniz; fakat resmi E-Fatura kesebilmek için 10 haneli VKN tanımlanmalıdır.
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => setIsEditCustomerModalOpen(true)}
            className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl h-8 px-3 cursor-pointer shadow-xs"
          >
            VKN Tanımla
          </Button>
        </div>
      )}

      {/* Registered Vehicles Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="text-sky-500" size={18} />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Kayıtlı Araçlar ({customer.vehicles.length})
            </h2>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddVehicleModalOpen(true)}
            className="h-8 px-3 gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <Plus size={14} />
            <span>Yeni Araç Ekle</span>
          </Button>
        </div>

        {/* Vehicles Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {customer.vehicles.map((v) => (
            <div
              key={v.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <PlateBadge plate={v.plate} size="md" />
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-2">
                    {v.brand} {v.model}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {v.year} Model • {formatFuelType(v.fuelType)} • {formatTransmission(v.transmission)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {v.color && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {v.color}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setVehicleToEdit(v)}
                    className="p-1 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/20 transition-colors cursor-pointer"
                    title="Aracı Düzenle"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setVehicleToDelete(v)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                    title="Aracı Sil / Arşivle"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/70 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Son Kilometre</span>
                  <span className="font-bold font-mono text-slate-700 dark:text-slate-300">
                    {v.kilometer.toLocaleString("tr-TR")} KM
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Son Servis</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {v.lastServiceDate || "-"}
                  </span>
                </div>
              </div>

              {v.vin && (
                <div className="text-[10px] text-slate-400 font-mono bg-slate-50 dark:bg-slate-950 p-1.5 rounded-lg truncate">
                  VIN: {v.vin}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Customer 4-Tab Service History */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        {/* Tab Headers */}
        <div className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 p-2 flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("workOrders")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap",
              activeTab === "workOrders"
                ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
            )}
          >
            <Wrench size={14} />
            <span>İş Emirleri ({customer.workOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("appointments")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap",
              activeTab === "appointments"
                ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
            )}
          >
            <Calendar size={14} />
            <span>Randevular ({customer.appointments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("invoices")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap",
              activeTab === "invoices"
                ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
            )}
          >
            <Receipt size={14} />
            <span>Faturalar ({customer.invoices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("movements")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap",
              activeTab === "movements"
                ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
            )}
          >
            <CreditCard size={14} />
            <span>Cari Hareketler ({customer.movements.length})</span>
          </button>
        </div>

        {/* Tab 1: Work Orders */}
        {activeTab === "workOrders" && (
          <div className="p-4 sm:p-6 space-y-3">
            {customer.workOrders.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                Bu müşteriye ait henüz bir iş emri kaydı bulunmuyor.
              </div>
            ) : (
              customer.workOrders.map((wo) => (
                <div
                  key={wo.id}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
                        {wo.orderNumber}
                      </span>
                      <PlateBadge plate={wo.plate} size="sm" />
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {wo.status === "COMPLETED" ? "Tamamlandı" : wo.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                      {wo.itemsSummary}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Tarih: {wo.date} • KM: {(wo.kilometers ?? 0).toLocaleString("tr-TR")} • Teknisyen: <strong>{wo.technician}</strong>
                    </p>
                  </div>

                  <div className="text-right self-end sm:self-center">
                    <span className="text-xs text-slate-400 block">Toplam Tutar</span>
                    <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
                      {(wo.totalAmount ?? 0).toLocaleString("tr-TR")} ₺
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Appointments */}
        {activeTab === "appointments" && (
          <div className="p-4 sm:p-6 space-y-3">
            {customer.appointments.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                Bu müşteriye ait aktif veya geçmiş randevu kaydı bulunmuyor.
              </div>
            ) : (
              customer.appointments.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {app.serviceName}
                        </p>
                        <PlateBadge plate={app.plate} size="sm" />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {app.date} Saat {app.time} • Usta: {app.technicianName}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                    {app.status === "CONFIRMED" ? "Onaylandı" : app.status === "COMPLETED" ? "Gerçekleşti" : app.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Invoices */}
        {activeTab === "invoices" && (
          <div className="p-4 sm:p-6 space-y-3">
            {customer.invoices.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                Bu müşteriye ait fatura kaydı bulunmuyor.
              </div>
            ) : (
              customer.invoices.map((inv) => {
                const fullInvoice: Invoice = {
                  id: inv.id,
                  invoiceNumber: inv.invoiceNumber,
                  tenantId: customer.tenantId,
                  customerId: customer.id,
                  customerName: displayName,
                  customerPhone: customer.phone,
                  customerType: (customer.type === "corporate" || (customer.type as string) === "CORPORATE") ? "corporate" : "individual",
                  companyTitle: customer.companyTitle,
                  vehiclePlate: inv.plate,
                  vehicleBrand: customer.vehicles.find((v) => v.plate === inv.plate)?.brand || "Kayıtlı Araç",
                  vehicleModel: customer.vehicles.find((v) => v.plate === inv.plate)?.model || "",
                  vehicleYear: customer.vehicles.find((v) => v.plate === inv.plate)?.year || 2024,
                  vehicleKm: customer.vehicles.find((v) => v.plate === inv.plate)?.kilometer || 0,
                  items: [
                    {
                      id: "item_1",
                      type: "SERVICE",
                      name: "Periyodik Bakım ve Mekanik Servis Hizmet Bedeli",
                      quantity: 1,
                      unitPrice: inv.totalAmount ? Math.round(inv.totalAmount / 1.2) : 0,
                      totalPrice: inv.totalAmount ? Math.round(inv.totalAmount / 1.2) : 0,
                    },
                  ],
                  subtotal: inv.totalAmount ? Math.round(inv.totalAmount / 1.2) : 0,
                  taxAmount: inv.totalAmount ? inv.totalAmount - Math.round(inv.totalAmount / 1.2) : 0,
                  grandTotal: inv.totalAmount ?? 0,
                  paidAmount: inv.paidAmount ?? 0,
                  remainingAmount: (inv.totalAmount ?? 0) - (inv.paidAmount ?? 0),
                  status: inv.status === "PAID" ? "PAID" : inv.paidAmount > 0 ? "PARTIALLY_PAID" : "UNPAID",
                  payments: [],
                  issueDate: inv.date && inv.date !== "-" ? inv.date : new Date().toISOString().split("T")[0],
                  dueDate: inv.dueDate && inv.dueDate !== "-" ? inv.dueDate : new Date().toISOString().split("T")[0],
                  createdAt: inv.date && inv.date !== "-" ? inv.date : new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }

                return (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedInvoice(fullInvoice)}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 hover:border-sky-500/50 dark:hover:border-sky-500/50 hover:bg-sky-50/20 dark:hover:bg-sky-950/20 transition-all cursor-pointer flex items-center justify-between gap-4 group shadow-2xs hover:shadow-xs"
                    title="Fatura Detayını Görüntüle & Yazdır"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                          {inv.invoiceNumber}
                        </span>
                        <PlateBadge plate={inv.plate} size="sm" />
                        <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1">
                          <Eye size={12} />
                          Detay Görüntüle
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Fatura Tarihi: {formatDateDisplay(inv.date)} • Vade: {formatDateDisplay(inv.dueDate)}
                      </p>
                    </div>

                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                          {(inv.totalAmount ?? 0).toLocaleString("tr-TR")} ₺
                        </p>
                        {(inv.paidAmount ?? 0) < (inv.totalAmount ?? 0) && (
                          <p className="text-[10px] text-rose-500 font-medium">
                            Kalan: {((inv.totalAmount ?? 0) - (inv.paidAmount ?? 0)).toLocaleString("tr-TR")} ₺
                          </p>
                        )}
                      </div>

                      <span
                        className={cn(
                          "text-[10px] font-bold px-2.5 py-1 rounded-xl border",
                          inv.status === "PAID"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : inv.status === "PARTIAL"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                        )}
                      >
                        {inv.status === "PAID" ? "Ödendi" : inv.status === "PARTIAL" ? "Kısmi Ödeme" : "Ödenmedi"}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Tab 4: Cari Movements */}
        {activeTab === "movements" && (
          <div className="p-4 sm:p-6 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800/60">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Müşteriye ait tüm borç, alacak ve tahsilat hareket dökümü ({customer.movements.length} Kayıt).
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCariModalOpen(true)}
                className="h-8 px-3 rounded-xl gap-1.5 text-xs font-semibold border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 cursor-pointer shadow-2xs shrink-0"
              >
                <Printer size={13} />
                <span>Cari Ekstre Yazdır / İncele</span>
              </Button>
            </div>

            {customer.movements.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                Kayıtlı cari hesap hareketi bulunmuyor.
              </div>
            ) : (
              customer.movements.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setIsCariModalOpen(true)}
                  className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 hover:border-sky-500/40 dark:hover:border-sky-500/40 hover:bg-sky-50/20 dark:hover:bg-sky-950/20 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs group"
                  title="Cari Hesap Ekstresini Görüntüle"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      {m.description}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {formatDateDisplay(m.date)} {m.documentNo && `• Evrak: ${m.documentNo}`}
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={cn(
                        "font-bold font-mono text-sm",
                        m.type === "DEBIT" ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {m.type === "DEBIT" ? `+${m.amount.toLocaleString("tr-TR")} ₺` : `-${m.amount.toLocaleString("tr-TR")} ₺`}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Bakiye: {m.balanceAfter.toLocaleString("tr-TR")} ₺
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Edit Vehicle Modal */}
      <EditVehicleModal
        isOpen={!!vehicleToEdit}
        vehicle={vehicleToEdit}
        onClose={() => setVehicleToEdit(null)}
        onUpdated={handleVehicleUpdated}
      />

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        isOpen={isAddVehicleModalOpen}
        customerId={customer.id}
        customerName={displayName}
        onClose={() => setIsAddVehicleModalOpen(false)}
        onAdded={handleVehicleAdded}
      />

      {/* Delete Vehicle Confirmation Modal */}
      {mounted && vehicleToDelete && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Aracı Silmek İstiyor Musunuz?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  <strong className="text-slate-700 dark:text-slate-200">{vehicleToDelete.plate}</strong> plakalı {vehicleToDelete.brand} {vehicleToDelete.model} aracı bu müşteriden arşivlenecektir.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400">
              ℹ️ Geçmiş iş emirleri ve kesilmiş faturalar muhasebe mevzuatı gereği korunmaya devam eder.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setVehicleToDelete(null)}
                disabled={deleteVehicleMutation.isPending}
                className="h-10 px-4 text-xs font-semibold cursor-pointer"
              >
                Vazgeç
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  try {
                    await deleteVehicleMutation.mutateAsync(vehicleToDelete.id)
                    if (customer) {
                      setCustomer({
                        ...customer,
                        vehicles: customer.vehicles.filter((veh) => veh.id !== vehicleToDelete.id),
                      })
                    }
                    setVehicleToDelete(null)
                  } catch {}
                }}
                disabled={deleteVehicleMutation.isPending}
                className="h-10 px-4 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-md shadow-rose-600/20"
              >
                {deleteVehicleMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Evet, Aracı Sil</span>
                )}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Customer Modal */}
      {isEditCustomerModalOpen && customer && (
        <EditCustomerModal
          isOpen={isEditCustomerModalOpen}
          customer={customer}
          onClose={() => setIsEditCustomerModalOpen(false)}
          onUpdated={handleCustomerUpdated}
        />
      )}

      {/* Delete Customer Confirmation Modal */}
      {mounted && isDeleteCustomerModalOpen && customer && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Müşteriyi Silmek İstiyor Musunuz?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  <strong>{displayName}</strong> adlı müşteri kaydı silinecektir.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400 space-y-1">
              <p className="font-semibold">⚠️ Güvenlik ve Mevzuat Kuralları:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[10.5px]">
                <li>Devam eden açık iş emri bulunan müşteriler silinemez.</li>
                <li>Ödenmemiş cari borç bakiyesi olan müşteriler silinemez.</li>
                <li>Geçmiş faturalar ve tahsilatlar muhasebe mevzuatı gereği korunur.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteCustomerModalOpen(false)}
                disabled={deleteCustomerMutation.isPending}
                className="h-10 px-4 text-xs font-semibold cursor-pointer"
              >
                Vazgeç
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  try {
                    await deleteCustomerMutation.mutateAsync(customer.id)
                    router.push("/customers")
                  } catch {}
                }}
                disabled={deleteCustomerMutation.isPending}
                className="h-10 px-4 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-md shadow-rose-600/20"
              >
                {deleteCustomerMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Evet, Müşteriyi Sil</span>
                )}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        isOpen={!!selectedInvoice}
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />

      {/* Cari History Modal */}
      <CariHistoryModal
        isOpen={isCariModalOpen}
        account={{
          customerId: customer.id,
          customerName: displayName,
          customerPhone: customer.phone,
          customerType: (customer.type === "corporate" || (customer.type as string) === "CORPORATE") ? "corporate" : "individual",
          companyTitle: customer.companyTitle,
          totalDebits: customer.movements.filter((m) => m.type === "DEBIT").reduce((acc, m) => acc + m.amount, 0),
          totalCredits: customer.movements.filter((m) => m.type !== "DEBIT").reduce((acc, m) => acc + m.amount, 0),
          balance: customer.balance,
          creditLimit: 50000,
          movements: customer.movements.map((m) => ({
            id: m.id,
            customerId: customer.id,
            date: formatDateDisplay(m.date),
            type: m.type === "DEBIT" ? "INVOICE" : "PAYMENT",
            description: m.description,
            referenceNo: m.documentNo,
            debit: m.type === "DEBIT" ? m.amount : 0,
            credit: m.type !== "DEBIT" ? m.amount : 0,
            balanceAfter: m.balanceAfter,
          })),
        }}
        onClose={() => setIsCariModalOpen(false)}
      />
    </div>
  )
}