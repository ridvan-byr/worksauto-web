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

export interface AestheticExcelOptions {
  title: string
  subtitle?: string
  sheetName?: string
  columns: ExportColumnDef[]
  data: Record<string, any>[]
  author?: string
  logoConfig?: typeof LOGO_CONFIG
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
 * WorksAuto Kurumsal Tasarımlı Excel (.xlsx) Üreticisi
 * Dinamik sütun ve satır sayısına göre hem ekranda hem de PDF / Yazıcı çıktısında
 * taşma yapmayan (Fit to 1 Page Wide), A4 uyumlu çıktı üretir.
 */
export async function generateAestheticExcel(options: AestheticExcelOptions): Promise<Blob> {
  const {
    title,
    subtitle = "WorksAuto Servis ve Yönetim Sistemi Raporu",
    sheetName = "Rapor",
    columns,
    data,
    author = "WorksAuto Yetkili",
    logoConfig = LOGO_CONFIG,
  } = options

  const workbook = new ExcelJS.Workbook()
  workbook.creator = "WorksAuto"
  workbook.lastModifiedBy = author
  workbook.created = new Date()
  workbook.modified = new Date()

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
      printTitlesRow: "1:5", // 1-5. satırları (Logo, Başlık, Bilgi Şeridi ve Tablo Sütun Başlıkları) her sayfada tekrarla
      printArea: `A1:${lastColLetter}${summaryRowNum}`, // Tam veri alanını sınırla, boş hücre taşmalarını engelle
    },
    headerFooter: {
      oddFooter: "&LWorksAuto Servis ve Yönetim Sistemi&R&P / &N",
    },
  })

  // 1. Marka ve Rapor Başlık Bloğu (Row 1-2) - İlk baştaki gibi geniş ve büyük başlık
  const row1 = worksheet.getRow(1)
  const row2 = worksheet.getRow(2)
  row1.height = 38 // Geniş ve ferah başlık satırları
  row2.height = 26

  // Row 1 ve Row 2 tüm hücrelerine koyu lacivert zemin ata (#0F172A)
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
  logoCell.value = ""

  // Logoyu Sütun A içine LOGO_CONFIG ayarlarıyla yerleştir
  try {
    const logoResp = await fetch("/brand/worksauto-logo-white.png")
    if (logoResp.ok) {
      const logoBuffer = await logoResp.arrayBuffer()
      const imageId = workbook.addImage({
        buffer: logoBuffer,
        extension: "png",
      })

      worksheet.addImage(imageId, {
        tl: { col: logoConfig.colOffset, row: logoConfig.rowOffset },
        ext: { width: logoConfig.width, height: logoConfig.height },
      })
      logoCell.value = ""
    }
  } catch {
    logoCell.value = "   WORKSAUTO"
    logoCell.font = { name: "Calibri", size: 12, bold: true, color: { argb: "FF38BDF8" } }
    logoCell.alignment = { vertical: "middle", horizontal: "center" }
  }

  // Sütun B'den son sütuna kadar Başlık ve Alt Başlık (Geniş & Büyütülmüş)
  // Row 1 (B1 .. colCount) - Türkçe büyük İ ile büyük font
  worksheet.mergeCells(1, 2, 1, colCount)
  const titleCell = worksheet.getCell(1, 2)
  titleCell.value = title.toLocaleUpperCase("tr-TR")
  titleCell.font = { name: "Calibri", size: 16, bold: true, color: { argb: "FFFFFFFF" } }
  titleCell.alignment = { vertical: "middle", horizontal: "center" }

  // Row 2 (B2 .. colCount)
  worksheet.mergeCells(2, 2, 2, colCount)
  const subCell = worksheet.getCell(2, 2)
  subCell.value = subtitle
  subCell.font = { name: "Calibri", size: 11, color: { argb: "FF93C5FD" } } // Sky-300
  subCell.alignment = { vertical: "middle", horizontal: "center" }

  // 2. Row 3: Özel Bilgi Şeridi (A3 .. colCount, SOLA DAYALI)
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
  metaCell.font = { name: "Segoe UI", size: 10, italic: true, color: { argb: "FFCBD5E1" } } // Slate-300
  metaCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E293B" }, // Slate-800 Koyu Bant
  }
  metaCell.alignment = { vertical: "middle", horizontal: "left" } // İkinci resimdeki gibi SOLA DAYALI

  // 3. Row 4: Kurumsal Mavi Ayrım Çizgisi
  const accentRow = worksheet.getRow(4)
  accentRow.height = 5
  for (let c = 1; c <= colCount; c++) {
    const ac = worksheet.getCell(4, c)
    ac.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0284C7" }, // Vibrant Sky-600 Accent Line
    }
  }

  // 4. Row 5: Tablo Sütun Başlıkları
  const tableHeaderRow = worksheet.getRow(5)
  tableHeaderRow.height = 30
  columns.forEach((col, idx) => {
    const cell = tableHeaderRow.getCell(idx + 1)
    cell.value = `  ${col.label}  `
    cell.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } }
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0284C7" }, // Canlı Sky-600
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
      bottom: { style: "medium", color: { argb: "FF0369A1" } }, // Mavi alt sınır
      left: { style: "thin", color: { argb: "FF0369A1" } },
      right: { style: "thin", color: { argb: "FF0369A1" } },
    }
  })

  // 5. Row 6+: Veri Satırları
  data.forEach((rowItem, rIdx) => {
    const rowNum = 6 + rIdx
    const row = worksheet.getRow(rowNum)

    // Çoklu plaka veya uzun metin içeren satırlarda içeriğin kesilmemesi için satır yüksekliğini dinamik hesapla
    let maxLineCount = 1
    columns.forEach((col) => {
      const v = rowItem[col.key]
      if (v !== undefined && v !== null) {
        const s = String(v)
        const explicitLines = s.split("\n").length
        // Sütun genişliği ~30-35 karakter baz alındığında kaç satıra katlanacağını hesapla
        const approxWrapped = Math.ceil(s.length / 32)
        const lines = Math.max(explicitLines, approxWrapped)
        if (lines > maxLineCount) maxLineCount = lines
      }
    })
    // 1 satır için standart 24pt, 2 satır için 40pt, 3 satır için 56pt... (en fazla 110pt)
    row.height = maxLineCount > 1 ? Math.min(maxLineCount * 17 + 6, 110) : 24

    const isEven = rIdx % 2 === 0
    const rowBgColor = isEven ? "FFFFFFFF" : "FFF8FAFC" // Göz yormayan şık zebra

    columns.forEach((col, cIdx) => {
      const cell = row.getCell(cIdx + 1)
      let val = rowItem[col.key]

      if (val === undefined || val === null) {
        val = ""
      }

      const strVal = String(val)
      const isMultiLine = strVal.includes("\n") || (strVal.length > 30 && !["phone", "currency", "number", "plate"].includes(col.type || ""))

      // Formatlama ve Değer Atama
      if (col.type === "currency") {
        const numVal = Number(val) || 0
        cell.value = numVal
        cell.numFmt = '#,##0.00 "₺"'
        cell.alignment = { vertical: "middle", horizontal: "right" }
        cell.font = {
          name: "Segoe UI",
          size: 10,
          bold: numVal > 0,
          color: { argb: numVal > 0 ? "FFDC2626" : "FF16A34A" }, // Bakiye varsa kırmızı, 0 ise yeşil
        }
      } else if (col.type === "number") {
        cell.value = Number(val) || 0
        cell.numFmt = "#,##0"
        cell.alignment = { vertical: "middle", horizontal: "right" }
        cell.font = { name: "Segoe UI", size: 10, color: { argb: "FF1E293B" } }
      } else if (col.type === "plate") {
        cell.value = String(val).toLocaleUpperCase("tr-TR")
        cell.alignment = { vertical: "middle", horizontal: "center" }
        cell.font = { name: "Consolas", size: 10, bold: true, color: { argb: "FF0F172A" } }
      } else if (col.type === "phone") {
        cell.value = String(val)
        cell.alignment = { vertical: "middle", horizontal: "center" }
        cell.font = { name: "Segoe UI", size: 10, color: { argb: "FF334155" } }
      } else {
        cell.value = String(val)
        cell.alignment = {
          vertical: "middle",
          horizontal: "left",
          wrapText: isMultiLine,
        }
        cell.font = { name: "Segoe UI", size: 10, color: { argb: "FF1E293B" } }
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
      cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF0F172A" } }
      cell.alignment = { vertical: "middle", horizontal: "left" }
    } else if (col.type === "currency") {
      const sum = data.reduce((acc, curr) => acc + (Number(curr[col.key]) || 0), 0)
      cell.value = sum
      cell.numFmt = '#,##0.00 "₺"'
      cell.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFDC2626" } }
      cell.alignment = { vertical: "middle", horizontal: "right" }
    } else {
      cell.value = ""
    }

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF1F5F9" }, // Slate-100
    }
    cell.border = {
      top: { style: "medium", color: { argb: "FF0F172A" } },
      bottom: { style: "double", color: { argb: "FF0F172A" } }, // Muhasebe standardı çift çizgi
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    }
  })

  // 7. Sütun Genişlikleri (Sütun A LOGO_CONFIG.colAWidth ile ferah, diğer sütunlar içerik kadar geniş)
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
    // Aşırı uzun metinlerin (uzun notlar vb.) sayfayı boğmaması için genişliği en fazla 45 ile sınırla
    column.width = Math.min(Math.max(headerLen + 6, maxLen + 4, minColWidth), 45)
  })

  // Eğer yalnızca 1 sütun seçilmişse, B sütununu başlığın sığması için ferah tut
  if (columns.length === 1) {
    worksheet.getColumn(2).width = 25
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
