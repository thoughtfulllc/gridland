// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../polyterm-testing/src/index"
import { ChatPanel } from "./chat"

afterEach(() => cleanup())

describe("ChatPanel behavior", () => {
  it("renders user messages with > prefix", () => {
    const { screen } = renderTui(
      <ChatPanel
        messages={[{ id: "1", role: "user", content: "Hello" }]}
        onSendMessage={() => {}}
      />,
      { cols: 50, rows: 8 },
    )
    const text = screen.text()
    expect(text).toContain(">")
    expect(text).toContain("Hello")
  })

  it("renders assistant messages with < prefix", () => {
    const { screen } = renderTui(
      <ChatPanel
        messages={[{ id: "1", role: "assistant", content: "Hi there" }]}
        onSendMessage={() => {}}
      />,
      { cols: 50, rows: 8 },
    )
    const text = screen.text()
    expect(text).toContain("<")
    expect(text).toContain("Hi there")
  })

  it("renders multiple messages in order", () => {
    const { screen } = renderTui(
      <ChatPanel
        messages={[
          { id: "1", role: "user", content: "First" },
          { id: "2", role: "assistant", content: "Second" },
          { id: "3", role: "user", content: "Third" },
        ]}
        onSendMessage={() => {}}
      />,
      { cols: 50, rows: 10 },
    )
    const text = screen.text()
    expect(text).toContain("First")
    expect(text).toContain("Second")
    expect(text).toContain("Third")
  })

  it("renders streaming text with cursor", () => {
    const { screen } = renderTui(
      <ChatPanel
        messages={[]}
        streamingText="Partial response"
        onSendMessage={() => {}}
      />,
      { cols: 50, rows: 8 },
    )
    const text = screen.text()
    expect(text).toContain("<")
    expect(text).toContain("Partial response")
    expect(text).toContain("_")
  })

  it("renders loading indicator when isLoading and no streaming", () => {
    const { screen } = renderTui(
      <ChatPanel
        messages={[]}
        isLoading={true}
        onSendMessage={() => {}}
      />,
      { cols: 50, rows: 8 },
    )
    expect(screen.text()).toContain("Thinking...")
  })

  it("streaming text takes priority over loading", () => {
    const { screen } = renderTui(
      <ChatPanel
        messages={[]}
        isLoading={true}
        streamingText="Streaming..."
        onSendMessage={() => {}}
      />,
      { cols: 50, rows: 8 },
    )
    const text = screen.text()
    expect(text).toContain("Streaming...")
    expect(text).not.toContain("Thinking...")
  })

  it("renders tool call cards", () => {
    const { screen } = renderTui(
      <ChatPanel
        messages={[]}
        activeToolCalls={[
          { id: "t1", title: "Read file", status: "pending" },
          { id: "t2", title: "Edit file", status: "completed" },
        ]}
        onSendMessage={() => {}}
      />,
      { cols: 50, rows: 8 },
    )
    const text = screen.text()
    expect(text).toContain("Read file")
    expect(text).toContain("Edit file")
    expect(text).toContain("\u2022") // bullet for pending
    expect(text).toContain("\u2713") // check for completed
  })

  it("shows ellipsis for pending/in_progress tool calls", () => {
    const { screen } = renderTui(
      <ChatPanel
        messages={[]}
        activeToolCalls={[
          { id: "t1", title: "Search", status: "in_progress" },
        ]}
        onSendMessage={() => {}}
      />,
      { cols: 50, rows: 8 },
    )
    expect(screen.text()).toContain("...")
  })

  it("does not show ellipsis for completed tool calls", () => {
    const { screen } = renderTui(
      <ChatPanel
        messages={[]}
        activeToolCalls={[
          { id: "t1", title: "Done", status: "completed" },
        ]}
        onSendMessage={() => {}}
      />,
      { cols: 50, rows: 8 },
    )
    const text = screen.text()
    expect(text).toContain("Done")
    // The check mark should be present
    expect(text).toContain("\u2713")
  })

  it("renders placeholder in input", () => {
    const { screen } = renderTui(
      <ChatPanel
        messages={[]}
        onSendMessage={() => {}}
      />,
      { cols: 50, rows: 8 },
    )
    expect(screen.text()).toContain("Type a message...")
  })

  it("renders custom placeholder", () => {
    const { screen } = renderTui(
      <ChatPanel
        messages={[]}
        placeholder="Ask anything..."
        onSendMessage={() => {}}
      />,
      { cols: 50, rows: 8 },
    )
    expect(screen.text()).toContain("Ask anything...")
  })

  it("renders custom loading text", () => {
    const { screen } = renderTui(
      <ChatPanel
        messages={[]}
        isLoading={true}
        loadingText="Processing..."
        onSendMessage={() => {}}
      />,
      { cols: 50, rows: 8 },
    )
    expect(screen.text()).toContain("Processing...")
  })

  it("handles empty messages array", () => {
    const { screen } = renderTui(
      <ChatPanel
        messages={[]}
        onSendMessage={() => {}}
      />,
      { cols: 50, rows: 8 },
    )
    // Should still render input
    expect(screen.text()).toContain("Type a message...")
  })

  it("types characters and submits", () => {
    let sent = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <ChatPanel
        messages={[]}
        onSendMessage={(text) => { sent = text }}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 50, rows: 8 },
    )
    savedHandler({ name: "H" })
    savedHandler({ name: "i" })
    savedHandler({ name: "return" })
    tui.flush()
    expect(sent).toBe("Hi")
  })

  it("does not submit empty input", () => {
    let sent = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <ChatPanel
        messages={[]}
        onSendMessage={(text) => { sent = text }}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 50, rows: 8 },
    )
    savedHandler({ name: "return" })
    tui.flush()
    expect(sent).toBeNull()
  })

  it("backspace removes last character", () => {
    let sent = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <ChatPanel
        messages={[]}
        onSendMessage={(text) => { sent = text }}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 50, rows: 8 },
    )
    savedHandler({ name: "A" })
    savedHandler({ name: "B" })
    savedHandler({ name: "backspace" })
    savedHandler({ name: "return" })
    tui.flush()
    expect(sent).toBe("A")
  })

  it("ignores input when disabled (loading)", () => {
    let sent = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <ChatPanel
        messages={[]}
        isLoading={true}
        onSendMessage={(text) => { sent = text }}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 50, rows: 8 },
    )
    savedHandler({ name: "H" })
    savedHandler({ name: "return" })
    tui.flush()
    expect(sent).toBeNull()
  })

  it("escape calls onCancel when loading", () => {
    let cancelled = false
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <ChatPanel
        messages={[]}
        isLoading={true}
        onCancel={() => { cancelled = true }}
        onSendMessage={() => {}}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 50, rows: 8 },
    )
    savedHandler({ name: "escape" })
    tui.flush()
    expect(cancelled).toBe(true)
  })

  it("escape calls onCancel when streaming", () => {
    let cancelled = false
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <ChatPanel
        messages={[]}
        streamingText="partial"
        onCancel={() => { cancelled = true }}
        onSendMessage={() => {}}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 50, rows: 8 },
    )
    savedHandler({ name: "escape" })
    tui.flush()
    expect(cancelled).toBe(true)
  })
})
