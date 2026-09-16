"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  CalendarClock,
  ArrowRight,
  Send,
  MessageSquare,
  AlertCircle,
  Clock,
  X,
  Mail,
  Smartphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Appointment } from "../types"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { cn } from "@/lib/utils"

export interface RescheduleAppointmentModalProps {
  isOpen: boolean
  appointment: Appointment | null
  targetDate: string // YYYY-MM-DD
  targetTime: string // HH:mm
  onClose: () => void
  onConfirm: (data: {
    reason: string
    notifyCustomer: boolean
    channels?: ("WHATSAPP" | "SMS" | "EMAIL")[]
  }) => Promise<void> | void
  isPending?: boolean
}

const QUICK_REASONS = [
  { id: "parts", label: "Yedek parça tedarik süreci", icon: "📦" },
  { id: "repair_delay", label: "Önceki araç onarımı uzadı", icon: "🔧" },
  { id: "customer_request", label: "Müşteri erteleme talep etti", icon: "📞" },
  { id: "bay_busy", label: "Atölye / Lift yoğunluğu", icon: "👨‍🔧" },
  { id: "custom", label: "Diğer (Özel Gerekçe)", icon: "✏️" },
]

export function RescheduleAppointmentModal({
  isOpen,
  appointment,
  targetDate,
  targetTime,
  onClose,
  onConfirm,
  isPending = false,
}: RescheduleAppointmentModalProps) {
  const [mounted, setMounted] = React.useState(false)
  const [selectedChip, setSelectedChip] = React.useState<string>("parts")
  const [customReason, setCustomReason] = React.useState<string>("Yedek parça tedarik süreci")
  const [notifyCustomer, setNotifyCustomer] = React.useState<boolean>(true)
  const [selectedChannels, setSelectedChannels] = React.useState<("WHATSAPP" | "SMS" | "EMAIL")[]>(["WHATSAPP", "EMAIL"])

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Reset defaults whenever modal opens for an appointment
  React.useEffect(() => {
    if (isOpen && appointment) {
      setSelectedChip("parts")
      setCustomReason("Yedek parça tedarik süreci")
      const hasPhone = Boolean(appointment.customerPhone)
      const hasEmail = Boolean(appointment.customerEmail)
      setNotifyCustomer(hasPhone || hasEmail)

      const defaultChannels: ("WHATSAPP" | "SMS" | "EMAIL")[] = []
      if (hasPhone) defaultChannels.push("WHATSAPP")
      if (hasEmail) defaultChannels.push("EMAIL")
      if (defaultChannels.length === 0 && hasPhone) defaultChannels.push("SMS")
      setSelectedChannels(defaultChannels.length > 0 ? defaultChannels : ["WHATSAPP"])
    }
  }, [isOpen, appointment])

  if (!mounted || !isOpen || !appointment) return null

  // Format dates for display
  const formatDateDisplay = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split("-").map(Number)
      const date = new Date(y, m - 1, d)
      return date.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        weekday: "short",
      })
    } catch {
      return dateStr
    }
  }

  // Calculate day difference
  const getDayDiffText = () => {
    try {
      const [y1, m1, d1] = appointment.date.split("-").map(Number)
      const [y2, m2, d2] = targetDate.split("-").map(Number)
      const dOld = new Date(y1, m1 - 1, d1).getTime()
      const dNew = new Date(y2, m2 - 1, d2).getTime()
      const diffDays = Math.round((dNew - dOld) / (1000 * 60 * 60 * 24))

      if (diffDays === 0) {
        return "Aynı Gün (Saat Değişimi)"
      } else if (diffDays > 0) {
        return `+${diffDays} Gün İleri Alındı`
      } else {
        return `${diffDays} Gün Öne Çekildi`
      }
    } catch {
      return "Tarih Güncellendi"
    }
  }

  const handleChipClick = (id: string, label: string) => {
    setSelectedChip(id)
    if (id === "custom") {
      setCustomReason("")
    } else {
      setCustomReason(label)
    }
  }

  const toggleChannel = (ch: "WHATSAPP" | "SMS" | "EMAIL") => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm({
      reason: customReason.trim(),
      notifyCustomer: notifyCustomer && selectedChannels.length > 0,
      channels: selectedChannels,
    })
  }

  const hasPhone = Boolean(appointment.customerPhone)
  const hasEmail = Boolean(appointment.customerEmail)
  let formattedDatePreview = targetDate
  try {
    if (targetDate) {
      const [y, m, d] = targetDate.split("-").map(Number)
      formattedDatePreview = new Date(y, m - 1, d).toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        weekday: "long",
      })
    }
  } catch {
    formattedDatePreview = targetDate
  }

  const previewMessage = `Sayın ${appointment.customerName || "Müşterimiz"}, ${appointment.plate ? `${appointment.plate} plakalı ` : ""}aracınızın servis randevusu ${formattedDatePreview || targetDate} saat ${targetTime} olarak güncellenmiştir.${
    customReason.trim() ? ` (Erteleme Nedeni: ${customReason.trim()})` : ""
  }`

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose()
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <CalendarClock size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Randevuyu Yeniden Planla
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  Drag & Drop
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Taşınan randevu için saat onayını ve bilgilendirme detayını belirleyin.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Target Customer & Vehicle Mini Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <PlateBadge plate={appointment.plate} size="sm" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {appointment.customerName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {appointment.brand} {appointment.model} • {appointment.services[0]?.name || "Servis İşlemi"}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              {hasPhone && (
                <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                  {appointment.customerPhone}
                </span>
              )}
              {hasEmail && (
                <span className="text-[10px] font-mono text-slate-400 truncate max-w-[150px]">
                  {appointment.customerEmail}
                </span>
              )}
            </div>
          </div>

          {/* Before ➔ After Visual Transition Card */}
          <div className="p-3.5 rounded-2xl bg-linear-to-r from-slate-100 via-sky-50/40 to-sky-100/60 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-sky-950/30 border border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-2">
            {/* Eski */}
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Mevcut Randevu
              </span>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5 truncate">
                {formatDateDisplay(appointment.date)}
              </p>
              <div className="flex items-center gap-1 text-xs font-mono font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                <Clock size={11} />
                <span>{appointment.time}</span>
              </div>
            </div>

            {/* Arrow & Badge */}
            <div className="flex flex-col items-center justify-center shrink-0 px-2">
              <div className="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-xs">
                <ArrowRight size={14} />
              </div>
              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 mt-1">
                {getDayDiffText()}
              </span>
            </div>

            {/* Yeni */}
            <div className="flex-1 min-w-0 text-right">
              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider block">
                Yeni Planlama
              </span>
              <p className="text-xs font-bold text-sky-950 dark:text-sky-100 mt-0.5 truncate">
                {formatDateDisplay(targetDate)}
              </p>
              <div className="flex items-center justify-end gap-1 text-xs font-mono font-black text-sky-600 dark:text-sky-400 mt-0.5">
                <Clock size={11} />
                <span>{targetTime}</span>
              </div>
            </div>
          </div>

          {/* Quick Reason Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>Erteleme / Yeniden Planlama Nedeni:</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Tek tıkla seçin veya düzenleyin</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {QUICK_REASONS.map((chip) => {
                const isSelected = selectedChip === chip.id
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => handleChipClick(chip.id, chip.label)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 border",
                      isSelected
                        ? "bg-sky-500 text-white border-sky-500 shadow-2xs font-semibold"
                        : "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    )}
                  >
                    <span>{chip.icon}</span>
                    <span>{chip.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Custom / Editable Textarea */}
            <div className="relative mt-2">
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Randevu erteleme gerekçesini belirtiniz..."
                rows={2}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 resize-none transition-shadow"
              />
            </div>
          </div>

          {/* Notification Options & Multi-Channel Selector */}
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30 space-y-3">
            <div className="flex items-center justify-between select-none">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Send size={13} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Müşteriye Otomatik Bildirim Gönder
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Yeni randevu saati ve gerekçe seçilen kanallardan iletilir.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifyCustomer}
                onChange={(e) => setNotifyCustomer(e.target.checked)}
                disabled={!hasPhone && !hasEmail}
                className="w-4 h-4 rounded text-purple-600 border-slate-300 focus:ring-purple-500 cursor-pointer disabled:opacity-50"
              />
            </div>

            {!hasPhone && !hasEmail && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900">
                <AlertCircle size={13} className="shrink-0" />
                <span>Müşterinin sistemde kayıtlı iletişim bilgisi (telefon veya e-posta) bulunmamaktadır.</span>
              </p>
            )}

            {notifyCustomer && (hasPhone || hasEmail) && (
              <div className="space-y-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">İletim Kanalları:</span>
                  <span className="text-[10px] text-slate-400">İstediğiniz kanalları seçin</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* WhatsApp */}
                  <button
                    type="button"
                    disabled={!hasPhone}
                    onClick={() => toggleChannel("WHATSAPP")}
                    className={cn(
                      "p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 cursor-pointer",
                      !hasPhone
                        ? "opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900"
                        : selectedChannels.includes("WHATSAPP")
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-2xs"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold flex items-center gap-1">
                        <MessageSquare size={13} className={hasPhone && selectedChannels.includes("WHATSAPP") ? "text-emerald-600" : "text-slate-400"} />
                        <span>WhatsApp</span>
                      </span>
                      {hasPhone && selectedChannels.includes("WHATSAPP") && (
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">✓</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 truncate font-mono">
                      {hasPhone ? appointment.customerPhone : "Telefon Yok"}
                    </span>
                  </button>

                  {/* SMS */}
                  <button
                    type="button"
                    disabled={!hasPhone}
                    onClick={() => toggleChannel("SMS")}
                    className={cn(
                      "p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 cursor-pointer",
                      !hasPhone
                        ? "opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900"
                        : selectedChannels.includes("SMS")
                        ? "bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-2xs"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold flex items-center gap-1">
                        <Smartphone size={13} className={hasPhone && selectedChannels.includes("SMS") ? "text-indigo-600" : "text-slate-400"} />
                        <span>SMS</span>
                      </span>
                      {hasPhone && selectedChannels.includes("SMS") && (
                        <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[9px] font-bold">✓</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 truncate font-mono">
                      {hasPhone ? appointment.customerPhone : "Telefon Yok"}
                    </span>
                  </button>

                  {/* E-Posta */}
                  <button
                    type="button"
                    disabled={!hasEmail}
                    onClick={() => toggleChannel("EMAIL")}
                    className={cn(
                      "p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 cursor-pointer",
                      !hasEmail
                        ? "opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900"
                        : selectedChannels.includes("EMAIL")
                        ? "bg-sky-500/10 border-sky-500 text-sky-700 dark:text-sky-300 shadow-2xs"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold flex items-center gap-1">
                        <Mail size={13} className={hasEmail && selectedChannels.includes("EMAIL") ? "text-sky-600" : "text-slate-400"} />
                        <span>E-Posta</span>
                      </span>
                      {hasEmail && selectedChannels.includes("EMAIL") && (
                        <span className="w-3.5 h-3.5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[9px] font-bold">✓</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 truncate font-mono" title={appointment.customerEmail || undefined}>
                      {hasEmail ? appointment.customerEmail : "E-Posta Yok"}
                    </span>
                  </button>
                </div>

                {/* Preview */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <MessageSquare size={11} className="text-purple-500" />
                      <span>İletilecek Bildirim Önizlemesi:</span>
                    </span>
                    <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                      {selectedChannels.join(", ") || "Kanal seçilmedi"}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans bg-slate-50/70 dark:bg-slate-950/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800/60">
                    {previewMessage}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="h-10 px-4 rounded-xl text-xs font-semibold cursor-pointer border-slate-200 dark:border-slate-800"
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              disabled={isPending || !customReason.trim()}
              className="h-10 px-5 rounded-xl text-xs font-bold gap-1.5 cursor-pointer bg-sky-600 hover:bg-sky-500 text-white shadow-xs shadow-sky-500/20"
            >
              {isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <CalendarClock size={14} />
                  <span>Onayla ve Randevuyu Taşı</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
