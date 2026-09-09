"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StaffRecord } from "@/features/settings/api/use-settings"

interface StaffDeleteModalProps {
  staff: StaffRecord | null
  onClose: () => void
  onConfirm: () => Promise<void>
  isPending: boolean
}

export function StaffDeleteModal({
  staff,
  onClose,
  onConfirm,
  isPending,
}: StaffDeleteModalProps) {
  if (!staff || typeof document === "undefined") return null

  const u = staff.user || staff

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 text-center my-auto">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
          <AlertTriangle size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Personeli Sil / Pasife Al
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <strong>
              {u.name} {u.surname || ""}
            </strong>{" "}
            adlı personeli kadrodan çıkarmak istediğinize emin misiniz?
          </p>
        </div>
        <div className="flex justify-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="cursor-pointer"
          >
            Vazgeç
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={onConfirm}
            className="bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/25 cursor-pointer"
          >
            {isPending ? "Siliniyor..." : "Evet, Çıkar"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
