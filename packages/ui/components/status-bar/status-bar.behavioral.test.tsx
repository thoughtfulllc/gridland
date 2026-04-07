// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { StatusBar } from "./status-bar"

afterEach(() => cleanup())

describe("StatusBar behavior", () => {
  it("renders all items on one line", () => {
    const { screen } = renderTui(
      <StatusBar
        items={[
          { key: "Tab", label: "switch focus" },
          { key: "q", label: "quit" },
        ]}
      />,
      { cols: 50, rows: 3 },
    )
    const lines = screen.text().split("\n").filter((l) => l.trim().length > 0)
    expect(lines.length).toBe(1)
    expect(lines[0]).toContain("Tab")
    expect(lines[0]).toContain("switch focus")
    expect(lines[0]).toContain("q")
    expect(lines[0]).toContain("quit")
  })

  it("renders extra content with separator", () => {
    const { screen } = renderTui(
      <StatusBar
        extra="Status"
        items={[{ key: "q", label: "quit" }]}
      />,
      { cols: 50, rows: 3 },
    )
    const text = screen.text()
    expect(text).toContain("Status")
    expect(text).toContain("\u2502") // pipe separator
    expect(text).toContain("q")
    expect(text).toContain("quit")
  })

  it("renders nothing when no items and no extra", () => {
    const { screen } = renderTui(
      <StatusBar items={[]} />,
      { cols: 40, rows: 3 },
    )
    const text = screen.text().trim()
    expect(text).toBe("")
  })

  it("renders extra without pipe when items are empty", () => {
    const { screen } = renderTui(
      <StatusBar extra="Info" items={[]} />,
      { cols: 40, rows: 3 },
    )
    const text = screen.text()
    expect(text).toContain("Info")
    expect(text).not.toContain("\u2502")
  })

  it("renders single item", () => {
    const { screen } = renderTui(
      <StatusBar items={[{ key: "Ctrl+C", label: "exit" }]} />,
      { cols: 40, rows: 3 },
    )
    const text = screen.text()
    expect(text).toContain("Ctrl+C")
    expect(text).toContain("exit")
  })

  it("renders unicode key text", () => {
    const { screen } = renderTui(
      <StatusBar items={[{ key: "←→", label: "navigate" }]} />,
      { cols: 40, rows: 3 },
    )
    expect(screen.text()).toContain("←→")
  })

  it("renders nothing when extra is null and items are empty", () => {
    const { screen } = renderTui(
      <StatusBar extra={null} items={[]} />,
      { cols: 40, rows: 3 },
    )
    expect(screen.text().trim()).toBe("")
  })

  it("renders extra as JSX element", () => {
    const { screen } = renderTui(
      <StatusBar
        extra={<span>Ready</span>}
        items={[{ key: "q", label: "quit" }]}
      />,
      { cols: 50, rows: 3 },
    )
    expect(screen.text()).toContain("Ready")
    expect(screen.text()).toContain("q")
  })

  it("extra and items on same line", () => {
    const { screen } = renderTui(
      <StatusBar
        extra="Extra"
        items={[{ key: "q", label: "quit" }]}
      />,
      { cols: 50, rows: 3 },
    )
    const lines = screen.text().split("\n").filter((l) => l.trim().length > 0)
    expect(lines.length).toBe(1)
  })
})
