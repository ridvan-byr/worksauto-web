"use client";

import * as React from "react";
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Wrench,
  Calendar,
  Pencil,
  Trash2,
  Layers,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StaffRecord, StaffLeave } from "../api/use-staff-management";

interface StaffListTabProps {
  staff: StaffRecord[];
  leaves: StaffLeave[];
  onOpenCreateModal: () => void;
  onEditStaff: (staff: StaffRecord) => void;
  onDeleteStaff: (staff: StaffRecord) => void;
  onReactivateStaff?: (staff: StaffRecord) => void;
  onDefineLeave: (staffId: string) => void;
  isLoading: boolean;
}

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  OWNER: {
    label: "Servis Sahibi",
    color: "text-purple-700 dark:text-purple-300",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    border: "border-purple-200 dark:border-purple-800",
  },
  SERVICE_MANAGER: {
    label: "Servis Müdürü",
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
  },
  SERVICE_ADVISOR: {
    label: "Servis Danışmanı",
    color: "text-indigo-700 dark:text-indigo-300",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    border: "border-indigo-200 dark:border-indigo-800",
  },
  TECHNICIAN: {
    label: "Usta / Teknisyen",
    color: "text-sky-700 dark:text-sky-300",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    border: "border-sky-200 dark:border-sky-800",
  },
  CASHIER: {
    label: "Kasiyer / Ön Muhasebe",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
  },
};

export function StaffListTab({
  staff,
  leaves,
  onOpenCreateModal,
  onEditStaff,
  onDeleteStaff,
  onReactivateStaff,
  onDefineLeave,
  isLoading,
}: StaffListTabProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<string>("ACTIVE");

  const todayStr = new Date().toISOString().split("T")[0];

  // Set of staff IDs currently on approved leave today
  const onLeaveStaffIds = React.useMemo(() => {
    const ids = new Set<string>();
    leaves.forEach((l) => {
      if (l.status === "CANCELLED") return;
      const start = l.startDate.split("T")[0];
      const end = l.endDate.split("T")[0];
      if (todayStr >= start && todayStr <= end) {
        ids.add(l.userId);
      }
    });
    return ids;
  }, [leaves, todayStr]);

  // Counts
  const activeCount = staff.filter((s) => s.isActive !== false).length;
  const passiveCount = staff.filter((s) => s.isActive === false).length;
  const technicianCount = staff.filter(
    (s) => s.role === "TECHNICIAN" && s.isActive !== false
  ).length;
  const assignedLiftCount = staff.filter(
    (s) =>
      s.isActive !== false &&
      s.mechanic?.assignedLift &&
      s.mechanic.assignedLift !== "Atanmamış"
  ).length;

  const filteredStaff = React.useMemo(() => {
    return staff.filter((s) => {
      const name = `${s.name} ${s.surname || ""}`.toLowerCase();
      const phone = (s.phone || "").toLowerCase();
      const specialty = (s.mechanic?.specialty || "").toLowerCase();
      const lift = (s.mechanic?.assignedLift || "").toLowerCase();
      const term = searchTerm.toLowerCase();

      const matchesSearch =
        name.includes(term) || phone.includes(term) || specialty.includes(term) || lift.includes(term);
      const matchesRole = roleFilter === "ALL" || s.role === roleFilter;

      const isOnLeave = onLeaveStaffIds.has(s.id);
      let matchesStatus = true;
      if (statusFilter === "ACTIVE") matchesStatus = s.isActive !== false;
      if (statusFilter === "ON_LEAVE") matchesStatus = s.isActive !== false && isOnLeave;
      if (statusFilter === "PASSIVE") matchesStatus = s.isActive === false;
      if (statusFilter === "ALL") matchesStatus = true;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staff, searchTerm, roleFilter, statusFilter, onLeaveStaffIds]);

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Aktif Servis Kadrosu
            </span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {activeCount}
          </p>
          <span className="text-[11px] text-slate-400">
            {passiveCount > 0 ? `${passiveCount} ayrılan personel arşivde` : "Tüm kadro aktif görevde"}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Atölye Ustaları
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {technicianCount}
          </p>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
            Aktif mekanik/elektrik teknisyenleri
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Atanmış Lift Sayısı
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {assignedLiftCount}
          </p>
          <span className="text-[11px] text-slate-400">Sabit lift sorumlusu</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Bugün İzinli Olanlar
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {onLeaveStaffIds.size}
          </p>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            {onLeaveStaffIds.size > 0 ? "İzinli/Raporlu usta var" : "Eksik kadro yok"}
          </span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="İsim, telefon, uzmanlık veya lift ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden"
          >
            <option value="ALL">Tüm Roller</option>
            <option value="TECHNICIAN">Usta / Teknisyen</option>
            <option value="SERVICE_MANAGER">Servis Müdürü</option>
            <option value="SERVICE_ADVISOR">Servis Danışmanı</option>
            <option value="CASHIER">Kasiyer / Ön Muhasebe</option>
            <option value="OWNER">Servis Sahibi</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden"
          >
            <option value="ACTIVE">Aktif Kadro (Görevde)</option>
            <option value="ON_LEAVE">Bugün İzinli Olanlar</option>
            <option value="PASSIVE">
              Ayrılan / Pasif Personel (Arşiv){passiveCount > 0 ? ` (${passiveCount})` : ""}
            </option>
            <option value="ALL">Tüm Kayıtlar (Aktif + Arşiv)</option>
          </select>
        </div>

        <Button
          type="button"
          onClick={onOpenCreateModal}
          className="h-9 px-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Yeni Personel Ekle</span>
        </Button>
      </div>

      {/* Staff Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <Users className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Personel kaydı bulunamadı
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Arama kriterlerinizi değiştirebilir veya yeni personel ekleyebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((s) => {
            const roleMeta = ROLE_LABELS[s.role] || {
              label: s.role,
              color: "text-slate-700 dark:text-slate-300",
              bg: "bg-slate-50 dark:bg-slate-800",
              border: "border-slate-200 dark:border-slate-700",
            };
            const isOnLeave = onLeaveStaffIds.has(s.id);
            const isPassive = s.isActive === false;

            return (
              <div
                key={s.id}
                className={`flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all ${
                  isPassive
                    ? "opacity-60 border-slate-200 dark:border-slate-800 bg-slate-50/50"
                    : "border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-800 shadow-xs hover:shadow-md"
                }`}
              >
                <div>
                  {/* Top Header: Avatar, Name, Role Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 text-white font-bold text-sm shadow-xs">
                          {s.name[0]}{(s.surname || "")[0]}
                        </div>
                        {/* Status dot */}
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                            isPassive
                              ? "bg-slate-400"
                              : isOnLeave
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                        />
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                          {s.name} {s.surname || ""}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${roleMeta.bg} ${roleMeta.color} ${roleMeta.border}`}
                          >
                            {roleMeta.label}
                          </span>
                          {isOnLeave && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              İzinli
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <a
                        href={`tel:${s.phone}`}
                        className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors font-medium"
                      >
                        {s.phone}
                      </a>
                    </div>
                    {s.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{s.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Mechanic details if technician */}
                  {s.role === "TECHNICIAN" && (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Atanmış Lift:</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-[11px]">
                          {s.mechanic?.assignedLift || "Atanmamış"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Uzmanlık Alanı:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300 text-[11px] truncate max-w-[140px]">
                          {s.mechanic?.specialty || "Genel Mekanik"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                  {isPassive ? (
                    <span className="text-[10px] font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-900">
                      Ayrıldı / Pasif
                    </span>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onDefineLeave(s.id)}
                      className="h-8 px-2 text-[11px] rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 border-amber-200 dark:border-amber-800/60"
                    >
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      İzin Tanımla
                    </Button>
                  )}

                  <div className="flex items-center gap-1">
                    {isPassive ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onReactivateStaff?.(s)}
                        className="h-8 px-2.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>İşe Geri Al / Aktifleştir</span>
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditStaff(s)}
                          className="h-8 w-8 p-0 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteStaff(s)}
                          className="h-8 w-8 p-0 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
