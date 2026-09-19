"use client"

import { useDashboardSummary } from "@/features/dashboard/api/use-dashboard-summary"

import * as React from "react"
import Link from "next/link"
import {
  Calendar,
  Wrench,
  Package,
  Receipt,
  Users,
  Car,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  ChevronRight,
  CreditCard,
  Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

import { PlateBadge } from "@/features/customers/components/plate-badge"
import { WorkOrderStatusBadge } from "@/features/work-orders/components/work-order-status-badge"
import { useWorkOrders } from "@/features/work-orders/api/use-work-orders"
import type { WorkOrder, WorkOrderStatus } from "@/features/work-orders/types"
import { useAuth } from "@/features/auth/auth-context"
import { cn } from "@/lib/utils"

interface DashboardRecentOrder {
  id: string
  plate: string
  brand: string
  model: string
  year: number
  customerName: string
  assignedMechanicName: string
  assignedLift: string
  status: WorkOrderStatus
  grandTotal: number
  services: { name: string }[]
}

export default function DashboardPage() {
  const { user, tenant } = useAuth()
  const { data: summary } = useDashboardSummary()
  const { data: apiWorkOrders } = useWorkOrders()

  const [currentHour, setCurrentHour] = React.useState<number>(() => new Date().getHours())
  const [formattedDate, setFormattedDate] = React.useState<string>("")

  React.useEffect(() => {
    const now = new Date()
    setCurrentHour(now.getHours())
    setFormattedDate(
      new Intl.DateTimeFormat("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        weekday: "long",
      }).format(now)
    )
  }, [])

  const userRole = (user?.role || "").toUpperCase()
  const isTechnician = userRole === "TECHNICIAN"

  const greetingInfo = React.useMemo(() => {
    if (currentHour >= 5 && currentHour < 12) {
      return { text: "Günaydın", icon: "☀️" }
    }
    if (currentHour >= 12 && currentHour < 18) {
      return { text: "İyi günler", icon: "🌤️" }
    }
    if (currentHour >= 18 && currentHour < 22) {
      return { text: "İyi akşamlar", icon: "🌅" }
    }
    return { text: "İyi çalışmalar", icon: "🌙" }
  }, [currentHour])

  // Technician personal assigned active orders
  const myAssignedOrdersCount = React.useMemo(() => {
    if (!isTechnician || !apiWorkOrders || !user) return 0
    const nameLower = (user.name || "").toLowerCase()
    return apiWorkOrders.filter((w: WorkOrder) => {
      const isActive = w.status === "IN_PROGRESS" || w.status === "PENDING"
      if (!isActive) return false
      const mechUserId = (w as { assignedMechanic?: { user?: { id?: string }; userId?: string } }).assignedMechanic?.userId ||
        (w as { assignedMechanic?: { user?: { id?: string } } }).assignedMechanic?.user?.id
      if (mechUserId && mechUserId === user.id) return true
      const mechName = (w.assignedMechanicName || "").toLowerCase()
      return mechName.length > 0 && mechName.includes(nameLower)
    }).length
  }, [isTechnician, apiWorkOrders, user])

  // Technician shift calculation based on tenant schedule and user's today leave
  const todayShift = React.useMemo(() => {
    if (user?.todayLeave) {
      const leaveTypeMap: Record<string, string> = {
        ANNUAL: "Yıllık İzin",
        SICK: "Sağlık Raporu",
        CASUAL: "Mazeret İzni",
        UNPAID: "Ücretsiz İzin",
      }
      const leaveLabel = leaveTypeMap[user.todayLeave.leaveType] || "İzinli"
      return {
        status: "LEAVE",
        time: leaveLabel,
        label: "Bugün onaylı izinlisiniz",
        badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
        isWorkingDay: false,
      }
    }

    const todayDayName = new Intl.DateTimeFormat("tr-TR", { weekday: "long" }).format(new Date())
    const normalizedDay = todayDayName.charAt(0).toUpperCase() + todayDayName.slice(1).toLowerCase()

    const workingDays =
      tenant?.workingDays && Array.isArray(tenant.workingDays) && tenant.workingDays.length > 0
        ? tenant.workingDays
        : ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"]

    const isWorkDay = workingDays.some((d) => d.toLowerCase() === normalizedDay.toLowerCase())
    if (!isWorkDay) {
      return {
        status: "OFF",
        time: "Haftalık İzin",
        label: "Bugün servis tatil günü",
        badgeColor: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
        isWorkingDay: false,
      }
    }

    const start = tenant?.workStartTime || "08:30"
    const end = tenant?.workEndTime || "18:30"
    return {
      status: "WORKING",
      time: `${start} - ${end}`,
      label: "Normal Vardiya Mesaisi",
      badgeColor: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
      isWorkingDay: true,
    }
  }, [user?.todayLeave, tenant?.workingDays, tenant?.workStartTime, tenant?.workEndTime])

  // Technician leave balance
  const userLeaveBalance = React.useMemo(() => {
    if (user?.leaveBalance) {
      return user.leaveBalance
    }
    const annual = user?.annualLeaveDays ?? 14
    const transferred = user?.transferredLeaveDays ?? 0
    return {
      annualDays: annual,
      transferredDays: transferred,
      totalDays: annual + transferred,
      usedDays: 0,
      remainingDays: annual + transferred,
    }
  }, [user?.leaveBalance, user?.annualLeaveDays, user?.transferredLeaveDays])

  const displayName = user ? user.name : "Yetkili"

  // Map real database work orders
  const recentOrders: DashboardRecentOrder[] = React.useMemo(() => {
    if (!apiWorkOrders) return []
    return apiWorkOrders.map((w: WorkOrder) => {
      const parsedServices = (w.services && w.services.length > 0)
        ? w.services.map((s) => ({ name: s.name }))
        : (w.items || [])
            .map((i) => {
              const item = i as { itemType?: string; name?: string }
              return item.name ? { name: item.name } : null
            })
            .filter((item): item is { name: string } => item !== null)

      return {
        id: w.id,
        plate: w.vehicle?.plate || w.plate || "34XX000",
        brand: w.vehicle?.brand || w.brand || "Araç",
        model: w.vehicle?.model || w.model || "",
        year: w.vehicle?.year || w.year || 2024,
        customerName: w.customer ? `${w.customer.firstName ?? w.customer.name ?? ""} ${w.customer.lastName ?? w.customer.surname ?? ""}`.trim() : (w.customerName || "Müşteri"),
        assignedMechanicName: w.assignedMechanic?.user ? `${w.assignedMechanic.user.name} ${w.assignedMechanic.user.surname || ""}`.trim() : (w.assignedMechanicName || "Usta"),
        assignedLift: w.assignedLift || "Lift-1",
        status: w.status,
        grandTotal: Number(w.grandTotal || 0),
        services: parsedServices,
      }
    })
  }, [apiWorkOrders])

  // Dynamic Live KPIs (Directly from PostgreSQL summary API)
  const activeWOCount = summary?.activeWorkOrdersCount ?? 0
  const inProgressCount = summary?.inProgressWorkOrdersCount ?? 0
  const queueCount = summary?.queueWorkOrdersCount ?? 0
  const todayAppCount = summary?.todayAppointmentsCount ?? 0
  const criticalStock = summary?.criticalStockCount ?? 0
  const openInvoicesCount = summary?.unpaidInvoicesCount ?? 0
  const totalReceivables = summary?.unpaidTotal ?? 0
  const todayRevenue = summary?.todayRevenue ?? 0
  const monthlyRevenue = summary?.monthlyRevenue ?? 0

  return (
    <div className="space-y-6 pb-12">
      {/* Premium Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            {/* Live Operational Pulse & Date Bar */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Servis Operasyonu Aktif
              </span>
              {formattedDate && (
                <>
                  <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                  <span className="text-slate-600 dark:text-slate-400 text-xs flex items-center gap-1">
                    <Calendar size={13} className="text-slate-400" />
                    {formattedDate}
                  </span>
                </>
              )}
              {isTechnician && (
                <>
                  <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                  <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border", todayShift.badgeColor)}>
                    <Clock size={12} />
                    Vardiya: {todayShift.time}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20">
                    <Calendar size={12} />
                    Kalan İzin: {userLeaveBalance.remainingDays} Gün
                  </span>
                </>
              )}
            </div>

            {/* Greeting Title with Role Accent */}
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{greetingInfo.text}, {displayName}</span>
                {isTechnician && (
                  <span className="text-amber-600 dark:text-amber-400 font-black">
                    Usta
                  </span>
                )}
                <span className="text-xl sm:text-2xl select-none" role="img" aria-label="günün zamanı">
                  {greetingInfo.icon}
                </span>
              </h1>
            </div>

            {/* Dynamic Briefing Subtext */}
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-2xl leading-relaxed">
              {(() => {
                if (isTechnician) {
                  const shiftStatusMsg = todayShift.status === "WORKING"
                    ? `Bugün vardiyanız ${todayShift.time} saatleri arasında.`
                    : `Bugün ${todayShift.time} durumundasınız.`
                  const leaveMsg = `Kalan yıllık izin hakkınız: ${userLeaveBalance.remainingDays} gün (${userLeaveBalance.usedDays} gün kullanıldı).`

                  if (myAssignedOrdersCount > 0) {
                    return `${shiftStatusMsg} ${leaveMsg} Üzerinizde ${myAssignedOrdersCount} aktif iş emri bulunuyor, lift sizi bekliyor. Atölyede toplam ${inProgressCount} araç işlemde, ${queueCount} araç sırada bekliyor.`;
                  }
                  return `${shiftStatusMsg} ${leaveMsg} Şu an üzerinize doğrudan atanmış aktif iş emri bulunmuyor. Atölyede ${inProgressCount} araç işlemde, sıradaki ${queueCount} aracı inceleyebilirsiniz.`;
                }

                const parts: string[] = [];
                if (currentHour >= 5 && currentHour < 12) {
                  parts.push(`Bugün ${todayAppCount} randevu planlandı.`);
                  if (inProgressCount > 0 || queueCount > 0) {
                    parts.push(`Atölyede ${inProgressCount} araç işlemde, ${queueCount} araç sırada. Verimli bir gün dileriz!`);
                  } else {
                    parts.push("Atölye yeni güne hazır. Verimli bir çalışma günü dileriz!");
                  }
                } else if (currentHour >= 12 && currentHour < 18) {
                  if (inProgressCount > 0 && queueCount > 0) {
                    parts.push(`Atölyede yoğun mesai: ${inProgressCount} araç liftte işlem görüyor, ${queueCount} araç sırada bekliyor.`);
                  } else if (inProgressCount > 0) {
                    parts.push(`Atölyede şu an ${inProgressCount} araç işlem görüyor.`);
                  } else {
                    parts.push(`Atölyede bekleyen araç bulunmuyor.`);
                  }
                  if (criticalStock > 0) {
                    parts.push(`${criticalStock} adet parça kritik stok seviyesinde.`);
                  } else {
                    parts.push(`${todayAppCount} kayıtlı randevu takip ediliyor.`);
                  }
                } else {
                  if (inProgressCount > 0) {
                    parts.push(`Günün son işlemleri: Atölyede ${inProgressCount} araç işlem görmeye devam ediyor.`);
                  } else {
                    parts.push(`Günün atölye işlemleri büyük ölçüde tamamlandı.`);
                  }
                  parts.push(`Gün sonu teslimatlarını, kasayı ve açık faturaları inceleyebilirsiniz.`);
                }
                return parts.join(" ");
              })()}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/work-orders">
              <Button
                variant="outline"
                className="text-xs h-10 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 gap-1.5 cursor-pointer"
              >
                <Wrench size={14} />
                <span>Atölye Panosu</span>
              </Button>
            </Link>
            <Link href="/appointments">
              <Button className="text-xs h-10 gap-1.5 shadow-sky-500/25 cursor-pointer">
                <Plus size={16} />
                <span>Randevu Oluştur</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Live Dynamic KPI Stats Cards */}
      <div
        data-tour="tour-kpis"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5"
      >
        {isTechnician ? (
          <>
            {/* 1: Shift Hours / Status */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 shadow-xs hover:shadow-md hover:border-sky-500/40 dark:hover:border-sky-500/40 transition-all duration-200 p-4.5 flex flex-col justify-between group">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-500 to-sky-400/30" />
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                  Bugünkü Vardiyam
                </span>
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20 shrink-0 group-hover:scale-105 transition-transform">
                  <Clock size={16} />
                </div>
              </div>
              <div className="my-2.5">
                <p className="text-xl sm:text-[21px] font-black text-sky-600 dark:text-sky-400 font-mono tracking-tight whitespace-nowrap">
                  {todayShift.time}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0 animate-pulse" />
                <span className="truncate">{todayShift.label}</span>
                {user?.mechanic?.assignedLift && (
                  <span className="text-slate-400 dark:text-slate-500 font-semibold shrink-0">• {user.mechanic.assignedLift}</span>
                )}
              </div>
            </div>

            {/* 2: Annual Leave Balance */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 shadow-xs hover:shadow-md hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all duration-200 p-4.5 flex flex-col justify-between group">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-400/30" />
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                  Yıllık İzin Bakiyem
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0 group-hover:scale-105 transition-transform">
                  <Calendar size={16} />
                </div>
              </div>
              <div className="my-2.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">
                  {userLeaveBalance.remainingDays}
                </span>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Gün Kaldı</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <Calendar size={12} className="text-indigo-500 shrink-0" />
                <span className="truncate">{userLeaveBalance.usedDays} gün kullanıldı / {userLeaveBalance.totalDays} hak</span>
              </div>
            </div>

            {/* 3: Assigned Active Work Orders */}
            <Link href="/work-orders" className="group h-full">
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 shadow-xs hover:shadow-md hover:border-amber-500/40 dark:hover:border-amber-500/40 hover:-translate-y-0.5 transition-all duration-200 p-4.5 flex flex-col justify-between h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-amber-400/30" />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                    Üzerimdeki İşler
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0 group-hover:scale-105 transition-transform">
                    <Wrench size={16} />
                  </div>
                </div>
                <div className="my-2.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                    {myAssignedOrdersCount}
                  </span>
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Aktif İş</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium truncate pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <Wrench size={12} className="shrink-0" />
                  <span className="truncate">Bana zimmetli iş emirleri</span>
                </div>
              </div>
            </Link>

            {/* 4: Total Active Workshop Vehicles */}
            <Link href="/work-orders" className="group h-full">
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 shadow-xs hover:shadow-md hover:border-sky-500/40 dark:hover:border-sky-500/40 hover:-translate-y-0.5 transition-all duration-200 p-4.5 flex flex-col justify-between h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-sky-400/30" />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                    Atölye (Genel Durum)
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20 shrink-0 group-hover:scale-105 transition-transform">
                    <Layers size={16} />
                  </div>
                </div>
                <div className="my-2.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                    {activeWOCount}
                  </span>
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Araç Serviste</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-sky-600 dark:text-sky-400 font-medium truncate pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <Layers size={12} className="shrink-0" />
                  <span className="truncate">{inProgressCount} liftte, {queueCount} sırada</span>
                </div>
              </div>
            </Link>

            {/* 5: Completed Work Orders */}
            <Link href="/work-orders" className="group h-full">
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 shadow-xs hover:shadow-md hover:border-emerald-500/40 dark:hover:border-emerald-500/40 hover:-translate-y-0.5 transition-all duration-200 p-4.5 flex flex-col justify-between h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-400/30" />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                    Tamamlanan İşler
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0 group-hover:scale-105 transition-transform">
                    <CheckCircle2 size={16} />
                  </div>
                </div>
                <div className="my-2.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                    {recentOrders.filter((w) => w.status === "COMPLETED").length}
                  </span>
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Araç Bitti</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <CheckCircle2 size={12} className="shrink-0" />
                  <span className="truncate">Teslimata hazır araçlar</span>
                </div>
              </div>
            </Link>
          </>
        ) : (
          <>
            {/* Daily Cash & Revenue Card (for Service Managers / Owners) */}
            <Link href="/reports" className="group h-full">
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 shadow-xs hover:shadow-md hover:border-emerald-500/40 dark:hover:border-emerald-500/40 hover:-translate-y-0.5 transition-all duration-200 p-4.5 flex flex-col justify-between h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400/30" />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                    Bugünkü Kasa / Ciro
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0 group-hover:scale-105 transition-transform">
                    <CreditCard size={16} />
                  </div>
                </div>
                <div className="my-2.5">
                  <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight whitespace-nowrap truncate">
                    ₺ {todayRevenue.toLocaleString("tr-TR")}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <TrendingUp size={12} className="text-emerald-500 shrink-0" />
                  <span className="truncate">Bu ay: ₺{monthlyRevenue.toLocaleString("tr-TR")}</span>
                </div>
              </div>
            </Link>

            {/* Appointments Card */}
            <Link href="/appointments" className="group h-full">
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 shadow-xs hover:shadow-md hover:border-sky-500/40 dark:hover:border-sky-500/40 hover:-translate-y-0.5 transition-all duration-200 p-4.5 flex flex-col justify-between h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-500 to-sky-400/30" />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                    Kayıtlı Randevular
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20 shrink-0 group-hover:scale-105 transition-transform">
                    <Calendar size={16} />
                  </div>
                </div>
                <div className="my-2.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                    {todayAppCount}
                  </span>
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Randevu</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <CheckCircle2 size={12} className="shrink-0" />
                  <span className="truncate">Takvim slotları aktif</span>
                </div>
              </div>
            </Link>

            {/* Workshop In-Progress Card */}
            <Link href="/work-orders" className="group h-full">
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 shadow-xs hover:shadow-md hover:border-amber-500/40 dark:hover:border-amber-500/40 hover:-translate-y-0.5 transition-all duration-200 p-4.5 flex flex-col justify-between h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-amber-400/30" />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                    Atölye (Aktif Araçlar)
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0 group-hover:scale-105 transition-transform">
                    <Wrench size={16} />
                  </div>
                </div>
                <div className="my-2.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                    {activeWOCount}
                  </span>
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">İş Emri</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium truncate pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <Clock size={12} className="shrink-0" />
                  <span className="truncate">{inProgressCount} liftte, {queueCount} sırada</span>
                </div>
              </div>
            </Link>

            {/* Critical Stock Alert Card */}
            <Link href="/inventory" className="group h-full">
              <div className={cn(
                "relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-4.5 flex flex-col justify-between h-full",
                criticalStock > 0 ? "hover:border-rose-500/40 dark:hover:border-rose-500/40" : "hover:border-emerald-500/40 dark:hover:border-emerald-500/40"
              )}>
                <div className={cn(
                  "absolute top-0 inset-x-0 h-1 bg-gradient-to-r",
                  criticalStock > 0 ? "from-rose-500 to-rose-400/30" : "from-emerald-500 to-emerald-400/30"
                )} />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                    {criticalStock > 0 ? "Kritik Stok Uyarısı" : "Stok Durumu"}
                  </span>
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 group-hover:scale-105 transition-transform",
                    criticalStock > 0
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  )}>
                    <Package size={16} />
                  </div>
                </div>
                <div className="my-2.5 flex items-baseline gap-1.5">
                  <span className={cn(
                    "text-2xl font-black font-mono tracking-tight",
                    criticalStock > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-slate-100"
                  )}>
                    {criticalStock}
                  </span>
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Parça</span>
                </div>
                <div className={cn(
                  "flex items-center gap-1.5 text-[11px] font-medium truncate pt-2 border-t border-slate-100 dark:border-slate-800/80",
                  criticalStock > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                )}>
                  {criticalStock > 0 ? (
                    <>
                      <AlertCircle size={12} className="shrink-0" />
                      <span className="truncate">Sipariş eşiği aşıldı</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={12} className="shrink-0" />
                      <span className="truncate">Stok seviyeleri yeterli</span>
                    </>
                  )}
                </div>
              </div>
            </Link>

            {/* Bekleyen Alacak Card */}
            <Link href="/invoices" className="group h-full">
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 shadow-xs hover:shadow-md hover:border-indigo-500/40 dark:hover:border-indigo-500/40 hover:-translate-y-0.5 transition-all duration-200 p-4.5 flex flex-col justify-between h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-400/30" />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                    Bekleyen Alacak
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0 group-hover:scale-105 transition-transform">
                    <Receipt size={16} />
                  </div>
                </div>
                <div className="my-2.5">
                  <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight whitespace-nowrap truncate">
                    {totalReceivables.toLocaleString("tr-TR")} ₺
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-sky-600 dark:text-sky-400 font-medium truncate pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <TrendingUp size={12} className="shrink-0" />
                  <span className="truncate">{openInvoicesCount} açık fatura</span>
                </div>
              </div>
            </Link>
          </>
        )}
      </div>

      {/* Quick Launch & Active Work Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Vehicles in Workshop */}
        <div data-tour="tour-work-orders" className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Liftte Olan ve İşlem Gören Araçlar
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atölyedeki anlık teknisyen atamaları ve işlemler
              </p>
            </div>
            <Link
              href="/work-orders"
              className="text-xs text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Atölye Panosuna Git</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">Kayıtlı aktif iş emri bulunamadı.</p>
            ) : (
              recentOrders.slice(0, 4).map((wo) => (
                <Link key={wo.id} href={`/work-orders/${wo.id}`} className="block group">
                  <Card className="hover:border-sky-500/40 transition-all p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          <Car size={20} className="text-sky-600 dark:text-sky-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <PlateBadge plate={wo.plate} size="xs" />
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {wo.brand} {wo.model} ({wo.year})
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                            {wo.services.map((s) => s.name).join(", ") || "Genel Bakım ve Kontrol"}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Müşteri: <strong className="text-slate-700 dark:text-slate-300">{wo.customerName}</strong> • Usta: {wo.assignedMechanicName || "Belirlenmedi"} ({wo.assignedLift || "Lift-"})
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                        <WorkOrderStatusBadge status={wo.status} />
                        <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                          {wo.grandTotal.toLocaleString("tr-TR")} ₺
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right: Quick Module Navigation */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Hızlı Modül Kısayolları
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sık kullanılan operasyonel menüler
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              {
                title: "Müşteri ve Araç Yönetimi",
                desc: "Kayıtlı müşteriler, plakalar ve servis geçmişi",
                href: "/customers",
                icon: Users,
                color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
              },
              {
                title: "Randevu Takvimi",
                desc: "Haftalık ve günlük servis slotları",
                href: "/appointments",
                icon: Calendar,
                color: "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20",
              },
              {
                title: "Atölye & İş Emirleri Panosu",
                desc: "Liftte araçlar, usta notları ve fotoğraflar",
                href: "/work-orders",
                icon: Wrench,
                color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
              },
              {
                title: "Yedek Parça & Envanter",
                desc: "Stok durumu, kritik stok uyarıları ve hareketler",
                href: "/inventory",
                icon: Package,
                color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
              },
              {
                title: "Fatura ve Günlük Kasa",
                desc: "Kesilen faturalar, nakit/pos kasa ve tahsilatlar",
                href: "/invoices",
                icon: Receipt,
                color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
              },
            ].map((mod) => (
              <Link key={mod.href} href={mod.href} className="group cursor-pointer">
                <Card className="p-3.5 hover:border-sky-500/40 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${mod.color}`}>
                      <mod.icon size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">
                        {mod.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {mod.desc}
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}