import { describe, it, expect } from "vitest"
import {
  TURKEY_PROVINCES,
  TURKEY_DISTRICTS,
  getDistrictsForProvince,
  normalizeTurkishSearch,
} from "./turkey-locations"

describe("Turkey Locations", () => {
  it("should contain exactly 81 provinces", () => {
    expect(TURKEY_PROVINCES.length).toBe(81)
  })

  it("should have all 81 provinces mapped to districts in TURKEY_DISTRICTS", () => {
    for (const province of TURKEY_PROVINCES) {
      const districts = TURKEY_DISTRICTS[province]
      expect(districts).toBeDefined()
      expect(districts.length).toBeGreaterThan(0)
    }
  })

  it("should return correct districts for Istanbul", () => {
    const districts = getDistrictsForProvince("İstanbul")
    expect(districts).toContain("Kadıköy")
    expect(districts).toContain("Beşiktaş")
    expect(districts).toContain("Başakşehir")
    expect(districts.length).toBe(39)
  })

  it("should return correct districts for Izmir", () => {
    const districts = getDistrictsForProvince("İzmir")
    expect(districts).toContain("Bornova")
    expect(districts).toContain("Konak")
    expect(districts).toContain("Karşıyaka")
    expect(districts.length).toBe(30)
  })

  it("should return correct districts for Ankara", () => {
    const districts = getDistrictsForProvince("Ankara")
    expect(districts).toContain("Çankaya")
    expect(districts).toContain("Keçiören")
    expect(districts).toContain("Yenimahalle")
    expect(districts.length).toBe(25)
  })

  it("should normalize Turkish characters for search", () => {
    expect(normalizeTurkishSearch("İSTANBUL")).toBe("istanbul")
    expect(normalizeTurkishSearch("Isparta")).toBe("ısparta")
    expect(normalizeTurkishSearch("Çankaya")).toBe("çankaya")
    expect(normalizeTurkishSearch("Şişli")).toBe("şişli")
  })
})
