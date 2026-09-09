"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  ShieldCheck,
  Search,
  Wrench,
  Receipt,
  Calendar,
  Users,
  Eye,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  X,
  AlertTriangle,
  Tag,
  Terminal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/features/auth/auth-context"
import { useTenantAuditLogs, type TenantAuditLogsResponse } from "@/features/settings/api/use-settings"

type TenantAuditLogItem = NonNullable<TenantAuditLogsResponse["data"]>[number]
import {
  formatEntityName,
  formatStatus,
  formatPaymentMethod,
  formatRole,
  formatReason,
  formatClientIp,
  getActionBadge,
  getActionTitle,
} from "@/lib/audit-formatters"

export default function TenantAuditLogsPage() {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const { user } = useAuth()
  const userRole = (user?.role || "").toUpperCase()
  const isAuthorized =
    userRole === "OWNER" ||
    userRole === "SERVICE_MANAGER" ||
    userRole === "TENANT_ADMIN"

  const [page, setPage] = React.useState(1)
  const [filterCategory, setFilterCategory] = React.useState<
    "ALL" | "work_order" | "finance" | "appointment" | "service" | "staff"
  >("ALL")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedLog, setSelectedLog] = React.useState<TenantAuditLogItem | null>(null)
  const [copied, setCopied] = React.useState(false)

  // Map category filter to API parameter
  const apiAction = React.useMemo(() => {
    if (filterCategory === "ALL") return undefined
    return filterCategory
  }, [filterCategory])

  const { data: auditData, isLoading } = useTenantAuditLogs({
    page,
    limit: 15,
    action: apiAction,
    search: searchQuery || undefined,
  })

  const filteredLogs = auditData?.data || []

  const meta = auditData
    ? {
        total: auditData.meta?.total ?? auditData.total ?? 0,
        page: auditData.meta?.page ?? auditData.page ?? 1,
        totalPages: auditData.meta?.totalPages ?? auditData.totalPages ?? 1,
      }
    : { total: 0, page: 1, totalPages: 1 }

  const handleCopyJson = (data: unknown) => {
    if (!data) return
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }



  if (!isAuthorized) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center">
          <AlertTriangle size={24} />
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Yetkisiz Erişim
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          İşlem geçmişi ve denetim kayıtları yalnızca Servis Yöneticisi ve
          İşletme Sahibi yetkisine sahip kullanıcılar tarafından görüntülenebilir.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="text-sky-500" size={22} />
            <span>İşlem Geçmişi & Denetim İzi</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Atölyenizde personel tarafından yapılan iş emri kalemleri, tahsilatlar,
            faturalar ve randevu müdahalelerinin güvenilir denetim izi.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Plaka, personel veya işlem ara..."
            className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            setFilterCategory("ALL")
            setPage(1)
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            filterCategory === "ALL"
              ? "bg-sky-500 text-white shadow-xs shadow-sky-500/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
          }`}
        >
          Tüm Hareketler
        </button>
        <button
          type="button"
          onClick={() => {
            setFilterCategory("work_order")
            setPage(1)
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            filterCategory === "work_order"
              ? "bg-sky-500 text-white shadow-xs shadow-sky-500/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
          }`}
        >
          <Wrench size={13} />
          <span>İş Emirleri & Parçalar</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setFilterCategory("finance")
            setPage(1)
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            filterCategory === "finance"
              ? "bg-sky-500 text-white shadow-xs shadow-sky-500/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
          }`}
        >
          <Receipt size={13} />
          <span>Kasa & Faturalar</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setFilterCategory("appointment")
            setPage(1)
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            filterCategory === "appointment"
              ? "bg-sky-500 text-white shadow-xs shadow-sky-500/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
          }`}
        >
          <Calendar size={13} />
          <span>Randevular</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setFilterCategory("service")
            setPage(1)
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            filterCategory === "service"
              ? "bg-sky-500 text-white shadow-xs shadow-sky-500/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
          }`}
        >
          <Tag size={13} />
          <span>Hizmet Kataloğu</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setFilterCategory("staff")
            setPage(1)
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            filterCategory === "staff"
              ? "bg-sky-500 text-white shadow-xs shadow-sky-500/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
          }`}
        >
          <Users size={13} />
          <span>Kadro & Personel</span>
        </button>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0e1524]/60 backdrop-blur-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto min-h-[480px]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Gerçekleşen İşlem</th>
                <th className="p-4">İşlemi Yapan Personel</th>
                <th className="p-4">İlgili Varlık / Bilgi</th>
                <th className="p-4">İstemci IP</th>
                <th className="p-4">Tarih & Saat</th>
                <th className="p-4 text-right">Detay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
              {filteredLogs.map((log) => {
                const before = ((log.changesBefore || {}) as unknown) as Record<string, unknown>
                const after = ((log.changesAfter || {}) as unknown) as Record<string, unknown>
                const details = ((log.details || {}) as unknown) as Record<string, unknown>
                const changes = { ...before, ...after, ...details }
                const isStaffLog =
                  log.entityName?.toLowerCase() === "user" ||
                  log.entityName?.toLowerCase() === "staff" ||
                  log.action.startsWith("staff.") ||
                  Boolean(before.staffName || after.staffName || before.assignedLift !== undefined || after.assignedLift !== undefined)
                const plate = typeof changes.plate === "string" ? changes.plate : undefined
                const displayName = typeof (changes.itemName || changes.name || changes.serviceName) === "string" ? String(changes.itemName || changes.name || changes.serviceName) : undefined
                const staffName = isStaffLog
                  ? String(after.staffName || before.staffName || after.name || before.name || displayName || "")
                  : undefined
                const oldLift = before.assignedLift !== undefined ? String(before.assignedLift || "Atanmamış") : undefined
                const newLift = after.assignedLift !== undefined ? String(after.assignedLift || "Atanmamış") : undefined
                const isLiftChanged = Boolean(after.liftChange || (oldLift !== undefined && newLift !== undefined && oldLift !== newLift))
                const oldRole = before.role ? formatRole(String(before.role)) : undefined
                const newRole = after.role ? formatRole(String(after.role)) : undefined
                const isRoleChanged = Boolean(oldRole && newRole && oldRole !== newRole)
                const isStatusChanged = Boolean(before.isActive !== undefined && after.isActive !== undefined && before.isActive !== after.isActive)
                const oldQty = before.quantity !== undefined ? Number(before.quantity) : undefined
                const newQty = after.quantity !== undefined ? Number(after.quantity) : undefined
                const isQtyUpdated = log.action === "work_order.item_quantity_updated" || (oldQty !== undefined && newQty !== undefined && oldQty !== newQty)
                const quantity = changes.quantity !== undefined ? String(changes.quantity) : undefined
                const paymentMethod = typeof changes.paymentMethod === "string" ? changes.paymentMethod : undefined
                const status = typeof changes.status === "string" ? changes.status : undefined
                return (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-4">{getActionBadge(log.action)}</td>
                    <td className="p-4">
                      {log.user ? (
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white text-xs">
                            {log.user.name} {log.user.surname}
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {formatRole(log.user.role)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">
                          Sistem
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="space-y-0.5 max-w-xs">
                        {isStaffLog ? (
                          <>
                            {staffName && (
                              <div className="font-semibold text-slate-900 dark:text-white truncate">
                                {staffName}
                              </div>
                            )}
                            {isLiftChanged && (
                              <div className="flex items-center gap-1.5 text-[11px] font-mono">
                                <span className="text-[10px] text-slate-500 font-sans">Atanan Lift:</span>
                                {oldLift !== undefined && (
                                  <span className="text-slate-400 line-through">{oldLift}</span>
                                )}
                                {oldLift !== undefined && newLift !== undefined && (
                                  <ArrowRight size={10} className="text-slate-400" />
                                )}
                                {newLift !== undefined && (
                                  <span className="font-bold text-sky-600 dark:text-sky-400">{newLift}</span>
                                )}
                              </div>
                            )}
                            {isRoleChanged && (
                              <div className="flex items-center gap-1.5 text-[11px] font-mono">
                                <span className="text-[10px] text-slate-500 font-sans">Rol:</span>
                                <span className="text-slate-400 line-through">{oldRole}</span>
                                <ArrowRight size={10} className="text-slate-400" />
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">{newRole}</span>
                              </div>
                            )}
                            {isStatusChanged && (
                              <div className="text-[11px] flex items-center gap-1">
                                <span className="text-[10px] text-slate-500">Durum:</span>
                                <span className={`font-semibold ${after.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                  {after.isActive ? "Aktif Edildi" : "Pasife Alındı"}
                                </span>
                              </div>
                            )}
                            {!isLiftChanged && !isRoleChanged && !isStatusChanged && (after.role || before.role) && (
                              <div className="text-[11px] text-slate-500 font-mono">
                                {formatRole(String(after.role || before.role))}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            {plate && (
                              <div className="font-mono text-sky-600 dark:text-sky-400 font-bold text-[11px]">
                                {plate}
                              </div>
                            )}
                            {displayName && (
                              <div className="font-medium text-slate-900 dark:text-white truncate">
                                {displayName}
                                {!isQtyUpdated && quantity && (
                                  <span className="text-slate-500 text-[11px] font-normal ml-1">
                                    ({quantity} adet)
                                  </span>
                                )}
                              </div>
                            )}
                            {isQtyUpdated && (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 text-[11px] font-mono">
                                  {oldQty !== undefined && (
                                    <span className="text-slate-400 line-through">{oldQty} adet</span>
                                  )}
                                  {oldQty !== undefined && newQty !== undefined && (
                                    <ArrowRight size={10} className="text-slate-400" />
                                  )}
                                  {newQty !== undefined && (
                                    <span className="font-bold text-blue-600 dark:text-blue-400">{newQty} adet</span>
                                  )}
                                  {Boolean(changes.quantityChange) && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                                      ({String(changes.quantityChange)})
                                    </span>
                                  )}
                                </div>
                                {Boolean(changes.stockMovement) && (
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                                    {String(changes.stockMovement)}
                                  </div>
                                )}
                              </div>
                            )}
                            {changes.grandTotal !== undefined && (
                              <div className="text-[11px] font-mono flex items-center gap-1">
                                <span className="text-[10px] text-slate-500 font-sans">
                                  {log.action?.includes("invoice") ? "Fatura Tutarı:" : "Tutar:"}
                                </span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                  ₺{Number(changes.grandTotal).toLocaleString("tr-TR")}
                                </span>
                              </div>
                            )}
                            {changes.amount !== undefined && (
                              <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                                +₺{Number(changes.amount).toLocaleString("tr-TR")}{" "}
                                <span className="text-[10px] font-normal text-slate-500 font-sans">
                                  ({formatPaymentMethod(paymentMethod)})
                                </span>
                              </div>
                            )}
                            {status && (
                              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                <span>Durum:</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {formatStatus(status)}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                        <div className="text-slate-400 dark:text-slate-500 font-mono text-[10px] mt-0.5">
                          {formatEntityName(log.entityName)} #{log.entityId?.slice(0, 8)}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {formatClientIp(log.ipAddress)}
                    </td>
                    <td className="p-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("tr-TR")}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedLog(log)}
                        className="h-7 px-2.5 text-[11px] border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 gap-1 cursor-pointer"
                      >
                        <Eye size={12} />
                        <span>İncele</span>
                      </Button>
                    </td>
                  </tr>
                )
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-12 text-center text-slate-500 text-xs"
                  >
                    {isLoading
                      ? "Denetim kayıtları yükleniyor..."
                      : "Bu filtreye ait herhangi bir işlem kaydı bulunmuyor."}
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
                setPage((prev) => Math.max(1, prev - 1))
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
                    setPage(pageNum)
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
                setPage((prev) => Math.min(meta.totalPages, prev + 1))
              }}
              className="h-7 px-2 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs gap-1 disabled:opacity-30 cursor-pointer"
            >
              <span>Sonraki</span>
              <ChevronRight size={13} />
            </Button>
          </div>
        </div>
      </Card>

      {/* AUDIT LOG PAYLOAD DETAIL MODAL */}
      {selectedLog && mounted && typeof document !== "undefined" && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedLog(null)
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in"
        >
          <div className="bg-white dark:bg-[#0b101a] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl p-6 space-y-5 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedLog(null)}
              className="absolute top-5 right-5 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
            >
              <X size={16} />
            </button>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-[11px] font-semibold">
                  <Terminal size={12} />
                  <span>İşlem Denetim İncelemesi</span>
                </div>
                {getActionBadge(selectedLog.action)}
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {getActionTitle(selectedLog.action)}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Log ID: {selectedLog.id}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  İstemci IP Adresi
                </span>
                <p className="font-mono text-sky-600 dark:text-sky-400 font-bold">
                  {formatClientIp(selectedLog.ipAddress)}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  Kayıt Tarihi
                </span>
                <p className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                  {new Date(selectedLog.createdAt).toLocaleString("tr-TR")}
                </p>
              </div>
            </div>

            {/* İşlemi Yapan Personel Kartı */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                İşlemi Yapan Personel
              </span>
              {selectedLog.user ? (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedLog.user.name} {selectedLog.user.surname}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                    {formatRole(selectedLog.user.role)}
                  </span>
                </div>
              ) : (
                <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">
                  Sistem
                </span>
              )}
            </div>

            {/* Kayıt Türü & Varlık ID */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Kayıt Türü & Varlık ID
              </span>
              <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                {formatEntityName(selectedLog.entityName)} #{selectedLog.entityId?.slice(0, 8)}
              </span>
            </div>

            {selectedLog.userAgent && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  İstemci Tarayıcısı (User-Agent)
                </span>
                <p className="font-mono text-slate-600 dark:text-slate-400 text-[11px] break-all">
                  {selectedLog.userAgent}
                </p>
              </div>
            )}

            {/* Structured Visual Summary */}
            {(() => {
              type AuditLogDetailChanges = {
                itemName?: string
                name?: string
                staffName?: string
                role?: string
                assignedLift?: string
                liftChange?: string
                specialty?: string
                isActive?: boolean
                serviceName?: string
                plate?: string
                customerName?: string
                workOrderNumber?: string
                quantity?: number | string
                quantityChange?: string
                stockMovement?: string
                grandTotal?: number | string
                amount?: number | string
                status?: string
                reason?: string
              }
              const before = (selectedLog.changesBefore || {}) as AuditLogDetailChanges
              const after = (selectedLog.changesAfter || {}) as AuditLogDetailChanges
              const hasDiff =
                Object.keys(before).length > 0 || Object.keys(after).length > 0
              if (!hasDiff) return null

              const isStaffLog =
                selectedLog.entityName?.toLowerCase() === "user" ||
                selectedLog.entityName?.toLowerCase() === "staff" ||
                selectedLog.action.startsWith("staff.") ||
                Boolean(before.staffName || after.staffName || before.assignedLift !== undefined || after.assignedLift !== undefined)

              return (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-500" />
                    <span>Özet Değişiklik Bilgileri</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5 text-[11px]">
                    {/* Personel Adı (Personel işlemleri için) */}
                    {isStaffLog && Boolean(before.staffName || after.staffName || before.name || after.name) && (
                      <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                        <span className="text-slate-500 block text-[10px]">
                          İlgili Personel
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {after.staffName || before.staffName || after.name || before.name}
                        </span>
                      </div>
                    )}

                    {/* Parça / Kalem Tanımı (İş emri için) */}
                    {Boolean(before.itemName || after.itemName) && (
                      <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                        <span className="text-slate-500 block text-[10px]">
                          Parça / Kalem Tanımı
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {before.itemName || after.itemName}
                        </span>
                      </div>
                    )}

                    {/* Hizmet Tanımı (Hizmet Kataloğu için) */}
                    {!isStaffLog && Boolean(before.name || after.name || before.serviceName || after.serviceName) && (
                      <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                        <span className="text-slate-500 block text-[10px]">
                          Hizmet / Tanım
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {before.name || after.name || before.serviceName || after.serviceName}
                        </span>
                      </div>
                    )}

                    {/* Atanan Lift Değişimi */}
                    {Boolean(before.assignedLift !== undefined || after.assignedLift !== undefined || after.liftChange) && (
                      <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                        <span className="text-slate-500 block text-[10px]">
                          Atanan Lift
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {before.assignedLift !== undefined && (
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px] line-through">
                              {String(before.assignedLift || "Atanmamış")}
                            </span>
                          )}
                          {before.assignedLift !== undefined && after.assignedLift !== undefined && (
                            <ArrowRight size={12} className="text-slate-400" />
                          )}
                          {after.assignedLift !== undefined && (
                            <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-mono text-[10px] font-bold">
                              {String(after.assignedLift || "Atanmamış")}
                            </span>
                          )}
                        </div>
                        {Boolean(after.liftChange) && (
                          <span className="text-[10px] text-sky-600 dark:text-sky-400 mt-1 block font-semibold">
                            İşlem: {String(after.liftChange)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Personel Rolü / Yetkisi */}
                    {Boolean(before.role || after.role) && (
                      <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                        <span className="text-slate-500 block text-[10px]">
                          Personel Rolü / Yetkisi
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {Boolean(before.role) && (
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px] line-through">
                              {formatRole(String(before.role))}
                            </span>
                          )}
                          {Boolean(before.role && after.role && before.role !== after.role) && (
                            <ArrowRight size={12} className="text-slate-400" />
                          )}
                          {Boolean(after.role) && (
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-mono text-[10px] font-bold">
                              {formatRole(String(after.role))}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Uzmanlık Alanı */}
                    {Boolean(before.specialty || after.specialty) && (
                      <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                        <span className="text-slate-500 block text-[10px]">
                          Uzmanlık Alanı
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white text-[11px]">
                          {String(after.specialty || before.specialty || "")}
                        </span>
                      </div>
                    )}

                    {/* Hesap Durumu (Aktif/Pasif) */}
                    {Boolean(before.isActive !== undefined || after.isActive !== undefined) && (
                      <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                        <span className="text-slate-500 block text-[10px]">
                          Hesap Durumu
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {before.isActive !== undefined && (
                            <span className="text-[10px] font-mono line-through text-slate-400">
                              {before.isActive ? "Aktif" : "Pasif"}
                            </span>
                          )}
                          {before.isActive !== undefined && after.isActive !== undefined && before.isActive !== after.isActive && (
                            <ArrowRight size={12} className="text-slate-400" />
                          )}
                          {after.isActive !== undefined && (
                            <span className={`text-[10px] font-bold ${after.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                              {after.isActive ? "Aktif" : "Pasif"}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {Boolean(before.quantity !== undefined || after.quantity !== undefined) && (
                      <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                        <span className="text-slate-500 block text-[10px]">
                          Adet / Miktar Değişimi
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {before.quantity !== undefined && (
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px] line-through">
                              {String(before.quantity)} Adet
                            </span>
                          )}
                          {before.quantity !== undefined && after.quantity !== undefined && (
                            <ArrowRight size={12} className="text-slate-400" />
                          )}
                          {after.quantity !== undefined && (
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono text-[10px] font-bold">
                              {String(after.quantity)} Adet
                            </span>
                          )}
                        </div>
                        {Boolean(after.stockMovement) && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block italic">
                            {String(after.stockMovement)}
                          </span>
                        )}
                      </div>
                    )}
                    {(before.plate || after.plate) && (
                      <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                        <span className="text-slate-500 block text-[10px]">
                          İlgili Araç Plaka
                        </span>
                        <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                          {before.plate || after.plate}
                        </span>
                      </div>
                    )}
                    {(before.customerName || after.customerName) && (
                      <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                        <span className="text-slate-500 block text-[10px]">
                          Müşteri
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {before.customerName || after.customerName}
                        </span>
                      </div>
                    )}
                    {Boolean(before.workOrderNumber || after.workOrderNumber) && (
                      <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                        <span className="text-slate-500 block text-[10px]">
                          İş Emri No
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {String(before.workOrderNumber || after.workOrderNumber || "")}
                        </span>
                      </div>
                    )}
                    {(after.grandTotal !== undefined ||
                      after.amount !== undefined) && (
                      <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                        <span className="text-slate-500 block text-[10px]">
                          İşlem Tutarı
                        </span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ₺
                          {Number(
                            after.grandTotal ?? after.amount
                          ).toLocaleString("tr-TR")}
                        </span>
                      </div>
                    )}
                    {(before.status || after.status) && (
                      <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 sm:col-span-2 flex items-center justify-between">
                        <div>
                          <span className="text-slate-500 block text-[10px]">
                            Aşama / Durum Değişimi
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            {before.status && (
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px] line-through">
                                {formatStatus(before.status)}
                              </span>
                            )}
                            {before.status && after.status && (
                              <ArrowRight
                                size={12}
                                className="text-slate-400"
                              />
                            )}
                            {after.status && (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono text-[10px] font-bold">
                                {formatStatus(after.status)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {(before.reason || after.reason) && (
                      <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 sm:col-span-2">
                        <span className="text-slate-500 block text-[10px]">
                          İşlem Gerekçesi / Not
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 italic">
                          {formatReason(after.reason || before.reason)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Changes / Payload Data (Tam JSON) */}
            {(() => {
              const before = selectedLog.changesBefore || {}
              const after = selectedLog.changesAfter || {}
              const hasBoth =
                Object.keys(before).length > 0 && Object.keys(after).length > 0
              const jsonDisplay = hasBoth
                ? { oncekiDurum: before, yeniDurum: after }
                : Object.keys(after).length > 0
                ? after
                : Object.keys(before).length > 0
                ? before
                : { info: "Ek detay verisi bulunmuyor" }

              return (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-300">
                      Olay Değişiklik Verisi (Tam JSON)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyJson(jsonDisplay)}
                      className="text-[11px] text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? (
                        <Check size={12} className="text-emerald-500" />
                      ) : (
                        <Copy size={12} />
                      )}
                      <span>{copied ? "Kopyalandı!" : "JSON Kopyala"}</span>
                    </button>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-48">
                    <pre>{JSON.stringify(jsonDisplay, null, 2)}</pre>
                  </div>
                </div>
              )
            })()}

            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelectedLog(null)}
                className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Kapat
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
