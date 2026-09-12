"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  ShieldCheck,
  ShieldAlert,
  Send,
  Copy,
  Check,
  MessageCircle,
  FileCheck,
  Sparkles,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
      return "SMS Doğrulama Linki (Mobil Onay)"
    case "PAPER_FORM":
      return "Islak İmzalı Fiziksel Form"
    case "IN_PERSON":
      return "Serviste Yüz Yüze Beyan"
    case "WEB_PORTAL":
      return "Müşteri Web Portalı"
    default:
      return channel ? channel.replace(/_/g, " ") : "SMS Doğrulama Linki"
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
  const { data: consents, isLoading } = useCustomerConsents(customerId)
  const sendSmsMutation = useSendConsentSms()
  const directConsentMutation = useRecordDirectConsent()

  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [generatedLink, setGeneratedLink] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [isDirectFormOpen, setIsDirectFormOpen] = React.useState(false)
  const [directChannel, setDirectChannel] = React.useState<"PAPER_FORM" | "IN_PERSON">("PAPER_FORM")
  const [directCommercialSms, setDirectCommercialSms] = React.useState(true)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (isLoading) {
    return (
      <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs", className)}>
        <div className="w-2.5 h-2.5 rounded-full bg-slate-400 animate-pulse" />
        <span>KVKK...</span>
      </div>
    )
  }

  const isApproved = Boolean(consents?.isKvkkApproved)
  const hasCommercialSms = Boolean(consents?.isCommercialSmsApproved)

  const handleSendSms = async () => {
    try {
      const res = await sendSmsMutation.mutateAsync({ customerId })
      const fullUrl = `${window.location.origin}${res.verificationUrl}`
      setGeneratedLink(fullUrl)
      setIsModalOpen(true)
    } catch {
      // Handled by mutation toast
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
      setIsDirectFormOpen(false)
      setIsModalOpen(false)
    } catch {
      // Handled by mutation toast
    }
  }

  const formattedPhone = customerPhone ? customerPhone.replace(/\D/g, "") : ""
  const whatsappUrl = generatedLink
    ? `https://wa.me/${formattedPhone.startsWith("0") ? "9" + formattedPhone : "90" + formattedPhone}?text=${encodeURIComponent(
        `Sn. ${customerName || "Müşterimiz"}, servis hizmet süreçlerimiz ve KVKK bilgilendirmemiz için lütfen bağlantıya tıklayarak onaylayınız: ${generatedLink}`
      )}`
    : "#"

  return (
    <>
      <div className={cn("inline-flex items-center gap-2", className)}>
        {isApproved ? (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors cursor-pointer"
            title="KVKK Aydınlatma ve Onay Kaydı Mevcut"
          >
            <ShieldCheck size={13} className="text-emerald-500" />
            <span>KVKK Onaylı</span>
            {hasCommercialSms && (
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 rounded font-mono">+İYS</span>
            )}
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <ShieldAlert size={13} className="text-rose-500" />
              <span>KVKK Onaysız</span>
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSendSms}
              disabled={sendSmsMutation.isPending}
              className="h-7 px-2.5 text-xs font-semibold rounded-lg gap-1 border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 cursor-pointer shadow-2xs"
            >
              {sendSmsMutation.isPending ? (
                <div className="w-3 h-3 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={11} />
              )}
              <span>Onay İste</span>
            </Button>
          </div>
        )}
      </div>

      {/* Detail / Share Modal */}
      {mounted && isModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center",
                  isApproved ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                )}>
                  {isApproved ? <ShieldCheck size={20} /> : <Sparkles size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {isApproved ? "KVKK & İYS Yasal Onay Detayı" : "Müşteri Onay Bağlantısı"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {customerName || "Kayıtlı Müşteri"} ({customerPhone || "-"})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg p-1"
              >
                ✕
              </button>
            </div>

            {isApproved ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Onay Durumu:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">🟢 Aktif & Geçerli</span>
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
                    <span className="text-slate-500 dark:text-slate-400">Ticari İYS SMS İzni:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {hasCommercialSms ? "✅ Onaylı (SMS & WhatsApp Açık)" : "❌ İzin Verilmedi"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Onay Geçmişi:</span>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
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
              </div>
            ) : (
              <div className="space-y-4">
                {generatedLink ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Müşteriye Gönderilecek Güvenli Onay Linki:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={generatedLink}
                          className="flex-1 h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs select-all"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCopyLink}
                          className="h-10 px-3 rounded-xl gap-1.5 text-xs font-semibold"
                        >
                          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          <span>{copied ? "Kopyalandı" : "Kopyala"}</span>
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 text-xs font-bold transition-colors shadow-xs"
                      >
                        <MessageCircle size={15} />
                        <span>WhatsApp ile Gönder</span>
                      </a>

                      <a
                        href={generatedLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2 text-xs font-semibold transition-colors"
                      >
                        <ExternalLink size={14} />
                        <span>Sayfayı Önizle</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Müşterinize SMS ile onay linki göndererek dijital imzasını ve açık rızasını alabilirsiniz.
                    </p>
                    <Button
                      type="button"
                      onClick={handleSendSms}
                      disabled={sendSmsMutation.isPending}
                      className="w-full h-11 rounded-2xl text-xs font-bold gap-2"
                    >
                      <Send size={14} />
                      <span>Onay Linki Üret ve Gönder</span>
                    </Button>
                  </div>
                )}

                {/* Direct paper/in-person option */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  {isDirectFormOpen ? (
                    <form onSubmit={handleDirectConsentSubmit} className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Fiziksel / Islak İmzalı Onay Kaydet</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs cursor-pointer">
                          <input
                            type="radio"
                            name="directChannel"
                            checked={directChannel === "PAPER_FORM"}
                            onChange={() => setDirectChannel("PAPER_FORM")}
                          />
                          <span>Islak İmzalı Form</span>
                        </label>
                        <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs cursor-pointer">
                          <input
                            type="radio"
                            name="directChannel"
                            checked={directChannel === "IN_PERSON"}
                            onChange={() => setDirectChannel("IN_PERSON")}
                          />
                          <span>Tezgah Üstü Sözlü</span>
                        </label>
                      </div>

                      <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={directCommercialSms}
                          onChange={(e) => setDirectCommercialSms(e.target.checked)}
                          className="rounded text-sky-600"
                        />
                        <span>Ticari SMS / İleti izni de alındı</span>
                      </label>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsDirectFormOpen(false)}
                          className="text-xs"
                        >
                          Vazgeç
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={directConsentMutation.isPending}
                          className="text-xs font-bold flex-1"
                        >
                          {directConsentMutation.isPending ? "Kaydediliyor..." : "Onayı Doğrudan Kaydet"}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsDirectFormOpen(true)}
                      className="w-full py-2 text-center text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FileCheck size={14} />
                      <span>Müşteri fiziki form imzaladı (Manuel Giriş)</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
