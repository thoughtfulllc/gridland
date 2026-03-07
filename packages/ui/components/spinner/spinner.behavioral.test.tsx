// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { Spinner } from "./spinner"
import { SpinnerShowcase } from "./spinner-showcase"

afterEach(() => cleanup())

describe("Spinner behavior", () => {
  it("renders without text by default", () => {
    const { screen } = renderTui(
      <Spinner />,
      { cols: 30, rows: 3 },
    )
    expect(screen.text()).toContain("⠋")
    expect(screen.text()).not.toContain("Loading")
  })

  it("renders custom text", () => {
    const { screen } = renderTui(
      <Spinner text="Processing..." />,
      { cols: 30, rows: 3 },
    )
    expect(screen.text()).toContain("Processing...")
  })

  it("renders with a specific variant", () => {
    const { screen } = renderTui(
      <Spinner variant="meter" />,
      { cols: 30, rows: 3 },
    )
    // First frame of "meter" variant is "▱▱▱"
    expect(screen.text()).toContain("▱▱▱")
  })

  it("renders spinner frame character", () => {
    const { screen } = renderTui(
      <Spinner variant="dots" />,
      { cols: 30, rows: 3 },
    )
    expect(screen.text()).toContain("⠋")
  })

  it("renders with empty text", () => {
    const { screen } = renderTui(
      <Spinner text="" />,
      { cols: 20, rows: 3 },
    )
    expect(screen.text()).toContain("⠋")
  })
})

describe("SpinnerShowcase behavior", () => {
  it("renders the title", () => {
    const { screen } = renderTui(
      <SpinnerShowcase />,
      { cols: 60, rows: 20 },
    )
    expect(screen.text()).toContain("All variants")
  })

  it("renders variant names", () => {
    const { screen } = renderTui(
      <SpinnerShowcase />,
      { cols: 60, rows: 20 },
    )
    expect(screen.text()).toContain("dots")
    expect(screen.text()).toContain("meter")
    expect(screen.text()).toContain("pulse")
  })

  it("renders styles count", () => {
    const { screen } = renderTui(
      <SpinnerShowcase />,
      { cols: 60, rows: 20 },
    )
    expect(screen.text()).toContain("5 styles")
  })
})
