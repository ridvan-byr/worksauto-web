"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  FileSpreadsheet,
  Download,
  X,
  CheckSquare,
  Square,
  Eye,
  Settings2,
  } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/sonner"
import { useAuth } from "@/features/auth/auth-context"
import {
  generateAestheticExcel,
  triggerDownloadBlob,
  ExportColumnDef,
  LOGO_CONFIG,
} from "../utils/aesthetic-excel"
import { cn } from "@/lib/utils"

export interface ExcelExportModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  sheetName?: string
  defaultFileName: string
  data: Record<string, any>[]
  availableColumns: ExportColumnDef[]
  authorName?: string
}

export function ExcelExportModal({
  isOpen,
  onClose,
  title,
  subtitle = "WorksAuto Servis ve Yönetim Sistemi Raporu",
  sheetName = "Rapor",
  defaultFileName,
  data,
  availableColumns,
  authorName,
}: ExcelExportModalProps) {
  const { user } = useAuth()
  const effectiveAuthor = authorName && authorName !== "WorksAuto Yetkili"
    ? authorName
    : user
    ? `${user.name} ${user.surname || ""}`.trim()
    : "WorksAuto Yetkili"

  const [mounted, setMounted] = React.useState(false)
  const [fileName, setFileName] = React.useState(defaultFileName)
  const [selectedColumnKeys, setSelectedColumnKeys] = React.useState<string[]>([])
  const [isExporting, setIsExporting] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Reset/Initialize columns when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setFileName(defaultFileName)
      setSelectedColumnKeys(availableColumns.map((c) => c.key))
    }
  }, [isOpen, defaultFileName, availableColumns])

  if (!isOpen || !mounted) return null

  // Active column defs in order
  const activeColumns = availableColumns.filter((c) => selectedColumnKeys.includes(c.key))

  const toggleColumn = (key: string) => {
    setSelectedColumnKeys((prev) => {
      if (prev.includes(key)) {
        if (prev.length <= 1) {
          toast.warning("En az bir sütun seçili kalmalıdır.")
          return prev
        }
        return prev.filter((k) => k !== key)
      } else {
        return [...prev, key]
      }
    })
  }

  const selectAll = () => setSelectedColumnKeys(availableColumns.map((c) => c.key))
  const deselectAll = () => {
    if (availableColumns.length > 0) {
      setSelectedColumnKeys([availableColumns[0].key])
    }
  }

  const handleExport = async () => {
    if (activeColumns.length === 0) {
      toast.error("Lütfen en az bir sütun seçin.")
      return
    }

    setIsExporting(true)
    try {
      const cleanFileName = (fileName.trim() || defaultFileName).replace(/[\\/:*?"<>|]/g, "_")
      const blob = await generateAestheticExcel({
        title,
        subtitle,
        sheetName,
        columns: activeColumns,
        data,
        author: effectiveAuthor,
      })

      triggerDownloadBlob(blob, cleanFileName)
      toast.success(`${data.length} kayıt kurumsal Excel formatında başarıyla indirildi.`)
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Excel dosyası oluşturulurken bir hata oluştu.")
    } finally {
      setIsExporting(false)
    }
  }

  // First 5 preview rows
  const previewRows = data.slice(0, 5)

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {title} — Önizleme & İndir
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {data.length} Kayıt
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sütunları özelleştirin, önizlemeyi inceleyin ve kurumsal tasarımlı Excel dosyasını indirin.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Top Config: File Name */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Settings2 size={13} className="text-sky-500" />
                <span>İndirilecek Dosya Adı</span>
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Format: Microsoft Excel (.xlsx)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Dosya adı girin..."
                className="flex-1 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-xs font-mono font-bold text-slate-400">.xlsx</span>
            </div>
          </div>

          {/* Column Selector */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Aktarılacak Sütunlar
                </span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  ({selectedColumnKeys.length} / {availableColumns.length} Seçili)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Tümünü Seç
                </button>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:underline cursor-pointer"
                >
                  Sadece İlkini Bırak
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/80 dark:border-slate-800/80">
              {availableColumns.map((col) => {
                const isSelected = selectedColumnKeys.includes(col.key)
                return (
                  <button
                    key={col.key}
                    type="button"
                    onClick={() => toggleColumn(col.key)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border",
                      isSelected
                        ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 shadow-2xs"
                        : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100"
                    )}
                  >
                    {isSelected ? (
                      <CheckSquare size={13} className="text-sky-500" />
                    ) : (
                      <Square size={13} className="text-slate-400" />
                    )}
                    <span>{col.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Live Table Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye size={14} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Excel Çıktısı Canlı Önizleme
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  (İlk {previewRows.length} kayıt gösterilmektedir)
                </span>
              </div>
            </div>

            {/* Mock Excel Sheet Shell */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs bg-white dark:bg-slate-950">
              <div className="overflow-x-auto max-h-[460px] scrollbar-thin">
                <div className="min-w-fit">
                  {/* Mock Banner (Excel Satır 1-2, Toplam 85px: Satır 1 = 51px, Satır 2 = 34px) */}
                  <div className="bg-[#0F172A] text-white border-b border-slate-800 flex h-[85px] relative">
                    {/* Sol: Sütun A (Excel A1:A2 Birleşik Hücresi - 1:1 Excel Görünümü) */}
                    <div
                      className="shrink-0 h-full relative border-r border-slate-800/80 bg-[#0F172A]"
                      style={{
                        width: `${Math.max(LOGO_CONFIG.colAWidth * 7.5, LOGO_CONFIG.width + 40)}px`,
                      }}
                    >
                      <img
                        src="/brand/worksauto-logo-white.png"
                        alt="WorksAuto"
                        style={{
                          position: "absolute",
                          left: `${Math.round(LOGO_CONFIG.colOffset * 65)}px`,
                          top: `${Math.round(LOGO_CONFIG.rowOffset * 40)}px`,
                          width: `${LOGO_CONFIG.width}px`,
                          height: `${LOGO_CONFIG.height}px`,
                        }}
                        className="object-contain brightness-110 select-none"
                      />
                    </div>

                    {/* Sütun B..N: Excel B1:N2 Birleşik Başlık ve Alt Başlık */}
                    <div className="flex-1 h-full min-w-[500px] flex flex-col justify-center items-center px-6">
                      {/* Satır 1 Başlık (51px yüksekliğinde tam ortalı) */}
                      <div className="h-[51px] flex items-center justify-center">
                        <h4 className="text-base font-bold text-white tracking-wide text-center">
                          {title.toLocaleUpperCase("tr-TR")}
                        </h4>
                      </div>
                      {/* Satır 2 Alt Başlık (34px yüksekliğinde tam ortalı) */}
                      <div className="h-[34px] flex items-center justify-center">
                        <p className="text-xs text-sky-300 font-medium text-center">
                          {subtitle}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bilgi Şeridi (Excel Satır 3 - Sola Dayalı) */}
                  <div className="bg-[#1E293B] text-slate-300 px-4 py-2 text-xs italic border-b border-slate-700/80 text-left flex items-center justify-start gap-x-3">
                    <span>Rapor Tarihi: {new Date().toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="text-slate-500">|</span>
                    <span>Toplam Kayıt: {data.length} Adet</span>
                    <span className="text-slate-500">|</span>
                    <span>Oluşturan: {effectiveAuthor}</span>
                  </div>

                  {/* Kurumsal Vurgu Çizgisi */}
                  <div className="h-1 w-full bg-sky-600" />

                  {/* Table - Birebir Excel Sütunları */}
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-sky-600 text-white font-bold">
                        {activeColumns.map((col, idx) => (
                          <th
                            key={col.key}
                            style={idx === 0 ? { width: `${Math.max(LOGO_CONFIG.colAWidth * 7.5, LOGO_CONFIG.width + 40)}px` } : undefined}
                            className={cn(
                              "py-2.5 px-4 border-r border-slate-700 last:border-r-0 whitespace-nowrap text-[11px]",
                              col.type === "currency" || col.type === "number" ? "text-right" : col.type === "plate" ? "text-center" : "text-left"
                            )}
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, rIdx) => {
                        const isEven = rIdx % 2 === 0
                        return (
                          <tr
                            key={rIdx}
                            className={cn(
                              "border-b border-slate-200 dark:border-slate-800 font-medium",
                              isEven ? "bg-white dark:bg-slate-950" : "bg-slate-50 dark:bg-slate-900/50"
                            )}
                          >
                            {activeColumns.map((col, cIdx) => {
                              const val = row[col.key]
                              return (
                                <td
                                  key={col.key}
                                  style={cIdx === 0 ? { width: `${Math.max(LOGO_CONFIG.colAWidth * 7.5, LOGO_CONFIG.width + 40)}px` } : undefined}
                                  className={cn(
                                    "py-2 px-4 border-r border-slate-200 dark:border-slate-800 last:border-r-0 whitespace-nowrap text-[11px]",
                                    col.type === "currency" || col.type === "number" ? "text-right font-mono" : col.type === "plate" ? "text-center font-mono font-bold" : "text-left"
                                  )}
                                >
                                  {col.type === "currency" ? (
                                    Number(val) > 0 ? (
                                      <span className="text-rose-600 dark:text-rose-400 font-bold">
                                        {Number(val).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                                      </span>
                                    ) : (
                                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                        0.00 ₺
                                      </span>
                                    )
                                  ) : col.type === "plate" ? (
                                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                                      {String(val || "-")}
                                    </span>
                                  ) : (
                                    <span className="text-slate-700 dark:text-slate-300">
                                      {val !== undefined && val !== null && val !== "" ? String(val) : "-"}
                                    </span>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table Footer hint */}
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>
                  İndirildiğinde filtrelenen toplam <strong>{data.length}</strong> satırın tamamı ve dip toplam satırı yer alacaktır.
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  Freeze Panes Aktif
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
            className="h-10 px-4 text-xs font-semibold cursor-pointer"
          >
            Vazgeç
          </Button>

          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting || activeColumns.length === 0}
            className="h-10 px-5 text-xs font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-md shadow-emerald-600/20"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Excel Hazırlanıyor...</span>
              </>
            ) : (
              <>
                <Download size={15} />
                <span>Excel Olarak İndir ({data.length} Kayıt)</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
