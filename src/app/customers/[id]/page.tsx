"use client"

import { useCustomer, useCustomerStats } from "@/features/customers/api/use-customers"
import { useCreateVehicle, useDeleteVehicle } from "@/features/vehicles/api/use-vehicles"

import * as React from "react"
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
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  Edit3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Customer, Vehicle } from "@/features/customers/types"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { AddVehicleModal } from "@/features/customers/components/add-vehicle-modal"
import { EditCustomerModal } from "@/features/customers/components/edit-customer-modal"
import { cn } from "@/lib/utils"

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string

  const [customer, setCustomer] = React.useState<Customer | null>(null)
  const [activeTab, setActiveTab] = React.useState<"appointments" | "workOrders" | "invoices" | "movements">("workOrders")
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = React.useState(false)
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = React.useState(false)
  const [vehicleToDelete, setVehicleToDelete] = React.useState<Vehicle | null>(null)

  const { data: apiCustomer } = useCustomer(customerId)
  const { data: customerStats } = useCustomerStats(customerId)
  const createVehicleMutation = useCreateVehicle()
  const deleteVehicleMutation = useDeleteVehicle()

  // Load customer data with live API sync and mock fallback
  React.useEffect(() => {
    if (apiCustomer) {
      setCustomer({
        id: apiCustomer.id,
        tenantId: apiCustomer.tenantId || 'ten_1',
        type: apiCustomer.type === 'CORPORATE' ? 'corporate' : 'individual',
        name: apiCustomer.firstName,
        surname: apiCustomer.lastName,
        companyTitle: apiCustomer.companyTitle,
        phone: apiCustomer.phone,
        email: apiCustomer.email,
        taxNumber: apiCustomer.taxNumber,
        taxOffice: apiCustomer.taxOffice,
        balance: apiCustomer.currentAccount ? Number(apiCustomer.currentAccount.balance) : 0,
        vehicles: (apiCustomer.vehicles || []).map((v: any) => ({
          id: v.id,
          tenantId: v.tenantId || 'ten_1',
          customerId: apiCustomer.id,
          plate: v.plate,
          brand: v.brand,
          model: v.model,
          year: v.year,
          kilometer: v.mileage || 0,
          fuelType: v.fuelType,
          transmission: v.transmission,
        })),
        appointments: (apiCustomer.appointments || []).map((app: any) => ({
          id: app.id,
          date: app.appointmentDate ? new Date(app.appointmentDate).toISOString().split('T')[0] : (app.date || '-'),
          time: app.appointmentTime || app.time || '10:00',
          serviceName: app.service?.name || app.serviceName || 'Genel Bakım',
          plate: app.vehicle?.plate || app.plate || '34XX000',
          status: app.status || 'CONFIRMED',
          technicianName: app.technician ? `${app.technician.name} ${app.technician.surname || ''}` : (app.technicianName || 'Atölye Ustası'),
        })),
        workOrders: (apiCustomer.workOrders || []).map((w: any) => ({
          id: w.id,
          orderNumber: w.workOrderNumber || w.orderNumber || 'İEM-000',
          date: w.createdAt ? new Date(w.createdAt).toISOString().split('T')[0] : (w.date || '-'),
          status: w.status || 'OPEN',
          totalAmount: Number(w.grandTotal ?? w.totalAmount ?? 0),
          kilometers: Number(w.kmIn ?? w.kilometers ?? w.vehicle?.mileage ?? 0),
          plate: w.vehicle?.plate || w.plate || w.vehiclePlate || '34XX000',
          itemsSummary: w.description || w.itemsSummary || (w.items?.length ? `${w.items.length} Kalem İşlem / Parça` : 'Periyodik Bakım & Kontrol'),
          technician: w.technician ? `${w.technician.name} ${w.technician.surname || ''}` : (w.technicianName || w.technician || 'Atölye Ustası'),
        })),
        invoices: (apiCustomer.invoices || []).map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber || 'FTR-000',
          date: inv.issueDate ? new Date(inv.issueDate).toISOString().split('T')[0] : (inv.date || '-'),
          dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : (inv.date || '-'),
          plate: inv.workOrder?.vehicle?.plate || inv.plate || '34XX000',
          totalAmount: Number(inv.grandTotal ?? inv.totalAmount ?? 0),
          paidAmount: Number(inv.paidAmount ?? (inv.status === 'PAID' ? inv.grandTotal ?? 0 : 0)),
          status: inv.status || 'PAID',
        })),
        movements: (apiCustomer.currentAccount?.movements || []).map((m: any) => ({
          id: m.id,
          date: m.date
            ? typeof m.date === 'string' && m.date.includes('T')
              ? m.date.split('T')[0]
              : new Date(m.date).toLocaleDateString('tr-TR')
            : '-',
          type: (Number(m.debit || 0) > 0 ? 'DEBIT' : 'CREDIT') as 'DEBIT' | 'CREDIT',
          amount: Number(m.debit || 0) > 0 ? Number(m.debit) : Number(m.credit),
          balanceAfter: Number(m.balanceAfter || 0),
          description: m.description || '-',
          documentNo: m.referenceNo || '',
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
                    {v.year} Model • {v.fuelType || "Benzin"} • {v.transmission || "Otomatik"}
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
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
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
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
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
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
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
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
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
              customer.invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                        {inv.invoiceNumber}
                      </span>
                      <PlateBadge plate={inv.plate} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Fatura Tarihi: {inv.date} • Vade: {inv.dueDate}
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
              ))
            )}
          </div>
        )}

        {/* Tab 4: Cari Movements */}
        {activeTab === "movements" && (
          <div className="p-4 sm:p-6 space-y-2">
            {customer.movements.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                Kayıtlı cari hesap hareketi bulunmuyor.
              </div>
            ) : (
              customer.movements.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {m.description}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {m.date} {m.documentNo && `• Evrak: ${m.documentNo}`}
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

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        isOpen={isAddVehicleModalOpen}
        customerId={customer.id}
        customerName={displayName}
        onClose={() => setIsAddVehicleModalOpen(false)}
        onAdded={handleVehicleAdded}
      />

      {/* Delete Vehicle Confirmation Modal */}
      {vehicleToDelete && (
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
        </div>
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
    </div>
  )
}