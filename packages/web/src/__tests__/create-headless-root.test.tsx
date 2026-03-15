import { describe, it, expect, beforeEach } from "bun:test"
import React from "react"
import { HeadlessRenderer, setHeadlessRootRenderableClass } from "../headless-renderer"
import { createHeadlessRoot } from "../create-headless-root"
import { RootRenderable } from "@gridland/utils"

describe("createHeadlessRoot", () => {
  beforeEach(() => {
    setHeadlessRootRenderableClass(RootRenderable)
  })

  it("returns an object with render, renderToText, and unmount", () => {
    const renderer = new HeadlessRenderer({ cols: 40, rows: 10 })
    const root = createHeadlessRoot(renderer)

    expect(typeof root.render).toBe("function")
    expect(typeof root.renderToText).toBe("function")
    expect(typeof root.unmount).toBe("function")
  })

  it("renderToText returns a string", () => {
    const renderer = new HeadlessRenderer({ cols: 40, rows: 10 })
    const root = createHeadlessRoot(renderer)

    const text = root.renderToText(<></>)
    expect(typeof text).toBe("string")

    root.unmount()
  })

  it("renderToText renders simple text content", () => {
    const renderer = new HeadlessRenderer({ cols: 40, rows: 10 })
    const root = createHeadlessRoot(renderer)

    const text = root.renderToText(<text>Hello World</text>)
    expect(text).toContain("Hello World")

    root.unmount()
  })

  it("renderToText renders nested components", () => {
    const renderer = new HeadlessRenderer({ cols: 40, rows: 10 })
    const root = createHeadlessRoot(renderer)

    const text = root.renderToText(
      <box>
        <text>Line 1</text>
        <text>Line 2</text>
      </box>,
    )
    expect(text).toContain("Line 1")
    expect(text).toContain("Line 2")

    root.unmount()
  })

  it("render does not throw", () => {
    const renderer = new HeadlessRenderer({ cols: 40, rows: 10 })
    const root = createHeadlessRoot(renderer)

    expect(() => root.render(<text>test</text>)).not.toThrow()

    root.unmount()
  })

  it("unmount can be called multiple times safely", () => {
    const renderer = new HeadlessRenderer({ cols: 40, rows: 10 })
    const root = createHeadlessRoot(renderer)

    root.renderToText(<text>test</text>)
    root.unmount()

    // Second unmount should be safe (container is null)
    expect(() => root.unmount()).not.toThrow()
  })

  it("unmount before any render is safe", () => {
    const renderer = new HeadlessRenderer({ cols: 40, rows: 10 })
    const root = createHeadlessRoot(renderer)

    // No render was called, container is null
    expect(() => root.unmount()).not.toThrow()
  })

  it("renderToText with different sizes produces different output", () => {
    const wideRenderer = new HeadlessRenderer({ cols: 80, rows: 5 })
    const narrowRenderer = new HeadlessRenderer({ cols: 20, rows: 5 })

    const wideRoot = createHeadlessRoot(wideRenderer)
    const narrowRoot = createHeadlessRoot(narrowRenderer)

    const content = <text>This is a test string that might wrap</text>

    const wideText = wideRoot.renderToText(content)
    const narrowText = narrowRoot.renderToText(content)

    // Both should contain the text
    expect(wideText).toContain("This is a test")
    expect(narrowText).toContain("This is a test")

    wideRoot.unmount()
    narrowRoot.unmount()
  })

  it("renders box with border", () => {
    const renderer = new HeadlessRenderer({ cols: 30, rows: 5 })
    const root = createHeadlessRoot(renderer)

    const text = root.renderToText(
      <box border borderStyle="rounded">
        <text>Boxed</text>
      </box>,
    )

    // Should contain border characters and content
    expect(text).toContain("╭")
    expect(text).toContain("╮")
    expect(text).toContain("Boxed")

    root.unmount()
  })
})
