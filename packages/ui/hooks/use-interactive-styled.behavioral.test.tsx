// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../testing/src/index"
import { useInteractiveStyled } from "./use-interactive-styled"
import { FocusProvider } from "@gridland/utils"
import React from "react"

afterEach(() => cleanup())

function flush2(flush: () => void) {
  flush()
  flush()
}

function BorderTag({ id, autoFocus }: { id: string; autoFocus?: boolean }) {
  const i = useInteractiveStyled({ id, autoFocus })
  return <text>{`<${i.focusId} ${i.borderStyle} ${i.borderColor}>`}</text>
}

describe("useInteractiveStyled", () => {
  it("forwards all useInteractive return fields plus borderColor/borderStyle", () => {
    let captured: any
    function X() {
      captured = useInteractiveStyled({ id: "x" })
      return <text>x</text>
    }
    const { flush } = renderTui(
      <FocusProvider selectable>
        <X />
      </FocusProvider>,
      { cols: 40, rows: 4 },
    )
    flush2(flush)
    expect(captured).toHaveProperty("focusRef")
    expect(captured).toHaveProperty("focusId")
    expect(captured).toHaveProperty("isFocused")
    expect(captured).toHaveProperty("isSelected")
    expect(captured).toHaveProperty("isAnySelected")
    expect(captured).toHaveProperty("onKey")
    expect(captured).toHaveProperty("focus")
    expect(captured).toHaveProperty("blur")
    expect(captured).toHaveProperty("select")
    expect(captured).toHaveProperty("deselect")
    expect(captured).toHaveProperty("borderColor")
    expect(captured).toHaveProperty("borderStyle")
  })

  it("idle state is rounded with dimmed focusIdle color", () => {
    const { screen, flush } = renderTui(
      <FocusProvider selectable>
        <BorderTag id="idle" />
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
    expect(screen.text()).toContain("<b rounded transparent>")
  })
})
