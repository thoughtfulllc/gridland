import { describe, it, expect } from "bun:test"
import { Screen } from "../src/screen"
import { BrowserBuffer } from "../../polyterm-web/src/browser-buffer"
import { RGBA } from "../../polyterm-web/src/core-shims/rgba"

const white = RGBA.fromValues(1, 1, 1, 1)
const black = RGBA.fromValues(0, 0, 0, 1)

function createBufferWithText(cols: number, rows: number, texts: { text: string; x: number; y: number }[]) {
  const buf = BrowserBuffer.create(cols, rows, "wcwidth")
  for (const t of texts) {
    buf.drawText(t.text, t.x, t.y, white, black)
  }
  return buf
}

describe("Screen", () => {
  it("reads text from buffer", () => {
    const buf = createBufferWithText(20, 5, [{ text: "Hello World", x: 0, y: 0 }])
    const screen = new Screen(buf)
    expect(screen.text()).toContain("Hello World")
  })

  it("contains checks for text presence", () => {
    const buf = createBufferWithText(20, 5, [{ text: "Hello", x: 0, y: 0 }])
    const screen = new Screen(buf)
    expect(screen.contains("Hello")).toBe(true)
    expect(screen.contains("Goodbye")).toBe(false)
  })

  it("matches works with regex", () => {
    const buf = createBufferWithText(20, 5, [{ text: "Count: 42", x: 0, y: 0 }])
    const screen = new Screen(buf)
    expect(screen.matches(/Count: \d+/)).toBe(true)
    expect(screen.matches(/Error/)).toBe(false)
  })

  it("line returns specific line", () => {
    const buf = createBufferWithText(20, 5, [
      { text: "Line 0", x: 0, y: 0 },
      { text: "Line 1", x: 0, y: 1 },
      { text: "Line 2", x: 0, y: 2 },
    ])
    const screen = new Screen(buf)
    expect(screen.line(0)).toContain("Line 0")
    expect(screen.line(1)).toContain("Line 1")
    expect(screen.line(2)).toContain("Line 2")
  })

  it("lines returns non-empty lines", () => {
    const buf = createBufferWithText(20, 5, [
      { text: "A", x: 0, y: 0 },
      { text: "B", x: 0, y: 2 },
    ])
    const screen = new Screen(buf)
    const lines = screen.lines()
    expect(lines.length).toBe(2)
  })

  it("captures frames", () => {
    const buf = BrowserBuffer.create(10, 3, "wcwidth")
    const screen = new Screen(buf)

    buf.drawText("Frame1", 0, 0, white, black)
    screen.captureFrame()

    buf.clear()
    buf.drawText("Frame2", 0, 0, white, black)
    screen.captureFrame()

    expect(screen.frames().length).toBe(2)
    expect(screen.frames()[0]).toContain("Frame1")
    expect(screen.frames()[1]).toContain("Frame2")
  })

  it("rawText preserves spaces", () => {
    const buf = BrowserBuffer.create(5, 2, "wcwidth")
    buf.drawText("Hi", 0, 0, white, black)
    const screen = new Screen(buf)
    const raw = screen.rawText()
    // First line should be exactly 5 chars
    expect(raw.split("\n")[0].length).toBe(5)
  })

  it("width and height match buffer", () => {
    const buf = BrowserBuffer.create(40, 12, "wcwidth")
    const screen = new Screen(buf)
    expect(screen.width).toBe(40)
    expect(screen.height).toBe(12)
  })
})
