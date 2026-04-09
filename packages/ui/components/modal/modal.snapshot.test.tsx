import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { Modal } from "./modal"

afterEach(() => cleanup())

describe("Modal snapshots", () => {
  it("renders with title and children", () => {
    const { screen } = renderTui(
      <Modal title="My Dialog">
        <text>Hello World</text>
      </Modal>,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders without title", () => {
    const { screen } = renderTui(
      <Modal>
        <text>Content only</text>
      </Modal>,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders with double border", () => {
    const { screen } = renderTui(
      <Modal title="Double" borderStyle="double" borderColor="red">
        <text>Content</text>
      </Modal>,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders with no children", () => {
    const { screen } = renderTui(
      <Modal title="Empty">{null}</Modal>,
      { cols: 40, rows: 8 },
    )
    expect(screen.text()).toMatchSnapshot()
  })
})
