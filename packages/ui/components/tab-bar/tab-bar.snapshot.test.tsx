import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { TabBar } from "./tab-bar"

afterEach(() => cleanup())

describe("TabBar snapshots", () => {
  it("renders with label and selected index 0", () => {
    const { screen } = renderTui(
      <TabBar label="View" options={["Option1", "Option2", "Option3"]} selectedIndex={0} />,
      { cols: 60, rows: 3 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders without label", () => {
    const { screen } = renderTui(
      <TabBar options={["Option1", "Option2", "Option3"]} selectedIndex={1} />,
      { cols: 60, rows: 3 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders unfocused", () => {
    const { screen } = renderTui(
      <TabBar label="View" options={["Option1", "Option2"]} selectedIndex={0} focused={false} />,
      { cols: 60, rows: 3 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders with empty options", () => {
    const { screen } = renderTui(
      <TabBar label="View" options={[]} selectedIndex={0} />,
      { cols: 40, rows: 3 },
    )
    expect(screen.text()).toMatchSnapshot()
  })
})
