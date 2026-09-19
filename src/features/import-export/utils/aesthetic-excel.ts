import ExcelJS from "exceljs"

/**
 * =========================================================================
 * ⚙️ KULLANICI LOGO AYARLARI (Buradaki değerleri dilediğiniz gibi değiştirin)
 * Dosya: worksauto-web/src/features/import-export/utils/aesthetic-excel.ts
 * =========================================================================
 */
export const LOGO_CONFIG = {
  width: 183,       // Logonun Piksel Genişliği
  height: 34,       // Logonun Piksel Yüksekliği
  colOffset: 0.4,   // Soldan Boşluk / Sütun Ofseti
  rowOffset: 0.62,  // Yukarıdan Boşluk / Satır Ofseti
  colAWidth: 30,    // Sütun A Genişliği
}

export interface ExportColumnDef {
  key: string
  label: string
  type?: "text" | "number" | "currency" | "phone" | "plate"
  width?: number
}

export interface CellLinkInfo {
  targetSheet: string
  targetCell: string
  tooltip?: string
}

export interface AestheticExcelSheetDef {
  sheetName: string
  title: string
  subtitle?: string
  columns: ExportColumnDef[]
  data: Record<string, unknown>[]
  linkResolver?: (
    rowItem: Record<string, unknown>,
    colKey: string,
    rowIndex: number
  ) => CellLinkInfo | undefined
}

export interface AestheticExcelOptions {
  title: string
  subtitle?: string
  sheetName?: string
  columns: ExportColumnDef[]
  data: Record<string, unknown>[]
  author?: string
  logoConfig?: typeof LOGO_CONFIG
  linkResolver?: (
    rowItem: Record<string, unknown>,
    colKey: string,
    rowIndex: number
  ) => CellLinkInfo | undefined
  secondarySheet?: AestheticExcelSheetDef
  sheets?: AestheticExcelSheetDef[]
}

/**
 * Sütun indeksini Excel harfine çevirir (1 -> A, 2 -> B, ..., 26 -> Z, 27 -> AA)
 */
export function getColumnLetter(colIndex: number): string {
  let temp = colIndex
  let letter = ""
  while (temp > 0) {
    const mod = (temp - 1) % 26
    letter = String.fromCharCode(65 + mod) + letter
    temp = Math.floor((temp - mod) / 26)
  }
  return letter || "A"
}

/**
 * Tekil bir çalışma sayfasını (Worksheet) kurumsal tasarım, logo, başlıklar ve köprülerle inşa eder.
 */
function buildWorksheet(
  workbook: ExcelJS.Workbook,
  sheetDef: AestheticExcelSheetDef,
  author: string,
  logoBuffer: ArrayBuffer | null,
  logoConfig = LOGO_CONFIG
) {
  const {
    sheetName,
    title,
    subtitle = "WorksAuto Servis ve Yönetim Sistemi Raporu",
    columns,
    data,
    linkResolver,
  } = sheetDef

  const colCount = Math.max(columns.length, 2)
  const isLandscape = columns.length > 5
  const summaryRowNum = 6 + data.length
  const lastColLetter = getColumnLetter(colCount)

  const worksheet = workbook.addWorksheet(sheetName, {
    views: [
      {
        showGridLines: true,
        state: "frozen",
        ySplit: 5, // Satır 1-5 kaydırmada sabit kalır
      },
    ],
    properties: { defaultRowHeight: 24 },
    pageSetup: {
      paperSize: 9, // A4
      orientation: isLandscape ? "landscape" : "portrait",
      fitToPage: true,
      fitToWidth: 1, // Tüm sütunları tam olarak 1 sayfa genişliğine sığdırır (sağdan taşma olmaz)
      fitToHeight: 0, // Satırlar dikeyde serbestçe sayfalara akar
      horizontalCentered: true, // Sayfada yatay ortalama
      verticalCentered: false,
      showGridLines: true,
      margins: {
        left: 0.3,
        right: 0.3,
        top: 0.4,
        bottom: 0.4,
        header: 0.2,
        footer: 0.2,
      },
      printTitlesRow: "1:5", // 1-5. satırları her sayfada tekrarla
      printArea: `A1:${lastColLetter}${summaryRowNum}`, // Tam veri alanını sınırla
    },
    headerFooter: {
      oddFooter: "&LWorksAuto Servis ve Yönetim Sistemi&R&P / &N",
    },
  })

  // 1. Marka ve Rapor Başlık Bloğu (Row 1-2)
  const row1 = worksheet.getRow(1)
  const row2 = worksheet.getRow(2)
  row1.height = 38
  row2.height = 26

  for (let r = 1; r <= 2; r++) {
    for (let c = 1; c <= colCount; c++) {
      worksheet.getCell(r, c).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0F172A" }, // Slate-900 Deep Navy
      }
    }
  }

  // Sadece Sütun A: Logo Alanı (A1:A2 birleşik)
  worksheet.mergeCells("A1:A2")
  const logoCell = worksheet.getCell("A1")

  if (logoBuffer) {
    const imageId = workbook.addImage({
      buffer: logoBuffer,
      extension: "png",
    })
    worksheet.addImage(imageId, {
      tl: { col: logoConfig.colOffset, row: logoConfig.rowOffset },
      ext: { width: logoConfig.width, height: logoConfig.height },
    })
    logoCell.value = ""
  } else {
    logoCell.value = "   WORKSAUTO"
    logoCell.font = { name: "Arial", size: 12, bold: true, color: { argb: "FF38BDF8" } }
    logoCell.alignment = { vertical: "middle", horizontal: "center" }
  }

  // Sütun B'den son sütuna kadar Başlık ve Alt Başlık
  worksheet.mergeCells(1, 2, 1, colCount)
  const titleCell = worksheet.getCell(1, 2)
  titleCell.value = title.toLocaleUpperCase("tr-TR")
  titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FFFFFFFF" } }
  titleCell.alignment = { vertical: "middle", horizontal: "center" }

  worksheet.mergeCells(2, 2, 2, colCount)
  const subCell = worksheet.getCell(2, 2)
  subCell.value = subtitle
  subCell.font = { name: "Arial", size: 11, color: { argb: "FF93C5FD" } }
  subCell.alignment = { vertical: "middle", horizontal: "center" }

  // 2. Row 3: Özel Bilgi Şeridi
  const metaRow = worksheet.getRow(3)
  metaRow.height = 24
  worksheet.mergeCells(3, 1, 3, colCount)
  const metaCell = worksheet.getCell("A3")
  const dateStr = new Date().toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
  metaCell.value = `   Rapor Tarihi: ${dateStr}   |   Toplam Kayıt: ${data.length} Adet   |   Oluşturan: ${author}`
  metaCell.font = { name: "Arial", size: 10, italic: true, color: { argb: "FFCBD5E1" } }
  metaCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E293B" },
  }
  metaCell.alignment = { vertical: "middle", horizontal: "left" }

  // 3. Row 4: Kurumsal Mavi Ayrım Çizgisi
  const accentRow = worksheet.getRow(4)
  accentRow.height = 5
  for (let c = 1; c <= colCount; c++) {
    const ac = worksheet.getCell(4, c)
    ac.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0284C7" }, // Sky-600
    }
  }

  // 4. Row 5: Tablo Sütun Başlıkları
  const tableHeaderRow = worksheet.getRow(5)
  tableHeaderRow.height = 30
  columns.forEach((col, idx) => {
    const cell = tableHeaderRow.getCell(idx + 1)
    cell.value = `  ${col.label}  `
    cell.font = { name: "Arial", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } }
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0284C7" },
    }
    cell.alignment = {
      vertical: "middle",
      horizontal:
        col.type === "currency" || col.type === "number"
          ? "right"
          : col.type === "plate" || col.type === "phone"
          ? "center"
          : "left",
    }
    cell.border = {
      top: { style: "thin", color: { argb: "FF0284C7" } },
      bottom: { style: "medium", color: { argb: "FF0369A1" } },
      left: { style: "thin", color: { argb: "FF0369A1" } },
      right: { style: "thin", color: { argb: "FF0369A1" } },
    }
  })

  // 5. Row 6+: Veri Satırları
  data.forEach((rowItem, rIdx) => {
    const rowNum = 6 + rIdx
    const row = worksheet.getRow(rowNum)

    let maxLineCount = 1
    columns.forEach((col) => {
      const v = rowItem[col.key]
      if (v !== undefined && v !== null) {
        const s = String(v)
        const explicitLines = s.split("\n").length
        const approxWrapped = Math.ceil(s.length / 32)
        const lines = Math.max(explicitLines, approxWrapped)
        if (lines > maxLineCount) maxLineCount = lines
      }
    })
    row.height = maxLineCount > 1 ? Math.min(maxLineCount * 17 + 6, 110) : 24

    const isEven = rIdx % 2 === 0
    const rowBgColor = isEven ? "FFFFFFFF" : "FFF8FAFC"

    columns.forEach((col, cIdx) => {
      const cell = row.getCell(cIdx + 1)
      let val = rowItem[col.key]

      if (val === undefined || val === null) {
        val = ""
      }

      const strVal = String(val)
      const isMultiLine = strVal.includes("\n") || (strVal.length > 30 && !["phone", "currency", "number", "plate"].includes(col.type || ""))

      // Hücre Köprüsü (Internal Sheet Hyperlink) Kontrolü
      const linkInfo = linkResolver ? linkResolver(rowItem, col.key, rIdx) : undefined

      if (linkInfo && strVal && strVal !== "-") {
        const escaped = strVal.replace(/"/g, '""')
        cell.value = {
          formula: `HYPERLINK("#'${linkInfo.targetSheet}'!${linkInfo.targetCell}", "${escaped}")`,
          result: strVal,
        }
        cell.alignment = {
          vertical: "middle",
          horizontal: col.type === "plate" ? "center" : "left",
          wrapText: isMultiLine,
        }
        cell.font = {
          name: "Arial",
          size: 10,
          bold: true,
          color: { argb: "FF0284C7" }, // Sky-600 Tıklanabilir Link Rengi (alt çizgisiz, temiz görünüm)
        }
      } else if (col.type === "currency") {
        const numVal = Number(val) || 0
        cell.value = numVal
        cell.numFmt = '#,##0.00 "₺"'
        cell.alignment = { vertical: "middle", horizontal: "right" }
        cell.font = {
          name: "Arial",
          size: 10,
          bold: numVal > 0,
          color: { argb: numVal > 0 ? "FFDC2626" : "FF16A34A" },
        }
      } else if (col.type === "number") {
        cell.value = Number(val) || 0
        cell.numFmt = "#,##0"
        cell.alignment = { vertical: "middle", horizontal: "right" }
        cell.font = { name: "Arial", size: 10, color: { argb: "FF1E293B" } }
      } else if (col.type === "plate") {
        cell.value = String(val).toLocaleUpperCase("tr-TR")
        cell.alignment = { vertical: "middle", horizontal: "center" }
        cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF0F172A" } }
      } else if (col.type === "phone") {
        cell.value = String(val)
        cell.alignment = { vertical: "middle", horizontal: "center" }
        cell.font = { name: "Arial", size: 10, color: { argb: "FF334155" } }
      } else {
        const safeStr = ["=", "+", "-", "@", "\t", "\r"].some((prefix) => strVal.trim().startsWith(prefix))
          ? `'${strVal}`
          : strVal
        cell.value = safeStr
        cell.alignment = {
          vertical: "middle",
          horizontal: "left",
          wrapText: isMultiLine,
        }
        cell.font = { name: "Arial", size: 10, color: { argb: "FF1E293B" } }
      }

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: rowBgColor },
      }
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      }
    })
  })

  // 6. Genel Toplam Satırı
  const summaryRow = worksheet.getRow(summaryRowNum)
  summaryRow.height = 26

  columns.forEach((col, cIdx) => {
    const cell = summaryRow.getCell(cIdx + 1)
    if (cIdx === 0) {
      cell.value = ` GENEL TOPLAM (${data.length} Kayıt)`
      cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF0F172A" } }
      cell.alignment = { vertical: "middle", horizontal: "left" }
    } else if (col.type === "currency") {
      const sum = data.reduce((acc, curr) => acc + (Number(curr[col.key]) || 0), 0)
      cell.value = sum
      cell.numFmt = '#,##0.00 "₺"'
      cell.font = { name: "Arial", size: 10.5, bold: true, color: { argb: "FFDC2626" } }
      cell.alignment = { vertical: "middle", horizontal: "right" }
    } else {
      cell.value = ""
    }

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF1F5F9" },
    }
    cell.border = {
      top: { style: "medium", color: { argb: "FF0F172A" } },
      bottom: { style: "double", color: { argb: "FF0F172A" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    }
  })

  // 7. Sütun Genişlikleri
  columns.forEach((col, cIdx) => {
    const headerLen = col.label.length
    let maxLen = headerLen

    data.forEach((item) => {
      const val = item[col.key]
      if (val !== undefined && val !== null) {
        const str =
          col.type === "currency"
            ? `${Number(val).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺`
            : String(val)
        if (str.length > maxLen) maxLen = str.length
      }
    })

    const column = worksheet.getColumn(cIdx + 1)
    const minColWidth = cIdx === 0 ? logoConfig.colAWidth : 16
    column.width = Math.min(Math.max(headerLen + 6, maxLen + 4, minColWidth), 45)
  })

  if (columns.length === 1) {
    worksheet.getColumn(2).width = 25
  }
}

/**
 * WorksAuto Kurumsal Tasarımlı Excel (.xlsx) Üreticisi
 * Dinamik sütun ve satır sayısına göre hem ekranda hem de PDF / Yazıcı çıktısında
 * taşma yapmayan (Fit to 1 Page Wide), A4 uyumlu çıktı üretir.
 * Çoklu sayfa ve sayfalar arası dahili köprü (Hyperlink) desteği içerir.
 */
export async function generateAestheticExcel(options: AestheticExcelOptions): Promise<Blob> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "WorksAuto"
  workbook.lastModifiedBy = options.author || "WorksAuto Yetkili"
  workbook.created = new Date()
  workbook.modified = new Date()

  let logoBuffer: ArrayBuffer | null = null
  try {
    const logoResp = await fetch("/brand/worksauto-logo-white.png")
    if (logoResp.ok) {
      logoBuffer = await logoResp.arrayBuffer()
    }
  } catch {
    // ignore
  }

  // Oluşturulacak sayfaları belirle
  let sheetsToBuild: AestheticExcelSheetDef[] = []
  if (options.sheets && options.sheets.length > 0) {
    sheetsToBuild = options.sheets
  } else {
    sheetsToBuild.push({
      sheetName: options.sheetName || "Rapor",
      title: options.title,
      subtitle: options.subtitle,
      columns: options.columns,
      data: options.data,
      linkResolver: options.linkResolver,
    })
    if (options.secondarySheet) {
      sheetsToBuild.push(options.secondarySheet)
    }
  }

  for (const sheetDef of sheetsToBuild) {
    buildWorksheet(
      workbook,
      sheetDef,
      options.author || "WorksAuto Yetkili",
      logoBuffer,
      options.logoConfig || LOGO_CONFIG
    )
  }

  // Blob olarak döndür
  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
}

/**
 * Tarayıcıda Doğrudan İndirme Tetikleme
 */
export function triggerDownloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Finansal ve Operasyonel Raporu Estetik Excel (.xlsx) Olarak İndirir
 */
export async function exportFinancialReportToExcel(
  report: {
    period: string
    startDate: string
    endDate: string
    summary: {
      totalRevenue: number
      totalLabourRevenue: number
      totalPartsRevenue: number
      totalPartsCost: number
      netProfit: number
      profitMargin: number
      cashCollected: number
      unpaidReceivables: number
      completedWorkOrdersCount: number
      averageOrderValue: number
      totalVehiclesServiced: number
    }
    recentCompletedOrders: Array<{
      workOrderNumber: string
      completedAt: string
      plate: string
      vehicle: string
      customerName: string
      labourTotal: number
      partsTotal: number
      partsCost: number
      grandTotal: number
      estimatedProfit: number
      profitMargin: number
    }>
  },
  tenantName: string = "WorksAuto"
) {
  const sDate = new Date(report.startDate).toLocaleDateString("tr-TR")
  const eDate = new Date(report.endDate).toLocaleDateString("tr-TR")
  const subtitle = `${tenantName} — Finansal ve Atölye Kârlılık İcmali (${sDate} - ${eDate})`

  const columns: ExportColumnDef[] = [
    { key: "workOrderNumber", label: "İş Emri No", width: 16 },
    { key: "completedAtFormatted", label: "Tamamlanma Tarihi", width: 18 },
    { key: "plate", label: "Plaka", type: "plate", width: 16 },
    { key: "vehicle", label: "Araç", width: 22 },
    { key: "customerName", label: "Müşteri", width: 24 },
    { key: "labourTotal", label: "İşçilik Tutarı (₺)", type: "currency", width: 18 },
    { key: "partsTotal", label: "Yedek Parça Tutarı (₺)", type: "currency", width: 20 },
    { key: "partsCost", label: "Parça Maliyeti (₺)", type: "currency", width: 18 },
    { key: "grandTotal", label: "Toplam Ciro (₺)", type: "currency", width: 18 },
    { key: "estimatedProfit", label: "Net Kâr (₺)", type: "currency", width: 18 },
    { key: "profitMarginFormatted", label: "Kâr Marjı", width: 14 },
  ]

  const data = report.recentCompletedOrders.map((row) => ({
    ...row,
    completedAtFormatted: new Date(row.completedAt).toLocaleDateString("tr-TR"),
    profitMarginFormatted: `%${row.profitMargin}`,
  }))

  const blob = await generateAestheticExcel({
    title: "FİNANSAL VE ATÖLYE KÂRLILIK RAPORU",
    subtitle,
    sheetName: "Finansal Rapor",
    columns,
    data,
    author: `${tenantName} Yönetimi`,
  })

  const fileName = `WorksAuto_Finansal_Rapor_${report.period}_${new Date().toISOString().slice(0, 10)}.xlsx`
  triggerDownloadBlob(blob, fileName)
}

