import { describe, it, expect } from "bun:test"
import { BrowserTextBuffer } from "../browser-text-buffer"
import { BrowserTextBufferView } from "../browser-text-buffer-view"
import { RGBA } from "../core-shims/rgba"

describe("BrowserTextBufferView", () => {
  function createView(text: string) {
    const tb = BrowserTextBuffer.create("wcwidth")
    tb.setText(text)
    const view = BrowserTextBufferView.create(tb)
    return { tb, view }
  }

  it("creates from text buffer", () => {
    const { view } = createView("Hello")
    expect(view.ptr).toBe(1)
  })

  it("measureForDimensions with no wrapping", () => {
    const { view } = createView("Hello World")
    view.setWrapMode("none")
    const result = view.measureForDimensions(0, 1)
    expect(result).not.toBeNull()
    expect(result!.lineCount).toBe(1)
    expect(result!.maxWidth).toBe(11)
  })

  it("measureForDimensions with word wrap", () => {
    const { view } = createView("Hello World Test")
    view.setWrapMode("word")
    const result = view.measureForDimensions(8, 10)
    expect(result).not.toBeNull()
    // "Hello " wraps, then "World " wraps, then "Test"
    expect(result!.lineCount).toBeGreaterThan(1)
  })

  it("measureForDimensions with char wrap", () => {
    const { view } = createView("ABCDEFGHIJ")
    view.setWrapMode("char")
    const result = view.measureForDimensions(5, 10)
    expect(result).not.toBeNull()
    expect(result!.lineCount).toBe(2) // 5 + 5
    expect(result!.maxWidth).toBe(5)
  })

  it("getVisibleLines returns correct data", () => {
    const { view, tb } = createView("Line 1\nLine 2\nLine 3")
    tb.setDefaultFg(RGBA.fromValues(1, 1, 1, 1))
    tb.setText("Line 1\nLine 2\nLine 3")
    view.setViewport(0, 0, 20, 10)
    const lines = view.getVisibleLines()
    expect(lines).not.toBeNull()
    expect(lines!.length).toBe(3)
    expect(lines![0].chunks[0].text).toBe("Line 1")
    expect(lines![1].chunks[0].text).toBe("Line 2")
    expect(lines![2].chunks[0].text).toBe("Line 3")
  })

  it("viewport scrolling", () => {
    const { view, tb } = createView("")
    tb.setText("Line 0\nLine 1\nLine 2\nLine 3\nLine 4")
    view.setViewport(0, 2, 20, 2)
    const lines = view.getVisibleLines()
    expect(lines).not.toBeNull()
    expect(lines!.length).toBe(2)
    expect(lines![0].chunks[0].text).toBe("Line 2")
    expect(lines![1].chunks[0].text).toBe("Line 3")
  })

  it("getVirtualLineCount", () => {
    const { view } = createView("A\nB\nC")
    view.setWrapMode("none")
    expect(view.getVirtualLineCount()).toBe(3)
  })

  it("selection", () => {
    const { view } = createView("Hello World")
    expect(view.hasSelection()).toBe(false)
    view.setSelection(0, 5)
    expect(view.hasSelection()).toBe(true)
    expect(view.getSelectedText()).toBe("Hello")
    view.resetSelection()
    expect(view.hasSelection()).toBe(false)
  })
})
