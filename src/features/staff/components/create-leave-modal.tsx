"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X, Calendar, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StaffRecord, CreateStaffLeaveInput } from "../api/use-staff-management";

interface CreateLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffRecord[];
  preselectedUserId?: string | null;
  onSubmit: (data: CreateStaffLeaveInput) => Promise<void>;
  isPending: boolean;
}

const LEAVE_TYPE_OPTIONS: { id: CreateStaffLeaveInput["leaveType"]; label: string; description: string }[] = [
  { id: "ANNUAL", label: "Yıllık İzin", description: "Hakediş veya planlı senelik izin" },
  { id: "SICK", label: "Sağlık / Rapor", description: "Doktor veya hastane istirahat raporu" },
  { id: "COMPASSIONATE", label: "Mazeret İzni", description: "Vefat, evlilik, doğum veya özel mazeret" },
  { id: "UNPAID", label: "Ücretsiz İzin", description: "Maaş kesintili izin" },
  { id: "OTHER", label: "Diğer İzin", description: "İdari veya diğer onaylı izinler" },
];

export function CreateLeaveModal({
  isOpen,
  onClose,
  staffList,
  preselectedUserId,
  onSubmit,
  isPending,
}: CreateLeaveModalProps) {
  const [userId, setUserId] = React.useState(preselectedUserId || "");
  const [leaveType, setLeaveType] = React.useState<CreateStaffLeaveInput["leaveType"]>("ANNUAL");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [totalDays, setTotalDays] = React.useState<number>(1);
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const activeStaffList = React.useMemo(() => {
    return (staffList || []).filter((st) => st.isActive !== false);
  }, [staffList]);

  React.useEffect(() => {
    if (preselectedUserId && activeStaffList.some((s) => s.id === preselectedUserId)) {
      setUserId(preselectedUserId);
    } else if (activeStaffList.length > 0 && (!userId || !activeStaffList.some((s) => s.id === userId))) {
      setUserId(activeStaffList[0].id);
    }
  }, [preselectedUserId, activeStaffList, userId]);

  React.useEffect(() => {
    if (isOpen) {
      // Default to tomorrow or today
      const today = new Date().toISOString().split("T")[0];
      setStartDate(today);
      setEndDate(today);
      setTotalDays(1);
      setError(null);
      setReason("");
    }
  }, [isOpen]);

  // Auto calculate days when start or end changes
  React.useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        if (end < start) {
          setError("Bitiş tarihi başlangıç tarihinden önce olamaz.");
        } else {
          setError(null);
          const diffMs = end.getTime() - start.getTime();
          const days = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
          setTotalDays(days > 0 ? days : 1);
        }
      }
    }
  }, [startDate, endDate]);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setError("Lütfen bir personel seçin.");
      return;
    }
    if (!startDate || !endDate) {
      setError("Lütfen başlangıç ve bitiş tarihlerini girin.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError("Başlangıç tarihi bitiş tarihinden sonra olamaz.");
      return;
    }

    try {
      await onSubmit({
        userId,
        leaveType,
        startDate,
        endDate,
        totalDays: Number(totalDays),
        reason: reason.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "İzin kaydedilirken bir hata oluştu.";
      setError(message);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Yeni İzin Girişi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personel için yıllık, rapor veya mazeret izni tanımlayın
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-900">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Personel Seçimi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Personel <span className="text-rose-500">*</span>
            </label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              required
            >
              <option value="" disabled>Personel seçin</option>
              {activeStaffList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} {st.surname || ""} ({st.role === "TECHNICIAN" ? "Usta / Teknisyen" : st.role})
                  {st.mechanic?.assignedLift ? ` — ${st.mechanic.assignedLift}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* İzin Türü */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              İzin Türü <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {LEAVE_TYPE_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex flex-col p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    leaveType === opt.id
                      ? "border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100 font-semibold"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{opt.label}</span>
                    <input
                      type="radio"
                      name="leaveType"
                      checked={leaveType === opt.id}
                      onChange={() => setLeaveType(opt.id)}
                      className="text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 font-normal line-clamp-1">
                    {opt.description}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Tarih Aralığı */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Başlangıç Tarihi <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Bitiş Tarihi <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
          </div>

          {/* Gün Sayısı (hesaplanan) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <Clock className="h-4 w-4 text-amber-500" />
              <span>Toplam Süre:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={totalDays}
                onChange={(e) => setTotalDays(Number(e.target.value))}
                className="w-16 h-8 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100"
              />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">İş Günü</span>
            </div>
          </div>

          {/* Gerekçe */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Gerekçe / Not <span className="text-slate-400 font-normal">(İsteğe bağlı)</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Örn: 2026 yılı 1. dönem yıllık izin kullanımı..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="rounded-xl text-xs"
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
            >
              {isPending ? "Kaydediliyor..." : "İzni Onayla ve Kaydet"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
