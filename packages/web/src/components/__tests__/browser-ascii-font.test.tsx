import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test"
import { OptimizedBuffer } from "../../../../core/src/buffer"
import { BrowserRenderContext } from "../../browser-render-context"
import type { RenderContext } from "../../../../core/src/types"
import { BrowserAsciiFontRenderable } from "../browser-ascii-font"

// Phase 3 spec tests from tasks/003-browser-compat-contract.md §6 Phase 3.
// Contract under test: BrowserAsciiFontRenderable renders ascii-font glyphs
// into a BrowserBuffer without ever touching OptimizedBuffer.create or
// resolveRenderLib. Construction is free (no buffer allocation); rendering
// delegates to renderFontToFrameBuffer against the destination buffer at
// (this.x + glyphOffset, this.y + glyphRow).

describe("BrowserAsciiFontRenderable", () => {
  let ctx: RenderContext
  let dest: ReturnType<typeof OptimizedBuffer.create>
  let createSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    ctx = new BrowserRenderContext(80, 24) as unknown as RenderContext
    dest = OptimizedBuffer.create(80, 24, ctx.widthMethod)
    createSpy = spyOn(OptimizedBuffer, "create")
  })

  afterEach(() => {
    createSpy.mockRestore()
  })

  test("constructor does not allocate a buffer", () => {
    new BrowserAsciiFontRenderable(ctx, { text: "hi", font: "tiny" })
    expect(createSpy).not.toHaveBeenCalled()
  })

  test("constructor does not call resolveRenderLib", () => {
    // In this test env, resolveRenderLib is shimmed to throw from packages/web/test/preload.ts.
    // The browser renderable must never reach it — so simply constructing without
    // crashing is the contract. We use expect().not.toThrow() to pin the assertion.
    expect(() => new BrowserAsciiFontRenderable(ctx, { text: "hi", font: "tiny" })).not.toThrow()
  })

  test("width and height derive from measureText(text, font)", () => {
    const r = new BrowserAsciiFontRenderable(ctx, { text: "AB", font: "tiny" })
    // measureText("AB", "tiny") should produce finite positive dims.
    expect(r.width).toBeGreaterThan(0)
    expect(r.height).toBeGreaterThan(0)

    // Changing text should change width (AB → HELLO is visually wider).
    const r2 = new BrowserAsciiFontRenderable(ctx, { text: "HELLO", font: "tiny" })
    expect(r2.width).toBeGreaterThan(r.width)
  })

  test('renders "hi" in tiny font into the destination buffer', () => {
    const r = new BrowserAsciiFontRenderable(ctx, { text: "hi", font: "tiny" })
    r.render(dest, 0)

    // At least one non-space, non-zero cell in the destination's top rows
    // (the renderable is at origin (0,0) so its glyphs land in the first
    // few rows/cols).
    const nonSpaceCells = countNonSpace(dest)
    expect(nonSpaceCells).toBeGreaterThan(0)
  })

  test("renders all 7 built-in fonts with non-empty output", () => {
    const fontNames = ["tiny", "block", "shade", "slick", "huge", "grid", "pallet"] as const
    for (const font of fontNames) {
      const freshDest = OptimizedBuffer.create(80, 24, ctx.widthMethod)
      const r = new BrowserAsciiFontRenderable(ctx, { text: "HI", font })
      r.render(freshDest, 0)
      const nonSpace = countNonSpace(freshDest)
      expect({ font, nonSpace }).toEqual({ font, nonSpace: expect.any(Number) })
      expect(nonSpace).toBeGreaterThan(0)
    }
  })

  test("empty text produces zero non-space cells", () => {
    const r = new BrowserAsciiFontRenderable(ctx, { text: "", font: "tiny" })
    r.render(dest, 0)
    expect(countNonSpace(dest)).toBe(0)
  })

  test("clipping at right edge does not write past buffer width", () => {
    // Destination is 80 wide. Construct renderable at origin with text so
    // long it would overflow. The underlying renderFontToFrameBuffer bounds-
    // checks each setCellWithAlphaBlending call; the test asserts no cells
    // outside [0, width) were written.
    const longText = "HELLO WORLD HELLO WORLD HELLO WORLD HELLO WORLD HELLO WORLD"
    const r = new BrowserAsciiFontRenderable(ctx, { text: longText, font: "tiny" })
    r.render(dest, 0)

    // Any cell at column >= 80 would indicate an overflow; impossible given
    // the buffer dimensions, but we assert via setCell-spy to be certain.
    const setCellSpy = spyOn(OptimizedBuffer.prototype, "setCellWithAlphaBlending")
    const dest2 = OptimizedBuffer.create(80, 24, ctx.widthMethod)
    const r2 = new BrowserAsciiFontRenderable(ctx, { text: longText, font: "tiny" })
    r2.render(dest2, 0)
    for (const call of setCellSpy.mock.calls) {
      const [x, y] = call as [number, number, string, unknown, unknown, number?]
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(80)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThan(24)
    }
    setCellSpy.mockRestore()
  })

  test("clipping at bottom edge does not write past buffer height", () => {
    // Use a short dest buffer — 3 rows total — and a font whose glyph rows
    // exceed that. renderFontToFrameBuffer returns without drawing anything
    // when y + fontDef.lines > height, so for block (6 rows) against a
    // 3-row buffer we expect zero writes.
    const shortDest = OptimizedBuffer.create(40, 3, ctx.widthMethod)
    const setCellSpy = spyOn(OptimizedBuffer.prototype, "setCellWithAlphaBlending")
    const r = new BrowserAsciiFontRenderable(ctx, { text: "HI", font: "block" })
    r.render(shortDest, 0)
    for (const call of setCellSpy.mock.calls) {
      const [, y] = call as [number, number, string, unknown, unknown, number?]
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThan(3)
    }
    setCellSpy.mockRestore()
  })

  test("text prop change renders new glyph data on next render", () => {
    const r = new BrowserAsciiFontRenderable(ctx, { text: "HI", font: "tiny" })
    r.render(dest, 0)
    const beforeCells = snapshotChars(dest)

    const dest2 = OptimizedBuffer.create(80, 24, ctx.widthMethod)
    r.text = "XY"
    r.render(dest2, 0)
    const afterCells = snapshotChars(dest2)

    // "HI" and "XY" in tiny font use different glyphs — some cells must
    // differ between the two renders (non-vacuous assertion: both renders
    // produced non-empty output first).
    const beforeNonSpace = beforeCells.filter((c) => c !== 0 && c !== 0x20).length
    const afterNonSpace = afterCells.filter((c) => c !== 0 && c !== 0x20).length
    expect(beforeNonSpace).toBeGreaterThan(0)
    expect(afterNonSpace).toBeGreaterThan(0)

    const differ = beforeCells.some((c, i) => c !== afterCells[i])
    expect(differ).toBe(true)
  })
})

function countNonSpace(buffer: { char: Uint32Array }): number {
  let count = 0
  for (let i = 0; i < buffer.char.length; i++) {
    const c = buffer.char[i]
    if (c !== 0 && c !== 0x20) count++
  }
  return count
}

function snapshotChars(buffer: { char: Uint32Array }): number[] {
  return Array.from(buffer.char)
}
