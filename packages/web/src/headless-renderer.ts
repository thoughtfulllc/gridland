import { BrowserBuffer } from "./browser-buffer"
import { BrowserRenderContext } from "./browser-render-context"
import { bufferToText } from "./buffer-to-text"
import { executeRenderPipeline } from "./render-pipeline"

let RootRenderableClass: any = null

export function setHeadlessRootRenderableClass(cls: any): void {
  RootRenderableClass = cls
}

export interface HeadlessRendererOptions {
  cols: number
  rows: number
}

export class HeadlessRenderer {
  public buffer: BrowserBuffer
  public renderContext: BrowserRenderContext
  public root: any // RootRenderable

  constructor(options: HeadlessRendererOptions) {
    const { cols, rows } = options

    this.buffer = BrowserBuffer.create(cols, rows, "wcwidth")
    this.renderContext = new BrowserRenderContext(cols, rows)
    this.renderContext.setOnRenderRequest(() => {
      // No-op for headless — we render on demand
    })

    if (!RootRenderableClass) {
      throw new Error(
        "RootRenderableClass not set. Call setHeadlessRootRenderableClass before creating HeadlessRenderer.",
      )
    }
    this.root = new RootRenderableClass(this.renderContext)
  }

  renderOnce(): void {
    executeRenderPipeline(this.buffer, this.renderContext, this.root, 0)
  }

  toText(): string {
    return bufferToText(this.buffer)
  }

  resize(cols: number, rows: number): void {
    this.buffer.resize(cols, rows)
    this.renderContext.resize(cols, rows)
    this.root.resize(cols, rows)
  }
}
