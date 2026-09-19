"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X, ShieldAlert, CheckCircle2, Infinity as InfinityIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CurrentAccount } from "../types"
import { useUpdateCreditLimit } from "../api/use-billing"

interface SetCreditLimitModalProps {
  isOpen: boolean
  account: CurrentAccount | null
  onClose: () => void
  onSuccess?: () => void
}

export function SetCreditLimitModal({
  isOpen,
  account,
  onClose,
  onSuccess,
}: SetCreditLimitModalProps) {
  const [mounted, setMounted] = React.useState(false)
  const [limitValue, setLimitValue] = React.useState<string>("0")
  const [isUnlimited, setIsUnlimited] = React.useState<boolean>(true)
  const [isBlocked, setIsBlocked] = React.useState<boolean>(false)

  const updateLimitMutation = useUpdateCreditLimit()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (account) {
      if (account.creditLimit > 0) {
        setIsUnlimited(false)
        setLimitValue(String(account.creditLimit))
      } else {
        setIsUnlimited(true)
        setLimitValue("0")
      }
      setIsBlocked(Boolean(account.isBlocked))
    }
  }, [account, isOpen])

  if (!isOpen || !mounted || !account) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalLimit = isUnlimited ? 0 : Math.max(0, Number(limitValue) || 0)

    try {
      await updateLimitMutation.mutateAsync({
        customerId: account.customerId,
        creditLimit: finalLimit,
        isBlocked,
      })
      onSuccess?.()
      onClose()
    } catch {
      // Error handled by mutation hook
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Kredi Limiti ve Risk Ayarı
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {account.companyTitle || account.customerName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Current Balance Notice */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Güncel Açık Bakiye:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {account.balance > 0 ? `+${account.balance.toLocaleString("tr-TR")} ₺` : `${account.balance.toLocaleString("tr-TR")} ₺`}
            </span>
          </div>

          {/* Sınırsız / Limit Seçimi */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Borçlanma Limiti
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsUnlimited(true)
                  setLimitValue("0")
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  isUnlimited
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold"
                    : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                <InfinityIcon size={16} />
                <span>Limitsiz / Sınırsız</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsUnlimited(false)
                  if (limitValue === "0") setLimitValue("50000")
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  !isUnlimited
                    ? "bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold"
                    : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                <span>Özel Limit Belirle</span>
              </button>
            </div>
          </div>

          {!isUnlimited && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Maksimum Borç Limiti (₺)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={limitValue}
                  onChange={(e) => setLimitValue(e.target.value)}
                  placeholder="Örn: 50000"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  ₺
                </span>
              </div>
              <div className="flex gap-1.5 pt-1">
                {[25000, 50000, 100000, 250000].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setLimitValue(String(quick))}
                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-mono text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    {quick.toLocaleString("tr-TR")} ₺
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bloke Durumu */}
          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800">
            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <ShieldAlert
                  size={18}
                  className={isBlocked ? "text-rose-600" : "text-slate-400"}
                />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Cari Hesabı Bloke Et
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Blokeli hesaplara yeni açık hesap iş emri açılamaz
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isBlocked}
                onChange={(e) => setIsBlocked(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-9 px-4 rounded-xl cursor-pointer"
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              disabled={updateLimitMutation.isPending}
              size="sm"
              className="text-xs h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer gap-1.5 shadow-xs"
            >
              <CheckCircle2 size={14} />
              <span>{updateLimitMutation.isPending ? "Kaydediliyor..." : "Kaydet"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
