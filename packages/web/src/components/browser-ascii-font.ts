/**
 * Browser implementation of the <ascii-font> JSX intrinsic.
 *
 * Wraps the pure-JS `renderFontToFrameBuffer` helper from
 * @gridland/core's ascii.font module so that mounting <ascii-font> in a
 * browser Vite/Next app produces visible output instead of crashing in
 * `resolveRenderLib`. This is the Phase 3 deliverable of
 * tasks/003-browser-compat-contract.md.
 *
 * Contract:
 *   - Constructor does not allocate any OptimizedBuffer.
 *   - Constructor does not touch RenderLib / zig-registry.
 *   - renderSelf writes glyph cells directly into the destination buffer
 *     (duck-typed as OptimizedBuffer; at runtime this is BrowserBuffer).
 *   - Capability tag for "ascii-font" is "dual-impl" (Phase 3 flips it from
 *     "terminal-only" once this renderable is registered via register.ts).
 */
import { fonts, measureText, renderFontToFrameBuffer } from "../../../core/src/lib/ascii.font"
import type { ColorInput } from "../../../core/src/lib/RGBA"
import type { OptimizedBuffer } from "../../../core/src/buffer"
import { type RenderableOptions, Renderable } from "../../../core/src/Renderable"
import type { RenderContext } from "../../../core/src/types"

export interface BrowserAsciiFontOptions
  extends Omit<RenderableOptions<BrowserAsciiFontRenderable>, "width" | "height"> {
  text?: string
  font?: keyof typeof fonts
  color?: ColorInput | ColorInput[]
  backgroundColor?: ColorInput
}

const DEFAULTS = {
  text: "",
  font: "tiny" as const,
  color: "#FFFFFF" as const,
  backgroundColor: "transparent" as const,
}

export class BrowserAsciiFontRenderable extends Renderable {
  protected _text: string
  protected _font: keyof typeof fonts
  protected _color: ColorInput | ColorInput[]
  protected _backgroundColor: ColorInput

  constructor(ctx: RenderContext, options: BrowserAsciiFontOptions) {
    const text = options.text ?? DEFAULTS.text
    const font = options.font ?? DEFAULTS.font
    const measurements = measureText({ text, font })

    super(ctx, {
      flexShrink: 0,
      ...options,
      width: measurements.width || 1,
      height: measurements.height || 1,
    } as RenderableOptions<BrowserAsciiFontRenderable>)

    this._text = text
    this._font = font
    this._color = options.color ?? DEFAULTS.color
    this._backgroundColor = options.backgroundColor ?? DEFAULTS.backgroundColor
  }

  get text(): string {
    return this._text
  }

  set text(value: string) {
    if (this._text === value) return
    this._text = value
    this.updateDimensions()
    this.requestRender()
  }

  get font(): keyof typeof fonts {
    return this._font
  }

  set font(value: keyof typeof fonts) {
    if (this._font === value) return
    this._font = value
    this.updateDimensions()
    this.requestRender()
  }

  get color(): ColorInput | ColorInput[] {
    return this._color
  }

  set color(value: ColorInput | ColorInput[]) {
    this._color = value
    this.requestRender()
  }

  get backgroundColor(): ColorInput {
    return this._backgroundColor
  }

  set backgroundColor(value: ColorInput) {
    this._backgroundColor = value
    this.requestRender()
  }

  private updateDimensions(): void {
    const m = measureText({ text: this._text, font: this._font })
    this.width = m.width || 1
    this.height = m.height || 1
  }

  protected renderSelf(buffer: OptimizedBuffer, _deltaTime: number): void {
    if (!this.visible || this.isDestroyed) return
    if (!this._text) return
    renderFontToFrameBuffer(buffer, {
      text: this._text,
      x: this.x,
      y: this.y,
      color: this._color,
      backgroundColor: this._backgroundColor,
      font: this._font,
    })
  }
}
