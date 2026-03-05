// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../polyterm-testing/src/index"
import { Spinner } from "./spinner"

afterEach(() => cleanup())

describe("Spinner snapshots", () => {
  it("renders default spinner", () => {
    const { screen } = renderTui(
      <Spinner />,
      { cols: 30, rows: 4 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders with custom text and color", () => {
    const { screen } = renderTui(
      <Spinner text="Processing..." color="cyan" />,
      { cols: 30, rows: 4 },
    )
    expect(screen.text()).toMatchSnapshot()
  })
})
