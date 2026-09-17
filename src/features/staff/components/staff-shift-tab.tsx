"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  Calendar,
  Clock,
  Printer,
  ChevronLeft,
  ChevronRight,
  Coffee,
  X,
  Plus,
  Settings2,
  CalendarDays,
  LayoutGrid,
  Table as TableIcon,
  Users,
  Wand2,
  Trash2,
  RotateCcw,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/sonner"
import type { StaffRecord, StaffLeave } from "@/features/staff/api/use-staff-management"
import { CorporatePrintDocument } from "@/components/print/corporate-print-document"
import { useAuth } from "@/features/auth/auth-context"
import { cn, formatLocalDate } from "@/lib/utils"

export interface CustomShiftDefinition {
  id: string
  label: string
  shortLabel: string
  hours: string
  durationHours: number
  color: string
  badgeColor: string
}

export const UNASSIGNED_SHIFT: CustomShiftDefinition = {
  id: "NONE",
  label: "Planlanmadı",
  shortLabel: "Boş",
  hours: "Vardiya Yok",
  durationHours: 0,
  color: "text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/80 dark:border-slate-800 border-dashed",
  badgeColor: "bg-slate-300 dark:bg-slate-700 text-slate-500",
}

export function parseHoursDuration(start: string, end: string): number {
  const [sh, sm] = (start || "").split(":").map(Number)
  const [eh, em] = (end || "").split(":").map(Number)
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 9
  const totalMin = eh * 60 + em - (sh * 60 + sm)
  return Math.max(0, Math.round((totalMin / 60) * 10) / 10)
}

export function getDefaultShifts(workStartTime = "08:30", workEndTime = "18:30"): CustomShiftDefinition[] {
  const duration = parseHoursDuration(workStartTime, workEndTime)
  return [
    {
      id: "NORMAL",
      label: "Normal Mesai",
      shortLabel: "Normal",
      hours: `${workStartTime} - ${workEndTime}`,
      durationHours: duration,
      color: "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20",
      badgeColor: "bg-sky-500 text-white",
    },
    {
      id: "EARLY",
      label: "Erken Vardiya",
      shortLabel: "Erken",
      hours: "08:00 - 17:00",
      durationHours: 8.5,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      badgeColor: "bg-emerald-500 text-white",
    },
    {
      id: "LATE_DUTY",
      label: "Nöbetçi / Geç Vardiya",
      shortLabel: "Nöbetçi",
      hours: "10:00 - 19:30",
      durationHours: 9,
      color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
      badgeColor: "bg-amber-500 text-white",
    },
    {
      id: "HALF_DAY",
      label: "Cumartesi Yarım Gün",
      shortLabel: "Yarım Gün",
      hours: "09:00 - 14:00",
      durationHours: 5,
      color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      badgeColor: "bg-indigo-500 text-white",
    },
    {
      id: "OFF",
      label: "Haftalık İzin (Tatil)",
      shortLabel: "İzinli",
      hours: "İzinli",
      durationHours: 0,
      color: "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
      badgeColor: "bg-slate-400 text-white",
    },
  ]
}

export const INITIAL_SHIFTS: CustomShiftDefinition[] = getDefaultShifts("08:30", "18:30")


const DAYS_OF_WEEK = [
  { key: "mon", label: "Pazartesi", short: "Pzt" },
  { key: "tue", label: "Salı", short: "Sal" },
  { key: "wed", label: "Çarşamba", short: "Çar" },
  { key: "thu", label: "Perşembe", short: "Per" },
  { key: "fri", label: "Cuma", short: "Cum" },
  { key: "sat", label: "Cumartesi", short: "Cmt" },
  { key: "sun", label: "Pazar", short: "Paz" },
]

type ViewMode = "week-calendar" | "month-calendar" | "matrix"

interface StaffShiftTabProps {
  staffList: StaffRecord[]
  leaves?: StaffLeave[]
  onOpenLeaveModal?: (userId?: string) => void
}

export function StaffShiftTab({
  staffList,
  leaves = [],
  onOpenLeaveModal,
}: StaffShiftTabProps) {
  const { tenant } = useAuth()
  const tenantStart = tenant?.workStartTime || "08:30"
  const tenantEnd = tenant?.workEndTime || "18:30"
  const tenantHours = `${tenantStart} - ${tenantEnd}`
  const tenantDuration = React.useMemo(
    () => parseHoursDuration(tenantStart, tenantEnd),
    [tenantStart, tenantEnd]
  )

  // Working day validation according to Onboarding Wizard settings
  const isWorkingDay = React.useCallback(
    (dayLabel: string) => {
      if (tenant?.workingDays && tenant.workingDays.length > 0) {
        return tenant.workingDays.includes(dayLabel)
      }
      return dayLabel !== "Pazar"
    },
    [tenant?.workingDays]
  )

  // View state: week calendar (default), month calendar, or matrix table
  const [viewMode, setViewMode] = React.useState<ViewMode>("week-calendar")

  // Week offset state (0 = current week, +1 = next week, -1 = last week)
  const [weekOffset, setWeekOffset] = React.useState(0)
  // Month offset state (for month calendar)
  const [monthOffset, setMonthOffset] = React.useState(0)

  // Shift Definitions state (persisted in localStorage, synced with tenant onboarding)
  const [shiftDefinitions, setShiftDefinitions] = React.useState<CustomShiftDefinition[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("worksauto_shift_definitions")
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        }
      } catch {}
    }
    return getDefaultShifts(tenantStart, tenantEnd)
  })

  // Sync "NORMAL" shift with tenant's configured hours from onboarding
  React.useEffect(() => {
    setShiftDefinitions((prev) => {
      let changed = false
      const next = prev.map((s) => {
        if (s.id === "NORMAL" && (s.hours !== tenantHours || s.durationHours !== tenantDuration)) {
          changed = true
          return {
            ...s,
            hours: tenantHours,
            durationHours: tenantDuration,
          }
        }
        return s
      })
      if (changed) {
        try {
          localStorage.setItem("worksauto_shift_definitions", JSON.stringify(next))
        } catch {}
        return next
      }
      return prev
    })
  }, [tenantHours, tenantDuration])

  // Shift Schedule Matrix State: { [technicianId_dateStr]: shiftTypeId }
  const [scheduleState, setScheduleState] = React.useState<Record<string, string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("worksauto_staff_weekly_shifts")
        if (saved) return JSON.parse(saved)
      } catch {}
    }
    return {}
  })

  // Quick edit popover state
  const [activeCell, setActiveCell] = React.useState<{
    staffId: string
    dateStr: string
    dayLabel: string
    staffName: string
  } | null>(null)

  // Custom shift modal state
  const [cellModalTab, setCellModalTab] = React.useState<"PRESET" | "CUSTOM">("PRESET")
  const [customStart, setCustomStart] = React.useState(tenantStart)
  const [customEnd, setCustomEnd] = React.useState(tenantEnd)
  const [customTitle, setCustomTitle] = React.useState("")
  const [applyToAllWeek, setApplyToAllWeek] = React.useState(false)

  // Reset custom times when activeCell changes
  React.useEffect(() => {
    if (activeCell) {
      setCustomStart(tenantStart)
      setCustomEnd(tenantEnd)
      setCustomTitle("")
      setApplyToAllWeek(false)
      setCellModalTab("PRESET")
    }
  }, [activeCell, tenantStart, tenantEnd])

  // Modals
  const [isShiftManagerOpen, setIsShiftManagerOpen] = React.useState(false)
  const [isPrintModalOpen, setIsPrintModalOpen] = React.useState(false)
  const [printOption, setPrintOption] = React.useState<"weekly" | "monthly">("weekly")

  // Shift manager form state
  const [newShiftLabel, setNewShiftLabel] = React.useState("")
  const [newShiftHours, setNewShiftHours] = React.useState("09:00 - 18:00")
  const [newShiftDuration, setNewShiftDuration] = React.useState("8")
  const [newShiftColor, setNewShiftColor] = React.useState("sky")

  // Persist shift definitions
  const updateShiftDefinitions = (defs: CustomShiftDefinition[]) => {
    setShiftDefinitions(defs)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("worksauto_shift_definitions", JSON.stringify(defs))
      } catch {}
    }
  }

  // Active technicians
  const activeTechnicians = React.useMemo(() => {
    return staffList.filter((s) => s.role === "TECHNICIAN" && s.isActive !== false)
  }, [staffList])

  // Current selected week calculation
  const weekInfo = React.useMemo(() => {
    const now = new Date()
    now.setDate(now.getDate() + weekOffset * 7)

    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Monday as first day
    const monday = new Date(now.setDate(diff))
    monday.setHours(0, 0, 0, 0)

    const days = DAYS_OF_WEEK.map((d, index) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + index)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const dayNum = String(date.getDate()).padStart(2, "0")
      const dateStr = `${year}-${month}-${dayNum}`

      const todayStr = formatLocalDate(new Date())
      const isToday = todayStr === dateStr

      return {
        ...d,
        date,
        dateStr,
        dayNumber: date.getDate(),
        isToday,
        isWeekend: d.key === "sat" || d.key === "sun",
      }
    })

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    const formatter = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long" })
    const rangeLabel = `${formatter.format(monday)} - ${formatter.format(sunday)} ${sunday.getFullYear()}`

    const shortFormatter = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" })
    const shortRangeLabel = `${shortFormatter.format(monday)} - ${shortFormatter.format(sunday)}`

    let weekTitle = "Bu Hafta"
    if (weekOffset === 1) weekTitle = "Gelecek Hafta"
    else if (weekOffset === -1) weekTitle = "Geçen Hafta"
    else if (weekOffset > 1) weekTitle = `+${weekOffset} Hafta Sonra`
    else if (weekOffset < -1) weekTitle = `${Math.abs(weekOffset)} Hafta Önce`

    return { monday, sunday, days, rangeLabel, shortRangeLabel, weekTitle }
  }, [weekOffset])

  // Current selected month calculation
  const monthInfo = React.useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + monthOffset)
    const year = d.getFullYear()
    const month = d.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    const titleFormatter = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" })
    const monthTitle = titleFormatter.format(firstDay)

    // Generate all days in month
    const totalDays = lastDay.getDate()
    const monthDays: { dateStr: string; dayNumber: number; isToday: boolean; dayOfWeek: number }[] = []

    const todayStr = formatLocalDate(new Date())

    for (let i = 1; i <= totalDays; i++) {
      const curDate = new Date(year, month, i)
      const mStr = String(month + 1).padStart(2, "0")
      const dStr = String(i).padStart(2, "0")
      const dateStr = `${year}-${mStr}-${dStr}`

      monthDays.push({
        dateStr,
        dayNumber: i,
        isToday: dateStr === todayStr,
        dayOfWeek: curDate.getDay() === 0 ? 6 : curDate.getDay() - 1, // 0 = Mon, 6 = Sun
      })
    }

    return { monthTitle, year, month, firstDay, lastDay, monthDays }
  }, [monthOffset])

  // Check if a staff member is on approved leave on a given dateStr
  const getStaffLeaveOnDate = React.useCallback(
    (userId: string, dateStr: string) => {
      return leaves.find((l) => {
        if (l.userId !== userId) return false
        if (l.status === "CANCELLED") return false
        const start = l.startDate.slice(0, 10)
        const end = l.endDate.slice(0, 10)
        return dateStr >= start && dateStr <= end
      })
    },
    [leaves]
  )

  // Helper to resolve shift for a technician on a date
  const getShift = React.useCallback(
    (staffId: string, dateStr: string, _isWeekend: boolean): CustomShiftDefinition => {
      // 1. Check if user is on approved leave
      const leave = getStaffLeaveOnDate(staffId, dateStr)
      if (leave) {
        let leaveLabel = "Yıllık İzin"
        if (leave.leaveType === "SICK") leaveLabel = "Sağlık / Rapor"
        else if (leave.leaveType === "COMPASSIONATE") leaveLabel = "Mazeret İzni"
        else if (leave.leaveType === "UNPAID") leaveLabel = "Ücretsiz İzin"

        return {
          id: "OFF",
          label: `İzinli (${leaveLabel})`,
          shortLabel: "İzinli",
          hours: "İzinli",
          durationHours: 0,
          color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
          badgeColor: "bg-rose-500 text-white",
        }
      }

      // 2. Check scheduled state
      const key = `${staffId}_${dateStr}`
      const shiftId = scheduleState[key]
      if (shiftId) {
        if (shiftId === "NONE") return UNASSIGNED_SHIFT
        const found = shiftDefinitions.find((s) => s.id === shiftId)
        if (found) return found
      }

      // 3. Varsayılan: Planlanmamış / Boş (Dolu veri dayatması yapmaz)
      return UNASSIGNED_SHIFT
    },
    [scheduleState, shiftDefinitions, getStaffLeaveOnDate]
  )

  // Handle shift assignment (or clearing)
  const handleAssignShift = (
    staffId: string,
    dateStr: string,
    shiftId: string,
    applyToAllDays = false
  ) => {
    const updated = { ...scheduleState }
    if (applyToAllDays) {
      weekInfo.days.forEach((day) => {
        if (isWorkingDay(day.label)) {
          updated[`${staffId}_${day.dateStr}`] = shiftId
        }
      })
      toast.success("Vardiya ustanın bu haftaki tüm çalışma günlerine uygulandı.")
    } else {
      const key = `${staffId}_${dateStr}`
      if (shiftId === "NONE") {
        delete updated[key]
        toast.info("Vardiya kaldırıldı / gün boşaltıldı.")
      } else {
        updated[key] = shiftId
        toast.success("Vardiya güncellendi.")
      }
    }
    setScheduleState(updated)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("worksauto_staff_weekly_shifts", JSON.stringify(updated))
      } catch {}
    }
    setActiveCell(null)
  }

  // Handle custom working hours assignment for staff
  const handleAssignCustomHours = () => {
    if (!activeCell) return
    const hoursStr = `${customStart} - ${customEnd}`
    const dur = parseHoursDuration(customStart, customEnd)
    const customId = `CUSTOM_${customStart.replace(":", "")}_${customEnd.replace(":", "")}`

    let targetShift = shiftDefinitions.find((s) => s.hours === hoursStr)
    if (!targetShift) {
      targetShift = {
        id: customId,
        label: customTitle.trim() || `Özel Mesai (${hoursStr})`,
        shortLabel: "Özel",
        hours: hoursStr,
        durationHours: dur,
        color: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
        badgeColor: "bg-purple-500 text-white",
      }
      updateShiftDefinitions([...shiftDefinitions, targetShift])
    }

    handleAssignShift(activeCell.staffId, activeCell.dateStr, targetShift.id, applyToAllWeek)
  }

  // Apply standard shift schedule to all active technicians for this week (using Onboarding settings)
  const handleApplyStandardWeek = () => {
    const updated = { ...scheduleState }
    activeTechnicians.forEach((t) => {
      weekInfo.days.forEach((day) => {
        const key = `${t.id}_${day.dateStr}`
        if (!isWorkingDay(day.label)) {
          updated[key] = "OFF"
        } else if (day.key === "sat" && !tenant?.workingDays?.includes("Cumartesi")) {
          updated[key] = "OFF"
        } else if (day.key === "sat" && tenantHours.includes("14:00")) {
          updated[key] = "HALF_DAY"
        } else {
          updated[key] = "NORMAL"
        }
      })
    })
    setScheduleState(updated)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("worksauto_staff_weekly_shifts", JSON.stringify(updated))
      } catch {}
    }
    toast.success("Tüm ustalara işletme çalışma günlerine göre standart mesai atandı.")
  }

  // Clear all shifts for current week
  const handleClearCurrentWeek = () => {
    const updated = { ...scheduleState }
    activeTechnicians.forEach((t) => {
      weekInfo.days.forEach((day) => {
        const key = `${t.id}_${day.dateStr}`
        delete updated[key]
      })
    })
    setScheduleState(updated)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("worksauto_staff_weekly_shifts", JSON.stringify(updated))
      } catch {}
    }
    toast.info("Bu haftanın vardiya planı temizlendi.")
  }

  // Apply standard week for a single technician (using Onboarding settings)
  const handleApplyStandardWeekForTech = (techId: string) => {
    const updated = { ...scheduleState }
    weekInfo.days.forEach((day) => {
      const key = `${techId}_${day.dateStr}`
      if (!isWorkingDay(day.label)) {
        updated[key] = "OFF"
      } else if (day.key === "sat" && !tenant?.workingDays?.includes("Cumartesi")) {
        updated[key] = "OFF"
      } else if (day.key === "sat" && tenantHours.includes("14:00")) {
        updated[key] = "HALF_DAY"
      } else {
        updated[key] = "NORMAL"
      }
    })
    setScheduleState(updated)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("worksauto_staff_weekly_shifts", JSON.stringify(updated))
      } catch {}
    }
    toast.success("Ustanın haftalık mesaisi dolduruldu.")
  }

  // Clear week for a single technician
  const handleClearWeekForTech = (techId: string) => {
    const updated = { ...scheduleState }
    weekInfo.days.forEach((day) => {
      const key = `${techId}_${day.dateStr}`
      delete updated[key]
    })
    setScheduleState(updated)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("worksauto_staff_weekly_shifts", JSON.stringify(updated))
      } catch {}
    }
    toast.info("Ustanın bu haftaki vardiyaları temizlendi.")
  }

  // Add new shift definition
  const handleCreateShiftType = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newShiftLabel.trim()
    if (!trimmed) {
      toast.error("Vardiya adı giriniz.")
      return
    }
    const newId = "SHIFT_" + Date.now().toString(36).toUpperCase()
    const hoursNum = parseFloat(newShiftDuration) || 8

    const colorConfig =
      newShiftColor === "emerald"
        ? { color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20", badgeColor: "bg-emerald-500 text-white" }
        : newShiftColor === "amber"
        ? { color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20", badgeColor: "bg-amber-500 text-white" }
        : newShiftColor === "purple"
        ? { color: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20", badgeColor: "bg-purple-500 text-white" }
        : { color: "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20", badgeColor: "bg-sky-500 text-white" }

    const created: CustomShiftDefinition = {
      id: newId,
      label: trimmed,
      shortLabel: trimmed.slice(0, 6),
      hours: newShiftHours,
      durationHours: hoursNum,
      ...colorConfig,
    }

    const updated = [...shiftDefinitions, created]
    updateShiftDefinitions(updated)
    setNewShiftLabel("")
    toast.success(`"${trimmed}" vardiyası eklendi.`)
  }

  const handleDeleteShiftType = (id: string) => {
    if (shiftDefinitions.length <= 2) {
      toast.error("En az 2 vardiya tipi bulunmalıdır.")
      return
    }
    const updated = shiftDefinitions.filter((s) => s.id !== id)
    updateShiftDefinitions(updated)
    toast.info("Vardiya tipi silindi.")
  }

  // Daily summary stats for selected week
  const dailySummaries = React.useMemo(() => {
    return weekInfo.days.map((day) => {
      let workingStaffCount = 0
      let offStaffCount = 0
      let lateDutyStaffName = ""

      activeTechnicians.forEach((t) => {
        const shift = getShift(t.id, day.dateStr, day.isWeekend)
        if (shift.id === "OFF") {
          offStaffCount++
        } else if (shift.id !== "NONE" && shift.durationHours > 0) {
          workingStaffCount++
        }
        if (shift.id === "LATE_DUTY") {
          lateDutyStaffName = t.name
        }
      })

      return {
        ...day,
        workingStaffCount,
        offStaffCount,
        lateDutyStaffName,
      }
    })
  }, [weekInfo, activeTechnicians, getShift])

  // Total weekly capacity hours for the workshop
  const totalWeeklyCapacity = React.useMemo(() => {
    let total = 0
    activeTechnicians.forEach((t) => {
      weekInfo.days.forEach((day) => {
        const s = getShift(t.id, day.dateStr, day.isWeekend)
        total += s.durationHours
      })
    })
    return total
  }, [activeTechnicians, weekInfo, getShift])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Left: View Mode Switcher + Title */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="text-sky-500" size={18} />
              <span>Vardiya & Çalışma Takvimi</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {viewMode === "month-calendar" ? monthInfo.monthTitle : weekInfo.rangeLabel}
            </p>
          </div>

          {/* View Mode Buttons (Randevular Tarzı) */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setViewMode("week-calendar")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                viewMode === "week-calendar"
                  ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <CalendarDays size={14} />
              <span>Haftalık Takvim</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("month-calendar")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                viewMode === "month-calendar"
                  ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <LayoutGrid size={14} />
              <span>Aylık Takvim</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("matrix")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                viewMode === "matrix"
                  ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <TableIcon size={14} />
              <span>Matris Tablosu</span>
            </button>
          </div>
        </div>

        {/* Right: Date Navigation & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Week/Month Navigation */}
          {viewMode === "month-calendar" ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMonthOffset((prev) => prev - 1)}
                  className="h-7 w-7 p-0 rounded-xl cursor-pointer text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  title="Önceki Ay"
                >
                  <ChevronLeft size={15} />
                </Button>
                <div className="px-3 py-0.5 text-center min-w-[110px]">
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    {monthInfo.monthTitle}
                  </span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {monthOffset === 0
                      ? "Bu Ay"
                      : monthOffset === 1
                      ? "Gelecek Ay"
                      : monthOffset === -1
                      ? "Geçen Ay"
                      : `${Math.abs(monthOffset)} Ay ${monthOffset > 0 ? "Sonra" : "Önce"}`}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMonthOffset((prev) => prev + 1)}
                  className="h-7 w-7 p-0 rounded-xl cursor-pointer text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  title="Sonraki Ay"
                >
                  <ChevronRight size={15} />
                </Button>
              </div>

              {monthOffset !== 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMonthOffset(0)}
                  className="h-8 text-xs gap-1.5 cursor-pointer text-sky-600 dark:text-sky-400 border-sky-500/30 hover:bg-sky-50 dark:hover:bg-sky-950/30 font-semibold rounded-xl"
                  title="Bu aya geri dön"
                >
                  <RotateCcw size={12} />
                  <span>Bu Ay</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWeekOffset((prev) => prev - 1)}
                  className="h-7 w-7 p-0 rounded-xl cursor-pointer text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  title="Önceki Hafta"
                >
                  <ChevronLeft size={15} />
                </Button>
                <div className="px-3 py-0.5 text-center min-w-[130px]">
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    {weekInfo.weekTitle}
                  </span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {weekInfo.shortRangeLabel}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWeekOffset((prev) => prev + 1)}
                  className="h-7 w-7 p-0 rounded-xl cursor-pointer text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  title="Sonraki Hafta"
                >
                  <ChevronRight size={15} />
                </Button>
              </div>

              {weekOffset !== 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setWeekOffset(0)}
                  className="h-8 text-xs gap-1.5 cursor-pointer text-sky-600 dark:text-sky-400 border-sky-500/30 hover:bg-sky-50 dark:hover:bg-sky-950/30 font-semibold rounded-xl"
                  title="Bu haftaya geri dön"
                >
                  <RotateCcw size={12} />
                  <span>Bu Hafta</span>
                </Button>
              )}
            </div>
          )}

          {/* Apply Standard Week Schedule */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleApplyStandardWeek}
            className="h-9 text-xs gap-1.5 cursor-pointer text-sky-700 dark:text-sky-300 border-sky-500/30 hover:bg-sky-50 dark:hover:bg-sky-950/30 font-semibold"
            title="Tüm ustalara standart hafta içi 08:30-18:30 mesaisi atar"
          >
            <Wand2 size={14} className="text-sky-500" />
            <span>Standart Şablon Doldur</span>
          </Button>

          {/* Clear Current Week Schedule */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearCurrentWeek}
            className="h-9 text-xs gap-1.5 cursor-pointer text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            title="Seçili haftanın tüm vardiyalarını temizler ve boşaltır"
          >
            <RotateCcw size={14} />
            <span>Haftayı Temizle</span>
          </Button>

          {/* Manage Shift Types Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsShiftManagerOpen(true)}
            className="h-9 text-xs gap-1.5 cursor-pointer"
          >
            <Settings2 size={14} className="text-slate-500" />
            <span>Vardiya Tipleri</span>
          </Button>

          {/* Add Leave Shortcut Button */}
          {onOpenLeaveModal && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenLeaveModal()}
              className="h-9 text-xs gap-1.5 cursor-pointer text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            >
              <Coffee size={14} className="text-amber-500" />
              <span>İzin Tanımla</span>
            </Button>
          )}

          {/* Print Schedule Button */}
          <Button
            type="button"
            size="sm"
            onClick={() => setIsPrintModalOpen(true)}
            className="h-9 text-xs gap-1.5 cursor-pointer bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white shadow-xs"
          >
            <Printer size={14} />
            <span>Çizelgeyi Yazdır (PDF)</span>
          </Button>
        </div>
      </div>

      {/* Capacity & Shift Legend Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <p className="text-[11px] font-medium text-slate-400">Haftalık Atölye Kapasitesi</p>
          <p className="text-lg font-bold text-sky-600 dark:text-sky-400 font-mono mt-0.5">
            {totalWeeklyCapacity} Saat
          </p>
        </div>

        {shiftDefinitions.slice(0, 5).map((def) => (
          <div
            key={def.id}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {def.label}
              </span>
              <span className={cn("w-2 h-2 rounded-full shrink-0", def.badgeColor)} />
            </div>
            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
              {def.hours}
            </p>
          </div>
        ))}
      </div>

      {/* VIEW 1: WEEK CALENDAR (Modern & Ferah Grid) */}
      {viewMode === "week-calendar" && (
        <div data-tour="staff-shifts" className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[1150px]">
              {/* Weekday Columns Header */}
              <div className="grid grid-cols-[220px_repeat(7,minmax(125px,1fr))] border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60">
                {/* 1. Sütun: Personel / Usta Başlığı */}
                <div className="p-3.5 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 border-r border-slate-200/80 dark:border-slate-800/80 flex items-center justify-center gap-2">
                  <Users size={15} className="text-sky-500" />
                  <span>Personel / Usta</span>
                </div>

                {/* 7 Gün Başlığı (Pazartesi - Pazar) */}
                {weekInfo.days.map((day) => {
                  const todayStr = formatLocalDate(new Date())
                  const isToday = day.dateStr === todayStr
                  const isPast = day.dateStr < todayStr
                  const isClosed = !isWorkingDay(day.label)

                  return (
                    <div
                      key={day.dateStr}
                      className={cn(
                        "p-3 text-center border-r border-slate-200/60 dark:border-slate-800/60 last:border-r-0 transition-colors flex flex-col items-center justify-center gap-1",
                        isToday && "bg-sky-500/5 dark:bg-sky-500/10 relative",
                        isPast && "opacity-60 bg-slate-100/30 dark:bg-slate-950/20"
                      )}
                    >
                      {isToday && (
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-sky-500" />
                      )}
                      <div className="flex items-center gap-1.5">
                        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {day.label}
                        </p>
                        {isClosed && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-500 dark:text-rose-400 font-bold">
                            Tatil
                          </span>
                        )}
                      </div>
                      <p
                        className={cn(
                          "text-sm font-bold w-7 h-7 inline-flex items-center justify-center rounded-full font-mono transition-all",
                          isToday
                            ? "bg-sky-500 text-white shadow-xs"
                            : "text-slate-900 dark:text-slate-100"
                        )}
                      >
                        {day.dayNumber}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Personel Satırları */}
              <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                {activeTechnicians.map((tech) => {
                  let techWeeklyHours = 0
                  weekInfo.days.forEach((day) => {
                    const s = getShift(tech.id, day.dateStr, day.isWeekend)
                    techWeeklyHours += s.durationHours
                  })

                  return (
                    <div key={tech.id} className="grid grid-cols-[220px_repeat(7,minmax(125px,1fr))] min-h-[96px] items-stretch">
                      {/* Sol Sütun: Personel Profil Kartı */}
                      <div className="p-3.5 border-r border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col justify-between group/row">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                              {tech.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate" title={tech.name}>
                                {tech.name}
                              </p>
                              <span className="inline-block px-1.5 py-0.2 rounded-md bg-slate-200/60 dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5 max-w-[130px]">
                                {tech.mechanic?.specialty || "Mekanik"}
                              </span>
                            </div>
                          </div>

                          {/* Teknisyen Hızlı Haftalık Aksiyonları */}
                          <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0">
                            <button
                              type="button"
                              onClick={() => handleApplyStandardWeekForTech(tech.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                              title="Bu ustanın haftasını standart mesai ile doldur"
                            >
                              <Wand2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleClearWeekForTech(tech.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                              title="Bu ustanın bu haftaki vardiyalarını temizle"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-medium">Haftalık:</span>
                          <span className="font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                            {techWeeklyHours} saat
                          </span>
                        </div>
                      </div>

                      {/* 7 Günlük Vardiya Hücreleri */}
                      {weekInfo.days.map((day) => {
                        const shift = getShift(tech.id, day.dateStr, day.isWeekend)
                        const isOff = shift.id === "OFF" || shift.durationHours === 0
                        const isUnassigned = shift.id === "NONE"
                        const todayStr = formatLocalDate(new Date())
                        const isToday = day.dateStr === todayStr
                        const isPast = day.dateStr < todayStr

                        return (
                          <div
                            key={day.dateStr}
                            onClick={() =>
                              setActiveCell({
                                staffId: tech.id,
                                dateStr: day.dateStr,
                                dayLabel: `${day.label}, ${day.dayNumber}`,
                                staffName: tech.name,
                              })
                            }
                            className={cn(
                              "p-2 border-r border-slate-200/60 dark:border-slate-800/60 last:border-r-0 relative group flex flex-col justify-center cursor-pointer transition-colors",
                              isToday && "bg-sky-500/[0.02] dark:bg-sky-500/[0.03]",
                              isPast && "bg-slate-100/20 dark:bg-slate-950/20"
                            )}
                          >
                            {isUnassigned ? (
                              <div className="w-full h-full min-h-[72px] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 group-hover:border-sky-400 group-hover:bg-sky-500/[0.04] dark:group-hover:bg-sky-500/[0.07] transition-all p-2.5 flex flex-col items-center justify-center gap-1 text-center">
                                <div className="w-6 h-6 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-400 group-hover:bg-sky-500/20 group-hover:text-sky-600 dark:group-hover:text-sky-400 flex items-center justify-center transition-colors">
                                  <Plus size={12} />
                                </div>
                                <span className="text-[11px] font-medium text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                  Vardiya Ata
                                </span>
                              </div>
                            ) : isOff ? (
                              <div className="w-full h-full min-h-[72px] rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-800/30 p-2.5 flex flex-col justify-between transition-all group-hover:border-slate-300 dark:group-hover:border-slate-700">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
                                    {shift.label}
                                  </span>
                                  <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-2">
                                  <Coffee size={11} className="shrink-0" />
                                  <span>Tatil / İzin</span>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-full min-h-[72px] rounded-2xl border border-slate-200 dark:border-slate-700/90 bg-white dark:bg-slate-900/90 shadow-xs p-2.5 flex flex-col justify-between transition-all group-hover:border-sky-400 dark:group-hover:border-sky-500 group-hover:shadow-md">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate">
                                    {shift.label}
                                  </span>
                                  <span className={cn("w-2 h-2 rounded-full shrink-0", shift.badgeColor)} />
                                </div>

                                <div className="mt-2 flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1 text-[10px] font-mono text-slate-600 dark:text-slate-300 font-semibold">
                                    <Clock size={11} className="text-slate-400 shrink-0" />
                                    <span>{shift.hours}</span>
                                  </div>
                                  <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 shrink-0">
                                    {shift.durationHours}s
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>

              {/* Alt Özet Satırı (Randevular Benzeri Günlük Toplamlar) */}
              <div className="grid grid-cols-[220px_repeat(7,minmax(125px,1fr))] border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 font-mono text-xs">
                <div className="p-3.5 font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200/80 dark:border-slate-800/80 flex items-center justify-center gap-2">
                  <CalendarDays size={15} className="text-sky-500" />
                  <span>Günlük Atölye Özeti</span>
                </div>
                {dailySummaries.map((day) => (
                  <div
                    key={day.dateStr}
                    className="p-2.5 text-center border-r border-slate-200/60 dark:border-slate-800/60 last:border-r-0 flex flex-col items-center justify-center gap-1 text-[11px]"
                  >
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20">
                      <span>{day.workingStaffCount}</span>
                      <span className="text-[10px] font-normal">Görevli</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {day.offStaffCount} İzinli
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: MONTH CALENDAR (Randevular Aylık Izgara Tarzı) */}
      {viewMode === "month-calendar" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-center py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d.key}>{d.label}</div>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800/60">
            {/* Empty prefix cells before first day of month */}
            {Array.from({ length: monthInfo.firstDay.getDay() === 0 ? 6 : monthInfo.firstDay.getDay() - 1 }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px] bg-slate-50/30 dark:bg-slate-950/20" />
            ))}

            {monthInfo.monthDays.map((mDay) => {
              const dateObj = new Date(mDay.dateStr)
              const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6

              let workingCount = 0
              let dutyName = ""
              activeTechnicians.forEach((t) => {
                const s = getShift(t.id, mDay.dateStr, isWeekend)
                if (s.durationHours > 0) workingCount++
                if (s.id === "LATE_DUTY") dutyName = t.name
              })

              return (
                <div
                  key={mDay.dateStr}
                  className={cn(
                    "p-2.5 min-h-[110px] transition-colors flex flex-col justify-between hover:bg-sky-500/5 cursor-pointer",
                    mDay.isToday && "bg-sky-500/10 font-bold"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold",
                        mDay.isToday
                          ? "bg-sky-500 text-white"
                          : "text-slate-700 dark:text-slate-300"
                      )}
                    >
                      {mDay.dayNumber}
                    </span>

                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                      {workingCount} Usta
                    </Badge>
                  </div>

                  <div className="space-y-1 my-1">
                    {dutyName && (
                      <div className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold truncate">
                        Nöbetçi: {dutyName}
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Atölye</span>
                    <span className="text-sky-600 font-semibold">İncele</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: MATRIX TABLE (Personel Satırları ve 7 Günlük Tablo) */}
      {viewMode === "matrix" && (
        <div className="overflow-x-auto rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="p-4 min-w-[200px]">Atölye Teknisyeni</th>
                {weekInfo.days.map((day) => (
                  <th key={day.key} className="p-3 text-center min-w-[120px]">
                    <span className="block text-[11px] uppercase font-bold">{day.short}</span>
                    <span className="block text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {day.dayNumber}
                    </span>
                  </th>
                ))}
                <th className="p-3 text-center min-w-[100px]">Haftalık Saat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeTechnicians.map((tech) => {
                let techWeeklyHours = 0

                return (
                  <tr key={tech.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{tech.name}</p>
                      <p className="text-[11px] text-slate-400">{tech.mechanic?.specialty || "Genel Mekanik"}</p>
                    </td>

                    {weekInfo.days.map((day) => {
                      const shift = getShift(tech.id, day.dateStr, day.isWeekend)
                      techWeeklyHours += shift.durationHours

                      return (
                        <td key={day.key} className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveCell({
                                staffId: tech.id,
                                dateStr: day.dateStr,
                                dayLabel: `${day.label}, ${day.dayNumber}`,
                                staffName: tech.name,
                              })
                            }
                            className={cn(
                              "w-full py-2 px-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer",
                              shift.color
                            )}
                          >
                            <span className="block truncate font-bold">{shift.shortLabel}</span>
                            <span className="block text-[9px] opacity-75 font-mono mt-0.5 truncate">
                              {shift.hours}
                            </span>
                          </button>
                        </td>
                      )
                    })}

                    <td className="p-3 text-center font-mono font-bold text-sky-600 dark:text-sky-400">
                      {techWeeklyHours}s
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* QUICK SHIFT SELECTOR POPOVER MODAL (Özel Saat & Hazır Şablonlar) */}
      {activeCell && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm animate-in fade-in overflow-y-auto"
          onClick={() => setActiveCell(null)}
        >
          <div
            className="my-auto relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>{activeCell.staffName}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-medium">
                    {activeCell.dayLabel}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Vardiya ve çalışma saatlerini belirleyin</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveCell(null)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Navigation Tabs: Hazır Şablonlar vs Özel Saat Belirle */}
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCellModalTab("PRESET")}
                className={cn(
                  "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  cellModalTab === "PRESET"
                    ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs border border-slate-200/80 dark:border-slate-700"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                <Sparkles size={13} />
                <span>Hazır Vardiyalar</span>
              </button>
              <button
                type="button"
                onClick={() => setCellModalTab("CUSTOM")}
                className={cn(
                  "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  cellModalTab === "CUSTOM"
                    ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs border border-slate-200/80 dark:border-slate-700"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                <Clock size={13} />
                <span>Özel Saat Belirle</span>
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {cellModalTab === "CUSTOM" ? (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-sky-500/5 dark:bg-sky-500/10 border border-sky-500/20 text-xs text-sky-800 dark:text-sky-300">
                    Bu usta için bu güne özel mesai başlangıç ve bitiş saatini belirleyin.
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Başlangıç Saati
                      </label>
                      <input
                        type="time"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Bitiş Saati
                      </label>
                      <input
                        type="time"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Vardiya Başlığı / Not (Opsiyonel)
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Özel Mesai, Geç Vardiya, Yarım Gün..."
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Hesaplanan Çalışma Süresi:</span>
                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-sm">
                      {parseHoursDuration(customStart, customEnd)} saat
                    </span>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={applyToAllWeek}
                      onChange={(e) => setApplyToAllWeek(e.target.checked)}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      Bu saatleri ustanın bu haftaki tüm çalışma günlerine uygula
                    </span>
                  </label>

                  <Button
                    type="button"
                    onClick={handleAssignCustomHours}
                    className="w-full h-10 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white gap-2 shadow-xs cursor-pointer"
                  >
                    <Clock size={14} />
                    <span>Özel Çalışma Saatini Ata</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Vardiyayı Kaldır Butonu */}
                  <button
                    type="button"
                    onClick={() => handleAssignShift(activeCell.staffId, activeCell.dateStr, "NONE")}
                    className="w-full p-2.5 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/80 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <Trash2 size={13} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-rose-700 dark:text-rose-400">Vardiyayı Kaldır (Boş Bırak)</p>
                        <p className="text-[10px] text-rose-600/70 dark:text-rose-400/70 font-normal">Bu gün için herhangi bir mesai planlanmaz</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 rounded-md">Temizle</span>
                  </button>

                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400">
                      <span className="bg-white dark:bg-slate-900 px-2">veya Hazır Vardiya Seç</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-0.5">
                    {shiftDefinitions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleAssignShift(activeCell.staffId, activeCell.dateStr, s.id)}
                        className={cn(
                          "p-3 rounded-2xl border flex items-center justify-between text-left transition-all hover:scale-[1.01] cursor-pointer",
                          s.color
                        )}
                      >
                        <div>
                          <p className="text-xs font-bold">{s.label}</p>
                          <p className="text-[11px] font-mono opacity-80 mt-0.5">{s.hours}</p>
                        </div>
                        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-white/50 dark:bg-slate-900/50">
                          {s.durationHours > 0 ? `${s.durationHours}s` : "İzinli"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* SHIFT TYPES MANAGER MODAL */}
      {isShiftManagerOpen && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in overflow-y-auto"
          onClick={() => setIsShiftManagerOpen(false)}
        >
          <div
            className="my-auto relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings2 size={18} className="text-sky-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Vardiya Tiplerini Yönet
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShiftManagerOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X size={15} />
              </button>
            </div>

            {/* Existing shift definitions */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Tanımlı Vardiyalar</p>
              {shiftDefinitions.map((s) => (
                <div
                  key={s.id}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", s.badgeColor)} />
                    <span className="font-bold">{s.label}</span>
                    <span className="text-slate-400 font-mono">({s.hours})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-500">{s.durationHours}s</span>
                    {!["NORMAL", "OFF"].includes(s.id) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteShiftType(s.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                        title="Sil"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add new shift type form */}
            <form onSubmit={handleCreateShiftType} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Plus size={14} className="text-sky-500" />
                <span>Yeni Vardiya Tanımla</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Vardiya Adı (Örn: Akşam Nöbeti)"
                  value={newShiftLabel}
                  onChange={(e) => setNewShiftLabel(e.target.value)}
                  className="h-8 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />

                <input
                  type="text"
                  placeholder="Saatler (Örn: 11:00 - 20:00)"
                  value={newShiftHours}
                  onChange={(e) => setNewShiftHours(e.target.value)}
                  className="h-8 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">Süre:</span>
                  <input
                    type="number"
                    value={newShiftDuration}
                    onChange={(e) => setNewShiftDuration(e.target.value)}
                    className="w-16 h-8 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    step="0.5"
                    min="1"
                    max="24"
                  />
                  <span className="text-[11px] text-slate-500">Saat</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500">Renk:</span>
                  {(["sky", "emerald", "amber", "purple"] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewShiftColor(c)}
                      className={cn(
                        "w-5 h-5 rounded-full border transition-all cursor-pointer",
                        c === "sky" && "bg-sky-500",
                        c === "emerald" && "bg-emerald-500",
                        c === "amber" && "bg-amber-500",
                        c === "purple" && "bg-purple-500",
                        newShiftColor === c && "ring-2 ring-offset-1 ring-sky-500 scale-110"
                      )}
                    />
                  ))}
                </div>

                <Button type="submit" size="sm" className="h-8 text-xs bg-sky-600 hover:bg-sky-500 text-white cursor-pointer">
                  Vardiyayı Ekle
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* WORKSATUO CORPORATE PRINT SCHEDULE MODAL & TEMPLATE (PDF) */}
      {isPrintModalOpen && typeof document !== "undefined" && createPortal(
        <div
          id="print-schedule-root"
          className="corporate-print-root fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto print:fixed print:inset-0 print:p-0 print:bg-white print:backdrop-blur-none print:z-[9999]"
          onClick={() => setIsPrintModalOpen(false)}
        >
          <div
            className="my-auto relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 print:max-h-none print:shadow-none print:border-none print:rounded-none print:w-full print:m-0 print:bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Action Header (Print sırasında gizlenir) */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 print:hidden">
              <div className="flex items-center gap-2">
                <Printer size={18} className="text-sky-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Çizelge Yazdırma & PDF Çıktısı (WorksAuto Kurumsal Şablonu)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {/* Print Option Switcher */}
                <div className="flex items-center p-1 bg-slate-200/60 dark:bg-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPrintOption("weekly")}
                    className={cn(
                      "px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer",
                      printOption === "weekly" ? "bg-white dark:bg-slate-900 text-sky-600 shadow-xs" : "text-slate-500"
                    )}
                  >
                    Haftalık Çizelge
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintOption("monthly")}
                    className={cn(
                      "px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer",
                      printOption === "monthly" ? "bg-white dark:bg-slate-900 text-sky-600 shadow-xs" : "text-slate-500"
                    )}
                  >
                    Aylık Çizelge
                  </button>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={handlePrint}
                  className="h-8 text-xs bg-sky-600 hover:bg-sky-500 text-white cursor-pointer gap-1.5 font-bold"
                >
                  <Printer size={14} />
                  <span>PDF / Yazdır</span>
                </Button>

                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Printable Document Preview Area - WorksAuto Kurumsal Ortak Şablonu */}
            <div id="printable-schedule" className="p-4 sm:p-8 overflow-y-auto bg-slate-100 dark:bg-slate-950 print:p-0 print:bg-white print:overflow-visible">
              <CorporatePrintDocument
                title={printOption === "weekly" ? "HAFTALIK ÇALIŞMA & VARDİYA ÇİZELGESİ" : "AYLIK PERSONEL ÇALIŞMA ÇİZELGESİ"}
                documentNumber={`#SCHED-2026-${printOption === "weekly" ? weekInfo.days[0].dateStr.replace(/-/g, "") : monthInfo.monthTitle.replace(/\s+/g, "-")}`}
                date={new Date().toLocaleDateString("tr-TR")}
                metaBadges={
                  <span className="inline-block px-3 py-1 rounded-full bg-sky-50 text-sky-800 text-[11px] font-bold uppercase tracking-wider border border-sky-200">
                    {printOption === "weekly" ? weekInfo.rangeLabel : monthInfo.monthTitle}
                  </span>
                }
                footerSignatures={{
                  leftTitle: "Atölye Şefi / Vardiya Sorumlusu (Kaşe / İmza)",
                  rightTitle: "Servis Müdürü (Onaylandı)",
                }}
                legalNotice="Bu personel vardiya ve çalışma çizelgesi, WorksAuto servis yönetim altyapısı üzerinden dijital olarak üretilmiştir."
              >
                {/* Weekly Printable Schedule Table */}
                {printOption === "weekly" ? (
                  <div className="space-y-4">
                    <table className="w-full text-xs border border-slate-300 border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                          <th className="p-2.5 text-left border-r border-slate-300 w-48">Usta & Ünvan</th>
                          {weekInfo.days.map((d) => (
                            <th key={d.key} className="p-2 text-center border-r border-slate-300">
                              <div>{d.short}</div>
                              <div className="font-mono text-[10px] text-slate-500">{d.dayNumber}</div>
                            </th>
                          ))}
                          <th className="p-2 text-center font-bold w-20">Toplam</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeTechnicians.map((tech) => {
                          let sumHours = 0
                          return (
                            <tr key={tech.id} className="border-b border-slate-200 text-slate-900">
                              <td className="p-2 border-r border-slate-200">
                                <span className="font-bold block text-slate-900">{tech.name}</span>
                                <span className="text-[10px] text-slate-500 block">{tech.mechanic?.specialty || "Mekanik"}</span>
                              </td>
                              {weekInfo.days.map((day) => {
                                const shift = getShift(tech.id, day.dateStr, day.isWeekend)
                                sumHours += shift.durationHours
                                return (
                                  <td key={day.key} className="p-1.5 text-center border-r border-slate-200">
                                    <span className="font-semibold block text-slate-800">{shift.shortLabel}</span>
                                    <span className="text-[9px] text-slate-500 font-mono block">{shift.hours}</span>
                                  </td>
                                )
                              })}
                              <td className="p-2 text-center font-mono font-bold text-slate-900">{sumHours}s</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>

                    <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-1 font-mono">
                      <span>Toplam Personel: {activeTechnicians.length} Kişi</span>
                      <span>Haftalık Toplam Atölye Kapasitesi: {totalWeeklyCapacity} Saat</span>
                    </div>
                  </div>
                ) : (
                  /* Monthly Printable Schedule Table */
                  <div className="space-y-4">
                    <table className="w-full text-xs border border-slate-300 border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                          <th className="p-2.5 text-left border-r border-slate-300">Personel</th>
                          <th className="p-2 text-center border-r border-slate-300">Görev / Uzmanlık</th>
                          <th className="p-2 text-center border-r border-slate-300">Aylık Toplam Çalışma</th>
                          <th className="p-2 text-center">Durum / Not</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeTechnicians.map((tech) => {
                          let monthHours = 0
                          monthInfo.monthDays.forEach((mDay) => {
                            const dateObj = new Date(mDay.dateStr)
                            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6
                            const s = getShift(tech.id, mDay.dateStr, isWeekend)
                            monthHours += s.durationHours
                          })

                          return (
                            <tr key={tech.id} className="border-b border-slate-200 text-slate-900">
                              <td className="p-2.5 font-bold border-r border-slate-200 text-slate-900">{tech.name}</td>
                              <td className="p-2.5 text-slate-600 border-r border-slate-200">{tech.mechanic?.specialty || "Mekanik"}</td>
                              <td className="p-2.5 text-center font-mono font-bold text-sky-700 border-r border-slate-200">
                                {monthHours} Saat
                              </td>
                              <td className="p-2.5 text-center text-slate-500">Aktif Kadro</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>

                    <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-1 font-mono">
                      <span>Toplam Personel: {activeTechnicians.length} Kişi</span>
                      <span>Dönem: {monthInfo.monthTitle}</span>
                    </div>
                  </div>
                )}
              </CorporatePrintDocument>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
