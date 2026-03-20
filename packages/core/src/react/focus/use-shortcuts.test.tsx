// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../../testing/src/index"
import { useFocus } from "./use-focus"
import { useShortcuts } from "./use-shortcuts"
import { useFocusedShortcuts } from "./use-focused-shortcuts"
import { FocusProvider } from "./focus-provider"
import React from "react"

afterEach(() => cleanup())

function FocusableWithShortcuts({ id, autoFocus, shortcuts }: { id: string; autoFocus?: boolean; shortcuts: Array<{ key: string; label: string }> }) {
  const { isFocused, focusId } = useFocus({ id, autoFocus })
  useShortcuts(shortcuts, focusId)
  return <text>{isFocused ? `[${id}:FOCUSED]` : `[${id}]`}</text>
}

function ShortcutsDisplay() {
  const shortcuts = useFocusedShortcuts()
  if (shortcuts.length === 0) return <text>[no-shortcuts]</text>
  return <text>[shortcuts:{shortcuts.map((s) => `${s.key}=${s.label}`).join(",")}]</text>
}

function TestApp({ children }: { children: React.ReactNode }) {
  return <FocusProvider>{children}</FocusProvider>
}

describe("useShortcuts / useFocusedShortcuts", () => {
  it("shortcuts registered by focused component returned by useFocusedShortcuts", () => {
    const { screen, keys, flush } = renderTui(
      <TestApp>
        <FocusableWithShortcuts id="a" autoFocus shortcuts={[{ key: "↑↓", label: "Navigate" }]} />
        <ShortcutsDisplay />
      </TestApp>,
      { cols: 60, rows: 4 },
    )
    flush()
    expect(screen.text()).toContain("[a:FOCUSED]")
    expect(screen.text()).toContain("[shortcuts:↑↓=Navigate]")
  })

  it("focus changes → shortcuts update", () => {
    const { screen, keys, flush } = renderTui(
      <TestApp>
        <FocusableWithShortcuts id="a" shortcuts={[{ key: "enter", label: "Select" }]} />
        <FocusableWithShortcuts id="b" shortcuts={[{ key: "space", label: "Toggle" }]} />
        <ShortcutsDisplay />
      </TestApp>,
      { cols: 80, rows: 4 },
    )

    // Tab to focus first
    keys.tab()
    flush()
    expect(screen.text()).toContain("[shortcuts:enter=Select]")

    // Tab to focus second
    keys.tab()
    flush()
    expect(screen.text()).toContain("[shortcuts:space=Toggle]")
  })

  it("no focused component → empty array", () => {
    const { screen } = renderTui(
      <TestApp>
        <FocusableWithShortcuts id="a" shortcuts={[{ key: "enter", label: "Select" }]} />
        <ShortcutsDisplay />
      </TestApp>,
      { cols: 60, rows: 4 },
    )
    expect(screen.text()).toContain("[no-shortcuts]")
  })
})
