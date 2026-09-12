import { describe, it, expect } from "vitest"
import {
  guessTargetField,
  parseFullName,
  normalizePhoneNumber,
  checkMappingSufficiency,
} from "./excel-helpers"

describe("excel-helpers", () => {
  describe("guessTargetField", () => {
    it("should correctly identify plate columns", () => {
      expect(guessTargetField("Plaka")).toBe("plate")
      expect(guessTargetField("Araç Plakası")).toBe("plate")
      expect(guessTargetField("PLAKA NO")).toBe("plate")
    })

    it("should correctly identify phone and avoid false positive on otomobil", () => {
      expect(guessTargetField("Telefon")).toBe("phone")
      expect(guessTargetField("Cep Tel")).toBe("phone")
      expect(guessTargetField("GSM")).toBe("phone")
      expect(guessTargetField("İletişim")).toBe("phone")
      expect(guessTargetField("Otomobil")).not.toBe("phone")
    })

    it("should prioritize fuelType over taxNumber", () => {
      expect(guessTargetField("Yakıt")).toBe("fuelType")
      expect(guessTargetField("Yakıt Cinsi")).toBe("fuelType")
    })

    it("should identify customer name columns", () => {
      expect(guessTargetField("Müşteri Adı Soyadı")).toBe("fullName")
      expect(guessTargetField("Ad Soyad")).toBe("fullName")
      expect(guessTargetField("Adı")).toBe("firstName")
      expect(guessTargetField("Soyadı")).toBe("lastName")
      expect(guessTargetField("Müşteri Adı")).toBe("firstName")
      expect(guessTargetField("Müşteri Soyadı")).toBe("lastName")
    })

    it("should never map Cari Kodu, Cari No, Müşteri No, Sıra No to customer names", () => {
      expect(guessTargetField("Cari Kodu")).not.toBe("fullName")
      expect(guessTargetField("Cari Kodu")).toBe("")
      expect(guessTargetField("Cari No")).toBe("")
      expect(guessTargetField("Müşteri No")).toBe("")
      expect(guessTargetField("Müşteri Kodu")).toBe("")
      expect(guessTargetField("Sıra No")).toBe("")
      expect(guessTargetField("Hesap Kodu")).toBe("")
    })
  })

  describe("parseFullName", () => {
    it("should handle single name", () => {
      expect(parseFullName("Ahmet")).toEqual({ firstName: "Ahmet", lastName: "" })
    })

    it("should handle two-word names", () => {
      expect(parseFullName("Ahmet Yılmaz")).toEqual({ firstName: "Ahmet", lastName: "Yılmaz" })
    })

    it("should handle three-word double surname", () => {
      expect(parseFullName("Ayşe Kaya Yılmaz")).toEqual({
        firstName: "Ayşe",
        lastName: "Kaya Yılmaz",
      })
    })

    it("should handle four-word compound names", () => {
      expect(parseFullName("Fatma Zehra Kaya Yılmaz")).toEqual({
        firstName: "Fatma Zehra",
        lastName: "Kaya Yılmaz",
      })
    })
  })

  describe("normalizePhoneNumber", () => {
    it("should format Turkish mobile numbers cleanly", () => {
      expect(normalizePhoneNumber("0532 123 45 67")).toBe("05321234567")
      expect(normalizePhoneNumber("+90 532 123 4567")).toBe("05321234567")
      expect(normalizePhoneNumber("5321234567")).toBe("05321234567")
    })
  })

  describe("checkMappingSufficiency", () => {
    it("should return isSufficient: true when all mandatory fields exist (single name)", () => {
      const mappings = {
        plate: "Araç Plakası",
        phone: "Telefon",
        fullName: "Müşteri Adı Soyadı",
      }
      const res = checkMappingSufficiency(mappings, "single")
      expect(res.isSufficient).toBe(true)
      expect(res.missingRequired).toHaveLength(0)
    })

    it("should return isSufficient: true for split name mode with firstName and lastName", () => {
      const mappings = {
        plate: "Araç Plakası",
        phone: "Telefon",
        firstName: "Müşteri Adı",
        lastName: "Müşteri Soyadı",
      }
      const res = checkMappingSufficiency(mappings, "split")
      expect(res.isSufficient).toBe(true)
      expect(res.missingRequired).toHaveLength(0)
    })

    it("should return isSufficient: true for corporate clients when companyTitle is mapped", () => {
      const mappings = {
        plate: "Plaka",
        companyTitle: "Firma Adı",
      }
      const res = checkMappingSufficiency(mappings, "single")
      expect(res.isSufficient).toBe(true)
    })

    it("should return missing fields when plate is not mapped", () => {
      const mappings = {
        phone: "Telefon",
        fullName: "Müşteri Adı Soyadı",
      }
      const res = checkMappingSufficiency(mappings, "single")
      expect(res.isSufficient).toBe(false)
      expect(res.missingRequired).toContain("Araç Plakası")
    })

    it("should return missing fields when phone and company are missing", () => {
      const mappings = {
        plate: "34 ABC 123",
        fullName: "Ahmet Yılmaz",
      }
      const res = checkMappingSufficiency(mappings, "single")
      expect(res.isSufficient).toBe(false)
      expect(res.missingRequired).toContain("Telefon Numarası")
    })
  })
})
