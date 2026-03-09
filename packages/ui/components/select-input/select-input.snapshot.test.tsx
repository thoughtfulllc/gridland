// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { SelectInput } from "./select-input"

afterEach(() => cleanup())

describe("SelectInput snapshots", () => {
  it("renders 4 items with default state", () => {
    const items = [
      { label: "TypeScript", value: "ts" },
      { label: "JavaScript", value: "js" },
      { label: "Python", value: "py" },
      { label: "Rust", value: "rs" },
    ]
    const { screen } = renderTui(
      <SelectInput items={items} />,
      { cols: 40, rows: 8 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders with cursor on default value", () => {
    const items = [
      { label: "TypeScript", value: "ts" },
      { label: "JavaScript", value: "js" },
      { label: "Python", value: "py" },
    ]
    const { screen } = renderTui(
      <SelectInput items={items} defaultValue="js" />,
      { cols: 40, rows: 8 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders with empty items", () => {
    const { screen } = renderTui(
      <SelectInput items={[]} />,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toMatchSnapshot()
  })
})
