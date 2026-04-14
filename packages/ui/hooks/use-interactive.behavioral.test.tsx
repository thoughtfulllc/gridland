// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../testing/src/index"
import { useInteractive } from "./use-interactive"
import { FocusProvider, useFocusedShortcuts } from "@gridland/utils"
import React from "react"

afterEach(() => cleanup())

function flush2(flush: () => void) {
  flush()
  flush()
}

// Renders focus / selection state as a tag: [id:F-] / [id:FS] / [id:--]
function InteractiveTag({ id, autoFocus }: { id: string; autoFocus?: boolean }) {
  const i = useInteractive({ id, autoFocus })
  return (
    <box ref={i.focusRef}>
      <text>
        {`[${i.focusId}:${i.isFocused ? "F" : "-"}${i.isSelected ? "S" : "-"}]`}
      </text>
    </box>
  )
}

describe("useInteractive", () => {
  // ── id ────────────────────────────────────────────────────────────────

  describe("focusId", () => {
    it("uses the provided id when one is given", () => {
      const { screen, flush } = renderTui(
        <FocusProvider selectable>
          <InteractiveTag id="foo" />
        </FocusProvider>,
        { cols: 40, rows: 4 },
      )
      flush2(flush)
      expect(screen.text()).toContain("[foo:")
    })

    it("auto-generates a non-empty id when none is provided", () => {
      function X() {
        const { focusId } = useInteractive({})
        return <text>{`id:${focusId}:end`}</text>
      }
      const { screen, flush } = renderTui(
        <FocusProvider>
          <X />
        </FocusProvider>,
        { cols: 40, rows: 4 },
      )
      flush2(flush)
      const match = screen.text().match(/id:(\S+?):end/)
      expect(match).not.toBeNull()
      expect(match![1].length).toBeGreaterThan(0)
    })
  })

  // ── focus / select state ──────────────────────────────────────────────

  describe("focus and selection state", () => {
    it("autoFocus=true focuses the component on mount", () => {
      const { screen, flush } = renderTui(
        <FocusProvider selectable>
          <InteractiveTag id="a" autoFocus />
        </FocusProvider>,
        { cols: 40, rows: 4 },
      )
      flush2(flush)
      expect(screen.text()).toContain("[a:F-]")
    })

    it("is neither focused nor selected by default", () => {
      const { screen, flush } = renderTui(
        <FocusProvider selectable>
          <InteractiveTag id="a" />
        </FocusProvider>,
        { cols: 40, rows: 4 },
      )
      flush2(flush)
      expect(screen.text()).toContain("[a:--]")
    })

    it("Enter transitions from focused to selected", () => {
      const { screen, keys, flush } = renderTui(
        <FocusProvider selectable>
          <InteractiveTag id="a" autoFocus />
        </FocusProvider>,
        { cols: 40, rows: 4 },
      )
      flush2(flush)
      expect(screen.text()).toContain("[a:F-]")
      keys.enter()
      flush2(flush)
      expect(screen.text()).toContain("[a:FS]")
    })

    it("Escape transitions from selected back to focused", () => {
      const { screen, keys, flush } = renderTui(
        <FocusProvider selectable>
          <InteractiveTag id="a" autoFocus />
        </FocusProvider>,
        { cols: 40, rows: 4 },
      )
      flush2(flush)
      keys.enter()
      flush2(flush)
      expect(screen.text()).toContain("[a:FS]")
      keys.escape()
      flush2(flush)
      expect(screen.text()).toContain("[a:F-]")
    })
  })

  // ── onKey: selection-scoped keyboard routing with ref swap ────────────

  describe("onKey", () => {
    it("does not fire while only focused (not selected)", () => {
      const events: string[] = []
      function X() {
        const i = useInteractive({ id: "x", autoFocus: true })
        i.onKey((e: any) => events.push(e.name))
        return <box ref={i.focusRef}><text>x</text></box>
      }
      const { keys, flush } = renderTui(
        <FocusProvider selectable>
          <X />
        </FocusProvider>,
        { cols: 40, rows: 4 },
      )
      flush2(flush)

      keys.press("a")
      flush2(flush)
      expect(events).toEqual([])
    })

    it("fires handler after selection", () => {
      const events: string[] = []
      function X() {
        const i = useInteractive({ id: "x", autoFocus: true })
        i.onKey((e: any) => events.push(e.name))
        return <box ref={i.focusRef}><text>x</text></box>
      }
      const { keys, flush } = renderTui(
        <FocusProvider selectable>
          <X />
        </FocusProvider>,
        { cols: 40, rows: 4 },
      )
      flush2(flush)

      keys.enter()
      flush2(flush)
      events.length = 0

      keys.press("a")
      flush2(flush)
      expect(events).toEqual(["a"])
    })

    it("last onKey call in a render wins (ref swap)", () => {
      const log1: string[] = []
      const log2: string[] = []
      function X() {
        const i = useInteractive({ id: "x", autoFocus: true })
        i.onKey((e: any) => log1.push(e.name))
        i.onKey((e: any) => log2.push(e.name))
        return <box ref={i.focusRef}><text>x</text></box>
      }
      const { keys, flush } = renderTui(
        <FocusProvider selectable>
          <X />
        </FocusProvider>,
        { cols: 40, rows: 4 },
      )
      flush2(flush)
      keys.enter()
      flush2(flush)
      log1.length = 0
      log2.length = 0
      keys.press("a")
      flush2(flush)
      expect(log1).toEqual([])
      expect(log2).toEqual(["a"])
    })

    it("handler does not fire after the component unmounts", () => {
      const events: string[] = []
      function X() {
        const i = useInteractive({ id: "x", autoFocus: true })
        i.onKey((e: any) => events.push(e.name))
        return <box ref={i.focusRef}><text>x</text></box>
      }
      const { keys, flush, rerender } = renderTui(
        <FocusProvider selectable>
          <X />
        </FocusProvider>,
        { cols: 40, rows: 4 },
      )
      flush2(flush)
      keys.enter()
      flush2(flush)
      events.length = 0
      keys.press("a")
      flush2(flush)
      expect(events).toEqual(["a"])

      rerender(
        <FocusProvider selectable>
          <text>unmounted</text>
        </FocusProvider>,
      )
      flush2(flush)

      events.length = 0
      keys.press("b")
      flush2(flush)
      expect(events).toEqual([])
    })
  })

  // ── shortcuts ─────────────────────────────────────────────────────────

  describe("shortcuts", () => {
    function ShortcutSink() {
      const s = useFocusedShortcuts()
      return <text>{`hint:${s.map((e) => e.label).join("+")}:end`}</text>
    }

    it("accepts a static array and exposes via useFocusedShortcuts", () => {
      function X() {
        useInteractive({
          id: "x",
          autoFocus: true,
          shortcuts: [{ key: "a", label: "alpha" }],
        })
        return <text>x</text>
      }
      const { screen, flush } = renderTui(
        <FocusProvider selectable>
          <X />
          <ShortcutSink />
        </FocusProvider>,
        { cols: 80, rows: 4 },
      )
      flush2(flush)
      expect(screen.text()).toContain("hint:alpha:end")
    })

    it("accepts a function and re-evaluates when selection state changes", () => {
      function X() {
        useInteractive({
          id: "x",
          autoFocus: true,
          shortcuts: ({ isSelected }) =>
            isSelected
              ? [{ key: "esc", label: "back" }]
              : [{ key: "enter", label: "open" }],
        })
        return <text>x</text>
      }
      const { screen, keys, flush } = renderTui(
        <FocusProvider selectable>
          <X />
          <ShortcutSink />
        </FocusProvider>,
        { cols: 80, rows: 4 },
      )
      flush2(flush)
      expect(screen.text()).toContain("hint:open:end")

      keys.enter()
      flush2(flush)
      expect(screen.text()).toContain("hint:back:end")
    })
  })

  // ── borderColor / borderStyle (theme-aware via useTheme fallback) ─────

  describe("border styling", () => {
    function BorderTag({ id, autoFocus }: { id: string; autoFocus?: boolean }) {
      const i = useInteractive({ id, autoFocus })
      return <text>{`<${i.focusId} ${i.borderStyle} ${i.borderColor}>`}</text>
    }

    it("idle state is rounded with dimmed focusIdle color", () => {
      const { screen, flush } = renderTui(
        <FocusProvider selectable>
          <BorderTag id="idle" />
          {/* Keeps the app mounted; nothing focused. */}
        </FocusProvider>,
        { cols: 80, rows: 4 },
      )
      flush2(flush)
      // darkTheme.focusIdle = "#33192a"
      expect(screen.text()).toContain("<idle rounded #33192a>")
    })

    it("focused state is dashed with focusFocused color", () => {
      const { screen, flush } = renderTui(
        <FocusProvider selectable>
          <BorderTag id="f" autoFocus />
        </FocusProvider>,
        { cols: 80, rows: 4 },
      )
      flush2(flush)
      // darkTheme.focusFocused = "#e065b8"
      expect(screen.text()).toContain("<f dashed #e065b8>")
    })

    it("selected state is rounded with focusSelected color", () => {
      const { screen, keys, flush } = renderTui(
        <FocusProvider selectable>
          <BorderTag id="s" autoFocus />
        </FocusProvider>,
        { cols: 80, rows: 4 },
      )
      flush2(flush)
      keys.enter()
      flush2(flush)
      // darkTheme.focusSelected = "#FF71CE"
      expect(screen.text()).toContain("<s rounded #FF71CE>")
    })

    it("sibling-selected state is rounded with transparent color", () => {
      // Two interactives; select the first, check the second goes to transparent
      const { screen, keys, flush } = renderTui(
        <FocusProvider selectable>
          <BorderTag id="a" autoFocus />
          <BorderTag id="b" />
        </FocusProvider>,
        { cols: 80, rows: 4 },
      )
      flush2(flush)
      keys.enter()
      flush2(flush)
      // "b" is idle in isolation but now isAnySelected is true → transparent
      expect(screen.text()).toContain("<b rounded transparent>")
    })
  })

  // ── focusRef exposed (integration with spatial nav is covered in useFocus) ──

  describe("focusRef", () => {
    it("is a function that can be attached to a box", () => {
      function X() {
        const i = useInteractive({ id: "x" })
        expect(typeof i.focusRef).toBe("function")
        return <box ref={i.focusRef}><text>x</text></box>
      }
      const { flush } = renderTui(
        <FocusProvider>
          <X />
        </FocusProvider>,
        { cols: 40, rows: 4 },
      )
      flush2(flush)
    })
  })
})
