"use client"

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
} from "lucide-react"
import { getAllVehicles } from "@/features/customers/mock-data"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { cn } from "@/lib/utils"

export default function VehiclesPage() {
  const [vehicles, setVehicles] = React.useState<ReturnType<typeof getAllVehicles>>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [brandFilter, setBrandFilter] = React.useState<string>("all")

  React.useEffect(() => {
    setVehicles(getAllVehicles())
  }, [])

  // Unique brands
  const brands = React.useMemo(() => {
    const set = new Set<string>()
    vehicles.forEach((v) => {
      if (v.brand) set.add(v.brand)
    })
    return Array.from(set)
  }, [vehicles])

  // Filtered vehicles
  const filteredVehicles = React.useMemo(() => {
    return vehicles.filter((v) => {
      if (brandFilter !== "all" && v.brand !== brandFilter) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      const matchPlate = v.plate.toLowerCase().replace(/\s/g, "").includes(q.replace(/\s/g, ""))
      const matchModel = `${v.brand} ${v.model}`.toLowerCase().includes(q)
      const matchCustomer = v.customerName.toLowerCase().includes(q)

      return matchPlate || matchModel || matchCustomer
    })
  }, [vehicles, brandFilter, searchQuery])

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

        <Link
          href="/customers"
          className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <Users size={15} />
          <span>Müşteri Listesine Git</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Plaka (örn: 34 RB 1905), marka, model veya müşteri ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
          />
        </div>

        {/* Brand Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setBrandFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border",
              brandFilter === "all"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs"
                : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            )}
          >
            Tüm Markalar ({vehicles.length})
          </button>
          {brands.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBrandFilter(b)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border",
                brandFilter === b
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs"
                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              )}
            >
              {b} ({vehicles.filter((v) => v.brand === b).length})
            </button>
          ))}
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
                      <Link
                        href={`/customers/${v.customerId}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      >
                        <span>Detayı Gör</span>
                        <ArrowUpRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
