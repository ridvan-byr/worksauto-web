"use client"

import * as React from "react"
import { Users, Plus, Trash2, Phone, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StaffMember } from "@/features/auth/types"

interface StepStaffProps {
  staff: StaffMember[]
  errors: Record<string, string>
  onAddStaff: (staff: Omit<StaffMember, "id">) => void
  onRemoveStaff: (id: string) => void
}

export function StepStaff({
  staff,
  errors,
  onAddStaff,
  onRemoveStaff,
}: StepStaffProps) {
  const [newStaff, setNewStaff] = React.useState({
    name: "",
    surname: "",
    phone: "",
    expertise: "Motor & Mekanik",
  })
  const [inputError, setInputError] = React.useState<string | null>(null)

  const handleAdd = () => {
    const cleanName = newStaff.name.trim()
    const cleanSurname = newStaff.surname.trim()
    const cleanPhone = newStaff.phone.trim().replace(/\D/g, "")

    if (!cleanName || !cleanSurname) {
      setInputError("Lütfen ustanın adını ve soyadını eksiksiz giriniz.")
      return
    }

    if (!newStaff.phone.trim() || cleanPhone.length < 10) {
      setInputError(
        "Ustanın sisteme giriş yapabilmesi için geçerli bir cep telefonu numarası (en az 10 hane, örn: 0532...) zorunludur."
      )
      return
    }

    setInputError(null)
    onAddStaff({
      name: cleanName,
      surname: cleanSurname,
      phone: newStaff.phone.trim(),
      expertise: newStaff.expertise,
    })
    setNewStaff({ name: "", surname: "", phone: "", expertise: "Motor & Mekanik" })
  }

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
      <div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Users className="text-slate-600 dark:text-slate-400 shrink-0" size={20} />
          <span>Adım 4: Personel & Usta Kadrosu</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          İş emirlerini lifte alacak ve randevulara atanacak ilk usta ve teknisyenlerinizi kaydedin. Personel panele telefon numarasıyla giriş yapacaktır.
        </p>
      </div>

      {/* Add Staff Form */}
      <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Yeni Usta / Teknisyen Ekle</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <input
            type="text"
            placeholder="Adı (Örn: Mehmet) *"
            value={newStaff.name}
            onChange={(e) => {
              setNewStaff({ ...newStaff, name: e.target.value })
              if (inputError) setInputError(null)
            }}
            className="h-11 sm:h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600"
          />
          <input
            type="text"
            placeholder="Soyadı (Örn: Usta) *"
            value={newStaff.surname}
            onChange={(e) => {
              setNewStaff({ ...newStaff, surname: e.target.value })
              if (inputError) setInputError(null)
            }}
            className="h-11 sm:h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600"
          />
          <input
            type="tel"
            placeholder="Telefon (05XX... Zorunlu) *"
            value={newStaff.phone}
            onChange={(e) => {
              setNewStaff({ ...newStaff, phone: e.target.value })
              if (inputError) setInputError(null)
            }}
            className="h-11 sm:h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600"
          />
          <select
            value={newStaff.expertise}
            onChange={(e) => setNewStaff({ ...newStaff, expertise: e.target.value })}
            className="h-11 sm:h-10 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 cursor-pointer"
          >
            <option value="Motor & Mekanik">Motor & Mekanik</option>
            <option value="Oto Elektrik & Beyin">Oto Elektrik & Beyin</option>
            <option value="Ön Takım & Fren">Ön Takım & Fren</option>
            <option value="Kaporta & Boya">Kaporta & Boya</option>
            <option value="Periyodik Bakım">Periyodik Bakım</option>
          </select>
        </div>

        {inputError && (
          <div className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 pt-0.5">
            <AlertCircle size={14} className="shrink-0" />
            <span>{inputError}</span>
          </div>
        )}

        <Button
          type="button"
          onClick={handleAdd}
          className="w-full sm:w-auto text-xs h-10 gap-1.5 cursor-pointer bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-950 font-semibold"
        >
          <Plus size={14} />
          <span>Ustayı Listeye Ekle</span>
        </Button>
      </div>

      {/* Added Staff List */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span>Kayıtlı Ustalar ({staff.length}) <span className="text-rose-500">*</span></span>
          <span className="text-[11px] text-slate-400">En az 1 personel ve geçerli cep telefonu zorunludur</span>
        </label>

        {staff.length === 0 ? (
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-center text-xs text-slate-500">
            Henüz hiçbir usta eklemediniz. Lütfen en az bir usta ve telefon numarasını tanımlayın.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {staff.map((st) => (
              <div
                key={st.id}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center shrink-0">
                    {st.name.charAt(0)}{st.surname.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {st.name} {st.surname}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                      <span>{st.expertise}</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-0.5 font-mono">
                        <Phone size={10} className="text-slate-400" />
                        {st.phone}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveStaff(st.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                  title="Personeli Kaldır"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
        {errors.staff && <p className="text-[11px] text-rose-500">{errors.staff}</p>}
      </div>
    </div>
  )
}
