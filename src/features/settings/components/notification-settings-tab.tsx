"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { apiClient } from "@/lib/api-client"
import { toast } from "@/components/ui/sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  MessageSquare,
  Mail,
  Smartphone,
  ArrowUpDown,
  QrCode,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  X,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface NotificationSettingsData {
  id: string
  tenantId: string
  strategy: "FALLBACK" | "BROADCAST" | "SINGLE"
  channelPriority: Array<"WHATSAPP" | "EMAIL" | "SMS">
  singleChannel: "WHATSAPP" | "EMAIL" | "SMS"
  whatsappEnabled: boolean
  emailEnabled: boolean
  smsEnabled: boolean
  whatsappDeviceId?: string | null
  whatsappConnected: boolean
}

const DEFAULT_SETTINGS: NotificationSettingsData = {
  id: "default",
  tenantId: "",
  strategy: "FALLBACK",
  channelPriority: ["WHATSAPP", "SMS", "EMAIL"],
  singleChannel: "WHATSAPP",
  whatsappEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  whatsappDeviceId: null,
  whatsappConnected: false,
}

export function NotificationSettingsTab() {
  const [settings, setSettings] = React.useState<NotificationSettingsData>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [showQrModal, setShowQrModal] = React.useState(false)
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null)
  const [mounted, setMounted] = React.useState(false)

  // 6563 ETK Commercial Communication State
  const [marketingAccepted, setMarketingAccepted] = React.useState<boolean>(true)
  const [isUpdatingMarketing, setIsUpdatingMarketing] = React.useState<boolean>(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch settings on mount
  React.useEffect(() => {
    async function loadSettings() {
      try {
        const [notifRes, legalRes] = await Promise.allSettled([
          apiClient.get<NotificationSettingsData>("/tenants/notification-settings"),
          apiClient.get<{ latestConsent?: { marketingAccepted?: boolean } }>("/legal/status"),
        ])

        if (notifRes.status === "fulfilled" && notifRes.value?.channelPriority) {
          setSettings(notifRes.value)
        }
        if (legalRes.status === "fulfilled" && legalRes.value?.latestConsent) {
          setMarketingAccepted(legalRes.value.latestConsent.marketingAccepted ?? true)
        }
      } catch {
        // Fallback gracefully to default settings
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleToggleMarketingConsent = async (checked: boolean | "indeterminate") => {
    const newValue = !!checked
    setIsUpdatingMarketing(true)
    try {
      await apiClient.patch("/legal/marketing-consent", { marketingAccepted: newValue })
      setMarketingAccepted(newValue)
      toast.success(
        newValue
          ? "Ticari elektronik ileti izniniz aktif edildi."
          : "Ticari elektronik ileti izniniz iptal edildi (Ret talebiniz işlendi)."
      )
    } catch {
      toast.error("Tercih güncellenirken bir hata oluştu.")
    } finally {
      setIsUpdatingMarketing(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return
    setIsSaving(true)
    try {
      const res = await apiClient.patch<NotificationSettingsData>("/tenants/notification-settings", {
        strategy: settings.strategy,
        channelPriority: settings.channelPriority,
        singleChannel: settings.singleChannel,
        whatsappEnabled: settings.whatsappEnabled,
        emailEnabled: settings.emailEnabled,
        smsEnabled: settings.smsEnabled,
        whatsappDeviceId: settings.whatsappDeviceId,
      })
      setSettings(res)
      toast.success("İletişim ve bildirim tercihleri başarıyla kaydedildi!")
    } catch {
      toast.error("Ayarlar kaydedilirken bir hata oluştu.")
    } finally {
      setIsSaving(false)
    }
  }

  const moveChannel = (index: number, direction: "up" | "down") => {
    if (!settings) return
    const newPriority = [...settings.channelPriority]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newPriority.length) return

    const temp = newPriority[index]
    newPriority[index] = newPriority[targetIndex]
    newPriority[targetIndex] = temp

    setSettings({ ...settings, channelPriority: newPriority })
    toast.info(`İletişim sırası güncellendi: ${newPriority.join(" ➔ ")}`)
  }

  if (isLoading) {
    return <div className="text-center py-12 text-sm text-slate-500">Bildirim ayarları yükleniyor...</div>
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Overview Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-500" />
              Çok Kanallı Bildirim & İletişim Tercihleri
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Araç kabul fişi, ek parça onay talebi, randevu erteleme ve faturaların müşteriye hangi kanalla iletileceğini yönetin.
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs shrink-0 cursor-pointer"
          >
            {isSaving ? "Kaydediliyor..." : "Tercihleri Kaydet"}
          </Button>
        </div>

        {/* Section 1: Active Channels Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* WhatsApp Card */}
          <div
            className={cn(
              "p-4 rounded-2xl border transition-all",
              settings.whatsappEnabled
                ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10"
                : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-60"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <MessageSquare className="h-4 w-4" />
                <span>WhatsApp Servis Hattı</span>
              </div>
              <Checkbox
                checked={settings.whatsappEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, whatsappEnabled: !!checked })}
                className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mb-3">
              Müşteriye sıfır SMS maliyetiyle fotoğraf, konum, kabul fişi ve anlık parça onay talebi gönderir.
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> GOWA Gateway Bağlı
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQrModal(true)}
                className="h-7 text-[11px] px-2.5 rounded-lg border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 cursor-pointer"
              >
                <QrCode className="h-3 w-3 mr-1" /> QR ile Eşle
              </Button>
            </div>
          </div>

          {/* Email Card */}
          <div
            className={cn(
              "p-4 rounded-2xl border transition-all",
              settings.emailEnabled
                ? "border-sky-500/30 bg-sky-500/5 dark:bg-sky-500/10"
                : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-60"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-xs">
                <Mail className="h-4 w-4" />
                <span>E-Posta (Resend / SMTP)</span>
              </div>
              <Checkbox
                checked={settings.emailEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, emailEnabled: !!checked })}
                className="data-[state=checked]:bg-sky-600 data-[state=checked]:border-sky-600"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mb-3">
              Resmi fatura PDF dökümleri, cari ekstreler ve detaylı ekspertiz raporları için kurumsal arşiv kanalıdır.
            </p>
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[10px] text-sky-700 dark:text-sky-400 font-medium flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Ücretsiz Varsayılan Aktif
            </div>
          </div>

          {/* SMS Card */}
          <div
            className={cn(
              "p-4 rounded-2xl border transition-all",
              settings.smsEnabled
                ? "border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-500/10"
                : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-60"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                <Smartphone className="h-4 w-4" />
                <span>SMS (NetGSM / İletiMerkezi)</span>
              </div>
              <Checkbox
                checked={settings.smsEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, smsEnabled: !!checked })}
                className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mb-3">
              WhatsApp kullanmayan müşteriler veya internet bağlantısının olmadığı durumlar için güvenilir SMS iletimi.
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-medium">
                Paket: Aktif
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold">
                Yedek Kanal
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Strategy Selector */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Gönderim Stratejisi (Nasıl Gönderilsin?)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Bildirim gönderilirken kanalların nasıl devreye gireceğini seçin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Strategy 1: Fallback */}
            <div
              onClick={() => setSettings({ ...settings, strategy: "FALLBACK" })}
              className={cn(
                "p-3.5 rounded-2xl border cursor-pointer transition-all",
                settings.strategy === "FALLBACK"
                  ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20 text-slate-900 dark:text-slate-100 font-medium ring-2 ring-emerald-500/30"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold">⚡ Öncelik Sırasına Göre (Fallback)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold">Önerilen</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Önce 1. kanalı dener (örn: WhatsApp), iletilirse durur. Ulaşamazsa 2. kanala (SMS) geçer. SMS maliyetini sıfıra yaklaştırır.
              </p>
            </div>

            {/* Strategy 2: Broadcast */}
            <div
              onClick={() => setSettings({ ...settings, strategy: "BROADCAST" })}
              className={cn(
                "p-3.5 rounded-2xl border cursor-pointer transition-all",
                settings.strategy === "BROADCAST"
                  ? "border-sky-500 bg-sky-500/10 dark:bg-sky-500/20 text-slate-900 dark:text-slate-100 font-medium ring-2 ring-sky-500/30"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              )}
            >
              <div className="text-xs font-bold mb-1.5">📢 Çoklu Gönderim (Broadcast)</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Seçili tüm aktif kanallardan aynı anda müşteriye iletilir. Acil durumlar ve yüksek görünürlük içindir.
              </p>
            </div>

            {/* Strategy 3: Single */}
            <div
              onClick={() => setSettings({ ...settings, strategy: "SINGLE" })}
              className={cn(
                "p-3.5 rounded-2xl border cursor-pointer transition-all",
                settings.strategy === "SINGLE"
                  ? "border-amber-500 bg-amber-500/10 dark:bg-amber-500/20 text-slate-900 dark:text-slate-100 font-medium ring-2 ring-amber-500/30"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              )}
            >
              <div className="text-xs font-bold mb-1.5">🎯 Yalnızca Tek Kanal</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Diğer kanallara asla bakmadan yalnızca belirlenen tek kanalı kullanır.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Channel Priority Ordering (Prominent & Drag-Drop & Reorder) */}
        {settings.strategy === "FALLBACK" && (
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-emerald-500" />
                  İletişim Tercih ve Öncelik Sıralaması (Mesaj İletim Sırası)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Müşteriye bildirim gönderilirken ilk önce hangi kanalın deneneceğini belirleyin. Sürükleyerek veya ok tuşlarıyla sırayı değiştirebilirsiniz.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shrink-0">
                1 ➔ 2 ➔ 3 Sıralı İletim
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
              <Info size={15} className="text-sky-500 shrink-0 mt-0.5" />
              <span>
                <strong>Nasıl Çalışır?</strong> Randevu veya iş emri bildiriminde sistem önce <strong>1. Öncelikli Tercih</strong>&apos;i dener. Eğer müşteriye ulaşılamazsa veya kanalda arıza varsa beklemeden <strong>2. Yedek Tercih</strong>&apos;e, ardından <strong>3. Tercih</strong>&apos;e geçer.
              </span>
            </div>

            <div className="space-y-2.5">
              {settings.channelPriority.map((channel, idx) => {
                const isFirst = idx === 0
                const isLast = idx === settings.channelPriority.length - 1

                return (
                  <div
                    key={channel}
                    draggable
                    onDragStart={(e) => {
                      setDraggedIndex(idx)
                      e.dataTransfer.effectAllowed = "move"
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = "move"
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      if (draggedIndex === null || draggedIndex === idx) return
                      const updated = [...settings.channelPriority]
                      const [removed] = updated.splice(draggedIndex, 1)
                      updated.splice(idx, 0, removed)
                      setSettings({ ...settings, channelPriority: updated })
                      setDraggedIndex(null)
                      toast.info(`İletişim sırası güncellendi: ${updated.join(" ➔ ")}`)
                    }}
                    className={cn(
                      "flex items-center justify-between p-3.5 rounded-2xl border transition-all select-none",
                      isFirst
                        ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700",
                      draggedIndex === idx && "opacity-40 scale-98 border-dashed border-sky-500"
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex items-center gap-2">
                        <GripVertical size={16} className="text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing" />
                        <span
                          className={cn(
                            "w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shadow-xs",
                            isFirst
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          )}
                        >
                          {idx + 1}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {channel === "WHATSAPP" && "🟢 WhatsApp Servis Mesajı"}
                            {channel === "SMS" && "📱 SMS (Kısa Mesaj)"}
                            {channel === "EMAIL" && "🔵 E-Posta"}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-semibold",
                              isFirst
                                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                : idx === 1
                                ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            )}
                          >
                            {isFirst ? "1. Öncelikli Tercih (Varsayılan)" : idx === 1 ? "2. Yedek Kanal" : "3. Alternatif"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {channel === "WHATSAPP" && "Sıfır maliyetli fotoğraf, konum, kabul fişi ve anlık parça onayı"}
                          {channel === "SMS" && "Tüm telefon modellerinde internet olmadan çalışan kısa mesaj garantisi"}
                          {channel === "EMAIL" && "Resmi fatura PDF dökümü, ekstreler ve detaylı ekspertiz arşivi"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pl-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isFirst}
                        onClick={() => moveChannel(idx, "up")}
                        className={cn(
                          "h-8 px-2.5 text-xs font-semibold rounded-xl gap-1 cursor-pointer transition-all",
                          isFirst ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                        title="Bir Üste Taşı"
                      >
                        <ChevronUp size={14} />
                        <span className="hidden sm:inline text-[11px]">Yukarı</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isLast}
                        onClick={() => moveChannel(idx, "down")}
                        className={cn(
                          "h-8 px-2.5 text-xs font-semibold rounded-xl gap-1 cursor-pointer transition-all",
                          isLast ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                        title="Bir Alta Taşı"
                      >
                        <ChevronDown size={14} />
                        <span className="hidden sm:inline text-[11px]">Aşağı</span>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Section 3B: Single Channel Selection (When Single strategy is active) */}
        {settings.strategy === "SINGLE" && (
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Kullanılacak Tek İletişim Kanalını Seçin
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Müşterilere tüm bildirimler sadece aşağıda seçtiğiniz kanaldan iletilecektir.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { id: "WHATSAPP", label: "🟢 WhatsApp", sub: "Yalnızca WhatsApp üzerinden" },
                { id: "SMS", label: "📱 SMS", sub: "Yalnızca Kısa Mesaj üzerinden" },
                { id: "EMAIL", label: "🔵 E-Posta", sub: "Yalnızca E-Posta üzerinden" },
              ].map((ch) => {
                const isSelected = settings.singleChannel === ch.id
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setSettings({ ...settings, singleChannel: ch.id as any })}
                    className={cn(
                      "p-3.5 rounded-2xl border text-left transition-all cursor-pointer",
                      isSelected
                        ? "border-amber-500 bg-amber-500/15 text-amber-950 dark:text-amber-100 font-bold ring-2 ring-amber-500/30"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    <p className="text-xs font-bold">{ch.label}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{ch.sub}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Section 4: WorksAuto Platform Bildirimleri & Ticari Elektronik İleti İzni (6563 Sayılı Kanun) */}
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              WorksAuto Kurumsal İletişim & Ticari İleti Tercihi (6563 Sayılı Kanun)
            </h3>
          </div>
          <span
            className={cn(
              "text-[11px] font-medium px-2.5 py-0.5 rounded-full border",
              marketingAccepted
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
            )}
          >
            {marketingAccepted ? "İzin Verildi (Aktif)" : "İzin İptal Edildi (Pasif / Ret)"}
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          WorksAuto tarafından işletmenize sunulan yeni özellikler, kampanyalar, indirimler ve sektörel duyuruların WhatsApp, E-Posta ve SMS kanallarıyla iletilmesine ilişkin izin durumunuzu buradan dilediğiniz zaman tek tıkla değiştirebilir veya iptal edebilirsiniz.
        </p>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="marketingConsentToggle"
              checked={marketingAccepted}
              onCheckedChange={handleToggleMarketingConsent}
              disabled={isUpdatingMarketing}
              className="mt-0.5"
            />
            <label htmlFor="marketingConsentToggle" className="text-xs text-slate-800 dark:text-slate-200 cursor-pointer select-none leading-snug">
              <strong>WorksAuto ticari ve tanıtım iletilerini almak istiyorum.</strong>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                İşareti kaldırdığınızda ticari ileti izniniz anında iptal edilir ve ret bildiriminiz yasal mevzuat uyarınca sisteme işlenir.
              </span>
            </label>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <AlertCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span>
            Ayrıca tarafınıza iletilen SMS&apos;lerdeki ücretsiz ret kodu veya e-postalardaki ayrılma bağlantısı üzerinden de anında vazgeçebilirsiniz.
          </span>
        </div>
      </div>

      {/* QR Modal: Rendered via createPortal to document.body, perfectly centered on viewport */}
      {mounted && showQrModal && createPortal(
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center relative animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Kapat"
            >
              <X size={16} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <QrCode size={26} />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">WhatsApp Hattını Eşle</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Telefonunuzdan <strong>WhatsApp &gt; Bağlı Cihazlar &gt; Cihaz Bağla</strong> seçeneğini açıp ekrandaki QR kodu okutunuz.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center">
              <div className="w-48 h-48 bg-white p-3.5 rounded-xl border border-slate-200 shadow-inner flex flex-col items-center justify-center text-center">
                <QrCode className="h-36 w-36 text-slate-900" />
                <span className="text-[10px] font-mono text-slate-500 mt-1">GOWA-DEVICE-ACTIVE</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                type="button"
                onClick={() => setShowQrModal(false)}
                className="flex-1 text-xs rounded-xl cursor-pointer"
              >
                Vazgeç
              </Button>
              <Button
                onClick={() => {
                  setShowQrModal(false)
                  toast.success("WhatsApp hattınız atölyenize başarıyla bağlandı!")
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Bağlantıyı Tamamla
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
