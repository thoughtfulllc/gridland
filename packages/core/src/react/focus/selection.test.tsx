// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../../testing/src/index"
import { useFocus } from "./use-focus"
import { FocusProvider } from "./focus-provider"
import { useKeyboard } from "../hooks/use-keyboard"
import React, { useState } from "react"

afterEach(() => cleanup())

function SelectableBox({ id, autoFocus }: { id: string; autoFocus?: boolean }) {
  const { isFocused, isSelected, isAnySelected, focusId } = useFocus({ id, autoFocus })
  return (
    <text>
      {`[${id}:${isFocused ? "F" : "-"}${isSelected ? "S" : "-"}${isAnySelected ? "A" : "-"}]`}
    </text>
  )
}

function flush2(flush: () => void) {
  flush()
  flush()
}

describe("FocusProvider selectable", () => {
  it("autoFocus focuses the first component", () => {
    const { screen, flush } = renderTui(
      <FocusProvider selectable>
        <SelectableBox id="a" autoFocus />
        <SelectableBox id="b" />
      </FocusProvider>,
      { cols: 60, rows: 4 },
    )
    flush2(flush)
    expect(screen.text()).toContain("[a:F--]")
    expect(screen.text()).toContain("[b:---]")
  })

  it("tab navigates to next component", () => {
    const { screen, keys, flush } = renderTui(
      <FocusProvider selectable>
        <SelectableBox id="a" autoFocus />
        <SelectableBox id="b" />
      </FocusProvider>,
      { cols: 60, rows: 4 },
    )
    flush2(flush)
    expect(screen.text()).toContain("[a:F--]")

    keys.tab()
    flush2(flush)
    expect(screen.text()).toContain("[a:---]")
    expect(screen.text()).toContain("[b:F--]")
  })

  it("tab wraps from last component back to first", () => {
    const { screen, keys, flush } = renderTui(
      <FocusProvider selectable>
        <SelectableBox id="a" autoFocus />
        <SelectableBox id="b" />
      </FocusProvider>,
      { cols: 60, rows: 4 },
    )
    flush2(flush)
    keys.tab()
    flush2(flush)
    expect(screen.text()).toContain("[b:F--]")

    keys.tab()
    flush2(flush)
    expect(screen.text()).toContain("[a:F--]")
  })

  it("enter selects the focused component", () => {
    const { screen, keys, flush } = renderTui(
      <FocusProvider selectable>
        <SelectableBox id="a" autoFocus />
        <SelectableBox id="b" />
      </FocusProvider>,
      { cols: 60, rows: 4 },
    )
    flush2(flush)
    keys.enter()
    flush2(flush)
    // a is focused, selected, and anySelected is true for both
    expect(screen.text()).toContain("[a:FSA]")
    expect(screen.text()).toContain("[b:--A]")
  })

  it("escape deselects", () => {
    const { screen, keys, flush } = renderTui(
      <FocusProvider selectable>
        <SelectableBox id="a" autoFocus />
        <SelectableBox id="b" />
      </FocusProvider>,
      { cols: 60, rows: 4 },
    )
    flush2(flush)
    keys.enter()
    flush2(flush)
    expect(screen.text()).toContain("[a:FSA]")

    keys.escape()
    flush2(flush)
    expect(screen.text()).toContain("[a:F--]")
    expect(screen.text()).toContain("[b:---]")
  })

  it("navigation is suppressed while selected", () => {
    const { screen, keys, flush } = renderTui(
      <FocusProvider selectable>
        <SelectableBox id="a" autoFocus />
        <SelectableBox id="b" />
      </FocusProvider>,
      { cols: 60, rows: 4 },
    )
    flush2(flush)
    keys.enter()
    flush2(flush)
    expect(screen.text()).toContain("[a:FSA]")

    // tab should NOT navigate while selected
    keys.tab()
    flush2(flush)
    expect(screen.text()).toContain("[a:FSA]")
    expect(screen.text()).toContain("[b:--A]")
  })

  it("selectedOnly keyboard handler fires only when selected", () => {
    let handlerCalled = false

    function TestBox({ id, autoFocus }: { id: string; autoFocus?: boolean }) {
      const { focusId } = useFocus({ id, autoFocus })
      useKeyboard(() => { handlerCalled = true }, { focusId, selectedOnly: true })
      return <text>{id}</text>
    }

    const { keys, flush } = renderTui(
      <FocusProvider selectable>
        <TestBox id="a" autoFocus />
      </FocusProvider>,
      { cols: 40, rows: 4 },
    )
    flush2(flush)

    // Press a key while focused but NOT selected
    handlerCalled = false
    keys.press("x")
    expect(handlerCalled).toBe(false)

    // Select, then press a key
    keys.enter()
    flush2(flush)
    handlerCalled = false
    keys.press("x")
    expect(handlerCalled).toBe(true)
  })
})
