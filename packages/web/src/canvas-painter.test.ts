import { describe, it, expect, mock } from "bun:test"
import { CanvasPainter } from "./canvas-painter"
import { BrowserBuffer } from "./browser-buffer"
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
    beginPath: mock((...args: any[]) => calls.push({ method: "beginPath", args })),
    moveTo: mock(() => {}),
    lineTo: mock(() => {}),
    stroke: mock(() => {}),
    clearRect: mock(() => {}),
    setTransform: mock(() => {}),
    scale: mock(() => {}),
    roundRect: mock((...args: any[]) => calls.push({ method: "roundRect", args })),
    rect: mock((...args: any[]) => calls.push({ method: "rect", args })),
    fill: mock((...args: any[]) => calls.push({ method: "fill", args })),
    save: mock((...args: any[]) => calls.push({ method: "save", args })),
    restore: mock((...args: any[]) => calls.push({ method: "restore", args })),
    clip: mock((...args: any[]) => calls.push({ method: "clip", args })),
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

  it("applies save/clip/restore for roundedBackground with clipRect", () => {
    const painter = new CanvasPainter()
    const ctx = createMockCtx()
    painter.measureCell(ctx)
    const cw = painter.getCellSize().width
    const ch = painter.getCellSize().height

    const buf = BrowserBuffer.create(20, 10, "wcwidth")
    buf.roundedBackgrounds.push({
      x: 2, y: 1, width: 6, height: 3,
      color: { r: 0, g: 0, b: 255, a: 255 },
      radius: 8,
      clipRect: { x: 1, y: 0, width: 10, height: 5 },
    })

    painter.paint(ctx, buf)

    // Find the sequence: save → beginPath → rect → clip → beginPath → roundRect → fill → restore
    const methods = ctx.calls.map((c: any) => c.method)
    const saveIdx = methods.indexOf("save")
    expect(saveIdx).toBeGreaterThanOrEqual(0)

    const restoreIdx = methods.indexOf("restore", saveIdx)
    expect(restoreIdx).toBeGreaterThan(saveIdx)

    // Between save and restore: rect (clip), clip, beginPath, roundRect, fill
    const between = methods.slice(saveIdx + 1, restoreIdx)
    expect(between).toContain("rect")
    expect(between).toContain("clip")
    expect(between).toContain("roundRect")
    expect(between).toContain("fill")

    // Verify clip rect coordinates match clipRect * cell size
    const rectCall = ctx.calls.find((c: any) => c.method === "rect")
    expect(rectCall.args[0]).toBeCloseTo(1 * cw)
    expect(rectCall.args[1]).toBeCloseTo(0 * ch)
    expect(rectCall.args[2]).toBeCloseTo(10 * cw)
    expect(rectCall.args[3]).toBeCloseTo(5 * ch)

    // Verify roundRect coordinates
    const roundRectCall = ctx.calls.find((c: any) => c.method === "roundRect")
    expect(roundRectCall.args[0]).toBeCloseTo(2 * cw)
    expect(roundRectCall.args[1]).toBeCloseTo(1 * ch)
    expect(roundRectCall.args[4]).toBe(8) // radius
  })

  it("does not save/clip/restore for roundedBackground without clipRect", () => {
    const painter = new CanvasPainter()
    const ctx = createMockCtx()
    painter.measureCell(ctx)

    const buf = BrowserBuffer.create(20, 10, "wcwidth")
    buf.roundedBackgrounds.push({
      x: 2, y: 1, width: 6, height: 3,
      color: { r: 0, g: 0, b: 255, a: 255 },
      radius: 8,
    })

    painter.paint(ctx, buf)

    const methods = ctx.calls.map((c: any) => c.method)
    expect(methods).not.toContain("save")
    expect(methods).not.toContain("clip")
    expect(methods).not.toContain("restore")
    // But roundRect should still be called
    expect(methods).toContain("roundRect")
    expect(methods).toContain("fill")
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
