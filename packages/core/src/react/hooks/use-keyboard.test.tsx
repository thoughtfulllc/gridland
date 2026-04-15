// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../../testing/src/index"
import { useKeyboard } from "./use-keyboard"
import { useInteractive } from "../interactive/use-interactive"
import { FocusProvider } from "../focus/focus-provider"
import React from "react"

afterEach(() => cleanup())

function flush2(flush: () => void) {
  flush()
  flush()
}

describe("useKeyboard", () => {
  // Keep until @gridland/utils next major: pins deprecated bare-form behavior so removing
  // it later is an intentional, grep-able change (`rg "deprecated: bare useKeyboard"`),
  // not silent drift. Bare form is functionally equivalent to { global: true } today.
  it("deprecated: bare useKeyboard(handler) fires globally for every keypress", () => {
    const events: string[] = []
    function Listener() {
      useKeyboard((e) => events.push(e.name))
      return <text>x</text>
    }

    const { keys, flush } = renderTui(<Listener />, { cols: 20, rows: 4 })
    flush2(flush)

    keys.press("a")
    keys.press("b")
    keys.enter()
    expect(events).toEqual(["a", "b", "return"])
  })

  it("fires globally regardless of focus when global: true", () => {
    const events: string[] = []
    function Focusable() {
      const { focusId } = useInteractive({ id: "other", autoFocus: true })
      useKeyboard(() => {}, { focusId })
      return <text>{focusId}</text>
    }
    function GlobalListener() {
      useKeyboard((e) => events.push(e.name), { global: true })
      return <text>g</text>
    }

    const { keys, flush } = renderTui(
      <FocusProvider>
        <Focusable />
        <GlobalListener />
      </FocusProvider>,
      { cols: 20, rows: 4 },
    )
    flush2(flush)

    keys.press("x")
    expect(events).toContain("x")
  })

  it("fires only when its focusId is focused", () => {
    const events: string[] = []
    function Listener({ id, autoFocus }: { id: string; autoFocus?: boolean }) {
      const { focusId } = useInteractive({ id, autoFocus })
      useKeyboard((e) => { if (e.name === "x") events.push(id) }, { focusId })
      return <text>{id}</text>
    }

    const { keys, flush } = renderTui(
      <FocusProvider>
        <Listener id="a" autoFocus />
        <Listener id="b" />
      </FocusProvider>,
      { cols: 20, rows: 4 },
    )
    flush2(flush)

    keys.press("x")
    expect(events).toEqual(["a"])

    events.length = 0
    keys.tab()
    flush2(flush)
    keys.press("x")
    expect(events).toEqual(["b"])
  })

  it("selectedOnly suppresses while focused but not selected", () => {
    let count = 0
    function Listener() {
      const { focusId } = useInteractive({ id: "a", autoFocus: true })
      useKeyboard(() => { count += 1 }, { focusId, selectedOnly: true })
      return <text>a</text>
    }

    const { keys, flush } = renderTui(
      <FocusProvider selectable>
        <Listener />
      </FocusProvider>,
      { cols: 20, rows: 4 },
    )
    flush2(flush)

    // Focused but not selected → no fire
    keys.press("x")
    expect(count).toBe(0)

    // Select, then press → fires
    keys.enter()
    flush2(flush)
    keys.press("x")
    expect(count).toBe(1)
  })

  it("focused listener still fires on its own selection", () => {
    let count = 0
    function Listener({ id, autoFocus }: { id: string; autoFocus?: boolean }) {
      const { focusId } = useInteractive({ id, autoFocus })
      useKeyboard((e) => { if (e.name === "x") count += 1 }, { focusId })
      return <text>{id}</text>
    }

    const { keys, flush } = renderTui(
      <FocusProvider selectable>
        <Listener id="a" autoFocus />
        <Listener id="b" />
      </FocusProvider>,
      { cols: 20, rows: 4 },
    )
    flush2(flush)

    keys.press("x")
    expect(count).toBe(1)

    // Select a — listener for a should still fire (selectedId === focusId)
    keys.enter()
    flush2(flush)
    keys.press("x")
    expect(count).toBe(2)
  })
})
