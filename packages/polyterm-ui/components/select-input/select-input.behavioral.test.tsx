// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../polyterm-testing/src/index"
import { SelectInput } from "./select-input"

afterEach(() => cleanup())

describe("SelectInput behavior", () => {
  const items = [
    { label: "Option A", value: "a" },
    { label: "Option B", value: "b" },
    { label: "Option C", value: "c" },
  ]

  it("renders all items", () => {
    const { screen } = renderTui(
      <SelectInput items={items} />,
      { cols: 30, rows: 6 },
    )
    const text = screen.text()
    expect(text).toContain("Option A")
    expect(text).toContain("Option B")
    expect(text).toContain("Option C")
  })

  it("handles empty items", () => {
    const { screen } = renderTui(
      <SelectInput items={[]} />,
      { cols: 30, rows: 4 },
    )
    expect(screen.text()).toBeDefined()
  })

  it("handles single item", () => {
    const { screen } = renderTui(
      <SelectInput items={[{ label: "Only", value: "o" }]} />,
      { cols: 30, rows: 4 },
    )
    expect(screen.text()).toContain("Only")
  })

  it("renders with custom initialIndex", () => {
    const { screen } = renderTui(
      <SelectInput items={items} initialIndex={2} />,
      { cols: 30, rows: 6 },
    )
    expect(screen.text()).toContain("Option C")
  })
})
