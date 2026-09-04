"use client"

import * as React from "react"
import { Clock, Plus, User, Wrench } from "lucide-react"
import { Appointment } from "../types"
import { AppointmentStatusBadge } from "./appointment-status-badge"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { cn } from "@/lib/utils"

interface CalendarGridProps {
  currentWeekStart: Date
  appointments: Appointment[]
  onSelectAppointment: (app: Appointment) => void
  onSlotClick: (date: string, time: string) => void
}

const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:30",
  "14:30",
  "15:30",
  "16:30",
  "17:30",
]

export function CalendarGrid({
  currentWeekStart,
  appointments,
  onSelectAppointment,
  onSlotClick,
}: CalendarGridProps) {
  // Generate 7 working days (Mon-Sun)
  const weekDays = React.useMemo(() => {
    const formatLocalDate = (d: Date) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, "0")
      const day = String(d.getDate()).padStart(2, "0")
      return `${year}-${month}-${day}`
    }

    const days: { dateStr: string; dayName: string; dayNumber: number; isToday: boolean }[] = []
    const todayStr = formatLocalDate(new Date())

    const allDayNames = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"]
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart)
      d.setDate(d.getDate() + i)
      const dateStr = formatLocalDate(d)
      days.push({
        dateStr,
        dayName: allDayNames[i],
        dayNumber: d.getDate(),
        isToday: dateStr === todayStr,
      })
    }
    return days
  }, [currentWeekStart])

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[960px]">
          {/* Weekday Columns Header */}
          <div className="grid grid-cols-8 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60">
            {/* Time column header */}
            <div className="p-3.5 text-center text-[11px] font-bold text-slate-400 border-r border-slate-200/80 dark:border-slate-800/80 flex items-center justify-center gap-1">
              <Clock size={13} />
              <span>Saat</span>
            </div>

            {/* 7 Day Headers (Mon-Sun) */}
            {weekDays.map((day) => (
              <div
                key={day.dateStr}
                className={cn(
                  "p-3 text-center border-r border-slate-200/60 dark:border-slate-800/60 last:border-r-0 transition-colors",
                  day.isToday && "bg-sky-500/5 dark:bg-sky-500/10"
                )}
              >
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {day.dayName}
                </p>
                <p
                  className={cn(
                    "text-base font-bold mt-0.5 inline-flex w-7 h-7 items-center justify-center rounded-full",
                    day.isToday
                      ? "bg-sky-500 text-white shadow-xs"
                      : "text-slate-900 dark:text-slate-100"
                  )}
                >
                  {day.dayNumber}
                </p>
              </div>
            ))}
          </div>

          {/* Time Slot Rows */}
          <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
            {TIME_SLOTS.map((timeSlot) => (
              <div key={timeSlot} className="grid grid-cols-8 min-h-[96px]">
                {/* Time Label */}
                <div className="p-3 text-center text-xs font-mono font-bold text-slate-400 border-r border-slate-200/80 dark:border-slate-800/80 flex items-center justify-center bg-slate-50/30 dark:bg-slate-950/20">
                  {timeSlot}
                </div>

                {/* 7 Day Cells (Mon-Sun) */}
                {weekDays.map((day) => {
                  // Find appointments in this day and near this time slot
                  const cellAppointments = appointments.filter((a) => {
                    if (a.date !== day.dateStr) return false
                    const slotHour = parseInt(timeSlot.split(":")[0])
                    const appHour = parseInt(a.time.split(":")[0])
                    return slotHour === appHour
                  })

                  return (
                    <div
                      key={day.dateStr + timeSlot}
                      onClick={(e) => {
                        // Only trigger if clicked on the empty space, not inside a card
                        if (e.target === e.currentTarget) {
                          onSlotClick(day.dateStr, timeSlot)
                        }
                      }}
                      className={cn(
                        "p-1.5 border-r border-slate-200/60 dark:border-slate-800/60 last:border-r-0 relative group transition-colors flex flex-col gap-1.5",
                        day.isToday && "bg-sky-500/[0.02] dark:bg-sky-500/[0.03]",
                        "hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer"
                      )}
                    >
                      {cellAppointments.map((app) => (
                        <div
                          key={app.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectAppointment(app)
                          }}
                          className={cn(
                            "p-2 rounded-xl border text-left shadow-2xs transition-all cursor-pointer space-y-1.5",
                            app.status === "APPROVED"
                              ? "bg-sky-500/10 border-sky-500/30 hover:border-sky-500 text-sky-950 dark:text-sky-100"
                              : app.status === "PENDING"
                              ? "bg-amber-500/10 border-amber-500/30 hover:border-amber-500 text-amber-950 dark:text-amber-100"
                              : app.status === "COMPLETED"
                              ? "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500 text-emerald-950 dark:text-emerald-100"
                              : app.status === "CANCELLED"
                              ? "bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 opacity-60 text-slate-500 line-through"
                              : "bg-rose-500/10 border-rose-500/30 hover:border-rose-500 text-rose-950 dark:text-rose-100"
                          )}
                        >
                          <div className="flex items-center justify-between gap-1.5 overflow-hidden">
                            <PlateBadge plate={app.plate} size="xs" />
                            <span className="text-[10px] font-mono font-bold opacity-80 shrink-0">
                              {app.time}
                            </span>
                          </div>

                          <div className="overflow-hidden">
                            <p className="text-[11px] font-bold truncate leading-tight">
                              {app.customerName}
                            </p>
                            <p className="text-[10px] opacity-70 truncate mt-0.5">
                              {app.services[0]?.name || "Servis İşlemi"}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Hover Quick Add Plus Indicator */}
                      {cellAppointments.length === 0 && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400">
                          <Plus size={16} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
