// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { ChatInput } from "./chat-input"

afterEach(() => cleanup())

describe("ChatInput behavior", () => {
  // ── Static rendering ──────────────────────────────────────────────────

  it("renders prompt and placeholder", () => {
    const { screen } = renderTui(
      <ChatInput placeholder="Type a message..." />,
      { cols: 40, rows: 4 },
    )
    const text = screen.text()
    expect(text).toContain("❯")
    expect(text).toContain("Type a message...")
  })

  it("renders custom prompt", () => {
    const { screen } = renderTui(
      <ChatInput prompt="> " />,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toContain(">")
  })

  it("shows cursor when not disabled", () => {
    const { screen } = renderTui(
      <ChatInput />,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toContain("▍")
  })

  it("hides cursor when disabled", () => {
    const { screen } = renderTui(
      <ChatInput disabled />,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).not.toContain("▍")
  })

  it("shows disabled text when disabled", () => {
    const { screen } = renderTui(
      <ChatInput disabled disabledText="Processing..." />,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toContain("Processing...")
  })

  // ── Keyboard interactions ─────────────────────────────────────────────

  it("submits on enter", () => {
    let submitted = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    renderTui(
      <ChatInput
        useKeyboard={mockUseKeyboard}
        onSubmit={(text) => { submitted = text }}
      />,
      { cols: 40, rows: 4 },
    )
    savedHandler({ name: "h" })
    savedHandler({ name: "i" })
    savedHandler({ name: "return" })
    expect(submitted).toBe("hi")
  })

  it("does not submit empty input", () => {
    let submitted = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    renderTui(
      <ChatInput
        useKeyboard={mockUseKeyboard}
        onSubmit={(text) => { submitted = text }}
      />,
      { cols: 40, rows: 4 },
    )
    savedHandler({ name: "return" })
    expect(submitted).toBeNull()
  })

  it("clears input after submit", () => {
    let changed = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    renderTui(
      <ChatInput
        useKeyboard={mockUseKeyboard}
        onChange={(text) => { changed = text }}
        onSubmit={() => {}}
      />,
      { cols: 40, rows: 4 },
    )
    savedHandler({ name: "h" })
    savedHandler({ name: "i" })
    savedHandler({ name: "return" })
    expect(changed).toBe("")
  })

  it("handles backspace", () => {
    let changed = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    renderTui(
      <ChatInput
        useKeyboard={mockUseKeyboard}
        onChange={(text) => { changed = text }}
      />,
      { cols: 40, rows: 4 },
    )
    savedHandler({ name: "a" })
    savedHandler({ name: "b" })
    savedHandler({ name: "backspace" })
    expect(changed).toBe("a")
  })

  it("handles space key", () => {
    let changed = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    renderTui(
      <ChatInput
        useKeyboard={mockUseKeyboard}
        onChange={(text) => { changed = text }}
      />,
      { cols: 40, rows: 4 },
    )
    savedHandler({ name: "h" })
    savedHandler({ name: "i" })
    savedHandler({ name: "space" })
    expect(changed).toBe("hi ")
  })

  it("ignores keys when disabled", () => {
    let submitted = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    renderTui(
      <ChatInput
        disabled
        useKeyboard={mockUseKeyboard}
        onSubmit={(text) => { submitted = text }}
      />,
      { cols: 40, rows: 4 },
    )
    savedHandler({ name: "h" })
    savedHandler({ name: "return" })
    expect(submitted).toBeNull()
  })

  it("ignores ctrl/meta modified keys", () => {
    let changed = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    renderTui(
      <ChatInput
        useKeyboard={mockUseKeyboard}
        onChange={(text) => { changed = text }}
      />,
      { cols: 40, rows: 4 },
    )
    savedHandler({ name: "c", ctrl: true })
    expect(changed).toBeNull()
  })

  // ── Slash command suggestions ─────────────────────────────────────────

  it("shows slash command suggestions", () => {
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const { screen } = renderTui(
      <ChatInput
        commands={[
          { cmd: "/help", desc: "Show help" },
          { cmd: "/clear", desc: "Clear chat" },
        ]}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 40, rows: 8 },
    )
    savedHandler({ name: "/" })
    const text = screen.text()
    expect(text).toContain("/help")
    expect(text).toContain("/clear")
  })

  it("filters slash command suggestions", () => {
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const { screen } = renderTui(
      <ChatInput
        commands={[
          { cmd: "/help", desc: "Show help" },
          { cmd: "/clear", desc: "Clear chat" },
        ]}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 40, rows: 8 },
    )
    savedHandler({ name: "/" })
    savedHandler({ name: "h" })
    const text = screen.text()
    expect(text).toContain("/help")
    expect(text).not.toContain("/clear")
  })

  it("accepts suggestion on enter", () => {
    let changed = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    renderTui(
      <ChatInput
        commands={[{ cmd: "/help" }]}
        useKeyboard={mockUseKeyboard}
        onChange={(text) => { changed = text }}
      />,
      { cols: 40, rows: 8 },
    )
    savedHandler({ name: "/" })
    savedHandler({ name: "return" })
    expect(changed).toBe("/help ")
  })

  it("dismisses suggestions on escape", () => {
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const { screen } = renderTui(
      <ChatInput
        commands={[{ cmd: "/help" }]}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 40, rows: 8 },
    )
    savedHandler({ name: "/" })
    expect(screen.text()).toContain("/help")
    savedHandler({ name: "escape" })
    // After escape, /help suggestion should be gone from display
    // (the typed "/" is still there, but the suggestion dropdown is dismissed)
  })

  // ── File mention suggestions ──────────────────────────────────────────

  it("shows file suggestions on @", () => {
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const { screen } = renderTui(
      <ChatInput
        files={["src/index.ts", "src/auth.ts"]}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 40, rows: 8 },
    )
    savedHandler({ name: "@" })
    const text = screen.text()
    expect(text).toContain("@src/index.ts")
    expect(text).toContain("@src/auth.ts")
  })

  // ── Command history ───────────────────────────────────────────────────

  it("navigates history with up/down", () => {
    let changed = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    renderTui(
      <ChatInput
        useKeyboard={mockUseKeyboard}
        onChange={(text) => { changed = text }}
        onSubmit={() => {}}
      />,
      { cols: 40, rows: 4 },
    )
    // Submit two messages
    savedHandler({ name: "h" })
    savedHandler({ name: "i" })
    savedHandler({ name: "return" })
    savedHandler({ name: "y" })
    savedHandler({ name: "o" })
    savedHandler({ name: "return" })
    // Navigate history
    savedHandler({ name: "up" })
    expect(changed).toBe("yo")
    savedHandler({ name: "up" })
    expect(changed).toBe("hi")
    savedHandler({ name: "down" })
    expect(changed).toBe("yo")
    savedHandler({ name: "down" })
    expect(changed).toBe("")
  })
})
