// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { Message } from "./message"

afterEach(() => cleanup())

describe("Message", () => {
  // ── Role rendering ─────────────────────────────────────────────────

  it("renders user message content", () => {
    const { screen } = renderTui(
      <Message role="user">
        <Message.Content>
          <Message.Text>Hello world</Message.Text>
        </Message.Content>
      </Message>,
      { cols: 50, rows: 6 },
    )
    expect(screen.text()).toContain("Hello world")
  })

  it("renders assistant message content", () => {
    const { screen } = renderTui(
      <Message role="assistant">
        <Message.Content>
          <Message.Text>Hi there</Message.Text>
        </Message.Content>
      </Message>,
      { cols: 50, rows: 6 },
    )
    expect(screen.text()).toContain("Hi there")
  })

  it("renders system message content", () => {
    const { screen } = renderTui(
      <Message role="system">
        <Message.Content>
          <Message.Text>System message</Message.Text>
        </Message.Content>
      </Message>,
      { cols: 50, rows: 6 },
    )
    expect(screen.text()).toContain("System message")
  })

  // ── Footer ─────────────────────────────────────────────────────────

  it("renders model attribution", () => {
    const { screen } = renderTui(
      <Message role="assistant">
        <Message.Content>
          <Message.Text>Hello</Message.Text>
        </Message.Content>
        <Message.Footer model="claude-opus-4-6" />
      </Message>,
      { cols: 60, rows: 8 },
    )
    expect(screen.text()).toContain("claude-opus-4-6")
  })

  it("renders timestamp", () => {
    const { screen } = renderTui(
      <Message role="user">
        <Message.Content>
          <Message.Text>Hello</Message.Text>
        </Message.Content>
        <Message.Footer timestamp="2m ago" />
      </Message>,
      { cols: 50, rows: 8 },
    )
    expect(screen.text()).toContain("2m ago")
  })

  it("renders model and timestamp with separator", () => {
    const { screen } = renderTui(
      <Message role="assistant">
        <Message.Content>
          <Message.Text>Answer</Message.Text>
        </Message.Content>
        <Message.Footer model="claude-opus-4-6" timestamp="1m ago" />
      </Message>,
      { cols: 60, rows: 10 },
    )
    const text = screen.text()
    expect(text).toContain("claude-opus-4-6")
    expect(text).toContain("1m ago")
  })

  // ── Multiple text parts ────────────────────────────────────────────

  it("renders multiple text parts", () => {
    const { screen } = renderTui(
      <Message role="assistant">
        <Message.Content>
          <Message.Text>First paragraph</Message.Text>
          <Message.Text>Second paragraph</Message.Text>
        </Message.Content>
      </Message>,
      { cols: 50, rows: 8 },
    )
    const text = screen.text()
    expect(text).toContain("First paragraph")
    expect(text).toContain("Second paragraph")
  })

  // ── Streaming ──────────────────────────────────────────────────────

  it("shows streaming cursor when isLast and isStreaming", () => {
    const { screen } = renderTui(
      <Message role="assistant" isStreaming>
        <Message.Content>
          <Message.Text isLast>Partial</Message.Text>
        </Message.Content>
      </Message>,
      { cols: 50, rows: 6 },
    )
    expect(screen.text()).toContain("\u258E")
  })

  it("does not show streaming cursor when not streaming", () => {
    const { screen } = renderTui(
      <Message role="assistant">
        <Message.Content>
          <Message.Text isLast>Complete</Message.Text>
        </Message.Content>
      </Message>,
      { cols: 50, rows: 6 },
    )
    expect(screen.text()).not.toContain("\u258E")
  })

  it("does not show streaming cursor when isLast is false", () => {
    const { screen } = renderTui(
      <Message role="assistant" isStreaming>
        <Message.Content>
          <Message.Text>Not last</Message.Text>
        </Message.Content>
      </Message>,
      { cols: 50, rows: 6 },
    )
    expect(screen.text()).not.toContain("\u258E")
  })

  it("renders custom streaming cursor", () => {
    const { screen } = renderTui(
      <Message role="assistant" isStreaming streamingCursor="_">
        <Message.Content>
          <Message.Text isLast>Partial</Message.Text>
        </Message.Content>
      </Message>,
      { cols: 50, rows: 6 },
    )
    expect(screen.text()).toContain("_")
  })

  // ── Tool call ───────────────────────────────────────────────────────

  it("renders tool call in progress", () => {
    const { screen } = renderTui(
      <Message role="assistant">
        <Message.Content>
          <Message.ToolCall name="readFile" state="running" />
        </Message.Content>
      </Message>,
      { cols: 50, rows: 6 },
    )
    const text = screen.text()
    expect(text).toContain("readFile")
    expect(text).toContain("...")
  })

  it("renders tool result with check mark", () => {
    const { screen } = renderTui(
      <Message role="assistant">
        <Message.Content>
          <Message.ToolCall name="readFile" state="completed" result="file contents here" />
        </Message.Content>
      </Message>,
      { cols: 50, rows: 8 },
    )
    const text = screen.text()
    expect(text).toContain("\u2713")
    expect(text).toContain("readFile")
    expect(text).toContain("file contents here")
  })

  // ── Reasoning ──────────────────────────────────────────────────────

  it("renders reasoning header with duration", () => {
    const { screen } = renderTui(
      <Message role="assistant">
        <Message.Reasoning duration="120ms" />
        <Message.Content>
          <Message.Text>Here is the answer.</Message.Text>
        </Message.Content>
      </Message>,
      { cols: 50, rows: 8 },
    )
    const text = screen.text()
    expect(text).toContain("Thought for 120ms")
    expect(text).toContain("Here is the answer.")
  })

  it("renders collapsed reasoning with arrow", () => {
    const { screen } = renderTui(
      <Message role="assistant">
        <Message.Reasoning collapsed />
        <Message.Content>
          <Message.Text>Answer</Message.Text>
        </Message.Content>
      </Message>,
      { cols: 50, rows: 8 },
    )
    expect(screen.text()).toContain("\u25B6")
  })

  it("renders expanded reasoning with down arrow", () => {
    const { screen } = renderTui(
      <Message role="assistant">
        <Message.Reasoning collapsed={false} />
        <Message.Content>
          <Message.Text>Result</Message.Text>
        </Message.Content>
      </Message>,
      { cols: 50, rows: 8 },
    )
    expect(screen.text()).toContain("\u25BC")
  })

  it("shows step chain of thought when expanded", () => {
    const { screen } = renderTui(
      <Message role="assistant">
        <Message.Reasoning
          duration="1.2s"
          collapsed={false}
          steps={[
            { tool: "Think", label: "Analyzing question", duration: "0.4s", status: "done" },
            { tool: "Search", label: "Looking up docs", duration: "0.8s", status: "done" },
          ]}
        />
        <Message.Content>
          <Message.Text>Here is the answer.</Message.Text>
        </Message.Content>
      </Message>,
      { cols: 60, rows: 14 },
    )
    const text = screen.text()
    expect(text).toContain("Thought for 1.2s")
    expect(text).toContain("\u25CF")
    expect(text).toContain("Analyzing question")
    expect(text).toContain("Looking up docs")
    expect(text).toContain("\u2502")
  })

  // ── Source ─────────────────────────────────────────────────────────

  it("renders source with title and index", () => {
    const { screen } = renderTui(
      <Message role="assistant">
        <Message.Content>
          <Message.Text>Answer</Message.Text>
          <Message.Source title="Documentation" url="https://example.com" index={0} />
        </Message.Content>
      </Message>,
      { cols: 50, rows: 8 },
    )
    const text = screen.text()
    expect(text).toContain("1")
    expect(text).toContain("Documentation")
  })

  // ── Mixed composition ──────────────────────────────────────────────

  it("renders reasoning + tool + text + source together", () => {
    const { screen } = renderTui(
      <Message role="assistant">
        <Message.Reasoning duration="50ms" />
        <Message.Content>
          <Message.ToolCall name="search" state="completed" result="found" />
          <Message.Text>Here is the answer.</Message.Text>
          <Message.Source title="Docs" index={0} />
        </Message.Content>
      </Message>,
      { cols: 50, rows: 14 },
    )
    const text = screen.text()
    expect(text).toContain("Thought for 50ms")
    expect(text).toContain("search")
    expect(text).toContain("Here is the answer.")
    expect(text).toContain("Docs")
  })
})
