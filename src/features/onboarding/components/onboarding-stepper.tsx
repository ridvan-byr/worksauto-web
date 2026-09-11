"use client"

import * as React from "react"
import {
  Building2,
  Clock,
  Wrench,
  Users,
  Settings2,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"

export const STEPS = [
  { id: 1, title: "Firma Kimliği", desc: "Servis adı, fatura & adres", icon: Building2 },
  { id: 2, title: "Mesai Saatleri", desc: "Çalışma günleri ve saatleri", icon: Clock },
  { id: 3, title: "Hizmetler", desc: "İşçilik ve servis kataloğu", icon: Wrench },
  { id: 4, title: "Usta & Kadro", desc: "İlk teknisyen tanımları", icon: Users },
  { id: 5, title: "Atölye Kapasitesi", desc: "Lift, slot ve stok ayarları", icon: Settings2 },
]

interface OnboardingStepperProps {
  currentStep: number
  onStepClick: (stepId: number) => void
}

export function OnboardingStepper({
  currentStep,
  onStepClick,
}: OnboardingStepperProps) {
  const activeStepMeta = STEPS.find((s) => s.id === currentStep) || STEPS[0]

  return (
    <div className="space-y-2">
      {/* Mobile Stepper Indicator */}
      <div className="block md:hidden space-y-2">
        <div className="flex gap-1.5 w-full">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-300",
                s.id === currentStep
                  ? "bg-sky-500"
                  : s.id < currentStep
                  ? "bg-emerald-500"
                  : "bg-slate-200 dark:bg-slate-800"
              )}
            />
          ))}
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-sky-500/15 text-sky-500 flex items-center justify-center shrink-0 font-bold text-xs">
              {currentStep}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {activeStepMeta.title}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {activeStepMeta.desc}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-sky-500 shrink-0">
            {currentStep} / 6
          </span>
        </div>
      </div>

      {/* Desktop Stepper Grid (>= md) */}
      <div className="hidden md:grid md:grid-cols-6 gap-2 text-center">
        {STEPS.map((s) => {
          const Icon = s.icon
          const isCompleted = s.id < currentStep
          const isCurrent = s.id === currentStep

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                if (s.id < currentStep) {
                  onStepClick(s.id)
                }
              }}
              disabled={s.id > currentStep}
              className={cn(
                "p-2.5 rounded-2xl border transition-all text-left flex flex-col items-start gap-1",
                isCurrent
                  ? "bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/20"
                  : isCompleted
                  ? "bg-white dark:bg-slate-900 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 cursor-pointer hover:border-emerald-500"
                  : "bg-slate-100/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 text-slate-400 opacity-60 cursor-not-allowed"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <Icon size={16} />
                {isCompleted && <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />}
              </div>
              <p className="text-xs font-bold leading-tight mt-1 truncate w-full">{s.title}</p>
              <p className={cn("text-[10px] truncate w-full", isCurrent ? "text-sky-100" : "text-slate-400")}>
                {s.desc}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
