// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { SideNav } from "./side-nav"

afterEach(() => cleanup())

function flushN(flush: () => void) {
  flush()
  flush()
  flush()
  flush()
}

const items = [
  { id: "general", name: "General" },
  { id: "theme", name: "Theme" },
  { id: "keybinds", name: "Keybinds" },
]

const renderPanel = (ctx: any) => (
  <text>{ctx.activeItem.name} panel content</text>
)

describe("SideNav snapshots", () => {
  it("renders 3-item sidebar with default state", () => {
    const { screen, flush } = renderTui(
      <SideNav items={items}>{renderPanel}</SideNav>,
      { cols: 60, rows: 12 },
    )
    flushN(flush)
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders with title", () => {
    const { screen, flush } = renderTui(
      <SideNav items={items} title="Settings">{renderPanel}</SideNav>,
      { cols: 60, rows: 14 },
    )
    flushN(flush)
    expect(screen.text()).toMatchSnapshot()
  })
})
