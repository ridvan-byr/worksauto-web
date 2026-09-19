import { describe, it, expect } from "vitest"
import ExcelJS from "exceljs"
import { generateAestheticExcel, ExportColumnDef } from "./aesthetic-excel"

describe("generateAestheticExcel", () => {
  const customerColumns: ExportColumnDef[] = [
    { key: "fullName", label: "Müşteri Adı Soyadı", type: "text" },
    { key: "phone", label: "Telefon Numarası", type: "phone" },
    { key: "vehiclePlates", label: "Kayıtlı Plakalar", type: "text" },
  ]

  const vehicleColumns: ExportColumnDef[] = [
    { key: "plate", label: "Plaka", type: "plate" },
    { key: "brand", label: "Marka", type: "text" },
    { key: "customerName", label: "Araç Sahibi", type: "text" },
  ]

  const customerData = [
    { fullName: "Ahmet Yılmaz", phone: "05551234567", vehiclePlates: "34 ABC 123" },
    { fullName: "Mehmet Demir", phone: "05329876543", vehiclePlates: "06 DEF 456" },
  ]

  const vehicleData = [
    { plate: "34 ABC 123", brand: "Volkswagen", customerName: "Ahmet Yılmaz", _customerRow: 6 },
    { plate: "06 DEF 456", brand: "Toyota", customerName: "Mehmet Demir", _customerRow: 7 },
  ]

  it("should generate a multi-sheet workbook with clickable internal hyperlinks", async () => {
    const customerLinkResolver = (rowItem: Record<string, unknown>, colKey: string) => {
      if (colKey === "vehiclePlates") {
        const plate = String(rowItem.vehiclePlates || "")
        if (plate.includes("34 ABC 123")) {
          return {
            targetSheet: "Araçlar",
            targetCell: "A6",
            tooltip: "'Araçlar' sayfasına git",
          }
        }
        if (plate.includes("06 DEF 456")) {
          return {
            targetSheet: "Araçlar",
            targetCell: "A7",
            tooltip: "'Araçlar' sayfasına git",
          }
        }
      }
      return undefined
    }

    const vehicleLinkResolver = (rowItem: Record<string, unknown>, colKey: string) => {
      if (colKey === "customerName" && rowItem._customerRow) {
        return {
          targetSheet: "Müşteriler",
          targetCell: `A${rowItem._customerRow}`,
          tooltip: "'Müşteriler' sayfasına git",
        }
      }
      return undefined
    }

    const blob = await generateAestheticExcel({
      title: "MÜŞTERİ LİSTESİ",
      sheetName: "Müşteriler",
      columns: customerColumns,
      data: customerData,
      linkResolver: customerLinkResolver,
      secondarySheet: {
        sheetName: "Araçlar",
        title: "ARAÇLAR LİSTESİ",
        columns: vehicleColumns,
        data: vehicleData,
        linkResolver: vehicleLinkResolver,
      },
    })

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBeGreaterThan(1000)

    // Load into ExcelJS to verify internal worksheet structure and hyperlinks
    const arrayBuffer = await blob.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(arrayBuffer)

    expect(workbook.worksheets.length).toBe(2)
    const custSheet = workbook.getWorksheet("Müşteriler")
    const vehSheet = workbook.getWorksheet("Araçlar")

    expect(custSheet).toBeDefined()
    expect(vehSheet).toBeDefined()

    // Row 6 is first data row in Müşteriler
    // Column 3 is vehiclePlates
    const cellPlate1 = custSheet?.getRow(6).getCell(3)
    expect(cellPlate1?.value).toMatchObject({
      formula: 'HYPERLINK("#\'Araçlar\'!A6", "34 ABC 123")',
      result: "34 ABC 123",
    })

    // Row 6 in Araçlar
    // Column 3 is customerName
    const cellCust1 = vehSheet?.getRow(6).getCell(3)
    expect(cellCust1?.value).toMatchObject({
      formula: 'HYPERLINK("#\'Müşteriler\'!A6", "Ahmet Yılmaz")',
      result: "Ahmet Yılmaz",
    })
  })
})
