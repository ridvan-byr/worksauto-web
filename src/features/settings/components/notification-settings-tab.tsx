"use client"

import * as React from "react"
import { apiClient } from "@/lib/api-client"
import { toast } from "@/components/ui/sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { MessageSquare, Mail, Smartphone, ArrowUpDown, QrCode, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react"

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

export function NotificationSettingsTab() {
  const [settings, setSettings] = React.useState<NotificationSettingsData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [showQrModal, setShowQrModal] = React.useState(false)

  // Fetch settings on mount
  React.useEffect(() => {
    async function loadSettings() {
      try {
        const res = await apiClient.get<NotificationSettingsData>("/tenants/notification-settings")
        setSettings(res)
      } catch (err: unknown) {
        toast.error("Bildirim ayarları yüklenemedi.")
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

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
      toast.success("İletişim ve bildirim tercihleri başarıyla güncellendi!")
    } catch (err: unknown) {
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
  }

  if (isLoading) {
    return <div className="text-center py-12 text-sm text-slate-500">Bildirim ayarları yükleniyor...</div>
  }

  if (!settings) return null

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Overview Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-500" />
              Çok Kanallı Bildirim & İletişim Tercihleri
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Araç kabul fişi, ek parça onay talebi, randevu hatırlatma ve faturaların müşteriye hangi kanalla iletileceğini yönetin.
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm"
          >
            {isSaving ? "Kaydediliyor..." : "Tercihleri Kaydet"}
          </Button>
        </div>

        {/* Section 1: Active Channels Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* WhatsApp Card */}
          <div className={`p-4 rounded-xl border transition-all ${
            settings.whatsappEnabled 
              ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10" 
              : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-60"
          }`}>
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
                className="h-7 text-[11px] px-2.5 rounded-lg border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              >
                <QrCode className="h-3 w-3 mr-1" /> QR ile Eşle
              </Button>
            </div>
          </div>

          {/* Email Card */}
          <div className={`p-4 rounded-xl border transition-all ${
            settings.emailEnabled 
              ? "border-sky-500/30 bg-sky-500/5 dark:bg-sky-500/10" 
              : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-60"
          }`}>
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
          <div className={`p-4 rounded-xl border transition-all ${
            settings.smsEnabled 
              ? "border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10" 
              : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-60"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                <Smartphone className="h-4 w-4" />
                <span>SMS Sağlayıcısı (NetGSM / Twilio)</span>
              </div>
              <Checkbox
                checked={settings.smsEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, smsEnabled: !!checked })}
                className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mb-3">
              İnterneti veya akıllı telefonu olmayan müşterilere kısa mesaj ile kritik tek tık link ulaştırır.
            </p>
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[10px] text-amber-700 dark:text-amber-400 font-medium">
              <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Ücretli Paket Gerekir</span>
              <span className="text-[10px] underline cursor-pointer">Kredi Yükle</span>
            </div>
          </div>
        </div>

        {/* Section 2: Strategy Mode Selector */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Gönderim Stratejisi (Nasıl Gönderilsin?)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Strategy 1: Fallback */}
            <div
              onClick={() => setSettings({ ...settings, strategy: "FALLBACK" })}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                settings.strategy === "FALLBACK"
                  ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20 text-slate-900 dark:text-slate-100 font-medium"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold">⚡ Öncelik Sırasına Göre (Fallback)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold">Önerilen</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Önce 1. kanalı dener, iletilirse durur. Ulaşamazsa 2. kanala geçer. SMS maliyetini minimuma indirir.
              </p>
            </div>

            {/* Strategy 2: Broadcast */}
            <div
              onClick={() => setSettings({ ...settings, strategy: "BROADCAST" })}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                settings.strategy === "BROADCAST"
                  ? "border-sky-500 bg-sky-500/10 dark:bg-sky-500/20 text-slate-900 dark:text-slate-100 font-medium"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <div className="text-xs font-bold mb-1.5">📢 Çoklu Gönderim (Broadcast)</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Seçili tüm aktif kanallardan aynı anda müşteriye iletilir. Acil durumlar ve yüksek görünürlük içindir.
              </p>
            </div>

            {/* Strategy 3: Single */}
            <div
              onClick={() => setSettings({ ...settings, strategy: "SINGLE" })}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                settings.strategy === "SINGLE"
                  ? "border-amber-500 bg-amber-500/10 dark:bg-amber-500/20 text-slate-900 dark:text-slate-100 font-medium"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <div className="text-xs font-bold mb-1.5">🎯 Yalnızca Tek Kanal</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Diğer kanallara asla bakmadan yalnızca belirlenen tek kanalı kullanır.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Channel Priority Ordering (When Fallback is active) */}
        {settings.strategy === "FALLBACK" && (
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5" /> Fallback Öncelik Sıralaması
              </h3>
              <span className="text-[11px] text-slate-500">Yukarı/Aşağı butonlarıyla sırayı değiştirebilirsiniz</span>
            </div>

            <div className="space-y-2">
              {settings.channelPriority.map((channel, idx) => (
                <div
                  key={channel}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {channel === "WHATSAPP" && "🟢 WhatsApp (Sıfır Maliyetli İşlem Mesajı)"}
                      {channel === "EMAIL" && "🔵 E-Posta (Resmi Fatura & PDF Raporu)"}
                      {channel === "SMS" && "📱 SMS (Kısa Mesaj Alternatifi)"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={idx === 0}
                      onClick={() => moveChannel(idx, "up")}
                      className="h-7 w-7 p-0 text-xs text-slate-500"
                    >
                      ▲
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={idx === settings.channelPriority.length - 1}
                      onClick={() => moveChannel(idx, "down")}
                      className="h-7 w-7 p-0 text-xs text-slate-500"
                    >
                      ▼
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* QR Modal Simulation */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <QrCode size={28} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">WhatsApp Hattını Eşle</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Telefonunuzdan <strong>WhatsApp &gt; Bağlı Cihazlar &gt; Cihaz Bağla</strong> seçeneğini açıp ekrandaki QR kodu okutunuz.
              </p>
            </div>
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
              <div className="w-44 h-44 bg-white p-3 rounded-lg border border-slate-300 shadow-inner flex flex-col items-center justify-center text-center">
                <QrCode className="h-32 w-32 text-slate-900" />
                <span className="text-[10px] font-mono text-slate-500">GOWA-DEVICE-ACTIVE</span>
              </div>
            </div>
            <Button
              onClick={() => {
                setShowQrModal(false)
                toast.success("WhatsApp hattınız atölyenize başarıyla bağlandı!")
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2 rounded-xl"
            >
              Bağlantıyı Tamamla
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
