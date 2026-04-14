import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { FocusProvider } from "@gridland/utils"
import { PromptInput } from "./prompt-input"

afterEach(() => cleanup())

// Wraps a PromptInput in a FocusProvider, autoFocuses it (so useKeyboard's
// focus filter lets events through), and returns the tui handle so tests
// can dispatch real keys. All existing tests use focus={false} to avoid
// rendering the <input> Zig-FFI intrinsic — that flag stays as the
// "render input intrinsic?" toggle post-migration.
function renderFocused(node: any, opts = { cols: 40, rows: 4 }) {
  const tui = renderTui(<FocusProvider>{node}</FocusProvider>, opts)
  tui.flush(); tui.flush()
  return tui
}

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
    let submitted: string | null = null
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        focus={false}
        onSubmit={(msg) => { submitted = msg.text }}
      />,
    )
    keys.press("h")
    keys.press("i")
    keys.enter()
    flush(); flush()
    expect(submitted).toBe("hi")
  })

  it("does not submit empty input", () => {
    let submitted: string | null = null
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        focus={false}
        onSubmit={(msg) => { submitted = msg.text }}
      />,
    )
    keys.enter()
    flush(); flush()
    expect(submitted).toBeNull()
  })

  it("clears input after submit", () => {
    let changed: string | null = null
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        focus={false}
        onChange={(text) => { changed = text }}
        onSubmit={() => {}}
      />,
    )
    keys.press("h")
    keys.press("i")
    keys.enter()
    flush(); flush()
    expect(changed).toBe("")
  })

  it("handles backspace", () => {
    let changed: string | null = null
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        focus={false}
        onChange={(text) => { changed = text }}
      />,
    )
    keys.press("a")
    keys.press("b")
    keys.backspace()
    flush(); flush()
    expect(changed).toBe("a")
  })

  it("handles space key", () => {
    let changed: string | null = null
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        focus={false}
        onChange={(text) => { changed = text }}
      />,
    )
    keys.press("h")
    keys.press("i")
    keys.space()
    flush(); flush()
    expect(changed).toBe("hi ")
  })

  it("ignores keys when disabled", () => {
    let submitted: string | null = null
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        disabled
        onSubmit={(msg) => { submitted = msg.text }}
      />,
    )
    keys.press("h")
    keys.enter()
    flush(); flush()
    expect(submitted).toBeNull()
  })

  it("ignores ctrl/meta modified keys", () => {
    let changed: string | null = null
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        focus={false}
        onChange={(text) => { changed = text }}
      />,
    )
    keys.pressWith("c", { ctrl: true })
    flush(); flush()
    expect(changed).toBeNull()
  })

  // ── Slash command suggestions ─────────────────────────────────────────

  it("submits slash command suggestion on enter", () => {
    let submitted: string | null = null
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        focus={false}
        commands={[
          { cmd: "/help", desc: "Show help" },
          { cmd: "/clear", desc: "Clear chat" },
        ]}
        onSubmit={(msg) => { submitted = msg.text }}
      />,
      { cols: 40, rows: 8 },
    )
    keys.press("/")
    keys.enter()
    flush(); flush()
    expect(submitted).toBe("/help")
  })

  it("submits filtered slash command suggestion", () => {
    let submitted: string | null = null
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        focus={false}
        commands={[
          { cmd: "/help", desc: "Show help" },
          { cmd: "/clear", desc: "Clear chat" },
        ]}
        onSubmit={(msg) => { submitted = msg.text }}
      />,
      { cols: 40, rows: 8 },
    )
    keys.press("/")
    keys.press("c")
    keys.enter()
    flush(); flush()
    expect(submitted).toBe("/clear")
  })

  it("submits normally when no suggestions match", () => {
    let submitted: string | null = null
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        focus={false}
        commands={[{ cmd: "/help" }]}
        onSubmit={(msg) => { submitted = msg.text }}
      />,
      { cols: 40, rows: 8 },
    )
    keys.press("h")
    keys.press("i")
    keys.enter()
    flush(); flush()
    expect(submitted).toBe("hi")
  })

  it("dismisses suggestions on escape", () => {
    let changed: string | null = null
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        focus={false}
        commands={[{ cmd: "/help" }]}
        onChange={(text) => { changed = text }}
        onSubmit={() => {}}
      />,
      { cols: 40, rows: 8 },
    )
    keys.press("/")
    keys.escape()
    keys.enter()
    flush(); flush()
    // After escape, suggestions dismissed and enter submits "/" which
    // then clears the input (onSubmit handler set to no-op)
    expect(changed).toBe("")
  })

  // ── File mention suggestions ──────────────────────────────────────────

  it("accepts file mention suggestion on enter", () => {
    let changed: string | null = null
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        focus={false}
        files={["src/index.ts", "src/auth.ts"]}
        onChange={(text) => { changed = text }}
      />,
      { cols: 40, rows: 8 },
    )
    keys.press("@")
    keys.enter()
    flush(); flush()
    expect(changed).toBe("@src/index.ts ")
  })

  // ── Command history ───────────────────────────────────────────────────

  it("navigates history with up/down", () => {
    let changed: string | null = null
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        focus={false}
        onChange={(text) => { changed = text }}
        onSubmit={() => {}}
      />,
    )
    // Submit two messages
    keys.press("h")
    keys.press("i")
    keys.enter()
    keys.press("y")
    keys.press("o")
    keys.enter()
    flush(); flush()
    // Navigate history
    keys.up()
    flush(); flush()
    expect(changed).toBe("yo")
    keys.up()
    flush(); flush()
    expect(changed).toBe("hi")
    keys.down()
    flush(); flush()
    expect(changed).toBe("yo")
    keys.down()
    flush(); flush()
    expect(changed).toBe("")
  })

  it("disables history when enableHistory is false", () => {
    let changed: string | null = null
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        focus={false}
        enableHistory={false}
        onChange={(text) => { changed = text }}
        onSubmit={() => {}}
      />,
    )
    keys.press("h")
    keys.press("i")
    keys.enter()
    flush(); flush()
    changed = null
    keys.up()
    flush(); flush()
    expect(changed).toBeNull()
  })

  // ── Status-driven behavior ─────────────────────────────────────────

  it("disables input when status is submitted", () => {
    let submitted: string | null = null
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        status="submitted"
        onSubmit={(msg) => { submitted = msg.text }}
      />,
    )
    keys.press("h")
    keys.enter()
    flush(); flush()
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
    let submitted: string | null = null
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        status="streaming"
        onSubmit={(msg) => { submitted = msg.text }}
      />,
    )
    keys.press("h")
    keys.enter()
    flush(); flush()
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
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        status="streaming"
        onStop={() => { stopped = true }}
      />,
    )
    keys.escape()
    flush(); flush()
    expect(stopped).toBe(true)
  })

  it("does not call onStop on escape when status is ready", () => {
    let stopped = false
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        focus={false}
        status="ready"
        onStop={() => { stopped = true }}
      />,
    )
    keys.escape()
    flush(); flush()
    expect(stopped).toBe(false)
  })

  it("enables input when status is ready", () => {
    let submitted: string | null = null
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        focus={false}
        status="ready"
        onSubmit={(msg) => { submitted = msg.text }}
      />,
    )
    keys.press("h")
    keys.press("i")
    keys.enter()
    flush(); flush()
    expect(submitted).toBe("hi")
  })

  it("enables input when status is error", () => {
    let submitted: string | null = null
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        focus={false}
        status="error"
        onSubmit={(msg) => { submitted = msg.text }}
      />,
    )
    keys.press("h")
    keys.press("i")
    keys.enter()
    flush(); flush()
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
    let submitted: string | null = null
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        focus={false}
        onSubmit={(msg) => { submitted = msg.text }}
      >
        <PromptInput.Textarea />
      </PromptInput>,
    )
    keys.press("h")
    keys.press("i")
    keys.enter()
    flush(); flush()
    expect(submitted).toBe("hi")
  })

  it("suggestions work in compound mode", () => {
    let submitted: string | null = null
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        focus={false}
        commands={[{ cmd: "/help", desc: "Show help" }]}
        onSubmit={(msg) => { submitted = msg.text }}
      >
        <PromptInput.Suggestions />
        <PromptInput.Textarea />
      </PromptInput>,
      { cols: 40, rows: 8 },
    )
    keys.press("/")
    keys.enter()
    flush(); flush()
    expect(submitted).toBe("/help")
  })
})

// ── Additional coverage ──────────────────────────────────────────────────

describe("PromptInput additional coverage", () => {
  it("cycles suggestions with tab", () => {
    let submitted: string | null = null
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        focus={false}
        commands={[
          { cmd: "/help", desc: "Show help" },
          { cmd: "/clear", desc: "Clear chat" },
        ]}
        onSubmit={(msg) => { submitted = msg.text }}
      />,
      { cols: 40, rows: 8 },
    )
    keys.press("/")
    keys.tab()
    keys.enter()
    flush(); flush()
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
    let changed: string | null = null
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        focus={false}
        getSuggestions={(value) => {
          if (value.startsWith("#")) {
            return [{ text: "#bug", desc: "Bug report", trigger: "#" }]
          }
          return []
        }}
        onChange={(text) => { changed = text }}
      />,
      { cols: 40, rows: 8 },
    )
    keys.press("#")
    keys.enter()
    flush(); flush()
    expect(changed).toBe("#bug ")
  })

  it("executes onExecute command instead of onSubmit", () => {
    let executed = false
    let submitted: string | null = null
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        focus={false}
        commands={[
          { cmd: "/run", onExecute: () => { executed = true } },
        ]}
        onSubmit={(msg) => { submitted = msg.text }}
      />,
      { cols: 40, rows: 8 },
    )
    keys.press("/")
    keys.press("r")
    keys.press("u")
    keys.press("n")
    keys.enter()
    flush(); flush()
    expect(executed).toBe(true)
    expect(submitted).toBeNull()
  })

  it("clears input on async onSubmit resolve", async () => {
    let changed: string | null = null
    let resolvePromise!: () => void
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        focus={false}
        onChange={(text) => { changed = text }}
        onSubmit={() => new Promise((resolve) => { resolvePromise = resolve })}
      />,
    )
    keys.press("h")
    keys.press("i")
    flush(); flush()
    expect(changed).toBe("hi")
    keys.enter()
    flush(); flush()
    // Input preserved until promise resolves
    expect(changed).toBe("hi")
    resolvePromise()
    await new Promise((r) => setTimeout(r, 10))
    flush(); flush()
    // Cleared after resolve
    expect(changed).toBe("")
  })

  it("preserves input on async onSubmit reject", async () => {
    let changed: string | null = null
    let errorReceived: unknown = null
    let rejectPromise!: (reason: any) => void
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        focus={false}
        onChange={(text) => { changed = text }}
        onError={(err) => { errorReceived = err }}
        onSubmit={() => new Promise((_, reject) => { rejectPromise = reject })}
      />,
    )
    keys.press("h")
    keys.press("i")
    flush(); flush()
    expect(changed).toBe("hi")
    keys.enter()
    flush(); flush()
    expect(changed).toBe("hi")
    const error = new Error("fail")
    rejectPromise(error)
    await new Promise((r) => setTimeout(r, 10))
    flush(); flush()
    expect(changed).toBe("hi")
    expect(errorReceived).toBe(error)
  })

  it("merges skills with commands", () => {
    let submitted: string | null = null
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        focus={false}
        commands={[{ cmd: "/help", desc: "Show help" }]}
        skills={[{ cmd: "/skill", desc: "A skill" }]}
        onSubmit={(msg) => { submitted = msg.text }}
      />,
      { cols: 40, rows: 8 },
    )
    keys.press("/")
    keys.press("s")
    keys.enter()
    flush(); flush()
    expect(submitted).toBe("/skill")
  })

  it("calls onStop on escape when status is submitted", () => {
    let stopped = false
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        status="submitted"
        onStop={() => { stopped = true }}
      />,
    )
    keys.escape()
    flush(); flush()
    expect(stopped).toBe(true)
  })
})

// ── Target API smoke test (kept as an explicit marker) ───────────────

describe("PromptInput via focusId (target API)", () => {
  it("submits on enter via real key dispatch when focused", () => {
    let submitted: string | null = null
    const { keys, flush } = renderFocused(
      <PromptInput
        focusId="pi"
        autoFocus
        focus={false}
        onSubmit={(msg) => { submitted = msg.text }}
      />,
    )
    keys.press("h")
    keys.press("i")
    keys.enter()
    flush(); flush()
    expect(submitted).toBe("hi")
  })
})
