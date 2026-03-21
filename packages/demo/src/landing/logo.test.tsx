// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { Logo } from "./logo"

afterEach(() => cleanup())

describe("Logo", () => {
  it("renders full art by default", () => {
    const { screen } = renderTui(
      <Logo />,
      { cols: 80, rows: 20 },
    )
    const text = screen.text()
    // In test env (no document/RAF), renders static gradient text
    expect(text.length).toBeGreaterThan(0)
  })

  it("renders compact mode", () => {
    const { screen } = renderTui(
      <Logo compact />,
      { cols: 40, rows: 5 },
    )
    const text = screen.text()
    expect(text.length).toBeGreaterThan(0)
  })

  it("renders narrow mode", () => {
    const { screen } = renderTui(
      <Logo narrow />,
      { cols: 50, rows: 20 },
    )
    const text = screen.text()
    expect(text.length).toBeGreaterThan(0)
  })

  it("includes subtitle text", () => {
    const { screen } = renderTui(
      <Logo />,
      { cols: 80, rows: 20 },
    )
    expect(screen.text()).toContain("framework for building terminal apps")
  })

  it("mentions OpenTUI in subtitle", () => {
    const { screen } = renderTui(
      <Logo />,
      { cols: 80, rows: 20 },
    )
    expect(screen.text()).toContain("OpenTUI")
  })

  it("mentions browser and terminal in subtitle", () => {
    const { screen } = renderTui(
      <Logo />,
      { cols: 80, rows: 20 },
    )
    expect(screen.text()).toContain("browser and terminal")
  })

  it("renders with mobile flag", () => {
    const { screen } = renderTui(
      <Logo mobile />,
      { cols: 80, rows: 20 },
    )
    // Mobile changes spacing behavior but should still render
    expect(screen.text()).toContain("framework for building terminal apps")
  })

  it("renders compact + mobile", () => {
    const { screen } = renderTui(
      <Logo compact mobile />,
      { cols: 30, rows: 5 },
    )
    expect(screen.text().length).toBeGreaterThan(0)
  })

  it("renders narrow + mobile", () => {
    const { screen } = renderTui(
      <Logo narrow mobile />,
      { cols: 50, rows: 20 },
    )
    expect(screen.text().length).toBeGreaterThan(0)
  })
})
