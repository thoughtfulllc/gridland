import { describe, it, expect, mock } from "bun:test"
import { CanvasPainter } from "../canvas-painter"
import { BrowserBuffer } from "../browser-buffer"
import { RGBA } from "@gridland/utils"

function createMockCtx() {
  const calls: { method: string; args: any[] }[] = []
  return {
    calls,
    font: "",
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    measureText: mock(() => ({ width: 8 })),
    fillRect: mock((...args: any[]) => calls.push({ method: "fillRect", args })),
    fillText: mock((...args: any[]) => calls.push({ method: "fillText", args })),
    beginPath: mock(() => {}),
    moveTo: mock(() => {}),
    lineTo: mock(() => {}),
    stroke: mock(() => {}),
    clearRect: mock(() => {}),
    setTransform: mock(() => {}),
    scale: mock(() => {}),
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
