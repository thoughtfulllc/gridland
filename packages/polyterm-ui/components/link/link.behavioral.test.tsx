// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../polyterm-testing/src/index"
import { Link } from "./link"

afterEach(() => cleanup())

describe("Link behavior", () => {
  it("renders children text", () => {
    const { screen } = renderTui(
      <Link url="https://example.com">Click here</Link>,
      { cols: 30, rows: 3 },
    )
    expect(screen.text()).toContain("Click here")
  })

  it("renders with long URL", () => {
    const { screen } = renderTui(
      <Link url="https://example.com/very/long/path/to/resource">Link</Link>,
      { cols: 30, rows: 3 },
    )
    expect(screen.text()).toContain("Link")
  })

  it("renders with multi-word children", () => {
    const { screen } = renderTui(
      <Link url="https://opentui.dev">Visit OpenTUI Documentation</Link>,
      { cols: 40, rows: 3 },
    )
    expect(screen.text()).toContain("Visit OpenTUI Documentation")
  })
})
