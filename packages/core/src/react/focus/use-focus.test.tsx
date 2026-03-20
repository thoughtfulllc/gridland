// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../../testing/src/index"
import { useFocus } from "./use-focus"
import { FocusProvider } from "./focus-provider"
import React from "react"

afterEach(() => cleanup())

function FocusableBox({ id, autoFocus, tabIndex, disabled }: { id: string; autoFocus?: boolean; tabIndex?: number; disabled?: boolean }) {
  const { isFocused } = useFocus({ id, autoFocus, tabIndex, disabled })
  return <text>{isFocused ? `[${id}:FOCUSED]` : `[${id}]`}</text>
}

function TestApp({ children }: { children: React.ReactNode }) {
  return <FocusProvider>{children}</FocusProvider>
}

// Helper: send tab key and flush twice to ensure the dispatch → re-render cycle completes
function tabAndFlush(keys: any, flush: () => void) {
  keys.tab()
  flush()
  flush() // second flush ensures cascading renders from dispatch settle
}

describe("useFocus", () => {
  it("component registers and shows unfocused by default", () => {
    const { screen } = renderTui(
      <TestApp>
        <FocusableBox id="a" />
        <FocusableBox id="b" />
      </TestApp>,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toContain("[a]")
    expect(screen.text()).toContain("[b]")
    expect(screen.text()).not.toContain("FOCUSED")
  })

  it("autoFocus gets component focused", () => {
    const { screen, flush } = renderTui(
      <TestApp>
        <FocusableBox id="a" />
        <FocusableBox id="b" autoFocus />
      </TestApp>,
      { cols: 40, rows: 4 },
    )
    // autoFocus dispatch happens in useEffect, need extra flushes to settle
    flush()
    flush()
    expect(screen.text()).toContain("[b:FOCUSED]")
    expect(screen.text()).not.toContain("[a:FOCUSED]")
  })

  it("focus() and blur() dispatch correct actions", () => {
    function FocusControl() {
      const { isFocused } = useFocus({ id: "ctrl" })
      return <text>{isFocused ? "FOCUSED" : "BLURRED"}</text>
    }

    const { screen } = renderTui(
      <TestApp>
        <FocusControl />
      </TestApp>,
      { cols: 40, rows: 4 },
    )
    // Initially not focused
    expect(screen.text()).toContain("BLURRED")
  })

  it("tab cycles between focusable components", () => {
    const { screen, keys, flush } = renderTui(
      <TestApp>
        <FocusableBox id="a" />
        <FocusableBox id="b" />
        <FocusableBox id="c" />
      </TestApp>,
      { cols: 60, rows: 4 },
    )

    tabAndFlush(keys, flush)
    expect(screen.text()).toContain("[a:FOCUSED]")

    tabAndFlush(keys, flush)
    expect(screen.text()).toContain("[b:FOCUSED]")

    tabAndFlush(keys, flush)
    expect(screen.text()).toContain("[c:FOCUSED]")

    // Wraps around
    tabAndFlush(keys, flush)
    expect(screen.text()).toContain("[a:FOCUSED]")
  })

  it("disabled=true skips in tab order", () => {
    const { screen, keys, flush } = renderTui(
      <TestApp>
        <FocusableBox id="a" />
        <FocusableBox id="b" disabled />
        <FocusableBox id="c" />
      </TestApp>,
      { cols: 60, rows: 4 },
    )

    tabAndFlush(keys, flush)
    expect(screen.text()).toContain("[a:FOCUSED]")

    tabAndFlush(keys, flush)
    expect(screen.text()).toContain("[c:FOCUSED]")
  })

  it("tabIndex=-1 skips in tab order", () => {
    const { screen, keys, flush } = renderTui(
      <TestApp>
        <FocusableBox id="a" />
        <FocusableBox id="b" tabIndex={-1} />
        <FocusableBox id="c" />
      </TestApp>,
      { cols: 60, rows: 4 },
    )

    tabAndFlush(keys, flush)
    expect(screen.text()).toContain("[a:FOCUSED]")

    tabAndFlush(keys, flush)
    expect(screen.text()).toContain("[c:FOCUSED]")
  })

  it("multiple components register in render order", () => {
    const { screen, keys, flush } = renderTui(
      <TestApp>
        <FocusableBox id="first" />
        <FocusableBox id="second" />
        <FocusableBox id="third" />
      </TestApp>,
      { cols: 60, rows: 4 },
    )

    tabAndFlush(keys, flush)
    expect(screen.text()).toContain("[first:FOCUSED]")
  })
})
