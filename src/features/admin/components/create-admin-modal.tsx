"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { ShieldCheck, X, Eye, EyeOff, AlertCircle, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreateSuperAdminInput } from "@/features/admin/api/use-admin"
import { formatSmartPhone } from "@/lib/input-formatters"
import { cn } from "@/lib/utils"

interface CreateAdminModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateSuperAdminInput) => Promise<void>
  isPending: boolean
  error?: string | null
}

const INITIAL_FORM: CreateSuperAdminInput = {
  name: "",
  surname: "",
  email: "",
  phone: "",
  password: "",
}

export function CreateAdminModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  error,
}: CreateAdminModalProps) {
  const [form, setForm] = React.useState<CreateSuperAdminInput>(INITIAL_FORM)
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)

  React.useEffect(() => {
    if (isOpen) {
      setForm(INITIAL_FORM)
      setConfirmPassword("")
      setShowPassword(false)
      setShowConfirmPassword(false)
    }
  }, [isOpen])

  // Modern Enterprise Password Rules
  const passwordRules = React.useMemo(() => {
    const p = form.password || ""
    return {
      minLength: p.length >= 8,
      hasUpper: /[A-ZÇĞİÖŞÜ]/.test(p),
      hasLower: /[a-zçğıöşü]/.test(p),
      hasNumber: /[0-9]/.test(p),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>_\-+=~/\[\]\\]/.test(p),
    }
  }, [form.password])

  const passedRulesCount = React.useMemo(() => {
    return Object.values(passwordRules).filter(Boolean).length
  }, [passwordRules])

  const isPasswordValid = passedRulesCount === 5
  const isPasswordMatch = Boolean(
    form.password && confirmPassword && form.password === confirmPassword
  )

  const isPhoneValid = React.useMemo(() => {
    const digits = form.phone.replace(/\D/g, "")
    return digits.length >= 10
  }, [form.phone])

  const isEmailValid = React.useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  }, [form.email])

  const isFormValid =
    form.name.trim().length > 0 &&
    isEmailValid &&
    isPhoneValid &&
    isPasswordValid &&
    isPasswordMatch

  const strengthInfo = React.useMemo(() => {
    if (!form.password) {
      return {
        level: 0,
        label: "Henüz girilmedi",
        colorClass: "text-slate-400",
        barColor: "bg-slate-200 dark:bg-slate-700",
      }
    }
    if (passedRulesCount <= 2) {
      return {
        level: 1,
        label: "Zayıf",
        colorClass: "text-rose-500",
        barColor: "bg-rose-500",
      }
    }
    if (passedRulesCount <= 4) {
      return {
        level: 2,
        label: "Orta",
        colorClass: "text-amber-500",
        barColor: "bg-amber-500",
      }
    }
    return {
      level: 4,
      label: "Çok Güçlü",
      colorClass: "text-emerald-500",
      barColor: "bg-emerald-500",
    }
  }, [form.password, passedRulesCount])

  if (!isOpen || typeof document === "undefined") return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return
    onSubmit({
      ...form,
      name: form.name.trim(),
      surname: form.surname?.trim() || "",
      email: form.email.trim().toLowerCase(),
    })
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Yeni Platform Super Admin
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tüm platformu, servisleri ve lisansları yönetebilecek tam yetkili yönetici
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ad *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                placeholder="Örn: Ahmet"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Soyad
              </label>
              <input
                type="text"
                value={form.surname || ""}
                onChange={(e) => setForm({ ...form, surname: e.target.value })}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                placeholder="Örn: Yılmaz"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Kurumsal E-Posta *
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value.trim().toLowerCase() })}
              className={cn(
                "w-full h-10 px-3.5 rounded-xl border text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 font-medium transition-colors",
                form.email && !isEmailValid
                  ? "border-amber-500/50 focus:ring-amber-500/20 bg-amber-500/5"
                  : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 focus:ring-sky-500"
              )}
              placeholder="yonetici@worksauto.com"
            />
            {form.email && !isEmailValid && (
              <p className="text-[10px] text-amber-500">Geçerli bir kurumsal e-posta formatı giriniz (örn: ad@sirket.com).</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Telefon Numarası *
            </label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: formatSmartPhone(e.target.value) })}
              className={cn(
                "w-full h-10 px-3.5 rounded-xl border text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 font-medium font-mono transition-colors",
                form.phone && !isPhoneValid
                  ? "border-amber-500/50 focus:ring-amber-500/20 bg-amber-500/5"
                  : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 focus:ring-sky-500"
              )}
              placeholder="05XX XXX XX XX veya +90..."
            />
            {form.phone && !isPhoneValid && (
              <p className="text-[10px] text-amber-500">Geçerli bir telefon numarası giriniz (en az 10 hane).</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Giriş Parolası *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full h-10 pl-3.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                placeholder="Güçlü bir parola oluşturun..."
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Password Strength & Live Rules Checklist */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2 mt-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="text-slate-600 dark:text-slate-400">Parola Gücü:</span>
                <span className={strengthInfo.colorClass}>{strengthInfo.label}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 h-1.5">
                {[1, 2, 3, 4].map((seg) => (
                  <div
                    key={seg}
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      seg <= strengthInfo.level ? strengthInfo.barColor : "bg-slate-200 dark:bg-slate-800"
                    )}
                  />
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
                <div className={cn("flex items-center gap-1.5 transition-colors", passwordRules.minLength ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-400 dark:text-slate-500")}>
                  {passwordRules.minLength ? <Check size={12} className="shrink-0 text-emerald-500" /> : <span className="w-3 h-3 flex items-center justify-center text-xs">•</span>}
                  <span>En az 8 karakter</span>
                </div>
                <div className={cn("flex items-center gap-1.5 transition-colors", passwordRules.hasUpper ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-400 dark:text-slate-500")}>
                  {passwordRules.hasUpper ? <Check size={12} className="shrink-0 text-emerald-500" /> : <span className="w-3 h-3 flex items-center justify-center text-xs">•</span>}
                  <span>En az 1 büyük harf (A-Z)</span>
                </div>
                <div className={cn("flex items-center gap-1.5 transition-colors", passwordRules.hasLower ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-400 dark:text-slate-500")}>
                  {passwordRules.hasLower ? <Check size={12} className="shrink-0 text-emerald-500" /> : <span className="w-3 h-3 flex items-center justify-center text-xs">•</span>}
                  <span>En az 1 küçük harf (a-z)</span>
                </div>
                <div className={cn("flex items-center gap-1.5 transition-colors", passwordRules.hasNumber ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-400 dark:text-slate-500")}>
                  {passwordRules.hasNumber ? <Check size={12} className="shrink-0 text-emerald-500" /> : <span className="w-3 h-3 flex items-center justify-center text-xs">•</span>}
                  <span>En az 1 rakam (0-9)</span>
                </div>
                <div className={cn("flex items-center gap-1.5 sm:col-span-2 transition-colors", passwordRules.hasSpecial ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-400 dark:text-slate-500")}>
                  {passwordRules.hasSpecial ? <Check size={12} className="shrink-0 text-emerald-500" /> : <span className="w-3 h-3 flex items-center justify-center text-xs">•</span>}
                  <span>En az 1 özel karakter (@, #, $, !, %, *, ?, & vb.)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Parola Tekrarı *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={cn(
                  "w-full h-10 pl-3.5 pr-10 rounded-xl border text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 font-medium transition-colors",
                  confirmPassword && !isPasswordMatch
                    ? "border-rose-500/50 focus:ring-rose-500/20 bg-rose-500/5"
                    : confirmPassword && isPasswordMatch
                    ? "border-emerald-500/50 focus:ring-emerald-500/20 bg-emerald-500/5"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 focus:ring-sky-500"
                )}
                placeholder="Parolayı doğrulayın..."
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword && (
              <p className={cn("text-[11px] mt-1 flex items-center gap-1 font-medium", isPasswordMatch ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500")}>
                {isPasswordMatch ? "✓ Parolalar eşleşiyor" : "• Parolalar eşleşmiyor"}
              </p>
            )}
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800/80">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl h-10 px-4 text-xs font-semibold"
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              disabled={isPending || !isFormValid}
              className="rounded-xl h-10 px-5 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-600/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Oluşturuluyor..." : "Super Admin Oluştur"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
