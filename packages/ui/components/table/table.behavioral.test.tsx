// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
  SimpleTable,
} from "./table"

afterEach(() => cleanup())

describe("Table compound components", () => {
  it("renders header and body rows", () => {
    const { screen } = renderTui(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>name</TableHead>
            <TableHead>role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Alice</TableCell>
            <TableCell>Engineer</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Bob</TableCell>
            <TableCell>Designer</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
      { cols: 40, rows: 10 },
    )
    const text = screen.text()
    expect(text).toContain("name")
    expect(text).toContain("role")
    expect(text).toContain("Alice")
    expect(text).toContain("Bob")
    expect(text).toContain("Engineer")
    expect(text).toContain("Designer")
  })

  it("renders horizontal separator", () => {
    const { screen } = renderTui(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>a</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>1</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
      { cols: 20, rows: 8 },
    )
    expect(screen.text()).toContain("\u2500") // ─
  })

  it("renders caption", () => {
    const { screen } = renderTui(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>x</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>1</TableCell>
          </TableRow>
        </TableBody>
        <TableCaption>A caption</TableCaption>
      </Table>,
      { cols: 30, rows: 8 },
    )
    expect(screen.text()).toContain("A caption")
  })

  it("renders footer with separator", () => {
    const { screen } = renderTui(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>item</TableHead>
            <TableHead>price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Widget</TableCell>
            <TableCell>$10</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
            <TableCell>$10</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
      { cols: 40, rows: 10 },
    )
    const text = screen.text()
    expect(text).toContain("Total")
    expect(text).toContain("$10")
  })

  it("handles empty body", () => {
    const { screen } = renderTui(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{[]}</TableBody>
      </Table>,
      { cols: 30, rows: 6 },
    )
    expect(screen.text()).toContain("name")
  })
})

describe("SimpleTable (data-driven)", () => {
  const data = [
    { name: "Alice", age: 30, role: "Engineer" },
    { name: "Bob", age: 25, role: "Designer" },
  ]

  it("renders header row", () => {
    const { screen } = renderTui(
      <SimpleTable data={data} />,
      { cols: 60, rows: 10 },
    )
    const text = screen.text()
    expect(text).toContain("name")
    expect(text).toContain("age")
    expect(text).toContain("role")
  })

  it("renders data rows", () => {
    const { screen } = renderTui(
      <SimpleTable data={data} />,
      { cols: 60, rows: 10 },
    )
    const text = screen.text()
    expect(text).toContain("Alice")
    expect(text).toContain("Bob")
    expect(text).toContain("30")
    expect(text).toContain("25")
  })

  it("respects custom columns ordering", () => {
    const { screen } = renderTui(
      <SimpleTable data={data} columns={["role", "name"]} />,
      { cols: 60, rows: 10 },
    )
    const text = screen.text()
    expect(text).toContain("role")
    expect(text).toContain("name")
    expect(text).not.toContain("age")
  })

  it("handles empty data array", () => {
    const { screen } = renderTui(
      <SimpleTable data={[]} />,
      { cols: 40, rows: 6 },
    )
    expect(screen.text()).toBeDefined()
  })

  it("handles null/undefined values", () => {
    const { screen } = renderTui(
      <SimpleTable data={[{ name: "Alice", value: null }, { name: "Bob", value: undefined }]} />,
      { cols: 40, rows: 10 },
    )
    const text = screen.text()
    expect(text).toContain("Alice")
    expect(text).toContain("Bob")
  })

  it("handles single column", () => {
    const { screen } = renderTui(
      <SimpleTable data={[{ name: "Alice" }, { name: "Bob" }]} />,
      { cols: 30, rows: 8 },
    )
    const text = screen.text()
    expect(text).toContain("Alice")
    expect(text).toContain("Bob")
  })

  it("handles single row", () => {
    const { screen } = renderTui(
      <SimpleTable data={[{ x: 1, y: 2 }]} />,
      { cols: 30, rows: 8 },
    )
    expect(screen.text()).toContain("1")
    expect(screen.text()).toContain("2")
  })

  it("renders with custom headerColor", () => {
    const { screen } = renderTui(
      <SimpleTable data={data} headerColor="cyan" />,
      { cols: 60, rows: 10 },
    )
    expect(screen.text()).toContain("name")
  })

  it("renders with custom borderColor", () => {
    const { screen } = renderTui(
      <SimpleTable data={data} borderColor="red" />,
      { cols: 60, rows: 10 },
    )
    expect(screen.text()).toContain("\u2500") // ─
  })

  it("handles sparse data (different keys per row)", () => {
    const { screen } = renderTui(
      <SimpleTable data={[{ a: 1 }, { b: 2 }, { c: 3 }]} />,
      { cols: 40, rows: 10 },
    )
    const text = screen.text()
    expect(text).toContain("1")
    expect(text).toContain("2")
    expect(text).toContain("3")
  })

  it("renders with custom padding", () => {
    const { screen } = renderTui(
      <SimpleTable data={data} padding={2} />,
      { cols: 80, rows: 10 },
    )
    expect(screen.text()).toContain("Alice")
  })

  it("handles boolean values", () => {
    const { screen } = renderTui(
      <SimpleTable data={[{ name: "test", active: true }]} />,
      { cols: 40, rows: 8 },
    )
    expect(screen.text()).toContain("true")
  })

  it("handles numeric values", () => {
    const { screen } = renderTui(
      <SimpleTable data={[{ id: 42, score: 99.5 }]} />,
      { cols: 30, rows: 8 },
    )
    const text = screen.text()
    expect(text).toContain("42")
    expect(text).toContain("99.5")
  })
})
