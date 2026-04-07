// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { Link } from "./link"

afterEach(() => cleanup())

// Underline bitmask constants (must match link.tsx)
const UNDERLINE = 1 << 3
const UNDERLINE_DASHED = 1 << 4
const UNDERLINE_DOTTED = 1 << 6
const BASE_ATTR_MASK = 0xff

/** Find the column where link text starts (first non-space char) */
function findTextStart(screen: any, row = 0): number {
  const line = screen.line(row)
  for (let i = 0; i < line.length; i++) {
    if (line[i] !== " ") return i
  }
  return 0
}

describe("Link behavior", () => {
  it("renders children text", () => {
    const { screen } = renderTui(
      <Link url="https://example.com">Click here</Link>,
      { cols: 30, rows: 3 },
    )
    expect(screen.text()).toContain("Click here")
  })

  it("renders with long URL without affecting text", () => {
    const { screen } = renderTui(
      <Link url="https://example.com/very/long/path/to/resource">Link</Link>,
      { cols: 30, rows: 3 },
    )
    expect(screen.text()).toContain("Link")
  })

  it("renders with multi-word children", () => {
    const { screen } = renderTui(
      <Link url="https://opentui.com">Visit OpenTUI Documentation</Link>,
      { cols: 40, rows: 3 },
    )
    expect(screen.text()).toContain("Visit OpenTUI Documentation")
  })

  it("applies solid underline attributes by default", () => {
    const { screen } = renderTui(
      <Link url="https://example.com">Solid</Link>,
      { cols: 30, rows: 3 },
    )
    const col = findTextStart(screen)
    const attrs = screen.attributeAt(0, col) & BASE_ATTR_MASK
    expect(attrs & UNDERLINE).toBe(UNDERLINE)
    expect(attrs & UNDERLINE_DASHED).toBe(0)
    expect(attrs & UNDERLINE_DOTTED).toBe(0)
  })

  it("applies dashed underline attributes", () => {
    const { screen } = renderTui(
      <Link url="https://example.com" underline="dashed">Dashed</Link>,
      { cols: 30, rows: 3 },
    )
    const col = findTextStart(screen)
    const attrs = screen.attributeAt(0, col) & BASE_ATTR_MASK
    expect(attrs & UNDERLINE).toBe(UNDERLINE)
    expect(attrs & UNDERLINE_DASHED).toBe(UNDERLINE_DASHED)
  })

  it("applies dotted underline attributes", () => {
    const { screen } = renderTui(
      <Link url="https://example.com" underline="dotted">Dotted</Link>,
      { cols: 30, rows: 3 },
    )
    const col = findTextStart(screen)
    const attrs = screen.attributeAt(0, col) & BASE_ATTR_MASK
    expect(attrs & UNDERLINE).toBe(UNDERLINE)
    expect(attrs & UNDERLINE_DOTTED).toBe(UNDERLINE_DOTTED)
  })

  it("clears underline attributes when none", () => {
    const { screen } = renderTui(
      <Link url="https://example.com" underline="none">No underline</Link>,
      { cols: 30, rows: 3 },
    )
    const col = findTextStart(screen)
    const attrs = screen.attributeAt(0, col) & BASE_ATTR_MASK
    expect(attrs & UNDERLINE).toBe(0)
  })

  it("encodes link URL in attributes (link ID in bits 8-31)", () => {
    const { screen } = renderTui(
      <Link url="https://example.com">Linked</Link>,
      { cols: 30, rows: 3 },
    )
    const col = findTextStart(screen)
    const fullAttr = screen.attributeAt(0, col)
    const linkId = fullAttr >>> 8
    expect(linkId).toBeGreaterThan(0)
  })

  it("applies foreground color to link cells", () => {
    const { screen } = renderTui(
      <Link url="https://example.com">Colored</Link>,
      { cols: 30, rows: 3 },
    )
    const col = findTextStart(screen)
    const [r, g, b, a] = screen.fgAt(0, col)
    expect(r + g + b + a).toBeGreaterThan(0)
  })

  it("accepts a custom color override", () => {
    const { screen } = renderTui(
      <Link url="https://example.com" color="cyan">Cyan link</Link>,
      { cols: 30, rows: 3 },
    )
    expect(screen.text()).toContain("Cyan link")
    const col = findTextStart(screen)
    const [r, g, b, a] = screen.fgAt(0, col)
    expect(r + g + b + a).toBeGreaterThan(0)
  })
})
