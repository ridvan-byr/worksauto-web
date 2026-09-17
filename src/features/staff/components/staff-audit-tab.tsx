"use client";

import * as React from "react";
import {
  ShieldCheck,
  UserPlus,
  UserMinus,
  Wrench,
  Calendar,
  CalendarX,
  Edit,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StaffAuditLog } from "../api/use-staff-management";
import { cn } from "@/lib/utils";

interface StaffAuditTabProps {
  logs: StaffAuditLog[];
  isLoading: boolean;
}

const ACTION_MAP: Record<
  string,
  { label: string; icon: LucideIcon; color: string; bg: string }
> = {
  "staff.created": {
    label: "Yeni Personel Eklendi",
    icon: UserPlus,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  "staff.updated": {
    label: "Personel Güncellendi",
    icon: Edit,
    color: "text-sky-600",
    bg: "bg-sky-50 dark:bg-sky-950/40",
  },
  "staff.lift_changed": {
    label: "Lift Ataması Değişti",
    icon: Wrench,
    color: "text-indigo-600",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
  },
  "staff.deactivated": {
    label: "Personel Pasife Alındı",
    icon: UserMinus,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/40",
  },
  "staff.deleted": {
    label: "Personel Silindi",
    icon: UserMinus,
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-950/40",
  },
  "staff.leave_created": {
    label: "Yeni İzin Tanımlandı",
    icon: Calendar,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/40",
  },
  "staff.leave_cancelled": {
    label: "İzin İptal Edildi",
    icon: CalendarX,
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-950/40",
  },
};

const ENTITY_MAP: Record<string, string> = {
  User: "Personel",
  StaffLeave: "İzin Kaydı",
  Mechanic: "Teknisyen / Lift",
};

const LEAVE_TYPE_MAP: Record<string, string> = {
  ANNUAL: "Yıllık İzin",
  SICK: "Sağlık / Rapor İzni",
  COMPASSIONATE: "Mazeret İzni",
  UNPAID: "Ücretsiz İzin",
  OTHER: "Diğer İzin",
};

const ROLE_MAP: Record<string, string> = {
  OWNER: "Servis Sahibi",
  SERVICE_MANAGER: "Servis Müdürü",
  CHIEF_TECHNICIAN: "Atölye Şefi / Başusta",
  TECHNICIAN: "Teknisyen / Usta",
  APPRENTICE: "Çırak / Stajyer",
  SECRETARY: "Sekreter / Ön Muhasebe",
  CASHIER: "Kasiyer",
  SUPER_ADMIN: "Süper Yönetici",
};

const STATUS_MAP: Record<string, string> = {
  ACTIVE: "Aktif",
  INACTIVE: "Pasif",
};

function formatTurkishDateRange(startDate?: string, endDate?: string): string {
  if (!startDate) return "";
  try {
    const s = new Date(startDate);
    const sStr = s.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    if (!endDate || startDate.slice(0, 10) === endDate.slice(0, 10)) {
      return sStr;
    }
    const e = new Date(endDate);
    const eStr = e.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    return `${sStr} — ${eStr}`;
  } catch {
    return `${startDate} — ${endDate || ""}`;
  }
}

export function StaffAuditTab({ logs, isLoading }: StaffAuditTabProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const filteredLogs = React.useMemo(() => {
    return logs.filter((l) => {
      const term = searchTerm.toLowerCase();
      const action = (l.action || "").toLowerCase();
      const userName = `${l.user?.name || ""} ${l.user?.surname || ""}`.toLowerCase();
      const entity = (l.entityName || "").toLowerCase();
      const translatedEntity = (ENTITY_MAP[l.entityName] || "").toLowerCase();
      const changes = JSON.stringify(l.changesAfter || {}).toLowerCase();

      return (
        action.includes(term) ||
        userName.includes(term) ||
        entity.includes(term) ||
        translatedEntity.includes(term) ||
        changes.includes(term)
      );
    });
  }, [logs, searchTerm]);

  // Reset page when search or pageSize changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const totalItems = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + pageSize);

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString("tr-TR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Personel & Kadro Denetim Günlüğü
          </h3>
          <p className="text-[11px] text-slate-400">
            Kadro değişiklikleri, lift atamaları ve izin hareketlerinin şeffaf kayıtları
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="İşlem, personel veya detay ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Logs Feed */}
      <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <ShieldCheck className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Henüz personel işlem kaydı bulunmuyor
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Personel ekleme, düzenleme ve izin işlemleri burada kronolojik olarak listelenecektir.
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {paginatedLogs.map((log) => {
                const meta = ACTION_MAP[log.action] || {
                  label: log.action,
                  icon: ShieldCheck,
                  color: "text-slate-600",
                  bg: "bg-slate-100 dark:bg-slate-800",
                };
                const Icon = meta.icon;
                const translatedEntity = ENTITY_MAP[log.entityName] || log.entityName;

                return (
                  <div
                    key={log.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl ${meta.bg} ${meta.color} shrink-0 mt-0.5`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {meta.label}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {translatedEntity} #{log.entityId.slice(0, 8)}
                          </span>
                        </div>

                        {/* Details */}
                        {(() => {
                          const c = (log.changesAfter || {}) as Record<string, string | number>;
                          if (!log.changesAfter) return null;

                          const localizedLeave = c.leaveType
                            ? LEAVE_TYPE_MAP[String(c.leaveType)] || String(c.leaveType)
                            : null;
                          const localizedRole = c.role
                            ? ROLE_MAP[String(c.role)] || String(c.role)
                            : null;
                          const localizedStatus = c.status
                            ? STATUS_MAP[String(c.status)] || String(c.status)
                            : null;

                          return (
                            <div className="mt-1 text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                              {c.userName ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                                    {String(c.userName)}
                                  </span>
                                  {localizedLeave ? (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                      {localizedLeave}
                                    </span>
                                  ) : null}
                                </div>
                              ) : null}

                              {c.startDate && c.endDate ? (
                                <div className="text-[11px] flex items-center gap-1">
                                  <span className="text-slate-400">İzin Tarihi:</span>
                                  <span className="font-medium text-slate-700 dark:text-slate-300">
                                    {formatTurkishDateRange(String(c.startDate), String(c.endDate))}
                                  </span>
                                  {c.totalDays ? (
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      ({String(c.totalDays)} Gün)
                                    </span>
                                  ) : null}
                                </div>
                              ) : null}

                              {c.assignedLift !== undefined ? (
                                <div className="text-[11px]">
                                  Atanan Lift:{" "}
                                  <span className="font-medium text-indigo-600 dark:text-indigo-400">
                                    {c.assignedLift && String(c.assignedLift).toLowerCase() !== "none"
                                      ? String(c.assignedLift)
                                      : "Atanmamış"}
                                  </span>
                                </div>
                              ) : null}

                              {localizedRole ? (
                                <div className="text-[11px]">
                                  Rol / Unvan:{" "}
                                  <span className="font-medium text-slate-700 dark:text-slate-300">
                                    {localizedRole}
                                  </span>
                                </div>
                              ) : null}

                              {localizedStatus ? (
                                <div className="text-[11px]">
                                  Durum:{" "}
                                  <span className="font-medium text-slate-700 dark:text-slate-300">
                                    {localizedStatus}
                                  </span>
                                </div>
                              ) : null}

                              {c.reason ? (
                                <div className="text-[11px] text-slate-500 italic">
                                  "{String(c.reason)}"
                                </div>
                              ) : null}
                            </div>
                          );
                        })()}

                        <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                          <span>İşlemi Yapan:</span>
                          <span className="font-semibold text-slate-600 dark:text-slate-300">
                            {log.user ? `${log.user.name} ${log.user.surname || ""}` : "Sistem / Yönetici"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400 whitespace-nowrap self-start sm:self-auto font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatDate(log.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Toplam <strong className="font-bold text-slate-800 dark:text-slate-200">{totalItems}</strong> kayıttan{" "}
                  <strong className="font-bold text-slate-800 dark:text-slate-200">
                    {totalItems === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + pageSize, totalItems)}
                  </strong>{" "}
                  arası gösteriliyor
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px]">Sayfa başı:</span>
                  {[10, 25, 50].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setPageSize(size)}
                      className={cn(
                        "h-6 px-2 text-[11px] font-semibold rounded-md transition-all cursor-pointer",
                        pageSize === size
                          ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-slate-200 dark:border-slate-700 shadow-2xs font-bold"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1 self-end sm:self-auto">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-7 px-2 text-xs gap-1 cursor-pointer disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                    <span>Önceki</span>
                  </Button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        // Always show first, last, and around current page
                        return (
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 1
                        );
                      })
                      .map((page, idx, arr) => {
                        const prev = arr[idx - 1];
                        const showEllipsis = prev && page - prev > 1;

                        return (
                          <React.Fragment key={page}>
                            {showEllipsis && (
                              <span className="px-1 text-slate-400 text-xs">...</span>
                            )}
                            <button
                              type="button"
                              onClick={() => setCurrentPage(page)}
                              className={cn(
                                "h-7 w-7 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                                currentPage === page
                                  ? "bg-sky-500 text-white font-bold shadow-2xs"
                                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                              )}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="h-7 px-2 text-xs gap-1 cursor-pointer disabled:opacity-40"
                  >
                    <span>Sonraki</span>
                    <ChevronRight size={14} />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
