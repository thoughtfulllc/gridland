import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { Ascii } from "./ascii"

afterEach(() => cleanup())

describe("Ascii snapshots", () => {
  it("renders tiny font", () => {
    const { screen } = renderTui(
      <Ascii text="Hello" font="tiny" />,
      { cols: 60, rows: 12 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders block font", () => {
    const { screen } = renderTui(
      <Ascii text="Hello" font="block" />,
      { cols: 60, rows: 12 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders slick font", () => {
    const { screen } = renderTui(
      <Ascii text="Hello" font="slick" />,
      { cols: 60, rows: 12 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders shade font", () => {
    const { screen } = renderTui(
      <Ascii text="Hello" font="shade" />,
      { cols: 60, rows: 12 },
    )
    expect(screen.text()).toMatchSnapshot()
  })
})
