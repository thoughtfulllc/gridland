// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../polyterm-testing/src/index"
import { MultiSelect } from "./multi-select"

afterEach(() => cleanup())

describe("MultiSelect snapshots", () => {
  const items = [
    { label: "TypeScript", value: "ts" },
    { label: "JavaScript", value: "js" },
    { label: "Python", value: "py" },
    { label: "Rust", value: "rs" },
  ]

  it("renders 4 items", () => {
    const { screen } = renderTui(
      <MultiSelect items={items} />,
      { cols: 40, rows: 8 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders with defaultSelected", () => {
    const { screen } = renderTui(
      <MultiSelect items={items} defaultSelected={[items[0]!, items[2]!]} />,
      { cols: 40, rows: 8 },
    )
    expect(screen.text()).toMatchSnapshot()
  })
})
