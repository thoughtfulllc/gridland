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
  await new Promise(resolve => setTimeout(resolve, 50))
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
    expect(screen.text()).toContain("▸ General")
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

  it("renders suffix appended after item name", () => {
    const suffixItems = [
      { id: "new", name: "New chat", suffix: "+" },
      { id: "old", name: "Old chat" },
    ]
    const { screen, flush } = renderTui(
      <SideNav items={suffixItems}>{renderPanel}</SideNav>,
      { cols: 60, rows: 15 },
    )
    flushN(flush)
    expect(screen.text()).toContain("New chat +")
    expect(screen.text()).not.toContain("Old chat +")
  })

  it("shows header by default", () => {
    const { screen, flush } = renderTui(
      <SideNav items={items}>{renderPanel}</SideNav>,
      { cols: 60, rows: 15 },
    )
    flushN(flush)
    const text = screen.text()
    // "General" appears in: sidebar, header, and renderPanel ("active:General")
    const matches = text.match(/General/g) ?? []
    expect(matches.length).toBeGreaterThanOrEqual(3)
  })

  it("hides header when showHeader=false", () => {
    const { screen, flush } = renderTui(
      <SideNav items={items} showHeader={false}>{renderPanel}</SideNav>,
      { cols: 60, rows: 15 },
    )
    flushN(flush)
    const text = screen.text()
    // "General" appears in: sidebar + renderPanel ("active:General"), but no header
    const matches = text.match(/General/g) ?? []
    expect(matches.length).toBe(2)
  })

  // ── Keyboard navigation ───────────────────────────────────────────

  it("down arrow moves focus to next item", async () => {
    const { screen, keys, flush } = renderTui(
      <SideNav items={items}>{renderPanel}</SideNav>,
      { cols: 60, rows: 15 },
    )
    flushN(flush)
    expect(screen.text()).toContain("▸ General")

    keys.down()
    await settle(flush)
    expect(screen.text()).toContain("▸ Theme")
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
    expect(screen.text()).toContain("▸ Theme")

    keys.up()
    await settle(flush)
    expect(screen.text()).toContain("▸ General")
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

  // ── requestedActiveId ─────────────────────────────────────────────

  it("requestedActiveId switches the active item", async () => {
    const { screen, flush, rerender } = renderTui(
      <SideNav items={items}>{renderPanel}</SideNav>,
      { cols: 60, rows: 15 },
    )
    flushN(flush)
    expect(screen.text()).toContain("active:General")

    rerender(
      <SideNav items={items} requestedActiveId="keybinds">{renderPanel}</SideNav>,
    )
    await settle(flush)
    expect(screen.text()).toContain("active:Keybinds")
  })

  it("requestedActiveId with invalid ID is a no-op", async () => {
    const { screen, flush, rerender } = renderTui(
      <SideNav items={items}>{renderPanel}</SideNav>,
      { cols: 60, rows: 15 },
    )
    flushN(flush)
    expect(screen.text()).toContain("active:General")

    rerender(
      <SideNav items={items} requestedActiveId="nonexistent">{renderPanel}</SideNav>,
    )
    await settle(flush)
    expect(screen.text()).toContain("active:General")
  })

  // ── Edge cases ────────────────────────────────────────────────────

  it("handles empty items array without crashing", () => {
    const { flush } = renderTui(
      <SideNav items={[]}>{renderPanel}</SideNav>,
      { cols: 60, rows: 15 },
    )
    flushN(flush)
    // Should not throw — renders null gracefully
  })

  it("requestedActiveId on initial mount syncs focus and panel", async () => {
    const { screen, flush } = renderTui(
      <SideNav items={items} requestedActiveId="keybinds">{renderPanel}</SideNav>,
      { cols: 60, rows: 15 },
    )
    await settle(flush)
    expect(screen.text()).toContain("▸ Keybinds")
    expect(screen.text()).toContain("active:Keybinds")
  })

  // ── onActiveItemChange ────────────────────────────────────────────

  it("onActiveItemChange fires when active item changes via keyboard", async () => {
    const changes: string[] = []
    const { keys, flush } = renderTui(
      <SideNav items={items} onActiveItemChange={(item) => changes.push(item.id)}>{renderPanel}</SideNav>,
      { cols: 60, rows: 15 },
    )
    flushN(flush)
    expect(changes).toEqual([])

    keys.down()
    await settle(flush)
    expect(changes).toEqual(["theme"])

    keys.down()
    await settle(flush)
    expect(changes).toEqual(["theme", "keybinds"])
  })

  it("onActiveItemChange fires when active item changes via requestedActiveId", async () => {
    const changes: string[] = []
    const { flush, rerender } = renderTui(
      <SideNav items={items} onActiveItemChange={(item) => changes.push(item.id)}>{renderPanel}</SideNav>,
      { cols: 60, rows: 15 },
    )
    flushN(flush)
    expect(changes).toEqual([])

    rerender(
      <SideNav items={items} requestedActiveId="keybinds" onActiveItemChange={(item) => changes.push(item.id)}>{renderPanel}</SideNav>,
    )
    await settle(flush)
    expect(changes).toEqual(["keybinds"])
  })

  it("clamps activeIndex when items shrink", async () => {
    const longItems = [
      { id: "a", name: "Alpha" },
      { id: "b", name: "Beta" },
      { id: "c", name: "Charlie" },
    ]
    const { screen, keys, flush, rerender } = renderTui(
      <SideNav items={longItems}>{renderPanel}</SideNav>,
      { cols: 60, rows: 15 },
    )
    flushN(flush)

    // Navigate to last item
    keys.down()
    await settle(flush)
    keys.down()
    await settle(flush)
    expect(screen.text()).toContain("active:Charlie")

    // Shrink items — activeIndex should clamp
    rerender(
      <SideNav items={[longItems[0]]}>{renderPanel}</SideNav>,
    )
    await settle(flush)
    expect(screen.text()).toContain("active:Alpha")
  })
})
