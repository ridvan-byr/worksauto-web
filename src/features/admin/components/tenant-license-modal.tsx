"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X, Pause, CheckCircle2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TenantLicenseModalProps {
  state: {
    isOpen: boolean
    tenantId: string
    title: string
    currentActive: boolean
  } | null
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
}

export function TenantLicenseModal({
  state,
  onClose,
  onConfirm,
  isPending,
}: TenantLicenseModalProps) {
  if (!state || typeof document === "undefined") return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${
              state.currentActive
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
            }`}
          >
            {state.currentActive ? <Pause size={22} /> : <CheckCircle2 size={22} />}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {state.currentActive ? "Lisansı Askıya Al" : "Lisansı Aktif Et"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {state.title}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {state.currentActive ? (
              <>
                <strong className="text-slate-900 dark:text-white">{state.title}</strong> servisinin lisansını askıya almak üzeresiniz.
              </>
            ) : (
              <>
                <strong className="text-slate-900 dark:text-white">{state.title}</strong> servisine tam erişim yetkisi verilecek ve lisansı onaylanacaktır.
              </>
            )}
          </p>

          <div
            className={`p-3 rounded-2xl text-[11px] leading-relaxed border ${
              state.currentActive
                ? "bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-200"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-200"
            }`}
          >
            {state.currentActive
              ? "⚠️ Lisans askıya alındığı anda, servise bağlı tüm yönetici ve usta oturumları anında geçersiz kılınır. Servis çalışanları sisteme giriş yapamaz ve hiçbir veriye erişemez."
              : "✓ Lisans aktif edildiğinde yetkili ve ustalar sisteme SMS OTP ile giriş yapabilir, randevu ve iş emri oluşturabilirler."}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Vazgeç
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={onConfirm}
            className={`font-bold gap-1.5 shadow-md cursor-pointer ${
              state.currentActive
                ? "bg-amber-600 hover:bg-amber-500 dark:bg-amber-600 dark:hover:bg-amber-500 text-white dark:text-white shadow-amber-600/30"
                : "bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white dark:text-white shadow-emerald-600/30"
            }`}
          >
            {isPending ? (
              <span>İşleniyor...</span>
            ) : state.currentActive ? (
              <>
                <Pause size={14} />
                <span>Evet, Lisansı Askıya Al</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>Evet, Lisansı Onayla</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
