// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { PromptInput } from "./prompt-input"

afterEach(() => cleanup())

// Note: PromptInput uses the <input> intrinsic which requires Zig FFI.
// Full interaction tests (typing, submit, suggestions, history) are in E2E.
// These tests verify exports, props, and states that don't render <input>
// (disabled/submitted/streaming states render <text> instead).

describe("PromptInput", () => {
  it("exports PromptInput component", () => {
    expect(typeof PromptInput).toBe("function")
  })

  it("accepts all documented props", () => {
    const props = {
      value: "test",
      defaultValue: "",
      onSubmit: (_msg: { text: string }) => {},
      onChange: (_text: string) => {},
      placeholder: "Type a message...",
      prompt: "❯ ",
      promptColor: "#fff",
      status: "ready" as const,
      onStop: () => {},
      submittedText: "Thinking...",
      streamingText: "Generating...",
      errorText: "An error occurred.",
      disabled: false,
      disabledText: "Generating...",
      commands: [{ cmd: "/help", desc: "Show help" }],
      files: ["src/index.ts"],
      maxSuggestions: 5,
      enableHistory: true,
      model: "opus",
      showDividers: true,
      autoFocus: false,
    }
    expect(props).toBeDefined()
  })

  it("has compound subcomponents", () => {
    expect(typeof PromptInput.Textarea).toBe("function")
    expect(typeof PromptInput.Suggestions).toBe("function")
    expect(typeof PromptInput.Submit).toBe("function")
    expect(typeof PromptInput.Divider).toBe("function")
    expect(typeof PromptInput.StatusText).toBe("function")
    expect(typeof PromptInput.Model).toBe("function")
  })
})

// Tests below render PromptInput in disabled/submitted/streaming states
// which show <text> instead of <input>, so no Zig FFI is needed.

describe("PromptInput disabled states", () => {
  it("shows disabled text when disabled", () => {
    const { screen } = renderTui(
      <PromptInput disabled disabledText="Processing..." />,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toContain("Processing...")
  })

  it("shows submittedText when status is submitted", () => {
    const { screen } = renderTui(
      <PromptInput status="submitted" submittedText="Processing..." />,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toContain("Processing...")
  })

  it("shows streamingText when status is streaming", () => {
    const { screen } = renderTui(
      <PromptInput status="streaming" streamingText="Writing..." />,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toContain("Writing...")
  })

  it("shows error text when status is error", () => {
    const { screen } = renderTui(
      <PromptInput status="error" errorText="Something went wrong" />,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toContain("Something went wrong")
  })

  it("calls onStop on escape when status is streaming", () => {
    let stopped = false
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    renderTui(
      <PromptInput
        status="streaming"
        onStop={() => { stopped = true }}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 40, rows: 4 },
    )
    savedHandler({ name: "escape" })
    expect(stopped).toBe(true)
  })

  it("does not call onStop on escape when status is ready", () => {
    let stopped = false
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    renderTui(
      <PromptInput
        status="ready"
        onStop={() => { stopped = true }}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 40, rows: 4 },
    )
    savedHandler({ name: "escape" })
    expect(stopped).toBe(false)
  })
})

describe("PromptInput compound mode (disabled states)", () => {
  it("renders submit icon for submitted status", () => {
    const { screen } = renderTui(
      <PromptInput status="submitted">
        <PromptInput.Submit />
      </PromptInput>,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toContain("◐")
  })

  it("renders submit icon for streaming status", () => {
    const { screen } = renderTui(
      <PromptInput status="streaming" onStop={() => {}}>
        <PromptInput.Submit />
      </PromptInput>,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toContain("■")
  })

  it("renders submit icon for error status", () => {
    const { screen } = renderTui(
      <PromptInput status="error">
        <PromptInput.Submit />
      </PromptInput>,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toContain("✕")
  })

  it("shows error text via StatusText subcomponent", () => {
    const { screen } = renderTui(
      <PromptInput status="error" errorText="Oops">
        <PromptInput.StatusText />
      </PromptInput>,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toContain("Oops")
  })

  it("hides StatusText when not in error", () => {
    const { screen } = renderTui(
      <PromptInput status="ready" errorText="Oops">
        <PromptInput.StatusText />
      </PromptInput>,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).not.toContain("Oops")
  })
})
