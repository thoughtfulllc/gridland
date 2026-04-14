import { describe, it, expect, mock } from "bun:test"
import { CanvasPainter, type CursorOverlay } from "./canvas-painter"
import { BrowserBuffer } from "./browser-buffer"
import { RGBA } from "@gridland/utils"

function createMockCtx() {
  const calls: { method: string; args: any[] }[] = []
  const record = (method: string) => mock((...args: any[]) => { calls.push({ method, args }) })
  return {
    calls,
    font: "",
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    lineCap: "",
    measureText: mock(() => ({ width: 8 })),
    fillRect: record("fillRect"),
    fillText: record("fillText"),
    strokeRect: record("strokeRect"),
    rect: record("rect"),
    beginPath: record("beginPath"),
    moveTo: mock(() => {}),
    lineTo: mock(() => {}),
    stroke: mock(() => {}),
    ellipse: mock(() => {}),
    setLineDash: mock(() => {}),
    clearRect: mock(() => {}),
    setTransform: mock(() => {}),
    scale: mock(() => {}),
    save: record("save"),
    restore: record("restore"),
    clip: record("clip"),
  } as any
}

describe("CanvasPainter", () => {
  it("measures cell size", () => {
    const painter = new CanvasPainter()
    const ctx = createMockCtx()
    const size = painter.measureCell(ctx)
    expect(size.width).toBeGreaterThan(0)
    expect(size.height).toBeGreaterThan(0)
  })

  it("paints background rects", () => {
    const painter = new CanvasPainter()
    const ctx = createMockCtx()
    painter.measureCell(ctx)

    const buf = BrowserBuffer.create(3, 1, "wcwidth")
    buf.fillRect(0, 0, 3, 1, RGBA.fromValues(1, 0, 0, 1))

    painter.paint(ctx, buf)

    // Should have at least one fillRect call for the background
    const bgCalls = ctx.calls.filter((c: any) => c.method === "fillRect")
    expect(bgCalls.length).toBeGreaterThan(0)
  })

  it("paints foreground characters", () => {
    const painter = new CanvasPainter()
    const ctx = createMockCtx()
    painter.measureCell(ctx)

    const buf = BrowserBuffer.create(5, 1, "wcwidth")
    buf.drawText("Hi", 0, 0, RGBA.fromValues(1, 1, 1, 1), RGBA.fromValues(0, 0, 0, 1))

    painter.paint(ctx, buf)

    // Should have fillText calls for 'H' and 'i'
    const textCalls = ctx.calls.filter((c: any) => c.method === "fillText")
    expect(textCalls.length).toBe(2)
    expect(textCalls[0].args[0]).toBe("H")
    expect(textCalls[1].args[0]).toBe("i")
  })

  it("skips empty/space cells", () => {
    const painter = new CanvasPainter()
    const ctx = createMockCtx()
    painter.measureCell(ctx)

    const buf = BrowserBuffer.create(5, 1, "wcwidth")
    // Buffer is all spaces by default

    painter.paint(ctx, buf)

    // No fillText calls for spaces
    const textCalls = ctx.calls.filter((c: any) => c.method === "fillText")
    expect(textCalls.length).toBe(0)
  })
})

// Painter-direct channels: data structures the painter draws OUTSIDE the cell grid.
//
// See .claude/rules/render-pipeline.md. The current channel is the line cursor
// overlay (CursorOverlay). The buffer/renderer captures it during the render pipeline
// and the painter draws it directly via fillRect, bypassing the cell grid entirely.
//
// The current cursor channel is bounds-checked at capture time, not scissor-clipped.
// The four-state pattern below is the template for any FUTURE channel that needs to
// respect overflow="hidden" containers — see the rule for the full invariant. When
// adding a new channel, copy the four cases (capture / skip-when-outside / paint-with-clip
// / no-clip-when-absent) and adapt them.
describe("CanvasPainter painter-direct channels", () => {
  describe("cursor overlay", () => {
    it("does not draw a cursor when overlay is null", () => {
      const painter = new CanvasPainter()
      const ctx = createMockCtx()
      painter.measureCell(ctx)
      const buf = BrowserBuffer.create(5, 2, "wcwidth")

      painter.paint(ctx, buf, undefined, null)

      const fillRectAt = (x: number) => ctx.calls.some((c: any) => c.method === "fillRect" && c.args[0] === x)
      // No cursor-shaped fillRect at any position derived from a CursorOverlay
      expect(fillRectAt(0)).toBe(false)
    })

    it("draws the cursor at (x*cellW, y*cellH) when overlay is provided and not blinking", () => {
      const painter = new CanvasPainter()
      const ctx = createMockCtx()
      painter.measureCell(ctx)
      const { width: cw, height: ch } = painter.getCellSize()
      const buf = BrowserBuffer.create(10, 5, "wcwidth")

      const cursor: CursorOverlay = {
        x: 3,
        y: 2,
        color: { r: 1, g: 1, b: 1, a: 1 } as any,
        blinking: false,
      }
      painter.paint(ctx, buf, undefined, cursor)

      const cursorRect = ctx.calls.find(
        (c: any) => c.method === "fillRect" && c.args[0] === 3 * cw && c.args[1] === 2 * ch,
      )
      expect(cursorRect).toBeDefined()
      // cursor rect height matches cell height (LINE_CURSOR_WIDTH × ch)
      expect(cursorRect!.args[3]).toBe(ch)
    })

    it("does not draw the cursor when blinking and the blink phase is off", () => {
      const painter = new CanvasPainter()
      const ctx = createMockCtx()
      painter.measureCell(ctx)
      const { width: cw, height: ch } = painter.getCellSize()
      const buf = BrowserBuffer.create(10, 5, "wcwidth")

      // 530ms is the blink interval — at exactly one interval, floor(530/530)=1, %2 === 1 → off.
      const originalNow = performance.now
      ;(performance as any).now = () => 530
      try {
        const cursor: CursorOverlay = {
          x: 1,
          y: 1,
          color: { r: 1, g: 1, b: 1, a: 1 } as any,
          blinking: true,
        }
        painter.paint(ctx, buf, undefined, cursor)

        const cursorRect = ctx.calls.find(
          (c: any) => c.method === "fillRect" && c.args[0] === 1 * cw && c.args[1] === 1 * ch,
        )
        expect(cursorRect).toBeUndefined()
      } finally {
        ;(performance as any).now = originalNow
      }
    })

    it("draws the cursor when blinking and the blink phase is on", () => {
      const painter = new CanvasPainter()
      const ctx = createMockCtx()
      painter.measureCell(ctx)
      const { width: cw, height: ch } = painter.getCellSize()
      const buf = BrowserBuffer.create(10, 5, "wcwidth")

      const originalNow = performance.now
      ;(performance as any).now = () => 0
      try {
        const cursor: CursorOverlay = {
          x: 4,
          y: 0,
          color: { r: 1, g: 1, b: 1, a: 1 } as any,
          blinking: true,
        }
        painter.paint(ctx, buf, undefined, cursor)

        const cursorRect = ctx.calls.find(
          (c: any) => c.method === "fillRect" && c.args[0] === 4 * cw && c.args[1] === 0 * ch,
        )
        expect(cursorRect).toBeDefined()
      } finally {
        ;(performance as any).now = originalNow
      }
    })

    it("never emits ctx.save/clip/restore for the cursor channel today", () => {
      // The cursor channel is bounds-checked, not scissor-clipped, per the rule.
      // If a future change wires the cursor through the scissor system, this assertion
      // will fail and the cursor describe block must be expanded with the four-state
      // pattern from .claude/rules/render-pipeline.md.
      const painter = new CanvasPainter()
      const ctx = createMockCtx()
      painter.measureCell(ctx)
      const buf = BrowserBuffer.create(5, 2, "wcwidth")

      const cursor: CursorOverlay = {
        x: 1,
        y: 0,
        color: { r: 1, g: 1, b: 1, a: 1 } as any,
        blinking: false,
      }
      painter.paint(ctx, buf, undefined, cursor)

      const clipCalls = ctx.calls.filter((c: any) => c.method === "save" || c.method === "clip" || c.method === "restore")
      expect(clipCalls.length).toBe(0)
    })
  })
})
