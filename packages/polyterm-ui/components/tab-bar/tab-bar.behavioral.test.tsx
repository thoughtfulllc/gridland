// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../polyterm-testing/src/index"
import { TabBar } from "./tab-bar"

afterEach(() => cleanup())

describe("TabBar behavior", () => {
  it("renders all options on one line", () => {
    const { screen } = renderTui(
      <TabBar options={["Tab1", "Tab2", "Tab3"]} selectedIndex={0} />,
      { cols: 40, rows: 3 },
    )
    const text = screen.text()
    expect(text).toContain("Tab1")
    expect(text).toContain("Tab2")
    expect(text).toContain("Tab3")
  })

  it("renders label when provided", () => {
    const { screen } = renderTui(
      <TabBar label="View" options={["One", "Two"]} selectedIndex={0} />,
      { cols: 40, rows: 3 },
    )
    expect(screen.text()).toContain("View")
  })

  it("does not render label when omitted", () => {
    const { screen } = renderTui(
      <TabBar options={["One", "Two"]} selectedIndex={0} />,
      { cols: 40, rows: 3 },
    )
    expect(screen.text()).not.toContain("View")
  })

  it("renders all options horizontally on one line", () => {
    const { screen } = renderTui(
      <TabBar label="View" options={["A", "B", "C"]} selectedIndex={0} />,
      { cols: 40, rows: 3 },
    )
    const lines = screen.text().split("\n").filter((l) => l.trim().length > 0)
    // All content should be on a single line
    expect(lines.length).toBe(1)
    expect(lines[0]).toContain("A")
    expect(lines[0]).toContain("B")
    expect(lines[0]).toContain("C")
  })

  it("handles out-of-range selectedIndex", () => {
    const { screen } = renderTui(
      <TabBar options={["One", "Two"]} selectedIndex={99} />,
      { cols: 40, rows: 3 },
    )
    const text = screen.text()
    expect(text).toContain("One")
    expect(text).toContain("Two")
  })

  it("handles empty options array", () => {
    const { screen } = renderTui(
      <TabBar label="View" options={[]} selectedIndex={0} />,
      { cols: 40, rows: 3 },
    )
    expect(screen.text()).toContain("View")
  })

  it("handles single option", () => {
    const { screen } = renderTui(
      <TabBar options={["Only"]} selectedIndex={0} />,
      { cols: 40, rows: 3 },
    )
    expect(screen.text()).toContain("Only")
  })

  it("renders empty string label", () => {
    const { screen } = renderTui(
      <TabBar label="" options={["A", "B"]} selectedIndex={0} />,
      { cols: 40, rows: 3 },
    )
    // The label element IS rendered (as empty), but visually no label text
    expect(screen.text()).toContain("A")
  })

  it("renders selected index in the middle", () => {
    const { screen } = renderTui(
      <TabBar options={["A", "B", "C"]} selectedIndex={1} />,
      { cols: 40, rows: 3 },
    )
    const text = screen.text()
    expect(text).toContain("A")
    expect(text).toContain("B")
    expect(text).toContain("C")
  })
})
