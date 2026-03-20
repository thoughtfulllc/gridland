import { describe, it, expect, beforeEach } from "bun:test"
import { BrowserRenderContext } from "./browser-render-context"

describe("BrowserRenderContext hit-grid", () => {
  let ctx: BrowserRenderContext

  beforeEach(() => {
    ctx = new BrowserRenderContext(80, 24)
  })

  it("hitTest returns null when grid is empty", () => {
    expect(ctx.hitTest(5, 5)).toBeNull()
  })

  it("addToHitGrid + hitTest returns correct ID", () => {
    ctx.addToHitGrid(0, 0, 10, 5, 1)
    expect(ctx.hitTest(5, 2)).toBe(1)
  })

  it("hitTest returns null for coordinates outside entry", () => {
    ctx.addToHitGrid(10, 10, 5, 5, 1)
    expect(ctx.hitTest(0, 0)).toBeNull()
    expect(ctx.hitTest(15, 15)).toBeNull()
  })

  it("later entries take priority (topmost)", () => {
    ctx.addToHitGrid(0, 0, 20, 20, 1)
    ctx.addToHitGrid(5, 5, 10, 10, 2)
    // Inside both — entry 2 (later) wins
    expect(ctx.hitTest(7, 7)).toBe(2)
    // Outside entry 2 but inside entry 1
    expect(ctx.hitTest(2, 2)).toBe(1)
  })

  it("clearHitGrid empties the grid", () => {
    ctx.addToHitGrid(0, 0, 10, 10, 1)
    ctx.clearHitGrid()
    expect(ctx.hitTest(5, 5)).toBeNull()
  })

  it("scissor rect clips entries outside bounds", () => {
    ctx.pushHitGridScissorRect(5, 5, 10, 10)
    ctx.addToHitGrid(0, 0, 20, 20, 1)
    // The entry should be clipped to (5,5)-(15,15)
    expect(ctx.hitTest(3, 3)).toBeNull() // outside scissor
    expect(ctx.hitTest(7, 7)).toBe(1) // inside scissor
    ctx.popHitGridScissorRect()
  })

  it("scissor rect fully clips entry that's outside", () => {
    ctx.pushHitGridScissorRect(0, 0, 5, 5)
    ctx.addToHitGrid(10, 10, 5, 5, 1)
    // Entry is fully outside scissor, should not be added
    expect(ctx.hitTest(12, 12)).toBeNull()
    ctx.popHitGridScissorRect()
  })

  it("multiple entries work correctly", () => {
    ctx.addToHitGrid(0, 0, 5, 5, 1)
    ctx.addToHitGrid(10, 0, 5, 5, 2)
    ctx.addToHitGrid(0, 10, 5, 5, 3)
    expect(ctx.hitTest(2, 2)).toBe(1)
    expect(ctx.hitTest(12, 2)).toBe(2)
    expect(ctx.hitTest(2, 12)).toBe(3)
    expect(ctx.hitTest(12, 12)).toBeNull()
  })

  it("boundary conditions: exact edge of entry", () => {
    ctx.addToHitGrid(5, 5, 10, 10, 1)
    expect(ctx.hitTest(5, 5)).toBe(1) // top-left corner (inclusive)
    expect(ctx.hitTest(14, 14)).toBe(1) // bottom-right corner (inclusive)
    expect(ctx.hitTest(15, 15)).toBeNull() // just outside
  })

  it("getHitGridEntries returns all entries", () => {
    ctx.addToHitGrid(0, 0, 5, 5, 1)
    ctx.addToHitGrid(10, 10, 5, 5, 2)
    expect(ctx.getHitGridEntries().length).toBe(2)
  })
})
