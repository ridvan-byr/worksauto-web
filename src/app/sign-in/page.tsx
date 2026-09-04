"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Phone,
  ShieldCheck,
  Wrench,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  MessageSquare,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react"
import { BrandLogo } from "@/components/shared/brand-logo"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/sonner"
import { useAuth } from "@/features/auth/auth-context"
import { cn } from "@/lib/utils"

export default function SignInPage() {
  const router = useRouter()
  const { login, sendOtp, verifyOtp, isAuthenticated, tenant } = useAuth()

  // Steps: 1 = Phone Number, 2 = SMS OTP Verification
  const [step, setStep] = React.useState<1 | 2>(1)
  const [phone, setPhone] = React.useState("")
  const [otpCode, setOtpCode] = React.useState("")
  const [errorStatus, setErrorStatus] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [timerSeconds, setTimerSeconds] = React.useState(59)
  const [showSupportModal, setShowSupportModal] = React.useState(false)
  const [isSuspendedParam, setIsSuspendedParam] = React.useState(false)

  // Detect suspended query parameter
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      if (params.get("suspended") === "true") {
        setIsSuspendedParam(true)
      }
    }
  }, [])

  // Auto-redirect if already logged in (only if not suspended)
  React.useEffect(() => {
    if (isAuthenticated && tenant && !isSuspendedParam) {
      if (tenant.onboardingCompleted) {
        router.push("/")
      } else {
        router.push("/onboarding")
      }
    }
  }, [isAuthenticated, tenant, isSuspendedParam, router])

  // Timer countdown for resending code
  React.useEffect(() => {
    let interval: NodeJS.Timeout
    if (step === 2 && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [step, timerSeconds])

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

    let res = "0"
    if (formatted.length > 1) res += " (" + formatted.slice(1, 4)
    if (formatted.length >= 4) res += ") " + formatted.slice(4, 7)
    if (formatted.length >= 7) res += " " + formatted.slice(7, 9)
    if (formatted.length >= 9) res += " " + formatted.slice(9, 11)

    setPhone(res)
  }

  // Step 1 Submit: Check if phone exists and send SMS OTP
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorStatus(null)

    const clean = phone.replace(/\D/g, "")
    if (clean.length < 10) {
      setErrorStatus("INVALID_PHONE")
      toast.warning("Lütfen geçerli bir cep telefonu numarası giriniz.")
      return
    }

    setIsLoading(true)
    const res = await sendOtp(phone)
    setIsLoading(false)

    if (res.success) {
      setStep(2)
      setTimerSeconds(59)
      toast.success("Doğrulama kodu gönderildi.", {
        description: `${phone} numarasına 6 haneli SMS kodu iletildi.`,
      })
      if (res.devCode) {
        setOtpCode(res.devCode)
      }
    } else {
      const err = res.error || "Telefon numarası sistemde bulunamadı veya yetkisiz."
      setErrorStatus(err)
      toast.error(err)
    }
  }

  // Step 2 Submit: Verify OTP code and start 30-day session
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorStatus(null)

    if (otpCode.length < 6) {
      setErrorStatus("INVALID_OTP")
      toast.warning("Lütfen 6 haneli SMS kodunu eksiksiz giriniz.")
      return
    }

    setIsLoading(true)
    const res = await verifyOtp(phone, otpCode)
    setIsLoading(false)

    if (res.success) {
      toast.success("Giriş başarılı!", {
        description: "Atölye yönetim paneline yönlendiriliyorsunuz...",
      })
    } else {
      const err = res.error || "Doğrulama kodu hatalı veya süresi dolmuş."
      setErrorStatus(err)
      toast.error(err)
    }
  }

  // Quick fill test shortcut
  const handleQuickSelect = (testPhone: string, code: string = "123456") => {
    setErrorStatus(null)
    setPhone(testPhone)
    setOtpCode(code)
    setStep(2)
    setTimerSeconds(59)
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100">
      {/* Left Column: Brand Story & Automotive Values */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 overflow-hidden border-r border-slate-200/80 dark:border-slate-800/80 bg-slate-900 text-white">
        {/* Ambient Gradient Mesh Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(2,132,199,0.25),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.2),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(7,11,18,0.95))] pointer-events-none" />

        {/* Top: Brand Logo */}
        <div className="relative z-10">
          <BrandLogo collapsed={false} clickable={false} />
        </div>

        {/* Center: Value Propositions */}
        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 text-xs font-semibold">
            <Sparkles size={14} />
            <span>Şifresiz SMS Doğrulamalı B2B Servis Portalı</span>
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight text-white">
            Oto servis yönetiminde hız, sadelik ve tam kontrol.
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Şifre ezberleme derdi yok. Yetkili cep telefonu numaranıza gelen tek kullanımlık SMS koduyla servisinize anında ve güvenle erişin.
          </p>

          <div className="grid grid-cols-1 gap-3.5 pt-2">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 shrink-0">
                <MessageSquare size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Tek Tıkla SMS ile Hızlı Giriş</h4>
                <p className="text-[11px] text-slate-400">Telefonunuza gelen 6 haneli güvenli kodla servisinize saniyeler içinde bağlanın.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Super Admin Yetkili Servis Ağı</h4>
                <p className="text-[11px] text-slate-400">Yalnızca lisanslanmış ve platform yöneticisi tarafından aktive edilmiş servisler giriş yapabilir.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Status Note */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>WorksAuto Doğrulama Sunucusu Aktif</span>
          </div>
          <span>B2B Lisanslı Servis Portalı</span>
        </div>
      </div>

      {/* Right Column: Two-Step Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14 relative">
        <div className="w-full max-w-md space-y-7">
          {/* Mobile Header Brand Logo */}
          <div className="lg:hidden flex justify-center pb-2">
            <BrandLogo collapsed={false} clickable={false} />
          </div>

          {/* STEP 1: PHONE NUMBER INPUT */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-2 text-center sm:text-left">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  Servis Paneline Giriş Yap
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Sisteme kayıtlı yetkili cep telefonu numaranızı girin. Size bir doğrulama kodu göndereceğiz.
                </p>
              </div>

              {/* Alert: Tenant License Suspended */}
              {isSuspendedParam && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-200 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <p className="font-bold">Erişim Askıya Alındı</p>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        Bağlı olduğunuz oto servisinin abonelik veya kullanım lisansı sistem yöneticisi tarafından askıya alınmıştır. Oturumunuz sonlandırıldı. Bilgi almak için servis yöneticiniz veya platform destek ekibi ile iletişime geçiniz.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Alert: License Suspended */}
              {errorStatus && (errorStatus.toLowerCase().includes("lisans") || errorStatus.toLowerCase().includes("askıya")) && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-200 space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <p className="font-bold">Erişim Yetkisi Askıya Alındı</p>
                      <p className="text-[11px] leading-relaxed opacity-90">{errorStatus}</p>
                    </div>
                  </div>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowSupportModal(true)}
                      className="w-full text-xs font-semibold py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-colors shadow-sm text-center"
                    >
                      Platform Desteği ile Görüşün
                    </button>
                  </div>
                </div>
              )}

              {/* Error Alert: Unregistered Phone */}
              {errorStatus === "NOT_FOUND" && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <p className="font-bold">Servis Kaydı Bulunamadı</p>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        Girdiğiniz <strong>{phone}</strong> numarasına ait aktif bir WorksAuto servis kaydı bulunamadı.
                      </p>
                    </div>
                  </div>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowSupportModal(true)}
                      className="w-full text-xs font-semibold py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white cursor-pointer transition-colors shadow-sm text-center"
                    >
                      Kurulum & Lisans Başvurusu Aç
                    </button>
                  </div>
                </div>
              )}

              {errorStatus === "INVALID_PHONE" && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>Lütfen 11 haneli geçerli bir cep telefonu numarası girin.</span>
                </div>
              )}

              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Yetkili Cep Telefonu Numarası
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
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl text-sm font-semibold gap-2 mt-2 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Doğrulama Kodu Gönder</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* STEP 2: SMS OTP CODE VERIFICATION PAGE */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-2 text-center sm:text-left">
                <div className="flex items-center gap-2 mb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1)
                      setErrorStatus(null)
                    }}
                    className="p-1.5 -ml-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Numarayı Değiştir"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                    Adım 2: SMS Onayı
                  </span>
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  Doğrulama Kodunu Girin
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  <strong>{phone}</strong> numaralı telefonunuza gönderilen 6 haneli SMS kodunu yazın.
                </p>
              </div>

              {/* Step 2 Error Alerts */}
              {errorStatus && (errorStatus.toLowerCase().includes("lisans") || errorStatus.toLowerCase().includes("askıya")) ? (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-200 space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <p className="font-bold">Erişim Yetkisi Askıya Alındı</p>
                      <p className="text-[11px] leading-relaxed opacity-90">{errorStatus}</p>
                    </div>
                  </div>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowSupportModal(true)}
                      className="w-full text-xs font-semibold py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-colors shadow-sm text-center"
                    >
                      Platform Desteği ile Görüşün
                    </button>
                  </div>
                </div>
              ) : errorStatus === "INVALID_OTP" ? (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>Lütfen 6 haneli doğrulama kodunu eksiksiz girin.</span>
                </div>
              ) : errorStatus ? (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{errorStatus}</span>
                </div>
              ) : null}

              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      6 Haneli SMS Kodu
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtpCode("123456")}
                      className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      Kodu Doldur (123456)
                    </button>
                  </div>

                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="• • • • • •"
                    maxLength={6}
                    className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-lg font-bold tracking-[0.5em] text-center placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-mono"
                    required
                    autoFocus
                  />
                </div>

                {/* Resend Code / Timer */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1)
                      setErrorStatus(null)
                    }}
                    className="hover:text-sky-500 underline cursor-pointer"
                  >
                    Numarayı Düzenle
                  </button>

                  {timerSeconds > 0 ? (
                    <span className="text-[11px]">
                      Tekrar gönder (0:{timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds})
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setTimerSeconds(59)
                        setOtpCode("")
                      }}
                      className="text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1 cursor-pointer hover:underline"
                    >
                      <RefreshCw size={12} />
                      <span>Tekrar Kod Gönder</span>
                    </button>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl text-sm font-semibold gap-2 mt-2 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Doğrula ve Giriş Yap</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Super Admin Info Note */}
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center space-y-1">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5">
              <ShieldCheck size={14} className="text-sky-500" />
              <span>Kapalı Devre Kurumsal B2B Platformu</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              WorksAuto'da herkese açık üyelik kaydı bulunmamaktadır. Servis hesapları lisanslama sonrası platform yöneticisi tarafından aktive edilir.
            </p>
          </div>

          {/* Quick Real DB Accounts Switcher (PostgreSQL Live Seed) */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
              Canlı Test & Hızlı Giriş Hesapları (PostgreSQL)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickSelect("0 (555) 111 22 33", "123456")}
                className="p-2.5 rounded-xl border border-sky-500/20 bg-sky-500/5 hover:bg-sky-500/10 text-sky-600 dark:text-sky-400 text-left transition-all cursor-pointer"
              >
                <p className="font-bold flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  <span>Bayar Oto Servis</span>
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Rıdvan Bayar (Patron / Yönetici)</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect("0 (555) 222 33 44", "123456")}
                className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-left transition-all cursor-pointer"
              >
                <p className="font-bold flex items-center gap-1">
                  <Sparkles size={12} className="text-amber-500" />
                  <span>Teknisyen Paneli</span>
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Mehmet Usta (Atölye Teknisyeni)</p>
              </button>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setStep(1)
                  setErrorStatus(null)
                  setPhone("0 (555) 000 00 00")
                }}
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
