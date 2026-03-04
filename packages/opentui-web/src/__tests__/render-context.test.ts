import { describe, it, expect } from "bun:test"
import { BrowserRenderContext, BrowserKeyHandler, BrowserInternalKeyHandler } from "../browser-render-context"

describe("BrowserRenderContext", () => {
  it("creates with dimensions", () => {
    const ctx = new BrowserRenderContext(80, 24)
    expect(ctx.width).toBe(80)
    expect(ctx.height).toBe(24)
  })

  it("resizes and emits event", () => {
    const ctx = new BrowserRenderContext(80, 24)
    let resizeArgs: any = null
    ctx.on("resize", (w: number, h: number) => {
      resizeArgs = [w, h]
    })
    ctx.resize(120, 40)
    expect(ctx.width).toBe(120)
    expect(ctx.height).toBe(40)
    expect(resizeArgs).toEqual([120, 40])
  })

  it("requestRender calls callback", () => {
    const ctx = new BrowserRenderContext(80, 24)
    let called = false
    ctx.setOnRenderRequest(() => {
      called = true
    })
    ctx.requestRender()
    expect(called).toBe(true)
  })

  it("focusRenderable tracks focus", () => {
    const ctx = new BrowserRenderContext(80, 24)
    expect(ctx.currentFocusedRenderable).toBeNull()

    const mockRenderable = { blur: () => {} }
    ctx.focusRenderable(mockRenderable)
    expect(ctx.currentFocusedRenderable).toBe(mockRenderable)
  })

  it("focusRenderable blurs previous", () => {
    const ctx = new BrowserRenderContext(80, 24)
    let blurred = false
    const first = { blur: () => { blurred = true } }
    const second = {}

    ctx.focusRenderable(first)
    ctx.focusRenderable(second)
    expect(blurred).toBe(true)
    expect(ctx.currentFocusedRenderable).toBe(second)
  })

  it("registers and unregisters lifecycle passes", () => {
    const ctx = new BrowserRenderContext(80, 24)
    const renderable = {}

    ctx.registerLifecyclePass(renderable)
    expect(ctx.getLifecyclePasses().has(renderable)).toBe(true)

    ctx.unregisterLifecyclePass(renderable)
    expect(ctx.getLifecyclePasses().has(renderable)).toBe(false)
  })
})

describe("BrowserKeyHandler", () => {
  it("emits events", () => {
    const handler = new BrowserKeyHandler()
    let received: any = null
    handler.on("keypress", (event: any) => {
      received = event
    })
    handler.emit("keypress", { name: "a" })
    expect(received).toEqual({ name: "a" })
  })
})

describe("BrowserInternalKeyHandler", () => {
  it("emits to internal handlers", () => {
    const handler = new BrowserInternalKeyHandler()
    let received: any = null
    handler.onInternal("keypress", (event: any) => {
      received = event
    })
    handler.emit("keypress", { name: "b" })
    expect(received).toEqual({ name: "b" })
  })

  it("stops propagation", () => {
    const handler = new BrowserInternalKeyHandler()
    const calls: string[] = []

    handler.onInternal("keypress", (event: any) => {
      calls.push("first")
      event.stopPropagation()
    })
    handler.onInternal("keypress", (_event: any) => {
      calls.push("second")
    })

    handler.emit("keypress", {
      _propagationStopped: false,
      get propagationStopped() { return this._propagationStopped },
      stopPropagation() { this._propagationStopped = true },
    })

    expect(calls).toEqual(["first"])
  })

  it("removes internal handlers", () => {
    const handler = new BrowserInternalKeyHandler()
    let called = false
    const fn = () => { called = true }
    handler.onInternal("keypress", fn)
    handler.offInternal("keypress", fn)
    handler.emit("keypress", {})
    expect(called).toBe(false)
  })
})
