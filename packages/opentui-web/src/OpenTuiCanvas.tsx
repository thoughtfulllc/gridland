import React, {
  useRef,
  useEffect,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react"
import { BrowserRenderer, setRootRenderableClass } from "./browser-renderer"
import { createBrowserRoot, type BrowserRoot } from "./create-browser-root"
import { CanvasPainter } from "./canvas-painter"
import { RootRenderable } from "@opentui/core"

export interface OpenTuiCanvasProps {
  children: ReactNode
  /** CSS styles for the outer container div */
  style?: CSSProperties
  /** CSS class for the outer container div */
  className?: string
  /** Font size in pixels (default: 14) */
  fontSize?: number
  /** Font family (default: monospace stack) */
  fontFamily?: string
  /** Auto-focus the canvas for keyboard input (default: true) */
  autoFocus?: boolean
  /** Called when the renderer is ready */
  onReady?: (renderer: BrowserRenderer) => void
}

/**
 * A single React component that renders OpenTUI content to an HTML5 Canvas.
 *
 * Usage:
 * ```tsx
 * <OpenTuiCanvas style={{ width: "100%", height: 400 }}>
 *   <box border borderStyle="rounded">
 *     <text>Hello from OpenTUI!</text>
 *   </box>
 * </OpenTuiCanvas>
 * ```
 *
 * No dynamic imports, no wrapper chains. Just a component.
 */
export function OpenTuiCanvas({
  children,
  style,
  className,
  fontSize = 14,
  fontFamily = "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
  autoFocus = true,
  onReady,
}: OpenTuiCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<BrowserRenderer | null>(null)
  const rootRef = useRef<BrowserRoot | null>(null)
  const [isClient, setIsClient] = useState(false)

  // SSR safety: only render canvas on the client
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Initialize renderer when canvas is available
  useEffect(() => {
    if (!isClient) return

    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    setRootRenderableClass(RootRenderable)

    // Measure cell size to calculate grid dimensions
    const painter = new CanvasPainter({ fontSize, fontFamily })
    const tempCtx = canvas.getContext("2d")!
    const cellSize = painter.measureCell(tempCtx)

    const containerRect = container.getBoundingClientRect()
    const cols = Math.max(1, Math.floor(containerRect.width / cellSize.width))
    const rows = Math.max(1, Math.floor(containerRect.height / cellSize.height))

    const renderer = new BrowserRenderer(canvas, cols, rows)
    rendererRef.current = renderer

    const root = createBrowserRoot(renderer)
    rootRef.current = root

    root.render(children)
    renderer.start()

    if (autoFocus) {
      canvas.tabIndex = 0
      canvas.focus()
    }

    onReady?.(renderer)

    // Handle keyboard events
    const onKeyDown = (e: KeyboardEvent) => {
      renderer.handleKeyDown(e)
    }
    canvas.addEventListener("keydown", onKeyDown)

    // Handle resize with ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        const newCols = Math.max(1, Math.floor(width / cellSize.width))
        const newRows = Math.max(1, Math.floor(height / cellSize.height))
        renderer.resize(newCols, newRows)
      }
    })
    resizeObserver.observe(container)

    return () => {
      canvas.removeEventListener("keydown", onKeyDown)
      resizeObserver.disconnect()
      renderer.stop()
      root.unmount()
      rendererRef.current = null
      rootRef.current = null
    }
  }, [isClient, fontSize, fontFamily]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-render when children change
  useEffect(() => {
    if (rootRef.current) {
      rootRef.current.render(children)
    }
  }, [children])

  if (!isClient) {
    // SSR placeholder
    return (
      <div style={style} className={className}>
        <div style={{ width: "100%", height: "100%" }} />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
      className={className}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          outline: "none",
        }}
      />
    </div>
  )
}
