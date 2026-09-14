"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { Check, Loader2, Undo2 } from "lucide-react"
import { SIDEBAR_TOGGLE_EVENT } from "@/lib/sidebar-events"

const LG_BREAKPOINT = "(min-width: 1024px)"
const SIDEBAR_WIDTH_OPEN = 256
const SIDEBAR_WIDTH_COLLAPSED = 72

function readSidebarCollapsed(): boolean {
  if (typeof document === "undefined") return false
  if (document.cookie.includes("worksauto_sidebar_collapsed=true")) return true
  try {
    return localStorage.getItem("worksauto-sidebar-collapsed") === "true"
  } catch {
    return false
  }
}

/**
 * Barı içerik alanında ortalamak için gereken sol ofset (px).
 * Masaüstünde sidebar genişliği kadar, mobilde 0.
 */
function useContentOffset(): number {
  const [offset, setOffset] = React.useState(0)

  React.useEffect(() => {
    const mq = window.matchMedia(LG_BREAKPOINT)
    const compute = () => {
      if (!mq.matches) {
        setOffset(0)
        return
      }
      setOffset(readSidebarCollapsed() ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_OPEN)
    }
    compute()
    mq.addEventListener("change", compute)
    window.addEventListener(SIDEBAR_TOGGLE_EVENT, compute)
    window.addEventListener("storage", compute)
    return () => {
      mq.removeEventListener("change", compute)
      window.removeEventListener(SIDEBAR_TOGGLE_EVENT, compute)
      window.removeEventListener("storage", compute)
    }
  }, [])

  return offset
}

interface UnsavedChangesBarProps {
  visible: boolean
  onDiscard: () => void
  /** `saveButtonType="button"` iken zorunludur; form içi `submit` kullanımında verilmez. */
  onSave?: (e: React.SyntheticEvent) => void | Promise<void>
  isSaving?: boolean
  saveLabel?: string
  /** Form içi kullanımda native validasyonu korumak için "submit" verin. */
  saveButtonType?: "button" | "submit"
}

/**
 * Shopify tarzı yüzen "kaydedilmemiş değişiklikler" barı.
 * Her zaman viewport'un altında, içerik alanında ortalanmış durur.
 *
 * NOT: `document.body`'ye portal'lanır — çünkü `app/template.tsx`'teki
 * `animate-page-enter` sarmalayıcısı (`will-change: transform` + kalıcı
 * `translate3d`) sayfa içindeki `fixed` elementleri viewport yerine
 * kendisine göre konumlandırır.
 */
export function UnsavedChangesBar({
  visible,
  onDiscard,
  onSave,
  isSaving = false,
  saveLabel = "Kaydet",
  saveButtonType = "button",
}: UnsavedChangesBarProps) {
  const contentOffset = useContentOffset()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!visible || !mounted || typeof document === "undefined") return null

  return (
    <>
      {/* Sabit barın sayfa sonundaki içeriği kapatmaması için boşluk */}
      <div aria-hidden="true" className="h-16" />
      {createPortal(
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 sm:px-6 sm:pb-6"
          style={contentOffset ? { paddingLeft: contentOffset + 16 } : undefined}
        >
          <div className="animate-unsaved-bar-enter pointer-events-auto flex w-full max-w-xl items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/95 py-3 pl-4 pr-3 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
            </span>
            <span className="truncate text-[13px] font-medium text-white">
              Kaydedilmemiş değişiklikler
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onDiscard}
              disabled={isSaving}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-white/15 px-3.5 text-[13px] font-semibold text-slate-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Undo2 size={14} />
              <span>Vazgeç</span>
            </button>
            <button
              type={saveButtonType}
              onClick={saveButtonType === "button" ? onSave : undefined}
              disabled={isSaving}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-500 px-4 text-[13px] font-bold text-white shadow-lg shadow-emerald-950/40 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Check size={14} className="stroke-[3]" />
              )}
              <span>{isSaving ? "Kaydediliyor..." : saveLabel}</span>
            </button>
          </div>
        </div>
        </div>,
        document.body
      )}
    </>
  )
}
