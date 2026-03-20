import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { HeadlessRenderer, setHeadlessRootRenderableClass } from "./headless-renderer"

// A minimal mock RootRenderable for testing
class MockRootRenderable {
  renderContext: any
  resized: { cols: number; rows: number } | null = null

  constructor(renderContext: any) {
    this.renderContext = renderContext
  }

  calculateLayout() {}

  updateLayout(_deltaTime: number, _renderList: any[]) {}

  resize(cols: number, rows: number) {
    this.resized = { cols, rows }
  }
}

describe("HeadlessRenderer", () => {
  beforeEach(() => {
    setHeadlessRootRenderableClass(MockRootRenderable)
  })

  afterEach(() => {
    // Reset to null to test the error case
    setHeadlessRootRenderableClass(null as any)
  })

  it("creates with correct dimensions", () => {
    setHeadlessRootRenderableClass(MockRootRenderable)
    const renderer = new HeadlessRenderer({ cols: 80, rows: 24 })
    expect(renderer.buffer.width).toBe(80)
    expect(renderer.buffer.height).toBe(24)
  })

  it("creates a render context with correct dimensions", () => {
    setHeadlessRootRenderableClass(MockRootRenderable)
    const renderer = new HeadlessRenderer({ cols: 40, rows: 10 })
    expect(renderer.renderContext.width).toBe(40)
    expect(renderer.renderContext.height).toBe(10)
  })

  it("creates a root renderable", () => {
    setHeadlessRootRenderableClass(MockRootRenderable)
    const renderer = new HeadlessRenderer({ cols: 80, rows: 24 })
    expect(renderer.root).toBeInstanceOf(MockRootRenderable)
    expect(renderer.root.renderContext).toBe(renderer.renderContext)
  })

  it("throws if RootRenderableClass is not set", () => {
    setHeadlessRootRenderableClass(null as any)
    expect(() => new HeadlessRenderer({ cols: 80, rows: 24 })).toThrow(
      "RootRenderableClass not set",
    )
  })

  it("renderOnce executes the render pipeline", () => {
    setHeadlessRootRenderableClass(MockRootRenderable)
    const renderer = new HeadlessRenderer({ cols: 10, rows: 3 })

    // Should not throw
    renderer.renderOnce()
  })

  it("toText returns string representation of the buffer", () => {
    setHeadlessRootRenderableClass(MockRootRenderable)
    const renderer = new HeadlessRenderer({ cols: 10, rows: 3 })
    renderer.renderOnce()

    const text = renderer.toText()
    expect(typeof text).toBe("string")
  })

  it("resize updates buffer, context, and root", () => {
    setHeadlessRootRenderableClass(MockRootRenderable)
    const renderer = new HeadlessRenderer({ cols: 80, rows: 24 })

    renderer.resize(40, 10)

    expect(renderer.buffer.width).toBe(40)
    expect(renderer.buffer.height).toBe(10)
    expect(renderer.renderContext.width).toBe(40)
    expect(renderer.renderContext.height).toBe(10)
    expect((renderer.root as MockRootRenderable).resized).toEqual({ cols: 40, rows: 10 })
  })

  it("setHeadlessRootRenderableClass allows changing the class", () => {
    class AltRootRenderable {
      renderContext: any
      constructor(ctx: any) { this.renderContext = ctx }
      calculateLayout() {}
      updateLayout() {}
      resize() {}
    }

    setHeadlessRootRenderableClass(AltRootRenderable)
    const renderer = new HeadlessRenderer({ cols: 10, rows: 5 })
    expect(renderer.root).toBeInstanceOf(AltRootRenderable)
  })

  it("render context onRenderRequest is a no-op", () => {
    setHeadlessRootRenderableClass(MockRootRenderable)
    const renderer = new HeadlessRenderer({ cols: 10, rows: 3 })

    // Triggering a render request should not throw or do anything
    renderer.renderContext.requestRender()
  })
})
