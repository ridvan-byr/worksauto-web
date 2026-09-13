"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { apiClient } from "@/lib/api-client"
import { toast } from "@/components/ui/sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon"
import {
  Mail,
  Smartphone,
  ArrowUpDown,
  QrCode,
  Check,
  ShieldCheck,
  AlertCircle,
  X,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Info,
  Loader2,
  RefreshCw,
  Send,
  LogOut,
  BellRing,
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
  const draggedIndexRef = React.useRef<number | null>(null)
  const initialOrderRef = React.useRef<string[]>([])
  const channelPriorityRef = React.useRef(settings.channelPriority)
  React.useEffect(() => {
    channelPriorityRef.current = settings.channelPriority
  }, [settings.channelPriority])
  const [mounted, setMounted] = React.useState(false)

  // 6563 ETK Commercial Communication State
  const [marketingAccepted, setMarketingAccepted] = React.useState<boolean>(true)
  const [isUpdatingMarketing, setIsUpdatingMarketing] = React.useState<boolean>(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Live WhatsApp Gateway State
  const [waConnected, setWaConnected] = React.useState<boolean>(false)
  const [waJid, setWaJid] = React.useState<string | null>(null)
  const [waDisplayName, setWaDisplayName] = React.useState<string | null>(null)
  const [, setIsCheckingWa] = React.useState<boolean>(false)
  const [isDisconnectingWa, setIsDisconnectingWa] = React.useState<boolean>(false)

  // QR Modal State
  const [qrLoading, setQrLoading] = React.useState<boolean>(false)
  const [qrImageSrc, setQrImageSrc] = React.useState<string | null>(null)
  const [qrSecondsLeft, setQrSecondsLeft] = React.useState<number>(90)
  const [qrError, setQrError] = React.useState<string | null>(null)
  const [isPairedSuccess, setIsPairedSuccess] = React.useState<boolean>(false)

  // Test Message State
  const [testPhone, setTestPhone] = React.useState<string>("")
  const [isSendingTest, setIsSendingTest] = React.useState<boolean>(false)

  const checkWhatsAppStatus = React.useCallback(async () => {
    try {
      setIsCheckingWa(true)
      const res = await apiClient.get<{
        connected: boolean
        state: string
        jid?: string
        displayName?: string
      }>("/notifications/whatsapp/status")
      setWaConnected(res.connected)
      setWaJid(res.jid || null)
      setWaDisplayName(res.displayName || null)
      return res
    } catch {
      return null
    } finally {
      setIsCheckingWa(false)
    }
  }, [])

  const fetchQrCode = React.useCallback(async () => {
    setQrLoading(true)
    setQrError(null)
    try {
      const res = await apiClient.get<{
        success: boolean
        qrLink?: string
        qrBase64?: string
        qrDuration?: number
        error?: string
      }>("/notifications/whatsapp/qr")
      if (res.success && (res.qrBase64 || res.qrLink)) {
        setQrImageSrc(res.qrBase64 || res.qrLink || null)
        setQrSecondsLeft(Math.max(res.qrDuration || 90, 90))
      } else {
        setQrError(res.error || "QR kod üretilemedi.")
      }
    } catch {
      setQrError("GOWA WhatsApp servisine bağlanılamadı.")
    } finally {
      setQrLoading(false)
    }
  }, [])

  const handleOpenQrModal = async () => {
    const current = await checkWhatsAppStatus()
    if (current?.connected) {
      toast.success("WhatsApp hattınız zaten bağlı durumda!")
      return
    }
    setIsPairedSuccess(false)
    setShowQrModal(true)
    fetchQrCode()
  }

  const handleDisconnectWa = async () => {
    setIsDisconnectingWa(true)
    try {
      await apiClient.post("/notifications/whatsapp/disconnect")
      setWaConnected(false)
      setWaJid(null)
      toast.info("WhatsApp cihaz bağlantısı başarıyla sonlandırıldı.")
    } catch {
      toast.error("Bağlantı kesilirken hata oluştu.")
    } finally {
      setIsDisconnectingWa(false)
    }
  }

  const handleSendTestMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const clean = testPhone.trim()
    if (!clean) {
      toast.warning("Lütfen bir telefon numarası giriniz.")
      return
    }
    setIsSendingTest(true)
    try {
      const res = await apiClient.post<{
        success: boolean
        error?: string
        messageId?: string
      }>("/notifications/whatsapp/test-message", { phone: clean })
      if (res.success) {
        toast.success(`WhatsApp test mesajı başarıyla iletildi! (${clean})`)
      } else {
        toast.error(
          `WhatsApp mesajı gönderilemedi: ${res.error || "Cihaz bağlı olmayabilir."}`
        )
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string }
      toast.error(apiErr?.message || "Test mesajı gönderilirken hata oluştu.")
    } finally {
      setIsSendingTest(false)
    }
  }

  // Poll WhatsApp status and countdown QR code timer
  React.useEffect(() => {
    if (!showQrModal || isPairedSuccess) return

    const pollInterval = setInterval(async () => {
      const status = await checkWhatsAppStatus()
      if (status?.connected) {
        setIsPairedSuccess(true)
        setWaConnected(true)
        clearInterval(pollInterval)
        toast.success("Tebrikler! WhatsApp hattınız başarıyla bağlandı.")
        setTimeout(() => {
          setShowQrModal(false)
          setIsPairedSuccess(false)
        }, 2600)
      }
    }, 2000)

    const timerInterval = setInterval(() => {
      setQrSecondsLeft((prev) => {
        if (prev <= 1) {
          fetchQrCode()
          return 90
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearInterval(pollInterval)
      clearInterval(timerInterval)
    }
  }, [showQrModal, isPairedSuccess, checkWhatsAppStatus, fetchQrCode])

  // Fetch settings on mount
  React.useEffect(() => {
    async function loadSettings() {
      try {
        const [notifRes, legalRes, waRes] = await Promise.allSettled([
          apiClient.get<NotificationSettingsData>(
            "/tenants/notification-settings"
          ),
          apiClient.get<{ latestConsent?: { marketingAccepted?: boolean } }>(
            "/legal/status"
          ),
          apiClient.get<{
            connected: boolean
            state: string
            jid?: string
            displayName?: string
          }>("/notifications/whatsapp/status"),
        ])

        if (notifRes.status === "fulfilled" && notifRes.value?.channelPriority) {
          setSettings(notifRes.value)
        }
        if (legalRes.status === "fulfilled" && legalRes.value?.latestConsent) {
          setMarketingAccepted(
            legalRes.value.latestConsent.marketingAccepted ?? true
          )
        }
        if (waRes.status === "fulfilled" && waRes.value) {
          setWaConnected(waRes.value.connected)
          setWaJid(waRes.value.jid || null)
          setWaDisplayName(waRes.value.displayName || null)
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

  const handleLiveReorder = (targetIdx: number) => {
    const currentDragged = draggedIndexRef.current
    if (currentDragged === null || currentDragged === targetIdx) return

    setSettings((prev) => {
      const updated = [...prev.channelPriority]
      const [removed] = updated.splice(currentDragged, 1)
      updated.splice(targetIdx, 0, removed)
      return { ...prev, channelPriority: updated }
    })

    draggedIndexRef.current = targetIdx
    setDraggedIndex(targetIdx)
  }

  const handleDragEnd = () => {
    draggedIndexRef.current = null
    setDraggedIndex(null)
    const current = channelPriorityRef.current
    const initial = initialOrderRef.current
    if (initial.length > 0 && initial.join(",") !== current.join(",")) {
      toast.info(`İletişim sırası güncellendi: ${current.join(" ➔ ")}`)
    }
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
              <BellRing className="h-5 w-5 text-emerald-500" />
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
                <WhatsAppIcon size={16} className="text-emerald-500 shrink-0" />
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
              {waConnected ? (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Bağlı {waDisplayName ? `${waDisplayName} ` : ''}{waJid ? `(+${waJid.split('@')[0]})` : ''}</span>
                </div>
              ) : (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Eşleşme Bekleniyor
                </span>
              )}

              {waConnected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnectWa}
                  disabled={isDisconnectingWa}
                  className="h-7 text-[11px] px-2.5 rounded-lg border-rose-500/30 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 cursor-pointer"
                >
                  <LogOut className="h-3 w-3 mr-1" /> Hattı Ayır
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenQrModal}
                  className="h-7 text-[11px] px-2.5 rounded-lg border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 cursor-pointer"
                >
                  <QrCode className="h-3 w-3 mr-1" /> QR ile Eşle
                </Button>
              )}
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

        {/* Live WhatsApp Test Box */}
        <div className="mb-6 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs">
              <WhatsAppIcon size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Canlı WhatsApp Bildirim Testi
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {waConnected
                  ? "Hattınız bağlı. Telefon numaranızı girerek anlık test mesajı gönderebilirsiniz."
                  : "Hattınız henüz bağlanmadı. Test gönderebilmek için yukarıdaki 'QR ile Eşle' butonuna tıklayınız."}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSendTestMessage}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <input
              type="text"
              placeholder="05xxxxxxxxx"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="h-8 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full sm:w-36 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
            <Button
              type="submit"
              size="sm"
              disabled={isSendingTest || !testPhone.trim()}
              className="h-8 text-xs font-semibold px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shrink-0 gap-1"
            >
              {isSendingTest ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              <span>Test Gönder</span>
            </Button>
          </form>
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
                <span className="text-xs font-bold">Öncelik Sırasına Göre (Fallback)</span>
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
              <div className="text-xs font-bold mb-1.5">Çoklu Gönderim (Broadcast)</div>
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
              <div className="text-xs font-bold mb-1.5">Yalnızca Tek Kanal</div>
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
                      draggedIndexRef.current = idx
                      setDraggedIndex(idx)
                      initialOrderRef.current = [...settings.channelPriority]
                      e.dataTransfer.effectAllowed = "move"
                      e.dataTransfer.setData("text/plain", `${idx}`)
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault()
                      handleLiveReorder(idx)
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = "move"
                      handleLiveReorder(idx)
                    }}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => {
                      e.preventDefault()
                      handleDragEnd()
                    }}
                    className={cn(
                      "flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-150 select-none cursor-grab active:cursor-grabbing",
                      isFirst
                        ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700",
                      draggedIndex === idx && "opacity-60 scale-[0.99] border-dashed border-sky-500 bg-sky-500/10 shadow-md ring-2 ring-sky-500/30"
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
                          <div className="flex items-center gap-1.5">
                            {channel === "WHATSAPP" && (
                              <WhatsAppIcon size={14} className="text-emerald-500 shrink-0" />
                            )}
                            {channel === "SMS" && (
                              <Smartphone size={14} className="text-sky-500 shrink-0" />
                            )}
                            {channel === "EMAIL" && (
                              <Mail size={14} className="text-indigo-500 shrink-0" />
                            )}
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {channel === "WHATSAPP" && "WhatsApp Servis Mesajı"}
                              {channel === "SMS" && "SMS (Kısa Mesaj)"}
                              {channel === "EMAIL" && "E-Posta"}
                            </span>
                          </div>
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
                {
                  id: "WHATSAPP",
                  label: "WhatsApp",
                  sub: "Yalnızca WhatsApp üzerinden",
                  icon: WhatsAppIcon,
                  color: "text-emerald-500",
                },
                {
                  id: "SMS",
                  label: "SMS",
                  sub: "Yalnızca Kısa Mesaj üzerinden",
                  icon: Smartphone,
                  color: "text-sky-500",
                },
                {
                  id: "EMAIL",
                  label: "E-Posta",
                  sub: "Yalnızca E-Posta üzerinden",
                  icon: Mail,
                  color: "text-indigo-500",
                },
              ].map((ch) => {
                const isSelected = settings.singleChannel === ch.id
                const Icon = ch.icon
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        singleChannel: ch.id as NotificationSettingsData["singleChannel"],
                      })
                    }
                    className={cn(
                      "p-3.5 rounded-2xl border text-left transition-all cursor-pointer",
                      isSelected
                        ? "border-amber-500 bg-amber-500/15 text-amber-950 dark:text-amber-100 font-bold ring-2 ring-amber-500/30"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon size={14} className={ch.color} />
                      <p className="text-xs font-bold">{ch.label}</p>
                    </div>
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

            <div
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center mx-auto transition-all duration-300",
                isPairedSuccess
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              )}
            >
              {isPairedSuccess ? (
                <Check size={20} className="stroke-[2.5]" />
              ) : (
                <WhatsAppIcon size={22} />
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                {isPairedSuccess ? "Hattınız Başarıyla Eşleştirildi" : "WhatsApp Servis Hattını Eşle"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isPairedSuccess
                  ? "Bağlantı doğrulandı, ayarlar güncelleniyor..."
                  : "Telefonunuzdan WhatsApp > Bağlı Cihazlar > Cihaz Bağla ile QR kodu okutunuz."}
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center min-h-[220px]">
              {qrLoading ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                  <span className="text-xs text-slate-500">QR kod üretiliyor...</span>
                </div>
              ) : qrError ? (
                <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                  <AlertCircle className="h-8 w-8 text-rose-500" />
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-medium px-4">
                    {qrError}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchQrCode}
                    className="mt-2 text-xs rounded-xl cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" /> Tekrar Dene
                  </Button>
                </div>
              ) : qrImageSrc ? (
                <div className="flex flex-col items-center">
                  <div className="w-48 h-48 bg-white dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner flex items-center justify-center relative overflow-hidden">
                    <img
                      src={qrImageSrc}
                      alt="WhatsApp QR Code"
                      className={cn(
                        "w-full h-full object-contain transition-all duration-300",
                        isPairedSuccess && "blur-[2px] opacity-15 scale-95"
                      )}
                    />

                    {/* Sleek, Animated SVG Checkmark Success Overlay */}
                    {isPairedSuccess && (
                      <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200 text-center">
                        <style
                          dangerouslySetInnerHTML={{
                            __html: `
                              @keyframes drawCircle {
                                0% { stroke-dashoffset: 157; }
                                100% { stroke-dashoffset: 0; }
                              }
                              @keyframes drawCheck {
                                0% { stroke-dashoffset: 36; }
                                100% { stroke-dashoffset: 0; }
                              }
                            `,
                          }}
                        />
                        <div className="relative flex items-center justify-center mb-2">
                          <svg className="w-13 h-13 text-emerald-500" viewBox="0 0 52 52">
                            <circle
                              cx="26"
                              cy="26"
                              r="23"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              style={{
                                strokeDasharray: 157,
                                strokeDashoffset: 157,
                                animation: "drawCircle 0.45s cubic-bezier(0.65, 0, 0.45, 1) forwards",
                              }}
                            />
                            <path
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16 27l7 7 14-14"
                              style={{
                                strokeDasharray: 36,
                                strokeDashoffset: 36,
                                animation: "drawCheck 0.35s 0.35s cubic-bezier(0.65, 0, 0.45, 1) forwards",
                              }}
                            />
                          </svg>
                        </div>
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[170px] animate-in fade-in duration-500 delay-300">
                          {waDisplayName || "WhatsApp Hattı"}
                        </span>
                        {waJid && (
                          <span className="text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400 mt-0.5 animate-in fade-in duration-500 delay-300">
                            +{waJid.split('@')[0]}
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-md bg-emerald-500/10 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 animate-in fade-in duration-500 delay-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Çevrimiçi & Aktif</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {!isPairedSuccess && (
                    <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <span>
                        Kodun geçerlilik süresi: <strong>{qrSecondsLeft} sn</strong>
                      </span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {isPairedSuccess
                ? "Bağlantı doğrulandı, panel güncelleniyor..."
                : "Telefonunuz kodu okuttuğunda bu pencere otomatik olarak kapanacak ve hattınız aktifleşecektir."}
            </p>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                type="button"
                disabled={isPairedSuccess}
                onClick={() => setShowQrModal(false)}
                className="flex-1 text-xs rounded-xl cursor-pointer"
              >
                {isPairedSuccess ? "Tamamlandı" : "Vazgeç"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={fetchQrCode}
                disabled={qrLoading}
                className="flex-1 text-xs rounded-xl cursor-pointer gap-1"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", qrLoading && "animate-spin")} />
                Yenile
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
