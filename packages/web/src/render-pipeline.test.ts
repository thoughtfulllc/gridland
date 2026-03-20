import { describe, it, expect, mock } from "bun:test"
import { executeRenderPipeline } from "./render-pipeline"

describe("executeRenderPipeline", () => {
  function createMockBuffer() {
    return {
      clear: mock(() => {}),
      pushScissorRect: mock((_x: number, _y: number, _w: number, _h: number) => {}),
      popScissorRect: mock(() => {}),
      pushOpacity: mock((_opacity: number) => {}),
      popOpacity: mock(() => {}),
      clearScissorRects: mock(() => {}),
      clearOpacity: mock(() => {}),
    }
  }

  function createMockRenderContext(lifecyclePasses: any[] = []) {
    return {
      getLifecyclePasses: mock(() => lifecyclePasses),
    }
  }

  function createMockRoot(renderList: any[] = []) {
    return {
      calculateLayout: mock(() => {}),
      updateLayout: mock((_dt: number, list: any[]) => {
        for (const cmd of renderList) {
          list.push(cmd)
        }
      }),
    }
  }

  it("clears buffer at the start", () => {
    const buffer = createMockBuffer()
    const ctx = createMockRenderContext()
    const root = createMockRoot()

    executeRenderPipeline(buffer as any, ctx as any, root, 0)

    expect(buffer.clear).toHaveBeenCalledTimes(1)
  })

  it("runs lifecycle passes", () => {
    const pass1 = { onLifecyclePass: mock(() => {}) }
    const pass2 = { onLifecyclePass: mock(() => {}) }
    const buffer = createMockBuffer()
    const ctx = createMockRenderContext([pass1, pass2])
    const root = createMockRoot()

    executeRenderPipeline(buffer as any, ctx as any, root, 0)

    expect(pass1.onLifecyclePass).toHaveBeenCalledTimes(1)
    expect(pass2.onLifecyclePass).toHaveBeenCalledTimes(1)
  })

  it("skips renderables without onLifecyclePass", () => {
    const pass1 = { onLifecyclePass: mock(() => {}) }
    const pass2 = {} // no onLifecyclePass
    const buffer = createMockBuffer()
    const ctx = createMockRenderContext([pass1, pass2])
    const root = createMockRoot()

    // Should not throw
    executeRenderPipeline(buffer as any, ctx as any, root, 0)

    expect(pass1.onLifecyclePass).toHaveBeenCalledTimes(1)
  })

  it("calculates layout", () => {
    const buffer = createMockBuffer()
    const ctx = createMockRenderContext()
    const root = createMockRoot()

    executeRenderPipeline(buffer as any, ctx as any, root, 16)

    expect(root.calculateLayout).toHaveBeenCalledTimes(1)
  })

  it("passes deltaTime to updateLayout", () => {
    const buffer = createMockBuffer()
    const ctx = createMockRenderContext()
    const root = createMockRoot()

    executeRenderPipeline(buffer as any, ctx as any, root, 16.67)

    expect(root.updateLayout).toHaveBeenCalledTimes(1)
    expect(root.updateLayout.mock.calls[0][0]).toBe(16.67)
  })

  it("executes pushScissorRect commands", () => {
    const buffer = createMockBuffer()
    const ctx = createMockRenderContext()
    const root = createMockRoot([
      { action: "pushScissorRect", x: 1, y: 2, width: 10, height: 5 },
    ])

    executeRenderPipeline(buffer as any, ctx as any, root, 0)

    expect(buffer.pushScissorRect).toHaveBeenCalledWith(1, 2, 10, 5)
  })

  it("executes popScissorRect commands", () => {
    const buffer = createMockBuffer()
    const ctx = createMockRenderContext()
    const root = createMockRoot([{ action: "popScissorRect" }])

    executeRenderPipeline(buffer as any, ctx as any, root, 0)

    expect(buffer.popScissorRect).toHaveBeenCalledTimes(1)
  })

  it("executes pushOpacity commands", () => {
    const buffer = createMockBuffer()
    const ctx = createMockRenderContext()
    const root = createMockRoot([{ action: "pushOpacity", opacity: 0.5 }])

    executeRenderPipeline(buffer as any, ctx as any, root, 0)

    expect(buffer.pushOpacity).toHaveBeenCalledWith(0.5)
  })

  it("executes popOpacity commands", () => {
    const buffer = createMockBuffer()
    const ctx = createMockRenderContext()
    const root = createMockRoot([{ action: "popOpacity" }])

    executeRenderPipeline(buffer as any, ctx as any, root, 0)

    expect(buffer.popOpacity).toHaveBeenCalledTimes(1)
  })

  it("executes render commands with deltaTime", () => {
    const renderable = { render: mock((_buffer: any, _dt: number) => {}) }
    const buffer = createMockBuffer()
    const ctx = createMockRenderContext()
    const root = createMockRoot([{ action: "render", renderable }])

    executeRenderPipeline(buffer as any, ctx as any, root, 33)

    expect(renderable.render).toHaveBeenCalledWith(buffer, 33)
  })

  it("executes multiple commands in order", () => {
    const renderable = { render: mock(() => {}) }
    const callOrder: string[] = []
    const buffer = createMockBuffer()
    buffer.pushScissorRect = mock(() => { callOrder.push("pushScissor") }) as any
    buffer.popScissorRect = mock(() => { callOrder.push("popScissor") }) as any
    renderable.render = mock(() => { callOrder.push("render") }) as any

    const ctx = createMockRenderContext()
    const root = createMockRoot([
      { action: "pushScissorRect", x: 0, y: 0, width: 10, height: 10 },
      { action: "render", renderable },
      { action: "popScissorRect" },
    ])

    executeRenderPipeline(buffer as any, ctx as any, root, 0)

    expect(callOrder).toEqual(["pushScissor", "render", "popScissor"])
  })

  it("clears scissor rects and opacity at the end", () => {
    const buffer = createMockBuffer()
    const ctx = createMockRenderContext()
    const root = createMockRoot()

    executeRenderPipeline(buffer as any, ctx as any, root, 0)

    expect(buffer.clearScissorRects).toHaveBeenCalledTimes(1)
    expect(buffer.clearOpacity).toHaveBeenCalledTimes(1)
  })

  it("handles empty render list", () => {
    const buffer = createMockBuffer()
    const ctx = createMockRenderContext()
    const root = createMockRoot([])

    // Should not throw
    executeRenderPipeline(buffer as any, ctx as any, root, 0)

    expect(buffer.clear).toHaveBeenCalledTimes(1)
    expect(buffer.clearScissorRects).toHaveBeenCalledTimes(1)
    expect(buffer.clearOpacity).toHaveBeenCalledTimes(1)
  })

  it("ignores unknown command actions", () => {
    const buffer = createMockBuffer()
    const ctx = createMockRenderContext()
    const root = createMockRoot([{ action: "unknownAction" }])

    // Should not throw
    executeRenderPipeline(buffer as any, ctx as any, root, 0)
  })
})
