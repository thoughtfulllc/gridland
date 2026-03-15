import type { ReactNode } from "react"
import { Screen, type ReadableBuffer } from "./screen"
import { KeySender, type KeyInputContext } from "./keys"
import { waitFor, type WaitForOptions } from "./wait-for"

export interface TuiInstance {
  /** Screen queries — read buffer content */
  screen: Screen
  /** Key input simulation */
  keys: KeySender
  /** Wait for text or assertion */
  waitFor: (condition: string | (() => void), options?: WaitForOptions) => Promise<void>
  /** Force a synchronous render cycle */
  flush: () => void
  /** Re-render with new content */
  rerender: (node: ReactNode) => void
  /** Unmount and clean up */
  unmount: () => void
}

interface ActiveInstance {
  cleanup: () => void
}

const activeInstances: ActiveInstance[] = []

export interface RenderTuiOptions {
  /** Number of columns (default: 80) */
  cols?: number
  /** Number of rows (default: 24) */
  rows?: number
}

// Pre-load async modules at module scope so renderTui() can stay synchronous.
// The gridland-web module chain contains top-level await (reconciler devtools),
// so require() fails — we use await import() here instead.
const _webModule = await import("../../web/src/index")
const _rendererModule = await import("../../web/src/browser-renderer")
const _coreModule = await import("@gridland/utils").catch(() => {
  throw new Error(
    "renderTui requires @opentui/core (RootRenderable). " +
    "Make sure the opentui monorepo is available and module resolution is configured.",
  )
})
// Import reconciler to flush concurrent work synchronously in tests
const _reconcilerModule = await import("../../../opentui/packages/react/src/reconciler/reconciler")

/**
 * Render a Gridland component for testing.
 *
 * Note: This function requires @opentui/core and the gridland-web browser runtime
 * to be available. It works in test environments that have the opentui monorepo
 * accessible and proper module resolution configured.
 *
 * For simpler testing (Screen, Keys, waitFor), use those classes directly
 * with a BrowserBuffer — they have no external dependencies.
 */
export function renderTui(node: ReactNode, options: RenderTuiOptions = {}): TuiInstance {
  const { cols = 80, rows = 24 } = options

  const { BrowserRenderer, createBrowserRoot } = _webModule as any
  const { setRootRenderableClass } = _rendererModule as any
  const { RootRenderable } = _coreModule as any
  setRootRenderableClass(RootRenderable)

  const mockCanvas = createMockCanvas(cols, rows)
  const renderer = new BrowserRenderer(mockCanvas, cols, rows)
  const root = createBrowserRoot(renderer)
  const screen = new Screen(renderer.buffer as ReadableBuffer)
  const keys = new KeySender(renderer.renderContext as KeyInputContext)

  // Flush the concurrent reconciler so the React tree is committed synchronously.
  // Wrapping root.render() inside flushSync ensures updateContainer runs in sync mode.
  const _rec = (_reconcilerModule as any).reconciler
  const _flushSync = _rec.flushSyncFromReconciler ?? _rec.flushSync
  _flushSync(() => {
    root.render(node)
  })
  doRenderPass(renderer)
  screen.captureFrame()

  const instance: ActiveInstance = {
    cleanup() {
      renderer.stop()
      root.unmount()
    },
  }
  activeInstances.push(instance)

  return {
    screen,
    keys,
    waitFor: (condition, opts) => waitFor(screen, condition, opts),
    flush() {
      _flushSync(() => {})
      doRenderPass(renderer)
      screen.captureFrame()
    },
    rerender(newNode: ReactNode) {
      _flushSync(() => {
        root.render(newNode)
      })
      doRenderPass(renderer)
      screen.captureFrame()
    },
    unmount() {
      instance.cleanup()
      const idx = activeInstances.indexOf(instance)
      if (idx >= 0) activeInstances.splice(idx, 1)
    },
  }
}

/**
 * Clean up all active test instances. Call in afterEach().
 */
export function cleanup(): void {
  for (const instance of activeInstances) {
    instance.cleanup()
  }
  activeInstances.length = 0
}

function doRenderPass(renderer: any): void {
  const buffer = renderer.buffer
  const renderContext = renderer.renderContext

  buffer.clear()

  const lifecyclePasses = renderContext.getLifecyclePasses()
  for (const renderable of lifecyclePasses) {
    if (renderable.onLifecyclePass) {
      renderable.onLifecyclePass()
    }
  }

  renderer.root.calculateLayout()

  const renderList: any[] = []
  renderer.root.updateLayout(16, renderList)

  for (const cmd of renderList) {
    switch (cmd.action) {
      case "pushScissorRect":
        buffer.pushScissorRect(cmd.x, cmd.y, cmd.width, cmd.height)
        break
      case "popScissorRect":
        buffer.popScissorRect()
        break
      case "pushOpacity":
        buffer.pushOpacity(cmd.opacity)
        break
      case "popOpacity":
        buffer.popOpacity()
        break
      case "render":
        cmd.renderable.render(buffer, 16)
        break
    }
  }

  buffer.clearScissorRects()
  buffer.clearOpacity()
}

function createMockCanvas(cols: number, rows: number): any {
  const canvas = document.createElement("canvas")

  const mockCtx = {
    font: "",
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    measureText: () => ({ width: 8 }),
    fillRect: () => {},
    fillText: () => {},
    clearRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    setTransform: () => {},
    scale: () => {},
  }

  canvas.getContext = (() => mockCtx) as any
  canvas.width = cols * 8
  canvas.height = rows * 16
  canvas.style.width = `${cols * 8}px`
  canvas.style.height = `${rows * 16}px`
  canvas.style.cursor = ""
  canvas.tabIndex = 0

  canvas.getBoundingClientRect = () => ({
    x: 0, y: 0,
    width: cols * 8, height: rows * 16,
    top: 0, left: 0, bottom: rows * 16, right: cols * 8,
    toJSON: () => {},
  })

  return canvas
}
