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
  Check,
  Trash2,
  ShieldCheck,
  Table as TableIcon,
  Search,
  Plus,
  Settings2,
  ChevronDown,
  Zap,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/sonner"
import {
  guessTargetField,
  readExcelFile,
  downloadSampleTemplate,
  parseFullName,
  getColumnSampleValues,
  normalizePhoneNumber,
  parseRowsFromHeaderIndex,
  checkMappingSufficiency,
} from "../utils/excel-helpers"
import {
  useBatchImportCustomers,
  type BatchImportCustomerItem,
  type BatchImportResult,
} from "@/features/customers/api/use-customers"
import { cn } from "@/lib/utils"

export type ImportModalStep =
  | "upload"
  | "simple_ready"
  | "advanced_mapping"
  | "preview_table"
  | "result"

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
  defaultMode: _defaultMode = "all",
}: ExcelImportModalProps) {
  const [mounted, setMounted] = React.useState(false)
  const batchImportMutation = useBatchImportCustomers()

  // Workflow Step State
  const [currentStep, setCurrentStep] = React.useState<ImportModalStep>("upload")

  // File state
  const [fileName, setFileName] = React.useState("")
  const [allRawRows, setAllRawRows] = React.useState<unknown[][]>([])
  const [selectedHeaderRowIndex, setSelectedHeaderRowIndex] = React.useState<number>(0)
  const [fileHeaders, setFileHeaders] = React.useState<string[]>([])
  const [fileRows, setFileRows] = React.useState<Record<string, unknown>[]>([])
  const [isDragging, setIsDragging] = React.useState(false)
  const [isLoadingFile, setIsLoadingFile] = React.useState(false)

  // Mapping state: { [targetFieldKey]: excelHeader }
  const [mappings, setMappings] = React.useState<Record<string, string>>({})
  // Name format toggle: single column (fullName) vs split columns (firstName + lastName)
  const [nameMode, setNameMode] = React.useState<"single" | "split">("single")

  // Collapsible sections in advanced mode
  const [showHeaderPicker, setShowHeaderPicker] = React.useState(false)
  const [showOptionalFields, setShowOptionalFields] = React.useState(false)
  const [previewSource, setPreviewSource] = React.useState<"simple_ready" | "advanced_mapping">("advanced_mapping")

  // Transformed preview rows (user editable in preview step)
  const [transformedRows, setTransformedRows] = React.useState<
    (BatchImportCustomerItem & {
      _original: Record<string, unknown>
      _isValid: boolean
      _errorMsg?: string
    })[]
  >([])
  const [skipInvalid, setSkipInvalid] = React.useState(true)
  const [previewFilter, setPreviewFilter] = React.useState<"all" | "valid" | "invalid">("all")
  const [previewSearch, setPreviewSearch] = React.useState("")

  // Result state
  const [importResult, setImportResult] = React.useState<BatchImportResult | null>(null)
  // Duplicate record strategy: "skip" (preserve existing) | "update" (enrich/overwrite with Excel)
  const [duplicateStrategy, setDuplicateStrategy] = React.useState<"skip" | "update">("skip")

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Helper to generate transformed items from current mappings and rows
  const generateTransformedRows = React.useCallback(
    (
      rows: Record<string, unknown>[],
      activeMappings: Record<string, string>,
      activeNameMode: "single" | "split"
    ) => {
      return rows.map((row) => {
        const getVal = (targetKey: string): string => {
          const header = activeMappings[targetKey]
          if (!header) return ""
          const raw = row[header]
          return raw !== undefined && raw !== null ? String(raw).trim() : ""
        }

        let firstName = ""
        let lastName = ""

        if (activeNameMode === "single") {
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

        const phone = normalizePhoneNumber(getVal("phone"))
        const companyTitle = getVal("companyTitle")
        const email = getVal("email")
        const taxNumber = getVal("taxNumber")
        const taxOffice = getVal("taxOffice")
        const plate = getVal("plate").toUpperCase().replace(/\s+/g, "")
        const brand = getVal("brand")
        const model = getVal("model")
        const rawYear = getVal("year")
        const year: number | undefined = rawYear
          ? Number(rawYear.replace(/[^\d]/g, "")) || undefined
          : undefined
        const rawKm = getVal("kilometer")
        const currentKm: number | undefined = rawKm
          ? Number(rawKm.replace(/[^\d]/g, "")) || undefined
          : undefined
        const vin = getVal("vin").toUpperCase()
        const fuelType = getVal("fuelType")
        const transmission = getVal("transmission")
        const notes = getVal("notes")

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
    },
    []
  )

  // Reset when modal closes
  const handleClose = () => {
    setCurrentStep("upload")
    setFileName("")
    setAllRawRows([])
    setSelectedHeaderRowIndex(0)
    setFileHeaders([])
    setFileRows([])
    setMappings({})
    setNameMode("single")
    setShowHeaderPicker(false)
    setShowOptionalFields(false)
    setTransformedRows([])
    setPreviewFilter("all")
    setPreviewSearch("")
    setImportResult(null)
    onClose()
  }

  // Sütun başlıklarına göre akıllı eşleştirmeyi üretir
  const computeMappingForHeaders = (headers: string[]): {
    map: Record<string, string>
    mode: "single" | "split"
  } => {
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

    let detectedMode: "single" | "split" = "single"
    if (hasFirst && hasLast) {
      detectedMode = "split"
      delete initialMap.fullName
    } else {
      detectedMode = "single"
      delete initialMap.firstName
      delete initialMap.lastName
    }

    return { map: initialMap, mode: detectedMode }
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

      const { map: computedMap, mode: computedMode } = computeMappingForHeaders(parsed.headers)
      setMappings(computedMap)
      setNameMode(computedMode)

      const transformed = generateTransformedRows(parsed.rows, computedMap, computedMode)
      setTransformedRows(transformed)

      // Sufficiency check
      const sufficiency = checkMappingSufficiency(computedMap, computedMode)
      if (sufficiency.isSufficient) {
        toast.success("Excel dosyanız akıllı eşleştirme ile başarıyla çözümlendi!")
        setCurrentStep("simple_ready")
      } else {
        toast.info("Bazı zorunlu alanlar otomatik eşleştirilemedi. Lütfen sütunları onaylayın.")
        setCurrentStep("advanced_mapping")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Excel dosyası okunamadı."
      toast.error(msg)
    } finally {
      setIsLoadingFile(false)
    }
  }

  // Satır seçimi değiştirildiğinde
  const handleSelectHeaderRow = (rowIndex: number) => {
    setSelectedHeaderRowIndex(rowIndex)
    const parsed = parseRowsFromHeaderIndex(allRawRows, rowIndex)
    setFileHeaders(parsed.headers)
    setFileRows(parsed.rows)

    const { map: computedMap, mode: computedMode } = computeMappingForHeaders(parsed.headers)
    setMappings(computedMap)
    setNameMode(computedMode)

    const transformed = generateTransformedRows(parsed.rows, computedMap, computedMode)
    setTransformedRows(transformed)
    setShowHeaderPicker(false)
    toast.success(`Satır ${rowIndex + 1} başlık olarak seçildi ve sütunlar güncellendi.`)
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

  // Mapping -> Preview navigation
  const handleProceedToPreview = () => {
    const sufficiency = checkMappingSufficiency(mappings, nameMode)
    if (!sufficiency.isSufficient) {
      toast.warning(`Lütfen zorunlu alanları eşleştirin: ${sufficiency.missingRequired.join(", ")}`)
      return
    }

    const transformed = generateTransformedRows(fileRows, mappings, nameMode)
    setTransformedRows(transformed)
    setPreviewSource("advanced_mapping")
    setCurrentStep("preview_table")
  }

  // Update inline preview row with real-time cell validation
  const handleUpdateRowField = (
    idx: number,
    field: keyof BatchImportCustomerItem,
    value: BatchImportCustomerItem[keyof BatchImportCustomerItem]
  ) => {
    setTransformedRows((prev) => {
      const copy = [...prev]
      const updated = {
        ...copy[idx],
        [field]: value,
      }

      const hasCust = Boolean(
        updated.firstName?.trim() || updated.companyTitle?.trim() || updated.phone?.trim()
      )
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

      const res = await batchImportMutation.mutateAsync({
        items: payload,
        updateExisting: duplicateStrategy === "update",
      })
      setImportResult(res)
      setCurrentStep("result")
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error(err)
    }
  }

  if (!isOpen || !mounted) return null

  const validRowCount = transformedRows.filter((r) => r._isValid).length
  const invalidRowCount = transformedRows.length - validRowCount

  const sufficiency = checkMappingSufficiency(mappings, nameMode)
  const isReadyToProceed = sufficiency.isSufficient

  // Count how many optional fields have been mapped
  const optionalKeys = [
    "brand",
    "model",
    "year",
    "kilometer",
    "vin",
    "fuelType",
    "transmission",
    "companyTitle",
    "email",
    "taxNumber",
    "taxOffice",
    "notes",
  ]
  const mappedOptionalCount = optionalKeys.filter((k) => Boolean(mappings[k])).length

  // Quick sample values for simple-ready card
  const samplePlate = mappings.plate
    ? getColumnSampleValues(mappings.plate, fileRows, 1)[0]
    : ""
  const samplePhone = mappings.phone
    ? getColumnSampleValues(mappings.phone, fileRows, 1)[0]
    : mappings.companyTitle
    ? getColumnSampleValues(mappings.companyTitle, fileRows, 1)[0]
    : ""
  const sampleName =
    nameMode === "single"
      ? mappings.fullName
        ? getColumnSampleValues(mappings.fullName, fileRows, 1)[0]
        : ""
      : mappings.firstName
      ? `${getColumnSampleValues(mappings.firstName, fileRows, 1)[0] || ""} ${
          mappings.lastName ? getColumnSampleValues(mappings.lastName, fileRows, 1)[0] || "" : ""
        }`.trim()
      : ""

  // Ten-row preview table helper for header selection
  const previewRows = allRawRows.slice(0, 10)
  const previewColCount = Math.min(
    Math.max(
      ...previewRows.map((r) => (Array.isArray(r) ? r.length : 0)),
      fileHeaders.length,
      4
    ),
    10
  )
  const colLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]

  // Renderer for a clean mapping row
  const renderFieldRow = (
    fieldKey: string,
    label: string,
    description?: string,
    isRequired?: boolean
  ) => {
    const currentExcelHeader = mappings[fieldKey] || ""
    const sampleValues = currentExcelHeader
      ? getColumnSampleValues(currentExcelHeader, fileRows, 3)
      : []

    const tooltipText = [
      description,
      sampleValues.length > 0 ? `Canlı Örnekler: ${sampleValues.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join(" • ")

    return (
      <div
        key={fieldKey}
        className={cn(
          "px-4 py-2.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3",
          currentExcelHeader
            ? "bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-2xs"
            : isRequired
            ? "bg-rose-50/40 dark:bg-rose-950/15 border-rose-200/80 dark:border-rose-900/40"
            : "bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60"
        )}
      >
        {/* Sol: Alan Başlığı (Üzerine gelindiğinde açıklama & örnekler çıkar) */}
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-xs font-bold text-slate-900 dark:text-slate-100",
              tooltipText && "cursor-help underline decoration-dotted decoration-slate-400/50 underline-offset-4"
            )}
            title={tooltipText || label}
          >
            {label}
          </span>
        </div>

        {/* Sağ: Sütun Seçici (Üzerine gelindiğinde canlı örnekler çıkar) */}
        <div className="w-full sm:w-80 shrink-0">
          <select
            value={currentExcelHeader}
            title={
              sampleValues.length > 0
                ? `Dosyadaki Canlı Örnekler: ${sampleValues.join(", ")}`
                : currentExcelHeader
                ? "Bu sütunda örnek veri bulunamadı"
                : isRequired
                ? "Zorunlu alan - Lütfen Excel dosyanızdaki sütunu seçiniz"
                : "İsteğe bağlı alan"
            }
            onChange={(e) => {
              const val = e.target.value
              setMappings((prev) => {
                const next = { ...prev }
                if (val) {
                  next[fieldKey] = val
                } else {
                  delete next[fieldKey]
                }
                return next
              })
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
              -- Eşleştirilmedi / Boş Bırak --
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
        </div>
      </div>
    )
  }

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Excel ile Müşteri & Araç İçe Aktarma
                </h2>
                {currentStep === "simple_ready" && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <Zap size={11} />
                    Hızlı Mod
                  </span>
                )}
                {currentStep === "advanced_mapping" && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center gap-1">
                    <Settings2 size={11} />
                    Gelişmiş Eşleştirme
                  </span>
                )}
                {currentStep === "preview_table" && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                    <TableIcon size={11} />
                    Tablo Önizleme
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Excel listenizi yükleyin ve otomatik eşleştirme ile anında sisteme dahil edin.
              </p>
            </div>
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
          {currentStep === "upload" && (
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
                
                <div
                  className={cn(
                    "w-16 h-16 rounded-3xl flex items-center justify-center shadow-inner transition-transform",
                    isDragging
                      ? "bg-sky-500 text-white scale-110 shadow-lg shadow-sky-500/30"
                      : "bg-emerald-500/10 text-emerald-500"
                  )}
                >
                  <UploadCloud size={32} />
                </div>

                <div className="space-y-1 max-w-sm">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Excel Dosyasını Buraya Sürükleyin veya Seçin
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Desteklenen formatlar:{" "}
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      .xlsx, .xls, .csv
                    </span>
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoadingFile}
                  className="h-9 px-4 rounded-xl text-xs font-semibold mt-2 cursor-pointer"
                >
                  {isLoadingFile ? "Dosya Okunuyor..." : "Dosya Gözat"}
                </Button>
              </div>

              {/* Sample Template Download Card */}
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

          {/* STEP 2: SIMPLE FAST-TRACK READY CARD */}
          {currentStep === "simple_ready" && (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              {/* Celebratory Banner */}
              <div className="p-5 rounded-3xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/20 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Dosyanız Başarıyla Çözümlendi! 🎉
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                  Sistemimiz <strong>{fileName}</strong> dosyanızdaki sütunları otomatik eşleştirdi ve{" "}
                  <strong>{validRowCount}</strong> adet geçerli müşteri & araç kaydını aktarıma hazır hale getirdi.
                </p>
              </div>

              {/* Quick Summary Cards of the Matched Mandatory Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Plaka */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400">Araç Plakası</span>
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    Sütun: &ldquo;{mappings.plate}&rdquo;
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    Örnek: {samplePlate || "-"}
                  </p>
                </div>

                {/* Telefon */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400">İletişim / Tel</span>
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    Sütun: &ldquo;{mappings.phone || mappings.companyTitle}&rdquo;
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    Örnek: {samplePhone || "-"}
                  </p>
                </div>

                {/* Müşteri */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400">Müşteri Adı</span>
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    Sütun: &ldquo;
                    {nameMode === "single"
                      ? mappings.fullName || mappings.companyTitle
                      : `${mappings.firstName || ""} + ${mappings.lastName || ""}`}
                    &rdquo;
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    Örnek: {sampleName || "-"}
                  </p>
                </div>
              </div>

              {/* Secondary details badge if other fields were auto-mapped */}
              {mappedOptionalCount > 0 && (
                <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-700 dark:text-sky-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 size={14} className="text-sky-500" />
                    Ayrıca {mappedOptionalCount} ek alan (Marka, Model, Yıl, KM vb.) otomatik olarak eşleştirildi.
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep("advanced_mapping")}
                    className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    Gör & Düzenle
                  </button>
                </div>
              )}

              {/* Duplicate Strategy Option */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-3 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 gap-2.5 text-left">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <RefreshCw size={13} className="text-sky-500" />
                    Mevcut Kayıt Stratejisi
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Sistemde olan plaka veya telefon tespit edildiğinde:
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDuplicateStrategy("skip")}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                      duplicateStrategy === "skip"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/60 dark:border-slate-700/60 font-bold"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    )}
                  >
                    Mevcutu Koru
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuplicateStrategy("update")}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                      duplicateStrategy === "update"
                        ? "bg-amber-600 text-white shadow-sm font-bold"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    )}
                  >
                    Bilgileri Güncelle
                  </button>
                </div>
              </div>

              {/* Fast Action Container */}
              <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dosyanızı hemen aktarabilir veya aktarmadan önce canlı Excel tablosunda inceleyebilirsiniz.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                  <Button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={batchImportMutation.isPending || validRowCount === 0}
                    className="w-full sm:w-auto h-11 px-8 text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02]"
                  >
                    {batchImportMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>İçe Aktarılıyor...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        <span>Hemen İçe Aktar ({validRowCount} Kayıt)</span>
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPreviewSource("simple_ready")
                      setCurrentStep("preview_table")
                    }}
                    className="w-full sm:w-auto h-11 px-5 text-xs font-semibold gap-1.5 cursor-pointer bg-white dark:bg-slate-900"
                  >
                    <TableIcon size={15} className="text-sky-500" />
                    <span>Önizleme & Düzenleme</span>
                  </Button>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep("advanced_mapping")}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Settings2 size={13} className="text-slate-400" />
                    <span>Gelişmiş Eşleştirme Ayarlarına Git</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: REDESIGNED CLEAN UNIFIED MAPPING SCREEN */}
          {currentStep === "advanced_mapping" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Top Banner: File Summary & Header Row Controls */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                    <FileSpreadsheet size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {fileName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                        {fileRows.length} Satır • {fileHeaders.length} Sütun
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Başlık Satırı: <strong>{selectedHeaderRowIndex + 1}. Satır</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowHeaderPicker((prev) => !prev)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <TableIcon size={13} className="text-sky-500" />
                    <span>{showHeaderPicker ? "Tabloyu Gizle" : "Başlık Satırını Değiştir"}</span>
                    <ChevronDown
                      size={13}
                      className={cn("transition-transform duration-200", showHeaderPicker && "rotate-180")}
                    />
                  </button>
                </div>
              </div>

              {/* Collapsible Header Row Selector (Shown only if user clicks to change header row) */}
              {showHeaderPicker && (
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <TableIcon size={14} className="text-sky-500" />
                      Başlık Satırı Olarak Kullanmak İstediğiniz Satıra Tıklayın:
                    </span>
                    <span className="text-[10px] text-slate-400">İlk 10 satır listelenmiştir</span>
                  </div>

                  <div className="overflow-x-auto max-h-[220px] overflow-y-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 border-b border-slate-200 dark:border-slate-800 font-mono text-[10px]">
                          <th className="px-2 py-1.5 text-center w-14">Satır</th>
                          {colLetters.slice(0, previewColCount).map((l) => (
                            <th key={l} className="px-2 py-1.5 min-w-[100px]">
                              Sütun {l}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {previewRows.map((r, idx) => {
                          const isSelected = idx === selectedHeaderRowIndex
                          return (
                            <tr
                              key={idx}
                              onClick={() => handleSelectHeaderRow(idx)}
                              className={cn(
                                "cursor-pointer transition-colors text-xs",
                                isSelected
                                  ? "bg-emerald-500/15 dark:bg-emerald-950/40 font-bold text-emerald-900 dark:text-emerald-100"
                                  : "hover:bg-slate-100/70 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                              )}
                            >
                              <td className="px-2 py-1.5 text-center font-mono font-bold">
                                {isSelected ? (
                                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-500 text-white text-[10px]">
                                    ✓ {idx + 1}
                                  </span>
                                ) : (
                                  idx + 1
                                )}
                              </td>
                              {Array.from({ length: previewColCount }).map((_, cIdx) => (
                                <td key={cIdx} className="px-2 py-1.5 font-mono text-[11px] truncate max-w-[130px]">
                                  {Array.isArray(r) && r[cIdx] !== undefined ? String(r[cIdx]) : "-"}
                                </td>
                              ))}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sufficiency Status Alert */}
              {!isReadyToProceed ? (
                <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                  <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Eksik Zorunlu Alanlar Bulunuyor</span>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                      İlerlemek için lütfen aşağıdaki kırmızı ile işaretlenmiş alanları dosyanızdaki uygun sütunla eşleştirin:{" "}
                      <strong>{sufficiency.missingRequired.join(", ")}</strong>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 flex items-center justify-between gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                    <span className="font-bold">
                      Tüm zorunlu alanlar eşleştirildi! Dilerseniz doğrudan hızlı kuruluma dönebilir veya önizlemeye geçebilirsiniz.
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep("simple_ready")}
                    className="h-7 px-2.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/20 shrink-0 cursor-pointer bg-white dark:bg-slate-900"
                  >
                    <Zap size={12} className="mr-1" />
                    Hızlı Kuruluma Dön
                  </Button>
                </div>
              )}

              {/* Duplicate Strategy Option in Advanced Mapping */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 gap-2.5 text-left">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <RefreshCw size={13} className="text-sky-500" />
                    Mükerrer Kayıt Stratejisi
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Sistemde zaten kayıtlı olan plaka veya telefon tespit edildiğinde ne yapılsın?
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDuplicateStrategy("skip")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                      duplicateStrategy === "skip"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/60 dark:border-slate-700/60 font-bold"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    )}
                  >
                    Mevcutu Koru (Atla)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuplicateStrategy("update")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                      duplicateStrategy === "update"
                        ? "bg-amber-600 text-white shadow-sm font-bold"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    )}
                  >
                    Bilgileri Güncelle
                  </button>
                </div>
              </div>

              {/* CARD 1: ZORUNLU ALANLAR (TEMEL BİLGİLER - SADE & NET) */}
              <div className="rounded-3xl border border-rose-200/80 dark:border-rose-900/40 overflow-hidden bg-rose-50/20 dark:bg-rose-950/10">
                <div className="p-3.5 bg-rose-100/50 dark:bg-rose-900/30 border-b border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      1. Zorunlu Temel Bilgiler
                    </h4>
                  </div>
                  <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                    Aktarım için şarttır
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  {/* Araç Plakası */}
                  {renderFieldRow(
                    "plate",
                    "Araç Plakası",
                    "Resmi araç plaka sütunu (Örn: 34 ABC 123)",
                    true
                  )}

                  {/* Telefon Numarası */}
                  {renderFieldRow(
                    "phone",
                    "Telefon Numarası",
                    "Müşteri iletişim numarası (Örn: 0532 123 45 67)",
                    true
                  )}

                  {/* Müşteri İsim Yapısı & Seçici */}
                  <div className="px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-xs font-bold text-slate-900 dark:text-slate-100 cursor-help underline decoration-dotted decoration-slate-400/50 underline-offset-4"
                          title="Excel dosyanızda ad ve soyad tek sütunda mı yoksa iki ayrı sütunda mı yer alıyor?"
                        >
                          Müşteri İsim Formatı
                        </span>
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
                              ? "bg-sky-500 text-white shadow-xs"
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
                              ? "bg-sky-500 text-white shadow-xs"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                          )}
                        >
                          Ayrı Sütunlar (Ad + Soyad)
                        </button>
                      </div>
                    </div>

                    {nameMode === "single" ? (
                      renderFieldRow(
                        "fullName",
                        "Müşteri Adı Soyadı",
                        "Örn: Ahmet Yılmaz veya Fatma Zehra Kaya Yılmaz (Akıllı isim ayrıştırma uygulanır)",
                        true
                      )
                    ) : (
                      <div className="space-y-2 pt-1">
                        {renderFieldRow("firstName", "Müşteri Adı", "Örn: Ahmet veya Fatma", true)}
                        {renderFieldRow("lastName", "Müşteri Soyadı", "Örn: Yılmaz veya Kaya Yılmaz", true)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CARD 2: İSTEĞE BAĞLI ALANLAR (ACCORDION / AÇILIR-KAPANIR) */}
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-900/40">
                <button
                  type="button"
                  onClick={() => setShowOptionalFields((prev) => !prev)}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Car size={16} className="text-sky-500" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        2. İsteğe Bağlı Ek Bilgiler (Araç & Kurumsal Detaylar)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Marka, Model, Yıl, KM, Şasi, Yakıt, Vites, Vergi No, Notlar ({mappedOptionalCount} alan eşleşti)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>{showOptionalFields ? "Gizle" : "Genişlet"}</span>
                    <ChevronDown
                      size={15}
                      className={cn("transition-transform duration-200", showOptionalFields && "rotate-180")}
                    />
                  </div>
                </button>

                {showOptionalFields && (
                  <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 gap-2.5">
                      {renderFieldRow("brand", "Araç Markası", "Örn: Renault, Fiat, Volkswagen")}
                      {renderFieldRow("model", "Araç Modeli", "Örn: Megane, Egea, Passat")}
                      {renderFieldRow("year", "Model Yılı", "Örn: 2022, 2020")}
                      {renderFieldRow("kilometer", "Güncel KM", "Örn: 85000")}
                      {renderFieldRow("vin", "Şasi Numarası (VIN)", "17 haneli şasi no")}
                      {renderFieldRow("fuelType", "Yakıt Tipi", "Benzin, Dizel, LPG, Hibrit, Elektrik")}
                      {renderFieldRow("transmission", "Vites Türü", "Manuel, Otomatik")}
                      {renderFieldRow("companyTitle", "Şirket / Firma Ünvanı", "Kurumsal müşteriler için")}
                      {renderFieldRow("email", "E-Posta Adresi", "İletişim e-posta")}
                      {renderFieldRow("taxNumber", "Vergi Kimlik No (VKN / TCKN)", "Vergi veya kimlik no")}
                      {renderFieldRow("taxOffice", "Vergi Dairesi", "Vergi dairesi adı")}
                      {renderFieldRow("notes", "Müşteri / Servis Notu", "Özel notlar ve açıklamalar")}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* STEP 4: INTERACTIVE SPREADSHEET GRID */}
          {currentStep === "preview_table" && (() => {
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
              <div className="space-y-3.5 animate-in fade-in duration-200">
                {/* Header Info & Skip Invalid Toggle */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <FileSpreadsheet size={18} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        WorksAuto Canlı Excel Önizleme Tablosu
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Hücrelere tıklayarak doğrudan düzenleme yapabilir veya hatalı satırları çıkarabilirsiniz.
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none shrink-0 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
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
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs"
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
                          ? "bg-emerald-500 text-white shadow-2xs"
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
                          ? "bg-rose-500 text-white shadow-2xs"
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
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/50 shadow-2xs">
                  <div className="overflow-x-auto max-h-[46vh] overflow-y-auto">
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
                            Telefon
                          </th>
                          <th className="px-2.5 py-2 min-w-[110px] border-r border-slate-200/60 dark:border-slate-800">
                            Plaka
                          </th>
                          <th className="px-2.5 py-2 min-w-[110px] border-r border-slate-200/60 dark:border-slate-800">
                            Marka
                          </th>
                          <th className="px-2.5 py-2 min-w-[110px] border-r border-slate-200/60 dark:border-slate-800">
                            Model
                          </th>
                          <th className="px-2.5 py-2 min-w-[80px] border-r border-slate-200/60 dark:border-slate-800">
                            Yıl
                          </th>
                          <th className="px-2.5 py-2 min-w-[90px] border-r border-slate-200/60 dark:border-slate-800">
                            KM
                          </th>
                          <th className="px-2.5 py-2 min-w-[100px] border-r border-slate-200/60 dark:border-slate-800">
                            Yakıt
                          </th>
                          <th className="px-2.5 py-2 min-w-[90px] border-r border-slate-200/60 dark:border-slate-800">
                            Vites
                          </th>
                          <th className="px-2 py-2 text-center w-12 shrink-0">
                            İşlem
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredPreviewRows.length === 0 ? (
                          <tr>
                            <td colSpan={14} className="py-8 text-center text-slate-400">
                              Kayıt bulunamadı.
                            </td>
                          </tr>
                        ) : (
                          filteredPreviewRows.map(({ row, originalIndex }) => (
                            <tr
                              key={originalIndex}
                              className={cn(
                                "hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors",
                                !row._isValid && "bg-rose-50/20 dark:bg-rose-950/10"
                              )}
                            >
                              <td className="px-2.5 py-2 text-center font-mono text-[11px] text-slate-400 border-r border-slate-200/60 dark:border-slate-800">
                                {originalIndex + 1}
                              </td>
                              <td className="px-2 py-2 text-center border-r border-slate-200/60 dark:border-slate-800">
                                {row._isValid ? (
                                  <span className="inline-flex p-0.5 rounded-full bg-emerald-500/10 text-emerald-600" title="Geçerli">
                                    <CheckCircle2 size={13} />
                                  </span>
                                ) : (
                                  <span className="inline-flex p-0.5 rounded-full bg-rose-500/10 text-rose-600" title={row._errorMsg}>
                                    <AlertCircle size={13} />
                                  </span>
                                )}
                              </td>
                              <td className="p-1 border-r border-slate-200/60 dark:border-slate-800">
                                <input
                                  type="text"
                                  value={row.firstName || ""}
                                  onChange={(e) => handleUpdateRowField(originalIndex, "firstName", e.target.value)}
                                  className="w-full h-7 px-2 rounded-md bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-sky-500 text-xs text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                                />
                              </td>
                              <td className="p-1 border-r border-slate-200/60 dark:border-slate-800">
                                <input
                                  type="text"
                                  value={row.lastName || ""}
                                  onChange={(e) => handleUpdateRowField(originalIndex, "lastName", e.target.value)}
                                  className="w-full h-7 px-2 rounded-md bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-sky-500 text-xs text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                                />
                              </td>
                              <td className="p-1 border-r border-slate-200/60 dark:border-slate-800">
                                <input
                                  type="text"
                                  value={row.companyTitle || ""}
                                  onChange={(e) => handleUpdateRowField(originalIndex, "companyTitle", e.target.value)}
                                  className="w-full h-7 px-2 rounded-md bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-sky-500 text-xs text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                                />
                              </td>
                              <td className="p-1 border-r border-slate-200/60 dark:border-slate-800">
                                <input
                                  type="text"
                                  value={row.phone || ""}
                                  onChange={(e) => handleUpdateRowField(originalIndex, "phone", e.target.value)}
                                  className="w-full h-7 px-2 rounded-md bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-sky-500 text-xs text-slate-900 dark:text-slate-100 focus:outline-none transition-all font-mono"
                                />
                              </td>
                              <td className="p-1 border-r border-slate-200/60 dark:border-slate-800">
                                <input
                                  type="text"
                                  value={row.plate || ""}
                                  onChange={(e) => handleUpdateRowField(originalIndex, "plate", e.target.value.toUpperCase())}
                                  className="w-full h-7 px-2 rounded-md bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-sky-500 text-xs text-slate-900 dark:text-slate-100 focus:outline-none transition-all font-mono font-bold"
                                />
                              </td>
                              <td className="p-1 border-r border-slate-200/60 dark:border-slate-800">
                                <input
                                  type="text"
                                  value={row.brand || ""}
                                  onChange={(e) => handleUpdateRowField(originalIndex, "brand", e.target.value)}
                                  className="w-full h-7 px-2 rounded-md bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-sky-500 text-xs text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                                />
                              </td>
                              <td className="p-1 border-r border-slate-200/60 dark:border-slate-800">
                                <input
                                  type="text"
                                  value={row.model || ""}
                                  onChange={(e) => handleUpdateRowField(originalIndex, "model", e.target.value)}
                                  className="w-full h-7 px-2 rounded-md bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-sky-500 text-xs text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                                />
                              </td>
                              <td className="p-1 border-r border-slate-200/60 dark:border-slate-800">
                                <input
                                  type="number"
                                  value={row.year || ""}
                                  onChange={(e) => handleUpdateRowField(originalIndex, "year", e.target.value ? Number(e.target.value) : undefined)}
                                  className="w-full h-7 px-2 rounded-md bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-sky-500 text-xs text-slate-900 dark:text-slate-100 focus:outline-none transition-all font-mono"
                                />
                              </td>
                              <td className="p-1 border-r border-slate-200/60 dark:border-slate-800">
                                <input
                                  type="number"
                                  value={row.currentKm || ""}
                                  onChange={(e) => handleUpdateRowField(originalIndex, "currentKm", e.target.value ? Number(e.target.value) : undefined)}
                                  className="w-full h-7 px-2 rounded-md bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-sky-500 text-xs text-slate-900 dark:text-slate-100 focus:outline-none transition-all font-mono"
                                />
                              </td>
                              <td className="p-1 border-r border-slate-200/60 dark:border-slate-800">
                                <input
                                  type="text"
                                  value={row.fuelType || ""}
                                  onChange={(e) => handleUpdateRowField(originalIndex, "fuelType", e.target.value)}
                                  className="w-full h-7 px-2 rounded-md bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-sky-500 text-xs text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                                />
                              </td>
                              <td className="p-1 border-r border-slate-200/60 dark:border-slate-800">
                                <input
                                  type="text"
                                  value={row.transmission || ""}
                                  onChange={(e) => handleUpdateRowField(originalIndex, "transmission", e.target.value)}
                                  className="w-full h-7 px-2 rounded-md bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-sky-500 text-xs text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                                />
                              </td>
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
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* STEP 5: RESULTS */}
          {currentStep === "result" && importResult && (
            <div className="py-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
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
                  <p className="text-[10px] font-semibold text-slate-400">
                    {((importResult.updatedCustomersCount || 0) + (importResult.updatedVehiclesCount || 0)) > 0
                      ? "Güncellenen Kayıt"
                      : "Mevcut Kayıt"}
                  </p>
                  <p
                    className={cn(
                      "text-xl font-bold",
                      ((importResult.updatedCustomersCount || 0) + (importResult.updatedVehiclesCount || 0)) > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {((importResult.updatedCustomersCount || 0) + (importResult.updatedVehiclesCount || 0)) > 0
                      ? (importResult.updatedCustomersCount || 0) + (importResult.updatedVehiclesCount || 0)
                      : (importResult.existingCustomersCount || 0) + (importResult.existingVehiclesCount || 0)}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                  <p className="text-[10px] font-semibold text-slate-400">Toplam Satır</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {importResult.totalRows || 0}
                  </p>
                </div>
              </div>

              {((importResult.updatedCustomersCount || 0) + (importResult.updatedVehiclesCount || 0)) > 0 && (
                <div className="max-w-xl mx-auto p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center text-xs text-amber-800 dark:text-amber-300">
                  🔄 Seçtiğiniz mükerrer kayıt stratejisi doğrultusunda{" "}
                  <strong>{(importResult.updatedCustomersCount || 0) + (importResult.updatedVehiclesCount || 0)}</strong> adet
                  mevcut araç/müşteri kaydı Excel tablosundaki güncel bilgilerle yenilendi.
                </div>
              )}

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="max-w-md mx-auto p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left space-y-1 text-xs text-amber-700 dark:text-amber-300">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertCircle size={14} />
                    <span>{importResult.errors.length} satır işlenirken uyarı alındı:</span>
                  </p>
                  <ul className="list-disc list-inside text-[11px] space-y-0.5">
                    {importResult.errors.slice(0, 3).map((e, i: number) => (
                      <li key={i}>
                        Satır {e.row}: {e.reason}
                      </li>
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
            {currentStep === "simple_ready" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep("upload")}
                className="h-10 px-4 text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Başka Dosya Seç</span>
              </Button>
            )}

            {currentStep === "advanced_mapping" && (
              <div className="flex items-center gap-2">
                {sufficiency.isSufficient ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep("simple_ready")}
                      className="h-10 px-4 text-xs font-bold gap-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer bg-white dark:bg-slate-900 shadow-2xs"
                    >
                      <ArrowLeft size={14} />
                      <span>Hızlı Kuruluma Dön</span>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setCurrentStep("upload")}
                      className="h-10 px-3 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                    >
                      <span>Başka Dosya Seç</span>
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep("upload")}
                    className="h-10 px-4 text-xs font-semibold gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Başka Dosya Seç</span>
                  </Button>
                )}
              </div>
            )}

            {currentStep === "preview_table" && (
              <div className="flex items-center gap-2">
                {previewSource === "simple_ready" && sufficiency.isSufficient ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep("simple_ready")}
                      className="h-10 px-4 text-xs font-bold gap-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer bg-white dark:bg-slate-900 shadow-2xs"
                    >
                      <ArrowLeft size={14} />
                      <span>Hızlı Kuruluma Dön</span>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setCurrentStep("advanced_mapping")}
                      className="h-10 px-3 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                    >
                      <Settings2 size={13} className="mr-1" />
                      <span>Eşleştirmeyi Değiştir</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep("advanced_mapping")}
                      className="h-10 px-4 text-xs font-semibold gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft size={14} />
                      <span>Eşleştirmeye Dön</span>
                    </Button>

                    {sufficiency.isSufficient && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setCurrentStep("simple_ready")}
                        className="h-10 px-3 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                      >
                        <Zap size={13} className="mr-1 text-emerald-500" />
                        <span>Hızlı Kuruluma Dön</span>
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep !== "result" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="h-10 px-4 text-xs font-semibold cursor-pointer"
                >
                  Vazgeç
                </Button>

                {currentStep === "advanced_mapping" && (
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

                {currentStep === "preview_table" && (
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
