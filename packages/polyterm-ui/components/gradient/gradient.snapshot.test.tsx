// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../polyterm-testing/src/index"
import { Gradient } from "./gradient"

afterEach(() => cleanup())

describe("Gradient snapshots", () => {
  it("renders rainbow gradient", () => {
    const { screen } = renderTui(
      <Gradient name="rainbow">{"Hello, Gradient!"}</Gradient>,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders passion gradient", () => {
    const { screen } = renderTui(
      <Gradient name="passion">{"Passion gradient text"}</Gradient>,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toMatchSnapshot()
  })
})
