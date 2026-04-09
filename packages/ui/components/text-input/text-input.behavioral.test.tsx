import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
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

  it("disabled ignores focus prop", () => {
    const { screen } = renderTui(
      <TextInput value="locked" label="Key" disabled focus />,
      { cols: 80, rows: 4 },
    )
    // focus + disabled = not focused, should show placeholder text fallback
    expect(screen.text()).not.toContain("▸")
  })
})
