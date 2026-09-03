"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Phone,
  ShieldCheck,
  Wrench,
  ArrowRight,
  Sparkles,
  Lock,
  MessageSquare,
  AlertCircle,
  HelpCircle,
  Clock,
  CheckCircle2,
} from "lucide-react"
import { BrandLogo } from "@/components/shared/brand-logo"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/auth-context"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, tenant } = useAuth()

  const [phone, setPhone] = React.useState("")
  const [authMethod, setAuthMethod] = React.useState<"otp" | "password">("otp")
  const [codeOrPass, setCodeOrPass] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [errorStatus, setErrorStatus] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [otpSent, setOtpSent] = React.useState(false)
  const [showSupportModal, setShowSupportModal] = React.useState(false)

  // Auto-redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated && tenant) {
      if (tenant.onboardingCompleted) {
        router.push("/")
      } else {
        router.push("/onboarding")
      }
    }
  }, [isAuthenticated, tenant, router])

  // Turkish phone formatter: 0 (5XX) XXX XX XX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorStatus(null)
    const raw = e.target.value.replace(/\D/g, "")
    if (raw.length === 0) {
      setPhone("")
      return
    }

    let formatted = ""
    if (raw.startsWith("0")) {
      formatted = raw.slice(0, 11)
    } else {
      formatted = "0" + raw.slice(0, 10)
    }

    // Format display
    let res = "0"
    if (formatted.length > 1) {
      res += " (" + formatted.slice(1, 4)
    }
    if (formatted.length >= 4) {
      res += ") " + formatted.slice(4, 7)
    }
    if (formatted.length >= 7) {
      res += " " + formatted.slice(7, 9)
    }
    if (formatted.length >= 9) {
      res += " " + formatted.slice(9, 11)
    }

    setPhone(res)
  }

  const handleQuickFill = (testPhone: string, testPassOrCode: string) => {
    setErrorStatus(null)
    setPhone(testPhone)
    setCodeOrPass(testPassOrCode)
    if (testPassOrCode.length === 6 && /\d{6}/.test(testPassOrCode)) {
      setOtpSent(true)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorStatus(null)

    const clean = phone.replace(/\D/g, "")
    if (clean.length < 11) {
      setErrorStatus("INVALID_PHONE")
      return
    }

    if (!codeOrPass) {
      setErrorStatus("MISSING_CREDENTIALS")
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      const res = login(phone, codeOrPass)
      setIsLoading(false)
      if (!res.success) {
        setErrorStatus(res.error || "AUTH_FAILED")
      }
    }, 450)
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100">
      {/* Left Column: Visual Showcase & Brand Story */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 overflow-hidden border-r border-slate-200/80 dark:border-slate-800/80 bg-slate-900 text-white">
        {/* Ambient Gradient Mesh Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(2,132,199,0.25),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.2),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(7,11,18,0.95))] pointer-events-none" />

        {/* Top: Brand Logo */}
        <div className="relative z-10">
          <BrandLogo collapsed={false} />
        </div>

        {/* Center: Value Propositions */}
        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 text-xs font-semibold">
            <Sparkles size={14} />
            <span>Yeni Nesil Otomotiv Servis SaaS Altyapısı</span>
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight text-white">
            Atölyenizi, liflerinizi ve kasanızı tek merkezden yönetin.
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            WorksAuto, araç kabulden iş emri takibine, yedek parça stok kontrolünden servis faturası ve cari hesap takibine kadar servisinizi dijitalleştirir.
          </p>

          <div className="grid grid-cols-1 gap-3.5 pt-2">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 shrink-0">
                <Wrench size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Mobil Usta & Lif Takibi</h4>
                <p className="text-[11px] text-slate-400">Araç kabulde hasar fotoğrafları, parça listesi ve işçilik süresi anlık kaydedilir.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Multi-Tenant İzolasyon & Güvenlik</h4>
                <p className="text-[11px] text-slate-400">Her servisin müşteri, araç, parça ve finansal verisi %100 izole tutulur.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Social Proof & License Status */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>WorksAuto Bulut Altyapısı Aktif</span>
          </div>
          <span>B2B Lisanslı Servis Portalı</span>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14 relative">
        <div className="w-full max-w-md space-y-7">
          {/* Mobile Header Brand Logo */}
          <div className="lg:hidden flex justify-center pb-2">
            <BrandLogo collapsed={false} />
          </div>

          {/* Form Header */}
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Servis Paneline Giriş Yap
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sisteme kayıtlı yetkili telefon numaranız ile servis yönetim alanınıza erişin.
            </p>
          </div>

          {/* Authentication Method Tabs (SMS OTP vs Password) */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setAuthMethod("otp")
                setErrorStatus(null)
              }}
              className={cn(
                "py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                authMethod === "otp"
                  ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white font-semibold shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <MessageSquare size={14} />
              <span>SMS Doğrulama Kodu</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMethod("password")
                setErrorStatus(null)
              }}
              className={cn(
                "py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                authMethod === "password"
                  ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white font-semibold shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <Lock size={14} />
              <span>Şifre ile Giriş</span>
            </button>
          </div>

          {/* Error Alert Box */}
          {errorStatus === "NOT_FOUND" && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold">Servis Kaydı Bulunamadı</p>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    Girdiğiniz telefon numarasına ait aktif bir WorksAuto servis aboneliği bulunamadı.
                  </p>
                </div>
              </div>
              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSupportModal(true)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white cursor-pointer transition-colors"
                >
                  Kurulum & Satış Talebi Aç
                </button>
              </div>
            </div>
          )}

          {errorStatus === "INVALID_PHONE" && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={15} />
              <span>Lütfen 11 haneli geçerli bir telefon numarası girin.</span>
            </div>
          )}

          {errorStatus === "MISSING_CREDENTIALS" && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={15} />
              <span>Lütfen {authMethod === "otp" ? "SMS doğrulama kodunu" : "şifrenizi"} girin.</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Yetkili Telefon Numarası
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="0 (5XX) XXX XX XX"
                  maxLength={17}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium tracking-wide placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Auth Method 1: SMS OTP Input */}
            {authMethod === "otp" ? (
              <div className="space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    6 Haneli SMS Doğrulama Kodu
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(true)
                      setCodeOrPass("123456")
                    }}
                    className="text-[11px] font-medium text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    Kodu Doldur (123456)
                  </button>
                </div>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={codeOrPass}
                    onChange={(e) => setCodeOrPass(e.target.value.slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold tracking-widest text-center placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                    required
                  />
                </div>
              </div>
            ) : (
              /* Auth Method 2: Password Input */
              <div className="space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Servis Şifresi
                  </label>
                  <button
                    type="button"
                    onClick={() => setCodeOrPass("123456")}
                    className="text-[11px] font-medium text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    Demo Şifre Doldur
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={codeOrPass}
                    onChange={(e) => setCodeOrPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? "Gizle" : "Göster"}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl text-sm font-semibold gap-2 mt-2 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Servis Paneline Giriş Yap</span>
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </form>

          {/* Super Admin / Sales Info Note */}
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center space-y-1">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5">
              <ShieldCheck size={14} className="text-sky-500" />
              <span>Kapalı Devre Kurumsal B2B Platformu</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              WorksAuto'da herkese açık üyelik kaydı bulunmamaktadır. Servis hesapları lisanslama sonrası platform yöneticisi tarafından aktive edilir.
            </p>
          </div>

          {/* Quick Demo Accounts Switcher (For Presentation and Testing) */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
              Geliştirici & Test Giriş Kısayolları
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill("0 (532) 000 00 01", "123456")}
                className="p-2.5 rounded-xl border border-sky-500/20 bg-sky-500/5 hover:bg-sky-500/10 text-sky-600 dark:text-sky-400 text-left transition-all cursor-pointer"
              >
                <p className="font-bold flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  <span>Yıldız Oto Servis</span>
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Kurulumu Tamamlanmış (Aktif Pano)</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("0 (532) 000 00 02", "123456")}
                className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-left transition-all cursor-pointer"
              >
                <p className="font-bold flex items-center gap-1">
                  <Sparkles size={12} className="text-amber-500" />
                  <span>Ege Motor Servis</span>
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Yeni Kayıt (Onboarding Bekleyen)</p>
              </button>
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => handleQuickFill("0 (555) 999 88 77", "123456")}
                className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline cursor-pointer"
              >
                Kayıtsız Numara Testi (Hata simülasyonu)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Support / Contact Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-500 flex items-center justify-center font-bold">
                <HelpCircle size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">WorksAuto Servis Danışmanı</h3>
                <p className="text-xs text-slate-500">Kurulum ve Lisans Başvurusu</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Oto servisiniz için WorksAuto kurulumu yaptırmak veya yetkili telefon numaranızı güncellemek için doğrudan destek ekibimizle iletişime geçebilirsiniz.
            </p>

            <div className="space-y-2 pt-2">
              <a
                href="https://wa.me/905320000000?text=WorksAuto%20servis%20kurulumu%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
              >
                <MessageSquare size={16} />
                <span>WhatsApp ile İletişime Geçin</span>
              </a>

              <a
                href="tel:08503000000"
                className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Phone size={15} />
                <span>0850 300 00 00</span>
              </a>
            </div>

            <button
              type="button"
              onClick={() => setShowSupportModal(false)}
              className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              Pencereyi Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
