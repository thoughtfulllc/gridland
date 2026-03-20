// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { ChatPanel } from "./chat"

afterEach(() => cleanup())

// Note: ChatPanel uses PromptInput which uses <input> intrinsic (requires Zig FFI).
// Only disabled states (loading/streaming/submitted) can be snapshot tested.

describe("ChatPanel snapshots", () => {
  it("renders with streaming text", () => {
    const { screen } = renderTui(
      <ChatPanel
        messages={[{ id: "1", role: "user", content: "Tell me a story" }]}
        streamingText="Once upon a time"
        onSendMessage={() => {}}
      />,
      { cols: 50, rows: 10 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders with loading state", () => {
    const { screen } = renderTui(
      <ChatPanel
        messages={[{ id: "1", role: "user", content: "Hello" }]}
        isLoading={true}
        onSendMessage={() => {}}
      />,
      { cols: 50, rows: 10 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders with tool calls", () => {
    const { screen } = renderTui(
      <ChatPanel
        messages={[{ id: "1", role: "user", content: "Read my file" }]}
        activeToolCalls={[
          { id: "t1", title: "Read file", status: "in_progress" },
          { id: "t2", title: "Edit file", status: "completed" },
        ]}
        onSendMessage={() => {}}
      />,
      { cols: 50, rows: 10 },
    )
    expect(screen.text()).toMatchSnapshot()
  })
})
