"use client"

import * as React from "react"
import {
  Search,
  Plus,
  MapPin,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Pause,
  Check,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export interface TenantRow {
  id: string
  title: string
  city?: string
  district?: string
  owner?: string
  ownerPhone?: string
  isActive?: boolean
  createdAt: string
  stats?: {
    totalStaff?: number
    totalWorkOrders?: number
  }
}

interface TenantsTableProps {
  tenants: TenantRow[] | undefined
  stats?: {
    totalTenants: number
    activeTenants: number
    inactiveTenants?: number
    suspendedTenants?: number
  }
  searchQuery: string
  onSearchChange: (val: string) => void
  statusFilter: "ALL" | "ACTIVE" | "INACTIVE"
  onStatusFilterChange: (val: "ALL" | "ACTIVE" | "INACTIVE") => void
  onOpenCreate: () => void
  onSelectTenant: (id: string) => void
  onToggleStatus: (tenant: { id: string; title: string; currentActive: boolean }) => void
  onDeleteTenant: (tenant: { id: string; title: string }) => void
  isUpdatingStatus?: boolean
}

export function TenantsTable({
  tenants,
  stats,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onOpenCreate,
  onSelectTenant,
  onToggleStatus,
  onDeleteTenant,
  isUpdatingStatus,
}: TenantsTableProps) {
  const inactiveCount = stats?.inactiveTenants ?? stats?.suspendedTenants ?? 0

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onStatusFilterChange("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-sky-500 text-white shadow-sm shadow-sky-500/25 font-semibold"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
            }`}
          >
            Tüm Servisler ({stats?.totalTenants ?? 0})
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange("ACTIVE")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === "ACTIVE"
                ? "bg-sky-500 text-white shadow-sm shadow-sky-500/25 font-semibold"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
            }`}
          >
            Aktif Lisanslılar ({stats?.activeTenants ?? 0})
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange("INACTIVE")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === "INACTIVE"
                ? "bg-sky-500 text-white shadow-sm shadow-sky-500/25 font-semibold"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
            }`}
          >
            Onay Bekleyen / Dondurulan ({inactiveCount})
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Servis adı, şehir veya telefon..."
              className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          <Button
            type="button"
            onClick={onOpenCreate}
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
              {(tenants || []).map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{t.title}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={11} className="text-slate-400 dark:text-slate-500" />
                      <span>{t.city} {t.district ? `• ${t.district}` : ""}</span>
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="font-semibold text-slate-800 dark:text-slate-300">{t.owner || "-"}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                      <Phone size={11} className="text-slate-400 dark:text-slate-500" />
                      <span>{t.ownerPhone || "-"}</span>
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
                        type="button"
                        onClick={() => onSelectTenant(t.id)}
                        className="h-8 text-xs border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 gap-1 cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>İncele</span>
                      </Button>

                      {t.isActive ? (
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => onToggleStatus({ id: t.id, title: t.title, currentActive: true })}
                          disabled={isUpdatingStatus}
                          className="h-8 text-xs border-amber-500/30 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/15 hover:bg-amber-500/20 hover:text-amber-700 dark:hover:text-amber-300 gap-1.5 cursor-pointer font-medium"
                        >
                          <Pause size={13} />
                          <span>Askıya Al</span>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => onToggleStatus({ id: t.id, title: t.title, currentActive: false })}
                          disabled={isUpdatingStatus}
                          className="h-8 text-xs border-emerald-500/30 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 hover:bg-emerald-500/20 hover:text-emerald-700 dark:hover:text-emerald-300 gap-1.5 cursor-pointer font-medium"
                        >
                          <Check size={13} />
                          <span>Lisansı Aktif Et</span>
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => onDeleteTenant({ id: t.id, title: t.title })}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-rose-500 border-slate-200 dark:border-slate-800 hover:border-rose-500/30 hover:bg-rose-500/10 cursor-pointer"
                        title="Servisi Kalıcı Olarak Sil"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
