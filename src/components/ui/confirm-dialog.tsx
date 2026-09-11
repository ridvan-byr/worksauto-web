"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "warning" | "info"
  onConfirm: () => void | Promise<void>
  onClose: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Evet, Devam Et",
  cancelText = "Vazgeç",
  variant = "danger",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isOpen) return null

  const handleConfirm = async () => {
    try {
      setIsLoading(true)
      await onConfirm()
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              variant === "danger"
                ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
            }`}
          >
            <AlertTriangle size={22} />
          </div>
          <div className="space-y-1 pt-0.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={onClose}
            className="h-9 px-4 text-xs font-semibold rounded-xl cursor-pointer"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            disabled={isLoading}
            onClick={handleConfirm}
            className={`h-9 px-4 text-xs font-bold rounded-xl text-white shadow-sm cursor-pointer ${
              variant === "danger"
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-sky-600 hover:bg-sky-700"
            }`}
          >
            {isLoading ? "İşleniyor..." : confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
