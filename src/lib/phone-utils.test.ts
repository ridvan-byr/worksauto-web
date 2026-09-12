import { describe, it, expect } from "vitest"
import {
  isValidTurkishGsm,
  getTurkishGsmError,
  formatTurkishGsmInput,
  formatTurkishGsmDisplay,
  normalizeTurkishGsm,
} from "./phone-utils"

describe("Turkish GSM Phone Utils", () => {
  describe("isValidTurkishGsm", () => {
    it("should accept valid 10-digit mobile numbers starting with 5", () => {
      expect(isValidTurkishGsm("5321234567")).toBe(true)
      expect(isValidTurkishGsm("5551234567")).toBe(true)
      expect(isValidTurkishGsm("5421234567")).toBe(true)
      expect(isValidTurkishGsm("5051234567")).toBe(true)
    })

    it("should accept valid 11-digit mobile numbers starting with 05", () => {
      expect(isValidTurkishGsm("05321234567")).toBe(true)
      expect(isValidTurkishGsm("0532 123 45 67")).toBe(true)
      expect(isValidTurkishGsm("0 (532) 123 45 67")).toBe(true)
    })

    it("should accept valid 12-digit mobile numbers starting with 905 / +905", () => {
      expect(isValidTurkishGsm("905321234567")).toBe(true)
      expect(isValidTurkishGsm("+905321234567")).toBe(true)
      expect(isValidTurkishGsm("+90 532 123 45 67")).toBe(true)
    })

    it("should REJECT the user reported case 324234234234", () => {
      expect(isValidTurkishGsm("324234234234")).toBe(false)
    })

    it("should reject landline numbers starting with 02 or 03", () => {
      expect(isValidTurkishGsm("02121234567")).toBe(false)
      expect(isValidTurkishGsm("03121234567")).toBe(false)
      expect(isValidTurkishGsm("02161234567")).toBe(false)
    })

    it("should accept valid international phone numbers starting with +", () => {
      expect(isValidTurkishGsm("+491701234567")).toBe(true)
      expect(isValidTurkishGsm("+49 170 123 4567")).toBe(true)
      expect(isValidTurkishGsm("+14155552671")).toBe(true)
      expect(isValidTurkishGsm("+33612345678")).toBe(true)
    })

    it("should reject too short or too long numbers", () => {
      expect(isValidTurkishGsm("053212345")).toBe(false)
      expect(isValidTurkishGsm("0532123456789")).toBe(false)
      expect(isValidTurkishGsm("+12")).toBe(false)
      expect(isValidTurkishGsm("")).toBe(false)
      expect(isValidTurkishGsm(null)).toBe(false)
      expect(isValidTurkishGsm(undefined)).toBe(false)
    })
  })

  describe("getTurkishGsmError", () => {
    it("should return detailed error for 324234234234", () => {
      const error = getTurkishGsmError("324234234234")
      expect(error).not.toBeNull()
      expect(error).toContain("05 ile başlamalıdır")
    })

    it("should return missing digits error for short numbers", () => {
      const error = getTurkishGsmError("053212345")
      expect(error).toContain("eksik")
    })

    it("should return null for valid numbers", () => {
      expect(getTurkishGsmError("0532 123 45 67")).toBeNull()
      expect(getTurkishGsmError("5321234567")).toBeNull()
      expect(getTurkishGsmError("+905321234567")).toBeNull()
      expect(getTurkishGsmError("+49 170 123 4567")).toBeNull()
    })
  })

  describe("formatTurkishGsmInput", () => {
    it("should format progressively as user types", () => {
      expect(formatTurkishGsmInput("0532")).toBe("0532")
      expect(formatTurkishGsmInput("05321")).toBe("0532 1")
      expect(formatTurkishGsmInput("05321234")).toBe("0532 123 4")
      expect(formatTurkishGsmInput("05321234567")).toBe("0532 123 45 67")
    })

    it("should auto-prefix with 0 if user starts with 5", () => {
      expect(formatTurkishGsmInput("5321234567")).toBe("0532 123 45 67")
    })

    it("should handle pasted +90 / 90 numbers", () => {
      expect(formatTurkishGsmInput("+905321234567")).toBe("0532 123 45 67")
    })
  })

  describe("normalizeTurkishGsm", () => {
    it("should normalize to +905XXXXXXXXX", () => {
      expect(normalizeTurkishGsm("0532 123 45 67")).toBe("+905321234567")
      expect(normalizeTurkishGsm("5321234567")).toBe("+905321234567")
      expect(normalizeTurkishGsm("+905321234567")).toBe("+905321234567")
    })
  })
})
