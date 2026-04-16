import { type RenderableOptions, Renderable } from "../Renderable"
import { OptimizedBuffer } from "../buffer"
import type { RenderContext } from "../types"

export interface FrameBufferOptions extends RenderableOptions<FrameBufferRenderable> {
  width: number
  height: number
  respectAlpha?: boolean
}

export class FrameBufferRenderable extends Renderable {
  public frameBuffer: OptimizedBuffer | null = null
  protected respectAlpha: boolean
  private _frameBufferIdBase: string

  constructor(ctx: RenderContext, options: FrameBufferOptions) {
    super(ctx, options)
    this.respectAlpha = options.respectAlpha || false
    this._frameBufferIdBase = options.id || `framebufferrenderable-${this.id}`
  }

  protected ensureBuffer(): OptimizedBuffer | null {
    if (this.frameBuffer) return this.frameBuffer

    const w = this.width
    const h = this.height
    if (w <= 0 || h <= 0) return null

    this.frameBuffer = OptimizedBuffer.create(w, h, this._ctx.widthMethod, {
      respectAlpha: this.respectAlpha,
      id: this._frameBufferIdBase,
    })
    return this.frameBuffer
  }

  protected onResize(width: number, height: number): void {
    if (width <= 0 || height <= 0) {
      throw new Error(`Invalid resize dimensions for FrameBufferRenderable ${this.id}: ${width}x${height}`)
    }

    if (this.frameBuffer) {
      this.frameBuffer.destroy()
      this.frameBuffer = null
    }

    super.onResize(width, height)
    this.requestRender()
  }

  protected renderSelf(buffer: OptimizedBuffer, deltaTime: number): void {
    if (!this.visible || this.isDestroyed) return
    const fb = this.ensureBuffer()
    if (!fb) return
    buffer.drawFrameBuffer(this.x, this.y, fb)
  }

  protected destroySelf(): void {
    this.frameBuffer?.destroy()
    this.frameBuffer = null
    super.destroySelf()
  }
}
