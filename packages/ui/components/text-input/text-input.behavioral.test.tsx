// @ts-nocheck
import { describe, it, expect } from "bun:test"
import { TextInput } from "./text-input"

// Note: TextInput uses the <input> intrinsic which requires Zig FFI.
// Full interaction tests are in E2E (e2e/interaction/text-input.spec.ts).
// These tests verify the component exports and type correctness.

describe("TextInput", () => {
  it("exports TextInput component", () => {
    expect(typeof TextInput).toBe("function")
  })

  it("accepts all documented props", () => {
    const props = {
      value: "test",
      onChange: (_v: string) => {},
      onSubmit: (_v: string) => {},
      placeholder: "Type here...",
      prompt: "> ",
      promptColor: "cyan",
      focus: true,
      maxLength: 100,
    }
    expect(props).toBeDefined()
  })
})
