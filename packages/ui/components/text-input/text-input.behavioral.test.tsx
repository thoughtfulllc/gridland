// @ts-nocheck — post-migration props (focusId, autoFocus) aren't yet in the type
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { FocusProvider } from "@gridland/utils"
import { TextInput } from "./text-input"

// Note: TextInput uses the <input> intrinsic which requires Zig FFI.
// Full interaction tests are in E2E (e2e/interaction/text-input.spec.ts).
// These tests verify the unfocused rendering path (<text> fallback) which is fully testable.

afterEach(() => cleanup())

describe("TextInput", () => {
  it("exports TextInput component", () => {
    expect(typeof TextInput).toBe("function")
  })

  it("renders value when unfocused", () => {
    const { screen } = renderTui(
      <TextInput value="hello" label="Name" />,
      { cols: 80, rows: 4 },
    )
    const text = screen.text()
    expect(text).toContain("hello")
    expect(text).toContain("Name")
  })

  it("renders placeholder when value is empty", () => {
    const { screen } = renderTui(
      <TextInput value="" placeholder="Type here..." />,
      { cols: 80, rows: 4 },
    )
    expect(screen.text()).toContain("Type here...")
  })

  it("renders error message and overrides description", () => {
    const { screen } = renderTui(
      <TextInput value="" label="Email" description="Helper text" error="This field is required" />,
      { cols: 80, rows: 4 },
    )
    const text = screen.text()
    expect(text).toContain("This field is required")
    expect(text).not.toContain("Helper text")
  })

  it("renders description when no error", () => {
    const { screen } = renderTui(
      <TextInput value="" label="Email" description="Helper text" />,
      { cols: 80, rows: 4 },
    )
    expect(screen.text()).toContain("Helper text")
  })

  it("renders required indicator", () => {
    const { screen } = renderTui(
      <TextInput value="" label="Name" required />,
      { cols: 80, rows: 4 },
    )
    expect(screen.text()).toContain("*")
  })

  it("renders character counter when value and maxLength are set", () => {
    const { screen } = renderTui(
      <TextInput value="hello" label="Bio" maxLength={100} />,
      { cols: 80, rows: 4 },
    )
    expect(screen.text()).toContain("5/100")
  })

  it("does not render character counter when value is empty", () => {
    const { screen } = renderTui(
      <TextInput value="" label="Bio" maxLength={100} />,
      { cols: 80, rows: 4 },
    )
    expect(screen.text()).not.toContain("/100")
  })

  it("renders prompt string", () => {
    const { screen } = renderTui(
      <TextInput value="" prompt="> " placeholder="Type..." />,
      { cols: 80, rows: 4 },
    )
    expect(screen.text()).toContain(">")
  })

  it("renders without label", () => {
    const { screen } = renderTui(
      <TextInput value="hello" placeholder="Type..." />,
      { cols: 80, rows: 4 },
    )
    const text = screen.text()
    expect(text).toContain("hello")
    // No label, no indicator
    expect(text).not.toContain("▸")
  })

  it("renders disabled state with value", () => {
    const { screen } = renderTui(
      <TextInput value="locked" label="API Key" disabled />,
      { cols: 80, rows: 4 },
    )
    const text = screen.text()
    expect(text).toContain("locked")
    expect(text).toContain("API Key")
    // Should not show focused indicator when disabled
    expect(text).not.toContain("▸")
  })

  it("disabled never shows focused indicator", () => {
    const { screen } = renderTui(
      <TextInput value="locked" label="Key" disabled />,
      { cols: 80, rows: 4 },
    )
    expect(screen.text()).not.toContain("▸")
  })
})

// ── Target API (focusId + useInteractive) — Phase 3 migration ──────

describe("TextInput via focusId (target API)", () => {
  it("integrates with the focus system alongside a sibling", () => {
    const { screen, flush } = renderTui(
      <FocusProvider selectable>
        <TextInput focusId="name" autoFocus value="" label="Name" />
        <TextInput focusId="email" value="" label="Email" />
      </FocusProvider>,
      { cols: 80, rows: 10 },
    )
    flush(); flush()
    expect(screen.text()).toContain("Name")
    expect(screen.text()).toContain("Email")
  })

  it("autoFocus inside a FocusProvider marks the component focused", () => {
    const { screen, flush } = renderTui(
      <FocusProvider selectable>
        <TextInput focusId="name" autoFocus value="" label="Name" />
      </FocusProvider>,
      { cols: 80, rows: 10 },
    )
    flush(); flush()
    // Focused but not selected → label indicator visible (▸ prefix)
    expect(screen.text()).toContain("▸")
  })

  it("renders plain text (not <input>) while not selected", () => {
    // Without selection, TextInput renders its value as <text>,
    // which is the only thing test-env can handle safely.
    const { screen, flush } = renderTui(
      <FocusProvider selectable>
        <TextInput focusId="name" autoFocus value="hello" label="Name" />
      </FocusProvider>,
      { cols: 80, rows: 10 },
    )
    flush(); flush()
    expect(screen.text()).toContain("hello")
  })
})
