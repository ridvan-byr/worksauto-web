"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { Trash2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TenantDeleteModalProps {
  tenant: { id: string; title: string } | null
  onClose: () => void
  onConfirm: () => Promise<void>
  isPending: boolean
  error?: string | null
}

export function TenantDeleteModal({
  tenant,
  onClose,
  onConfirm,
  isPending,
  error,
}: TenantDeleteModalProps) {
  const [confirmInput, setConfirmInput] = React.useState("")

  React.useEffect(() => {
    setConfirmInput("")
  }, [tenant])

  if (!tenant || typeof document === "undefined") return null

  const isConfirmed = confirmInput === tenant.title

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#0f111a] border border-rose-500/30 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
          <Trash2 size={24} />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Servisi Kalıcı Olarak Sil</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <strong className="text-rose-600 dark:text-rose-400 font-bold">{tenant.title}</strong> adlı oto servisini silmek üzeresiniz.
          </p>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-700 dark:text-rose-200">
            Bu işlem servise bağlı tüm <strong>iş emirlerini, müşteri kayıtlarını, araçları, faturaları ve personel hesaplarını</strong> veritabanından kalıcı olarak kaldıracaktır. Bu işlem geri alınamaz!
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-300 text-xs">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs text-slate-600 dark:text-slate-400">
            Onaylamak için servisin adını (<strong>{tenant.title}</strong>) yazınız:
          </label>
          <input
            type="text"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder={tenant.title}
            className="w-full h-9 px-3 text-xs rounded-xl border border-rose-500/30 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={onClose}
            className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Vazgeç
          </Button>
          <Button
            size="sm"
            type="button"
            disabled={!isConfirmed || isPending}
            onClick={onConfirm}
            className="bg-rose-600 hover:bg-rose-500 text-white font-bold gap-1.5 shadow-md shadow-rose-600/30 disabled:opacity-40 cursor-pointer"
          >
            <span>{isPending ? "Siliniyor..." : "Evet, Kalıcı Olarak Sil"}</span>
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
