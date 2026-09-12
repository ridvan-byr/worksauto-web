import { describe, it, expect } from "vitest"
import {
  formatSmartPlate,
  formatSmartPhone,
  formatKilometer,
  formatVinNumber,
  formatTaxNumber,
  formatIban,
  formatTitleCase,
} from "./input-formatters"

describe("input-formatters", () => {
  describe("formatSmartPlate", () => {
    it("should format standard Turkish plates with spaces", () => {
      expect(formatSmartPlate("34abc123")).toBe("34 ABC 123")
      expect(formatSmartPlate("06a1234")).toBe("06 A 1234")
      expect(formatSmartPlate("35ab123")).toBe("35 AB 123")
      expect(formatSmartPlate("34elh08")).toBe("34 ELH 08")
    })

    it("should handle Turkish uppercase correctly (i -> İ, ı -> I)", () => {
      expect(formatSmartPlate("34ık123")).toBe("34 IK 123")
      expect(formatSmartPlate("34iş123")).toBe("34 İŞ 123")
    })

    it("should preserve foreign plates with hyphens and spaces without blocking", () => {
      expect(formatSmartPlate("M-AB 1234")).toBe("M-AB 1234")
      expect(formatSmartPlate("aa-123-bb")).toBe("AA-123-BB")
      expect(formatSmartPlate("CB 8888 BP")).toBe("CB 8888 BP")
    })

    it("should gracefully handle empty or undefined values", () => {
      expect(formatSmartPlate("")).toBe("")
      expect(formatSmartPlate(null)).toBe("")
      expect(formatSmartPlate(undefined)).toBe("")
    })
  })

  describe("formatSmartPhone", () => {
    it("should format Turkish GSM starting with 05, 5, or 905", () => {
      expect(formatSmartPhone("05321234567")).toBe("0532 123 45 67")
      expect(formatSmartPhone("5321234567")).toBe("0532 123 45 67")
      expect(formatSmartPhone("905321234567")).toBe("0532 123 45 67")
    })

    it("should format Turkish landline numbers (0212...)", () => {
      expect(formatSmartPhone("02125550123")).toBe("0212 555 01 23")
    })

    it("should preserve international numbers starting with +", () => {
      expect(formatSmartPhone("+49 170 1234567")).toBe("+49 170 1234567")
      expect(formatSmartPhone("+33612345678")).toBe("+33612345678")
    })
  })

  describe("formatKilometer", () => {
    it("should format raw numbers or string inputs with thousands separator", () => {
      expect(formatKilometer(145000)).toEqual({ formatted: "145.000", raw: 145000 })
      expect(formatKilometer("145000")).toEqual({ formatted: "145.000", raw: 145000 })
      expect(formatKilometer("5000")).toEqual({ formatted: "5.000", raw: 5000 })
    })

    it("should handle empty or zero gracefully", () => {
      expect(formatKilometer("")).toEqual({ formatted: "", raw: 0 })
      expect(formatKilometer(0)).toEqual({ formatted: "0", raw: 0 })
    })
  })

  describe("formatVinNumber", () => {
    it("should uppercase and remove forbidden ISO 3779 letters (I, O, Q)", () => {
      expect(formatVinNumber("wba33ay00pfi12345")).toBe("WBA33AY00PF12345")
      expect(formatVinNumber("1hgbh41jxmn109186")).toBe("1HGBH41JXMN109186")
    })

    it("should limit to 17 characters", () => {
      expect(formatVinNumber("12345678901234567890")).toBe("12345678901234567")
    })
  })

  describe("formatTaxNumber", () => {
    it("should limit VKN to 10 digits and TCKN to 11 digits", () => {
      expect(formatTaxNumber("1234567890123", "vkn")).toBe("1234567890")
      expect(formatTaxNumber("1234567890123", "tckn")).toBe("12345678901")
    })

    it("should strip non-numeric characters", () => {
      expect(formatTaxNumber("123-abc-456", "vkn")).toBe("123456")
    })
  })

  describe("formatIban", () => {
    it("should format Turkish IBAN in 4-character blocks and ensure TR prefix", () => {
      expect(formatIban("TR330006100519782012345678")).toBe(
        "TR33 0006 1005 1978 2012 3456 78"
      )
      expect(formatIban("330006100519782012345678")).toBe(
        "TR33 0006 1005 1978 2012 3456 78"
      )
    })
  })

  describe("formatTitleCase", () => {
    it("should capitalize words in Turkish", () => {
      expect(formatTitleCase("mehmet yılmaz")).toBe("Mehmet Yılmaz")
      expect(formatTitleCase("ahmet ışık")).toBe("Ahmet Işık")
    })
  })
})
