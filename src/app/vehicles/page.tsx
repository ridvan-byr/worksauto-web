"use client"

import { useVehicles, useDeleteVehicle } from "@/features/vehicles/api/use-vehicles"

import * as React from "react"
import Link from "next/link"
import {
  Car,
  Search,
  ArrowUpRight,
  Filter,
  Gauge,
  Calendar,
  Fuel,
  Settings2,
  Users,
  Trash2,
  AlertTriangle,
  X,
  UploadCloud,
  Download,
  Info,
  ChevronDown,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { ExcelImportModal } from "@/features/import-export/components/excel-import-modal"
import { ExcelExportModal } from "@/features/import-export/components/excel-export-modal"
import { ExportColumnDef } from "@/features/import-export/utils/aesthetic-excel"
import { toast } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

export default function VehiclesPage() {
  const [vehicles, setVehicles] = React.useState<any[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [brandFilter, setBrandFilter] = React.useState<string>("all")
  const [vehicleToDelete, setVehicleToDelete] = React.useState<any | null>(null)
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = React.useState(false)

  // Brand dropdown filter state
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = React.useState(false)
  const [brandSearch, setBrandSearch] = React.useState("")
  const brandDropdownRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target as Node)) {
        setIsBrandDropdownOpen(false)
      }
    }
    if (isBrandDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isBrandDropdownOpen])

  const { data: apiVehicles } = useVehicles()
  const deleteVehicleMutation = useDeleteVehicle()

  const vehicleExportColumns: ExportColumnDef[] = [
    { key: "plate", label: "Araç Plakası", type: "plate" },
    { key: "brand", label: "Marka", type: "text" },
    { key: "model", label: "Model", type: "text" },
    { key: "year", label: "Model Yılı", type: "number" },
    { key: "kilometer", label: "Kilometre", type: "number" },
    { key: "fuelType", label: "Yakıt Türü", type: "text" },
    { key: "transmission", label: "Vites", type: "text" },
    { key: "customerName", label: "Müşteri / Araç Sahibi", type: "text" },
    { key: "customerPhone", label: "Müşteri Telefon", type: "phone" },
  ]

  React.useEffect(() => {
    if (apiVehicles) {
      const mapped = apiVehicles.map((v: any) => ({
        id: v.id,
        tenantId: v.tenantId || 'ten_1',
        plate: v.plate,
        brand: v.brand,
        model: v.model,
        year: v.year,
        kilometer: v.currentKm ?? v.mileage ?? 0,
        fuelType: v.fuelType,
        transmission: v.transmission,
        customerId: v.customerId,
        customerName: v.customer ? `${v.customer.firstName} ${v.customer.lastName}` : 'Müşteri',
        customerPhone: v.customer?.phone || '',
      }))
      setVehicles(mapped)
    }
  }, [apiVehicles])

  // Unique brands with vehicle count, sorted by count descending then alphabetically
  const brandStats = React.useMemo(() => {
    const map = new Map<string, number>()
    vehicles.forEach((v) => {
      if (v.brand) {
        map.set(v.brand, (map.get(v.brand) || 0) + 1)
      }
    })
    return Array.from(map.entries())
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand))
  }, [vehicles])

  const filteredBrands = React.useMemo(() => {
    if (!brandSearch.trim()) return brandStats
    const q = brandSearch.toLowerCase().trim()
    return brandStats.filter((b) => b.brand.toLowerCase().includes(q))
  }, [brandStats, brandSearch])

  // Filtered vehicles
  const filteredVehicles = React.useMemo(() => {
    return vehicles.filter((v) => {
      if (brandFilter !== "all" && v.brand !== brandFilter) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      const matchPlate = v.plate.toLowerCase().replace(/\s/g, "").includes(q.replace(/\s/g, ""))
      const matchModel = `${v.brand} ${v.model}`.toLowerCase().includes(q)
      const matchCustomer = v.customerName.toLowerCase().includes(q)
      const cleanDigits = q.replace(/\D/g, "")
      const matchPhone = cleanDigits.length >= 3 && v.customerPhone.replace(/\D/g, "").includes(cleanDigits)

      return matchPlate || matchModel || matchCustomer || matchPhone
    })
  }, [vehicles, brandFilter, searchQuery])

  const exportData = React.useMemo(() => {
    return filteredVehicles.map((v) => ({
      plate: v.plate,
      brand: v.brand || "",
      model: v.model || "",
      year: v.year || "",
      kilometer: v.kilometer || 0,
      fuelType: v.fuelType || "",
      transmission: v.transmission || "",
      customerName: v.customerName || "",
      customerPhone: v.customerPhone || "",
    }))
  }, [filteredVehicles])

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Kayıtlı Araçlar Dizini
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {vehicles.length} Araç
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Servis veritabanındaki tüm araçlar, güncel kilometreleri, marka/model ve sahip bilgileri.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsExportModalOpen(true)}
            className="h-10 px-3.5 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Download size={14} className="text-emerald-500" />
            <span>Excel'e Aktar</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setIsImportModalOpen(true)}
            className="h-10 px-3.5 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <UploadCloud size={14} className="text-sky-500" />
            <span>Excel İçe Aktar</span>
          </Button>

          <Link
            href="/customers"
            className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <Users size={15} />
            <span>Müşteri Listesine Git</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Plaka (Örn: 34 RB 1905), marka, model veya müşteri ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Brand Dropdown Menu Filter */}
        <div ref={brandDropdownRef} className="relative min-w-[200px] sm:min-w-[220px]">
          <button
            type="button"
            onClick={() => {
              setIsBrandDropdownOpen((prev) => !prev)
              setBrandSearch("")
            }}
            className={cn(
              "w-full h-10 px-3.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer border shadow-2xs",
              brandFilter !== "all"
                ? "bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/20"
                : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <Filter size={14} className={cn("shrink-0", brandFilter !== "all" ? "text-sky-500" : "text-slate-400")} />
              <span className="truncate">
                {brandFilter === "all" ? (
                  <>Tüm Markalar <span className="text-[11px] font-normal text-slate-400">({vehicles.length})</span></>
                ) : (
                  <>Marka: <span className="font-bold">{brandFilter}</span></>
                )}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0 pl-1.5 border-l border-slate-200 dark:border-slate-800">
              {brandFilter !== "all" ? (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    setBrandFilter("all")
                  }}
                  className="p-1 rounded-md hover:bg-sky-200/60 dark:hover:bg-sky-900/60 text-sky-600 dark:text-sky-400 cursor-pointer transition-colors"
                  title="Marka Filtresini Temizle"
                >
                  <X size={13} />
                </span>
              ) : (
                <ChevronDown
                  size={14}
                  className={cn("text-slate-400 transition-transform duration-200", isBrandDropdownOpen && "rotate-180")}
                />
              )}
            </div>
          </button>

          {/* Dropdown Popover */}
          {isBrandDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-full sm:w-64 max-h-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
              {/* Mini Search inside Dropdown */}
              <div className="p-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/50">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Marka filtrele..."
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                    className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                    autoFocus
                  />
                </div>
              </div>

              {/* Options List */}
              <div className="p-1.5 overflow-y-auto max-h-60 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setBrandFilter("all")
                    setIsBrandDropdownOpen(false)
                  }}
                  className={cn(
                    "w-full px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer",
                    brandFilter === "all"
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {brandFilter === "all" && <Check size={13} className="shrink-0" />}
                    <span>Tüm Markalar</span>
                  </div>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-md font-mono",
                    brandFilter === "all"
                      ? "bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  )}>
                    {vehicles.length}
                  </span>
                </button>

                {filteredBrands.map(({ brand, count }) => {
                  const isSelected = brandFilter === brand
                  return (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => {
                        setBrandFilter(brand)
                        setIsBrandDropdownOpen(false)
                      }}
                      className={cn(
                        "w-full px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer",
                        isSelected
                          ? "bg-sky-500 text-white shadow-2xs"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isSelected && <Check size={13} className="shrink-0" />}
                        <span className="truncate">{brand}</span>
                      </div>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-md font-mono shrink-0 ml-2",
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      )}>
                        {count} araç
                      </span>
                    </button>
                  )
                })}

                {filteredBrands.length === 0 && (
                  <p className="py-4 text-center text-xs text-slate-400">
                    Marka bulunamadı
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Plaka & Model</th>
                <th className="py-3.5 px-4">Özellikler</th>
                <th className="py-3.5 px-4">Mevcut KM</th>
                <th className="py-3.5 px-4">Araç Sahibi</th>
                <th className="py-3.5 px-4">Son Servis</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 text-xs">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Car size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
                      <p className="font-bold text-slate-600 dark:text-slate-300">Araç Bulunamadı</p>
                      <p className="text-[11px]">Arama kriterlerinize uygun araç kaydı bulunamadı.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Plate & Brand/Model */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="space-y-1.5">
                        <PlateBadge plate={v.plate} size="md" />
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          {v.brand} {v.model}
                        </p>
                      </div>
                    </td>

                    {/* Specs */}
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400 text-[11px]">
                      <p>{v.year} Model</p>
                      <p className="text-slate-400 mt-0.5">
                        {v.fuelType || "Benzin"} • {v.transmission || "Otomatik"}
                      </p>
                    </td>

                    {/* Kilometer */}
                    <td className="py-4 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Gauge size={13} className="text-slate-400" />
                        <span>{v.kilometer.toLocaleString("tr-TR")} KM</span>
                      </div>
                    </td>

                    {/* Customer Name */}
                    <td className="py-4 px-4">
                      <Link
                        href={`/customers/${v.customerId}`}
                        className="font-bold text-slate-900 dark:text-slate-100 hover:text-sky-500 transition-colors"
                      >
                        {v.customerName}
                      </Link>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{v.customerPhone}</p>
                    </td>

                    {/* Last Service Date */}
                    <td className="py-4 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{v.lastServiceDate || "-"}</span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/customers/${v.customerId}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                        >
                          <span>Detayı Gör</span>
                          <ArrowUpRight size={13} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setVehicleToDelete(v)}
                          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:text-rose-600 hover:border-rose-200 dark:hover:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                          title="Aracı Sil / Arşivle"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                  <strong className="text-slate-700 dark:text-slate-200">{vehicleToDelete.plate}</strong> plakalı {vehicleToDelete.brand} {vehicleToDelete.model} aracı sistemden arşivlenecektir.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400">
              <Info size={14} className="text-sky-500 shrink-0" />
              <span>Geçmiş iş emirleri ve kesilmiş faturalar muhasebe mevzuatı gereği korunmaya devam eder.</span>
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

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Excel Export Modal */}
      <ExcelExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Kayıtlı Araçlar Portföyü"
        subtitle="WorksAuto Sistemine Kayıtlı Tüm Araçlar ve Sahiplik Bilgileri"
        sheetName="Araçlar"
        defaultFileName={`WorksAuto_Araclar_${new Date().toISOString().split("T")[0]}`}
        data={exportData}
        availableColumns={vehicleExportColumns}
      />
    </div>
  )
}