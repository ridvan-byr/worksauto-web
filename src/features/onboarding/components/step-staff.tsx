"use client"

import * as React from "react"
import { Users, Plus, Trash2 } from "lucide-react"
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

  const handleAdd = () => {
    if (!newStaff.name.trim() || !newStaff.surname.trim()) return
    onAddStaff(newStaff)
    setNewStaff({ name: "", surname: "", phone: "", expertise: "Motor & Mekanik" })
  }

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
      <div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Users className="text-sky-500 shrink-0" size={20} />
          <span>Adım 5: Personel & Usta Kadrosu</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          İş emirlerini lifte alacak ve randevulara atanacak ilk usta ve teknisyenlerinizi kaydedin.
        </p>
      </div>

      {/* Add Staff Form */}
      <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-3">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Yeni Usta / Teknisyen Ekle</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <input
            type="text"
            placeholder="Adı (Örn: Mehmet)"
            value={newStaff.name}
            onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
            className="h-11 sm:h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <input
            type="text"
            placeholder="Soyadı (Örn: Usta)"
            value={newStaff.surname}
            onChange={(e) => setNewStaff({ ...newStaff, surname: e.target.value })}
            className="h-11 sm:h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <input
            type="tel"
            placeholder="Telefon (05XX...)"
            value={newStaff.phone}
            onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
            className="h-11 sm:h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <select
            value={newStaff.expertise}
            onChange={(e) => setNewStaff({ ...newStaff, expertise: e.target.value })}
            className="h-11 sm:h-10 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            <option value="Motor & Mekanik">Motor & Mekanik</option>
            <option value="Oto Elektrik & Beyin">Oto Elektrik & Beyin</option>
            <option value="Ön Takım & Fren">Ön Takım & Fren</option>
            <option value="Kaporta & Boya">Kaporta & Boya</option>
            <option value="Periyodik Bakım">Periyodik Bakım</option>
          </select>
        </div>
        <Button
          type="button"
          onClick={handleAdd}
          className="w-full sm:w-auto text-xs h-10 gap-1.5 cursor-pointer"
        >
          <Plus size={14} />
          <span>Ustayı Listeye Ekle</span>
        </Button>
      </div>

      {/* Added Staff List */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span>Kayıtlı Ustalar ({staff.length}) <span className="text-rose-500">*</span></span>
          <span className="text-[11px] text-slate-400">En az 1 zorunludur</span>
        </label>

        {staff.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-rose-300 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-center text-xs text-rose-500">
            Henüz hiçbir usta eklemediniz. Lütfen en az bir usta tanımlayın.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {staff.map((st) => (
              <div
                key={st.id}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-500 font-bold text-xs flex items-center justify-center shrink-0">
                    {st.name.charAt(0)}{st.surname.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {st.name} {st.surname}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {st.expertise} • {st.phone || "Tel yok"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveStaff(st.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
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
