// Pure-JS EditorView implementation for browser environment.
// Wraps an EditBuffer and provides viewport/visual cursor mapping.

import type { EditBuffer, LogicalCursor } from "./edit-buffer-stub"

export interface Viewport {
  offsetY: number
  offsetX: number
  height: number
  width: number
}

export interface VisualCursor {
  visualRow: number
  visualCol: number
  logicalRow: number
  logicalCol: number
  offset: number
}

export interface LineInfo {
  lineIndex: number
  lineCount: number
  colIndex: number
  colCount: number
  byteIndex: number
  byteCount: number
}

export class EditorView {
  public readonly ptr: number = 0 // dummy pointer

  private editBuffer: EditBuffer
  private viewportWidth: number
  private viewportHeight: number
  private viewportOffsetX: number = 0
  private viewportOffsetY: number = 0
  private _destroyed: boolean = false
  private _wrapMode: "none" | "char" | "word" = "word"
  private _scrollMargin: number = 0
  private _placeholderChunks: { text: string; fg?: any; bg?: any; attributes?: number }[] = []

  // Selection state
  private _selectionStart: number | null = null
  private _selectionEnd: number | null = null

  private _extmarksController: any = null

  constructor(editBuffer: EditBuffer, width: number, height: number) {
    this.editBuffer = editBuffer
    this.viewportWidth = width
    this.viewportHeight = height
  }

  static create(editBuffer: EditBuffer, viewportWidth: number, viewportHeight: number): EditorView {
    return new EditorView(editBuffer, viewportWidth, viewportHeight)
  }

  // --- Viewport ---

  setViewportSize(width: number, height: number): void {
    this.viewportWidth = width
    this.viewportHeight = height
  }

  setViewport(x: number, y: number, width: number, height: number, _moveCursor: boolean = true): void {
    this.viewportOffsetX = x
    this.viewportOffsetY = y
    this.viewportWidth = width
    this.viewportHeight = height
  }

  getViewport(): Viewport {
    return {
      offsetX: this.viewportOffsetX,
      offsetY: this.viewportOffsetY,
      width: this.viewportWidth,
      height: this.viewportHeight,
    }
  }

  setScrollMargin(margin: number): void {
    this._scrollMargin = margin
  }

  setWrapMode(mode: "none" | "char" | "word"): void {
    this._wrapMode = mode
  }

  // --- Line counts ---

  getVirtualLineCount(): number {
    // For no-wrap mode, virtual lines = logical lines
    if (this._wrapMode === "none") {
      return this.editBuffer.getLineCount()
    }
    // For wrap modes, calculate wrapped lines
    return this.getTotalVirtualLineCount()
  }

  getTotalVirtualLineCount(): number {
    if (this._wrapMode === "none" || this.viewportWidth <= 0) {
      return this.editBuffer.getLineCount()
    }
    const text = this.editBuffer.getText()
    const lines = text.split("\n")
    let total = 0
    for (const line of lines) {
      total += Math.max(1, Math.ceil(line.length / this.viewportWidth))
    }
    return total
  }

  // --- Cursor ---

  getCursor(): { row: number; col: number } {
    const pos = this.editBuffer.getCursorPosition()
    return { row: pos.row, col: pos.col }
  }

  getVisualCursor(): VisualCursor {
    const pos = this.editBuffer.getCursorPosition()
    // For simple single-line / no-wrap, visual = logical minus viewport offset
    const visualRow = pos.row - this.viewportOffsetY
    const visualCol = pos.col - this.viewportOffsetX
    return {
      visualRow: Math.max(0, visualRow),
      visualCol: Math.max(0, visualCol),
      logicalRow: pos.row,
      logicalCol: pos.col,
      offset: pos.offset,
    }
  }

  setCursorByOffset(offset: number): void {
    this.editBuffer.setCursorByOffset(offset)
    this.ensureCursorVisible()
  }

  // --- Visual navigation ---

  moveUpVisual(): void {
    this.editBuffer.moveCursorUp()
    this.ensureCursorVisible()
  }

  moveDownVisual(): void {
    this.editBuffer.moveCursorDown()
    this.ensureCursorVisible()
  }

  getVisualSOL(): VisualCursor {
    const pos = this.editBuffer.getCursorPosition()
    const offset = this.editBuffer.getLineStartOffset(pos.row)
    return {
      visualRow: pos.row - this.viewportOffsetY,
      visualCol: 0,
      logicalRow: pos.row,
      logicalCol: 0,
      offset,
    }
  }

  getVisualEOL(): VisualCursor {
    const eol = this.editBuffer.getEOL()
    return {
      visualRow: eol.row - this.viewportOffsetY,
      visualCol: eol.col - this.viewportOffsetX,
      logicalRow: eol.row,
      logicalCol: eol.col,
      offset: eol.offset,
    }
  }

  getNextWordBoundary(): VisualCursor {
    const lc = this.editBuffer.getNextWordBoundary()
    return this.logicalToVisual(lc)
  }

  getPrevWordBoundary(): VisualCursor {
    const lc = this.editBuffer.getPrevWordBoundary()
    return this.logicalToVisual(lc)
  }

  getEOL(): VisualCursor {
    const eol = this.editBuffer.getEOL()
    return this.logicalToVisual(eol)
  }

  // --- Line info ---

  getLineInfo(): LineInfo {
    return this.getLogicalLineInfo()
  }

  getLogicalLineInfo(): LineInfo {
    const pos = this.editBuffer.getCursorPosition()
    const text = this.editBuffer.getText()
    const lines = text.split("\n")
    const line = lines[pos.row] || ""
    return {
      lineIndex: pos.row,
      lineCount: lines.length,
      colIndex: pos.col,
      colCount: line.length,
      byteIndex: pos.offset,
      byteCount: new TextEncoder().encode(text).length,
    }
  }

  // --- Selection ---

  setSelection(start: number, end: number, _bgColor?: any, _fgColor?: any): void {
    this._selectionStart = start
    this._selectionEnd = end
  }

  updateSelection(end: number, _bgColor?: any, _fgColor?: any): void {
    this._selectionEnd = end
  }

  resetSelection(): void {
    this._selectionStart = null
    this._selectionEnd = null
  }

  getSelection(): { start: number; end: number } | null {
    if (this._selectionStart === null || this._selectionEnd === null) return null
    return { start: this._selectionStart, end: this._selectionEnd }
  }

  hasSelection(): boolean {
    return this._selectionStart !== null && this._selectionEnd !== null
  }

  setLocalSelection(
    _anchorX: number,
    _anchorY: number,
    _focusX: number,
    _focusY: number,
    _bgColor?: any,
    _fgColor?: any,
    _updateCursor?: boolean,
    _followCursor?: boolean,
  ): boolean {
    // Convert visual coords to offsets (simplified)
    this._selectionStart = 0
    this._selectionEnd = 0
    return true
  }

  updateLocalSelection(
    _anchorX: number,
    _anchorY: number,
    _focusX: number,
    _focusY: number,
    _bgColor?: any,
    _fgColor?: any,
    _updateCursor?: boolean,
    _followCursor?: boolean,
  ): boolean {
    return true
  }

  resetLocalSelection(): void {
    this.resetSelection()
  }

  getSelectedText(): string {
    const sel = this.getSelection()
    if (!sel) return ""
    const text = this.editBuffer.getText()
    const start = Math.min(sel.start, sel.end)
    const end = Math.max(sel.start, sel.end)
    return text.substring(start, end)
  }

  deleteSelectedText(): void {
    const sel = this.getSelection()
    if (!sel) return
    const text = this.editBuffer.getText()
    const start = Math.min(sel.start, sel.end)
    const end = Math.max(sel.start, sel.end)
    const newText = text.substring(0, start) + text.substring(end)
    this.editBuffer.setText(newText)
    this.editBuffer.setCursorByOffset(start)
    this.resetSelection()
  }

  // --- Text ---

  getText(): string {
    return this.editBuffer.getText()
  }

  // --- Placeholder ---

  setPlaceholderStyledText(chunks: { text: string; fg?: any; bg?: any; attributes?: number }[]): void {
    this._placeholderChunks = chunks
  }

  // --- Tab ---

  setTabIndicator(_indicator: string | number): void {}
  setTabIndicatorColor(_color: any): void {}

  // --- Measurement ---

  measureForDimensions(width: number, _height: number): { lineCount: number; maxWidth: number } | null {
    const text = this.editBuffer.getText()
    const lines = text.split("\n")

    if (this._wrapMode === "none" || width <= 0) {
      let maxWidth = 0
      for (const line of lines) {
        maxWidth = Math.max(maxWidth, line.length)
      }
      // If text is empty but we have placeholder, use that for measurement
      if (text === "" && this._placeholderChunks.length > 0) {
        let placeholderLen = 0
        for (const chunk of this._placeholderChunks) {
          placeholderLen += chunk.text.length
        }
        maxWidth = Math.max(maxWidth, placeholderLen)
      }
      return { lineCount: lines.length, maxWidth }
    }

    let totalLines = 0
    let maxWidth = 0
    for (const line of lines) {
      const wrappedLines = Math.max(1, Math.ceil(line.length / width))
      totalLines += wrappedLines
      maxWidth = Math.max(maxWidth, Math.min(line.length, width))
    }
    return { lineCount: totalLines, maxWidth }
  }

  // --- Extmarks ---

  get extmarks(): any {
    if (!this._extmarksController) {
      this._extmarksController = {
        destroy() {},
      }
    }
    return this._extmarksController
  }

  // --- Cleanup ---

  destroy(): void {
    if (this._destroyed) return
    this._destroyed = true
    if (this._extmarksController && this._extmarksController.destroy) {
      this._extmarksController.destroy()
    }
  }

  // --- Helpers ---

  private logicalToVisual(lc: LogicalCursor): VisualCursor {
    return {
      visualRow: lc.row - this.viewportOffsetY,
      visualCol: lc.col - this.viewportOffsetX,
      logicalRow: lc.row,
      logicalCol: lc.col,
      offset: lc.offset,
    }
  }

  private ensureCursorVisible(): void {
    const pos = this.editBuffer.getCursorPosition()
    // Auto-scroll viewport to keep cursor visible
    if (pos.row < this.viewportOffsetY) {
      this.viewportOffsetY = pos.row
    } else if (pos.row >= this.viewportOffsetY + this.viewportHeight) {
      this.viewportOffsetY = pos.row - this.viewportHeight + 1
    }
    if (this._wrapMode === "none") {
      if (pos.col < this.viewportOffsetX) {
        this.viewportOffsetX = pos.col
      } else if (pos.col >= this.viewportOffsetX + this.viewportWidth) {
        this.viewportOffsetX = pos.col - this.viewportWidth + 1
      }
    }
  }
}
