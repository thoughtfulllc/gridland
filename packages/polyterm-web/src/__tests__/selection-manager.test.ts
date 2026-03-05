import { describe, it, expect } from "bun:test"
import { SelectionManager } from "../selection-manager"
import { BrowserBuffer } from "../browser-buffer"
import { RGBA } from "../core-shims/rgba"

const white = RGBA.fromValues(1, 1, 1, 1)
const black = RGBA.fromValues(0, 0, 0, 1)

describe("SelectionManager", () => {
  it("starts inactive", () => {
    const sel = new SelectionManager()
    expect(sel.active).toBe(false)
    expect(sel.selecting).toBe(false)
  })

  it("starts and ends a selection", () => {
    const sel = new SelectionManager()
    sel.startSelection(5, 3)
    expect(sel.selecting).toBe(true)
    expect(sel.active).toBe(true)

    sel.updateSelection(10, 3)
    sel.endSelection()

    expect(sel.selecting).toBe(false)
    expect(sel.active).toBe(true)
  })

  it("clears selection when start equals end", () => {
    const sel = new SelectionManager()
    sel.startSelection(5, 3)
    sel.endSelection()
    expect(sel.active).toBe(false)
  })

  it("isSelected works for single-line selection", () => {
    const sel = new SelectionManager()
    sel.startSelection(2, 1)
    sel.updateSelection(5, 1)
    sel.endSelection()

    expect(sel.isSelected(1, 1)).toBe(false)
    expect(sel.isSelected(2, 1)).toBe(true)
    expect(sel.isSelected(4, 1)).toBe(true)
    expect(sel.isSelected(5, 1)).toBe(false) // end is exclusive
    expect(sel.isSelected(3, 0)).toBe(false) // wrong row
  })

  it("isSelected works for multi-line selection", () => {
    const sel = new SelectionManager()
    sel.startSelection(5, 1)
    sel.updateSelection(3, 3)
    sel.endSelection()

    expect(sel.isSelected(5, 1)).toBe(true) // start col
    expect(sel.isSelected(9, 1)).toBe(true) // after start col on start row
    expect(sel.isSelected(0, 2)).toBe(true) // middle row
    expect(sel.isSelected(2, 3)).toBe(true) // before end col on end row
    expect(sel.isSelected(3, 3)).toBe(false) // at end col (exclusive)
    expect(sel.isSelected(0, 0)).toBe(false) // before selection
    expect(sel.isSelected(0, 4)).toBe(false) // after selection
  })

  it("handles reverse selection (end before start)", () => {
    const sel = new SelectionManager()
    sel.startSelection(5, 3)
    sel.updateSelection(2, 1)
    sel.endSelection()

    // Should normalize
    expect(sel.isSelected(2, 1)).toBe(true)
    expect(sel.isSelected(4, 3)).toBe(true)
    expect(sel.isSelected(5, 3)).toBe(false)
  })

  it("getSelectedText extracts text from buffer", () => {
    const buf = BrowserBuffer.create(10, 3, "wcwidth")
    buf.drawText("Hello", 0, 0, white, black)
    buf.drawText("World", 0, 1, white, black)
    buf.drawText("Test!", 0, 2, white, black)

    const sel = new SelectionManager()
    sel.startSelection(0, 0)
    sel.updateSelection(5, 0)
    sel.endSelection()

    const text = sel.getSelectedText(buf)
    expect(text).toBe("Hello")
  })

  it("getSelectedText across multiple lines", () => {
    const buf = BrowserBuffer.create(10, 3, "wcwidth")
    buf.drawText("Hello", 0, 0, white, black)
    buf.drawText("World", 0, 1, white, black)

    const sel = new SelectionManager()
    sel.startSelection(0, 0)
    sel.updateSelection(5, 1)
    sel.endSelection()

    const text = sel.getSelectedText(buf)
    expect(text).toContain("Hello")
    expect(text).toContain("World")
  })

  it("clearSelection deactivates", () => {
    const sel = new SelectionManager()
    sel.startSelection(0, 0)
    sel.updateSelection(5, 0)
    sel.endSelection()
    expect(sel.active).toBe(true)

    sel.clearSelection()
    expect(sel.active).toBe(false)
    expect(sel.selecting).toBe(false)
  })
})
