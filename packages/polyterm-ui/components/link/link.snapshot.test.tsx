// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../polyterm-testing/src/index"
import { Link } from "./link"

afterEach(() => cleanup())

describe("Link snapshots", () => {
  it("renders a basic link", () => {
    const { screen } = renderTui(
      <Link url="https://opentui.dev">Visit opentui.dev</Link>,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toMatchSnapshot()
  })
})
