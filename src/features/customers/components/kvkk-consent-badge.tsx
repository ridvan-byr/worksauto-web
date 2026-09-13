"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import QRCode from "qrcode"
import {
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  FileCheck,
  Sparkles,
  ExternalLink,
  QrCode,
  RefreshCw,
  Clock,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon"
import {
  useCustomerConsents,
  useSendConsentSms,
  useRecordDirectConsent,
} from "../api/use-consent"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/sonner"

export const formatConsentType = (type?: string) => {
  switch (type) {
    case "KVKK_AYDINLATMA":
      return "KVKK Aydınlatma & Açık Rıza Metni"
    case "COMMERCIAL_SMS":
      return "Ticari İleti İzni (İYS / SMS & WhatsApp)"
    case "COMMERCIAL_CALL":
      return "Ticari Sesli Arama İzni (İYS)"
    default:
      return type ? type.replace(/_/g, " ") : "Yasal Rıza"
  }
}

export const formatConsentChannel = (channel?: string) => {
  switch (channel) {
    case "SMS_LINK":
      return "SMS / QR Doğrulama Linki (Mobil)"
    case "PAPER_FORM":
      return "Islak İmzalı Fiziksel Form"
    case "IN_PERSON":
      return "Serviste Yüz Yüze Beyan"
    case "WEB_PORTAL":
      return "Müşteri Web Portalı"
    default:
      return channel ? channel.replace(/_/g, " ") : "Dijital Mobil Onay"
  }
}

interface KvkkConsentBadgeProps {
  customerId: string
  customerName?: string
  customerPhone?: string
  className?: string
}

export function KvkkConsentBadge({
  customerId,
  customerName,
  customerPhone,
  className,
}: KvkkConsentBadgeProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<"digital" | "manual">("digital")
  const [generatedLink, setGeneratedLink] = React.useState<string | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [directChannel, setDirectChannel] = React.useState<"PAPER_FORM" | "IN_PERSON">("PAPER_FORM")
  const [directCommercialSms, setDirectCommercialSms] = React.useState(true)
  const [mounted, setMounted] = React.useState(false)
  const [justApproved, setJustApproved] = React.useState(false)

  // Real-time polling every 2.5s while modal is open and awaiting approval
  const { data: consents, isLoading } = useCustomerConsents(customerId, {
    refetchInterval: isModalOpen ? 2500 : false,
  })

  const sendSmsMutation = useSendConsentSms()
  const directConsentMutation = useRecordDirectConsent()

  const isApproved = Boolean(consents?.isKvkkApproved)
  const hasCommercialSms = Boolean(consents?.isCommercialSmsApproved)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Detect when customer approves live while modal is open
  const prevApprovedRef = React.useRef(isApproved)
  React.useEffect(() => {
    if (!prevApprovedRef.current && isApproved && isModalOpen) {
      setJustApproved(true)
      toast.success("🎉 Müşteri dijital onayı tamamladı!", {
        description: "KVKK ve İYS kayıtları sisteme başarıyla işlendi.",
      })
    }
    prevApprovedRef.current = isApproved
  }, [isApproved, isModalOpen])

  // Helper to sanitize link without duplicate origin
  const sanitizeUrl = React.useCallback((url: string) => {
    if (!url) return ""
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url
    }
    const cleanPath = url.startsWith("/") ? url : `/${url}`
    return `${typeof window !== "undefined" ? window.location.origin : ""}${cleanPath}`
  }, [])

  // Derive existing link from history if present
  const latestToken = consents?.history?.find((h) => h.verificationToken)?.verificationToken
  React.useEffect(() => {
    if (!generatedLink && latestToken) {
      setGeneratedLink(sanitizeUrl(`/c/kvkk?token=${latestToken}`))
    }
  }, [latestToken, generatedLink, sanitizeUrl])

  // Generate QR Code data URL whenever generatedLink changes
  React.useEffect(() => {
    if (generatedLink) {
      QRCode.toDataURL(generatedLink, {
        width: 240,
        margin: 1.5,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error("QR Code Error:", err))
    } else {
      setQrCodeDataUrl(null)
    }
  }, [generatedLink])

  // Auto-generate verification link if modal is opened and no link exists
  const handleOpenModal = async () => {
    setIsModalOpen(true)
    setJustApproved(false)
    if (!isApproved && !generatedLink && !latestToken) {
      try {
        const res = await sendSmsMutation.mutateAsync({ customerId })
        setGeneratedLink(sanitizeUrl(res.verificationUrl))
      } catch {
        // Handled by toast
      }
    }
  }

  const handleGenerateFreshLink = async () => {
    try {
      const res = await sendSmsMutation.mutateAsync({ customerId })
      setGeneratedLink(sanitizeUrl(res.verificationUrl))
      toast.success("Yeni onay bağlantısı ve QR kodu üretildi.")
    } catch {
      // Handled by toast
    }
  }

  const handleCopyLink = () => {
    if (!generatedLink) return
    navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    toast.success("Onay linki panoya kopyalandı.")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDirectConsentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await directConsentMutation.mutateAsync({
        customerId,
        data: {
          channel: directChannel,
          commercialSms: directCommercialSms,
          policyVersion: "1.0",
        },
      })
      setIsModalOpen(false)
    } catch {
      // Handled by mutation toast
    }
  }

  const pageUrl = latestToken ? `/c/kvkk?token=${latestToken}` : `/c/kvkk`
  const formattedPhone = customerPhone ? customerPhone.replace(/\D/g, "") : ""
  const whatsappMessage = `Sayın ${customerName || "Müşterimiz"}, servis kabul ve KVKK yasal onayınızı güvenle tamamlamak için lütfen bağlantıya tıklayınız:\n\n${generatedLink || pageUrl}`
  const whatsappUrl = generatedLink
    ? `https://wa.me/${formattedPhone.startsWith("0") ? "9" + formattedPhone : "90" + formattedPhone}?text=${encodeURIComponent(whatsappMessage)}`
    : "#"

  if (isLoading) {
    return (
      <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs", className)}>
        <div className="w-2.5 h-2.5 rounded-full bg-slate-400 animate-pulse" />
        <span>KVKK...</span>
      </div>
    )
  }

  return (
    <>
      <div className={cn("inline-flex items-center gap-1.5", className)}>
        {isApproved ? (
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={handleOpenModal}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors cursor-pointer"
              title="KVKK Aydınlatma ve Onay Kaydı Detayları"
            >
              <ShieldCheck size={13} className="text-emerald-500" />
              <span>KVKK Onaylı</span>
              {hasCommercialSms && (
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 rounded font-mono">+İYS</span>
              )}
            </button>
            <a
              href={pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-6 h-6 rounded-full text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              title="Müşteri KVKK Sayfasını Ayrı Sekmede Aç"
            >
              <ExternalLink size={12} />
            </a>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleOpenModal}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors cursor-pointer"
              title="Müşteri onay bağlantısını aç veya QR kod üret"
            >
              <ShieldAlert size={13} className="text-rose-500" />
              <span>KVKK Onaysız</span>
            </button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenModal}
              disabled={sendSmsMutation.isPending}
              className="h-7 px-2.5 rounded-lg text-xs gap-1 font-semibold border-slate-200 dark:border-slate-800 hover:border-sky-500 cursor-pointer"
            >
              <QrCode size={13} className="text-sky-500" />
              <span>Onay Al</span>
            </Button>
          </div>
        )}
      </div>

      {/* Detail / Share Modal */}
      {mounted && isModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs",
                  isApproved
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                )}>
                  {isApproved ? <ShieldCheck size={22} /> : <Sparkles size={22} />}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{isApproved ? "KVKK & İYS Yasal Onay Detayı" : "Müşteri KVKK Onay Merkezi"}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {customerName || "Kayıtlı Müşteri"} ({customerPhone || "-"})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Live Success Banner if approved just now */}
            {justApproved && (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 size={20} />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-emerald-900 dark:text-emerald-200">Müşteri Onayı Başarıyla Alındı!</p>
                  <p className="text-emerald-700 dark:text-emerald-400 mt-0.5">Yasal onay kaydı zaman damgasıyla arşivlendi.</p>
                </div>
              </div>
            )}

            {isApproved ? (
              /* APPROVED STATE: Audit record view */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Onay Durumu:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 size={13} />
                      <span>Aktif & Yasal Olarak Geçerli</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Onay Tarihi:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {consents?.latestConsentDate
                        ? new Date(consents.latestConsentDate).toLocaleString("tr-TR")
                        : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Onay Kanalı:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formatConsentChannel(consents?.latestChannel || "SMS_LINK")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Ticari İYS SMS / WhatsApp:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {hasCommercialSms ? "✅ Onaylı (İletişim Açık)" : "❌ İzin Verilmedi"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Yasal Onay Geçmişi:</span>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {consents?.history?.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-[11px] flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {formatConsentType(rec.consentType)}
                          </p>
                          <p className="text-slate-400">
                            Kanal: {formatConsentChannel(rec.channel)} • v{rec.policyVersion}
                          </p>
                        </div>
                        <span className="text-slate-400 font-mono shrink-0">
                          {rec.grantedAt ? new Date(rec.grantedAt).toLocaleDateString("tr-TR") : "-"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <a
                    href={pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2 text-xs font-semibold transition-colors"
                  >
                    <ExternalLink size={14} />
                    <span>Müşteri Onay Sayfasını Ayrı Sekmede Aç</span>
                  </a>
                </div>
              </div>
            ) : (
              /* PENDING APPROVAL: Multi-channel center */
              <div className="space-y-4">
                {/* Navigation Tabs */}
                <div className="flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab("digital")}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                      activeTab === "digital"
                        ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    )}
                  >
                    <QrCode size={14} />
                    <span>Dijital Onay (QR & WhatsApp)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("manual")}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                      activeTab === "manual"
                        ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    )}
                  >
                    <FileCheck size={14} />
                    <span>Fiziksel Form (Manuel)</span>
                  </button>
                </div>

                {activeTab === "digital" ? (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Live Listening Banner */}
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-700 dark:text-sky-300">
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="animate-spin text-sky-500" />
                        <span className="font-semibold">Müşteri Onayı Bekleniyor</span>
                      </div>
                      <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">Canlı dinleniyor (Oto-onay)</span>
                    </div>

                    {/* QR Code Card */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center gap-4">
                      <div className="p-2 bg-white rounded-2xl border border-slate-200 shadow-sm shrink-0">
                        {qrCodeDataUrl ? (
                          <img
                            src={qrCodeDataUrl}
                            alt="Onay QR Kodu"
                            className="w-32 h-32 rounded-xl block"
                          />
                        ) : (
                          <div className="w-32 h-32 flex items-center justify-center text-slate-300">
                            <QrCode size={36} className="animate-pulse" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 text-center sm:text-left">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-400 text-[11px] font-bold">
                          <Sparkles size={12} />
                          <span>Bankoda En Hızlı Onay</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Müşteri Telefon Kamerasından Okutun
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Müşteriniz aracı bırakırken kamerasını QR koda tutarak saniyeler içinde sözleşmeyi inceleyip onaylayabilir.
                        </p>
                      </div>
                    </div>

                    {/* Link Copy & Actions */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-semibold text-slate-700 dark:text-slate-300">
                          Güvenli Doğrulama Bağlantısı:
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateFreshLink}
                          disabled={sendSmsMutation.isPending}
                          className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw size={11} className={cn(sendSmsMutation.isPending && "animate-spin")} />
                          <span>Yeni Link Üret</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={generatedLink || "Bağlantı hazırlanıyor..."}
                          className="flex-1 h-9.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-700 dark:text-slate-300 select-all"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCopyLink}
                          disabled={!generatedLink}
                          className="h-9.5 px-3 rounded-xl gap-1.5 text-xs font-semibold cursor-pointer shrink-0"
                        >
                          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          <span>{copied ? "Kopyalandı" : "Kopyala"}</span>
                        </Button>
                      </div>
                    </div>

                    {/* Multi-action Buttons */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <WhatsAppIcon size={16} className="text-white shrink-0" />
                        <span>WhatsApp ile Gönder</span>
                      </a>

                      <a
                        href={generatedLink || pageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <ExternalLink size={14} />
                        <span>Sayfayı Önizle</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  /* PHYSICAL / MANUAL FORM TAB */
                  <form onSubmit={handleDirectConsentSubmit} className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Fiziki / Islak İmzalı Onay Türü
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <label className={cn(
                          "flex items-center gap-2 p-3 rounded-xl border text-xs cursor-pointer transition-all",
                          directChannel === "PAPER_FORM"
                            ? "border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300 font-semibold"
                            : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                        )}>
                          <input
                            type="radio"
                            name="directChannel"
                            checked={directChannel === "PAPER_FORM"}
                            onChange={() => setDirectChannel("PAPER_FORM")}
                            className="text-sky-600"
                          />
                          <span>Islak İmzalı Form</span>
                        </label>

                        <label className={cn(
                          "flex items-center gap-2 p-3 rounded-xl border text-xs cursor-pointer transition-all",
                          directChannel === "IN_PERSON"
                            ? "border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300 font-semibold"
                            : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                        )}>
                          <input
                            type="radio"
                            name="directChannel"
                            checked={directChannel === "IN_PERSON"}
                            onChange={() => setDirectChannel("IN_PERSON")}
                            className="text-sky-600"
                          />
                          <span>Tezgah Üstü Beyan</span>
                        </label>
                      </div>

                      <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={directCommercialSms}
                          onChange={(e) => setDirectCommercialSms(e.target.checked)}
                          className="rounded text-sky-600"
                        />
                        <span className="font-medium">Ticari SMS / WhatsApp kampanya & bakım hatırlatma izni de alındı (İYS)</span>
                      </label>
                    </div>

                    <div className="flex gap-2 justify-end pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab("digital")}
                        className="text-xs"
                      >
                        Vazgeç
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={directConsentMutation.isPending}
                        className="h-10 px-4 rounded-xl text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                      >
                        <Check size={14} />
                        <span>{directConsentMutation.isPending ? "Kaydediliyor..." : "Fiziki Onayı Sisteme Kaydet"}</span>
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
