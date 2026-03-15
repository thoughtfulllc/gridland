import { describe, it, expect } from "bun:test"
import { BrowserBuffer } from "../browser-buffer"
import { bufferToText } from "../buffer-to-text"
import { RGBA } from "@gridland/utils"

const transparent = RGBA.fromValues(0, 0, 0, 0)
const white = RGBA.fromValues(1, 1, 1, 1)

describe("bufferToText", () => {
  it("converts an empty buffer to empty string", () => {
    const buffer = BrowserBuffer.create(10, 3, "wcwidth")
    buffer.clear()
    // After clear, chars are 0x20 (space), which trimEnd will strip
    expect(bufferToText(buffer)).toBe("")
  })

  it("converts buffer with text to string", () => {
    const buffer = BrowserBuffer.create(20, 3, "wcwidth")
    buffer.clear()
    buffer.drawText("Hello", 0, 0, white, transparent)
    buffer.drawText("World", 0, 1, white, transparent)

    const text = bufferToText(buffer)
    expect(text).toBe("Hello\nWorld")
  })

  it("trims trailing spaces on each line", () => {
    const buffer = BrowserBuffer.create(20, 2, "wcwidth")
    buffer.clear()
    buffer.drawText("Hi", 0, 0, white, transparent)
    buffer.drawText("Bye", 5, 1, white, transparent)

    const text = bufferToText(buffer)
    const lines = text.split("\n")
    expect(lines[0]).toBe("Hi")
    expect(lines[1]).toBe("     Bye")
  })

  it("trims trailing empty lines", () => {
    const buffer = BrowserBuffer.create(10, 5, "wcwidth")
    buffer.clear()
    buffer.drawText("Top", 0, 0, white, transparent)
    // Rows 1-4 are empty

    const text = bufferToText(buffer)
    expect(text).toBe("Top")
  })

  it("preserves internal empty lines", () => {
    const buffer = BrowserBuffer.create(10, 5, "wcwidth")
    buffer.clear()
    buffer.drawText("A", 0, 0, white, transparent)
    // Row 1 is empty
    buffer.drawText("B", 0, 2, white, transparent)

    const text = bufferToText(buffer)
    expect(text).toBe("A\n\nB")
  })

  it("handles null characters (charCode 0) as spaces", () => {
    const buffer = BrowserBuffer.create(5, 1, "wcwidth")
    // Set char[0] to 0 (null) explicitly
    buffer.char[0] = 0
    buffer.char[1] = "A".codePointAt(0)!
    buffer.char[2] = 0
    buffer.char[3] = "B".codePointAt(0)!
    buffer.char[4] = 0x20 // space

    const text = bufferToText(buffer)
    expect(text).toBe(" A B")
  })

  it("handles unicode characters", () => {
    const buffer = BrowserBuffer.create(10, 1, "wcwidth")
    buffer.clear()
    buffer.drawText("╭──╮", 0, 0, white, transparent)

    const text = bufferToText(buffer)
    expect(text).toContain("╭")
    expect(text).toContain("╮")
  })

  it("handles a 1x1 buffer", () => {
    const buffer = BrowserBuffer.create(1, 1, "wcwidth")
    buffer.clear()
    buffer.drawText("X", 0, 0, white, transparent)

    const text = bufferToText(buffer)
    expect(text).toBe("X")
  })

  it("returns empty string when all lines are empty", () => {
    const buffer = BrowserBuffer.create(5, 3, "wcwidth")
    buffer.clear()
    // All spaces
    const text = bufferToText(buffer)
    expect(text).toBe("")
  })
})
