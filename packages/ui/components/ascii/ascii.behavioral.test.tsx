import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { Ascii } from "./ascii"

afterEach(() => cleanup())

describe("Ascii behavior", () => {
  it("renders with default font when font is omitted", () => {
    const { screen } = renderTui(
      <Ascii text="Hi" />,
      { cols: 30, rows: 6 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders with tiny font", () => {
    const { screen } = renderTui(
      <Ascii text="Hi" font="tiny" />,
      { cols: 30, rows: 6 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders with block font", () => {
    const { screen } = renderTui(
      <Ascii text="Hi" font="block" />,
      { cols: 30, rows: 8 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders with slick font", () => {
    const { screen } = renderTui(
      <Ascii text="Hi" font="slick" />,
      { cols: 30, rows: 8 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders with shade font", () => {
    const { screen } = renderTui(
      <Ascii text="Hi" font="shade" />,
      { cols: 30, rows: 8 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders with custom color", () => {
    const { screen } = renderTui(
      <Ascii text="Hi" font="tiny" color="#ff0000" />,
      { cols: 30, rows: 6 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders empty text without crashing", () => {
    const { screen } = renderTui(
      <Ascii text="" font="tiny" />,
      { cols: 30, rows: 6 },
    )
    expect(screen.text()).toBeDefined()
  })
})
