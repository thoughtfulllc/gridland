import { describe, it, expect } from "vitest"
import { BrowserBuffer } from "./browser-buffer"
import { BrowserTextBuffer } from "./browser-text-buffer"
import { BrowserTextBufferView } from "./browser-text-buffer-view"
import { BrowserSyntaxStyle } from "./browser-syntax-style"
import { RGBA } from "./core-shims/rgba"

describe("Integration", () => {
  it("buffer + text buffer + view pipeline works end-to-end", () => {
    // Create a buffer
    const buffer = BrowserBuffer.create(40, 10, "wcwidth")

    // Create a text buffer with styled content
    const tb = BrowserTextBuffer.create("wcwidth")
    const red = RGBA.fromValues(1, 0, 0, 1)
    const white = RGBA.fromValues(1, 1, 1, 1)
    const transparent = RGBA.fromValues(0, 0, 0, 0)
    tb.setDefaultFg(white)
    tb.setDefaultBg(transparent)
    tb.setStyledText({
      chunks: [
        { __isChunk: true, text: "Hello ", fg: red },
        { __isChunk: true, text: "World" },
      ],
    })

    // Create a view
    const view = BrowserTextBufferView.create(tb)
    view.setWrapMode("word")
    view.setViewport(0, 0, 40, 10)

    // Draw to buffer
    buffer.drawTextBufferView(view, 0, 0)

    // Verify the buffer has the text
    expect(buffer.char[0]).toBe("H".codePointAt(0))
    expect(buffer.char[1]).toBe("e".codePointAt(0))
    expect(buffer.char[5]).toBe(" ".codePointAt(0))
    expect(buffer.char[6]).toBe("W".codePointAt(0))

    // Verify colors - first chars should be red
    expect(buffer.fg[0]).toBe(1) // R
    expect(buffer.fg[1]).toBe(0) // G
    expect(buffer.fg[2]).toBe(0) // B

    // "World" should be white (default)
    const wOffset = 6 * 4
    expect(buffer.fg[wOffset]).toBe(1)
    expect(buffer.fg[wOffset + 1]).toBe(1)
    expect(buffer.fg[wOffset + 2]).toBe(1)
  })

  it("box rendering with title", () => {
    const buffer = BrowserBuffer.create(20, 5, "wcwidth")
    const white = RGBA.fromValues(1, 1, 1, 1)
    const darkBg = RGBA.fromValues(0.1, 0.1, 0.1, 1)

    buffer.drawBox({
      x: 0,
      y: 0,
      width: 20,
      height: 5,
      border: true,
      borderStyle: "rounded",
      borderColor: white,
      backgroundColor: darkBg,
      shouldFill: true,
      title: "Test",
      titleAlignment: "center",
    })

    // Should have rounded corners (╭ = 0x256D)
    expect(buffer.char[0]).toBe(0x256d)
    // Should have title text somewhere on the top row
    const topRow = Array.from(buffer.char.slice(0, 20)).map((c) => String.fromCodePoint(c)).join("")
    expect(topRow).toContain("Test")
  })

  it("SyntaxStyle stub works", () => {
    const style = BrowserSyntaxStyle.create()
    expect(style.registerStyle("test", {})).toBe(0)
    expect(style.getStyleCount()).toBe(0)
    style.destroy()
  })

  it("getSpanLines captures styled text correctly", () => {
    const buffer = BrowserBuffer.create(20, 2, "wcwidth")
    const green = RGBA.fromValues(0, 1, 0, 1)
    const blue = RGBA.fromValues(0, 0, 1, 1)
    const transparent = RGBA.fromValues(0, 0, 0, 0)

    buffer.drawText("Green", 0, 0, green, transparent)
    buffer.drawText("Blue", 0, 1, blue, transparent)

    const lines = buffer.getSpanLines()
    expect(lines.length).toBe(2)

    // First line first span should be green "Green"
    expect(lines[0].spans[0].text.startsWith("Green")).toBe(true)
    expect(lines[0].spans[0].fg.g).toBe(1)

    // Second line should have blue
    expect(lines[1].spans[0].text.startsWith("Blue")).toBe(true)
    expect(lines[1].spans[0].fg.b).toBe(1)
  })
})
