import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { StatusBar } from "./status-bar"

afterEach(() => cleanup())

describe("StatusBar snapshots", () => {
  it("renders items without extra", () => {
    const { screen } = renderTui(
      <StatusBar
        items={[
          { key: "Tab", label: "switch focus" },
          { key: "←→", label: "navigate" },
          { key: "q", label: "quit" },
        ]}
      />,
      { cols: 60, rows: 3 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders with extra content", () => {
    const { screen } = renderTui(
      <StatusBar
        extra="ExtraContent"
        items={[
          { key: "Tab", label: "switch focus" },
          { key: "←→", label: "navigate" },
        ]}
      />,
      { cols: 70, rows: 3 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders with empty items", () => {
    const { screen } = renderTui(
      <StatusBar items={[]} />,
      { cols: 40, rows: 3 },
    )
    expect(screen.text()).toMatchSnapshot()
  })
})
