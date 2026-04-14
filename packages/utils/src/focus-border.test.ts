import { describe, it, expect } from "bun:test"
import {
  getFocusBorderStyle,
  getFocusDividerStyle,
  FOCUS_BORDER_COLORS,
  type FocusBorderColors,
} from "./focus-border"

const customColors: FocusBorderColors = {
  selected: "#aaaaaa",
  focused: "#bbbbbb",
  idle: "#cccccc",
}

describe("getFocusBorderStyle", () => {
  it("selected → selected color, rounded", () => {
    const result = getFocusBorderStyle({ isFocused: true, isSelected: true, isAnySelected: true })
    expect(result.borderColor).toBe(FOCUS_BORDER_COLORS.selected)
    expect(result.borderStyle).toBe("rounded")
  })

  it("sibling selected → transparent, rounded (hides border)", () => {
    const result = getFocusBorderStyle({ isFocused: false, isSelected: false, isAnySelected: true })
    expect(result.borderColor).toBe("transparent")
    expect(result.borderStyle).toBe("rounded")
  })

  it("focused (not selected) → focused color, dashed", () => {
    const result = getFocusBorderStyle({ isFocused: true, isSelected: false, isAnySelected: false })
    expect(result.borderColor).toBe(FOCUS_BORDER_COLORS.focused)
    expect(result.borderStyle).toBe("dashed")
  })

  it("idle → idle color, rounded", () => {
    const result = getFocusBorderStyle({ isFocused: false, isSelected: false, isAnySelected: false })
    expect(result.borderColor).toBe(FOCUS_BORDER_COLORS.idle)
    expect(result.borderStyle).toBe("rounded")
  })

  it("selected takes priority over focused", () => {
    const result = getFocusBorderStyle({ isFocused: true, isSelected: true, isAnySelected: false })
    expect(result.borderColor).toBe(FOCUS_BORDER_COLORS.selected)
    expect(result.borderStyle).toBe("rounded")
  })

  it("custom colors are honored for every state", () => {
    expect(getFocusBorderStyle({ isFocused: false, isSelected: true, isAnySelected: true }, customColors).borderColor).toBe("#aaaaaa")
    expect(getFocusBorderStyle({ isFocused: true, isSelected: false, isAnySelected: false }, customColors).borderColor).toBe("#bbbbbb")
    expect(getFocusBorderStyle({ isFocused: false, isSelected: false, isAnySelected: false }, customColors).borderColor).toBe("#cccccc")
    // Sibling-selected always returns transparent regardless of palette
    expect(getFocusBorderStyle({ isFocused: false, isSelected: false, isAnySelected: true }, customColors).borderColor).toBe("transparent")
  })
})

describe("getFocusDividerStyle", () => {
  it("selected → selected color, not dashed", () => {
    const result = getFocusDividerStyle({ isFocused: true, isSelected: true, isAnySelected: true })
    expect(result.dividerColor).toBe(FOCUS_BORDER_COLORS.selected)
    expect(result.dividerDashed).toBe(false)
  })

  it("sibling selected → undefined (lets default design divider show), not dashed", () => {
    const result = getFocusDividerStyle({ isFocused: false, isSelected: false, isAnySelected: true })
    expect(result.dividerColor).toBeUndefined()
    expect(result.dividerDashed).toBe(false)
  })

  it("focused (not selected, no sibling selected) → focused color, dashed", () => {
    const result = getFocusDividerStyle({ isFocused: true, isSelected: false, isAnySelected: false })
    expect(result.dividerColor).toBe(FOCUS_BORDER_COLORS.focused)
    expect(result.dividerDashed).toBe(true)
  })

  it("idle → idle color, not dashed", () => {
    const result = getFocusDividerStyle({ isFocused: false, isSelected: false, isAnySelected: false })
    expect(result.dividerColor).toBe(FOCUS_BORDER_COLORS.idle)
    expect(result.dividerDashed).toBe(false)
  })

  it("focused + sibling-selected → undefined wins over focused (dashed false)", () => {
    const result = getFocusDividerStyle({ isFocused: true, isSelected: false, isAnySelected: true })
    expect(result.dividerColor).toBeUndefined()
    expect(result.dividerDashed).toBe(false)
  })

  it("custom colors are honored for every state", () => {
    expect(getFocusDividerStyle({ isFocused: false, isSelected: true, isAnySelected: true }, customColors).dividerColor).toBe("#aaaaaa")
    expect(getFocusDividerStyle({ isFocused: true, isSelected: false, isAnySelected: false }, customColors).dividerColor).toBe("#bbbbbb")
    expect(getFocusDividerStyle({ isFocused: false, isSelected: false, isAnySelected: false }, customColors).dividerColor).toBe("#cccccc")
  })
})
