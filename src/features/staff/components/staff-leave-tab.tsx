"use client";

import * as React from "react";
import {
  Calendar,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Trash2,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StaffLeave, useCancelStaffLeave } from "../api/use-staff-management";

interface StaffLeaveTabProps {
  leaves: StaffLeave[];
  onOpenCreateModal: () => void;
  isLoading: boolean;
}

const LEAVE_TYPE_META: Record<
  StaffLeave["leaveType"],
  { label: string; bg: string; text: string; border: string }
> = {
  ANNUAL: {
    label: "Yıllık İzin",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  SICK: {
    label: "Sağlık / Rapor",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
  },
  COMPASSIONATE: {
    label: "Mazeret İzni",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  UNPAID: {
    label: "Ücretsiz İzin",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
  },
  OTHER: {
    label: "Diğer İzin",
    bg: "bg-slate-50 dark:bg-slate-900/60",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-800",
  },
};

export function StaffLeaveTab({
  leaves,
  onOpenCreateModal,
  isLoading,
}: StaffLeaveTabProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedType, setSelectedType] = React.useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");
  const [confirmCancelId, setConfirmCancelId] = React.useState<string | null>(null);

  const cancelMutation = useCancelStaffLeave();

  const handleCancelLeave = async (id: string) => {
    try {
      await cancelMutation.mutateAsync(id);
      setConfirmCancelId(null);
    } catch {
      // Handled in mutation hook
    }
  };

  // KPIs
  const todayStr = new Date().toISOString().split("T")[0];
  const activeTodayCount = React.useMemo(() => {
    return leaves.filter((l) => {
      if (l.status === "CANCELLED") return false;
      const start = l.startDate.split("T")[0];
      const end = l.endDate.split("T")[0];
      return todayStr >= start && todayStr <= end;
    }).length;
  }, [leaves, todayStr]);

  const annualCount = React.useMemo(() => {
    return leaves.filter((l) => l.leaveType === "ANNUAL" && l.status !== "CANCELLED").length;
  }, [leaves]);

  const sickCount = React.useMemo(() => {
    return leaves.filter((l) => l.leaveType === "SICK" && l.status !== "CANCELLED").length;
  }, [leaves]);

  // Filtered leaves
  const filteredLeaves = React.useMemo(() => {
    return leaves.filter((l) => {
      const userName = `${l.user?.name || ""} ${l.user?.surname || ""}`.toLowerCase();
      const reason = (l.reason || "").toLowerCase();
      const term = searchTerm.toLowerCase();

      const matchesSearch = userName.includes(term) || reason.includes(term);
      const matchesType = selectedType === "ALL" || l.leaveType === selectedType;
      const matchesStatus = selectedStatus === "ALL" || l.status === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [leaves, searchTerm, selectedType, selectedStatus]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Bugün İzinli Personel
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <CalendarDays className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {activeTodayCount}
          </p>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            {activeTodayCount > 0 ? "Şu an serviste olmayanlar" : "Tüm personel görev başında"}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Yıllık İzin Kayıtları
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {annualCount}
          </p>
          <span className="text-[11px] text-slate-400">Onaylanmış hakedişler</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Sağlık & Rapor
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {sickCount}
          </p>
          <span className="text-[11px] text-slate-400">Hastalık ve istirahat</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Toplam İzin Girişi
            </span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {leaves.length}
          </p>
          <span className="text-[11px] text-slate-400">Geçmiş ve aktif toplam</span>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Personel veya açıklama ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden"
          >
            <option value="ALL">Tüm İzin Türleri</option>
            <option value="ANNUAL">Yıllık İzin</option>
            <option value="SICK">Sağlık / Rapor</option>
            <option value="COMPASSIONATE">Mazeret İzni</option>
            <option value="UNPAID">Ücretsiz İzin</option>
            <option value="OTHER">Diğer</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="APPROVED">Onaylı / Aktif</option>
            <option value="CANCELLED">İptal Edilmiş</option>
          </select>
        </div>

        <Button
          type="button"
          onClick={onOpenCreateModal}
          className="h-9 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Yeni İzin Girişi</span>
        </Button>
      </div>

      {/* Leaves Table */}
      <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <Calendar className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Kayıtlı izin bulunamadı
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Personeliniz için yıllık, sağlık veya mazeret izni kaydı oluşturmak için yukarıdaki "Yeni İzin Girişi" butonunu kullanabilirsiniz.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-4">Personel</th>
                  <th className="py-3 px-4">İzin Türü</th>
                  <th className="py-3 px-4">Tarih Aralığı</th>
                  <th className="py-3 px-4">Süre</th>
                  <th className="py-3 px-4">Gerekçe / Açıklama</th>
                  <th className="py-3 px-4">Durum</th>
                  <th className="py-3 px-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredLeaves.map((leave) => {
                  const typeMeta = LEAVE_TYPE_META[leave.leaveType] || LEAVE_TYPE_META.OTHER;
                  const isCancelled = leave.status === "CANCELLED";

                  return (
                    <tr
                      key={leave.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                        isCancelled ? "opacity-60 bg-slate-50/30" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold text-xs">
                            {(leave.user?.name || "P")[0]}
                          </div>
                          <div>
                            <div>{leave.user?.name} {leave.user?.surname || ""}</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {leave.user?.role === "TECHNICIAN" ? "Usta / Teknisyen" : leave.user?.role}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${typeMeta.bg} ${typeMeta.text} ${typeMeta.border}`}
                        >
                          {typeMeta.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap font-medium">
                        {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {String(leave.totalDays)} Gün
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {leave.reason || "—"}
                      </td>

                      <td className="py-3.5 px-4">
                        {isCancelled ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                            <XCircle className="h-3.5 w-3.5 text-slate-400" />
                            İptal Edildi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Onaylandı
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {!isCancelled && (
                          confirmCancelId === leave.id ? (
                            <div className="inline-flex items-center gap-1.5">
                              <span className="text-[10px] text-rose-600 font-semibold">İptal edilsin mi?</span>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleCancelLeave(leave.id)}
                                disabled={cancelMutation.isPending}
                                className="h-7 px-2 text-[10px] rounded-lg"
                              >
                                Evet
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setConfirmCancelId(null)}
                                className="h-7 px-2 text-[10px] rounded-lg"
                              >
                                Hayır
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmCancelId(leave.id)}
                              className="h-7 px-2 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              İptal Et
                            </Button>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
