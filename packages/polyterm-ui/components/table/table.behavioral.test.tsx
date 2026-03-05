// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../polyterm-testing/src/index"
import { Table } from "./table"

afterEach(() => cleanup())

describe("Table behavior", () => {
  const data = [
    { name: "Alice", age: 30, role: "Engineer" },
    { name: "Bob", age: 25, role: "Designer" },
  ]

  it("renders header row", () => {
    const { screen } = renderTui(
      <Table data={data} />,
      { cols: 60, rows: 10 },
    )
    const text = screen.text()
    expect(text).toContain("name")
    expect(text).toContain("age")
    expect(text).toContain("role")
  })

  it("renders data rows", () => {
    const { screen } = renderTui(
      <Table data={data} />,
      { cols: 60, rows: 10 },
    )
    const text = screen.text()
    expect(text).toContain("Alice")
    expect(text).toContain("Bob")
    expect(text).toContain("30")
    expect(text).toContain("25")
  })

  it("renders border characters", () => {
    const { screen } = renderTui(
      <Table data={data} />,
      { cols: 60, rows: 10 },
    )
    const text = screen.text()
    expect(text).toContain("\u250c") // ┌
    expect(text).toContain("\u2510") // ┐
    expect(text).toContain("\u2514") // └
    expect(text).toContain("\u2518") // ┘
    expect(text).toContain("\u2502") // │
    expect(text).toContain("\u2500") // ─
  })

  it("respects custom columns ordering", () => {
    const { screen } = renderTui(
      <Table data={data} columns={["role", "name"]} />,
      { cols: 60, rows: 10 },
    )
    const text = screen.text()
    expect(text).toContain("role")
    expect(text).toContain("name")
    // age should not appear
    expect(text).not.toContain("age")
  })

  it("handles empty data array", () => {
    const { screen } = renderTui(
      <Table data={[]} />,
      { cols: 40, rows: 6 },
    )
    expect(screen.text()).toBeDefined()
  })

  it("handles null/undefined values", () => {
    const { screen } = renderTui(
      <Table data={[{ name: "Alice", value: null }, { name: "Bob", value: undefined }]} />,
      { cols: 40, rows: 10 },
    )
    const text = screen.text()
    expect(text).toContain("Alice")
    expect(text).toContain("Bob")
  })

  it("handles single column", () => {
    const { screen } = renderTui(
      <Table data={[{ name: "Alice" }, { name: "Bob" }]} />,
      { cols: 30, rows: 8 },
    )
    const text = screen.text()
    expect(text).toContain("Alice")
    expect(text).toContain("Bob")
  })

  it("handles single row", () => {
    const { screen } = renderTui(
      <Table data={[{ x: 1, y: 2 }]} />,
      { cols: 30, rows: 8 },
    )
    expect(screen.text()).toContain("1")
    expect(screen.text()).toContain("2")
  })

  it("renders with custom headerColor", () => {
    const { screen } = renderTui(
      <Table data={data} headerColor="cyan" />,
      { cols: 60, rows: 10 },
    )
    // Should render without errors
    expect(screen.text()).toContain("name")
  })

  it("renders with custom borderColor", () => {
    const { screen } = renderTui(
      <Table data={data} borderColor="red" />,
      { cols: 60, rows: 10 },
    )
    expect(screen.text()).toContain("\u2502")
  })

  it("handles sparse data (different keys per row)", () => {
    const { screen } = renderTui(
      <Table data={[{ a: 1 }, { b: 2 }, { c: 3 }]} />,
      { cols: 40, rows: 10 },
    )
    const text = screen.text()
    expect(text).toContain("1")
    expect(text).toContain("2")
    expect(text).toContain("3")
  })

  it("renders with custom padding", () => {
    const { screen } = renderTui(
      <Table data={data} padding={2} />,
      { cols: 80, rows: 10 },
    )
    expect(screen.text()).toContain("Alice")
  })

  it("handles boolean values", () => {
    const { screen } = renderTui(
      <Table data={[{ name: "test", active: true }]} />,
      { cols: 40, rows: 8 },
    )
    expect(screen.text()).toContain("true")
  })

  it("handles numeric values", () => {
    const { screen } = renderTui(
      <Table data={[{ id: 42, score: 99.5 }]} />,
      { cols: 30, rows: 8 },
    )
    const text = screen.text()
    expect(text).toContain("42")
    expect(text).toContain("99.5")
  })
})
