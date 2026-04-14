import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { FocusProvider } from "@gridland/utils"
import { PromptInput } from "./prompt-input"

afterEach(() => cleanup())

describe("PromptInput behavior", () => {
  // ── Static rendering ──────────────────────────────────────────────────

  it("renders prompt and placeholder", () => {
    const { screen } = renderTui(
      <PromptInput focus={false} placeholder="Type a message..." />,
      { cols: 40, rows: 4 },
    )
    const text = screen.text()
    expect(text).toContain("❯")
    expect(text).toContain("Type a message...")
  })

  it("renders custom prompt", () => {
    const { screen } = renderTui(
      <PromptInput focus={false} prompt="> " />,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toContain(">")
  })

  it("shows placeholder when not focused", () => {
    const { screen } = renderTui(
      <PromptInput focus={false} placeholder="Type here..." />,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toContain("Type here...")
  })

  it("shows disabled text when disabled", () => {
    const { screen } = renderTui(
      <PromptInput disabled disabledText="Processing..." />,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toContain("Processing...")
  })

  // ── Keyboard interactions ─────────────────────────────────────────────

  it("submits on enter", () => {
    let submitted = null as string | null
    let savedHandler = null as ((event: any) => void) | null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <PromptInput
        focus={false}
        useKeyboard={mockUseKeyboard}
        onSubmit={(msg) => { submitted = msg.text }}
      />,
      { cols: 40, rows: 4 },
    )
    savedHandler!({ name: "h" })
    savedHandler!({ name: "i" })
    savedHandler!({ name: "return" })
    expect(submitted).toBe("hi")
  })

  it("does not submit empty input", () => {
    let submitted = null as string | null
    let savedHandler = null as ((event: any) => void) | null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <PromptInput
        focus={false}
        useKeyboard={mockUseKeyboard}
        onSubmit={(msg) => { submitted = msg.text }}
      />,
      { cols: 40, rows: 4 },
    )
    savedHandler!({ name: "return" })
    expect(submitted).toBeNull()
  })

  it("clears input after submit", () => {
    let changed = null as string | null
    let savedHandler = null as ((event: any) => void) | null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <PromptInput
        focus={false}
        useKeyboard={mockUseKeyboard}
        onChange={(text) => { changed = text }}
        onSubmit={() => {}}
      />,
      { cols: 40, rows: 4 },
    )
    savedHandler!({ name: "h" })
    savedHandler!({ name: "i" })
    savedHandler!({ name: "return" })
    expect(changed).toBe("")
  })

  it("handles backspace", () => {
    let changed = null as string | null
    let savedHandler = null as ((event: any) => void) | null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <PromptInput
        focus={false}
        useKeyboard={mockUseKeyboard}
        onChange={(text) => { changed = text }}
      />,
      { cols: 40, rows: 4 },
    )
    savedHandler!({ name: "a" })
    savedHandler!({ name: "b" })
    savedHandler!({ name: "backspace" })
    expect(changed).toBe("a")
  })

  it("handles space key", () => {
    let changed = null as string | null
    let savedHandler = null as ((event: any) => void) | null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <PromptInput
        focus={false}
        useKeyboard={mockUseKeyboard}
        onChange={(text) => { changed = text }}
      />,
      { cols: 40, rows: 4 },
    )
    savedHandler!({ name: "h" })
    savedHandler!({ name: "i" })
    savedHandler!({ name: "space" })
    expect(changed).toBe("hi ")
  })

  it("ignores keys when disabled", () => {
    let submitted = null as string | null
    let savedHandler = null as ((event: any) => void) | null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <PromptInput
        disabled
        useKeyboard={mockUseKeyboard}
        onSubmit={(msg) => { submitted = msg.text }}
      />,
      { cols: 40, rows: 4 },
    )
    savedHandler!({ name: "h" })
    savedHandler!({ name: "return" })
    expect(submitted).toBeNull()
  })

  it("ignores ctrl/meta modified keys", () => {
    let changed = null as string | null
    let savedHandler = null as ((event: any) => void) | null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <PromptInput
        focus={false}
        useKeyboard={mockUseKeyboard}
        onChange={(text) => { changed = text }}
      />,
      { cols: 40, rows: 4 },
    )
    savedHandler!({ name: "c", ctrl: true })
    expect(changed).toBeNull()
  })

  // ── Slash command suggestions (verified via callbacks) ─────────────────

  it("submits slash command suggestion on enter", () => {
    let submitted = null as string | null
    let savedHandler = null as ((event: any) => void) | null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <PromptInput
        focus={false}
        commands={[
          { cmd: "/help", desc: "Show help" },
          { cmd: "/clear", desc: "Clear chat" },
        ]}
        useKeyboard={mockUseKeyboard}
        onSubmit={(msg) => { submitted = msg.text }}
      />,
      { cols: 40, rows: 8 },
    )
    savedHandler!({ name: "/" })
    // Suggestions are now active, enter submits first one
    savedHandler!({ name: "return" })
    expect(submitted).toBe("/help")
  })

  it("submits filtered slash command suggestion", () => {
    let submitted = null as string | null
    let savedHandler = null as ((event: any) => void) | null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <PromptInput
        focus={false}
        commands={[
          { cmd: "/help", desc: "Show help" },
          { cmd: "/clear", desc: "Clear chat" },
        ]}
        useKeyboard={mockUseKeyboard}
        onSubmit={(msg) => { submitted = msg.text }}
      />,
      { cols: 40, rows: 8 },
    )
    savedHandler!({ name: "/" })
    savedHandler!({ name: "c" })
    // Only /clear matches now, enter submits it
    savedHandler!({ name: "return" })
    expect(submitted).toBe("/clear")
  })

  it("submits normally when no suggestions match", () => {
    let submitted = null as string | null
    let savedHandler = null as ((event: any) => void) | null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <PromptInput
        focus={false}
        commands={[{ cmd: "/help" }]}
        useKeyboard={mockUseKeyboard}
        onSubmit={(msg) => { submitted = msg.text }}
      />,
      { cols: 40, rows: 8 },
    )
    savedHandler!({ name: "h" })
    savedHandler!({ name: "i" })
    savedHandler!({ name: "return" })
    expect(submitted).toBe("hi")
  })

  it("dismisses suggestions on escape", () => {
    let changed = null as string | null
    let savedHandler = null as ((event: any) => void) | null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <PromptInput
        focus={false}
        commands={[{ cmd: "/help" }]}
        useKeyboard={mockUseKeyboard}
        onChange={(text) => { changed = text }}
        onSubmit={() => {}}
      />,
      { cols: 40, rows: 8 },
    )
    savedHandler!({ name: "/" })
    savedHandler!({ name: "escape" })
    // After escape, enter should submit "/" instead of accepting suggestion
    savedHandler!({ name: "return" })
    expect(changed).toBe("")
  })

  // ── File mention suggestions ──────────────────────────────────────────

  it("accepts file mention suggestion on enter", () => {
    let changed = null as string | null
    let savedHandler = null as ((event: any) => void) | null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <PromptInput
        focus={false}
        files={["src/index.ts", "src/auth.ts"]}
        useKeyboard={mockUseKeyboard}
        onChange={(text) => { changed = text }}
      />,
      { cols: 40, rows: 8 },
    )
    savedHandler!({ name: "@" })
    savedHandler!({ name: "return" })
    expect(changed).toBe("@src/index.ts ")
  })

  // ── Command history ───────────────────────────────────────────────────

  it("navigates history with up/down", () => {
    let changed = null as string | null
    let savedHandler = null as ((event: any) => void) | null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <PromptInput
        focus={false}
        useKeyboard={mockUseKeyboard}
        onChange={(text) => { changed = text }}
        onSubmit={() => {}}
      />,
      { cols: 40, rows: 4 },
    )
    // Submit two messages
    savedHandler!({ name: "h" })
    savedHandler!({ name: "i" })
    savedHandler!({ name: "return" })
    savedHandler!({ name: "y" })
    savedHandler!({ name: "o" })
    savedHandler!({ name: "return" })
    // Navigate history
    savedHandler!({ name: "up" })
    expect(changed).toBe("yo")
    savedHandler!({ name: "up" })
    expect(changed).toBe("hi")
    savedHandler!({ name: "down" })
    expect(changed).toBe("yo")
    savedHandler!({ name: "down" })
    expect(changed).toBe("")
  })

  it("disables history when enableHistory is false", () => {
    let changed = null as string | null
    let savedHandler = null as ((event: any) => void) | null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <PromptInput
        focus={false}
        enableHistory={false}
        useKeyboard={mockUseKeyboard}
        onChange={(text) => { changed = text }}
        onSubmit={() => {}}
      />,
      { cols: 40, rows: 4 },
    )
    savedHandler!({ name: "h" })
    savedHandler!({ name: "i" })
    savedHandler!({ name: "return" })
    changed = null
    savedHandler!({ name: "up" })
    expect(changed).toBeNull()
  })

  // ── Status-driven behavior ─────────────────────────────────────────

  it("disables input when status is submitted", () => {
    let submitted = null as string | null
    let savedHandler = null as ((event: any) => void) | null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <PromptInput
        status="submitted"
        useKeyboard={mockUseKeyboard}
        onSubmit={(msg) => { submitted = msg.text }}
      />,
      { cols: 40, rows: 4 },
    )
    savedHandler!({ name: "h" })
    savedHandler!({ name: "return" })
    expect(submitted).toBeNull()
  })

  it("shows submittedText when status is submitted", () => {
    const { screen } = renderTui(
      <PromptInput status="submitted" submittedText="Processing..." />,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toContain("Processing...")
  })

  it("disables input when status is streaming", () => {
    let submitted = null as string | null
    let savedHandler = null as ((event: any) => void) | null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <PromptInput
        status="streaming"
        useKeyboard={mockUseKeyboard}
        onSubmit={(msg) => { submitted = msg.text }}
      />,
      { cols: 40, rows: 4 },
    )
    savedHandler!({ name: "h" })
    savedHandler!({ name: "return" })
    expect(submitted).toBeNull()
  })

  it("shows streamingText when status is streaming", () => {
    const { screen } = renderTui(
      <PromptInput status="streaming" streamingText="Writing..." />,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toContain("Writing...")
  })

  it("calls onStop on escape when status is streaming", () => {
    let stopped = false
    let savedHandler = null as ((event: any) => void) | null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <PromptInput
        status="streaming"
        onStop={() => { stopped = true }}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 40, rows: 4 },
    )
    savedHandler!({ name: "escape" })
    expect(stopped).toBe(true)
  })

  it("does not call onStop on escape when status is ready", () => {
    let stopped = false
    let savedHandler = null as ((event: any) => void) | null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <PromptInput
        focus={false}
        status="ready"
        onStop={() => { stopped = true }}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 40, rows: 4 },
    )
    savedHandler!({ name: "escape" })
    expect(stopped).toBe(false)
  })

  it("enables input when status is ready", () => {
    let submitted = null as string | null
    let savedHandler = null as ((event: any) => void) | null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <PromptInput
        focus={false}
        status="ready"
        useKeyboard={mockUseKeyboard}
        onSubmit={(msg) => { submitted = msg.text }}
      />,
      { cols: 40, rows: 4 },
    )
    savedHandler!({ name: "h" })
    savedHandler!({ name: "i" })
    savedHandler!({ name: "return" })
    expect(submitted).toBe("hi")
  })

  it("enables input when status is error", () => {
    let submitted = null as string | null
    let savedHandler = null as ((event: any) => void) | null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <PromptInput
        focus={false}
        status="error"
        useKeyboard={mockUseKeyboard}
        onSubmit={(msg) => { submitted = msg.text }}
      />,
      { cols: 40, rows: 4 },
    )
    savedHandler!({ name: "h" })
    savedHandler!({ name: "i" })
    savedHandler!({ name: "return" })
    expect(submitted).toBe("hi")
  })

  it("shows error text when status is error", () => {
    const { screen } = renderTui(
      <PromptInput focus={false} status="error" errorText="Something went wrong" />,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toContain("Something went wrong")
  })
})

// ── Compound component tests ──────────────────────────────────────────────

describe("PromptInput compound mode", () => {
  it("renders compound subcomponents when children provided", () => {
    const { screen } = renderTui(
      <PromptInput focus={false} placeholder="Compound..." status="ready">
        <PromptInput.Divider />
        <PromptInput.Suggestions />
        <PromptInput.Textarea />
        <PromptInput.Submit />
        <PromptInput.StatusText />
        <PromptInput.Divider />
      </PromptInput>,
      { cols: 40, rows: 6 },
    )
    const text = screen.text()
    expect(text).toContain("❯")
    expect(text).toContain("Compound...")
    expect(text).toContain("⏎")
    expect(text).toContain("─")
  })

  it("renders submit icon for ready status", () => {
    const { screen } = renderTui(
      <PromptInput focus={false} status="ready">
        <PromptInput.Submit />
      </PromptInput>,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toContain("⏎")
  })

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
      <PromptInput focus={false} status="error">
        <PromptInput.Submit />
      </PromptInput>,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toContain("✕")
  })

  it("shows error text via StatusText subcomponent", () => {
    const { screen } = renderTui(
      <PromptInput focus={false} status="error" errorText="Oops">
        <PromptInput.StatusText />
      </PromptInput>,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toContain("Oops")
  })

  it("hides StatusText when not in error", () => {
    const { screen } = renderTui(
      <PromptInput focus={false} status="ready" errorText="Oops">
        <PromptInput.StatusText />
      </PromptInput>,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).not.toContain("Oops")
  })

  it("keyboard works in compound mode", () => {
    let submitted = null as string | null
    let savedHandler = null as ((event: any) => void) | null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <PromptInput focus={false} useKeyboard={mockUseKeyboard} onSubmit={(msg) => { submitted = msg.text }}>
        <PromptInput.Textarea />
      </PromptInput>,
      { cols: 40, rows: 4 },
    )
    savedHandler!({ name: "h" })
    savedHandler!({ name: "i" })
    savedHandler!({ name: "return" })
    expect(submitted).toBe("hi")
  })

  it("suggestions work in compound mode", () => {
    let submitted = null as string | null
    let savedHandler = null as ((event: any) => void) | null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <PromptInput
        focus={false}
        commands={[{ cmd: "/help", desc: "Show help" }]}
        useKeyboard={mockUseKeyboard}
        onSubmit={(msg) => { submitted = msg.text }}
      >
        <PromptInput.Suggestions />
        <PromptInput.Textarea />
      </PromptInput>,
      { cols: 40, rows: 8 },
    )
    savedHandler!({ name: "/" })
    savedHandler!({ name: "return" })
    expect(submitted).toBe("/help")
  })
})

// ── Additional coverage ──────────────────────────────────────────────────

describe("PromptInput additional coverage", () => {
  it("cycles suggestions with tab", () => {
    let submitted = null as string | null
    let savedHandler = null as ((event: any) => void) | null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <PromptInput
        focus={false}
        commands={[
          { cmd: "/help", desc: "Show help" },
          { cmd: "/clear", desc: "Clear chat" },
        ]}
        useKeyboard={mockUseKeyboard}
        onSubmit={(msg) => { submitted = msg.text }}
      />,
      { cols: 40, rows: 8 },
    )
    savedHandler!({ name: "/" })
    // Tab cycles to second suggestion
    savedHandler!({ name: "tab" })
    savedHandler!({ name: "return" })
    expect(submitted).toBe("/clear")
  })

  it("renders model label", () => {
    const { screen } = renderTui(
      <PromptInput focus={false} model="claude-sonnet" />,
      { cols: 40, rows: 6 },
    )
    expect(screen.text()).toContain("model: claude-sonnet")
  })

  it("hides model label when not provided", () => {
    const { screen } = renderTui(
      <PromptInput focus={false} />,
      { cols: 40, rows: 6 },
    )
    expect(screen.text()).not.toContain("model:")
  })

  it("uses custom getSuggestions with trigger character", () => {
    let changed = null as string | null
    let savedHandler = null as ((event: any) => void) | null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <PromptInput
        focus={false}
        getSuggestions={(value) => {
          if (value.startsWith("#")) {
            return [{ text: "#bug", desc: "Bug report", trigger: "#" }]
          }
          return []
        }}
        useKeyboard={mockUseKeyboard}
        onChange={(text) => { changed = text }}
      />,
      { cols: 40, rows: 8 },
    )
    savedHandler!({ name: "#" })
    savedHandler!({ name: "return" })
    // Non-slash suggestions are inlined: replaces from trigger character
    expect(changed).toBe("#bug ")
  })

  it("executes onExecute command instead of onSubmit", () => {
    let executed = false
    let submitted = null as string | null
    let savedHandler = null as ((event: any) => void) | null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <PromptInput
        focus={false}
        commands={[
          { cmd: "/run", onExecute: () => { executed = true } },
        ]}
        useKeyboard={mockUseKeyboard}
        onSubmit={(msg) => { submitted = msg.text }}
      />,
      { cols: 40, rows: 8 },
    )
    savedHandler!({ name: "/" })
    savedHandler!({ name: "r" })
    savedHandler!({ name: "u" })
    savedHandler!({ name: "n" })
    // No suggestions match for "/run" since we typed the full command and
    // suggestions require startsWith — "/run".startsWith("/run") matches
    savedHandler!({ name: "return" })
    expect(executed).toBe(true)
    expect(submitted).toBeNull()
  })

  it("clears input on async onSubmit resolve", async () => {
    let changed = null as string | null
    let savedHandler = null as ((event: any) => void) | null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    let resolvePromise!: () => void
    renderTui(
      <PromptInput
        focus={false}
        useKeyboard={mockUseKeyboard}
        onChange={(text) => { changed = text }}
        onSubmit={() => new Promise((resolve) => { resolvePromise = resolve })}
      />,
      { cols: 40, rows: 4 },
    )
    savedHandler!({ name: "h" })
    savedHandler!({ name: "i" })
    expect(changed).toBe("hi")
    savedHandler!({ name: "return" })
    // Input preserved until promise resolves
    expect(changed).toBe("hi")
    resolvePromise()
    await new Promise((r) => setTimeout(r, 10))
    // Cleared after resolve
    expect(changed).toBe("")
  })

  it("preserves input on async onSubmit reject", async () => {
    let changed = null as string | null
    let errorReceived = null as unknown
    let savedHandler = null as ((event: any) => void) | null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    let rejectPromise!: (reason: any) => void
    renderTui(
      <PromptInput
        focus={false}
        useKeyboard={mockUseKeyboard}
        onChange={(text) => { changed = text }}
        onError={(err) => { errorReceived = err }}
        onSubmit={() => new Promise((_, reject) => { rejectPromise = reject })}
      />,
      { cols: 40, rows: 4 },
    )
    savedHandler!({ name: "h" })
    savedHandler!({ name: "i" })
    expect(changed).toBe("hi")
    savedHandler!({ name: "return" })
    // Input preserved while promise is pending
    expect(changed).toBe("hi")
    const error = new Error("fail")
    rejectPromise(error)
    await new Promise((r) => setTimeout(r, 10))
    // Input still preserved after rejection — user can retry
    expect(changed).toBe("hi")
    // onError callback received the error
    expect(errorReceived).toBe(error)
  })

  it("merges skills with commands", () => {
    let submitted = null as string | null
    let savedHandler = null as ((event: any) => void) | null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <PromptInput
        focus={false}
        commands={[{ cmd: "/help", desc: "Show help" }]}
        skills={[{ cmd: "/skill", desc: "A skill" }]}
        useKeyboard={mockUseKeyboard}
        onSubmit={(msg) => { submitted = msg.text }}
      />,
      { cols: 40, rows: 8 },
    )
    // Type "/s" to filter to the skill
    savedHandler!({ name: "/" })
    savedHandler!({ name: "s" })
    savedHandler!({ name: "return" })
    expect(submitted).toBe("/skill")
  })

  it("calls onStop on escape when status is submitted", () => {
    let stopped = false
    let savedHandler = null as ((event: any) => void) | null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <PromptInput
        status="submitted"
        onStop={() => { stopped = true }}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 40, rows: 4 },
    )
    savedHandler!({ name: "escape" })
    expect(stopped).toBe(true)
  })
})

// ── Target API (focusId + useFocus) — Phase 3 migration ────────────────

describe("PromptInput via focusId (target API)", () => {
  it("submits on enter via real key dispatch when focused", () => {
    let submitted: string | null = null
    const { keys, flush } = renderTui(
      <FocusProvider>
        <PromptInput
          focusId="pi"
          autoFocus
          focus={false}
          onSubmit={(msg) => { submitted = msg.text }}
        />
      </FocusProvider>,
      { cols: 40, rows: 4 },
    )
    flush(); flush()
    keys.press("h")
    keys.press("i")
    keys.enter()
    flush(); flush()
    expect(submitted).toBe("hi")
  })
})
