"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Car,
  User,
  Check,
  Building2,
  Trash2,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/sonner"
import {
  TARGET_FIELDS,
  guessTargetField,
  readExcelFile,
  downloadSampleTemplate,
  parseFullName,
} from "../utils/excel-helpers"
import { useBatchImportCustomers, BatchImportCustomerItem } from "@/features/customers/api/use-customers"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { cn } from "@/lib/utils"

interface ExcelImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  defaultMode?: "all" | "customers" | "vehicles"
}

export function ExcelImportModal({
  isOpen,
  onClose,
  onSuccess,
  defaultMode = "all",
}: ExcelImportModalProps) {
  const [mounted, setMounted] = React.useState(false)
  const batchImportMutation = useBatchImportCustomers()

  // Stepper state: 1: upload, 2: mapping, 3: preview, 4: result
  const [currentStep, setCurrentStep] = React.useState<1 | 2 | 3 | 4>(1)

  // File state
  const [fileName, setFileName] = React.useState("")
  const [fileHeaders, setFileHeaders] = React.useState<string[]>([])
  const [fileRows, setFileRows] = React.useState<Record<string, any>[]>([])
  const [isDragging, setIsDragging] = React.useState(false)
  const [isLoadingFile, setIsLoadingFile] = React.useState(false)

  // Mapping state: { [excelHeader]: targetFieldKey }
  const [mappings, setMappings] = React.useState<Record<string, string>>({})

  // Transformed preview rows (user editable in step 3)
  const [transformedRows, setTransformedRows] = React.useState<
    (BatchImportCustomerItem & { _original: Record<string, any>; _isValid: boolean; _errorMsg?: string })[]
  >([])
  const [skipInvalid, setSkipInvalid] = React.useState(true)

  // Result state
  const [importResult, setImportResult] = React.useState<any>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Reset when modal closes
  const handleClose = () => {
    setCurrentStep(1)
    setFileName("")
    setFileHeaders([])
    setFileRows([])
    setMappings({})
    setTransformedRows([])
    setImportResult(null)
    onClose()
  }

  // Handle file drop / select
  const handleFileProcess = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase()
    if (!ext || !["xlsx", "xls", "csv"].includes(ext)) {
      toast.error("Geçersiz dosya formatı. Lütfen yalnızca .xlsx, .xls veya .csv dosyası yükleyin.")
      return
    }

    setIsLoadingFile(true)
    try {
      const parsed = await readExcelFile(file)
      setFileName(file.name)
      setFileHeaders(parsed.headers)
      setFileRows(parsed.rows)

      // Auto guess mapping
      const initialMap: Record<string, string> = {}
      parsed.headers.forEach((h) => {
        const guess = guessTargetField(h)
        if (guess) {
          initialMap[h] = guess
        }
      })
      setMappings(initialMap)

      toast.success(`${parsed.headers.length} sütun ve ${parsed.totalCount} satır tespit edildi.`)
      setCurrentStep(2)
    } catch (err: any) {
      toast.error(err.message || "Excel dosyası okunamadı.")
    } finally {
      setIsLoadingFile(false)
    }
  }

  // Drop handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const onDragLeave = () => setIsDragging(false)
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0])
    }
  }

  // Step 2 -> Step 3: Build transformed preview
  const handleProceedToPreview = () => {
    // Check if at least one meaningful field is mapped
    const mappedValues = Object.values(mappings).filter(Boolean)
    if (mappedValues.length === 0) {
      toast.warning("Lütfen en az bir sütunu sistem alanı ile eşleştirin.")
      return
    }

    const transformed = fileRows.map((row) => {
      let firstName = ""
      let lastName = ""
      let fullName = ""
      let phone = ""
      let companyTitle = ""
      let email = ""
      let taxNumber = ""
      let taxOffice = ""
      let plate = ""
      let brand = ""
      let model = ""
      let year: number | undefined = undefined
      let currentKm: number | undefined = undefined
      let vin = ""
      let fuelType = ""
      let transmission = ""
      let notes = ""

      // Apply mappings
      for (const [header, targetKey] of Object.entries(mappings)) {
        if (!targetKey) continue
        const rawVal = row[header] !== undefined && row[header] !== null ? String(row[header]).trim() : ""

        if (targetKey === "fullName") fullName = rawVal
        else if (targetKey === "firstName") firstName = rawVal
        else if (targetKey === "lastName") lastName = rawVal
        else if (targetKey === "phone") phone = rawVal.replace(/[^\d+]/g, "")
        else if (targetKey === "companyTitle") companyTitle = rawVal
        else if (targetKey === "email") email = rawVal
        else if (targetKey === "taxNumber") taxNumber = rawVal
        else if (targetKey === "taxOffice") taxOffice = rawVal
        else if (targetKey === "plate") plate = rawVal.toUpperCase().replace(/\s+/g, "")
        else if (targetKey === "brand") brand = rawVal
        else if (targetKey === "model") model = rawVal
        else if (targetKey === "year") year = Number(rawVal) || undefined
        else if (targetKey === "kilometer") currentKm = Number(rawVal) || undefined
        else if (targetKey === "vin") vin = rawVal.toUpperCase()
        else if (targetKey === "fuelType") fuelType = rawVal
        else if (targetKey === "transmission") transmission = rawVal
        else if (targetKey === "notes") notes = rawVal
      }

      // If fullName mapped, split using smart parser (supports double surnames)
      if (fullName && !firstName && !lastName) {
        const parsed = parseFullName(fullName)
        firstName = parsed.firstName
        lastName = parsed.lastName
      }

      // Row validity check
      const hasCustomer = Boolean(firstName || companyTitle || phone)
      const hasVehicle = Boolean(plate)

      let _isValid = true
      let _errorMsg = ""

      if (!hasCustomer && !hasVehicle) {
        _isValid = false
        _errorMsg = "Müşteri veya plaka bilgisi bulunamadı."
      }

      return {
        firstName,
        lastName,
        phone,
        companyTitle,
        email,
        taxNumber,
        taxOffice,
        plate,
        brand,
        model,
        year,
        currentKm,
        vin,
        fuelType,
        transmission,
        notes,
        _original: row,
        _isValid,
        _errorMsg,
      }
    })

    setTransformedRows(transformed)
    setCurrentStep(3)
  }

  // Update inline preview row (e.g. adjust double surname)
  const handleUpdateRowField = (idx: number, field: keyof BatchImportCustomerItem, value: any) => {
    setTransformedRows((prev) => {
      const copy = [...prev]
      copy[idx] = {
        ...copy[idx],
        [field]: value,
      }
      return copy
    })
  }

  // Submit batch import
  const handleExecuteImport = async () => {
    const rowsToImport = skipInvalid ? transformedRows.filter((r) => r._isValid) : transformedRows
    if (rowsToImport.length === 0) {
      toast.error("İçe aktarılacak geçerli satır bulunamadı.")
      return
    }

    try {
      const payload: BatchImportCustomerItem[] = rowsToImport.map((r) => ({
        firstName: r.firstName,
        lastName: r.lastName,
        phone: r.phone,
        companyTitle: r.companyTitle,
        email: r.email,
        taxNumber: r.taxNumber,
        taxOffice: r.taxOffice,
        plate: r.plate,
        brand: r.brand,
        model: r.model,
        year: r.year,
        currentKm: r.currentKm,
        vin: r.vin,
        fuelType: r.fuelType,
        transmission: r.transmission,
        notes: r.notes,
      }))

      const res = await batchImportMutation.mutateAsync({ items: payload })
      setImportResult(res)
      setCurrentStep(4)
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error(err)
    }
  }

  if (!isOpen || !mounted) return null

  const validRowCount = transformedRows.filter((r) => r._isValid).length
  const invalidRowCount = transformedRows.length - validRowCount

  const modalContent = (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Header with Stepper */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Excel ile Müşteri & Araç İçe Aktarma
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Mevcut listenizi yükleyin, sütunları eşleştirin ve tek tıkla sisteme aktarın.
              </p>
            </div>
          </div>

          {/* Stepper Badges */}
          <div className="hidden sm:flex items-center gap-2">
            {[
              { num: 1, title: "Dosya Yükle" },
              { num: 2, title: "Eşleştirme" },
              { num: 3, title: "Önizleme" },
              { num: 4, title: "Tamamlandı" },
            ].map((st) => (
              <div
                key={st.num}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all",
                  currentStep === st.num
                    ? "bg-sky-500 text-white shadow-xs font-bold"
                    : currentStep > st.num
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                )}
              >
                <span>{st.num}</span>
                <span>{st.title}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* STEP 1: UPLOAD & TEMPLATE */}
          {currentStep === 1 && (
            <div className="space-y-5">
              {/* Drag & Drop Card */}
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={cn(
                  "border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all flex flex-col items-center justify-center gap-3 cursor-pointer",
                  isDragging
                    ? "border-sky-500 bg-sky-500/10 scale-[1.01]"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 hover:border-sky-500/50 hover:bg-slate-50"
                )}
                onClick={() => document.getElementById("excel-file-input")?.click()}
              >
                <input
                  id="excel-file-input"
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileProcess(e.target.files[0])
                    }
                  }}
                />
                
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner">
                  <UploadCloud size={32} />
                </div>

                <div className="space-y-1 max-w-sm">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Excel Dosyasını Buraya Sürükleyin veya Seçin
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Desteklenen formatlar: <span className="font-semibold text-emerald-600 dark:text-emerald-400">.xlsx, .xls, .csv</span>
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="h-9 px-4 rounded-xl text-xs font-semibold mt-2 cursor-pointer"
                >
                  Dosya Gözat
                </Button>
              </div>

              {/* Sample Template Download Action Card */}
              <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-500 flex items-center justify-center shrink-0">
                    <Download size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Hazır Excel Şablonu Kullanmak İster misiniz?
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Standart sütunları içeren örnek şablonu indirip verilerinizi doldurarak anında yükleyebilirsiniz.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => downloadSampleTemplate("all")}
                  variant="outline"
                  className="h-9 px-4 text-xs font-semibold gap-1.5 shrink-0 bg-white dark:bg-slate-900 cursor-pointer"
                >
                  <Download size={14} />
                  <span>Örnek Şablonu İndir (.xlsx)</span>
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING (GÖRSELDEKİ EŞLEŞTİRME SİSTEMİ) */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-emerald-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {fileName} ({fileRows.length} Satır Tespit Edildi)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Sol sütundaki dosya başlıklarını sağdaki WorksAuto alanlarıyla eşleştirin.
                </p>
              </div>

              {/* Mapping Table */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-100/60 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <div>Excel Sütun Başlığı & Örnek Veri</div>
                  <div>WorksAuto Sistem Alanı</div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-96 overflow-y-auto">
                  {fileHeaders.map((header) => {
                    const sampleVal = fileRows[0]?.[header] || fileRows[1]?.[header] || "Boş"
                    const currentTarget = mappings[header] || ""

                    return (
                      <div
                        key={header}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 items-center hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        {/* Left: Column info & sample */}
                        <div className="space-y-0.5 overflow-hidden">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {header}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono truncate">
                            Örnek: {String(sampleVal)}
                          </p>
                        </div>

                        {/* Right: Target dropdown selector */}
                        <div>
                          <select
                            value={currentTarget}
                            onChange={(e) => {
                              const val = e.target.value
                              setMappings((prev) => ({ ...prev, [header]: val }))
                            }}
                            className={cn(
                              "w-full h-9 px-3 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer transition-colors",
                              currentTarget
                                ? "border-sky-500 bg-sky-500/10 text-sky-950 dark:text-sky-100 font-semibold"
                                : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-400"
                            )}
                          >
                            <option value="">-- Atla / Eşleştirme Yapma --</option>
                            <optgroup label="Müşteri Bilgileri">
                              {TARGET_FIELDS.filter((f) => f.group === "customer").map((f) => (
                                <option key={f.key} value={f.key}>
                                  {f.label}
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="Araç Bilgileri">
                              {TARGET_FIELDS.filter((f) => f.group === "vehicle").map((f) => (
                                <option key={f.key} value={f.key}>
                                  {f.label}
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="Diğer">
                              {TARGET_FIELDS.filter((f) => f.group === "other").map((f) => (
                                <option key={f.key} value={f.key}>
                                  {f.label}
                                </option>
                              ))}
                            </optgroup>
                          </select>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SIDE-BY-SIDE TRANSFORM PREVIEW & MULTI-SURNAME CHECK */}
          {currentStep === 3 && (
            <div className="space-y-4">
              {/* Summary Stats Header */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>Yan Yana Dönüşüm Önizlemesi</span>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      {validRowCount} Geçerli Satır
                    </span>
                    {invalidRowCount > 0 && (
                      <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">
                        {invalidRowCount} Hatalı / Eksik Satır
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Sol tarafta Excel'deki ham veri, sağ tarafta sisteme kaydedilecek Ad, Soyad ve Araç Plakası yer alır. İsimleri gerekirse doğrudan düzenleyebilirsiniz.
                  </p>
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none shrink-0">
                  <input
                    type="checkbox"
                    checked={skipInvalid}
                    onChange={(e) => setSkipInvalid(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                  <span>Hatalı satırları atla</span>
                </label>
              </div>

              {/* Side-by-Side Cards List */}
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {transformedRows.map((row, idx) => {
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "p-3 rounded-2xl border transition-all grid grid-cols-1 md:grid-cols-2 gap-3 items-center",
                        row._isValid
                          ? "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
                          : "bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/30"
                      )}
                    >
                      {/* SOL PANEL: EXCEL HAM VERİSİ */}
                      <div className="space-y-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 text-xs">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <span>Excel Satır #{idx + 1}</span>
                          {!row._isValid && (
                            <span className="text-rose-500 font-semibold">{row._errorMsg}</span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-slate-600 dark:text-slate-300 truncate">
                          {Object.entries(row._original)
                            .slice(0, 3)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(" | ")}
                        </div>
                      </div>

                      {/* SAĞ PANEL: WORKSAUTO DÜZENLENMİŞ VERİ (ÇİFT SOYAD DESTEKLİ DÜZENLENEBİLİR) */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        {/* Ad & Soyad Düzenlenebilir Inputlar */}
                        <div className="grid grid-cols-2 gap-1.5 flex-1">
                          <input
                            type="text"
                            placeholder="Ad"
                            value={row.firstName}
                            onChange={(e) => handleUpdateRowField(idx, "firstName", e.target.value)}
                            className="h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500"
                            title="Müşteri Adı"
                          />
                          <input
                            type="text"
                            placeholder="Soyad (Kaya Yılmaz)"
                            value={row.lastName}
                            onChange={(e) => handleUpdateRowField(idx, "lastName", e.target.value)}
                            className="h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500"
                            title="Müşteri Soyadı (Çift soyadı dahil)"
                          />
                        </div>

                        {/* Telefon */}
                        <input
                          type="text"
                          placeholder="Telefon"
                          value={row.phone}
                          onChange={(e) => handleUpdateRowField(idx, "phone", e.target.value)}
                          className="w-28 h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
                          title="Telefon"
                        />

                        {/* Plaka Rozeti */}
                        {row.plate ? (
                          <PlateBadge plate={row.plate} size="sm" />
                        ) : (
                          <span className="text-[10px] text-slate-400 italic px-2">Plaka yok</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 4: IMPORT EXECUTION & RESULTS */}
          {currentStep === 4 && importResult && (
            <div className="py-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  İçe Aktarma Başarıyla Tamamlandı
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Excel tablonuzdaki veriler başarıyla WorksAuto veritabanına işlendi.
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto text-left">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                  <p className="text-[10px] font-semibold text-slate-400">Yeni Müşteri</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    +{importResult.importedCustomersCount}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                  <p className="text-[10px] font-semibold text-slate-400">Yeni Araç</p>
                  <p className="text-xl font-bold text-sky-600 dark:text-sky-400">
                    +{importResult.importedVehiclesCount}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                  <p className="text-[10px] font-semibold text-slate-400">Mevcut Kayıt</p>
                  <p className="text-xl font-bold text-slate-700 dark:text-slate-300">
                    {importResult.existingCustomersCount + importResult.existingVehiclesCount}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                  <p className="text-[10px] font-semibold text-slate-400">Toplam Satır</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {importResult.totalRows}
                  </p>
                </div>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="max-w-md mx-auto p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left space-y-1 text-xs text-amber-700 dark:text-amber-300">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertCircle size={14} />
                    <span>{importResult.errors.length} satır işlenirken uyarı alındı:</span>
                  </p>
                  <ul className="list-disc list-inside text-[11px] space-y-0.5">
                    {importResult.errors.slice(0, 3).map((e: any, i: number) => (
                      <li key={i}>Satır {e.row}: {e.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div>
            {currentStep === 2 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="h-10 px-4 text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Dosyayı Değiştir</span>
              </Button>
            )}
            {currentStep === 3 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="h-10 px-4 text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Eşleştirmeyi Değiştir</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 4 ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="h-10 px-4 text-xs font-semibold cursor-pointer"
                >
                  Vazgeç
                </Button>

                {currentStep === 1 && (
                  <Button
                    type="button"
                    disabled={fileHeaders.length === 0 || isLoadingFile}
                    onClick={() => setCurrentStep(2)}
                    className="h-10 px-5 text-xs font-semibold gap-1.5 cursor-pointer shadow-md shadow-sky-500/20"
                  >
                    <span>Devam Et: Eşleştirme</span>
                    <ArrowRight size={14} />
                  </Button>
                )}

                {currentStep === 2 && (
                  <Button
                    type="button"
                    onClick={handleProceedToPreview}
                    className="h-10 px-5 text-xs font-semibold gap-1.5 cursor-pointer shadow-md shadow-sky-500/20"
                  >
                    <span>Önizleme ve Doğrulama</span>
                    <ArrowRight size={14} />
                  </Button>
                )}

                {currentStep === 3 && (
                  <Button
                    type="button"
                    disabled={batchImportMutation.isPending || validRowCount === 0}
                    onClick={handleExecuteImport}
                    className="h-10 px-5 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-md shadow-emerald-600/20"
                  >
                    <Check size={14} />
                    <span>
                      {batchImportMutation.isPending
                        ? "İçe Aktarılıyor..."
                        : `Sisteme Aktar (${validRowCount} Kayıt)`}
                    </span>
                  </Button>
                )}
              </>
            ) : (
              <Button
                type="button"
                onClick={handleClose}
                className="h-10 px-6 text-xs font-semibold gap-1.5 cursor-pointer shadow-md shadow-sky-500/20"
              >
                <Check size={14} />
                <span>Tamamla ve Listeye Dön</span>
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
