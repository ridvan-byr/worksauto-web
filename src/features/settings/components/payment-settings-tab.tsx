"use client"

import * as React from "react"
import {
  CreditCard,
  Building2,
  Lock,
  ExternalLink,
  CheckCircle2,
  Eye,
  EyeOff,
  Smartphone,
  ShieldCheck,
  Check,
  Loader2,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/sonner"
import type { TenantSettings } from "@/features/settings/api/use-settings"
import { cn } from "@/lib/utils"
import { formatIban } from "@/lib/input-formatters"

interface PaymentSettingsTabProps {
  initialData?: TenantSettings
  onSave: (data: Partial<TenantSettings>) => Promise<void>
  isSaving: boolean
}

export function PaymentSettingsTab({
  initialData,
  onSave,
  isSaving,
}: PaymentSettingsTabProps) {
  // PayTR Credentials
  const [paytrMerchantId, setPaytrMerchantId] = React.useState("")
  const [paytrMerchantKey, setPaytrMerchantKey] = React.useState("")
  const [paytrMerchantSalt, setPaytrMerchantSalt] = React.useState("")
  const [showSecrets, setShowSecrets] = React.useState(false)

  // Bank Info
  const [bankName, setBankName] = React.useState("")
  const [iban, setIban] = React.useState("")
  const [accountHolder, setAccountHolder] = React.useState("")

  // Sync initial values
  React.useEffect(() => {
    if (initialData) {
      setPaytrMerchantId(initialData.paytrMerchantId || "")
      setPaytrMerchantKey(initialData.paytrMerchantKey || "")
      setPaytrMerchantSalt(initialData.paytrMerchantSalt || "")
      setBankName(initialData.bankName || "")
      setIban(initialData.iban || "")
      setAccountHolder(initialData.accountHolder || "")
    }
  }, [initialData])

  const isConfigured = Boolean(paytrMerchantId && paytrMerchantKey && paytrMerchantSalt)

  const handleSavePaytr = async () => {
    const hasAnyPaytr = Boolean(paytrMerchantId.trim() || paytrMerchantKey.trim() || paytrMerchantSalt.trim())
    if (hasAnyPaytr && (!paytrMerchantId.trim() || !paytrMerchantKey.trim() || !paytrMerchantSalt.trim())) {
      toast.error("Eksik PayTR bilgisi!", {
        description: "PayTR entegrasyonunu aktif etmek için Mağaza No, Parola ve Gizli Anahtar alanlarının üçü de doldurulmalıdır.",
      })
      return
    }

    try {
      await onSave({
        paytrMerchantId: paytrMerchantId.trim() || null,
        paytrMerchantKey: paytrMerchantKey.trim() || null,
        paytrMerchantSalt: paytrMerchantSalt.trim() || null,
        bankName: bankName.trim() || null,
        iban: iban.trim() || null,
        accountHolder: accountHolder.trim() || null,
      })
      toast.success("PayTR entegrasyon ayarları başarıyla kaydedildi.")
    } catch {
      toast.error("PayTR ayarları kaydedilirken hata oluştu.")
    }
  }

  const handleSaveBank = async () => {
    if (iban.trim()) {
      const cleanIban = iban.replace(/\s+/g, "").toUpperCase()
      if (!cleanIban.startsWith("TR") || cleanIban.length !== 26) {
        toast.error("Geçersiz IBAN formatı!", {
          description: "IBAN 'TR' ile başlamalı ve toplam 26 karakter olmalıdır.",
        })
        return
      }
    }

    try {
      await onSave({
        paytrMerchantId: paytrMerchantId.trim() || null,
        paytrMerchantKey: paytrMerchantKey.trim() || null,
        paytrMerchantSalt: paytrMerchantSalt.trim() || null,
        bankName: bankName.trim() || null,
        iban: iban.trim() || null,
        accountHolder: accountHolder.trim() || null,
      })
      toast.success("Banka ve IBAN bilgileri başarıyla kaydedildi.")
    } catch {
      toast.error("Banka bilgileri kaydedilirken hata oluştu.")
    }
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-br from-sky-500/10 via-indigo-500/5 to-transparent border border-slate-200/80 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20 shrink-0">
              <CreditCard size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  PayTR Sanal POS & Online Ödeme Altyapısı
                </h2>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                  isConfigured
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                )}>
                  {isConfigured ? "Entegrasyon Aktif" : "Yapılandırma Bekliyor"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Müşterilerinize WhatsApp veya SMS ile gönderdiğiniz ödeme linklerinden yapılan tahsilatlar doğrudan kendi banka hesabınıza yatar.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://www.paytr.com/magaza"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span>PayTR Mağaza Paneli</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: PayTR Credentials & Bank Account (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: PayTR Credentials */}
          <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
                    <Lock size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      PayTR API Anahtarları
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      PayTR Mağaza Paneli &gt; Entegrasyon &gt; Bilgiler alanından temin edebilirsiniz.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSecrets(!showSecrets)}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer font-medium"
                >
                  {showSecrets ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{showSecrets ? "Gizle" : "Anahtarları Göster"}</span>
                </button>
              </div>

              <div className="space-y-4">
                {/* Merchant ID */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <span>Mağaza Numarası (Merchant ID)</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="Örn: 123456"
                    value={paytrMerchantId}
                    onChange={(e) => setPaytrMerchantId(e.target.value.trim())}
                    className="h-10 rounded-xl font-mono text-xs"
                  />
                  <p className="text-[10px] text-slate-400">
                    PayTR tarafından işletmenize tahsis edilen 6 haneli numerik mağaza kimliği.
                  </p>
                </div>

                {/* Merchant Key */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <span>Mağaza Parolası (Merchant Key)</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type={showSecrets ? "text" : "password"}
                    placeholder="Örn: 2kP4k9Q8..."
                    value={paytrMerchantKey}
                    onChange={(e) => setPaytrMerchantKey(e.target.value.trim())}
                    className="h-10 rounded-xl font-mono text-xs"
                  />
                </div>

                {/* Merchant Salt */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <span>Mağaza Gizli Anahtarı (Merchant Salt)</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type={showSecrets ? "text" : "password"}
                    placeholder="Örn: mR4X7j9..."
                    value={paytrMerchantSalt}
                    onChange={(e) => setPaytrMerchantSalt(e.target.value.trim())}
                    className="h-10 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  Anahtarlarınız veritabanında güvenli şekilde saklanır. Müşteri ödeme linki açtığında doğrudan PayTR resmi güvenli iFrame altyapısı üzerinden 3D Secure ile tahsilat yapılır.
                </span>
              </div>

              {/* PayTR Card Footer Action */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-[11px] text-slate-400">
                  {isConfigured ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={13} /> PayTR Entegrasyonu Yapılandırıldı
                    </span>
                  ) : (
                    "Canlı tahsilat için 3 anahtarın da girilmesi gerekir."
                  )}
                </p>
                <Button
                  type="button"
                  onClick={handleSavePaytr}
                  disabled={isSaving}
                  className="h-9 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold gap-1.5 shadow-sm cursor-pointer w-full sm:w-auto justify-center"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>PayTR Ayarlarını Kaydet</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* Card 2: Bank & IBAN Information */}
          <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <Building2 size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Banka & IBAN Bilgileri (Havale / EFT)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Fatura, iş emri dökümleri ve müşteri takip sayfasında gösterilecek resmi banka hesabınız.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Banka Adı
                  </label>
                  <Input
                    placeholder="Örn: Garanti BBVA, Ziraat Bankası"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="h-10 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Hesap Sahibi Ünvanı
                  </label>
                  <Input
                    placeholder="Örn: AutoWorks Otomotiv Ltd. Şti."
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="h-10 rounded-xl text-xs"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    IBAN Numarası
                  </label>
                  <Input
                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                    value={iban}
                    maxLength={32}
                    onChange={(e) => setIban(formatIban(e.target.value))}
                    className="h-10 rounded-xl font-mono text-xs tracking-wider"
                  />
                  <p className="text-[10px] text-slate-400">
                    Müşterileriniz havale/EFT ile ödeme yaparken bu IBAN numarası ve hesap ünvanı gösterilir.
                  </p>
                </div>
              </div>

              {/* Bank Card Footer Action */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-[11px] text-slate-400">
                  Müşteri ödeme ekranında havale seçildiğinde bu hesap bilgileri gösterilir.
                </p>
                <Button
                  type="button"
                  onClick={handleSaveBank}
                  disabled={isSaving}
                  className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold gap-1.5 shadow-sm cursor-pointer w-full sm:w-auto justify-center"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>Banka & IBAN Bilgilerini Kaydet</span>
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Live Customer Preview & Features (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Customer Live Preview Card */}
          <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-sm bg-gradient-to-br from-slate-900 to-slate-950 text-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Smartphone size={12} />
                Müşteri Ödeme Ekranı Önizlemesi
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Canlı Görünüm
              </span>
            </div>

            {/* Mock Smartphone Screen */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div>
                  <p className="text-xs font-bold text-white">Servis Fatura Tahsilatı</p>
                  <p className="text-[10px] text-slate-400">#WO-2026-089</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-emerald-400 font-mono">₺ 3.850,00</p>
                  <p className="text-[9px] text-slate-400">KDV Dahil</p>
                </div>
              </div>

              {/* Virtual Mock Card */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white space-y-2 shadow-lg">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold">PayTR 3D Secure</span>
                  <CreditCard size={14} />
                </div>
                <p className="font-mono text-xs tracking-widest pt-1">•••• •••• •••• 4242</p>
                <div className="flex items-center justify-between text-[9px] text-white/80 pt-0.5">
                  <span>MÜŞTERİ KARTI</span>
                  <span>12/28</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-300 text-center flex items-center justify-center gap-1 pt-1">
                <Lock size={11} className="text-emerald-400" />
                <span>256-Bit SSL & 3D Secure Güvencesi</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>Taksitli kredi kartı tahsilat desteği</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>Tek tıkla WhatsApp ödeme linki gönderimi</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>Ödeme tamamlandığında faturanın otomatik kapanması</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
