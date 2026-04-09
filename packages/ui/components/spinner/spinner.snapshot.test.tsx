import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
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

  it("renders with variant and custom text", () => {
    const { screen } = renderTui(
      <Spinner variant="pulse" text="Processing..." color="cyan" />,
      { cols: 30, rows: 4 },
    )
    expect(screen.text()).toMatchSnapshot()
  })
})
