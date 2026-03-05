import type { ReactNode } from "react"
import { BrowserRenderer, setRootRenderableClass } from "./browser-renderer"
import { createBrowserRoot } from "./create-browser-root"
import { CanvasPainter } from "./canvas-painter"

export interface MountOptions {
  /** Number of columns (auto-calculated from canvas size if omitted) */
  cols?: number
  /** Number of rows (auto-calculated from canvas size if omitted) */
  rows?: number
  /** Font size in pixels (default: 14) */
  fontSize?: number
  /** Font family (default: monospace stack) */
  fontFamily?: string
  /** Listen for keyboard events on the canvas (default: true) */
  keyboard?: boolean
  /** Auto-resize when canvas size changes (default: true) */
  autoResize?: boolean
}

export interface MountResult {
  renderer: BrowserRenderer
  unmount: () => void
  resize: (cols: number, rows: number) => void
}

/**
 * Imperative API to mount Polyterm content into a canvas element.
 *
 * ```ts
 * const canvas = document.getElementById("my-canvas") as HTMLCanvasElement
 * const { unmount } = mountPolyterm(canvas, <App />)
 * ```
 */
export function mountPolyterm(
  canvas: HTMLCanvasElement,
  element: ReactNode,
  options: MountOptions = {},
): MountResult {
  const {
    fontSize = 14,
    fontFamily = "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
    keyboard = true,
    autoResize = true,
  } = options

  // Set up RootRenderable
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { RootRenderable } = require("@opentui/core")
  setRootRenderableClass(RootRenderable)

  // Calculate grid dimensions
  const painter = new CanvasPainter({ fontSize, fontFamily })
  const tempCtx = canvas.getContext("2d")!
  const cellSize = painter.measureCell(tempCtx)

  let cols = options.cols ?? Math.max(1, Math.floor(canvas.clientWidth / cellSize.width))
  let rows = options.rows ?? Math.max(1, Math.floor(canvas.clientHeight / cellSize.height))

  const renderer = new BrowserRenderer(canvas, cols, rows)
  const root = createBrowserRoot(renderer)

  root.render(element)
  renderer.start()

  // Always make canvas focusable via click
  canvas.tabIndex = 0

  // Keyboard
  let keydownHandler: ((e: KeyboardEvent) => void) | null = null
  if (keyboard) {
    keydownHandler = (e: KeyboardEvent) => renderer.handleKeyDown(e)
    canvas.addEventListener("keydown", keydownHandler)
  }

  // Auto-resize
  let resizeObserver: ResizeObserver | null = null
  if (autoResize) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        const newCols = Math.max(1, Math.floor(width / cellSize.width))
        const newRows = Math.max(1, Math.floor(height / cellSize.height))
        if (newCols !== cols || newRows !== rows) {
          cols = newCols
          rows = newRows
          renderer.resize(newCols, newRows)
        }
      }
    })
    resizeObserver.observe(canvas)
  }

  return {
    renderer,
    unmount() {
      if (keydownHandler) {
        canvas.removeEventListener("keydown", keydownHandler)
      }
      resizeObserver?.disconnect()
      renderer.stop()
      root.unmount()
    },
    resize(newCols: number, newRows: number) {
      cols = newCols
      rows = newRows
      renderer.resize(newCols, newRows)
    },
  }
}
