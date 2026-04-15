// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../../testing/src/index"
import { useInteractive } from "../interactive/use-interactive"
import { useShortcuts } from "./use-shortcuts"
import { useFocusedShortcuts } from "./use-focused-shortcuts"
import { FocusProvider } from "./focus-provider"
import React from "react"

afterEach(() => cleanup())

function FocusableWithShortcuts({ id, autoFocus, shortcuts }: { id: string; autoFocus?: boolean; shortcuts: Array<{ key: string; label: string }> }) {
  const { isFocused, focusId } = useInteractive({ id, autoFocus })
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

  // Load-bearing guard regression test. `useShortcuts([], focusId)` MUST NOT
  // dispatch SET_SHORTCUTS and MUST NOT clear a prior non-empty registration
  // under the same focusId. This invariant allows `useInteractive({ id })`
  // in pure observer mode (display wrapper sharing a focusId with an
  // interactive child) to be safe — the observer's empty-shortcut call is a
  // dispatch-level no-op. If this test ever fails, the shared-focusId
  // wrapper pattern documented in .claude/rules/focus-system.md breaks.
  it("empty-array-no-op: empty shortcuts does not clear a prior non-empty registration", () => {
    // Inner component owns the real shortcuts and the focusId.
    function Inner() {
      const { focusId, isFocused } = useInteractive({ id: "shared", autoFocus: true })
      useShortcuts([{ key: "enter", label: "Submit" }], focusId)
      return <text>{isFocused ? "[inner:FOCUSED]" : "[inner]"}</text>
    }
    // Outer "wrapper" shares the same focusId but passes an empty shortcuts
    // array — the exact shape of a display wrapper that routes through
    // `useInteractive({ id })` in observer mode.
    function Wrapper() {
      useShortcuts([], "shared")
      return null
    }

    const { screen, flush } = renderTui(
      <TestApp>
        <Wrapper />
        <Inner />
        <ShortcutsDisplay />
      </TestApp>,
      { cols: 80, rows: 4 },
    )
    flush()
    flush()

    // Inner's Submit shortcut must still be the one exposed by
    // useFocusedShortcuts. If Wrapper's empty-array call had dispatched
    // SET_SHORTCUTS, this would collapse to [no-shortcuts].
    expect(screen.text()).toContain("[shortcuts:enter=Submit]")
  })
})
