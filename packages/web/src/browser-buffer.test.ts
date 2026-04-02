import { describe, it, expect } from "bun:test"
import { BrowserBuffer } from "./browser-buffer"
import { RGBA } from "@gridland/utils"

const white = RGBA.fromValues(1, 1, 1, 1)
const black = RGBA.fromValues(0, 0, 0, 1)
const red = RGBA.fromValues(1, 0, 0, 1)
const green = RGBA.fromValues(0, 1, 0, 1)
const blue = RGBA.fromValues(0, 0, 1, 1)
const transparent = RGBA.fromValues(0, 0, 0, 0)

describe("BrowserBuffer", () => {
  it("creates with correct dimensions", () => {
    const buf = BrowserBuffer.create(80, 24, "wcwidth")
    expect(buf.width).toBe(80)
    expect(buf.height).toBe(24)
    expect(buf.char.length).toBe(80 * 24)
    expect(buf.fg.length).toBe(80 * 24 * 4)
  })

  it("fills with space on creation", () => {
    const buf = BrowserBuffer.create(10, 5, "wcwidth")
    // All chars should be space (0x20)
    for (let i = 0; i < buf.char.length; i++) {
      expect(buf.char[i]).toBe(0x20)
    }
  })

  it("clears with background color", () => {
    const buf = BrowserBuffer.create(10, 5, "wcwidth")
    buf.clear(red)
    for (let i = 0; i < 50; i++) {
      expect(buf.char[i]).toBe(0x20)
      expect(buf.bg[i * 4]).toBe(1) // R
      expect(buf.bg[i * 4 + 1]).toBe(0) // G
      expect(buf.bg[i * 4 + 2]).toBe(0) // B
      expect(buf.bg[i * 4 + 3]).toBe(1) // A
    }
  })

  it("sets a cell", () => {
    const buf = BrowserBuffer.create(10, 5, "wcwidth")
    buf.setCell(3, 2, "A", white, black, 0)
    const idx = 2 * 10 + 3
    expect(buf.char[idx]).toBe(65) // 'A'
    expect(buf.fg[idx * 4]).toBe(1) // white R
    expect(buf.bg[idx * 4]).toBe(0) // black R
    expect(buf.bg[idx * 4 + 3]).toBe(1) // black A
  })

  it("ignores out-of-bounds setCell", () => {
    const buf = BrowserBuffer.create(10, 5, "wcwidth")
    buf.setCell(-1, 0, "X", white, black)
    buf.setCell(10, 0, "X", white, black)
    buf.setCell(0, -1, "X", white, black)
    buf.setCell(0, 5, "X", white, black)
    // Should not crash and all cells remain space
    expect(buf.char[0]).toBe(0x20)
  })

  it("draws text", () => {
    const buf = BrowserBuffer.create(20, 5, "wcwidth")
    buf.drawText("Hello", 2, 1, green, black)
    expect(buf.char[1 * 20 + 2]).toBe("H".codePointAt(0)!)
    expect(buf.char[1 * 20 + 3]).toBe("e".codePointAt(0)!)
    expect(buf.char[1 * 20 + 4]).toBe("l".codePointAt(0)!)
    expect(buf.char[1 * 20 + 5]).toBe("l".codePointAt(0)!)
    expect(buf.char[1 * 20 + 6]).toBe("o".codePointAt(0)!)
    // Check fg is green
    const offset = (1 * 20 + 2) * 4
    expect(buf.fg[offset]).toBe(0) // R
    expect(buf.fg[offset + 1]).toBe(1) // G
  })

  it("fills a rect", () => {
    const buf = BrowserBuffer.create(10, 5, "wcwidth")
    buf.fillRect(2, 1, 3, 2, blue)
    for (let row = 1; row <= 2; row++) {
      for (let col = 2; col <= 4; col++) {
        const idx = row * 10 + col
        expect(buf.bg[idx * 4 + 2]).toBe(1) // B
        expect(buf.char[idx]).toBe(0x20) // space
      }
    }
  })

  it("draws a box with borders", () => {
    const buf = BrowserBuffer.create(20, 10, "wcwidth")
    buf.drawBox({
      x: 0,
      y: 0,
      width: 10,
      height: 5,
      border: true,
      borderStyle: "single",
      borderColor: white,
      backgroundColor: black,
      shouldFill: true,
    })

    // Top-left corner should be box-drawing char (single style: ┌ = 0x250C)
    expect(buf.char[0]).toBe(0x250c)
    // Top-right corner (┐ = 0x2510)
    expect(buf.char[9]).toBe(0x2510)
    // Bottom-left corner (└ = 0x2514)
    expect(buf.char[4 * 20]).toBe(0x2514)
    // Horizontal border (─ = 0x2500)
    expect(buf.char[1]).toBe(0x2500)
    // Vertical border (│ = 0x2502)
    expect(buf.char[1 * 20]).toBe(0x2502)
  })

  it("respects scissor rect", () => {
    const buf = BrowserBuffer.create(10, 5, "wcwidth")
    buf.pushScissorRect(2, 1, 3, 2)
    buf.setCell(0, 0, "X", white, black) // outside scissor — should be ignored
    buf.setCell(3, 1, "Y", white, black) // inside scissor — should work
    buf.popScissorRect()

    expect(buf.char[0]).toBe(0x20) // not set
    expect(buf.char[1 * 10 + 3]).toBe("Y".codePointAt(0)!) // set
  })

  it("supports nested scissor rects (intersection)", () => {
    const buf = BrowserBuffer.create(10, 5, "wcwidth")
    buf.pushScissorRect(1, 1, 5, 3)
    buf.pushScissorRect(3, 2, 5, 3)
    // Intersection: x=3..5, y=2..3
    buf.setCell(2, 2, "A", white, black) // outside intersection
    buf.setCell(3, 2, "B", white, black) // inside intersection
    buf.popScissorRect()
    buf.popScissorRect()

    expect(buf.char[2 * 10 + 2]).toBe(0x20) // not set
    expect(buf.char[2 * 10 + 3]).toBe("B".codePointAt(0)!) // set
  })

  it("roundedBackground has no clipRect when no scissor is active", () => {
    const buf = BrowserBuffer.create(20, 10, "wcwidth")
    buf.drawBox({
      x: 2, y: 1, width: 8, height: 4,
      border: false, borderStyle: "single",
      borderColor: white, backgroundColor: blue,
      shouldFill: true, borderRadius: 8,
    })

    expect(buf.roundedBackgrounds.length).toBe(1)
    expect(buf.roundedBackgrounds[0].clipRect).toBeUndefined()
  })

  it("roundedBackground gets clipRect when scissor is active", () => {
    const buf = BrowserBuffer.create(20, 10, "wcwidth")
    buf.pushScissorRect(1, 1, 10, 6)
    buf.drawBox({
      x: 2, y: 2, width: 6, height: 3,
      border: false, borderStyle: "single",
      borderColor: white, backgroundColor: blue,
      shouldFill: true, borderRadius: 8,
    })
    buf.popScissorRect()

    expect(buf.roundedBackgrounds.length).toBe(1)
    expect(buf.roundedBackgrounds[0].clipRect).toEqual({ x: 1, y: 1, width: 10, height: 6 })
  })

  it("fully-clipped roundedBackground is not pushed", () => {
    const buf = BrowserBuffer.create(20, 10, "wcwidth")
    buf.pushScissorRect(0, 0, 5, 5)
    // Draw box entirely outside the scissor
    buf.drawBox({
      x: 10, y: 6, width: 6, height: 3,
      border: false, borderStyle: "single",
      borderColor: white, backgroundColor: blue,
      shouldFill: true, borderRadius: 8,
    })
    buf.popScissorRect()

    expect(buf.roundedBackgrounds.length).toBe(0)
  })

  it("nested scissors produce intersected clipRect for roundedBackground", () => {
    const buf = BrowserBuffer.create(20, 10, "wcwidth")
    buf.pushScissorRect(1, 1, 15, 8)
    buf.pushScissorRect(3, 2, 10, 5)
    // Intersection: x=3, y=2, width=10, height=5
    buf.drawBox({
      x: 4, y: 3, width: 5, height: 3,
      border: false, borderStyle: "single",
      borderColor: white, backgroundColor: blue,
      shouldFill: true, borderRadius: 8,
    })
    buf.popScissorRect()
    buf.popScissorRect()

    expect(buf.roundedBackgrounds.length).toBe(1)
    expect(buf.roundedBackgrounds[0].clipRect).toEqual({ x: 3, y: 2, width: 10, height: 5 })
  })

  it("applies opacity", () => {
    const buf = BrowserBuffer.create(10, 5, "wcwidth")
    buf.pushOpacity(0.5)
    buf.setCell(0, 0, "X", RGBA.fromValues(1, 1, 1, 1), RGBA.fromValues(0, 0, 0, 1))
    buf.popOpacity()

    const offset = 0
    expect(buf.fg[offset * 4 + 3]).toBeCloseTo(0.5) // fg alpha halved
    expect(buf.bg[offset * 4 + 3]).toBeCloseTo(0.5) // bg alpha halved
  })

  it("resizes correctly", () => {
    const buf = BrowserBuffer.create(10, 5, "wcwidth")
    buf.setCell(0, 0, "A", white, black)
    buf.resize(20, 10)
    expect(buf.width).toBe(20)
    expect(buf.height).toBe(10)
    expect(buf.char.length).toBe(200)
    // After resize, buffer is cleared
    expect(buf.char[0]).toBe(0x20)
  })

  it("getSpanLines returns correct spans", () => {
    const buf = BrowserBuffer.create(5, 1, "wcwidth")
    buf.drawText("Hi", 0, 0, red, black)
    const lines = buf.getSpanLines()
    expect(lines.length).toBe(1)
    expect(lines[0].spans.length).toBeGreaterThanOrEqual(1)
    // First span should contain "Hi"
    const firstSpan = lines[0].spans[0]
    expect(firstSpan.text).toBe("Hi")
    expect(firstSpan.fg.r).toBe(1)
    expect(firstSpan.fg.g).toBe(0)
  })
})
