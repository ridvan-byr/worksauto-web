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
  type LucideIcon,
} from "lucide-react";
import { StaffAuditLog } from "../api/use-staff-management";

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

export function StaffAuditTab({ logs, isLoading }: StaffAuditTabProps) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredLogs = React.useMemo(() => {
    return logs.filter((l) => {
      const term = searchTerm.toLowerCase();
      const action = (l.action || "").toLowerCase();
      const userName = `${l.user?.name || ""} ${l.user?.surname || ""}`.toLowerCase();
      const entity = (l.entityName || "").toLowerCase();
      const changes = JSON.stringify(l.changesAfter || {}).toLowerCase();

      return (
        action.includes(term) ||
        userName.includes(term) ||
        entity.includes(term) ||
        changes.includes(term)
      );
    });
  }, [logs, searchTerm]);

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString("tr-TR", {
        day: "2-digit",
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Personel & Kadro Denetim Günlüğü (Audit Logs)
          </h3>
          <p className="text-[11px] text-slate-400">
            Kadro değişiklikleri, lift atamaları ve izin hareketlerinin şeffaf kayıtları
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="İşlem veya kullanıcı ara..."
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
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredLogs.map((log) => {
              const meta = ACTION_MAP[log.action] || {
                label: log.action,
                icon: ShieldCheck,
                color: "text-slate-600",
                bg: "bg-slate-100 dark:bg-slate-800",
              };
              const Icon = meta.icon;

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
                          {log.entityName} #{log.entityId.slice(0, 8)}
                        </span>
                      </div>

                      {/* Details */}
                      {(() => {
                        const c = (log.changesAfter || {}) as Record<string, string | number>;
                        if (!log.changesAfter) return null;
                        return (
                          <div className="mt-1 text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                            {c.userName ? (
                              <div>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {String(c.userName)}
                                </span>
                                {c.leaveType ? ` (${String(c.leaveType)})` : ""}
                              </div>
                            ) : null}
                            {c.startDate && c.endDate ? (
                              <div className="text-[11px]">
                                Tarih: {String(c.startDate)} — {String(c.endDate)}
                                {c.totalDays ? ` (${String(c.totalDays)} Gün)` : ""}
                              </div>
                            ) : null}
                            {c.assignedLift ? (
                              <div className="text-[11px]">
                                Atanan Lift:{" "}
                                <span className="font-medium text-indigo-600 dark:text-indigo-400">
                                  {String(c.assignedLift)}
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

                  <div className="flex items-center gap-1 text-[11px] text-slate-400 whitespace-nowrap self-start sm:self-auto">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDate(log.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
