// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { TextInput } from "./text-input"

afterEach(() => cleanup())

describe("TextInput snapshots", () => {
  it("renders with placeholder", () => {
    const { screen } = renderTui(
      <TextInput value="" placeholder="Type something..." />,
      { cols: 80, rows: 4 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders with custom prompt", () => {
    const { screen } = renderTui(
      <TextInput value="" placeholder="Enter name" prompt="> " />,
      { cols: 80, rows: 4 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders with error state", () => {
    const { screen } = renderTui(
      <TextInput value="" label="Email" placeholder="user@example.com" prompt="> " error="This field is required" />,
      { cols: 80, rows: 4 },
    )
    expect(screen.text()).toMatchSnapshot()
  })
})
