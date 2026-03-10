// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { TextInput } from "./text-input"

afterEach(() => cleanup())

describe("TextInput snapshots", () => {
  it("renders with placeholder", () => {
    const { screen } = renderTui(
      <TextInput placeholder="Type something..." />,
      { cols: 80, rows: 4 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders with custom prompt", () => {
    const { screen } = renderTui(
      <TextInput placeholder="Enter name" prompt="> " promptColor="green" />,
      { cols: 80, rows: 4 },
    )
    expect(screen.text()).toMatchSnapshot()
  })
})
