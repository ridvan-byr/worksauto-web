import { describe, it, expect } from "vitest"
import {
  filterPersonNameInput,
  formatPersonName,
  validatePersonName,
} from "./name-utils"

describe("Name Utils", () => {
  describe("filterPersonNameInput", () => {
    it("should strip numbers from input", () => {
      expect(filterPersonNameInput("Mehmet123")).toBe("Mehmet")
      expect(filterPersonNameInput("123456")).toBe("")
      expect(filterPersonNameInput("Ali 2")).toBe("Ali ")
    })

    it("should strip special symbols from input", () => {
      expect(filterPersonNameInput("Ahmet!@#$")).toBe("Ahmet")
      expect(filterPersonNameInput("Mehmet_Ali")).toBe("MehmetAli")
      expect(filterPersonNameInput("<script>alert(1)</script>")).toBe("scriptalertscript")
    })

    it("should allow Turkish characters and single spaces", () => {
      expect(filterPersonNameInput("Ömer Faruk Çelik")).toBe("Ömer Faruk Çelik")
      expect(filterPersonNameInput("İlhan Işık Şahin")).toBe("İlhan Işık Şahin")
      expect(filterPersonNameInput("Gülşah    Aydoğan")).toBe("Gülşah Aydoğan")
    })
  })

  describe("formatPersonName", () => {
    it("should format to Title Case with Turkish locale support", () => {
      expect(formatPersonName("mehmet ali")).toBe("Mehmet Ali")
      expect(formatPersonName("öztürk")).toBe("Öztürk")
      expect(formatPersonName("ışık")).toBe("Işık")
      expect(formatPersonName("ilhan")).toBe("İlhan")
      expect(formatPersonName("ÇELİK")).toBe("Çelik")
      expect(formatPersonName("ŞAHİN")).toBe("Şahin")
    })

    it("should trim excess whitespace", () => {
      expect(formatPersonName("   hasan   hüseyin   ")).toBe("Hasan Hüseyin")
    })
  })

  describe("validatePersonName", () => {
    it("should accept valid Turkish names and return formatted", () => {
      const res = validatePersonName("mehmet ali", "Usta Adı")
      expect(res.isValid).toBe(true)
      expect(res.error).toBeNull()
      expect(res.formatted).toBe("Mehmet Ali")
    })

    it("should reject names with numbers", () => {
      const res = validatePersonName("Mehmet123", "Usta Adı")
      expect(res.isValid).toBe(false)
      expect(res.error).toContain("yalnızca harflerden oluşmalıdır")
    })

    it("should reject names with special characters", () => {
      const res = validatePersonName("Ali@Usta", "Usta Adı")
      expect(res.isValid).toBe(false)
      expect(res.error).toContain("yalnızca harflerden oluşmalıdır")
    })

    it("should reject too short names", () => {
      const res = validatePersonName("A", "Usta Adı")
      expect(res.isValid).toBe(false)
      expect(res.error).toContain("en az 2 harften oluşmalıdır")
    })

    it("should reject empty names", () => {
      const res = validatePersonName("", "Usta Adı")
      expect(res.isValid).toBe(false)
      expect(res.error).toContain("boş bırakılamaz")
    })
  })
})
