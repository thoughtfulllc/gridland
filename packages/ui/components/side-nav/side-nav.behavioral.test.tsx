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

/** Let React effects run, then flush to update the screen. */
async function settle(flush: () => void) {
  flushN(flush)
  await new Promise(resolve => setTimeout(resolve, 20))
  flushN(flush)
}

const items = [
  { id: "general", name: "General" },
  { id: "theme", name: "Theme" },
  { id: "keybinds", name: "Keybinds" },
]

const renderPanel = (ctx: any) => (
  <text>{`active:${ctx.activeItem.name} interacting:${ctx.isInteracting}`}</text>
)

describe("SideNav behavior", () => {
  // ── Static rendering ──────────────────────────────────────────────

  it("renders all item names in sidebar", () => {
    const { screen, flush } = renderTui(
      <SideNav items={items}>{renderPanel}</SideNav>,
      { cols: 60, rows: 15 },
    )
    flushN(flush)
    const text = screen.text()
    expect(text).toContain("General")
    expect(text).toContain("Theme")
    expect(text).toContain("Keybinds")
  })

  it("renders title when provided", () => {
    const { screen, flush } = renderTui(
      <SideNav items={items} title="Settings">{renderPanel}</SideNav>,
      { cols: 60, rows: 15 },
    )
    flushN(flush)
    expect(screen.text()).toContain("Settings")
  })

  it("renders first item focused by default", () => {
    const { screen, flush } = renderTui(
      <SideNav items={items}>{renderPanel}</SideNav>,
      { cols: 60, rows: 15 },
    )
    flushN(flush)
    expect(screen.text()).toContain("> General")
  })

  it("renders main panel via children render function", () => {
    const { screen, flush } = renderTui(
      <SideNav items={items}>{renderPanel}</SideNav>,
      { cols: 60, rows: 15 },
    )
    flushN(flush)
    expect(screen.text()).toContain("active:General")
  })

  it("shows status bar by default", () => {
    const { screen, flush } = renderTui(
      <SideNav items={items}>{renderPanel}</SideNav>,
      { cols: 60, rows: 15 },
    )
    flushN(flush)
    expect(screen.text()).toContain("navigate")
  })

  it("hides status bar when showStatusBar=false", () => {
    const { screen, flush } = renderTui(
      <SideNav items={items} showStatusBar={false}>{renderPanel}</SideNav>,
      { cols: 60, rows: 15 },
    )
    flushN(flush)
    expect(screen.text()).not.toContain("navigate")
  })

  // ── Keyboard navigation ───────────────────────────────────────────

  it("down arrow moves focus to next item", async () => {
    const { screen, keys, flush } = renderTui(
      <SideNav items={items}>{renderPanel}</SideNav>,
      { cols: 60, rows: 15 },
    )
    flushN(flush)
    expect(screen.text()).toContain("> General")

    keys.down()
    await settle(flush)
    expect(screen.text()).toContain("> Theme")
    expect(screen.text()).toContain("active:Theme")
  })

  it("up arrow moves focus to previous item", async () => {
    const { screen, keys, flush } = renderTui(
      <SideNav items={items}>{renderPanel}</SideNav>,
      { cols: 60, rows: 15 },
    )
    flushN(flush)

    keys.down()
    await settle(flush)
    expect(screen.text()).toContain("> Theme")

    keys.up()
    await settle(flush)
    expect(screen.text()).toContain("> General")
    expect(screen.text()).toContain("active:General")
  })

  it("enter selects item and enters interactive mode", async () => {
    const { screen, keys, flush } = renderTui(
      <SideNav items={items}>{renderPanel}</SideNav>,
      { cols: 60, rows: 15 },
    )
    flushN(flush)

    keys.enter()
    await settle(flush)
    expect(screen.text()).toContain("interacting:true")
    expect(screen.text()).toContain("(interactive)")
  })

  it("escape exits interactive mode", async () => {
    const { screen, keys, flush } = renderTui(
      <SideNav items={items}>{renderPanel}</SideNav>,
      { cols: 60, rows: 15 },
    )
    flushN(flush)

    keys.enter()
    await settle(flush)
    expect(screen.text()).toContain("interacting:true")

    keys.escape()
    await settle(flush)
    expect(screen.text()).toContain("interacting:false")
  })

  it("children receive correct activeItem after navigation", async () => {
    const { screen, keys, flush } = renderTui(
      <SideNav items={items}>{renderPanel}</SideNav>,
      { cols: 60, rows: 15 },
    )
    flushN(flush)
    expect(screen.text()).toContain("active:General")

    keys.down()
    await settle(flush)
    expect(screen.text()).toContain("active:Theme")

    keys.down()
    await settle(flush)
    expect(screen.text()).toContain("active:Keybinds")
  })

  it("children receive isInteracting=true when selected", async () => {
    const { screen, keys, flush } = renderTui(
      <SideNav items={items}>{renderPanel}</SideNav>,
      { cols: 60, rows: 15 },
    )
    flushN(flush)
    expect(screen.text()).toContain("interacting:false")

    keys.enter()
    await settle(flush)
    expect(screen.text()).toContain("interacting:true")
  })
})
