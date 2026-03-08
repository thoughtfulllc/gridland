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
import { HeadlessRenderer, setHeadlessRootRenderableClass } from "./headless-renderer"
import { createHeadlessRoot } from "./create-headless-root"

export interface TUIProps {
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
  /** Background color for the canvas (default: transparent) */
  backgroundColor?: string
  /** Called when the renderer is ready */
  onReady?: (renderer: BrowserRenderer) => void
  /** Columns to use for SSR headless render (default: 80) */
  fallbackCols?: number
  /** Rows to use for SSR headless render (default: 24) */
  fallbackRows?: number
}

/**
 * A single React component that renders TUI content to an HTML5 Canvas.
 * Gridland is built on the opentui engine.
 *
 * Usage:
 * ```tsx
 * <TUI style={{ width: "100%", height: 400 }}>
 *   <box border borderStyle="rounded">
 *     <text>Hello from Gridland!</text>
 *   </box>
 * </TUI>
 * ```
 *
 * No dynamic imports, no wrapper chains. Just a component.
 */
export function TUI({
  children,
  style,
  className,
  fontSize = 14,
  fontFamily = "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
  autoFocus = true,
  backgroundColor,
  onReady,
  fallbackCols = 80,
  fallbackRows = 24,
}: TUIProps) {
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

    const renderer = new BrowserRenderer(canvas, cols, rows, { backgroundColor })
    rendererRef.current = renderer

    const root = createBrowserRoot(renderer)
    rootRef.current = root

    root.render(children)
    renderer.start()

    canvas.tabIndex = 0
    if (autoFocus) {
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
  }, [isClient, fontSize, fontFamily, backgroundColor]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-render when children change
  useEffect(() => {
    if (rootRef.current) {
      rootRef.current.render(children)
    }
  }, [children])

  if (!isClient) {
    // Only run the headless render on the actual server.
    // On the client's initial render (before useEffect sets isClient=true),
    // we render an empty <pre> and let suppressHydrationWarning preserve
    // the server-rendered DOM until the canvas takes over.
    const isServer = typeof window === "undefined"
    let text = ""
    if (isServer) {
      setHeadlessRootRenderableClass(RootRenderable)
      const renderer = new HeadlessRenderer({ cols: fallbackCols, rows: fallbackRows })
      const root = createHeadlessRoot(renderer)
      text = root.renderToText(children)
      root.unmount()
    }
    return (
      <div style={style} className={className}>
        <pre
          suppressHydrationWarning
          aria-hidden
          style={{
            fontFamily,
            fontSize,
            margin: 0,
            position: "absolute",
            width: "1px",
            height: "1px",
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            whiteSpace: "pre",
          }}
        >
          {text}
        </pre>
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
