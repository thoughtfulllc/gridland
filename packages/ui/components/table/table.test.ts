import { describe, it, expect } from "bun:test"
import { getColumns, calculateColumnWidths, padCell } from "./table"

describe("table utilities", () => {
  describe("getColumns", () => {
    it("returns explicit columns when provided", () => {
      const data = [{ a: 1, b: 2, c: 3 }]
      expect(getColumns(data, ["b", "a"])).toEqual(["b", "a"])
    })

    it("extracts columns from data keys", () => {
      const data = [
        { name: "Alice", age: 30 },
        { name: "Bob", age: 25 },
      ]
      const cols = getColumns(data)
      expect(cols).toContain("name")
      expect(cols).toContain("age")
      expect(cols.length).toBe(2)
    })

    it("collects keys from all rows", () => {
      const data = [
        { a: 1 },
        { b: 2 },
        { c: 3 },
      ]
      const cols = getColumns(data)
      expect(cols.length).toBe(3)
      expect(cols).toContain("a")
      expect(cols).toContain("b")
      expect(cols).toContain("c")
    })

    it("returns empty array for empty data", () => {
      expect(getColumns([])).toEqual([])
    })

    it("deduplicates keys across rows", () => {
      const data = [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
      ]
      const cols = getColumns(data)
      expect(cols.length).toBe(2)
    })
  })

  describe("calculateColumnWidths", () => {
    it("uses header width when data is shorter", () => {
      const cols = calculateColumnWidths(["longheader"], [{ longheader: "hi" }], 1)
      // "longheader" = 10 chars, "hi" = 2 chars, padding=1 → 10 + 2 = 12
      expect(cols[0]!.width).toBe(10 + 2)
    })

    it("uses data width when header is shorter", () => {
      const cols = calculateColumnWidths(["id"], [{ id: "extremely long value here" }], 1)
      // "extremely long value here" = 25 chars, "id" = 2, padding=1 → 25 + 2 = 27
      expect(cols[0]!.width).toBe(25 + 2)
    })

    it("handles null values", () => {
      const cols = calculateColumnWidths(["name"], [{ name: null }], 1)
      // "name" = 4 chars, null = 0, padding=1 → 4 + 2 = 6
      expect(cols[0]!.width).toBe(6)
    })

    it("respects padding parameter", () => {
      const cols = calculateColumnWidths(["ab"], [{ ab: "cd" }], 3)
      // both "ab" and "cd" are 2 chars, padding=3 → 2 + 6 = 8
      expect(cols[0]!.width).toBe(8)
    })

    it("handles multiple columns", () => {
      const cols = calculateColumnWidths(
        ["name", "age"],
        [{ name: "Alice", age: 30 }],
        1,
      )
      expect(cols.length).toBe(2)
      expect(cols[0]!.field).toBe("name")
      expect(cols[1]!.field).toBe("age")
    })
  })

  describe("padCell", () => {
    it("pads value to target width", () => {
      const result = padCell("hi", 10, 1)
      expect(result.length).toBe(10)
      expect(result).toBe(" hi       ")
    })

    it("handles zero padding", () => {
      const result = padCell("test", 8, 0)
      expect(result).toBe("test    ")
    })

    it("handles value equal to width minus padding", () => {
      const result = padCell("ab", 4, 1)
      // padding=1, value="ab" (2), rightPad = 4-2-1 = 1
      expect(result).toBe(" ab ")
    })

    it("handles empty value", () => {
      const result = padCell("", 6, 1)
      expect(result.length).toBe(6)
      expect(result.startsWith(" ")).toBe(true)
    })

    it("right-aligns value", () => {
      const result = padCell("hi", 10, 1, "right")
      expect(result.length).toBe(10)
      // value should be at the right with 1 char padding
      expect(result).toBe("       hi ")
    })

    it("center-aligns value", () => {
      const result = padCell("hi", 10, 1, "center")
      expect(result.length).toBe(10)
      // totalGap = 10-2 = 8, leftGap = 4, rightGap = 4
      expect(result).toBe("    hi    ")
    })

    it("center-aligns with odd gap", () => {
      const result = padCell("ab", 9, 1, "center")
      expect(result.length).toBe(9)
      // totalGap = 9-2 = 7, leftGap = 3, rightGap = 4
      expect(result).toBe("   ab    ")
    })

    it("defaults to left alignment", () => {
      const left = padCell("hi", 10, 1)
      const explicit = padCell("hi", 10, 1, "left")
      expect(left).toBe(explicit)
    })
  })
})
