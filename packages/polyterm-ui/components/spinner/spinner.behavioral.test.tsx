// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../polyterm-testing/src/index"
import { Spinner } from "./spinner"

afterEach(() => cleanup())

describe("Spinner behavior", () => {
  it("renders default text", () => {
    const { screen } = renderTui(
      <Spinner />,
      { cols: 30, rows: 3 },
    )
    expect(screen.text()).toContain("Loading")
  })

  it("renders custom text", () => {
    const { screen } = renderTui(
      <Spinner text="Processing..." />,
      { cols: 30, rows: 3 },
    )
    expect(screen.text()).toContain("Processing...")
  })

  it("renders with custom color", () => {
    const { screen } = renderTui(
      <Spinner color="cyan" text="Loading" />,
      { cols: 30, rows: 3 },
    )
    expect(screen.text()).toContain("Loading")
  })

  it("renders spinner frame character", () => {
    const { screen } = renderTui(
      <Spinner />,
      { cols: 30, rows: 3 },
    )
    // First frame should be ⠋
    expect(screen.text()).toContain("⠋")
  })

  it("renders with empty text", () => {
    const { screen } = renderTui(
      <Spinner text="" />,
      { cols: 20, rows: 3 },
    )
    // Should still show the spinner frame
    expect(screen.text()).toContain("⠋")
  })

  it("renders with long text", () => {
    const { screen } = renderTui(
      <Spinner text="This is a very long loading message for testing" />,
      { cols: 60, rows: 3 },
    )
    expect(screen.text()).toContain("This is a very long loading message")
  })
})
