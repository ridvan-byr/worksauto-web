"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { quickLeadSchema, QuickLeadValues } from "../schemas/appointment.schema"
import { useQuickLeadCustomer } from "@/features/customers/api/use-customers"

interface QuickLeadSubFormProps {
  onSuccess: (customer: any, vehicle: any) => void
  onCancel: () => void
}

export function QuickLeadSubForm({ onSuccess, onCancel }: QuickLeadSubFormProps) {
  const quickLeadMutation = useQuickLeadCustomer()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<QuickLeadValues>({
    resolver: zodResolver(quickLeadSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      plate: "",
    },
  })

  const onSubmit = async (values: QuickLeadValues) => {
    const nameParts = values.fullName.trim().split(" ")
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""

    try {
      const res = await quickLeadMutation.mutateAsync({
        firstName,
        lastName,
        phone: values.phone.trim(),
        plate: values.plate.trim().toUpperCase(),
      })

      if (res?.customer && res?.vehicle) {
        onSuccess(res.customer, res.vehicle)
      }
    } catch (err) {
      console.error("Quick lead creation error:", err)
    }
  }

  return (
    <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <UserPlus size={16} className="text-amber-500 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-900 dark:text-amber-300">
              1 Adımda Hızlı Potansiyel Müşteri & Araç Kaydı
            </p>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
              İlk telefon veya servis temasında ad soyad, telefon ve plaka alarak anında randevu oluşturun.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
        >
          Vazgeç
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* TEK INPUT: MÜŞTERİ ADI SOYADI */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Müşteri Adı Soyadı <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Örn: Mehmet Yılmaz"
              {...register("fullName")}
              className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {errors.fullName && (
              <p className="text-[10px] text-rose-500">{errors.fullName.message}</p>
            )}
          </div>

          {/* TELEFON NUMARASI */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Telefon Numarası <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              placeholder="05XX XXX XX XX"
              {...register("phone")}
              className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {errors.phone && (
              <p className="text-[10px] text-rose-500">{errors.phone.message}</p>
            )}
          </div>

          {/* ARAÇ PLAKASI */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Araç Plakası <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="34 ABC 123"
              {...register("plate")}
              onChange={(e) => setValue("plate", e.target.value.toUpperCase())}
              className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {errors.plate && (
              <p className="text-[10px] text-rose-500">{errors.plate.message}</p>
            )}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            disabled={quickLeadMutation.isPending}
            className="h-9 px-4 rounded-xl text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer shadow-md shadow-amber-500/20"
          >
            <UserPlus size={13} />
            <span>{quickLeadMutation.isPending ? "Kaydediliyor..." : "Kaydet ve Randevuya Seç"}</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
