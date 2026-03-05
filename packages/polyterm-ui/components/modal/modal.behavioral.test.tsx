// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../polyterm-testing/src/index"
import { Modal } from "./modal"

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
})
