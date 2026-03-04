// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../opentui-testing/src/index"
import { SelectInput } from "./select-input"

afterEach(() => cleanup())

describe("SelectInput snapshots", () => {
  it("renders 4 items with colors", () => {
    const items = [
      { label: "TypeScript", value: "ts" },
      { label: "JavaScript", value: "js" },
      { label: "Python", value: "py" },
      { label: "Rust", value: "rs" },
    ]
    const { screen } = renderTui(
      <SelectInput items={items} textColor="#d8dee9" selectedTextColor="#88c0d0" />,
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
