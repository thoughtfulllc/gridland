import { EventEmitter } from "events"
import type { RenderContext, CursorStyle, CursorStyleOptions, MousePointerStyle, WidthMethod } from "@gridland/utils"
import type { RGBA } from "@gridland/utils"

export class BrowserKeyHandler extends EventEmitter {
  constructor() {
    super()
  }

  processInput(_data: string): boolean {
    return false
  }

  useKittyKeyboard(_enable: boolean): void {}

  processPaste(_data: string): void {}
}

export class BrowserInternalKeyHandler extends BrowserKeyHandler {
  private renderableHandlers: Map<string, Set<Function>> = new Map()

  emitWithPriority(_event: string, ..._args: any[]): void {}

  onInternal(event: string, handler: Function): void {
    if (!this.renderableHandlers.has(event)) {
      this.renderableHandlers.set(event, new Set())
    }
    this.renderableHandlers.get(event)!.add(handler)
  }

  offInternal(event: string, handler: Function): void {
    const handlers = this.renderableHandlers.get(event)
    if (handlers) {
      handlers.delete(handler)
    }
  }

  override emit(event: string, ...args: any[]): boolean {
    // Emit to global listeners first
    const hasGlobal = super.emit(event, ...args)

    // Then emit to renderable handlers
    const renderableSet = this.renderableHandlers.get(event)
    if (renderableSet && renderableSet.size > 0) {
      for (const handler of [...renderableSet]) {
        try {
          handler(...args)
        } catch (e) {
          console.error(`[BrowserInternalKeyHandler] Error in ${event} handler:`, e)
        }
        // Check propagation
        if (args[0] && args[0].propagationStopped) break
      }
      return true
    }

    return hasGlobal
  }
}

export interface HitGridEntry {
  x: number
  y: number
  width: number
  height: number
  id: number
}

interface ScissorRect {
  x: number
  y: number
  width: number
  height: number
}

export class BrowserRenderContext extends EventEmitter implements RenderContext {
  private _width: number
  private _height: number
  private _widthMethod: WidthMethod
  private _renderRequested = false
  private _onRenderRequest: (() => void) | null = null
  private _lifecyclePasses: Set<any> = new Set()
  private _focusedRenderable: any | null = null
  public cursorColor: RGBA | null = null
  public cursorStyleType: CursorStyle = "block"
  public cursorBlinking: boolean = false

  // Hit-grid for mouse event dispatch
  private _hitGrid: HitGridEntry[] = []
  private _hitGridScissorStack: ScissorRect[] = []

  // Cursor highlight configuration
  public cursorHighlight: boolean = false
  public cursorHighlightColor: string | null = null
  public cursorHighlightOpacity: number = 0.15

  // Typed as `any` for DTS compatibility — BrowserKeyHandler satisfies KeyHandler
  // at runtime but uses a different class hierarchy (EventEmitter vs opentui's KeyHandler).
  public keyInput: any
  public _internalKeyInput: any

  constructor(width: number, height: number, widthMethod: WidthMethod = "wcwidth") {
    super()
    this._width = width
    this._height = height
    this._widthMethod = widthMethod
    this.keyInput = new BrowserKeyHandler()
    this._internalKeyInput = new BrowserInternalKeyHandler()
  }

  get width(): number {
    return this._width
  }

  get height(): number {
    return this._height
  }

  get widthMethod(): WidthMethod {
    return this._widthMethod
  }

  get capabilities(): any {
    return null
  }

  get hasSelection(): boolean {
    return false
  }

  get currentFocusedRenderable(): any | null {
    return this._focusedRenderable
  }

  setOnRenderRequest(callback: () => void): void {
    this._onRenderRequest = callback
  }

  resize(width: number, height: number): void {
    this._width = width
    this._height = height
    this.emit("resize", width, height)
  }

  // RenderContext interface methods — hit-grid for mouse event dispatch
  addToHitGrid(x: number, y: number, width: number, height: number, id: number): void {
    // Apply scissor rect clipping if active
    if (this._hitGridScissorStack.length > 0) {
      const scissor = this._hitGridScissorStack[this._hitGridScissorStack.length - 1]
      const clippedX = Math.max(x, scissor.x)
      const clippedY = Math.max(y, scissor.y)
      const clippedRight = Math.min(x + width, scissor.x + scissor.width)
      const clippedBottom = Math.min(y + height, scissor.y + scissor.height)
      if (clippedRight <= clippedX || clippedBottom <= clippedY) return // fully clipped
      this._hitGrid.push({
        x: clippedX,
        y: clippedY,
        width: clippedRight - clippedX,
        height: clippedBottom - clippedY,
        id,
      })
    } else {
      this._hitGrid.push({ x, y, width, height, id })
    }
  }

  pushHitGridScissorRect(x: number, y: number, width: number, height: number): void {
    this._hitGridScissorStack.push({ x, y, width, height })
  }

  popHitGridScissorRect(): void {
    this._hitGridScissorStack.pop()
  }

  clearHitGridScissorRects(): void {
    this._hitGridScissorStack.length = 0
  }

  clearHitGrid(): void {
    this._hitGrid.length = 0
  }

  /** Walk array in reverse (last rendered = topmost), return first match */
  hitTest(col: number, row: number): number | null {
    for (let i = this._hitGrid.length - 1; i >= 0; i--) {
      const entry = this._hitGrid[i]
      if (col >= entry.x && col < entry.x + entry.width &&
          row >= entry.y && row < entry.y + entry.height) {
        return entry.id
      }
    }
    return null
  }

  getHitGridEntries(): readonly HitGridEntry[] {
    return this._hitGrid
  }

  requestRender(): void {
    if (this._renderRequested) return
    this._renderRequested = true
    this._onRenderRequest?.()
    this._renderRequested = false
  }

  setCursorPosition(_x: number, _y: number, _visible: boolean): void {}

  setCursorStyle(options: CursorStyleOptions): void {
    if (options.color) {
      this.cursorColor = options.color
    }
    if (options.style) {
      this.cursorStyleType = options.style
    }
    if (options.blinking !== undefined) {
      this.cursorBlinking = options.blinking
    }
  }

  setCursorColor(color: RGBA): void {
    this.cursorColor = color
  }

  setMousePointer(_shape: MousePointerStyle): void {}

  requestLive(): void {}

  dropLive(): void {}

  getSelection(): any | null {
    return null
  }

  requestSelectionUpdate(): void {}

  focusRenderable(renderable: any): void {
    if (this._focusedRenderable && this._focusedRenderable !== renderable) {
      this._focusedRenderable.blur?.()
    }
    this._focusedRenderable = renderable
  }

  registerLifecyclePass(renderable: any): void {
    this._lifecyclePasses.add(renderable)
  }

  unregisterLifecyclePass(renderable: any): void {
    this._lifecyclePasses.delete(renderable)
  }

  getLifecyclePasses(): Set<any> {
    return this._lifecyclePasses
  }

  clearSelection(): void {}

  startSelection(_renderable: any, _x: number, _y: number): void {}

  updateSelection(
    _currentRenderable: any | undefined,
    _x: number,
    _y: number,
    _options?: { finishDragging?: boolean },
  ): void {}
}
