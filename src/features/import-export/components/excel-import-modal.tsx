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
  AlertTriangle,
  Sparkles,
  Car,
  User,
  Check,
  Building2,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Layers,
  Info,
  Table as TableIcon,
  Search,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/sonner"
import {
  TARGET_FIELDS,
  guessTargetField,
  readExcelFile,
  downloadSampleTemplate,
  parseFullName,
  getColumnSampleValues,
  normalizePhoneNumber,
  analyzeRowSuitability,
  parseRowsFromHeaderIndex,
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

  // Stepper state: 1: upload, 2: row pick, 3: mapping, 4: preview, 5: result
  const [currentStep, setCurrentStep] = React.useState<1 | 2 | 3 | 4 | 5>(1)

  // File state
  const [fileName, setFileName] = React.useState("")
  const [allRawRows, setAllRawRows] = React.useState<any[][]>([])
  const [selectedHeaderRowIndex, setSelectedHeaderRowIndex] = React.useState<number>(0)
  const [fileHeaders, setFileHeaders] = React.useState<string[]>([])
  const [fileRows, setFileRows] = React.useState<Record<string, any>[]>([])
  const [isDragging, setIsDragging] = React.useState(false)
  const [isLoadingFile, setIsLoadingFile] = React.useState(false)

  // Mapping state: { [targetFieldKey]: excelHeader }
  const [mappings, setMappings] = React.useState<Record<string, string>>({})
  // Name format toggle: single column (fullName) vs split columns (firstName + lastName)
  const [nameMode, setNameMode] = React.useState<"single" | "split">("single")

  // Transformed preview rows (user editable in step 4)
  const [transformedRows, setTransformedRows] = React.useState<
    (BatchImportCustomerItem & { _original: Record<string, any>; _isValid: boolean; _errorMsg?: string })[]
  >([])
  const [skipInvalid, setSkipInvalid] = React.useState(true)
  const [previewFilter, setPreviewFilter] = React.useState<"all" | "valid" | "invalid">("all")
  const [previewSearch, setPreviewSearch] = React.useState("")

  // Result state
  const [importResult, setImportResult] = React.useState<any>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Reset when modal closes
  const handleClose = () => {
    setCurrentStep(1)
    setFileName("")
    setAllRawRows([])
    setSelectedHeaderRowIndex(0)
    setFileHeaders([])
    setFileRows([])
    setMappings({})
    setNameMode("single")
    setTransformedRows([])
    setPreviewFilter("all")
    setPreviewSearch("")
    setImportResult(null)
    onClose()
  }

  // Sütun başlıklarına göre akıllı eşleştirmeyi uygular
  const applyMappingForHeaders = (headers: string[]) => {
    const initialMap: Record<string, string> = {}
    let hasFirst = false
    let hasLast = false

    headers.forEach((h) => {
      const target = guessTargetField(h)
      if (target && !initialMap[target]) {
        initialMap[target] = h
        if (target === "firstName") hasFirst = true
        if (target === "lastName") hasLast = true
      }
    })

    if (hasFirst && hasLast) {
      setNameMode("split")
      delete initialMap.fullName
    } else {
      setNameMode("single")
      delete initialMap.firstName
      delete initialMap.lastName
    }

    setMappings(initialMap)
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
      setAllRawRows(parsed.allRawRows)
      setSelectedHeaderRowIndex(parsed.detectedHeaderRowIndex)
      setFileHeaders(parsed.headers)
      setFileRows(parsed.rows)

      applyMappingForHeaders(parsed.headers)

      toast.success(`${parsed.allRawRows.length} satırlık dosya yüklendi. Başlık satırını doğrulayın.`)
      setCurrentStep(2)
    } catch (err: any) {
      toast.error(err.message || "Excel dosyası okunamadı.")
    } finally {
      setIsLoadingFile(false)
    }
  }

  // Satır seçimi değiştirildiğinde (Adım 2)
  const handleSelectHeaderRow = (rowIndex: number) => {
    setSelectedHeaderRowIndex(rowIndex)
    const parsed = parseRowsFromHeaderIndex(allRawRows, rowIndex)
    setFileHeaders(parsed.headers)
    setFileRows(parsed.rows)
    applyMappingForHeaders(parsed.headers)
  }

  // Satır seçimini onayla (Adım 2 -> Adım 3)
  const handleConfirmHeaderRow = () => {
    const analysis = analyzeRowSuitability(allRawRows[selectedHeaderRowIndex] || [])
    if (analysis.isTooEmpty) {
      toast.error("Lütfen başlıkların yer aldığı dolu bir satır seçin.")
      return
    }
    if (analysis.isLikelyData) {
      toast.warning("Dikkat: Seçtiğiniz satır müşteri verisine benziyor. Sütun eşleştirmelerini dikkatle kontrol edin.")
    } else {
      toast.success(`Satır ${selectedHeaderRowIndex + 1} başlık satırı olarak belirlendi.`)
    }
    setCurrentStep(3)
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
    // Check required fields
    const hasPhone = Boolean(mappings.phone)
    const hasPlate = Boolean(mappings.plate)
    const hasName = nameMode === "single" ? Boolean(mappings.fullName) : Boolean(mappings.firstName || mappings.lastName)

    if (!hasPhone || !hasPlate) {
      toast.warning("Lütfen zorunlu alanları (Telefon Numarası ve Araç Plakası) dosyanızdaki sütunlarla eşleştirin.")
      return
    }

    if (!hasName && !mappings.companyTitle) {
      toast.warning("Lütfen Müşteri Adı Soyadı veya Şirket Ünvanı sütununu eşleştirin.")
      return
    }

    const transformed = fileRows.map((row) => {
      const getVal = (targetKey: string): string => {
        const header = mappings[targetKey]
        if (!header) return ""
        const raw = row[header]
        return raw !== undefined && raw !== null ? String(raw).trim() : ""
      }

      let firstName = ""
      let lastName = ""

      if (nameMode === "single") {
        const fullName = getVal("fullName")
        if (fullName) {
          const parsed = parseFullName(fullName)
          firstName = parsed.firstName
          lastName = parsed.lastName
        }
      } else {
        firstName = getVal("firstName")
        lastName = getVal("lastName")
      }

      let phone = normalizePhoneNumber(getVal("phone"))
      let companyTitle = getVal("companyTitle")
      let email = getVal("email")
      let taxNumber = getVal("taxNumber")
      let taxOffice = getVal("taxOffice")
      let plate = getVal("plate").toUpperCase().replace(/\s+/g, "")
      let brand = getVal("brand")
      let model = getVal("model")
      const rawYear = getVal("year")
      let year: number | undefined = rawYear ? Number(rawYear.replace(/[^\d]/g, "")) || undefined : undefined
      const rawKm = getVal("kilometer")
      let currentKm: number | undefined = rawKm ? Number(rawKm.replace(/[^\d]/g, "")) || undefined : undefined
      let vin = getVal("vin").toUpperCase()
      let fuelType = getVal("fuelType")
      let transmission = getVal("transmission")
      let notes = getVal("notes")

      // Row validity check
      const hasCustomer = Boolean(firstName || companyTitle || phone)
      const hasVehicle = Boolean(plate)

      let _isValid = true
      let _errorMsg = ""

      if (!hasCustomer && !hasVehicle) {
        _isValid = false
        _errorMsg = "Müşteri veya plaka bilgisi bulunamadı."
      } else if (!plate) {
        _isValid = false
        _errorMsg = "Plaka boş."
      } else if (!phone && !companyTitle) {
        _isValid = false
        _errorMsg = "Telefon veya firma ünvanı boş."
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
    setCurrentStep(4)
  }

  // Update inline preview row with real-time cell validation
  const handleUpdateRowField = (idx: number, field: keyof BatchImportCustomerItem, value: any) => {
    setTransformedRows((prev) => {
      const copy = [...prev]
      const updated = {
        ...copy[idx],
        [field]: value,
      }

      const hasCust = Boolean(updated.firstName?.trim() || updated.companyTitle?.trim() || updated.phone?.trim())
      const hasVeh = Boolean(updated.plate?.trim())
      let _isValid = true
      let _errorMsg = ""

      if (!hasCust && !hasVeh) {
        _isValid = false
        _errorMsg = "Müşteri veya plaka bilgisi bulunamadı."
      } else if (!updated.plate?.trim()) {
        _isValid = false
        _errorMsg = "Plaka boş."
      } else if (!updated.phone?.trim() && !updated.companyTitle?.trim()) {
        _isValid = false
        _errorMsg = "Telefon veya firma ünvanı boş."
      }

      updated._isValid = _isValid
      updated._errorMsg = _errorMsg
      copy[idx] = updated
      return copy
    })
  }

  // Delete row from preview table
  const handleDeleteRow = (idx: number) => {
    setTransformedRows((prev) => prev.filter((_, i) => i !== idx))
    toast.info("Satır tablodan çıkarıldı.")
  }

  // Add new empty row to preview table
  const handleAddRow = () => {
    setTransformedRows((prev) => [
      ...prev,
      {
        firstName: "",
        lastName: "",
        phone: "",
        companyTitle: "",
        email: "",
        taxNumber: "",
        taxOffice: "",
        plate: "",
        brand: "",
        model: "",
        year: undefined,
        currentKm: undefined,
        vin: "",
        fuelType: "",
        transmission: "",
        notes: "",
        _original: {},
        _isValid: false,
        _errorMsg: "Telefon ve plaka girilmelidir.",
      },
    ])
    toast.success("Yeni satır eklendi.")
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
      setCurrentStep(5)
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error(err)
    }
  }

  const previewRows = allRawRows.slice(0, 10)
  const previewColCount = Math.min(
    Math.max(
      ...previewRows.map((r) => (Array.isArray(r) ? r.length : 0)),
      fileHeaders.length,
      4
    ),
    12
  )
  const colLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]

  const isNameMapped = nameMode === "single" ? Boolean(mappings.fullName) : Boolean(mappings.firstName || mappings.lastName)
  const isReadyToProceed = Boolean(mappings.phone && mappings.plate && (isNameMapped || mappings.companyTitle))

  const unmappedHeaders = fileHeaders.filter((h) => !Object.values(mappings).includes(h))
  const isAllHeadersMapped = fileHeaders.length > 0 && unmappedHeaders.length === 0

  const renderFieldRow = (
    fieldKey: string,
    label: string,
    description?: string,
    isRequired?: boolean,
    layout: "horizontal" | "stacked" = "stacked"
  ) => {
    const currentExcelHeader = mappings[fieldKey] || ""
    const sampleValues = currentExcelHeader
      ? getColumnSampleValues(currentExcelHeader, fileRows, 2)
      : []

    return (
      <div
        key={fieldKey}
        className={cn(
          "p-3 rounded-2xl border transition-all",
          currentExcelHeader
            ? "bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-sm"
            : isRequired
            ? "bg-rose-50/30 dark:bg-rose-950/10 border-rose-200/60 dark:border-rose-900/30"
            : "bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800/50"
        )}
      >
        <div
          className={cn(
            layout === "horizontal"
              ? "flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              : "flex flex-col gap-2"
          )}
        >
          {/* Sol Alan Bilgisi */}
          <div className={cn("space-y-0.5", layout === "horizontal" ? "max-w-sm" : "w-full")}>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {label}
              </span>
              {isRequired && (
                <span className="text-rose-500 font-bold text-sm leading-none" title="Zorunlu Alan">
                  *
                </span>
              )}
            </div>
            {description && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {description}
              </p>
            )}
          </div>

          {/* Sağ Seçim Kutusu & Önizleme */}
          <div className={cn(layout === "horizontal" ? "w-full sm:w-80 shrink-0" : "w-full", "space-y-1.5")}>
            <select
              value={currentExcelHeader}
              onChange={(e) => {
                const val = e.target.value
                setMappings((prev) => ({ ...prev, [fieldKey]: val }))
              }}
              className={cn(
                "w-full h-9 px-3 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer transition-colors [color-scheme:light] dark:[color-scheme:dark]",
                currentExcelHeader
                  ? "border-sky-500 bg-sky-50/50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-semibold ring-1 ring-sky-500/20"
                  : isRequired
                  ? "border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400"
              )}
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 py-1">
                -- Boş Bırak / Aktarma --
              </option>
              {fileHeaders.map((header) => (
                <option
                  key={header}
                  value={header}
                  className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium py-1"
                >
                  {header}
                </option>
              ))}
            </select>

            {currentExcelHeader ? (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/80 px-2 py-1 rounded-lg">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 flex items-center gap-1 text-[10px]">
                  <CheckCircle2 size={11} />
                  Örnek:
                </span>
                <span className="truncate font-mono text-[10px] text-slate-700 dark:text-slate-200">
                  {sampleValues.length > 0 ? sampleValues.join(", ") : "(Boş)"}
                </span>
              </div>
            ) : isRequired ? (
              <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                <AlertCircle size={11} />
                Lütfen dosyanızdaki sütunu seçiniz
              </p>
            ) : (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                Dosyadan aktarılmayacak
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!isOpen || !mounted) return null

  const validRowCount = transformedRows.filter((r) => r._isValid).length
  const invalidRowCount = transformedRows.length - validRowCount

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
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
              { num: 2, title: "Satır & Başlık" },
              { num: 3, title: "Eşleştirme" },
              { num: 4, title: "Önizleme" },
              { num: 5, title: "Tamamlandı" },
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
                  "border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all flex flex-col items-center justify-center gap-3 cursor-pointer select-none",
                  isDragging
                    ? "border-sky-500 bg-sky-500/15 dark:bg-sky-950/40 ring-4 ring-sky-500/20 scale-[1.01]"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 hover:border-sky-500/50 hover:bg-sky-50/40 dark:hover:bg-sky-950/20"
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
                
                <div className={cn(
                  "w-16 h-16 rounded-3xl flex items-center justify-center shadow-inner transition-transform",
                  isDragging
                    ? "bg-sky-500 text-white scale-110 shadow-lg shadow-sky-500/30"
                    : "bg-emerald-500/10 text-emerald-500"
                )}>
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

          {/* STEP 2: INTERACTIVE ROW & HEADER SELECTION */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Header Info Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                    <TableIcon size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {fileName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                        Toplam {allRawRows.length} Satır Yüklendi
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Sütun başlıklarınızın yer aldığı satır yeşil renkle seçildi. Eğer farklı bir satırsa doğrudan tablodan o satıra tıklayabilirsiniz.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 size={14} />
                    Seçili: {selectedHeaderRowIndex + 1}. Satır
                  </span>
                </div>
              </div>

              {/* Canlı Satır Durumu Rozeti & Uyarı */}
              {(() => {
                const analysis = analyzeRowSuitability(allRawRows[selectedHeaderRowIndex] || [])
                if (analysis.isLikelyHeader) {
                  return (
                    <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 flex items-start gap-3 text-xs text-emerald-900 dark:text-emerald-200">
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">
                          🎯 Harika! Satır {selectedHeaderRowIndex + 1} Başlık Satırı Olarak Uygun
                        </span>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                          Bu satırda {analysis.matchedHeadersCount} adet standart sütun başlığı (Ad, Telefon, Plaka vb.) tespit edildi. Müşteri verileriniz <strong>{selectedHeaderRowIndex + 2}. Satırdan</strong> itibaren okunacaktır.
                        </p>
                      </div>
                    </div>
                  )
                }
                if (analysis.isLikelyData) {
                  return (
                    <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
                      <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">
                          ⚠️ Dikkat: Satır {selectedHeaderRowIndex + 1} Başlık Yerine Müşteri Verisine Benziyor!
                        </span>
                        <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                          {analysis.warning} Bu satırı başlık olarak onaylarsanız kişi bilgileri sütun başlığı olarak algılanacaktır. Lütfen gerçek başlık satırına tıklayın.
                        </p>
                      </div>
                    </div>
                  )
                }
                return (
                  <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 flex items-start gap-3 text-xs text-rose-900 dark:text-rose-200">
                    <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">
                        ⛔ Geçersiz Satır: Satır {selectedHeaderRowIndex + 1} Yetersiz Veri İçeriyor
                      </span>
                      <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                        {analysis.warning} Bu satır boş veya tek bir hücreden oluşuyor. İlerlemek için tablodan sütun isimlerinin olduğu satırı seçmelisiniz.
                      </p>
                    </div>
                  </div>
                )
              })()}

              {/* İnteraktif Excel Tablosu */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/50 shadow-xs">
                <div className="px-4 py-2.5 bg-slate-100/60 dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TableIcon size={14} className="text-slate-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Excel Dosyası Önizlemesi (İlk 10 Satır)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Satıra tıklayarak başlık yapabilirsiniz
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 border-b border-slate-200/80 dark:border-slate-800 font-mono text-[10px]">
                        <th className="px-3 py-2 text-center w-20 shrink-0 border-r border-slate-200/60 dark:border-slate-800">
                          Satır #
                        </th>
                        <th className="px-3 py-2 text-center w-28 shrink-0 border-r border-slate-200/60 dark:border-slate-800">
                          Durum
                        </th>
                        {colLetters.slice(0, previewColCount).map((letter) => (
                          <th key={letter} className="px-3 py-2 min-w-[130px] border-r border-slate-200/60 dark:border-slate-800 font-bold">
                            Sütun {letter}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {previewRows.map((row, rIdx) => {
                        const isSelected = rIdx === selectedHeaderRowIndex
                        const isBefore = rIdx < selectedHeaderRowIndex

                        return (
                          <tr
                            key={rIdx}
                            onClick={() => handleSelectHeaderRow(rIdx)}
                            className={cn(
                              "transition-all cursor-pointer select-none",
                              isSelected
                                ? "bg-emerald-500/15 dark:bg-emerald-950/50 font-bold text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/30"
                                : isBefore
                                ? "bg-slate-50/50 dark:bg-slate-950/30 text-slate-400 dark:text-slate-500 opacity-60 hover:opacity-100 hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
                                : "hover:bg-sky-50/50 dark:hover:bg-sky-950/20 text-slate-700 dark:text-slate-200"
                            )}
                          >
                            {/* Satır Numarası */}
                            <td className="px-3 py-2.5 text-center font-mono text-xs border-r border-slate-200/60 dark:border-slate-800">
                              <span
                                className={cn(
                                  "w-6 h-6 rounded-md inline-flex items-center justify-center font-bold text-xs",
                                  isSelected
                                    ? "bg-emerald-500 text-white shadow-xs"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                )}
                              >
                                {rIdx + 1}
                              </span>
                            </td>

                            {/* Durum Rozeti */}
                            <td className="px-3 py-2.5 text-center border-r border-slate-200/60 dark:border-slate-800">
                              {isSelected ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white shadow-xs">
                                  <CheckCircle2 size={10} />
                                  Başlık
                                </span>
                              ) : isBefore ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200/70 dark:bg-slate-800 text-slate-500">
                                  Atlanacak
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
                                  Veri #{rIdx - selectedHeaderRowIndex}
                                </span>
                              )}
                            </td>

                            {/* Hücre Değerleri */}
                            {Array.from({ length: previewColCount }).map((_, cIdx) => {
                              const val = Array.isArray(row) ? row[cIdx] : ""
                              const displayVal = val !== undefined && val !== null ? String(val).trim() : ""
                              return (
                                <td
                                  key={cIdx}
                                  className="px-3 py-2.5 border-r border-slate-200/40 dark:border-slate-800/40 text-xs font-mono truncate max-w-[160px]"
                                  title={displayVal}
                                >
                                  {displayVal || <span className="text-slate-300 dark:text-slate-600 italic">--</span>}
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
            </div>
          )}

          {/* STEP 3: TARGET-DRIVEN COLUMN MAPPING & CONFIRMATION */}
          {currentStep === 3 && (
            <div className="space-y-4">
              {/* File Info Header & Status */}
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <FileSpreadsheet size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {fileName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {fileRows.length} Satır • {fileHeaders.length} Sütun
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Lütfen sistemin otomatik eşleştirdiği alanları kontrol edin ve eksik olanları tamamlayın.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isReadyToProceed ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <ShieldCheck size={14} />
                        Zorunlu Alanlar Hazır
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        <AlertCircle size={14} />
                        Zorunlu Alanlar Eksik
                      </span>
                    )}
                  </div>
                </div>

                {/* Sütun Tespit Özeti (Hepsi bulundu mu, hangileri eşleşmedi?) */}
                {isAllHeadersMapped ? (
                  <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-200">
                    <Sparkles size={16} className="text-emerald-500 shrink-0" />
                    <div>
                      <span className="font-bold">Mükemmel! Dosyanızdaki {fileHeaders.length} sütunun tamamı sistem alanlarıyla başarıyla eşleştirildi (%100 Tespit Edildi).</span>
                      <span className="block text-[11px] text-emerald-600 dark:text-emerald-400 font-normal">
                        Aşağıdaki her kutunun altındaki canlı örnek verileri teyit edip doğrudan önizlemeye geçebilirsiniz.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                    <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">
                        Dosyanızdaki {fileHeaders.length} sütundan {fileHeaders.length - unmappedHeaders.length} tanesi otomatik eşleştirildi.
                      </span>
                      <span className="block text-[11px] text-amber-700 dark:text-amber-300 font-normal mt-0.5">
                        Otomatik eşleşmeyen sütunlar: <span className="font-semibold font-mono">{unmappedHeaders.map((h) => `"${h}"`).join(", ")}</span> (İsterseniz bu sütunları aşağıdaki alanlarla eşleştirebilir veya boş bırakabilirsiniz).
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Scrollable Form Categories */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {/* 1. ZORUNLU ALANLAR */}
                <div className="rounded-2xl border border-rose-200/80 dark:border-rose-900/40 overflow-hidden bg-rose-50/20 dark:bg-rose-950/10">
                  <div className="p-3 bg-rose-100/50 dark:bg-rose-900/30 border-b border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        1. Zorunlu Temel Bilgiler
                      </h4>
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                        (Aktarım için doldurulması şarttır)
                      </span>
                    </div>
                  </div>

                  <div className="p-3 space-y-3">
                    {/* Telefon Numarası */}
                    {renderFieldRow(
                      "phone",
                      "Telefon Numarası",
                      "Müşteri iletişim numarası (Örn: 0532 123 45 67)",
                      true,
                      "horizontal"
                    )}

                    {/* Araç Plakası */}
                    {renderFieldRow(
                      "plate",
                      "Araç Plakası",
                      "Resmi plaka formatı (Örn: 34 ABC 123)",
                      true,
                      "horizontal"
                    )}

                    {/* Müşteri İsim Yapısı & Seçici */}
                    <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              Müşteri İsim Formatı
                            </span>
                            <span className="text-rose-500 font-bold text-sm leading-none">*</span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Excel dosyanızda ad ve soyad tek sütunda mı yoksa iki ayrı sütunda mı?
                          </p>
                        </div>

                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setNameMode("single")
                              setMappings((prev) => {
                                const copy = { ...prev }
                                delete copy.firstName
                                delete copy.lastName
                                return copy
                              })
                            }}
                            className={cn(
                              "px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                              nameMode === "single"
                                ? "bg-sky-500 text-white shadow-sm"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                            )}
                          >
                            Tek Sütun (Ad Soyad)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNameMode("split")
                              setMappings((prev) => {
                                const copy = { ...prev }
                                delete copy.fullName
                                return copy
                              })
                            }}
                            className={cn(
                              "px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                              nameMode === "split"
                                ? "bg-sky-500 text-white shadow-sm"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                            )}
                          >
                            Ayrı Sütunlar (Ad + Soyad)
                          </button>
                        </div>
                      </div>

                      {nameMode === "single" ? (
                        <div>
                          {renderFieldRow(
                            "fullName",
                            "Müşteri Adı Soyadı (Birleşik)",
                            "Örn: Ahmet Yılmaz veya Fatma Zehra Kaya Yılmaz (Akıllı çift soyad ayrıştırma uygulanır)",
                            true,
                            "horizontal"
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            {renderFieldRow(
                              "firstName",
                              "Müşteri Adı",
                              "Örn: Ahmet veya Fatma Zehra",
                              true,
                              "stacked"
                            )}
                          </div>
                          <div>
                            {renderFieldRow(
                              "lastName",
                              "Müşteri Soyadı",
                              "Örn: Yılmaz veya Kaya Yılmaz",
                              true,
                              "stacked"
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. ARAÇ BİLGİLERİ (İSTEĞE BAĞLI) */}
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-slate-50/40 dark:bg-slate-950/20">
                  <div className="p-3 bg-slate-100/60 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Car size={15} className="text-sky-500" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        2. Araç Detayları
                      </h4>
                      <span className="text-[10px] text-slate-500">
                        (İsteğe bağlı, dosyanızda varsa eşleştirin)
                      </span>
                    </div>
                  </div>

                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {renderFieldRow("brand", "Araç Markası", "Örn: Renault, Fiat, BMW, Mercedes", false, "stacked")}
                    {renderFieldRow("model", "Araç Modeli", "Örn: Megane, Egea, 320i, C200", false, "stacked")}
                    {renderFieldRow("year", "Model Yılı", "Örn: 2022, 2019", false, "stacked")}
                    {renderFieldRow("kilometer", "Güncel Kilometre (KM)", "Örn: 85000, 120000", false, "stacked")}
                    {renderFieldRow("vin", "Şasi Numarası (VIN)", "17 haneli şasi no", false, "stacked")}
                    {renderFieldRow("fuelType", "Yakıt Tipi", "Benzin, Dizel, Hibrit, Elektrik, LPG", false, "stacked")}
                    {renderFieldRow("transmission", "Vites Türü", "Manuel, Otomatik", false, "stacked")}
                  </div>
                </div>

                {/* 3. MÜŞTERİ DETAYLARI & DİĞER (İSTEĞE BAĞLI) */}
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-slate-50/40 dark:bg-slate-950/20">
                  <div className="p-3 bg-slate-100/60 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User size={15} className="text-indigo-500" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        3. Müşteri Detayları & Diğer
                      </h4>
                      <span className="text-[10px] text-slate-500">
                        (İsteğe bağlı, dosyanızda varsa eşleştirin)
                      </span>
                    </div>
                  </div>

                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {renderFieldRow("companyTitle", "Şirket / Firma Ünvanı", "Kurumsal müşteriler için resmi ünvan", false, "stacked")}
                    {renderFieldRow("email", "E-Posta Adresi", "Örn: ornek@firma.com", false, "stacked")}
                    {renderFieldRow("taxNumber", "Vergi No (VKN / TCKN)", "10 veya 11 haneli kimlik/vergi no", false, "stacked")}
                    {renderFieldRow("taxOffice", "Vergi Dairesi", "Örn: Kadıköy V.D.", false, "stacked")}
                    <div className="sm:col-span-2">
                      {renderFieldRow("notes", "Müşteri / Araç Notu", "Özel servis notları veya ek açıklamalar", false, "horizontal")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: WORKSAUTO INTERACTIVE SPREADSHEET GRID (CANLI EXCEL TABLOSU) */}
          {currentStep === 4 && (() => {
            const filteredPreviewRows = transformedRows
              .map((row, originalIndex) => ({ row, originalIndex }))
              .filter(({ row }) => {
                if (previewFilter === "valid" && !row._isValid) return false
                if (previewFilter === "invalid" && row._isValid) return false
                if (previewSearch.trim()) {
                  const q = previewSearch.toLowerCase()
                  const matchesName = `${row.firstName} ${row.lastName}`.toLowerCase().includes(q)
                  const matchesCompany = (row.companyTitle || "").toLowerCase().includes(q)
                  const matchesPhone = (row.phone || "").toLowerCase().includes(q)
                  const matchesPlate = (row.plate || "").toLowerCase().includes(q)
                  const matchesBrand = (row.brand || "").toLowerCase().includes(q)
                  const matchesModel = (row.model || "").toLowerCase().includes(q)
                  return matchesName || matchesCompany || matchesPhone || matchesPlate || matchesBrand || matchesModel
                }
                return true
              })

            return (
              <div className="space-y-3.5">
                {/* Header Info & Skip Invalid Toggle */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <FileSpreadsheet size={18} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>WorksAuto Canlı Excel Önizleme Tablosu</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Verileriniz kurumsal şablon ızgarasına döküldü. İstediğiniz hücreye tıklayarak doğrudan düzenleyebilirsiniz.
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none shrink-0 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                    <input
                      type="checkbox"
                      checked={skipInvalid}
                      onChange={(e) => setSkipInvalid(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                    />
                    <span>Hatalı satırları atla ve aktar</span>
                  </label>
                </div>

                {/* Toolbar: Filter Tabs, Search & Add Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60">
                    <button
                      type="button"
                      onClick={() => setPreviewFilter("all")}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                        previewFilter === "all"
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      )}
                    >
                      Tümü ({transformedRows.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewFilter("valid")}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                        previewFilter === "valid"
                          ? "bg-emerald-500 text-white shadow-xs"
                          : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                      )}
                    >
                      <CheckCircle2 size={12} />
                      <span>Geçerli ({validRowCount})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewFilter("invalid")}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                        previewFilter === "invalid"
                          ? "bg-rose-500 text-white shadow-xs"
                          : "text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                      )}
                    >
                      <AlertCircle size={12} />
                      <span>Hatalı ({invalidRowCount})</span>
                    </button>
                  </div>

                  {/* Search & Actions */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:w-60">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Tabloda ara (isim, tel, plaka)..."
                        value={previewSearch}
                        onChange={(e) => setPreviewSearch(e.target.value)}
                        className="w-full h-8 pl-8 pr-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddRow}
                      className="h-8 px-2.5 text-xs font-semibold gap-1 bg-white dark:bg-slate-900 cursor-pointer shrink-0"
                      title="Yeni boş müşteri satırı ekle"
                    >
                      <Plus size={13} />
                      <span>Satır Ekle</span>
                    </Button>
                  </div>
                </div>

                {/* The Spreadsheet Grid */}
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/50 shadow-xs">
                  <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="sticky top-0 z-10 bg-slate-100/95 dark:bg-slate-950/95 backdrop-blur-xs border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          <th className="px-2.5 py-2 text-center w-12 shrink-0 border-r border-slate-200/60 dark:border-slate-800">
                            #
                          </th>
                          <th className="px-2 py-2 text-center w-14 shrink-0 border-r border-slate-200/60 dark:border-slate-800">
                            Durum
                          </th>
                          <th className="px-2.5 py-2 min-w-[125px] border-r border-slate-200/60 dark:border-slate-800">
                            Müşteri Adı
                          </th>
                          <th className="px-2.5 py-2 min-w-[125px] border-r border-slate-200/60 dark:border-slate-800">
                            Müşteri Soyadı
                          </th>
                          <th className="px-2.5 py-2 min-w-[150px] border-r border-slate-200/60 dark:border-slate-800">
                            Firma Ünvanı
                          </th>
                          <th className="px-2.5 py-2 min-w-[130px] border-r border-slate-200/60 dark:border-slate-800">
                            Vergi No (VKN)
                          </th>
                          <th className="px-2.5 py-2 min-w-[135px] border-r border-slate-200/60 dark:border-slate-800">
                            Telefon *
                          </th>
                          <th className="px-2.5 py-2 min-w-[120px] border-r border-slate-200/60 dark:border-slate-800">
                            Araç Plakası *
                          </th>
                          <th className="px-2.5 py-2 min-w-[110px] border-r border-slate-200/60 dark:border-slate-800">
                            Marka
                          </th>
                          <th className="px-2.5 py-2 min-w-[110px] border-r border-slate-200/60 dark:border-slate-800">
                            Model
                          </th>
                          <th className="px-2.5 py-2 min-w-[75px] border-r border-slate-200/60 dark:border-slate-800">
                            Yıl
                          </th>
                          <th className="px-2.5 py-2 min-w-[85px] border-r border-slate-200/60 dark:border-slate-800">
                            KM
                          </th>
                          <th className="px-2.5 py-2 min-w-[95px] border-r border-slate-200/60 dark:border-slate-800">
                            Yakıt
                          </th>
                          <th className="px-2.5 py-2 min-w-[90px] border-r border-slate-200/60 dark:border-slate-800">
                            Vites
                          </th>
                          <th className="px-2 py-2 text-center w-10 shrink-0">
                            Sil
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {filteredPreviewRows.length === 0 ? (
                          <tr>
                            <td colSpan={15} className="py-12 text-center text-slate-400">
                              Arama veya filtre kriterine uygun satır bulunamadı.
                            </td>
                          </tr>
                        ) : (
                          filteredPreviewRows.map(({ row, originalIndex }) => {
                            const isMissingPhone = !row.phone?.trim() && !row.companyTitle?.trim()
                            const isMissingPlate = !row.plate?.trim()

                            return (
                              <tr
                                key={originalIndex}
                                className={cn(
                                  "transition-colors group",
                                  row._isValid
                                    ? "hover:bg-sky-50/40 dark:hover:bg-sky-950/20"
                                    : "bg-rose-50/25 dark:bg-rose-950/15 hover:bg-rose-50/40 dark:hover:bg-rose-950/30"
                                )}
                              >
                                {/* Satır No */}
                                <td className="px-2 py-1.5 text-center font-mono text-[11px] text-slate-400 border-r border-slate-200/60 dark:border-slate-800">
                                  {originalIndex + 1}
                                </td>

                                {/* Durum Rozeti */}
                                <td className="px-2 py-1.5 text-center border-r border-slate-200/60 dark:border-slate-800">
                                  {row._isValid ? (
                                    <span title="Aktarıma Hazır" className="inline-flex items-center justify-center text-emerald-500">
                                      <CheckCircle2 size={15} />
                                    </span>
                                  ) : (
                                    <span title={row._errorMsg || "Hatalı Satır"} className="inline-flex items-center justify-center text-rose-500">
                                      <AlertCircle size={15} />
                                    </span>
                                  )}
                                </td>

                                {/* Müşteri Adı */}
                                <td className="p-1 border-r border-slate-200/50 dark:border-slate-800/50">
                                  <input
                                    type="text"
                                    value={row.firstName || ""}
                                    onChange={(e) => handleUpdateRowField(originalIndex, "firstName", e.target.value)}
                                    placeholder="Adı"
                                    className="w-full h-7 px-2 rounded-md bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-sky-500 text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none transition-all"
                                  />
                                </td>

                                {/* Müşteri Soyadı */}
                                <td className="p-1 border-r border-slate-200/50 dark:border-slate-800/50">
                                  <input
                                    type="text"
                                    value={row.lastName || ""}
                                    onChange={(e) => handleUpdateRowField(originalIndex, "lastName", e.target.value)}
                                    placeholder="Soyadı"
                                    className="w-full h-7 px-2 rounded-md bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-sky-500 text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none transition-all"
                                  />
                                </td>

                                {/* Firma Ünvanı */}
                                <td className="p-1 border-r border-slate-200/50 dark:border-slate-800/50">
                                  <input
                                    type="text"
                                    value={row.companyTitle || ""}
                                    onChange={(e) => handleUpdateRowField(originalIndex, "companyTitle", e.target.value)}
                                    placeholder="Firma Ünvanı (Opsiyonel)"
                                    className="w-full h-7 px-2 rounded-md bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-sky-500 text-xs text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                                  />
                                </td>

                                {/* Vergi No (VKN) */}
                                <td className="p-1 border-r border-slate-200/50 dark:border-slate-800/50">
                                  <input
                                    type="text"
                                    value={row.taxNumber || ""}
                                    onChange={(e) => handleUpdateRowField(originalIndex, "taxNumber", e.target.value)}
                                    placeholder={row.companyTitle ? "VKN (Faturada Gerekir)" : "VKN (Opsiyonel)"}
                                    maxLength={11}
                                    className="w-full h-7 px-2 rounded-md bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-sky-500 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                                  />
                                </td>

                                {/* Telefon * (Zorunlu Alan Vurgusu) */}
                                <td className="p-1 border-r border-slate-200/50 dark:border-slate-800/50">
                                  <input
                                    type="text"
                                    value={row.phone || ""}
                                    onChange={(e) => handleUpdateRowField(originalIndex, "phone", e.target.value)}
                                    placeholder={isMissingPhone ? "Telefon Girin *" : "05XX XXX XX XX"}
                                    title={isMissingPhone ? "Zorunlu alan: Telefon veya firma ünvanı boş" : undefined}
                                    className={cn(
                                      "w-full h-7 px-2 rounded-md text-xs font-mono focus:outline-none transition-all",
                                      isMissingPhone
                                        ? "border border-rose-300 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold placeholder:text-rose-400 ring-1 ring-rose-400/20"
                                        : "bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-sky-500 text-slate-900 dark:text-slate-100 font-semibold"
                                    )}
                                  />
                                </td>

                                {/* Araç Plakası * (Zorunlu Alan Vurgusu) */}
                                <td className="p-1 border-r border-slate-200/50 dark:border-slate-800/50">
                                  <input
                                    type="text"
                                    value={row.plate || ""}
                                    onChange={(e) => handleUpdateRowField(originalIndex, "plate", e.target.value.toUpperCase())}
                                    placeholder={isMissingPlate ? "Plaka Girin *" : "34 ABC 123"}
                                    title={isMissingPlate ? "Zorunlu alan: Araç plakası boş" : undefined}
                                    className={cn(
                                      "w-full h-7 px-2 rounded-md text-xs font-bold uppercase tracking-wider focus:outline-none transition-all",
                                      isMissingPlate
                                        ? "border border-rose-300 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold placeholder:text-rose-400 ring-1 ring-rose-400/20"
                                        : "bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-sky-500 text-sky-700 dark:text-sky-300"
                                    )}
                                  />
                                </td>

                                {/* Marka */}
                                <td className="p-1 border-r border-slate-200/50 dark:border-slate-800/50">
                                  <input
                                    type="text"
                                    value={row.brand || ""}
                                    onChange={(e) => handleUpdateRowField(originalIndex, "brand", e.target.value)}
                                    placeholder="Marka"
                                    className="w-full h-7 px-2 rounded-md bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-sky-500 text-xs text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                                  />
                                </td>

                                {/* Model */}
                                <td className="p-1 border-r border-slate-200/50 dark:border-slate-800/50">
                                  <input
                                    type="text"
                                    value={row.model || ""}
                                    onChange={(e) => handleUpdateRowField(originalIndex, "model", e.target.value)}
                                    placeholder="Model"
                                    className="w-full h-7 px-2 rounded-md bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-sky-500 text-xs text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                                  />
                                </td>

                                {/* Yıl */}
                                <td className="p-1 border-r border-slate-200/50 dark:border-slate-800/50">
                                  <input
                                    type="number"
                                    value={row.year || ""}
                                    onChange={(e) => handleUpdateRowField(originalIndex, "year", e.target.value ? Number(e.target.value) : undefined)}
                                    placeholder="Yıl"
                                    className="w-full h-7 px-1.5 rounded-md bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-sky-500 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                                  />
                                </td>

                                {/* KM */}
                                <td className="p-1 border-r border-slate-200/50 dark:border-slate-800/50">
                                  <input
                                    type="number"
                                    value={row.currentKm || ""}
                                    onChange={(e) => handleUpdateRowField(originalIndex, "currentKm", e.target.value ? Number(e.target.value) : undefined)}
                                    placeholder="KM"
                                    className="w-full h-7 px-1.5 rounded-md bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-sky-500 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                                  />
                                </td>

                                {/* Yakıt */}
                                <td className="p-1 border-r border-slate-200/50 dark:border-slate-800/50">
                                  <input
                                    type="text"
                                    value={row.fuelType || ""}
                                    onChange={(e) => handleUpdateRowField(originalIndex, "fuelType", e.target.value)}
                                    placeholder="Yakıt"
                                    className="w-full h-7 px-2 rounded-md bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-sky-500 text-xs text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                                  />
                                </td>

                                {/* Vites */}
                                <td className="p-1 border-r border-slate-200/50 dark:border-slate-800/50">
                                  <input
                                    type="text"
                                    value={row.transmission || ""}
                                    onChange={(e) => handleUpdateRowField(originalIndex, "transmission", e.target.value)}
                                    placeholder="Vites"
                                    className="w-full h-7 px-2 rounded-md bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-sky-500 text-xs text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                                  />
                                </td>

                                {/* Sil Butonu */}
                                <td className="px-2 py-1.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRow(originalIndex)}
                                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                    title="Bu satırı tablodan çıkar"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* STEP 5: IMPORT EXECUTION & RESULTS */}
          {currentStep === 5 && importResult && (
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
                    +{importResult.importedCustomersCount || 0}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                  <p className="text-[10px] font-semibold text-slate-400">Yeni Araç</p>
                  <p className="text-xl font-bold text-sky-600 dark:text-sky-400">
                    +{importResult.importedVehiclesCount || 0}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                  <p className="text-[10px] font-semibold text-slate-400">Mevcut Kayıt</p>
                  <p className="text-xl font-bold text-slate-700 dark:text-slate-300">
                    {(importResult.existingCustomersCount || 0) + (importResult.existingVehiclesCount || 0)}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                  <p className="text-[10px] font-semibold text-slate-400">Toplam Satır</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {importResult.totalRows || 0}
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
                <span>Başka Dosya Seç</span>
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
                <span>Başlık Satırını Değiştir</span>
              </Button>
            )}
            {currentStep === 4 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(3)}
                className="h-10 px-4 text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Eşleştirmeyi Değiştir</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 5 ? (
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
                    disabled={allRawRows.length === 0 || isLoadingFile}
                    onClick={() => setCurrentStep(2)}
                    className="h-10 px-5 text-xs font-semibold gap-1.5 cursor-pointer shadow-md shadow-sky-500/20"
                  >
                    <span>Devam Et: Satır Seçimi</span>
                    <ArrowRight size={14} />
                  </Button>
                )}

                {currentStep === 2 && (
                  <Button
                    type="button"
                    disabled={analyzeRowSuitability(allRawRows[selectedHeaderRowIndex] || []).isTooEmpty}
                    onClick={handleConfirmHeaderRow}
                    className="h-10 px-5 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-md shadow-emerald-500/20"
                  >
                    <span>Satırı Onayla & Sütunları Eşleştir</span>
                    <ArrowRight size={14} />
                  </Button>
                )}

                {currentStep === 3 && (
                  <Button
                    type="button"
                    disabled={!isReadyToProceed}
                    onClick={handleProceedToPreview}
                    className={cn(
                      "h-10 px-5 text-xs font-semibold gap-1.5 cursor-pointer transition-all",
                      isReadyToProceed
                        ? "bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-500/20"
                        : "opacity-50 cursor-not-allowed bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                    )}
                  >
                    <span>Önizleme ve Doğrulama</span>
                    <ArrowRight size={14} />
                  </Button>
                )}

                {currentStep === 4 && (
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
