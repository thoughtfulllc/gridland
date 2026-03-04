import { describe, it, expect } from "bun:test"
import { BrowserTextBuffer } from "../browser-text-buffer"
import { RGBA } from "../core-shims/rgba"

describe("BrowserTextBuffer", () => {
  it("creates via factory", () => {
    const tb = BrowserTextBuffer.create("wcwidth")
    expect(tb.length).toBe(0)
    expect(tb.getPlainText()).toBe("")
  })

  it("setText and getPlainText", () => {
    const tb = BrowserTextBuffer.create("wcwidth")
    tb.setText("Hello World")
    expect(tb.getPlainText()).toBe("Hello World")
    expect(tb.length).toBe(11)
  })

  it("append", () => {
    const tb = BrowserTextBuffer.create("wcwidth")
    tb.setText("Hello")
    tb.append(" World")
    expect(tb.getPlainText()).toBe("Hello World")
  })

  it("getLineCount", () => {
    const tb = BrowserTextBuffer.create("wcwidth")
    tb.setText("line1\nline2\nline3")
    expect(tb.getLineCount()).toBe(3)
  })

  it("setStyledText", () => {
    const tb = BrowserTextBuffer.create("wcwidth")
    const red = RGBA.fromValues(1, 0, 0, 1)
    tb.setStyledText({
      chunks: [
        { __isChunk: true, text: "Red", fg: red },
        { __isChunk: true, text: " Normal" },
      ],
    })
    expect(tb.getPlainText()).toBe("Red Normal")
    const chunks = tb.getChunks()
    expect(chunks.length).toBe(2)
    expect(chunks[0].fg?.r).toBe(1)
  })

  it("setDefaultFg/Bg/Attributes", () => {
    const tb = BrowserTextBuffer.create("wcwidth")
    const green = RGBA.fromValues(0, 1, 0, 1)
    tb.setDefaultFg(green)
    tb.setText("test")
    const chunks = tb.getChunks()
    expect(chunks[0].fg?.g).toBe(1)
  })

  it("clear and reset", () => {
    const tb = BrowserTextBuffer.create("wcwidth")
    tb.setText("test")
    tb.clear()
    expect(tb.getPlainText()).toBe("")
    expect(tb.length).toBe(0)
  })

  it("byteSize", () => {
    const tb = BrowserTextBuffer.create("wcwidth")
    tb.setText("abc")
    expect(tb.byteSize).toBe(3)
  })

  it("ptr is non-zero", () => {
    const tb = BrowserTextBuffer.create("wcwidth")
    expect(tb.ptr).toBe(1) // Non-zero so TextBufferRenderable proceeds
  })
})
