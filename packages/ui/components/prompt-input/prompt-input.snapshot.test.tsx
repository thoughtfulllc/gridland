// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { PromptInput } from "./prompt-input"

afterEach(() => cleanup())

describe("PromptInput snapshots", () => {
  it("renders default state", () => {
    const { screen } = renderTui(
      <PromptInput focus={false} placeholder="Type a message..." />,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders disabled state", () => {
    const { screen } = renderTui(
      <PromptInput disabled disabledText="Generating..." />,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toMatchSnapshot()
  })
})
