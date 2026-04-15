import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test"
import { BrowserRenderContext } from "../../../../web/src/browser-render-context"
import { OptimizedBuffer } from "../../buffer"
import type { RenderContext } from "../../types"
import { ASCIIFontRenderable } from "../ASCIIFont"

// Phase 1 spec: ASCIIFontRenderable must not call renderFontToBuffer from its
// constructor or from prop setters. Population moves into a dirty-flagged
// populateBuffer() method that runs on the next render() call after a prop
// change. See tasks/003-browser-compat-contract.md §6 Phase 1.
//
// The observable contract is "prop setters do not draw synchronously; they
// mark the renderable dirty and defer drawing to the next render()". The
// cleanest way to observe that is via spy counts on
// OptimizedBuffer.setCellWithAlphaBlending, which is the bottom of the
// renderFontToFrameBuffer call chain.

describe("ASCIIFontRenderable dirty-flagged population", () => {
  let ctx: RenderContext
  let destBuffer: ReturnType<typeof OptimizedBuffer.create>
  let createSpy: ReturnType<typeof spyOn>
  let setCellSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    ctx = new BrowserRenderContext(80, 24) as unknown as RenderContext
    destBuffer = OptimizedBuffer.create(80, 24, ctx.widthMethod)
    createSpy = spyOn(OptimizedBuffer, "create")
    setCellSpy = spyOn(OptimizedBuffer.prototype, "setCellWithAlphaBlending")
  })

  afterEach(() => {
    createSpy.mockRestore()
    setCellSpy.mockRestore()
  })

  test("constructor does not allocate a buffer", () => {
    const renderable = new ASCIIFontRenderable(ctx, { text: "hi", font: "tiny" })

    expect(createSpy).not.toHaveBeenCalled()
    expect(renderable.frameBuffer).toBeNull()
  })

  test("constructor does not draw glyphs", () => {
    new ASCIIFontRenderable(ctx, { text: "hi", font: "tiny" })

    expect(setCellSpy).not.toHaveBeenCalled()
  })

  test("first render allocates the buffer and draws glyphs", () => {
    const renderable = new ASCIIFontRenderable(ctx, { text: "hi", font: "tiny" })
    renderable.render(destBuffer, 0)

    expect(renderable.frameBuffer).not.toBeNull()
    expect(setCellSpy.mock.calls.length).toBeGreaterThan(0)
  })

  test("second render without prop change does not redraw", () => {
    const renderable = new ASCIIFontRenderable(ctx, { text: "hi", font: "tiny" })
    renderable.render(destBuffer, 0)
    const drawsAfterFirstRender = setCellSpy.mock.calls.length
    expect(drawsAfterFirstRender).toBeGreaterThan(0)

    renderable.render(destBuffer, 0)

    expect(setCellSpy.mock.calls.length).toBe(drawsAfterFirstRender)
  })

  test("setting text defers drawing until the next render", () => {
    const renderable = new ASCIIFontRenderable(ctx, { text: "hi", font: "tiny" })
    renderable.render(destBuffer, 0)
    const drawsBeforeSetter = setCellSpy.mock.calls.length

    renderable.text = "HELLO"

    // Setter must NOT draw synchronously — current impl calls renderFontToBuffer
    // from the setter, so this assertion fails on main.
    expect(setCellSpy.mock.calls.length).toBe(drawsBeforeSetter)

    renderable.render(destBuffer, 0)

    expect(setCellSpy.mock.calls.length).toBeGreaterThan(drawsBeforeSetter)
  })

  test("setting font marks the buffer dirty and does not draw synchronously", () => {
    const renderable = new ASCIIFontRenderable(ctx, { text: "AB", font: "tiny" })
    renderable.render(destBuffer, 0)
    expect((renderable as unknown as { _bufferDirty: boolean })._bufferDirty).toBe(false)
    const drawsBeforeSetter = setCellSpy.mock.calls.length

    renderable.font = "block"

    // Setter must not draw synchronously; the dirty flag signals that the
    // next render needs to repopulate. The size-mismatch path that would
    // drive the actual repopulation runs through Yoga's onResize, which
    // this test env deliberately doesn't exercise (see frame-buffer.test
    // `resize after first render` for the full buffer-lifecycle contract).
    expect(setCellSpy.mock.calls.length).toBe(drawsBeforeSetter)
    expect((renderable as unknown as { _bufferDirty: boolean })._bufferDirty).toBe(true)
  })

  test("setting color defers drawing until the next render", () => {
    const renderable = new ASCIIFontRenderable(ctx, { text: "hi", font: "tiny" })
    renderable.render(destBuffer, 0)
    const drawsBeforeSetter = setCellSpy.mock.calls.length

    renderable.color = "#FF0000"

    expect(setCellSpy.mock.calls.length).toBe(drawsBeforeSetter)

    renderable.render(destBuffer, 0)

    expect(setCellSpy.mock.calls.length).toBeGreaterThan(drawsBeforeSetter)
  })
})
