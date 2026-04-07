// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { FocusProvider, useFocus } from "@gridland/utils"
import { Modal } from "./modal"

function FocusableItem({ id, autoFocus }: { id: string; autoFocus?: boolean }) {
  const { isFocused } = useFocus({ id, autoFocus })
  return <text>{isFocused ? `[${id}:FOCUSED]` : `[${id}]`}</text>
}

function tabAndFlush(keys: any, flush: () => void) {
  keys.tab()
  flush()
  flush()
}

afterEach(() => cleanup())

describe("Modal behavior", () => {
  it("renders title text", () => {
    const { screen } = renderTui(
      <Modal title="Settings">
        <text>Content</text>
      </Modal>,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toContain("Settings")
  })

  it("renders children content", () => {
    const { screen } = renderTui(
      <Modal>
        <text>Hello from modal</text>
      </Modal>,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toContain("Hello from modal")
  })

  it("renders border characters", () => {
    const { screen } = renderTui(
      <Modal borderStyle="single">
        <text>Inside</text>
      </Modal>,
      { cols: 40, rows: 10 },
    )
    const text = screen.text()
    // single border uses ┌ ┐ └ ┘ │ ─
    expect(text).toContain("\u250c") // ┌
    expect(text).toContain("Inside")
  })

  it("renders rounded border by default", () => {
    const { screen } = renderTui(
      <Modal>
        <text>Content</text>
      </Modal>,
      { cols: 40, rows: 10 },
    )
    const text = screen.text()
    // rounded border uses ╭ ╮ ╰ ╯
    expect(text).toContain("\u256d") // ╭
  })

  it("calls onClose when Escape is pressed", () => {
    let closed = false
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <Modal
        onClose={() => { closed = true }}
        useKeyboard={mockUseKeyboard}
      >
        <text>Content</text>
      </Modal>,
      { cols: 40, rows: 10 },
    )
    savedHandler({ name: "escape" })
    tui.flush()
    expect(closed).toBe(true)
  })

  it("does not crash when Escape pressed without onClose", () => {
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <Modal useKeyboard={mockUseKeyboard}>
        <text>Content</text>
      </Modal>,
      { cols: 40, rows: 10 },
    )
    // Should not throw
    savedHandler({ name: "escape" })
    tui.flush()
    expect(true).toBe(true)
  })

  it("ignores non-escape keys", () => {
    let closed = false
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <Modal
        onClose={() => { closed = true }}
        useKeyboard={mockUseKeyboard}
      >
        <text>Content</text>
      </Modal>,
      { cols: 40, rows: 10 },
    )
    savedHandler({ name: "a" })
    tui.flush()
    expect(closed).toBe(false)
  })

  it("does not render title when title is empty string", () => {
    const { screen } = renderTui(
      <Modal title="">
        <text>Content</text>
      </Modal>,
      { cols: 40, rows: 10 },
    )
    // Empty string is falsy, so no title rendered
    expect(screen.text()).toContain("Content")
  })

  it("renders with heavy border style", () => {
    const { screen } = renderTui(
      <Modal borderStyle="heavy">
        <text>Heavy</text>
      </Modal>,
      { cols: 40, rows: 10 },
    )
    const text = screen.text()
    // heavy border uses ┏ ┓ ┗ ┛ ┃ ━
    expect(text).toContain("\u250f") // ┏
  })

  it("uses theme.border color by default", () => {
    const { screen } = renderTui(
      <Modal>
        <text>Content</text>
      </Modal>,
      { cols: 40, rows: 10 },
    )
    // Top-left corner (row 0, col 0) is a border character
    // darkTheme.border = #B967FF → B channel ≈ 1.0
    const [, , b] = screen.fgAt(0, 0)
    expect(b).toBeGreaterThan(0.9)
  })

  it("applies custom borderColor to border characters", () => {
    const { screen } = renderTui(
      <Modal borderColor="#FF0000">
        <text>Red border</text>
      </Modal>,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toContain("Red border")
    // #FF0000 → R ≈ 1.0, G ≈ 0, B ≈ 0
    const [r, g, b] = screen.fgAt(0, 0)
    expect(r).toBeGreaterThan(0.9)
    expect(g).toBeLessThan(0.1)
    expect(b).toBeLessThan(0.1)
  })

  it("receives keyboard handler from context when useKeyboard prop is omitted", () => {
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    let closed = false

    const { GridlandProvider } = require("../provider/provider")
    const tui = renderTui(
      <GridlandProvider useKeyboard={mockUseKeyboard}>
        <Modal onClose={() => { closed = true }}>
          <text>Context keyboard</text>
        </Modal>
      </GridlandProvider>,
      { cols: 40, rows: 10 },
    )
    savedHandler({ name: "escape" })
    tui.flush()
    expect(closed).toBe(true)
  })

  it("traps focus within the modal", () => {
    const { screen, keys, flush } = renderTui(
      <FocusProvider>
        <FocusableItem id="outside" />
        <Modal>
          <FocusableItem id="inner-a" autoFocus />
          <FocusableItem id="inner-b" />
        </Modal>
      </FocusProvider>,
      { cols: 40, rows: 10 },
    )
    flush()
    flush()
    expect(screen.text()).toContain("[inner-a:FOCUSED]")

    // Tab should cycle within modal, never reaching "outside"
    tabAndFlush(keys, flush)
    expect(screen.text()).toContain("[inner-b:FOCUSED]")
    expect(screen.text()).not.toContain("[outside:FOCUSED]")

    tabAndFlush(keys, flush)
    expect(screen.text()).toContain("[inner-a:FOCUSED]")
    expect(screen.text()).not.toContain("[outside:FOCUSED]")
  })

  it("updates title on rerender", () => {
    const { screen, rerender, flush } = renderTui(
      <Modal title="Old Title">
        <text>Content</text>
      </Modal>,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toContain("Old Title")

    rerender(
      <Modal title="New Title">
        <text>Content</text>
      </Modal>,
    )
    flush()
    expect(screen.text()).toContain("New Title")
    expect(screen.text()).not.toContain("Old Title")
  })
})
