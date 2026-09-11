import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import * as React from "react"
import { SearchableSelect } from "./searchable-select"

describe("SearchableSelect Component", () => {
  const sampleOptions = ["Adana", "Ankara", "Antalya", "Bursa", "İstanbul", "İzmir"]

  it("should render placeholder when no value is provided", () => {
    render(
      <SearchableSelect
        options={sampleOptions}
        value=""
        onChange={() => {}}
        placeholder="İl seçiniz..."
      />
    )
    expect(screen.getByText("İl seçiniz...")).toBeDefined()
  })

  it("should render selected value", () => {
    render(
      <SearchableSelect
        options={sampleOptions}
        value="İstanbul"
        onChange={() => {}}
      />
    )
    expect(screen.getByText("İstanbul")).toBeDefined()
  })

  it("should open dropdown on click and display options", () => {
    render(
      <SearchableSelect
        options={sampleOptions}
        value=""
        onChange={() => {}}
      />
    )
    const trigger = screen.getByRole("button")
    fireEvent.click(trigger)

    expect(screen.getByPlaceholderText("Ara...")).toBeDefined()
    expect(screen.getByText("Ankara")).toBeDefined()
    expect(screen.getByText("İzmir")).toBeDefined()
  })

  it("should filter options based on search query with Turkish characters", () => {
    render(
      <SearchableSelect
        options={sampleOptions}
        value=""
        onChange={() => {}}
      />
    )
    const trigger = screen.getByRole("button")
    fireEvent.click(trigger)

    const searchInput = screen.getByPlaceholderText("Ara...")
    fireEvent.change(searchInput, { target: { value: "ist" } })

    expect(screen.getByText("İstanbul")).toBeDefined()
    expect(screen.queryByText("Ankara")).toBeNull()
  })

  it("should call onChange and close when an option is selected", () => {
    const onChange = vi.fn()
    render(
      <SearchableSelect
        options={sampleOptions}
        value=""
        onChange={onChange}
      />
    )
    const trigger = screen.getByRole("button")
    fireEvent.click(trigger)

    const ankaraOption = screen.getByText("Ankara")
    fireEvent.click(ankaraOption)

    expect(onChange).toHaveBeenCalledWith("Ankara")
  })

  it("should be disabled when disabled prop is true", () => {
    render(
      <SearchableSelect
        options={sampleOptions}
        value=""
        onChange={() => {}}
        disabled={true}
        disabledMessage="Önce İl Seçiniz"
      />
    )
    const trigger = screen.getByRole("button")
    expect(trigger.getAttribute("disabled")).not.toBeNull()
    expect(screen.getByText("Önce İl Seçiniz")).toBeDefined()
  })
})
