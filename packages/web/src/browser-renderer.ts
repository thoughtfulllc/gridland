import { BrowserBuffer } from "./browser-buffer"
import { BrowserRenderContext } from "./browser-render-context"
import { CanvasPainter, type CursorOverlay } from "./canvas-painter"
import { SelectionManager } from "./selection-manager"
import { getLinkId } from "../../core/src/utils"
import { executeRenderPipeline } from "./render-pipeline"
import { Renderable } from "../../core/src/Renderable"
import type { MouseEventType } from "../../core/src/lib/parse.mouse"

// RootRenderable is set externally to avoid circular deps
let RootRenderableClass: any = null

export function setRootRenderableClass(cls: any): void {
  RootRenderableClass = cls
}

export class BrowserRenderer {
  public canvas: HTMLCanvasElement
  public ctx2d: CanvasRenderingContext2D
  public buffer: BrowserBuffer
  public renderContext: BrowserRenderContext
  public root: any // RootRenderable
  public painter: CanvasPainter
  public selection: SelectionManager

  private cols: number
  private rows: number
  private cellWidth: number = 0
  private cellHeight: number = 0
  private rafId: number | null = null
  private lastTime: number = 0
  private needsRender: boolean = true
  private isDragOver: boolean = false
  private cleanupListeners: (() => void)[] = []
  private mouseDownCell: { col: number; row: number } | null = null
  private mouseDownRenderableId: number | null = null
  private lastHoverRenderableId: number | null = null
  public mouseCell: { col: number; row: number } | null = null
  private backgroundColor: string | null = null

  constructor(canvas: HTMLCanvasElement, cols: number, rows: number, options?: { backgroundColor?: string }) {
    this.canvas = canvas
    this.cols = cols
    this.rows = rows

    const ctx2d = canvas.getContext("2d")
    if (!ctx2d) throw new Error("Could not get 2d context")
    this.ctx2d = ctx2d

    // Measure cell size
    this.painter = new CanvasPainter()
    const cellSize = this.painter.measureCell(this.ctx2d)
    this.cellWidth = cellSize.width
    this.cellHeight = cellSize.height

    // Size canvas
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.ceil(cols * this.cellWidth * dpr)
    canvas.height = Math.ceil(rows * this.cellHeight * dpr)
    canvas.style.width = `${cols * this.cellWidth}px`
    canvas.style.height = `${rows * this.cellHeight}px`
    this.ctx2d.scale(dpr, dpr)

    this.backgroundColor = options?.backgroundColor ?? null

    // Default cursor — hidden when cursorHighlight is enabled
    canvas.style.cursor = "text"

    // Create buffer
    this.buffer = BrowserBuffer.create(cols, rows, "wcwidth")

    // Create render context
    this.renderContext = new BrowserRenderContext(cols, rows)
    this.renderContext.setOnRenderRequest(() => {
      this.needsRender = true
    })

    // Create selection manager
    this.selection = new SelectionManager()

    // Create root renderable
    if (!RootRenderableClass) {
      throw new Error("RootRenderableClass not set. Call setRootRenderableClass before creating BrowserRenderer.")
    }
    this.root = new RootRenderableClass(this.renderContext)

    // Set up DOM event listeners
    this.setupDomListeners()
  }

  private pixelToCell(clientX: number, clientY: number): { col: number; row: number } {
    const rect = this.canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const col = Math.floor(x / this.cellWidth)
    const row = Math.floor(y / this.cellHeight)
    return {
      col: Math.max(0, Math.min(col, this.cols - 1)),
      row: Math.max(0, Math.min(row, this.rows - 1)),
    }
  }

  private setupDomListeners(): void {
    // --- Drag-and-drop ---
    const onDragOver = (e: DragEvent) => {
      e.preventDefault()
    }
    this.canvas.addEventListener("dragover", onDragOver)
    this.cleanupListeners.push(() => this.canvas.removeEventListener("dragover", onDragOver))

    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      const files = e.dataTransfer?.files
      if (!files || files.length === 0) return
      const file = files[0]
      this.isDragOver = false
      this.renderContext.emit("drag-leave", undefined)
      file.text().then((content) => {
        this.renderContext.emit("file-drop", {
          name: file.name,
          content,
          type: file.type,
          size: file.size,
        })
      })
    }
    this.canvas.addEventListener("drop", onDrop)
    this.cleanupListeners.push(() => this.canvas.removeEventListener("drop", onDrop))

    // --- Mouse events (selection + component dispatch via hit-test) ---
    const onMouseDown = (e: MouseEvent) => {
      // Only left button
      if (e.button !== 0) return
      this.canvas.focus()
      const { col, row } = this.pixelToCell(e.clientX, e.clientY)
      this.mouseDownCell = { col, row }

      // Hit-test for component dispatch
      const hitId = this.renderContext.hitTest(col, row)
      this.mouseDownRenderableId = hitId
      const renderable = hitId !== null ? Renderable.renderablesByNumber.get(hitId) : undefined

      if (renderable) {
        this.dispatchTuiMouseEvent(renderable, "down", col, row, e)
        // Click-to-focus: walk up parent chain to find first focusable renderable
        let current: any = renderable
        while (current) {
          if (current.focusable) {
            current.focus()
            this.renderContext.emit("renderable-focused", current)
            break
          }
          current = current.parent
        }
      }

      // Only start text selection if no renderable has a mousedown handler
      this.selection.startSelection(col, row)
      this.needsRender = true
    }
    this.canvas.addEventListener("mousedown", onMouseDown)
    this.cleanupListeners.push(() => this.canvas.removeEventListener("mousedown", onMouseDown))

    const onMouseMove = (e: MouseEvent) => {
      const { col, row } = this.pixelToCell(e.clientX, e.clientY)
      this.mouseCell = { col, row }

      // Cursor highlight: trigger repaint and hide OS cursor
      if (this.renderContext.cursorHighlight) {
        this.needsRender = true
      }

      // Hit-test for cursor style and over/out events
      const hitId = this.renderContext.hitTest(col, row)
      const hitRenderable = hitId !== null ? Renderable.renderablesByNumber.get(hitId) : undefined

      // Determine cursor style: hidden (cursorHighlight) > pointer (link/interactive) > text
      if (this.renderContext.cursorHighlight) {
        this.canvas.style.cursor = "none"
      } else {
        const idx = row * this.buffer.width + col
        const hasLink = idx >= 0 && idx < this.buffer.attributes.length && getLinkId(this.buffer.attributes[idx]) > 0
        // Walk up parent chain to find any interactive ancestor
        let hasMouseHandler = false
        let walk: any = hitRenderable
        while (walk) {
          if (walk._clickHandler || walk._mouseListeners?.["down"]) {
            hasMouseHandler = true
            break
          }
          walk = walk.parent
        }
        this.canvas.style.cursor = hasLink || hasMouseHandler ? "pointer" : "text"
      }

      // Over/out events
      if (hitId !== this.lastHoverRenderableId) {
        // Fire mouseout on previous
        if (this.lastHoverRenderableId !== null) {
          const prev = Renderable.renderablesByNumber.get(this.lastHoverRenderableId)
          if (prev) {
            this.dispatchTuiMouseEvent(prev, "out", col, row, e)
          }
        }
        // Fire mouseover on new
        if (hitId !== null) {
          const next = Renderable.renderablesByNumber.get(hitId)
          if (next) {
            this.dispatchTuiMouseEvent(next, "over", col, row, e)
          }
        }
        this.lastHoverRenderableId = hitId
      }

      // Move event to current hover target
      if (hitId !== null) {
        const target = Renderable.renderablesByNumber.get(hitId)
        if (target) {
          this.dispatchTuiMouseEvent(target, "move", col, row, e)
        }
      }

      if (!this.selection.selecting) return
      this.selection.updateSelection(col, row)
      this.needsRender = true
    }
    this.canvas.addEventListener("mousemove", onMouseMove)
    this.cleanupListeners.push(() => this.canvas.removeEventListener("mousemove", onMouseMove))

    const onMouseUp = (e: MouseEvent) => {
      const wasSelecting = this.selection.selecting
      if (wasSelecting) {
        this.selection.endSelection()
        this.needsRender = true
      }

      const { col, row } = this.pixelToCell(e.clientX, e.clientY)

      // Dispatch mouseUp to hit renderable
      const hitId = this.renderContext.hitTest(col, row)
      if (hitId !== null) {
        const renderable = Renderable.renderablesByNumber.get(hitId)
        if (renderable) {
          this.dispatchTuiMouseEvent(renderable, "up", col, row, e)

          // Synthesize onClick: same renderable as mouseDown
          if (e.button === 0 && this.mouseDownRenderableId === hitId) {
            if (renderable._clickHandler) {
              renderable._clickHandler(this.createTuiMouseEvent(renderable, "down", col, row, e))
            }
          }
        }
      }

      // Check for link click: same cell as mousedown (no drag)
      if (e.button === 0 && this.mouseDownCell) {
        if (col === this.mouseDownCell.col && row === this.mouseDownCell.row) {
          const bufIdx = row * this.buffer.width + col
          if (bufIdx >= 0 && bufIdx < this.buffer.attributes.length) {
            const attr = this.buffer.attributes[bufIdx]
            const linkId = getLinkId(attr)
            if (linkId > 0) {
              const url = this.buffer.getLinkUrl(linkId)
              if (url) {
                window.open(url, "_blank")
              }
            }
          }
        }
        this.mouseDownCell = null
        this.mouseDownRenderableId = null
      }
    }
    window.addEventListener("mouseup", onMouseUp)
    this.cleanupListeners.push(() => window.removeEventListener("mouseup", onMouseUp))

    // --- Scroll events ---
    const onWheel = (e: WheelEvent) => {
      const { col, row } = this.pixelToCell(e.clientX, e.clientY)
      const hitId = this.renderContext.hitTest(col, row)
      if (hitId !== null) {
        const renderable = Renderable.renderablesByNumber.get(hitId)
        if (renderable) {
          this.dispatchTuiMouseEvent(renderable, "scroll", col, row, e)
        }
      }
    }
    this.canvas.addEventListener("wheel", onWheel)
    this.cleanupListeners.push(() => this.canvas.removeEventListener("wheel", onWheel))

    // --- Drag enter/leave for visual feedback ---
    const onDragEnter = (e: DragEvent) => {
      e.preventDefault()
      if (this.isDragOver) return
      this.isDragOver = true
      this.renderContext.emit("drag-enter", undefined)
      this.needsRender = true
    }
    this.canvas.addEventListener("dragenter", onDragEnter)
    this.cleanupListeners.push(() => this.canvas.removeEventListener("dragenter", onDragEnter))

    const onDragLeave = (e: DragEvent) => {
      // Only emit when truly leaving the canvas (not entering a child)
      if (e.relatedTarget && this.canvas.contains(e.relatedTarget as Node)) return
      this.isDragOver = false
      this.renderContext.emit("drag-leave", undefined)
      this.needsRender = true
    }
    this.canvas.addEventListener("dragleave", onDragLeave)
    this.cleanupListeners.push(() => this.canvas.removeEventListener("dragleave", onDragLeave))

    // --- Paste ---
    const onPaste = (e: ClipboardEvent) => {
      if (document.activeElement !== this.canvas) return
      const text = e.clipboardData?.getData("text/plain")
      if (text) {
        e.preventDefault()
        this.renderContext.emit("paste", text)
      }
    }
    document.addEventListener("paste", onPaste)
    this.cleanupListeners.push(() => document.removeEventListener("paste", onPaste))
  }

  private createTuiMouseEvent(target: any, type: MouseEventType, col: number, row: number, domEvent: MouseEvent | WheelEvent): any {
    return {
      type,
      button: (domEvent as MouseEvent).button ?? 0,
      x: col,
      y: row,
      target,
      modifiers: {
        shift: domEvent.shiftKey,
        alt: domEvent.altKey,
        ctrl: domEvent.ctrlKey,
      },
      _propagationStopped: false,
      _defaultPrevented: false,
      get propagationStopped() { return this._propagationStopped },
      get defaultPrevented() { return this._defaultPrevented },
      stopPropagation() { this._propagationStopped = true },
      preventDefault() { this._defaultPrevented = true },
    }
  }

  private dispatchTuiMouseEvent(target: any, type: MouseEventType, col: number, row: number, domEvent: MouseEvent | WheelEvent): void {
    const event = this.createTuiMouseEvent(target, type, col, row, domEvent)
    target.processMouseEvent(event)
  }

  start(): void {
    this.lastTime = performance.now()
    this.loop()
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    for (const cleanup of this.cleanupListeners) {
      cleanup()
    }
    this.cleanupListeners = []
  }

  private loop = (): void => {
    this.rafId = requestAnimationFrame(this.loop)

    const now = performance.now()
    const deltaTime = now - this.lastTime
    this.lastTime = now

    let didRender = false
    if (this.needsRender) {
      this.needsRender = false
      didRender = true

      // Pass cursor config from render context to buffer before rendering
      this.buffer.cursorColor = this.renderContext.cursorColor
      this.buffer.cursorStyleType = this.renderContext.cursorStyleType
      this.buffer.lineCursorPosition = null

      executeRenderPipeline(this.buffer, this.renderContext, this.root, deltaTime)
    }

    // Build cursor overlay from buffer position + render context config
    const cursorOverlay = this.buildCursorOverlay()

    // Repaint when render pipeline ran, or every frame when blinking cursor is active
    if (!didRender && !cursorOverlay?.blinking) return

    // Paint to canvas
    const dpr = window.devicePixelRatio || 1
    this.ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0)
    if (this.backgroundColor) {
      this.ctx2d.fillStyle = this.backgroundColor
      this.ctx2d.fillRect(0, 0, this.canvas.width, this.canvas.height)
    } else {
      this.ctx2d.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }
    // Build mouse highlight if enabled
    const mouseHighlight = this.renderContext.cursorHighlight && this.mouseCell
      ? {
          col: this.mouseCell.col,
          row: this.mouseCell.row,
          color: this.renderContext.cursorHighlightColor ?? undefined,
          opacity: this.renderContext.cursorHighlightOpacity,
        }
      : null

    this.painter.paint(this.ctx2d, this.buffer, this.selection, cursorOverlay, mouseHighlight)
  }

  private buildCursorOverlay(): CursorOverlay | null {
    const pos = this.buffer.lineCursorPosition
    if (!pos || !this.renderContext.cursorColor) return null
    return {
      x: pos.x,
      y: pos.y,
      color: this.renderContext.cursorColor,
      blinking: this.renderContext.cursorBlinking,
    }
  }

  resize(cols: number, rows: number): void {
    this.cols = cols
    this.rows = rows

    const dpr = window.devicePixelRatio || 1
    this.canvas.width = Math.ceil(cols * this.cellWidth * dpr)
    this.canvas.height = Math.ceil(rows * this.cellHeight * dpr)
    this.canvas.style.width = `${cols * this.cellWidth}px`
    this.canvas.style.height = `${rows * this.cellHeight}px`
    this.ctx2d.scale(dpr, dpr)

    this.buffer.resize(cols, rows)
    this.renderContext.resize(cols, rows)
    this.root.resize(cols, rows)
    this.needsRender = true
  }

  private static PREVENT_DEFAULT_KEYS = new Set([
    "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
    " ", "PageUp", "PageDown", "Tab", "Home", "End",
  ])

  private static MODIFIER_KEYS = new Set(["Alt", "Control", "Meta", "Shift"])

  private static KEY_MAP: Record<string, string> = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    Enter: "return",
    Backspace: "backspace",
    Delete: "delete",
    Tab: "tab",
    Escape: "escape",
    Home: "home",
    End: "end",
    " ": "space",
    PageUp: "pageup",
    PageDown: "pagedown",
  }

  handleKeyDown(event: KeyboardEvent): void {
    // Prevent browser default for navigation keys (scrolling) and printable
    // characters (e.g. "/" triggers Quick Find in Firefox). Cmd/Ctrl shortcuts
    // like Cmd+C, Cmd+V are preserved.
    if (BrowserRenderer.PREVENT_DEFAULT_KEYS.has(event.key) ||
        (event.key.length === 1 && !event.metaKey && !event.ctrlKey)) {
      event.preventDefault()
    }

    // Copy selected text to clipboard (Cmd+C, Ctrl+C, or Option+C on Mac where key is "ç")
    if (this.selection.active && (event.key === "c" || event.key === "ç") && (event.metaKey || event.ctrlKey || event.altKey)) {
      const text = this.selection.getSelectedText(this.buffer)
      if (text) {
        navigator.clipboard.writeText(text).catch(() => {
          // Fallback: temporary textarea + execCommand
          const ta = document.createElement("textarea")
          ta.value = text
          ta.style.position = "fixed"
          ta.style.left = "-9999px"
          document.body.appendChild(ta)
          ta.select()
          document.execCommand("copy")
          document.body.removeChild(ta)
        })
      }
      event.preventDefault()
      return
    }

    // Any other keypress clears the selection (standard terminal behavior)
    // But ignore modifier-only keys so the user can press Option/Ctrl/Cmd before C
    const modifierOnly = BrowserRenderer.MODIFIER_KEYS.has(event.key)
    if (this.selection.active && !modifierOnly) {
      this.selection.clearSelection()
      this.needsRender = true
    }

    // Translate browser KeyboardEvent to OpenTUI KeyEvent format
    const keyEvent = {
      name: BrowserRenderer.KEY_MAP[event.key] ?? (event.key.length === 1 ? event.key : event.key.toLowerCase()),
      ctrl: event.ctrlKey,
      meta: event.metaKey,
      shift: event.shiftKey,
      option: event.altKey,
      sequence: event.key,
      number: false,
      raw: event.key,
      eventType: "press" as const,
      source: "raw" as const,
      _defaultPrevented: false,
      _propagationStopped: false,
      get defaultPrevented() {
        return this._defaultPrevented
      },
      get propagationStopped() {
        return this._propagationStopped
      },
      preventDefault() {
        this._defaultPrevented = true
      },
      stopPropagation() {
        this._propagationStopped = true
      },
    }

    this.renderContext._internalKeyInput.emit("keypress", keyEvent)
    this.renderContext.keyInput.emit("keypress", keyEvent)
  }
}
