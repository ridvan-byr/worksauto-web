"use client"

import { useCustomers, useCreateCustomer, useDeleteCustomer } from "@/features/customers/api/use-customers"
import { useCreateVehicle } from "@/features/vehicles/api/use-vehicles"
import { useQueryClient } from "@tanstack/react-query"

import * as React from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import {
  Users,
  Car,
  Search,
  Plus,
  ArrowUpRight,
  Building2,
  User,
  CreditCard,
  ChevronRight,
  UploadCloud,
  Download,
  Trash2,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Customer } from "@/features/customers/types"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { CreateCustomerModal } from "@/features/customers/components/create-customer-modal"
import { ExcelImportModal } from "@/features/import-export/components/excel-import-modal"
import { ExcelExportModal } from "@/features/import-export/components/excel-export-modal"
import { ExportColumnDef } from "@/features/import-export/utils/aesthetic-excel"

import { formatFuelType, formatTransmission } from "@/features/vehicles/utils/vehicle-formatters"
import { cn } from "@/lib/utils"

export default function CustomersPage() {
  const queryClient = useQueryClient()
  const [mounted, setMounted] = React.useState(false)
  const [customers, setCustomers] = React.useState<Customer[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false)
  const [customerToDelete, setCustomerToDelete] = React.useState<Customer | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filterType, setFilterType] = React.useState<"all" | "individual" | "corporate" | "debtors" | "leads">("all")

  const { data: apiCustomers } = useCustomers(searchQuery)
  const createCustomerMutation = useCreateCustomer()
  const createVehicleMutation = useCreateVehicle()
  const deleteCustomerMutation = useDeleteCustomer()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Pure live API customers sync (100% PostgreSQL)
  React.useEffect(() => {
    if (apiCustomers) {
      const mapped: Customer[] = apiCustomers.map((c) => ({
        id: c.id,
        tenantId: c.tenantId || 'ten_1',
        type: (c.type === 'CORPORATE' || c.type === 'corporate') ? 'corporate' : 'individual',
        name: c.firstName || c.name,
        surname: c.lastName || c.surname,
        isLead: Boolean(c.isLead),
        companyTitle: c.companyTitle,
        phone: c.phone,
        email: c.email,
        taxNumber: c.taxNumber,
        taxOffice: c.taxOffice,
        balance: c.currentAccount ? Number(c.currentAccount.balance) : 0,
        vehicles: (c.vehicles || []).map((v) => ({
          id: v.id,
          tenantId: v.tenantId || 'ten_1',
          customerId: c.id,
          plate: v.plate,
          brand: v.brand,
          model: v.model,
          year: v.year,
          kilometer: v.currentKm ?? v.mileage ?? 0,
          fuelType: formatFuelType(v.fuelType),
          transmission: formatTransmission(v.transmission),
        })),
        appointments: [],
        workOrders: [],
        invoices: [],
        movements: [],
        createdAt: c.createdAt,
        updatedAt: c.updatedAt || c.createdAt,
      }))
      setCustomers(mapped)
    }
  }, [apiCustomers])

  const handleCustomerCreated = async (newCust: Customer) => {
    try {
      const createdCustomer = await createCustomerMutation.mutateAsync({
        firstName: newCust.name || newCust.firstName || '',
        lastName: newCust.surname || newCust.lastName || '',
        phone: newCust.phone,
        type: newCust.type === 'corporate' ? 'CORPORATE' : 'INDIVIDUAL',
        companyTitle: newCust.companyTitle,
        taxOffice: newCust.taxOffice,
        taxNumber: newCust.taxNumber,
        email: newCust.email,
        city: newCust.city,
        district: newCust.district,
      })

      if (createdCustomer?.id && (newCust.vehicles?.length ?? 0) > 0) {
        const v = newCust.vehicles[0]
        await createVehicleMutation.mutateAsync({
          customerId: createdCustomer.id,
          plate: v.plate,
          brand: v.brand,
          model: v.model,
          year: v.year,
          currentKm: v.kilometer,
          fuelType: v.fuelType === "Benzin" ? "GASOLINE" : v.fuelType === "Dizel" ? "DIESEL" : v.fuelType === "LPG" ? "LPG" : v.fuelType === "Hibrit" ? "HYBRID" : "ELECTRIC",
          transmission: v.transmission === "Otomatik" ? "AUTOMATIC" : "MANUAL",
        })
      }
    } catch (e) {
      console.warn('API sync fallback to local:', e)
    }
    const next = [newCust, ...customers]
    setCustomers(next)
  }

  // Filtered list
  const filteredCustomers = React.useMemo(() => {
    return customers.filter((c) => {
      // Filter Type
      if (filterType === "individual" && c.type !== "individual") return false
      if (filterType === "corporate" && c.type !== "corporate") return false
      if (filterType === "debtors" && c.balance <= 0) return false
      if (filterType === "leads" && !c.isLead) return false

      // Search Query
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      const matchName = `${c.name} ${c.surname}`.toLowerCase().includes(q)
      const matchCompany = c.companyTitle?.toLowerCase().includes(q) || false
      const cleanDigits = q.replace(/\D/g, "")
      const matchPhone = cleanDigits.length >= 3 && c.phone.replace(/\D/g, "").includes(cleanDigits)
      const matchPlates = c.vehicles.some((v) => v.plate.toLowerCase().replace(/\s/g, "").includes(q.replace(/\s/g, "")))
      const matchModels = c.vehicles.some((v) => `${v.brand} ${v.model}`.toLowerCase().includes(q))
      const matchEmail = c.email?.toLowerCase().includes(q) || false
      const matchTax = c.taxNumber?.includes(q) || false

      return matchName || matchCompany || matchPhone || matchPlates || matchModels || matchEmail || matchTax
    })
  }, [customers, filterType, searchQuery])

  // KPIs
  const totalVehiclesCount = React.useMemo(() => {
    return customers.reduce((sum, c) => sum + c.vehicles.length, 0)
  }, [customers])

  const totalDebtAmount = React.useMemo(() => {
    return customers.reduce((sum, c) => (c.balance > 0 ? sum + c.balance : sum), 0)
  }, [customers])

  const [isExportModalOpen, setIsExportModalOpen] = React.useState(false)

  const customerExportColumns: ExportColumnDef[] = [
    { key: "fullName", label: "Müşteri Adı Soyadı", type: "text" },
    { key: "type", label: "Müşteri Türü", type: "text" },
    { key: "companyTitle", label: "Firma Ünvanı", type: "text" },
    { key: "phone", label: "Telefon Numarası", type: "phone" },
    { key: "email", label: "E-Posta", type: "text" },
    { key: "taxNumber", label: "Vergi / TC No", type: "text" },
    { key: "taxOffice", label: "Vergi Dairesi", type: "text" },
    { key: "balance", label: "Cari Bakiye", type: "currency" },
    { key: "vehiclePlates", label: "Kayıtlı Plakalar", type: "text" },
    { key: "vehicleCount", label: "Araç Sayısı", type: "number" },
    { key: "status", label: "Kayıt Durumu", type: "text" },
  ]

  const exportData = React.useMemo(() => {
    return filteredCustomers.map((c) => ({
      fullName: `${c.name} ${c.surname}`.trim(),
      type: c.type === "corporate" ? "Kurumsal / Filo" : "Bireysel",
      companyTitle: c.companyTitle || "",
      phone: c.phone,
      email: c.email || "",
      taxNumber: c.taxNumber || "",
      taxOffice: c.taxOffice || "",
      balance: c.balance,
      vehiclePlates: c.vehicles.map((v) => v.plate).join(", "),
      vehicleCount: c.vehicles.length,
      status: c.isLead ? "Potansiyel Müşteri" : "Kayıtlı Müşteri",
    }))
  }, [filteredCustomers])

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Müşteri & Araç Yönetimi
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              {customers.length} Müşteri
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Servisinizde kayıtlı araç sahipleri, kurumsal filolar, plaka dökümleri ve bakiye takibi.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsExportModalOpen(true)}
            className="h-11 px-4 rounded-2xl gap-2 font-semibold text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs cursor-pointer"
            title="Müşteri listesini Excel formatında önizle ve indir"
          >
            <Download size={15} className="text-slate-500" />
            <span>Excel'e Aktar</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setIsImportModalOpen(true)}
            className="h-11 px-4 rounded-2xl gap-2 font-semibold text-xs border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-xs cursor-pointer"
            title="Excel dosyasından toplu müşteri ve araç yükle"
          >
            <UploadCloud size={15} />
            <span>Excel İçe Aktar</span>
          </Button>

          <Button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="h-11 px-5 rounded-2xl gap-2 font-semibold text-xs shadow-lg shadow-sky-500/20 cursor-pointer"
          >
            <Plus size={16} />
            <span>Yeni Müşteri & Araç Ekle</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Toplam Müşteri</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{customers.length}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Users size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Kayıtlı Araçlar</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalVehiclesCount}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Car size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Kurumsal / Filo</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {customers.filter((c) => c.type === "corporate").length}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Building2 size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Açık Cari Alacak</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {totalDebtAmount.toLocaleString("tr-TR")} ₺
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <CreditCard size={20} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Ad, soyad, telefon, plaka (örn: 34 RB 1905) ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border",
              filterType === "all"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs"
                : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            )}
          >
            Tümü ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("individual")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border",
              filterType === "individual"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs"
                : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            )}
          >
            Bireysel ({customers.filter((c) => c.type === "individual").length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("corporate")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border",
              filterType === "corporate"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs"
                : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            )}
          >
            Kurumsal / Filo ({customers.filter((c) => c.type === "corporate").length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("debtors")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border",
              filterType === "debtors"
                ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            )}
          >
            Borçlu ({customers.filter((c) => c.balance > 0).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("leads")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1",
              filterType === "leads"
                ? "bg-amber-500 text-slate-950 border-amber-500 shadow-xs font-bold"
                : "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
            )}
          >
            <span>Potansiyel Müşteri ({customers.filter((c) => c.isLead).length})</span>
          </button>
        </div>
      </div>

      {/* Customer List Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Müşteri / Ünvan</th>
                <th className="py-3.5 px-4">İletişim & Lokasyon</th>
                <th className="py-3.5 px-4">Kayıtlı Araçlar & Plakalar</th>
                <th className="py-3.5 px-4 text-right">Cari Bakiye</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 text-xs">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Users size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
                      <p className="font-bold text-slate-600 dark:text-slate-300">Kayıt Bulunamadı</p>
                      <p className="text-[11px]">Arama kriterlerinize uygun müşteri veya araç kaydı bulunamadı.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const displayName = c.type === "corporate" && c.companyTitle ? c.companyTitle : `${c.name} ${c.surname}`
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Customer Name & Type */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs",
                              c.type === "corporate"
                                ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                                : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                            )}
                          >
                            {c.type === "corporate" ? <Building2 size={16} /> : <User size={16} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/customers/${c.id}`}
                                className="font-bold text-slate-900 dark:text-slate-100 hover:text-sky-500 dark:hover:text-sky-400 transition-colors flex items-center gap-1.5"
                              >
                                <span>{displayName}</span>
                                <ChevronRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-sky-500" />
                              </Link>
                              {c.isLead && (
                                <span className="inline-flex items-center justify-center px-2.5 h-[18px] rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0 leading-none pt-[0.5px]">
                                  Potansiyel Müşteri
                                </span>
                              )}
                              {c.type === "corporate" && !c.taxNumber && (
                                <span className="inline-flex items-center justify-center px-2.5 h-[18px] rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shrink-0 leading-none pt-[0.5px] gap-1" title="Resmi fatura düzenlenebilmesi için 10 haneli Vergi Numarası (VKN) girilmelidir">
                                  <AlertTriangle size={10} className="shrink-0" />
                                  <span>VKN Eksik</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {c.type === "corporate" ? `Yetkili: ${c.name} ${c.surname}` : "Bireysel Müşteri"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Phone & Location */}
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                        <p className="font-mono font-medium text-[11px]">{c.phone}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {c.district ? `${c.district} / ${c.city}` : c.city || "Lokasyon yok"}
                        </p>
                      </td>

                      {/* Vehicles & Plates */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {c.vehicles.map((v) => (
                            <PlateBadge key={v.id} plate={v.plate} size="sm" />
                          ))}
                          {c.vehicles.length === 0 && (
                            <span className="text-[11px] text-slate-400 italic">Araç kaydı yok</span>
                          )}
                        </div>
                        {c.vehicles.length > 0 && (
                          <p className="text-[10px] text-slate-400 mt-1 truncate max-w-xs">
                            {c.vehicles.map((v) => `${v.brand} ${v.model}`).join(" • ")}
                          </p>
                        )}
                      </td>

                      {/* Balance */}
                      <td className="py-4 px-4 text-right">
                        {c.balance > 0 ? (
                          <span className="inline-block px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold font-mono text-xs">
                            +{c.balance.toLocaleString("tr-TR")} ₺ Borç
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold font-mono text-xs">
                            0.00 ₺ (Temiz)
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/customers/${c.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                          >
                            <span>Profili Aç</span>
                            <ArrowUpRight size={13} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setCustomerToDelete(c)}
                            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 dark:hover:border-rose-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer shadow-2xs"
                            title="Müşteriyi Sil / Arşivle"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Customer & First Vehicle Modal */}
      <CreateCustomerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleCustomerCreated}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["customers"] })
          queryClient.invalidateQueries({ queryKey: ["vehicles"] })
        }}
      />

      {/* Excel Export Modal */}
      <ExcelExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Müşteri & Cari Hesap Listesi"
        subtitle="WorksAuto Müşteri Portföyü ve Cari Durum Raporu"
        sheetName="Müşteriler"
        defaultFileName={`WorksAuto_Musteri_Listesi_${new Date().toISOString().split("T")[0]}`}
        data={exportData}
        availableColumns={customerExportColumns}
      />

      {/* Delete Customer Confirmation Modal */}
      {mounted && customerToDelete && createPortal(
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
                  <strong>
                    {customerToDelete.type === "corporate" && customerToDelete.companyTitle
                      ? customerToDelete.companyTitle
                      : `${customerToDelete.name} ${customerToDelete.surname}`}
                  </strong> adlı müşteri kaydı sistemden silinecektir.
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
                onClick={() => setCustomerToDelete(null)}
                disabled={deleteCustomerMutation.isPending}
                className="h-10 px-4 text-xs font-semibold cursor-pointer"
              >
                Vazgeç
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  try {
                    await deleteCustomerMutation.mutateAsync(customerToDelete.id)
                    setCustomers((prev) => prev.filter((c) => c.id !== customerToDelete.id))
                    setCustomerToDelete(null)
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
    </div>
  )
}