"use client"

import * as React from "react"
import Link from "next/link"
import {
  CheckCircle2,
  Circle,
  Building2,
  Layers,
  CreditCard,
  Users,
  Wrench,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/features/auth/auth-context"
import { useStaffList } from "@/features/staff/api/use-staff-management"
import type { DashboardSummary } from "@/features/dashboard/api/use-dashboard-summary"
import { cn } from "@/lib/utils"

interface OnboardingChecklistCardProps {
  summary?: DashboardSummary
}

export function OnboardingChecklistCard({ summary }: OnboardingChecklistCardProps) {
  const { tenant } = useAuth()
  const { data: staffList } = useStaffList()

  const [isDismissed, setIsDismissed] = React.useState(true)
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  const storageKey = React.useMemo(() => {
    return tenant?.id ? `worksauto_checklist_dismissed_${tenant.id}` : "worksauto_checklist_dismissed"
  }, [tenant?.id])

  React.useEffect(() => {
    try {
      const dismissed = localStorage.getItem(storageKey)
      if (dismissed === "true") {
        setIsDismissed(true)
      } else {
        setIsDismissed(false)
      }
    } catch {
      setIsDismissed(false)
    }
  }, [storageKey])

  const handleDismiss = () => {
    setIsDismissed(true)
    try {
      localStorage.setItem(storageKey, "true")
    } catch {
      // ignore
    }
  }

  // Steps evaluation
  const steps = React.useMemo(() => {
    const hasLogoAndProfile = Boolean(
      tenant?.title &&
      (tenant?.logoUrl || tenant?.logo) &&
      tenant?.phone
    )

    const hasServices = Boolean(
      tenant?.services &&
      Array.isArray(tenant.services) &&
      tenant.services.length > 0
    )

    const hasFinancials = Boolean(tenant?.iban)

    const hasStaff = Boolean(
      staffList &&
      staffList.length > 0
    )

    const hasOperation = Boolean(
      (summary?.activeWorkOrdersCount ?? 0) > 0 ||
      (summary?.todayAppointmentsCount ?? 0) > 0 ||
      (summary?.totalVehiclesCount ?? 0) > 0
    )

    return [
      {
        id: "profile",
        title: "İşletme Kimliği & Kurumsal Logo",
        desc: "Servis ünvanı, iletişim bilgileri ve evraklara basılacak logonuzu yükleyin.",
        isDone: hasLogoAndProfile,
        href: "/settings",
        actionLabel: "Profili Düzenle",
        icon: Building2,
      },
      {
        id: "services",
        title: "Faaliyet Alanları & Hizmet Paketleri",
        desc: "Mekanik, periyodik bakım veya elektrik branşlarını seçip hazır servis paketlerini aktarın.",
        isDone: hasServices,
        href: "/settings?tab=profile#faaliyet-alanlari",
        actionLabel: "Hizmetleri Tanımla",
        icon: Layers,
      },
      {
        id: "finance",
        title: "Banka & IBAN Bilgileri",
        desc: "Fatura ve evraklara basılacak servis banka IBAN bilgilerinizi tanımlayın.",
        isDone: hasFinancials,
        href: "/settings?tab=profile",
        actionLabel: "IBAN Tanımla",
        icon: CreditCard,
      },
      {
        id: "staff",
        title: "Teknisyen & Usta Kadrosu",
        desc: "Atölyenizde çalışan ustaları ekleyin, uzmanlık alanı ve lift atamalarını belirleyin.",
        isDone: hasStaff,
        href: "/staff",
        actionLabel: "Usta Ekle",
        icon: Users,
      },
      {
        id: "workorder",
        title: "İlk Randevu veya Araç Kabulü",
        desc: "Müşteri plakasını kaydederek ilk randevuyu planlayın veya atölye iş emri oluşturun.",
        isDone: hasOperation,
        href: "/work-orders",
        actionLabel: "İş Emri Aç",
        icon: Wrench,
      },
    ]
  }, [tenant, staffList, summary])

  const completedCount = steps.filter((s) => s.isDone).length
  const progressPercent = Math.round((completedCount / steps.length) * 100)
  const isAllComplete = completedCount === steps.length

  if (isDismissed) return null

  return (
    <Card className="overflow-hidden border-sky-500/30 dark:border-sky-500/20 bg-gradient-to-br from-sky-50/40 via-white to-indigo-50/20 dark:from-slate-900 dark:via-slate-900/90 dark:to-sky-950/20 shadow-sm transition-all duration-300">
      <div className="p-5 sm:p-6">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20 shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {isAllComplete ? "Tebrikler! Servis Altyapınız Tamamlandı" : "WorksAuto Hızlı Başlangıç Rehberi"}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 font-mono">
                  %{progressPercent}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAllComplete
                  ? "Tüm temel yapılandırma adımları tamamlandı. Servis operasyonlarınızı tam kapasite yönetebilirsiniz."
                  : `${steps.length} temel adımdan ${completedCount} tanesi tamamlandı. Servisinizi eksiksiz yapılandırın.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 px-2.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            >
              {isCollapsed ? (
                <>
                  <ChevronDown size={14} className="mr-1" /> Göster
                </>
              ) : (
                <>
                  <ChevronUp size={14} className="mr-1" /> Daralt
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              title="Rehberi Kapat"
              className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
            >
              <X size={15} />
            </Button>
          </div>
        </div>

        {/* Progress Line */}
        <div className="mt-4">
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500 rounded-full",
                isAllComplete ? "bg-emerald-500" : "bg-gradient-to-r from-sky-500 to-indigo-600"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Expanded Checklist Items */}
        {!isCollapsed && (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 animate-in fade-in duration-200">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div
                  key={step.id}
                  className={cn(
                    "p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3",
                    step.isDone
                      ? "bg-emerald-50/40 dark:bg-emerald-950/15 border-emerald-500/25 dark:border-emerald-500/20"
                      : "bg-white/80 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-sky-500/40 shadow-xs"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="pt-0.5 shrink-0">
                      {step.isDone ? (
                        <CheckCircle2 size={18} className="text-emerald-500" />
                      ) : (
                        <Circle size={18} className="text-slate-300 dark:text-slate-600" />
                      )}
                    </div>
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <Icon size={14} className={step.isDone ? "text-emerald-600 dark:text-emerald-400" : "text-sky-600 dark:text-sky-400"} />
                        <h4 className={cn(
                          "text-xs font-bold truncate",
                          step.isDone ? "text-emerald-900 dark:text-emerald-300" : "text-slate-900 dark:text-slate-100"
                        )}>
                          {step.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                        {step.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      step.isDone ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                    )}>
                      {step.isDone ? "Tamamlandı" : "Bekliyor"}
                    </span>
                    <Link href={step.href}>
                      <Button
                        variant={step.isDone ? "ghost" : "outline"}
                        size="sm"
                        className={cn(
                          "h-7 px-2 text-[11px] font-semibold gap-1 cursor-pointer",
                          step.isDone
                            ? "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                            : "border-sky-500/40 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40"
                        )}
                      >
                        <span>{step.actionLabel}</span>
                        <ArrowRight size={12} />
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Card>
  )
}
