import type { RGBA } from "./core-shims/rgba"
import type { CapturedLine, CapturedSpan } from "./core-shims/types"
import { attributesWithLink } from "./core-shims/index"

// Attribute flags matching TextAttributes from opentui core
const CONTINUATION = 0xc0000000

interface ScissorRect {
  x: number
  y: number
  width: number
  height: number
}

export type WidthMethod = "wcwidth" | "unicode"

export interface BorderDrawOptions {
  x: number
  y: number
  width: number
  height: number
  borderStyle?: string
  customBorderChars?: Uint32Array
  border: boolean | string[]
  borderColor: RGBA
  backgroundColor: RGBA
  shouldFill?: boolean
  title?: string
  titleAlignment?: "left" | "center" | "right"
}

export class BrowserBuffer {
  public id: string
  public respectAlpha: boolean

  private _width: number
  private _height: number
  private _widthMethod: WidthMethod

  // Cell data - same layout as native OptimizedBuffer
  public char: Uint32Array
  public fg: Float32Array
  public bg: Float32Array
  public attributes: Uint32Array

  private scissorStack: ScissorRect[] = []
  private opacityStack: number[] = []

  // Link registry for clickable links
  public linkRegistry: Map<number, string> = new Map()
  private nextLinkId: number = 1

  constructor(
    width: number,
    height: number,
    options: { respectAlpha?: boolean; id?: string; widthMethod?: WidthMethod } = {},
  ) {
    this._width = width
    this._height = height
    this._widthMethod = options.widthMethod ?? "wcwidth"
    this.respectAlpha = options.respectAlpha ?? false
    this.id = options.id ?? `browser-buffer-${Math.random().toString(36).slice(2, 8)}`

    const size = width * height
    this.char = new Uint32Array(size)
    this.fg = new Float32Array(size * 4)
    this.bg = new Float32Array(size * 4)
    this.attributes = new Uint32Array(size)

    // Fill with spaces
    this.char.fill(0x20) // space
  }

  static create(
    width: number,
    height: number,
    widthMethod: WidthMethod,
    options?: { respectAlpha?: boolean; id?: string },
  ): BrowserBuffer {
    return new BrowserBuffer(width, height, { ...options, widthMethod })
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

  get ptr(): number {
    return 0
  }

  get buffers() {
    return {
      char: this.char,
      fg: this.fg,
      bg: this.bg,
      attributes: this.attributes,
    }
  }

  setRespectAlpha(respectAlpha: boolean): void {
    this.respectAlpha = respectAlpha
  }

  getNativeId(): string {
    return this.id
  }

  registerLink(url: string): number {
    const id = this.nextLinkId++
    this.linkRegistry.set(id, url)
    return id
  }

  getLinkUrl(linkId: number): string | undefined {
    return this.linkRegistry.get(linkId)
  }

  private isInScissor(x: number, y: number): boolean {
    if (this.scissorStack.length === 0) return true
    const rect = this.scissorStack[this.scissorStack.length - 1]
    return x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height
  }

  private getCurrentOpacityMultiplier(): number {
    if (this.opacityStack.length === 0) return 1
    return this.opacityStack[this.opacityStack.length - 1]
  }

  private applyOpacity(color: RGBA): RGBA {
    const multiplier = this.getCurrentOpacityMultiplier()
    if (multiplier >= 1) return color
    return {
      r: color.r,
      g: color.g,
      b: color.b,
      a: color.a * multiplier,
      buffer: new Float32Array([color.r, color.g, color.b, color.a * multiplier]),
      toInts: color.toInts,
      equals: color.equals,
      map: color.map,
      toString: color.toString,
    } as RGBA
  }

  clear(bg?: RGBA): void {
    const size = this._width * this._height
    this.char.fill(0x20) // space
    this.attributes.fill(0)
    this.linkRegistry.clear()
    this.nextLinkId = 1

    if (bg) {
      for (let i = 0; i < size; i++) {
        const offset = i * 4
        this.bg[offset] = bg.r
        this.bg[offset + 1] = bg.g
        this.bg[offset + 2] = bg.b
        this.bg[offset + 3] = bg.a
        // Clear fg
        this.fg[offset] = 0
        this.fg[offset + 1] = 0
        this.fg[offset + 2] = 0
        this.fg[offset + 3] = 0
      }
    } else {
      this.fg.fill(0)
      this.bg.fill(0)
    }
  }

  setCell(x: number, y: number, char: string, fgColor: RGBA, bgColor: RGBA, attr: number = 0): void {
    if (x < 0 || x >= this._width || y < 0 || y >= this._height) return
    if (!this.isInScissor(x, y)) return

    const idx = y * this._width + x
    const offset = idx * 4

    const effectiveBg = this.applyOpacity(bgColor)
    const effectiveFg = this.applyOpacity(fgColor)

    this.char[idx] = char.codePointAt(0) ?? 0x20
    this.attributes[idx] = attr

    this.fg[offset] = effectiveFg.r
    this.fg[offset + 1] = effectiveFg.g
    this.fg[offset + 2] = effectiveFg.b
    this.fg[offset + 3] = effectiveFg.a

    this.bg[offset] = effectiveBg.r
    this.bg[offset + 1] = effectiveBg.g
    this.bg[offset + 2] = effectiveBg.b
    this.bg[offset + 3] = effectiveBg.a
  }

  setCellWithAlphaBlending(
    x: number,
    y: number,
    char: string,
    fgColor: RGBA,
    bgColor: RGBA,
    attr: number = 0,
  ): void {
    // For the PoC, same as setCell
    this.setCell(x, y, char, fgColor, bgColor, attr)
  }

  drawChar(charCode: number, x: number, y: number, fgColor: RGBA, bgColor: RGBA, attr: number = 0): void {
    if (x < 0 || x >= this._width || y < 0 || y >= this._height) return
    if (!this.isInScissor(x, y)) return

    const idx = y * this._width + x
    const offset = idx * 4

    const effectiveBg = this.applyOpacity(bgColor)
    const effectiveFg = this.applyOpacity(fgColor)

    this.char[idx] = charCode
    this.attributes[idx] = attr

    this.fg[offset] = effectiveFg.r
    this.fg[offset + 1] = effectiveFg.g
    this.fg[offset + 2] = effectiveFg.b
    this.fg[offset + 3] = effectiveFg.a

    this.bg[offset] = effectiveBg.r
    this.bg[offset + 1] = effectiveBg.g
    this.bg[offset + 2] = effectiveBg.b
    this.bg[offset + 3] = effectiveBg.a
  }

  drawText(
    text: string,
    x: number,
    y: number,
    fgColor: RGBA,
    bgColor?: RGBA,
    attr: number = 0,
    _selection?: { start: number; end: number; bgColor?: RGBA; fgColor?: RGBA } | null,
  ): void {
    const transparentBg: RGBA = {
      r: 0, g: 0, b: 0, a: 0,
      buffer: new Float32Array([0, 0, 0, 0]),
    } as RGBA
    const bg = bgColor ?? transparentBg

    let curX = x
    for (const ch of text) {
      if (curX >= this._width) break
      if (curX >= 0) {
        this.setCell(curX, y, ch, fgColor, bg, attr)
      }
      curX++
    }
  }

  fillRect(x: number, y: number, width: number, height: number, bgColor: RGBA): void {
    for (let row = y; row < y + height && row < this._height; row++) {
      for (let col = x; col < x + width && col < this._width; col++) {
        if (col < 0 || row < 0) continue
        if (!this.isInScissor(col, row)) continue

        const idx = row * this._width + col
        const offset = idx * 4
        const effectiveBg = this.applyOpacity(bgColor)

        this.char[idx] = 0x20
        this.bg[offset] = effectiveBg.r
        this.bg[offset + 1] = effectiveBg.g
        this.bg[offset + 2] = effectiveBg.b
        this.bg[offset + 3] = effectiveBg.a
      }
    }
  }

  drawBox(options: BorderDrawOptions): void {
    const {
      x,
      y,
      width,
      height,
      border,
      borderColor,
      backgroundColor,
      shouldFill = true,
      title,
      titleAlignment = "left",
    } = options

    if (width <= 0 || height <= 0) return

    // Parse border sides
    const sides = {
      top: border === true || (Array.isArray(border) && border.includes("top")),
      right: border === true || (Array.isArray(border) && border.includes("right")),
      bottom: border === true || (Array.isArray(border) && border.includes("bottom")),
      left: border === true || (Array.isArray(border) && border.includes("left")),
    }

    // Get border chars (use customBorderChars or default rounded)
    const borderChars = options.customBorderChars ?? this.getDefaultBorderChars(options.borderStyle)

    // Fill background
    if (shouldFill) {
      const fillStartX = x + (sides.left ? 1 : 0)
      const fillStartY = y + (sides.top ? 1 : 0)
      const fillWidth = width - (sides.left ? 1 : 0) - (sides.right ? 1 : 0)
      const fillHeight = height - (sides.top ? 1 : 0) - (sides.bottom ? 1 : 0)
      if (fillWidth > 0 && fillHeight > 0) {
        this.fillRect(fillStartX, fillStartY, fillWidth, fillHeight, backgroundColor)
      }
    }

    if (!border) return

    const transparent: RGBA = { r: 0, g: 0, b: 0, a: 0, buffer: new Float32Array([0, 0, 0, 0]) } as RGBA

    // Draw borders
    // borderChars layout: [topLeft, topRight, bottomLeft, bottomRight, horizontal, vertical, topT, bottomT, leftT, rightT, cross]
    const topLeft = borderChars[0]
    const topRight = borderChars[1]
    const bottomLeft = borderChars[2]
    const bottomRight = borderChars[3]
    const horizontal = borderChars[4]
    const vertical = borderChars[5]

    // Top border
    if (sides.top) {
      if (sides.left) this.drawChar(topLeft, x, y, borderColor, transparent)
      for (let col = 1; col < width - 1; col++) {
        this.drawChar(horizontal, x + col, y, borderColor, transparent)
      }
      if (sides.right && width > 1) this.drawChar(topRight, x + width - 1, y, borderColor, transparent)
    }

    // Bottom border
    if (sides.bottom && height > 1) {
      if (sides.left) this.drawChar(bottomLeft, x, y + height - 1, borderColor, transparent)
      for (let col = 1; col < width - 1; col++) {
        this.drawChar(horizontal, x + col, y + height - 1, borderColor, transparent)
      }
      if (sides.right && width > 1)
        this.drawChar(bottomRight, x + width - 1, y + height - 1, borderColor, transparent)
    }

    // Left border
    if (sides.left) {
      for (let row = 1; row < height - 1; row++) {
        this.drawChar(vertical, x, y + row, borderColor, transparent)
      }
    }

    // Right border
    if (sides.right && width > 1) {
      for (let row = 1; row < height - 1; row++) {
        this.drawChar(vertical, x + width - 1, y + row, borderColor, transparent)
      }
    }

    // Draw title on top border
    if (title && sides.top && width > 4) {
      const maxTitleLen = width - 4
      const truncatedTitle = title.length > maxTitleLen ? title.slice(0, maxTitleLen) : title
      let titleX: number
      if (titleAlignment === "center") {
        titleX = x + Math.floor((width - truncatedTitle.length) / 2)
      } else if (titleAlignment === "right") {
        titleX = x + width - truncatedTitle.length - 2
      } else {
        titleX = x + 2
      }
      this.drawText(truncatedTitle, titleX, y, borderColor, transparent)
    }
  }

  private getDefaultBorderChars(borderStyle?: string): Uint32Array {
    // Rounded border chars by default
    const styles: Record<string, number[]> = {
      rounded: [0x256d, 0x256e, 0x2570, 0x256f, 0x2500, 0x2502, 0x252c, 0x2534, 0x251c, 0x2524, 0x253c],
      single: [0x250c, 0x2510, 0x2514, 0x2518, 0x2500, 0x2502, 0x252c, 0x2534, 0x251c, 0x2524, 0x253c],
      double: [0x2554, 0x2557, 0x255a, 0x255d, 0x2550, 0x2551, 0x2566, 0x2569, 0x2560, 0x2563, 0x256c],
      heavy: [0x250f, 0x2513, 0x2517, 0x251b, 0x2501, 0x2503, 0x2533, 0x253b, 0x2523, 0x252b, 0x254b],
    }
    const chars = styles[borderStyle ?? "rounded"] ?? styles.rounded
    return new Uint32Array(chars)
  }

  pushScissorRect(x: number, y: number, width: number, height: number): void {
    if (this.scissorStack.length > 0) {
      // Intersect with current scissor
      const current = this.scissorStack[this.scissorStack.length - 1]
      const nx = Math.max(x, current.x)
      const ny = Math.max(y, current.y)
      const nw = Math.min(x + width, current.x + current.width) - nx
      const nh = Math.min(y + height, current.y + current.height) - ny
      this.scissorStack.push({ x: nx, y: ny, width: Math.max(0, nw), height: Math.max(0, nh) })
    } else {
      this.scissorStack.push({ x, y, width, height })
    }
  }

  popScissorRect(): void {
    this.scissorStack.pop()
  }

  clearScissorRects(): void {
    this.scissorStack = []
  }

  pushOpacity(opacity: number): void {
    const current = this.getCurrentOpacityMultiplier()
    this.opacityStack.push(current * opacity)
  }

  popOpacity(): void {
    this.opacityStack.pop()
  }

  getCurrentOpacity(): number {
    return this.getCurrentOpacityMultiplier()
  }

  clearOpacity(): void {
    this.opacityStack = []
  }

  resize(width: number, height: number): void {
    this._width = width
    this._height = height
    const size = width * height
    this.char = new Uint32Array(size)
    this.fg = new Float32Array(size * 4)
    this.bg = new Float32Array(size * 4)
    this.attributes = new Uint32Array(size)
    this.char.fill(0x20)
  }

  // Read buffer into CapturedLine[] for testing
  getSpanLines(): CapturedLine[] {
    const lines: CapturedLine[] = []

    for (let row = 0; row < this._height; row++) {
      const spans: CapturedSpan[] = []
      let currentSpan: CapturedSpan | null = null

      for (let col = 0; col < this._width; col++) {
        const idx = row * this._width + col
        const offset = idx * 4

        // Skip continuation chars
        if (this.attributes[idx] & CONTINUATION) continue

        const charCode = this.char[idx]
        const ch = charCode === 0 ? " " : String.fromCodePoint(charCode)
        const fgR = this.fg[offset]
        const fgG = this.fg[offset + 1]
        const fgB = this.fg[offset + 2]
        const fgA = this.fg[offset + 3]
        const bgR = this.bg[offset]
        const bgG = this.bg[offset + 1]
        const bgB = this.bg[offset + 2]
        const bgA = this.bg[offset + 3]
        const attr = this.attributes[idx] & 0xff

        const fg: RGBA = {
          r: fgR, g: fgG, b: fgB, a: fgA,
          buffer: new Float32Array([fgR, fgG, fgB, fgA]),
        } as RGBA
        const bg: RGBA = {
          r: bgR, g: bgG, b: bgB, a: bgA,
          buffer: new Float32Array([bgR, bgG, bgB, bgA]),
        } as RGBA

        if (
          currentSpan &&
          currentSpan.fg.r === fgR &&
          currentSpan.fg.g === fgG &&
          currentSpan.fg.b === fgB &&
          currentSpan.fg.a === fgA &&
          currentSpan.bg.r === bgR &&
          currentSpan.bg.g === bgG &&
          currentSpan.bg.b === bgB &&
          currentSpan.bg.a === bgA &&
          currentSpan.attributes === attr
        ) {
          currentSpan.text += ch
          currentSpan.width += 1
        } else {
          if (currentSpan) spans.push(currentSpan)
          currentSpan = { text: ch, fg, bg, attributes: attr, width: 1 }
        }
      }

      if (currentSpan) spans.push(currentSpan)
      lines.push({ spans })
    }

    return lines
  }

  // Draw a text buffer view into the buffer
  drawTextBufferView(view: any, x: number, y: number): void {
    if (!view || !view.getVisibleLines) return

    const lines = view.getVisibleLines()
    if (!lines) return

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx]
      if (!line) continue

      let curX = x
      for (const chunk of line.chunks) {
        const text = chunk.text
        const fgColor = chunk.fg
        const bgColor = chunk.bg
        let attr = chunk.attributes ?? 0

        // Encode link ID into attributes if chunk has a link
        if (chunk.link && chunk.link.url) {
          const linkId = this.registerLink(chunk.link.url)
          attr = attributesWithLink(attr, linkId)
        }

        for (const ch of text) {
          if (curX >= this._width) break
          if (curX >= 0 && y + lineIdx >= 0 && y + lineIdx < this._height) {
            this.setCell(curX, y + lineIdx, ch, fgColor, bgColor, attr)
          }
          curX++
        }
      }
    }
  }

  drawTextBuffer(textBufferView: any, x: number, y: number): void {
    this.drawTextBufferView(textBufferView, x, y)
  }

  drawFrameBuffer(
    destX: number,
    destY: number,
    frameBuffer: BrowserBuffer,
    sourceX: number = 0,
    sourceY: number = 0,
    sourceWidth?: number,
    sourceHeight?: number,
  ): void {
    const sw = sourceWidth ?? frameBuffer.width
    const sh = sourceHeight ?? frameBuffer.height
    const srcChar = frameBuffer.char
    const srcFg = frameBuffer.fg
    const srcBg = frameBuffer.bg
    const srcAttr = frameBuffer.attributes
    const srcCols = frameBuffer.width

    for (let row = 0; row < sh; row++) {
      const srcRow = sourceY + row
      const dstRow = destY + row
      if (srcRow < 0 || srcRow >= frameBuffer.height) continue
      if (dstRow < 0 || dstRow >= this._height) continue

      for (let col = 0; col < sw; col++) {
        const srcCol = sourceX + col
        const dstCol = destX + col
        if (srcCol < 0 || srcCol >= frameBuffer.width) continue
        if (dstCol < 0 || dstCol >= this._width) continue
        if (!this.isInScissor(dstCol, dstRow)) continue

        const srcIdx = srcRow * srcCols + srcCol
        const dstIdx = dstRow * this._width + dstCol
        const srcOffset = srcIdx * 4
        const dstOffset = dstIdx * 4

        this.char[dstIdx] = srcChar[srcIdx]
        this.attributes[dstIdx] = srcAttr[srcIdx]

        // Apply opacity to fg
        const fgA = srcFg[srcOffset + 3]
        const opacityMul = this.getCurrentOpacityMultiplier()
        this.fg[dstOffset] = srcFg[srcOffset]
        this.fg[dstOffset + 1] = srcFg[srcOffset + 1]
        this.fg[dstOffset + 2] = srcFg[srcOffset + 2]
        this.fg[dstOffset + 3] = fgA * opacityMul

        // Apply opacity to bg
        const bgA = srcBg[srcOffset + 3]
        this.bg[dstOffset] = srcBg[srcOffset]
        this.bg[dstOffset + 1] = srcBg[srcOffset + 1]
        this.bg[dstOffset + 2] = srcBg[srcOffset + 2]
        this.bg[dstOffset + 3] = bgA * opacityMul
      }
    }
  }
  drawEditorView(editorView: any, x: number, y: number): void {
    if (!editorView) return

    const viewport = editorView.getViewport()
    const text = editorView.getText()
    const lines = text.split("\n")

    // Default colors
    const dfg = editorView.editBuffer?._defaultFg ?? {
      r: 1, g: 1, b: 1, a: 1,
      buffer: new Float32Array([1, 1, 1, 1]),
    } as RGBA
    const dbg = editorView.editBuffer?._defaultBg ?? {
      r: 0, g: 0, b: 0, a: 0,
      buffer: new Float32Array([0, 0, 0, 0]),
    } as RGBA

    const visibleRows = viewport.height > 0 ? viewport.height : this._height - y

    if (text === "" && editorView._placeholderChunks && editorView._placeholderChunks.length > 0) {
      // Draw placeholder text
      let curX = x
      for (const chunk of editorView._placeholderChunks) {
        const chunkFg = chunk.fg ?? dfg
        const chunkBg = chunk.bg ?? dbg
        const attr = (chunk.attributes ?? 0) | 2 // DIM attribute = 1 << 1
        for (const ch of chunk.text) {
          if (curX >= this._width) break
          if (curX >= 0 && y >= 0 && y < this._height) {
            this.setCell(curX, y, ch, chunkFg, chunkBg, attr)
          }
          curX++
        }
      }
    } else {
      // Draw text lines
      for (let row = 0; row < visibleRows; row++) {
        const lineIdx = viewport.offsetY + row
        if (lineIdx < 0 || lineIdx >= lines.length) continue
        const dstRow = y + row
        if (dstRow < 0 || dstRow >= this._height) continue

        const line = lines[lineIdx]
        for (let col = 0; col < line.length; col++) {
          const srcCol = viewport.offsetX + col
          if (srcCol < 0 || srcCol >= line.length) continue
          const dstCol = x + col
          if (dstCol < 0 || dstCol >= this._width) break

          this.setCell(dstCol, dstRow, line[srcCol], dfg, dbg, 0)
        }
      }
    }

    // Draw cursor with INVERSE attribute
    const cursor = editorView.getVisualCursor()
    if (cursor) {
      const cursorX = x + cursor.visualCol
      const cursorY = y + cursor.visualRow
      if (cursorX >= 0 && cursorX < this._width && cursorY >= 0 && cursorY < this._height) {
        const idx = cursorY * this._width + cursorX
        const charCode = this.char[idx]
        const ch = charCode === 0 || charCode === 0x20 ? " " : String.fromCodePoint(charCode)
        this.setCell(cursorX, cursorY, ch, dfg, dbg, 32) // INVERSE = 1 << 5 = 32
      }
    }
  }
  drawSuperSampleBuffer(): void {}
  drawPackedBuffer(): void {}
  drawGrayscaleBuffer(): void {}
  drawGrayscaleBufferSupersampled(): void {}
  drawGrid(): void {}
  encodeUnicode(_text: string): null {
    return null
  }
  freeUnicode(): void {}
  getRealCharBytes(): Uint8Array {
    return new Uint8Array(0)
  }
  destroy(): void {}
}

// Export as OptimizedBuffer so opentui source code imports work directly
export { BrowserBuffer as OptimizedBuffer }
