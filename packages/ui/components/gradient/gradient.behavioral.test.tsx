import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { Gradient } from "./gradient"

afterEach(() => cleanup())

describe("Gradient behavior", () => {
  it("renders with named gradient", () => {
    const { screen } = renderTui(
      <Gradient name="rainbow">Hello World</Gradient>,
      { cols: 30, rows: 3 },
    )
    expect(screen.text()).toContain("Hello World")
  })

  it("renders with custom colors", () => {
    const { screen } = renderTui(
      <Gradient colors={["#ff0000", "#0000ff"]}>Test</Gradient>,
      { cols: 20, rows: 3 },
    )
    expect(screen.text()).toContain("Test")
  })

  it("throws when both name and colors provided", () => {
    expect(() => {
      Gradient({ children: "text", name: "rainbow", colors: ["#ff0000"] })
    }).toThrow("mutually exclusive")
  })

  it("throws when neither name nor colors provided", () => {
    expect(() => {
      Gradient({ children: "text" })
    }).toThrow("must be provided")
  })

  it("handles multi-line text", () => {
    const { screen } = renderTui(
      <Gradient name="rainbow">{"Line1\nLine2\nLine3"}</Gradient>,
      { cols: 20, rows: 5 },
    )
    const text = screen.text()
    expect(text).toContain("Line1")
    expect(text).toContain("Line2")
    expect(text).toContain("Line3")
  })

  it("handles single character", () => {
    const { screen } = renderTui(
      <Gradient colors={["#ff0000", "#0000ff"]}>X</Gradient>,
      { cols: 10, rows: 3 },
    )
    expect(screen.text()).toContain("X")
  })

  it("handles empty string", () => {
    const { screen } = renderTui(
      <Gradient colors={["#ff0000", "#0000ff"]}>{""}</Gradient>,
      { cols: 10, rows: 3 },
    )
    expect(screen.text()).toBeDefined()
  })

  it("renders with each named gradient without error", () => {
    const names = ["cristal", "teen", "mind", "morning", "vice", "passion", "fruit", "instagram", "atlas", "retro", "summer", "pastel", "rainbow"] as const
    for (const name of names) {
      const { screen, unmount } = renderTui(
        <Gradient name={name}>Test</Gradient>,
        { cols: 20, rows: 3 },
      )
      expect(screen.text()).toContain("Test")
      unmount()
    }
  })
})
