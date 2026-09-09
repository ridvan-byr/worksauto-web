"use client"

import * as React from "react"
import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OnboardingSuccessModalProps {
  isOpen: boolean
  companyName: string
  onFinish: () => void
}

export function OnboardingSuccessModal({
  isOpen,
  companyName,
  onFinish,
}: OnboardingSuccessModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-emerald-500/15 text-emerald-500 mx-auto flex items-center justify-center shadow-inner">
          <CheckCircle2 size={32} />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-500 text-xs font-semibold">
            <Sparkles size={13} />
            <span>Kurulum Başarıyla Tamamlandı</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {companyName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Servis kimliğiniz, logonuz, çalışma saatleriniz ve işçilik kataloğunuz başarıyla yapılandırıldı. Artık tüm operasyon paneline tam yetkiyle erişebilirsiniz!
          </p>
        </div>

        <Button
          type="button"
          onClick={onFinish}
          className="w-full h-12 rounded-2xl text-sm font-semibold gap-2 shadow-lg shadow-sky-500/25 cursor-pointer"
        >
          <span>Servis Yönetim Paneline Geç</span>
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  )
}
