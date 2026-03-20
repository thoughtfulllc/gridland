// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { ChatPanel } from "./chat"

afterEach(() => cleanup())

// Note: ChatPanel uses PromptInput which now uses the <input> intrinsic,
// requiring Zig FFI. Tests that render ChatPanel in non-disabled states
// will fail. Only disabled/submitted/streaming states render <text> instead.
// Full interaction tests should be in E2E.

describe("ChatPanel", () => {
  it("exports ChatPanel component", () => {
    expect(typeof ChatPanel).toBe("function")
  })
})

describe("ChatPanel disabled states", () => {
  it("shows loading indicator when isLoading", () => {
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
  })

  it("shows loading indicator when status is submitted", () => {
    const { screen } = renderTui(
      <ChatPanel
        messages={[]}
        status="submitted"
        onSendMessage={() => {}}
      />,
      { cols: 50, rows: 8 },
    )
    expect(screen.text()).toContain("Thinking...")
  })

  it("shows streaming text when status is streaming", () => {
    const { screen } = renderTui(
      <ChatPanel
        messages={[]}
        status="streaming"
        streamingText="Partial response"
        onSendMessage={() => {}}
      />,
      { cols: 50, rows: 8 },
    )
    expect(screen.text()).toContain("Partial response")
  })

  it("calls onStop on escape when status is streaming", () => {
    let stopped = false
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <ChatPanel
        messages={[]}
        status="streaming"
        streamingText="partial"
        onStop={() => { stopped = true }}
        onSendMessage={() => {}}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 50, rows: 8 },
    )
    savedHandler({ name: "escape" })
    tui.flush()
    expect(stopped).toBe(true)
  })

  it("calls onCancel on escape when loading", () => {
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
})
