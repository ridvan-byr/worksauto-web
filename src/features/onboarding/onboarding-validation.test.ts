import { describe, it, expect } from "vitest"
import { isValidTurkishGsm, formatTurkishGsmInput } from "@/lib/phone-utils"
import { filterPersonNameInput, validatePersonName } from "@/lib/name-utils"

describe("Onboarding Formats & Validation Rules", () => {
  describe("Step 1: Company & Tax Formatting", () => {
    it("should strictly require Tax Number / VKN to be 10 or 11 digits", () => {
      const isValidTaxNumber = (num: string) => {
        const clean = num.replace(/\D/g, "")
        return clean.length === 10 || clean.length === 11
      }

      expect(isValidTaxNumber("1234567890")).toBe(true) // 10-digit VKN
      expect(isValidTaxNumber("12345678901")).toBe(true) // 11-digit TCKN
      expect(isValidTaxNumber("123456789")).toBe(false) // 9 digits - invalid
      expect(isValidTaxNumber("123456789012")).toBe(false) // 12 digits - invalid
      expect(isValidTaxNumber("abc1234567890def")).toBe(true) // strips non-digits to 10
    })

    it("should filter tax office to letters only", () => {
      expect(filterPersonNameInput("Bornova 123")).toBe("Bornova ")
      expect(filterPersonNameInput("Büyük Mükellefler!")).toBe("Büyük Mükellefler")
      expect(filterPersonNameInput("İkitelli Vergi Dairesi")).toBe("İkitelli Vergi Dairesi")
    })

    it("should allow flexible comfortable address formats including slashes, numbers, and dashes", () => {
      const isValidAddress = (addr: string) => addr.trim().length >= 5

      expect(isValidAddress("2. Sanayi Sitesi 352 Sokak No: 18/B Bornova / İzmir")).toBe(true)
      expect(isValidAddress("İkitelli OSB, Dolapdere Sanayi Sitesi 12. Ada No: 4-6")).toBe(true)
      expect(isValidAddress("   ")).toBe(false)
      expect(isValidAddress("Ev")).toBe(false)
    })
  })

  describe("Step 2: Working Hours Chronology", () => {
    const validateHours = (
      workStart: string,
      workEnd: string,
      breakStart?: string,
      breakEnd?: string
    ) => {
      if (workStart >= workEnd) return "Bitiş saati başlangıç saatinden sonra olmalıdır"
      if (breakStart && breakEnd) {
        if (breakStart >= breakEnd) return "Mola bitişi mola başlangıcından sonra olmalıdır"
        if (breakStart < workStart || breakEnd > workEnd) return "Mola mesai saatleri içinde olmalıdır"
      }
      return null
    }

    it("should validate that work end time is after start time", () => {
      expect(validateHours("08:30", "18:30")).toBeNull()
      expect(validateHours("18:30", "08:30")).toContain("Bitiş saati başlangıç saatinden sonra olmalıdır")
    })

    it("should validate lunch break is within working hours", () => {
      expect(validateHours("08:30", "18:30", "12:30", "13:30")).toBeNull()
      expect(validateHours("08:30", "18:30", "13:30", "12:30")).toContain("Mola bitişi mola başlangıcından sonra olmalıdır")
      expect(validateHours("08:30", "18:30", "07:30", "08:00")).toContain("Mola mesai saatleri içinde olmalıdır")
      expect(validateHours("08:30", "18:30", "18:00", "19:00")).toContain("Mola mesai saatleri içinde olmalıdır")
    })
  })

  describe("Step 3: Service Catalog Clamping", () => {
    const clampDuration = (val: number) => Math.max(5, Math.min(1440, val || 5))
    const clampLabor = (val: number) => Math.max(0, Math.min(1000000, val || 0))

    it("should clamp service duration between 5 and 1440 minutes", () => {
      expect(clampDuration(45)).toBe(45)
      expect(clampDuration(2)).toBe(5)
      expect(clampDuration(-10)).toBe(5)
      expect(clampDuration(2000)).toBe(1440)
    })

    it("should clamp labor price to positive amounts", () => {
      expect(clampLabor(750)).toBe(750)
      expect(clampLabor(0)).toBe(0) // Free checkup allowed
      expect(clampLabor(-500)).toBe(0) // Negative clamped to 0
    })
  })

  describe("Step 4: Staff Name and Phone Validation", () => {
    it("should validate Turkish GSM numbers strictly and reject non-GSM numbers", () => {
      expect(isValidTurkishGsm("0532 123 45 67")).toBe(true)
      expect(isValidTurkishGsm("0544 987 65 43")).toBe(true)
      expect(isValidTurkishGsm("324234234234")).toBe(false)
      expect(isValidTurkishGsm("0212 555 12 34")).toBe(false) // Landline rejected
      expect(isValidTurkishGsm("")).toBe(false)
    })

    it("should reject numbers and symbols in staff names", () => {
      expect(validatePersonName("Ahmet", "Usta Adı").isValid).toBe(true)
      expect(validatePersonName("Mehmet123", "Usta Adı").isValid).toBe(false)
      expect(validatePersonName("Usta@#$", "Usta Adı").isValid).toBe(false)
    })
  })

  describe("Step 5: Workshop Capacity Clamping", () => {
    const clampStock = (val: number) => Math.max(1, Math.min(100, val || 1))

    it("should clamp critical stock threshold between 1 and 100", () => {
      expect(clampStock(5)).toBe(5)
      expect(clampStock(0)).toBe(1)
      expect(clampStock(-10)).toBe(1)
      expect(clampStock(250)).toBe(100)
    })
  })
})
