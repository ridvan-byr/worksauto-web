"use client"

import * as React from "react"
import {
  Calendar as CalendarIcon,
  List,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  Wrench,
  AlertCircle,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Appointment, CancellationReason } from "@/features/appointments/types"
import {
  getStoredAppointments,
  saveStoredAppointments,
  createAppointment,
  approveAndConvertToWorkOrder,
  rescheduleAppointment,
  cancelAppointment,
  markNoShow,
} from "@/features/appointments/mock-data"
import { CalendarGrid } from "@/features/appointments/components/calendar-grid"
import { ListView } from "@/features/appointments/components/list-view"
import { CreateAppointmentModal } from "@/features/appointments/components/create-appointment-modal"
import { AppointmentDetailModal } from "@/features/appointments/components/appointment-detail-modal"
import { cn } from "@/lib/utils"

export default function AppointmentsPage() {
  const [appointments, setAppointments] = React.useState<Appointment[]>([])
  const [viewMode, setViewMode] = React.useState<"calendar" | "list">("calendar")
  const [selectedStaffFilter, setSelectedStaffFilter] = React.useState<string>("all")

  // Date Navigation State: Start of current week (Monday)
  const [currentWeekStart, setCurrentWeekStart] = React.useState<Date>(() => {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
    const monday = new Date(d.setDate(diff))
    monday.setHours(0, 0, 0, 0)
    return monday
  })

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [selectedSlot, setSelectedSlot] = React.useState<{ date: string; time: string } | null>(null)
  const [activeAppointment, setActiveAppointment] = React.useState<Appointment | null>(null)

  // Load from localStorage on mount
  React.useEffect(() => {
    setAppointments(getStoredAppointments())
  }, [])

  // Week navigation
  const handlePrevWeek = () => {
    setCurrentWeekStart((prev) => {
      const next = new Date(prev)
      next.setDate(next.getDate() - 7)
      return next
    })
  }

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => {
      const next = new Date(prev)
      next.setDate(next.getDate() + 7)
      return next
    })
  }

  const handleToday = () => {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))
    monday.setHours(0, 0, 0, 0)
    setCurrentWeekStart(monday)
  }

  // Week range label (e.g. "1 - 6 Eylül 2026")
  const weekRangeLabel = React.useMemo(() => {
    const endDate = new Date(currentWeekStart)
    endDate.setDate(endDate.getDate() + 6)
    const startDay = currentWeekStart.getDate()
    const endDay = endDate.getDate()
    const month = currentWeekStart.toLocaleDateString("tr-TR", { month: "long" })
    const year = currentWeekStart.getFullYear()
    return `${startDay} - ${endDay} ${month} ${year}`
  }, [currentWeekStart])

  // Filtered by staff
  const displayedAppointments = React.useMemo(() => {
    if (selectedStaffFilter === "all") return appointments
    return appointments.filter((a) => a.assignedStaffName === selectedStaffFilter)
  }, [appointments, selectedStaffFilter])

  // KPI Calculations
  const todayStr = new Date().toISOString().split("T")[0]
  const todayCount = appointments.filter((a) => a.date === todayStr).length
  const pendingCount = appointments.filter((a) => a.status === "PENDING").length
  const completedCount = appointments.filter((a) => a.status === "COMPLETED").length

  // Handlers
  const handleCreateAppointment = (newApp: Appointment) => {
    const next = [newApp, ...appointments]
    setAppointments(next)
    saveStoredAppointments(next)
  }

  const handleConvertToWorkOrder = (id: string) => {
    const res = approveAndConvertToWorkOrder(id)
    setAppointments(getStoredAppointments())
    if (activeAppointment && activeAppointment.id === id) {
      setActiveAppointment(res.updatedAppointment)
    }
    return res
  }

  const handleReschedule = (id: string, newDate: string, newTime: string) => {
    const updated = rescheduleAppointment(id, newDate, newTime)
    setAppointments(getStoredAppointments())
    if (activeAppointment && activeAppointment.id === id) {
      setActiveAppointment(updated)
    }
  }

  const handleCancel = (id: string, reason: CancellationReason, note?: string) => {
    const updated = cancelAppointment(id, reason, note)
    setAppointments(getStoredAppointments())
    if (activeAppointment && activeAppointment.id === id) {
      setActiveAppointment(updated)
    }
  }

  const handleMarkNoShow = (id: string) => {
    const updated = markNoShow(id)
    setAppointments(getStoredAppointments())
    if (activeAppointment && activeAppointment.id === id) {
      setActiveAppointment(updated)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Randevu Takvimi & Atölye Geçişi
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              Haftalık Plan
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Müşteri araç kabul slotları, usta atamaları ve tek tıkla iş emrine geçiş motoru.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => {
            setSelectedSlot(null)
            setIsCreateModalOpen(true)
          }}
          className="h-11 px-5 rounded-2xl gap-2 font-semibold text-xs shadow-lg shadow-sky-500/20 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Yeni Randevu Oluştur</span>
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Bugünkü Randevular</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{todayCount}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <CalendarIcon size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Onay Bekleyenler</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Lifte Alınan / Biten</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{completedCount}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Toplam Randevu</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{appointments.length}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Wrench size={20} />
          </div>
        </div>
      </div>

      {/* Controls Bar: Date Navigator + View Mode + Staff Filter */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        {/* Date Navigator */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevWeek}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
            title="Önceki Hafta"
          >
            <ChevronLeft size={16} />
          </button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="h-9 px-3 text-xs font-semibold cursor-pointer"
          >
            Bugün
          </Button>

          <button
            type="button"
            onClick={handleNextWeek}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
            title="Sonraki Hafta"
          >
            <ChevronRight size={16} />
          </button>

          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 pl-2 font-mono">
            {weekRangeLabel}
          </span>
        </div>

        {/* View Mode Switch & Staff Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mechanic / Staff Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter size={13} />
            <select
              value={selectedStaffFilter}
              onChange={(e) => setSelectedStaffFilter(e.target.value)}
              className="h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="all">Tüm Ustalar</option>
              <option value="Ahmet Usta">Ahmet Usta (Motor & Mekanik)</option>
              <option value="Mustafa Usta">Mustafa Usta (Oto Elektrik)</option>
              <option value="Ali Usta">Ali Usta (Ön Takım & Fren)</option>
            </select>
          </div>

          {/* View Toggle: Calendar vs List */}
          <div className="flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={cn(
                "py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
                viewMode === "calendar"
                  ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              )}
            >
              <CalendarIcon size={13} />
              <span>Görsel Takvim</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
                viewMode === "list"
                  ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              )}
            >
              <List size={13} />
              <span>Liste Tablosu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main View: Calendar Grid OR List View */}
      {viewMode === "calendar" ? (
        <CalendarGrid
          currentWeekStart={currentWeekStart}
          appointments={displayedAppointments}
          onSelectAppointment={(app) => setActiveAppointment(app)}
          onSlotClick={(date, time) => {
            setSelectedSlot({ date, time })
            setIsCreateModalOpen(true)
          }}
        />
      ) : (
        <ListView
          appointments={displayedAppointments}
          onSelectAppointment={(app) => setActiveAppointment(app)}
        />
      )}

      {/* Create Appointment Modal */}
      <CreateAppointmentModal
        isOpen={isCreateModalOpen}
        initialDate={selectedSlot?.date}
        initialTime={selectedSlot?.time}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleCreateAppointment}
      />

      {/* Appointment Detail & Actions Modal */}
      <AppointmentDetailModal
        isOpen={!!activeAppointment}
        appointment={activeAppointment}
        onClose={() => setActiveAppointment(null)}
        onConvertToWorkOrder={handleConvertToWorkOrder}
        onReschedule={handleReschedule}
        onCancel={handleCancel}
        onMarkNoShow={handleMarkNoShow}
      />
    </div>
  )
}
