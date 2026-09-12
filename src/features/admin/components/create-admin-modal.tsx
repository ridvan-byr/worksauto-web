"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { ShieldCheck, X, Eye, EyeOff, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreateSuperAdminInput } from "@/features/admin/api/use-admin"

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
  const [showPassword, setShowPassword] = React.useState(false)

  React.useEffect(() => {
    if (isOpen) {
      setForm(INITIAL_FORM)
      setShowPassword(false)
    }
  }, [isOpen])

  if (!isOpen || typeof document === "undefined") return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password || !form.phone) return
    onSubmit(form)
  }

  const isPasswordValid = form.password.length >= 8

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
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              placeholder="yonetici@worksauto.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Telefon Numarası *
            </label>
            <input
              type="text"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium font-mono"
              placeholder="+90 532 123 4567"
            />
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
                placeholder="En az 8 karakter..."
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className={`text-[11px] mt-1 ${isPasswordValid ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
              {isPasswordValid ? "✓ Şifre uzunluğu uygun" : "• En az 8 karakter olmalıdır"}
            </p>
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
              disabled={isPending || !isPasswordValid}
              className="rounded-xl h-10 px-5 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-600/20 cursor-pointer"
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
