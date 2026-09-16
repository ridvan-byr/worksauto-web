"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X, CheckCircle2, Lock, Shield, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DEFAULT_LIFTS } from "@/lib/workshop-constants"
import { StaffRecord, useWorkshopBays } from "@/features/settings/api/use-settings"
import {
  formatTurkishGsmDisplay,
  getTurkishGsmError,
} from "@/lib/phone-utils"
import { formatSmartPhone } from "@/lib/input-formatters"
import {
  filterPersonNameInput,
  validatePersonName,
} from "@/lib/name-utils"
import {
  getTenantPositions,
  WorkshopPosition,
  ROLE_PERMISSIONS,
  BaseSystemRole,
} from "@/features/staff/lib/position-types"
import { PositionManagementModal } from "@/features/staff/components/position-management-modal"
import { cn } from "@/lib/utils"

interface StaffModalProps {
  isOpen: boolean
  editingStaff?: StaffRecord | null
  onClose: () => void
  onSubmit: (data: {
    name: string
    surname?: string
    phone: string
    email?: string
    role: string
    assignedLift?: string | null
    specialty?: string
    isActive?: boolean
  }) => Promise<void>
  isPending: boolean
}

export function StaffModal({
  isOpen,
  editingStaff,
  onClose,
  onSubmit,
  isPending,
}: StaffModalProps) {
  const isEdit = !!editingStaff

  const [name, setName] = React.useState("")
  const [surname, setSurname] = React.useState("")
  const [nameError, setNameError] = React.useState<string | null>(null)
  const [phone, setPhone] = React.useState("")
  const [phoneError, setPhoneError] = React.useState<string | null>(null)
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState("TECHNICIAN")
  const [lift, setLift] = React.useState("Lift 1")
  const [specialty, setSpecialty] = React.useState("Genel Mekanik")
  const [isActive, setIsActive] = React.useState(true)

  const [positions, setPositions] = React.useState<WorkshopPosition[]>([])
  const [isPosModalOpen, setIsPosModalOpen] = React.useState(false)

  React.useEffect(() => {
    if (isOpen) {
      setPositions(getTenantPositions())
    }
  }, [isOpen])

  const { data: baysData } = useWorkshopBays()
  const liftOptions = React.useMemo(() => {
    if (baysData && baysData.length > 0) {
      return [
        ...baysData
          .filter((b) => b.isActive)
          .map((b) => ({
            id: b.name,
            label: b.code ? `${b.name} (${b.code})` : b.name,
          })),
        { id: "Atanmamış", label: "Atanmamış (Ortak Havuz / Gezici)" },
      ]
    }
    return DEFAULT_LIFTS
  }, [baysData])

  React.useEffect(() => {
    setNameError(null)
    setPhoneError(null)
    if (editingStaff) {
      const u = editingStaff.user || editingStaff
      const mechanic = editingStaff.mechanic || u.mechanic
      setName(u.name || "")
      setSurname(u.surname || "")
      setPhone(formatTurkishGsmDisplay(u.phone || ""))
      setEmail(u.email || "")
      setRole(u.role || "TECHNICIAN")
      setLift(mechanic?.assignedLift || editingStaff.assignedLift || "Lift 1")
      setSpecialty(mechanic?.specialty || editingStaff.specialty || "Genel Mekanik")
      setIsActive(u.isActive !== false)
    } else {
      setName("")
      setSurname("")
      setPhone("")
      setEmail("")
      setRole("TECHNICIAN")
      setLift("Lift 1")
      setSpecialty("Genel Mekanik")
      setIsActive(true)
    }
  }, [editingStaff, isOpen])

  if (!isOpen || typeof document === "undefined") return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const nameValidation = validatePersonName(name, "Personel adı")
    if (!nameValidation.isValid) {
      setNameError(nameValidation.error)
      return
    }

    let formattedSurname: string | undefined = undefined
    if (surname.trim()) {
      const surnameValidation = validatePersonName(surname, "Personel soyadı")
      if (!surnameValidation.isValid) {
        setNameError(surnameValidation.error)
        return
      }
      formattedSurname = surnameValidation.formatted
    }

    const err = getTurkishGsmError(phone)
    if (err) {
      setPhoneError(err)
      return
    }

    setNameError(null)
    setPhoneError(null)
    onSubmit({
      name: nameValidation.formatted,
      surname: formattedSurname,
      phone: formatTurkishGsmDisplay(phone),
      email: email.trim() || undefined,
      role,
      assignedLift: role === "TECHNICIAN" ? lift : null,
      specialty: specialty || (role === "TECHNICIAN" ? "Genel Mekanik" : "Ofis / Yönetim"),
      isActive,
    })
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="my-auto relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {isEdit ? "Personel Bilgilerini Düzenle" : "Yeni Personel & Usta Kaydı"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Ad *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(filterPersonNameInput(e.target.value))
                  if (nameError) setNameError(null)
                }}
                className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                placeholder="Ahmet"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Soyad</label>
              <input
                type="text"
                value={surname}
                onChange={(e) => {
                  setSurname(filterPersonNameInput(e.target.value))
                  if (nameError) setNameError(null)
                }}
                className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                placeholder="Yılmaz"
              />
            </div>
          </div>
          {nameError && (
            <p className="text-[11px] text-rose-500">{nameError}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Cep Telefonu *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => {
                  setPhone(formatSmartPhone(e.target.value))
                  if (phoneError) setPhoneError(null)
                }}
                className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono"
                placeholder="05XX XXX XX XX veya +90..."
              />
              {phoneError && (
                <p className="text-[11px] text-rose-500">{phoneError}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">E-Posta (İsteğe bağlı)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                placeholder="usta@servis.com"
              />
            </div>
          </div>

          {/* Görev / Pozisyon / Uzmanlık */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Görev / Pozisyon / Uzmanlık <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsPosModalOpen(true)}
                className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Settings2 size={12} />
                <span>Pozisyonları Yönet</span>
              </button>
            </div>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Örn: Baş Usta, Motor & Mekanik, Servis Danışmanı..."
            />

            {/* Dinamik Pozisyon Çipleri */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {positions.map((pos) => {
                const isSelected = specialty === pos.name
                return (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => {
                      setSpecialty(pos.name)
                      setRole(pos.baseRole)
                    }}
                    className={cn(
                      "text-[10px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer select-none",
                      isSelected
                        ? "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/40 font-bold shadow-2xs scale-102"
                        : "bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                    )}
                  >
                    {pos.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Sistem Rolü (Yetki Seviyesi)
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="TECHNICIAN">Atölye Teknisyeni / Usta</option>
                <option value="CONSULTANT">Servis Danışmanı (Kabul & Takip)</option>
                <option value="SERVICE_MANAGER">Servis Yöneticisi / Şef</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Varsayılan Lift
              </label>
              {role === "TECHNICIAN" ? (
                <select
                  value={lift}
                  onChange={(e) => setLift(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  {lift && !liftOptions.some((l) => l.id === lift || l.label.startsWith(lift)) && (
                    <option value={lift}>
                      {lift} (Mevcut)
                    </option>
                  )}
                  {liftOptions.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full h-9 px-3 flex items-center text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 text-slate-400 italic select-none">
                  Gerekmez (Ofis / Yönetim)
                </div>
              )}
            </div>
          </div>

          {/* Rol Yetki Bilgilendirme Kartı (Dinamik Bilgilendirme) */}
          {(() => {
            const roleMeta =
              ROLE_PERMISSIONS[role as BaseSystemRole] || ROLE_PERMISSIONS.TECHNICIAN
            return (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Shield size={14} className="text-sky-500" />
                    <span>Seçilen Rolün Sistem İzinleri & Sınırları:</span>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] font-bold", roleMeta.badgeColor)}>
                    {roleMeta.roleTitle}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="space-y-1">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      <span>Erişebildiği Alanlar:</span>
                    </span>
                    <ul className="space-y-0.5 text-slate-600 dark:text-slate-300 pl-1 leading-tight">
                      {roleMeta.allowedFeatures.slice(0, 3).map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <Lock size={12} />
                      <span>Kısıtlanan Alanlar:</span>
                    </span>
                    <ul className="space-y-0.5 text-slate-500 dark:text-slate-400 pl-1 leading-tight">
                      {roleMeta.restrictedFeatures.slice(0, 3).map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-rose-400 font-bold">•</span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Position Management Modal Portal */}
          <PositionManagementModal
            isOpen={isPosModalOpen}
            onClose={() => setIsPosModalOpen(false)}
            onPositionsChange={(newPositions) => setPositions(newPositions)}
          />

          {isEdit && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-medium">Aktif Çalışan Durumu</span>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="cursor-pointer"
            >
              İptal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="shadow-sky-500/25 cursor-pointer"
            >
              {isPending
                ? "Kaydediliyor..."
                : isEdit
                ? "Değişiklikleri Kaydet"
                : "Personeli Kaydet"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
