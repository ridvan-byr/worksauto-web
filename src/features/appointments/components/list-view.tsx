"use client"

import * as React from "react"
import { Search, Calendar, Clock, User, Wrench, ArrowUpRight } from "lucide-react"
import { Appointment, AppointmentStatus } from "../types"
import { AppointmentStatusBadge } from "./appointment-status-badge"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { cn } from "@/lib/utils"

interface ListViewProps {
  appointments: Appointment[]
  onSelectAppointment: (app: Appointment) => void
}

export function ListView({ appointments, onSelectAppointment }: ListViewProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  const filtered = React.useMemo(() => {
    return appointments.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      const matchPlate = a.plate.toLowerCase().replace(/\s/g, "").includes(q.replace(/\s/g, ""))
      const matchName = a.customerName.toLowerCase().includes(q)
      const matchService = a.services.some((s) => s.name.toLowerCase().includes(q))
      return matchPlate || matchName || matchService
    })
  }, [appointments, statusFilter, searchQuery])

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Plaka, müşteri veya işlem adı ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "Tümü" },
            { id: "APPROVED", label: "Onaylandı" },
            { id: "PENDING", label: "Bekleyenler" },
            { id: "COMPLETED", label: "Tamamlanan" },
            { id: "CANCELLED", label: "İptal" },
            { id: "NO_SHOW", label: "Gelmedi" },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStatusFilter(st.id)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border",
                statusFilter === st.id
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs"
                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              )}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Tarih & Saat</th>
                <th className="py-3.5 px-4">Müşteri & Telefon</th>
                <th className="py-3.5 px-4">Araç & Plaka</th>
                <th className="py-3.5 px-4">Hizmetler</th>
                <th className="py-3.5 px-4">Atanan Usta</th>
                <th className="py-3.5 px-4">Durum</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Randevu kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                filtered.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => onSelectAppointment(app)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-4 sm:px-6 font-mono font-bold text-slate-900 dark:text-slate-100">
                      <div>{app.date}</div>
                      <div className="text-[11px] text-sky-600 dark:text-sky-400">{app.time}</div>
                    </td>

                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{app.customerName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{app.customerPhone}</p>
                    </td>

                    <td className="py-4 px-4">
                      <PlateBadge plate={app.plate} size="sm" />
                      <p className="text-[10px] text-slate-400 mt-1">
                        {app.brand} {app.model}
                      </p>
                    </td>

                    <td className="py-4 px-4">
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {app.services[0]?.name || "Hizmet"}
                      </p>
                      {app.services.length > 1 && (
                        <p className="text-[10px] text-slate-400">+{app.services.length - 1} ek hizmet</p>
                      )}
                    </td>

                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                      {app.assignedStaffName || "Atama Bekliyor"}
                    </td>

                    <td className="py-4 px-4">
                      <AppointmentStatusBadge status={app.status} />
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-right">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 group-hover:bg-slate-100 dark:group-hover:bg-slate-800 text-xs font-semibold shadow-2xs transition-colors">
                        <span>Detay</span>
                        <ArrowUpRight size={13} />
                      </span>
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
