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
  // Lock body scroll when modal is open to ensure perfect viewport centering
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = "auto"
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md my-auto mx-auto rounded-3xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center border border-emerald-500/20">
          <CheckCircle2 size={32} />
        </div>

        <div className="space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700">
            <Sparkles size={13} className="text-emerald-500" />
            <span>Tüm Kurulum Adımları Tamamlandı</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {companyName || "Servisiniz"}
          </h2>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
            İşletme kimliğiniz, mesai saatleriniz, hizmet kataloğunuz, usta kadronuz ve atölye kapasite ayarlarınız başarıyla yapılandırıldı. Servis operasyonlarınızı ve randevularınızı yönetmeye hemen başlayabilirsiniz.
          </p>
        </div>

        <Button
          type="button"
          onClick={onFinish}
          className="w-full h-12 rounded-2xl text-sm font-semibold gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 shadow-md hover:shadow-lg cursor-pointer transition-all"
        >
          <span>Servis Yönetim Paneline Geç</span>
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  )
}
