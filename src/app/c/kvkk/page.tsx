"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  ChevronDown,
  ChevronUp,
  FileText,
  Lock,
  MessageSquare,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useVerifyConsentToken, useConfirmConsent } from "@/features/customers/api/use-consent"
import { BrandLogo } from "@/components/shared/brand-logo"

export default function PublicKvkkConsentPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ConsentContent />
    </React.Suspense>
  )
}

function ConsentContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const { data: verification, isLoading, error } = useVerifyConsentToken(token)
  const confirmMutation = useConfirmConsent()

  const [kvkkChecked, setKvkkChecked] = React.useState(true)
  const [commercialSmsChecked, setCommercialSmsChecked] = React.useState(true)
  const [expandedSection, setExpandedSection] = React.useState<"aydinlatma" | "riza" | null>("aydinlatma")
  const [confirmedData, setConfirmedData] = React.useState<{ grantedAt: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !kvkkChecked) return

    try {
      const res = await confirmMutation.mutateAsync({
        token,
        data: {
          explicitConsent: kvkkChecked,
          commercialSms: commercialSmsChecked,
        },
      })
      setConfirmedData(res)
    } catch {
      // Error handled by mutation state
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Onay bilgileri güvenli bağlantı üzerinden doğrulanıyor...
        </p>
      </div>
    )
  }

  // If no token is passed, render the general public KVKK information page
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col py-8 px-4 sm:px-6 selection:bg-sky-500 selection:text-white">
        <div className="max-w-2xl w-full mx-auto space-y-6">
          {/* Brand & Security Header */}
          <div className="flex items-center justify-between">
            <BrandLogo />
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              <Lock size={12} />
              <span>256-Bit SSL Güvenli</span>
            </div>
          </div>

          {/* Banner */}
          <div className="p-6 rounded-3xl bg-linear-to-br from-sky-500/10 via-indigo-500/5 to-transparent border border-sky-500/20 space-y-2">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-semibold text-xs">
              <ShieldCheck size={16} />
              <span>Yasal Bilgilendirme Protokolü</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Kişisel Verilerin Korunması ve İşlenmesi Aydınlatma Metni
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, oto servis ve bakım süreçleriniz kapsamında işlenen kişisel verileriniz hakkında bilgilendirme metnidir.
            </p>
          </div>

          {/* Policy Body */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <section className="space-y-1.5">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">1. Veri Sorumlusu</h3>
              <p>
                Bu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) ve ilgili mevzuat uyarınca, servisimizde işlem gören araç sahipleri ve müşterilerimizin kişisel verilerinin korunması amacıyla hazırlanmıştır.
              </p>
            </section>

            <section className="space-y-1.5">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">2. İşlenen Kişisel Veriler</h3>
              <p>
                Servis operasyonlarının yürütülmesi kapsamında; kimlik bilgileriniz (ad, soyad, T.C. kimlik numarası), iletişim bilgileriniz (telefon numarası, adres, e-posta), araç bilgileri (plaka, şasi no, marka, model, kilometre) ve servis işlem / iş emri geçmişiniz işlenmektedir.
              </p>
            </section>

            <section className="space-y-1.5">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">3. Kişisel Verilerin İşlenme Amaçları</h3>
              <p>
                Kişisel verileriniz; araç bakım, onarım, periyodik servis ve yedek parça montaj hizmetlerinin gerçekleştirilmesi, garanti ve iş emri süreçlerinin takibi, yasal faturalandırma ve muhasebe yükümlülüklerinin yerine getirilmesi ile onayınız halinde bakım hatırlatma ve ticari ileti bildirimlerinin iletilmesi amacıyla işlenmektedir.
              </p>
            </section>

            <section className="space-y-1.5">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">4. Veri Aktarımı</h3>
              <p>
                Kişisel verileriniz; kanunen yetkili kamu kurum ve kuruluşları, adli merciler, anlaşmalı sigorta şirketleri (kasko/trafik hasar süreçlerinde) ve güvenli bulut servis sağlayıcıları haricinde üçüncü şahıslara aktarılmamaktadır.
              </p>
            </section>

            <section className="space-y-1.5">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">5. İlgili Kişi Olarak Haklarınız (Madde 11)</h3>
              <p>
                KVKK 11. maddesi uyarınca; verilerinizin işlenip işlenmediğini öğrenme, yanlış verilerin düzeltilmesini talep etme ve kanuni şartlar dahilinde silinmesini veya anonimleştirilmesini talep etme hakkına sahipsiniz.
              </p>
            </section>
          </div>

          {/* Footer */}
          <footer className="text-center text-[11px] text-slate-400 pt-4">
            WorksAuto • 6698 Sayılı KVKK & İYS Uyumlu Dijital Servis Altyapısı
          </footer>
        </div>
      </div>
    )
  }

  if (error || !verification || !verification.valid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
            <AlertCircle size={30} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Bağlantı Geçersiz veya Süresi Dolmuş</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Bu onay bağlantısının geçerlilik süresi dolmuş olabilir veya bağlantı daha önce kullanılmıştır. Yeni bir onay bağlantısı için servis danışmanınız ile iletişime geçebilirsiniz.
          </p>
          <div className="pt-2">
            <BrandLogo />
          </div>
        </div>
      </div>
    )
  }

  // Already confirmed or just confirmed state
  const isCompleted = Boolean(confirmedData || verification.alreadyGranted)
  const completedDate = confirmedData?.grantedAt || verification.grantedAt

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col py-8 px-4 sm:px-6 selection:bg-sky-500 selection:text-white">
      <div className="max-w-xl w-full mx-auto space-y-6">
        {/* Brand & Security Header */}
        <div className="flex items-center justify-between">
          <BrandLogo />
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
            <Lock size={12} />
            <span>256-Bit SSL Güvenli</span>
          </div>
        </div>

        {/* Tenant Banner */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Building2 size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Yetkili Servis Sağlayıcı</span>
            <h1 className="text-base font-bold text-slate-900 dark:text-white truncate">{verification.tenant.title}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {[verification.tenant.phone, verification.tenant.city].filter(Boolean).join(" • ")}
            </p>
          </div>
        </div>

        {isCompleted ? (
          /* Confirmation Success State */
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-500/30 shadow-lg text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">KVKK Onayınız Kaydedilmiştir</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sn. <strong>{verification.customer.name}</strong>, yasal onayınız başarıyla sisteme mühürlenmiştir.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800/80 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Onay Tarihi & Saati:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {completedDate ? new Date(completedDate).toLocaleString("tr-TR") : "Şimdi"}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Doğrulanan Telefon:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {verification.customer.phoneMasked}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Politika Versiyonu:</span>
                <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                  v{verification.policyVersion || "1.0"} (KVKK Md. 10 & 11)
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Hukuki Durum:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Mühürlendi & Yürürlükte</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Bu onay kaydı 6698 sayılı Kanun ve Ticari Elektronik İleti Yönetmeliği gereğince güvenli log havuzunda saklanmaktadır. İstediğiniz zaman servisinize başvurarak onay tercihlerinizi güncelleyebilirsiniz.
            </p>
          </div>
        ) : (
          /* Consent Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Greeting */}
            <div className="p-6 rounded-3xl bg-linear-to-br from-sky-500/10 via-indigo-500/5 to-transparent border border-sky-500/20 space-y-2">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-semibold text-xs">
                <Sparkles size={15} />
                <span>Dijital Müşteri Bilgilendirme ve Onay Ekranı</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Merhaba Sn. {verification.customer.name},
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong>{verification.tenant.title}</strong> bünyesinde alacağınız araç servis, bakım, arıza tespit ve parça tedarik hizmetlerinin yürütülebilmesi amacıyla 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca hazırlanan aydınlatma metnini aşağıda inceleyebilirsiniz.
              </p>
            </div>

            {/* Accordion 1: Aydınlatma Metni */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === "aydinlatma" ? null : "aydinlatma")}
                className="w-full px-5 py-4 flex items-center justify-between text-left font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileText size={16} className="text-sky-500" />
                  <span>Kişisel Verilerin İşlenmesi Aydınlatma Metni</span>
                </div>
                {expandedSection === "aydinlatma" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {expandedSection === "aydinlatma" && (
                <div className="px-5 pb-5 pt-2 text-xs text-slate-600 dark:text-slate-400 space-y-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 max-h-64 overflow-y-auto leading-relaxed">
                  <p>
                    <strong>1. Veri Sorumlusu:</strong> Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca veri sorumlusu sıfatıyla {verification.tenant.title} tarafından hazırlanmıştır.
                  </p>
                  <p>
                    <strong>2. İşlenen Kişisel Veriler:</strong> Kimlik bilgileriniz (ad, soyad), iletişim bilgileriniz (telefon numarası, e-posta adresi), araç verileriniz (plaka, şasi numarası, marka, model, kilometre) ve servis işlem geçmişiniz.
                  </p>
                  <p>
                    <strong>3. İşleme Amaçları:</strong> Araç bakım ve onarım iş emirlerinin düzenlenmesi, yedek parça siparişleri, garanti takibi, faturalandırma ve yasal mali yükümlülüklerin yerine getirilmesi.
                  </p>
                  <p>
                    <strong>4. Veri Aktarımı:</strong> Kişisel verileriniz yalnızca kanunen yetkili kamu kurum ve kuruluşları ile adli mercilere ve servis altyapısını sağlayan bulut bilişim sağlayıcılarına aktarılmaktadır.
                  </p>
                  <p>
                    <strong>5. Haklarınız:</strong> KVKK Madde 11 uyarınca; verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini talep etme ve kanuni şartlar çerçevesinde silinmesini isteme hakkına sahipsiniz.
                  </p>
                </div>
              )}
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              {/* Mandatory KVKK */}
              <label className="flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-sky-500/50 transition-colors">
                <input
                  type="checkbox"
                  checked={kvkkChecked}
                  onChange={(e) => setKvkkChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-sky-600 border-slate-300 focus:ring-sky-500 cursor-pointer"
                  required
                />
                <div className="space-y-0.5 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>KVKK Aydınlatma Metnini okudum, anladım ve onaylıyorum</span>
                    <span className="text-rose-500 text-[10px] uppercase font-mono font-bold">(Zorunlu)</span>
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    Araç servis ve bakım operasyonlarımın yürütülebilmesi amacıyla gerekli kişisel ve araç verilerimin işlenmesine rıza gösteriyorum.
                  </p>
                </div>
              </label>

              {/* Optional Commercial SMS */}
              <label className="flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-sky-500/50 transition-colors">
                <input
                  type="checkbox"
                  checked={commercialSmsChecked}
                  onChange={(e) => setCommercialSmsChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-sky-600 border-slate-300 focus:ring-sky-500 cursor-pointer"
                />
                <div className="space-y-0.5 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MessageSquare size={13} className="text-indigo-500" />
                    <span>Ticari Elektronik İleti ve Servis Hatırlatmaları (İYS)</span>
                    <span className="text-sky-500 text-[10px] uppercase font-mono font-bold">(İsteğe Bağlı)</span>
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    Periyodik bakım zamanı hatırlatmaları, araç muayene yaklaşım bildirimleri ve servis kampanyaları hakkında SMS ve WhatsApp ile bilgilendirilmek istiyorum.
                  </p>
                </div>
              </label>
            </div>

            {/* Error Message */}
            {confirmMutation.isError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{confirmMutation.error?.message || "Onay kaydedilirken bir hata oluştu."}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!kvkkChecked || confirmMutation.isPending}
              className="w-full h-13 rounded-2xl text-sm font-bold gap-2 shadow-lg shadow-sky-500/20 cursor-pointer"
            >
              {confirmMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Onaylıyorum ve Kaydet</span>
                </>
              )}
            </Button>

            <p className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Clock size={11} />
              <span>IP adresiniz ve cihaz bilgisi hukuki ispat niteliğinde güvenle damgalanır.</span>
            </p>
          </form>
        )}

        {/* Footer */}
        <footer className="text-center text-[11px] text-slate-400 pt-6">
          WorksAuto • 6698 Sayılı KVKK & İYS Uyumlu Dijital Servis Altyapısı
        </footer>
      </div>
    </div>
  )
}
