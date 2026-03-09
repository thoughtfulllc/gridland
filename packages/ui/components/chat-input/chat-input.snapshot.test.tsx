// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { ChatInput } from "./chat-input"

afterEach(() => cleanup())

describe("ChatInput snapshots", () => {
  it("renders default state", () => {
    const { screen } = renderTui(
      <ChatInput placeholder="Type a message..." />,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders disabled state", () => {
    const { screen } = renderTui(
      <ChatInput disabled disabledText="Generating..." />,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toMatchSnapshot()
  })
})
