import type { RGBA } from "@gridland/utils"
import type { BrowserTextBuffer, TextChunk } from "./browser-text-buffer"

export interface VisibleLineChunk {
  text: string
  fg: RGBA
  bg: RGBA
  attributes: number
  link?: { url: string }
}

export interface VisibleLine {
  chunks: VisibleLineChunk[]
}

const defaultFg: RGBA = {
  r: 1, g: 1, b: 1, a: 1,
  buffer: new Float32Array([1, 1, 1, 1]),
} as RGBA

const defaultBg: RGBA = {
  r: 0, g: 0, b: 0, a: 0,
  buffer: new Float32Array([0, 0, 0, 0]),
} as RGBA

export class BrowserTextBufferView {
  private textBuffer: BrowserTextBuffer
  private _wrapWidth: number | null = null
  private _wrapMode: "none" | "char" | "word" = "word"
  private _viewportX: number = 0
  private _viewportY: number = 0
  private _viewportWidth: number = 0
  private _viewportHeight: number = 0
  private _truncate: boolean = false
  public textAlign: "left" | "center" | "right" = "left"
  private _selection: { start: number; end: number } | null = null
  private _selectionBg: RGBA | undefined
  private _selectionFg: RGBA | undefined

  constructor(textBuffer: BrowserTextBuffer) {
    this.textBuffer = textBuffer
  }

  static create(textBuffer: BrowserTextBuffer): BrowserTextBufferView {
    return new BrowserTextBufferView(textBuffer)
  }

  // Compat
  get ptr(): number {
    return 1
  }

  get lineInfo() {
    const lines = this.getAllWrappedLines()
    const lineStarts: number[] = []
    const lineWidths: number[] = []
    const lineSources: number[] = []
    const lineWraps: number[] = []
    let maxWidth = 0
    let offset = 0

    for (let i = 0; i < lines.length; i++) {
      lineStarts.push(offset)
      const lineText = lines[i].map((c) => c.text).join("")
      const w = lineText.length
      lineWidths.push(w)
      lineSources.push(0)
      lineWraps.push(0)
      if (w > maxWidth) maxWidth = w
      offset += lineText.length + 1
    }

    return { lineStarts, lineWidths, maxLineWidth: maxWidth, lineSources, lineWraps }
  }

  get logicalLineInfo() {
    return this.lineInfo
  }

  setSelection(start: number, end: number, bgColor?: RGBA, fgColor?: RGBA): void {
    this._selection = { start, end }
    this._selectionBg = bgColor
    this._selectionFg = fgColor
  }

  updateSelection(end: number, bgColor?: RGBA, fgColor?: RGBA): void {
    if (this._selection) {
      this._selection.end = end
    }
    if (bgColor) this._selectionBg = bgColor
    if (fgColor) this._selectionFg = fgColor
  }

  resetSelection(): void {
    this._selection = null
  }

  getSelection(): { start: number; end: number } | null {
    return this._selection
  }

  hasSelection(): boolean {
    return this._selection !== null
  }

  setLocalSelection(
    _anchorX: number,
    _anchorY: number,
    _focusX: number,
    _focusY: number,
    _bgColor?: RGBA,
    _fgColor?: RGBA,
  ): boolean {
    return false
  }

  updateLocalSelection(
    _anchorX: number,
    _anchorY: number,
    _focusX: number,
    _focusY: number,
    _bgColor?: RGBA,
    _fgColor?: RGBA,
  ): boolean {
    return false
  }

  resetLocalSelection(): void {}

  getSelectedText(): string {
    if (!this._selection) return ""
    const text = this.textBuffer.getPlainText()
    const start = Math.min(this._selection.start, this._selection.end)
    const end = Math.max(this._selection.start, this._selection.end)
    return text.slice(start, end)
  }

  getPlainText(): string {
    return this.textBuffer.getPlainText()
  }

  setWrapWidth(width: number | null): void {
    this._wrapWidth = width
  }

  setWrapMode(mode: "none" | "char" | "word"): void {
    this._wrapMode = mode
  }

  setViewportSize(width: number, height: number): void {
    this._viewportWidth = width
    this._viewportHeight = height

    if (this._wrapMode !== "none" && width > 0 && this._wrapWidth !== width) {
      this._wrapWidth = width
    }
  }

  setViewport(x: number, y: number, width: number, height: number): void {
    this._viewportX = x
    this._viewportY = y
    this._viewportWidth = width
    this._viewportHeight = height

    // Sync wrap width with viewport width (matches Zig TextBufferView.setViewport behavior)
    if (this._wrapMode !== "none" && width > 0 && this._wrapWidth !== width) {
      this._wrapWidth = width
    }
  }

  setTabIndicator(_indicator: string | number): void {}

  setTabIndicatorColor(_color: RGBA): void {}

  setTruncate(truncate: boolean): void {
    this._truncate = truncate
  }

  private getAllWrappedLines(): VisibleLineChunk[][] {
    const chunks = this.textBuffer.getChunks()
    if (chunks.length === 0) return []

    const dfg = this.textBuffer.defaultFg ?? defaultFg
    const dbg = this.textBuffer.defaultBg ?? defaultBg

    // First, build logical lines from chunks
    const logicalLines: VisibleLineChunk[][] = [[]]

    for (const chunk of chunks) {
      const parts = chunk.text.split("\n")
      for (let i = 0; i < parts.length; i++) {
        if (i > 0) {
          logicalLines.push([])
        }
        if (parts[i].length > 0) {
          const vlc: VisibleLineChunk = {
            text: parts[i],
            fg: chunk.fg ?? dfg,
            bg: chunk.bg ?? dbg,
            attributes: chunk.attributes ?? 0,
          }
          if (chunk.link) vlc.link = chunk.link
          logicalLines[logicalLines.length - 1].push(vlc)
        }
      }
    }

    // Apply wrapping
    if (this._wrapMode === "none" || !this._wrapWidth || this._wrapWidth <= 0) {
      return logicalLines
    }

    const wrappedLines: VisibleLineChunk[][] = []
    const wrapWidth = this._wrapWidth

    for (const logicalLine of logicalLines) {
      // Flatten line text to handle wrapping
      const lineText = logicalLine.map((c) => c.text).join("")

      if (lineText.length <= wrapWidth) {
        wrappedLines.push(logicalLine)
        continue
      }

      if (this._wrapMode === "char") {
        // Character wrapping
        let pos = 0
        while (pos < lineText.length) {
          const end = Math.min(pos + wrapWidth, lineText.length)
          const sliceChunks = this.sliceChunks(logicalLine, pos, end)
          wrappedLines.push(sliceChunks)
          pos = end
        }
      } else {
        // Word wrapping
        let pos = 0
        while (pos < lineText.length) {
          let end = Math.min(pos + wrapWidth, lineText.length)
          if (end < lineText.length) {
            // Look for a space to break at
            let breakPos = end
            while (breakPos > pos && lineText[breakPos] !== " ") {
              breakPos--
            }
            if (breakPos > pos) {
              end = breakPos + 1 // Include the space
            }
          }
          const sliceChunks = this.sliceChunks(logicalLine, pos, end)
          wrappedLines.push(sliceChunks)
          pos = end
        }
      }
    }

    return wrappedLines
  }

  private sliceChunks(chunks: VisibleLineChunk[], start: number, end: number): VisibleLineChunk[] {
    const result: VisibleLineChunk[] = []
    let offset = 0

    for (const chunk of chunks) {
      const chunkStart = offset
      const chunkEnd = offset + chunk.text.length

      if (chunkEnd <= start || chunkStart >= end) {
        offset = chunkEnd
        continue
      }

      const sliceStart = Math.max(0, start - chunkStart)
      const sliceEnd = Math.min(chunk.text.length, end - chunkStart)
      const slicedText = chunk.text.slice(sliceStart, sliceEnd)

      if (slicedText.length > 0) {
        const sliced: VisibleLineChunk = {
          text: slicedText,
          fg: chunk.fg,
          bg: chunk.bg,
          attributes: chunk.attributes,
        }
        if (chunk.link) sliced.link = chunk.link
        result.push(sliced)
      }

      offset = chunkEnd
    }

    return result
  }

  measureForDimensions(width: number, height: number): { lineCount: number; maxWidth: number } | null {
    // Temporarily set wrap width for measurement
    const oldWrapWidth = this._wrapWidth
    if (width > 0 && this._wrapMode !== "none") {
      this._wrapWidth = width
    } else if (width === 0) {
      // width=0 means measure without wrapping
      this._wrapWidth = null
    }

    const lines = this.getAllWrappedLines()
    this._wrapWidth = oldWrapWidth

    let maxWidth = 0
    for (const line of lines) {
      const lineWidth = line.reduce((sum, c) => sum + c.text.length, 0)
      if (lineWidth > maxWidth) maxWidth = lineWidth
    }

    return {
      lineCount: lines.length,
      maxWidth,
    }
  }

  getVirtualLineCount(): number {
    return this.getAllWrappedLines().length
  }

  getVisibleLines(): VisibleLine[] | null {
    const allLines = this.getAllWrappedLines()
    if (allLines.length === 0) return null

    const startLine = this._viewportY
    const endLine =
      this._viewportHeight > 0 ? Math.min(startLine + this._viewportHeight, allLines.length) : allLines.length

    const visibleLines: VisibleLine[] = []
    for (let i = startLine; i < endLine; i++) {
      if (i >= 0 && i < allLines.length) {
        visibleLines.push({ chunks: allLines[i] })
      }
    }

    return visibleLines
  }

  destroy(): void {}
}
