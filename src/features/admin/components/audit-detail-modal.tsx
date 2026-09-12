"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { Terminal, Copy, Check, X, Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/sonner"
import { formatStatus, formatEntityName } from "@/lib/audit-formatters"
import type { AuditLogEntry } from "@/features/admin/api/use-admin"

interface AuditDetailModalProps {
  log: AuditLogEntry | null
  onClose: () => void
  renderBadge: (action: string) => React.ReactNode
  getActionTitle: (action: string) => string
  formatRoleName: (role: string | undefined) => string
  formatIpAddress: (ip: string | null | undefined) => string
}

export function AuditDetailModal({
  log,
  onClose,
  renderBadge,
  getActionTitle,
  formatRoleName,
  formatIpAddress,
}: AuditDetailModalProps) {
  const [copiedState, setCopiedState] = React.useState(false)

  if (!log || typeof document === "undefined") return null

  const handleCopyJson = (content: unknown) => {
    try {
      navigator.clipboard.writeText(JSON.stringify(content, null, 2))
      setCopiedState(true)
      toast.info("Olay güvenlik verisi (JSON) panoya kopyalandı.")
      setTimeout(() => setCopiedState(false), 2000)
    } catch {
      toast.error("Panoya kopyalama başarısız oldu.")
    }
  }

  const before = (log.changesBefore || {}) as Record<string, unknown>
  const after = (log.changesAfter || {}) as Record<string, unknown>
  const hasDiff = Object.keys(before).length > 0 || Object.keys(after).length > 0
  const isStaffLog =
    log.entityName?.toLowerCase() === "user" ||
    log.entityName?.toLowerCase() === "staff" ||
    log.action.startsWith("staff.") ||
    Boolean(before.staffName || after.staffName || before.assignedLift !== undefined || after.assignedLift !== undefined)

  const hasBothBeforeAfter =
    Object.keys(before).length > 0 && Object.keys(after).length > 0
  const jsonDisplay = hasBothBeforeAfter
    ? { oncekiDurum: before, yeniDurum: after }
    : Object.keys(after).length > 0
    ? after
    : Object.keys(before).length > 0
    ? before
    : { info: "Ek detay verisi bulunmuyor" }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#0b101a] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl p-6 space-y-5 shadow-2xl relative max-h-[85vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
        >
          <X size={16} />
        </button>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-[11px] font-semibold">
              <Terminal size={12} />
              <span>Olay Güvenlik İncelemesi</span>
            </div>
            {renderBadge(log.action)}
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {getActionTitle(log.action)}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Log ID: {log.id}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">İstemci IP Adresi</span>
            <p className="font-mono text-sky-600 dark:text-sky-400 font-bold">
              {formatIpAddress(log.ipAddress)}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Kayıt Tarihi</span>
            <p className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
              {new Date(log.createdAt).toLocaleString("tr-TR")}
            </p>
          </div>
        </div>

        {/* İşlemi Yapan Aktör / Kullanıcı Kartı */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">İşlemi Yapan Aktör</span>
          {log.user ? (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-white">
                {log.user.name} {log.user.surname}
              </span>
              {`${log.user.name || ""} ${log.user.surname || ""}`.trim().toLowerCase() !== formatRoleName(log.user.role).toLowerCase() && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                  {formatRoleName(log.user.role)}
                </span>
              )}
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
            {formatEntityName(log.entityName || undefined)} #{log.entityId?.slice(0, 8)}
          </span>
        </div>

        {log.userAgent && (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">İstemci Tarayıcısı (User-Agent)</span>
            <p className="font-mono text-slate-600 dark:text-slate-400 text-[11px] break-all">{log.userAgent}</p>
          </div>
        )}

        {/* Structured Visual Summary if changesBefore / changesAfter has values */}
        {hasDiff && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
            <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-500" />
              <span>Özet Değişiklik Bilgileri</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5 text-[11px]">
              {/* Personel Adı (Personel işlemleri için) */}
              {isStaffLog && Boolean(before.staffName || after.staffName || before.name || after.name) && (
                <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-slate-500 block text-[10px]">İlgili Personel</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {String(after.staffName || before.staffName || after.name || before.name || "")}
                  </span>
                </div>
              )}

              {/* Parça / Kalem Tanımı (İş emri için) */}
              {Boolean(before.itemName || after.itemName) && (
                <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-slate-500 block text-[10px]">Parça / Kalem Tanımı</span>
                  <span className="font-medium text-slate-900 dark:text-white">{String(before.itemName || after.itemName || "")}</span>
                </div>
              )}

              {/* Hizmet Tanımı (Hizmet kataloğu için) */}
              {!isStaffLog && Boolean(before.name || after.name || after.serviceName) && (
                <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-slate-500 block text-[10px]">Hizmet / Tanım</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {String(before.name || after.name || after.serviceName || "")}
                  </span>
                </div>
              )}

              {/* Atanan Lift Değişimi */}
              {Boolean(before.assignedLift !== undefined || after.assignedLift !== undefined || after.liftChange) && (
                <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-slate-500 block text-[10px]">Atanan Lift</span>
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
                  <span className="text-slate-500 block text-[10px]">Personel Rolü / Yetkisi</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {Boolean(before.role) && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px] line-through">
                        {formatRoleName(String(before.role))}
                      </span>
                    )}
                    {Boolean(before.role && after.role && before.role !== after.role) && (
                      <ArrowRight size={12} className="text-slate-400" />
                    )}
                    {Boolean(after.role) && (
                      <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-mono text-[10px] font-bold">
                        {formatRoleName(String(after.role))}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Uzmanlık Alanı */}
              {Boolean(before.specialty || after.specialty) && (
                <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-slate-500 block text-[10px]">Uzmanlık Alanı</span>
                  <span className="font-medium text-slate-900 dark:text-white text-[11px]">
                    {String(after.specialty || before.specialty || "")}
                  </span>
                </div>
              )}

              {/* Hesap Durumu (Aktif/Pasif) */}
              {Boolean(before.isActive !== undefined || after.isActive !== undefined) && (
                <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-slate-500 block text-[10px]">Hesap Durumu</span>
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
                  <span className="text-slate-500 block text-[10px]">Adet / Miktar Değişimi</span>
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

              {Boolean(before.plate || after.plate) && (
                <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-slate-500 block text-[10px]">İlgili Araç Plaka</span>
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{String(before.plate || after.plate || "")}</span>
                </div>
              )}
              {Boolean(before.customerName || after.customerName) && (
                <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-slate-500 block text-[10px]">Müşteri</span>
                  <span className="font-medium text-slate-900 dark:text-white">{String(before.customerName || after.customerName || "")}</span>
                </div>
              )}
              {Boolean(before.workOrderNumber || after.workOrderNumber) && (
                <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-slate-500 block text-[10px]">İş Emri No</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{String(before.workOrderNumber || after.workOrderNumber || "")}</span>
                </div>
              )}
              {Boolean(before.status || after.status) && (
                <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 sm:col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Aşama / Durum Değişimi</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {Boolean(before.status) && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px] line-through">
                          {formatStatus(String(before.status))}
                        </span>
                      )}
                      {Boolean(before.status && after.status) && <ArrowRight size={12} className="text-slate-400" />}
                      {Boolean(after.status) && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono text-[10px] font-bold">
                          {formatStatus(String(after.status))}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {Boolean(after.reason) && (
                <div className="bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 sm:col-span-2">
                  <span className="text-slate-500 block text-[10px]">İşlem Sebebi / Notu</span>
                  <span className="text-slate-700 dark:text-slate-300 italic">{String(after.reason)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Changes / Payload Data */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800 dark:text-slate-300">Olay Değişiklik Verisi (Tam JSON)</span>
            <button
              type="button"
              onClick={() => handleCopyJson(jsonDisplay)}
              className="text-[11px] text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 flex items-center gap-1 cursor-pointer"
            >
              {copiedState ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              <span>{copiedState ? "Kopyalandı" : "JSON Kopyala"}</span>
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-48">
            <pre>{JSON.stringify(jsonDisplay, null, 2)}</pre>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={onClose}
            className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Kapat
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
