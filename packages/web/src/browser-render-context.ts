import { EventEmitter } from "events"
import type { RenderContext, CursorStyle, CursorStyleOptions, MousePointerStyle, WidthMethod } from "./core-shims/types"
import type { RGBA } from "./core-shims/rgba"

export class BrowserKeyHandler extends EventEmitter {
  constructor() {
    super()
  }

  processInput(_data: string): boolean {
    return false
  }
}

export class BrowserInternalKeyHandler extends BrowserKeyHandler {
  private renderableHandlers: Map<string, Set<Function>> = new Map()

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

  public keyInput: BrowserKeyHandler
  public _internalKeyInput: BrowserInternalKeyHandler

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

  // RenderContext interface methods
  addToHitGrid(_x: number, _y: number, _width: number, _height: number, _id: number): void {}

  pushHitGridScissorRect(_x: number, _y: number, _width: number, _height: number): void {}

  popHitGridScissorRect(): void {}

  clearHitGridScissorRects(): void {}

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
