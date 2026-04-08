import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import {
  Message,
  useMessage,
  MessageContent,
  MessageText,
  MessageMarkdown,
} from "./message"
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
} from "../chain-of-thought/chain-of-thought"

afterEach(() => cleanup())

describe("Message", () => {
  // ── Role rendering ─────────────────────────────────────────────────

  it("renders user message content", () => {
    const { screen } = renderTui(
      <Message role="user">
        <MessageContent>
          <MessageText>Hello world</MessageText>
        </MessageContent>
      </Message>,
      { cols: 50, rows: 6 },
    )
    expect(screen.text()).toContain("Hello world")
  })

  it("renders assistant message content", () => {
    const { screen } = renderTui(
      <Message role="assistant">
        <MessageContent>
          <MessageText>Hi there</MessageText>
        </MessageContent>
      </Message>,
      { cols: 50, rows: 6 },
    )
    expect(screen.text()).toContain("Hi there")
  })

  it("renders system message content", () => {
    const { screen } = renderTui(
      <Message role="system">
        <MessageContent>
          <MessageText>System message</MessageText>
        </MessageContent>
      </Message>,
      { cols: 50, rows: 6 },
    )
    expect(screen.text()).toContain("System message")
  })

  // ── Multiple text parts ────────────────────────────────────────────

  it("renders multiple text parts", () => {
    const { screen } = renderTui(
      <Message role="assistant">
        <MessageContent>
          <MessageText>First paragraph</MessageText>
          <MessageText>Second paragraph</MessageText>
        </MessageContent>
      </Message>,
      { cols: 50, rows: 8 },
    )
    const text = screen.text()
    expect(text).toContain("First paragraph")
    expect(text).toContain("Second paragraph")
  })

  // ── backgroundColor override ──────────────────────────────────────

  it("renders with custom backgroundColor", () => {
    const { screen } = renderTui(
      <Message role="assistant" backgroundColor="#FF0000">
        <MessageContent>
          <MessageText>Custom bg</MessageText>
        </MessageContent>
      </Message>,
      { cols: 50, rows: 6 },
    )
    expect(screen.text()).toContain("Custom bg")
  })

  // ── ChainOfThought as sibling ─────────────────────────────────────

  it("renders ChainOfThought as sibling of Message", () => {
    const { screen } = renderTui(
      <box flexDirection="column">
        <ChainOfThought defaultOpen={false}>
          <ChainOfThoughtHeader duration="1.2s" />
        </ChainOfThought>
        <Message role="assistant">
          <MessageContent>
            <MessageText>Here is the answer.</MessageText>
          </MessageContent>
        </Message>
      </box>,
      { cols: 50, rows: 10 },
    )
    const text = screen.text()
    expect(text).toContain("Thought for 1.2s")
    expect(text).toContain("\u25B6")
    expect(text).toContain("Here is the answer.")
  })

  it("renders expanded ChainOfThought steps as sibling of Message", () => {
    const { screen } = renderTui(
      <box flexDirection="column">
        <ChainOfThought defaultOpen>
          <ChainOfThoughtHeader duration="1.2s" />
          <ChainOfThoughtContent>
            <ChainOfThoughtStep label="Analyzing question" status="done" />
            <ChainOfThoughtStep label="Looking up docs" status="done" isLast />
          </ChainOfThoughtContent>
        </ChainOfThought>
        <Message role="assistant">
          <MessageContent>
            <MessageText>Here is the answer.</MessageText>
          </MessageContent>
        </Message>
      </box>,
      { cols: 60, rows: 14 },
    )
    const text = screen.text()
    expect(text).toContain("Thought for 1.2s")
    expect(text).toContain("\u25BC")
    expect(text).toContain("Analyzing question")
    expect(text).toContain("Looking up docs")
    expect(text).toContain("Here is the answer.")
  })

  // ── useMessage error path ───────────────────────────────────────────

  it("renders error boundary fallback when useMessage is called outside Message", () => {
    function Orphan() {
      useMessage()
      return null
    }
    const { screen } = renderTui(<Orphan />, { cols: 80, rows: 4 })
    expect(screen.text()).toContain("useMessage must be used within")
  })

  // ── MessageMarkdown ───────────────────────────────────────────────
  // Note: The <markdown> intrinsic requires TreeSitter which is not available
  // in the test environment. These tests verify the component renders without
  // errors and that the streaming cursor works.

  it("renders markdown component without error", () => {
    // The <markdown> intrinsic requires TreeSitter which is not available
    // in the test environment, but the component should mount without throwing.
    expect(() => {
      renderTui(
        <Message role="assistant">
          <MessageContent>
            <MessageMarkdown>{"Hello **world**"}</MessageMarkdown>
          </MessageContent>
        </Message>,
        { cols: 50, rows: 8 },
      )
    }).not.toThrow()
  })

})
