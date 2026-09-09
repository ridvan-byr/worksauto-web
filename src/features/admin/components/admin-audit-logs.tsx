"use client"

import * as React from "react"
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Trash2,
  CheckCircle2,
  Pause,
  Plus,
  Wrench,
  Calendar,
  Clock,
  AlertCircle,
  RefreshCw,
  FileText,
  CreditCard,
  Tag,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AuditDetailModal } from "./audit-detail-modal"
import type { AuditLogEntry } from "@/features/admin/api/use-admin"

interface AdminAuditLogsProps {
  logs: AuditLogEntry[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  isLoading: boolean
  onPageChange: (page: number) => void
  actionFilter: string
  onActionFilterChange: (action: string) => void
  searchQuery: string
  onSearchChange: (search: string) => void
}

export function formatIpAddress(ip: string | null | undefined) {
  if (!ip || ip === "::1" || ip === "127.0.0.1" || ip.toLowerCase() === "localhost") {
    return "127.0.0.1 (Yerel)"
  }
  return ip
}

export function formatRoleName(role: string | undefined) {
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

export function getActionTitle(action: string) {
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

export function getActionBadge(action: string) {
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

export function AdminAuditLogs({
  logs,
  meta,
  isLoading,
  onPageChange,
  actionFilter,
  onActionFilterChange,
  searchQuery,
  onSearchChange,
}: AdminAuditLogsProps) {
  const [selectedLog, setSelectedLog] = React.useState<AuditLogEntry | null>(null)

  return (
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
            type="button"
            onClick={() => onActionFilterChange("PLATFORM")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              actionFilter === "PLATFORM"
                ? "bg-sky-500 text-white font-semibold shadow-xs"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
            }`}
          >
            <ShieldCheck size={12} />
            <span>Platform & Güvenlik</span>
          </button>
          <button
            type="button"
            onClick={() => onActionFilterChange("TENANT")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              actionFilter === "TENANT"
                ? "bg-sky-500 text-white font-semibold shadow-xs"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
            }`}
          >
            <Building2 size={12} />
            <span>Servis & Lisans</span>
          </button>
          <button
            type="button"
            onClick={() => onActionFilterChange("SECURITY")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              actionFilter === "SECURITY"
                ? "bg-sky-500 text-white font-semibold shadow-xs"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
            }`}
          >
            <ShieldAlert size={12} />
            <span>Giriş Denemeleri</span>
          </button>
          <button
            type="button"
            onClick={() => onActionFilterChange("OPERATIONS")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              actionFilter === "OPERATIONS"
                ? "bg-sky-500 text-white font-semibold shadow-xs"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
            }`}
          >
            <Wrench size={12} />
            <span>Servis Operasyonları</span>
          </button>
          <button
            type="button"
            onClick={() => onActionFilterChange("ALL")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              actionFilter === "ALL"
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
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
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
              {logs.map((log) => (
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
                      type="button"
                      onClick={() => setSelectedLog(log)}
                      className="h-7 px-2.5 text-[11px] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 gap-1 cursor-pointer"
                    >
                      <Eye size={12} />
                      <span>İncele</span>
                    </Button>
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                    {isLoading ? "Audit kayıtları yükleniyor..." : "Filtre kriterlerine uygun log kaydı bulunamadı."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 dark:text-slate-400 text-[11px]">
            Toplam <strong className="text-slate-900 dark:text-white font-mono">{meta.total}</strong> olay kaydı • Sayfa <strong className="text-slate-900 dark:text-white font-mono">{meta.page}</strong> / <strong className="text-slate-900 dark:text-white font-mono">{meta.totalPages}</strong>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <Button
              size="sm"
              variant="outline"
              type="button"
              disabled={meta.page <= 1}
              onClick={(e) => {
                e.preventDefault()
                onPageChange(Math.max(1, meta.page - 1))
              }}
              className="h-7 px-2 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs gap-1 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft size={13} />
              <span>Önceki</span>
            </Button>

            {/* Page numbers (up to 5 pages) */}
            {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
              const pageNum = i + 1
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    onPageChange(pageNum)
                  }}
                  className={`w-7 h-7 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    meta.page === pageNum
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
              disabled={meta.page >= meta.totalPages}
              onClick={(e) => {
                e.preventDefault()
                onPageChange(Math.min(meta.totalPages, meta.page + 1))
              }}
              className="h-7 px-2 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs gap-1 disabled:opacity-30 cursor-pointer"
            >
              <span>Sonraki</span>
              <ChevronRight size={13} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Detail Modal */}
      <AuditDetailModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
        renderBadge={getActionBadge}
        getActionTitle={getActionTitle}
        formatRoleName={formatRoleName}
        formatIpAddress={formatIpAddress}
      />
    </div>
  )
}
