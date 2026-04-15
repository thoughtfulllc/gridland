import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test"
import { BrowserRenderContext } from "../../../../web/src/browser-render-context"
import { OptimizedBuffer } from "../../buffer"
import type { RenderContext } from "../../types"
import { FrameBufferRenderable } from "../FrameBuffer"

// Phase 1 spec: FrameBufferRenderable must no longer allocate its buffer in the
// constructor. Allocation is deferred to the first render call. See
// tasks/003-browser-compat-contract.md §6 Phase 1 and INV-2.
//
// Note on test environment: packages/core's test preload shims core/src/buffer.ts
// so OptimizedBuffer === BrowserBuffer during tests. "Spy on resolveRenderLib"
// from the spec table is therefore expressed here as "spy on OptimizedBuffer.create",
// which is the same observable surface — a constructor that calls create() is
// exactly what crashes in a real Vite app where create() is not shimmed.

describe("FrameBufferRenderable lazy allocation", () => {
  let ctx: RenderContext
  let createSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    ctx = new BrowserRenderContext(80, 24) as unknown as RenderContext
    createSpy = spyOn(OptimizedBuffer, "create")
  })

  afterEach(() => {
    createSpy.mockRestore()
  })

  test("constructor does not allocate a buffer", () => {
    const renderable = new FrameBufferRenderable(ctx, { width: 10, height: 5 })

    expect(createSpy).not.toHaveBeenCalled()
    expect(renderable.frameBuffer).toBeNull()
  })

  test("width and height are derived from props, not buffer", () => {
    const renderable = new FrameBufferRenderable(ctx, { width: 10, height: 5 })

    expect(renderable.width).toBe(10)
    expect(renderable.height).toBe(5)
    expect(createSpy).not.toHaveBeenCalled()
  })

  test("render allocates exactly once across 5 calls", () => {
    const renderable = new FrameBufferRenderable(ctx, { width: 10, height: 5 })
    const destBuffer = OptimizedBuffer.create(80, 24, ctx.widthMethod)

    // Reset spy after the dest-buffer allocation above so the assertion
    // only counts renderable-internal allocations.
    createSpy.mockClear()

    for (let i = 0; i < 5; i++) {
      renderable.render(destBuffer, 0)
    }

    expect(createSpy).toHaveBeenCalledTimes(1)
    expect(renderable.frameBuffer).not.toBeNull()
  })

  test("resize before first render does not allocate a buffer", () => {
    const renderable = new FrameBufferRenderable(ctx, { width: 10, height: 5 })

    // onResize would normally be invoked by Yoga's layout pass. Call it
    // directly; we care about the constructor/render contract, not layout.
    ;(renderable as unknown as { onResize: (w: number, h: number) => void }).onResize(20, 10)

    expect(createSpy).not.toHaveBeenCalled()
    expect(renderable.frameBuffer).toBeNull()
  })

  test("resize after first render destroys old buffer and reallocates on next render", () => {
    const renderable = new FrameBufferRenderable(ctx, { width: 10, height: 5 })
    const destBuffer = OptimizedBuffer.create(80, 24, ctx.widthMethod)
    createSpy.mockClear()

    renderable.render(destBuffer, 0)
    expect(createSpy).toHaveBeenCalledTimes(1)

    const firstBuffer = renderable.frameBuffer!
    expect(firstBuffer).not.toBeNull()
    const destroySpy = spyOn(firstBuffer, "destroy")

    ;(renderable as unknown as { onResize: (w: number, h: number) => void }).onResize(20, 10)

    expect(destroySpy).toHaveBeenCalled()
    expect(renderable.frameBuffer).toBeNull()

    renderable.render(destBuffer, 0)

    expect(createSpy).toHaveBeenCalledTimes(2)
    expect(renderable.frameBuffer).not.toBe(firstBuffer)
  })
})
