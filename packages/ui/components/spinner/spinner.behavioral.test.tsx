// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { Spinner } from "./spinner"
import { SpinnerPicker, SpinnerShowcase } from "./spinner-showcase"

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

  it("renders success status symbol", () => {
    const { screen } = renderTui(
      <Spinner status="success" text="Done" />,
      { cols: 30, rows: 3 },
    )
    const text = screen.text()
    expect(text).toContain("✔")
    expect(text).toContain("Done")
    expect(text).not.toContain("⠋")
  })

  it("renders error status symbol", () => {
    const { screen } = renderTui(
      <Spinner status="error" text="Failed" />,
      { cols: 30, rows: 3 },
    )
    expect(screen.text()).toContain("✖")
    expect(screen.text()).toContain("Failed")
  })

  it("renders warning status symbol", () => {
    const { screen } = renderTui(
      <Spinner status="warning" text="Check logs" />,
      { cols: 30, rows: 3 },
    )
    expect(screen.text()).toContain("⚠")
  })

  it("renders info status symbol", () => {
    const { screen } = renderTui(
      <Spinner status="info" text="Note" />,
      { cols: 30, rows: 3 },
    )
    expect(screen.text()).toContain("ℹ")
  })
})

describe("Spinner color prop", () => {
  it("renders with custom color prop", () => {
    const { screen } = renderTui(
      <Spinner color="cyan" text="Compiling" />,
      { cols: 30, rows: 3 },
    )
    const text = screen.text()
    expect(text).toContain("⠋")
    expect(text).toContain("Compiling")
  })
})

describe("SpinnerPicker behavior", () => {
  it("renders default variant name", () => {
    const { screen } = renderTui(
      <SpinnerPicker />,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toContain("dots")
  })

  it("renders status bar with keyboard hint", () => {
    const { screen } = renderTui(
      <SpinnerPicker />,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toContain("←→")
    expect(screen.text()).toContain("change spinner type")
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
