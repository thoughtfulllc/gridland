// Pure-JS EditBuffer implementation for browser environment.
// Replaces the native Zig-backed EditBuffer with a simple array-of-lines model.

import { EventEmitter } from "events"

export interface LogicalCursor {
  row: number
  col: number
  offset: number
}

let nextId = 1

export class EditBuffer extends EventEmitter {
  public readonly id: number
  public readonly ptr: number = 0 // dummy pointer

  private lines: string[] = [""]
  private cursorRow: number = 0
  private cursorCol: number = 0
  private _destroyed: boolean = false

  private undoStack: { lines: string[]; row: number; col: number }[] = []
  private redoStack: { lines: string[]; row: number; col: number }[] = []

  private _defaultFg: any = null
  private _defaultBg: any = null
  private _defaultAttributes: number | null = null
  private _syntaxStyle: any = null
  private _highlights: Map<number, any[]> = new Map()

  constructor() {
    super()
    this.id = nextId++
  }

  static create(_widthMethod?: any): EditBuffer {
    return new EditBuffer()
  }

  // --- Text operations ---

  setText(text: string): void {
    this.lines = text.split("\n")
    if (this.lines.length === 0) this.lines = [""]
    this.cursorRow = 0
    this.cursorCol = 0
    this.undoStack = []
    this.redoStack = []
    this.emit("content-changed")
    this.emit("cursor-changed")
  }

  setTextOwned(text: string): void {
    this.setText(text)
  }

  replaceText(text: string): void {
    this.pushUndo()
    this.lines = text.split("\n")
    if (this.lines.length === 0) this.lines = [""]
    this.cursorRow = 0
    this.cursorCol = 0
    this.emit("content-changed")
    this.emit("cursor-changed")
  }

  replaceTextOwned(text: string): void {
    this.replaceText(text)
  }

  getText(): string {
    return this.lines.join("\n")
  }

  getTextRange(startOffset: number, endOffset: number): string {
    const text = this.getText()
    return text.substring(startOffset, endOffset)
  }

  getTextRangeByCoords(startRow: number, startCol: number, endRow: number, endCol: number): string {
    const startOff = this.positionToOffset(startRow, startCol)
    const endOff = this.positionToOffset(endRow, endCol)
    return this.getText().substring(startOff, endOff)
  }

  getLineCount(): number {
    return this.lines.length
  }

  // --- Insert / Delete ---

  insertChar(char: string): void {
    this.pushUndo()
    const line = this.lines[this.cursorRow]
    this.lines[this.cursorRow] = line.slice(0, this.cursorCol) + char + line.slice(this.cursorCol)
    this.cursorCol += char.length
    this.emit("content-changed")
    this.emit("cursor-changed")
  }

  insertText(text: string): void {
    this.pushUndo()
    const textLines = text.split("\n")
    const line = this.lines[this.cursorRow]
    const before = line.slice(0, this.cursorCol)
    const after = line.slice(this.cursorCol)

    if (textLines.length === 1) {
      this.lines[this.cursorRow] = before + textLines[0] + after
      this.cursorCol += textLines[0].length
    } else {
      this.lines[this.cursorRow] = before + textLines[0]
      const newLines = textLines.slice(1, -1)
      const lastLine = textLines[textLines.length - 1] + after
      this.lines.splice(this.cursorRow + 1, 0, ...newLines, lastLine)
      this.cursorRow += textLines.length - 1
      this.cursorCol = textLines[textLines.length - 1].length
    }
    this.emit("content-changed")
    this.emit("cursor-changed")
  }

  deleteChar(): void {
    this.pushUndo()
    const line = this.lines[this.cursorRow]
    if (this.cursorCol < line.length) {
      this.lines[this.cursorRow] = line.slice(0, this.cursorCol) + line.slice(this.cursorCol + 1)
      this.emit("content-changed")
    } else if (this.cursorRow < this.lines.length - 1) {
      // Join with next line
      this.lines[this.cursorRow] = line + this.lines[this.cursorRow + 1]
      this.lines.splice(this.cursorRow + 1, 1)
      this.emit("content-changed")
    }
  }

  deleteCharBackward(): void {
    this.pushUndo()
    if (this.cursorCol > 0) {
      const line = this.lines[this.cursorRow]
      this.lines[this.cursorRow] = line.slice(0, this.cursorCol - 1) + line.slice(this.cursorCol)
      this.cursorCol--
      this.emit("content-changed")
      this.emit("cursor-changed")
    } else if (this.cursorRow > 0) {
      // Join with previous line
      const prevLine = this.lines[this.cursorRow - 1]
      this.cursorCol = prevLine.length
      this.lines[this.cursorRow - 1] = prevLine + this.lines[this.cursorRow]
      this.lines.splice(this.cursorRow, 1)
      this.cursorRow--
      this.emit("content-changed")
      this.emit("cursor-changed")
    }
  }

  newLine(): void {
    this.pushUndo()
    const line = this.lines[this.cursorRow]
    const before = line.slice(0, this.cursorCol)
    const after = line.slice(this.cursorCol)
    this.lines[this.cursorRow] = before
    this.lines.splice(this.cursorRow + 1, 0, after)
    this.cursorRow++
    this.cursorCol = 0
    this.emit("content-changed")
    this.emit("cursor-changed")
  }

  deleteLine(): void {
    this.pushUndo()
    if (this.lines.length === 1) {
      this.lines[0] = ""
      this.cursorCol = 0
    } else {
      this.lines.splice(this.cursorRow, 1)
      if (this.cursorRow >= this.lines.length) {
        this.cursorRow = this.lines.length - 1
      }
      this.cursorCol = Math.min(this.cursorCol, this.lines[this.cursorRow].length)
    }
    this.emit("content-changed")
    this.emit("cursor-changed")
  }

  deleteRange(startLine: number, startCol: number, endLine: number, endCol: number): void {
    this.pushUndo()
    const startOff = this.positionToOffset(startLine, startCol)
    const endOff = this.positionToOffset(endLine, endCol)
    const text = this.getText()
    const newText = text.substring(0, startOff) + text.substring(endOff)
    this.lines = newText.split("\n")
    if (this.lines.length === 0) this.lines = [""]
    this.cursorRow = startLine
    this.cursorCol = startCol
    this.clampCursor()
    this.emit("content-changed")
    this.emit("cursor-changed")
  }

  clear(): void {
    this.pushUndo()
    this.lines = [""]
    this.cursorRow = 0
    this.cursorCol = 0
    this.emit("content-changed")
    this.emit("cursor-changed")
  }

  // --- Cursor ---

  setCursor(line: number, col: number): void {
    this.cursorRow = line
    this.cursorCol = col
    this.clampCursor()
    this.emit("cursor-changed")
  }

  setCursorToLineCol(line: number, col: number): void {
    this.setCursor(line, col)
  }

  getCursorPosition(): LogicalCursor {
    return {
      row: this.cursorRow,
      col: this.cursorCol,
      offset: this.positionToOffset(this.cursorRow, this.cursorCol),
    }
  }

  setCursorByOffset(offset: number): void {
    const pos = this.offsetToPosition(offset)
    if (pos) {
      this.cursorRow = pos.row
      this.cursorCol = pos.col
      this.emit("cursor-changed")
    }
  }

  moveCursorLeft(): void {
    if (this.cursorCol > 0) {
      this.cursorCol--
    } else if (this.cursorRow > 0) {
      this.cursorRow--
      this.cursorCol = this.lines[this.cursorRow].length
    }
    this.emit("cursor-changed")
  }

  moveCursorRight(): void {
    const line = this.lines[this.cursorRow]
    if (this.cursorCol < line.length) {
      this.cursorCol++
    } else if (this.cursorRow < this.lines.length - 1) {
      this.cursorRow++
      this.cursorCol = 0
    }
    this.emit("cursor-changed")
  }

  moveCursorUp(): void {
    if (this.cursorRow > 0) {
      this.cursorRow--
      this.cursorCol = Math.min(this.cursorCol, this.lines[this.cursorRow].length)
      this.emit("cursor-changed")
    }
  }

  moveCursorDown(): void {
    if (this.cursorRow < this.lines.length - 1) {
      this.cursorRow++
      this.cursorCol = Math.min(this.cursorCol, this.lines[this.cursorRow].length)
      this.emit("cursor-changed")
    }
  }

  gotoLine(line: number): void {
    this.cursorRow = Math.max(0, Math.min(line, this.lines.length - 1))
    this.cursorCol = Math.min(this.cursorCol, this.lines[this.cursorRow].length)
    this.emit("cursor-changed")
  }

  getEOL(): LogicalCursor {
    const col = this.lines[this.cursorRow].length
    return {
      row: this.cursorRow,
      col,
      offset: this.positionToOffset(this.cursorRow, col),
    }
  }

  getNextWordBoundary(): LogicalCursor {
    const text = this.getText()
    const offset = this.positionToOffset(this.cursorRow, this.cursorCol)
    let i = offset
    // Skip current word chars
    while (i < text.length && /\w/.test(text[i])) i++
    // Skip non-word chars
    while (i < text.length && !/\w/.test(text[i])) i++
    const pos = this.offsetToPosition(i)!
    return { row: pos.row, col: pos.col, offset: i }
  }

  getPrevWordBoundary(): LogicalCursor {
    const text = this.getText()
    let i = this.positionToOffset(this.cursorRow, this.cursorCol)
    if (i > 0) i--
    // Skip non-word chars
    while (i > 0 && !/\w/.test(text[i])) i--
    // Skip word chars
    while (i > 0 && /\w/.test(text[i - 1])) i--
    const pos = this.offsetToPosition(i)!
    return { row: pos.row, col: pos.col, offset: i }
  }

  // --- Offset / Position conversion ---

  positionToOffset(row: number, col: number): number {
    let offset = 0
    for (let r = 0; r < row && r < this.lines.length; r++) {
      offset += this.lines[r].length + 1 // +1 for \n
    }
    offset += Math.min(col, row < this.lines.length ? this.lines[row].length : 0)
    return offset
  }

  offsetToPosition(offset: number): { row: number; col: number } | null {
    let remaining = offset
    for (let r = 0; r < this.lines.length; r++) {
      if (remaining <= this.lines[r].length) {
        return { row: r, col: remaining }
      }
      remaining -= this.lines[r].length + 1
    }
    // Clamp to end
    const lastRow = this.lines.length - 1
    return { row: lastRow, col: this.lines[lastRow].length }
  }

  getLineStartOffset(row: number): number {
    return this.positionToOffset(row, 0)
  }

  // --- Undo / Redo ---

  private pushUndo(): void {
    this.undoStack.push({
      lines: [...this.lines],
      row: this.cursorRow,
      col: this.cursorCol,
    })
    this.redoStack = []
    // Limit undo history
    if (this.undoStack.length > 100) this.undoStack.shift()
  }

  undo(): string | null {
    const state = this.undoStack.pop()
    if (!state) return null
    this.redoStack.push({
      lines: [...this.lines],
      row: this.cursorRow,
      col: this.cursorCol,
    })
    this.lines = state.lines
    this.cursorRow = state.row
    this.cursorCol = state.col
    this.emit("content-changed")
    this.emit("cursor-changed")
    return this.getText()
  }

  redo(): string | null {
    const state = this.redoStack.pop()
    if (!state) return null
    this.undoStack.push({
      lines: [...this.lines],
      row: this.cursorRow,
      col: this.cursorCol,
    })
    this.lines = state.lines
    this.cursorRow = state.row
    this.cursorCol = state.col
    this.emit("content-changed")
    this.emit("cursor-changed")
    return this.getText()
  }

  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  clearHistory(): void {
    this.undoStack = []
    this.redoStack = []
  }

  // --- Styling (no-ops for browser, but store values) ---

  setDefaultFg(fg: any): void {
    this._defaultFg = fg
  }
  setDefaultBg(bg: any): void {
    this._defaultBg = bg
  }
  setDefaultAttributes(attributes: number | null): void {
    this._defaultAttributes = attributes
  }
  resetDefaults(): void {
    this._defaultFg = null
    this._defaultBg = null
    this._defaultAttributes = null
  }
  setSyntaxStyle(style: any): void {
    this._syntaxStyle = style
  }
  getSyntaxStyle(): any {
    return this._syntaxStyle ?? null
  }

  // --- Highlights (store but don't render natively) ---

  addHighlight(lineIdx: number, highlight: any): void {
    if (!this._highlights.has(lineIdx)) this._highlights.set(lineIdx, [])
    this._highlights.get(lineIdx)!.push(highlight)
  }
  addHighlightByCharRange(highlight: any): void {
    // Store globally
    if (!this._highlights.has(-1)) this._highlights.set(-1, [])
    this._highlights.get(-1)!.push(highlight)
  }
  removeHighlightsByRef(hlRef: number): void {
    for (const [key, highlights] of this._highlights) {
      this._highlights.set(
        key,
        highlights.filter((h: any) => h.ref !== hlRef),
      )
    }
  }
  clearLineHighlights(lineIdx: number): void {
    this._highlights.delete(lineIdx)
  }
  clearAllHighlights(): void {
    this._highlights.clear()
  }
  getLineHighlights(lineIdx: number): any[] {
    return this._highlights.get(lineIdx) || []
  }

  // --- Debug ---

  debugLogRope(): void {
    console.log("EditBuffer lines:", this.lines)
  }

  // --- Cleanup ---

  destroy(): void {
    if (this._destroyed) return
    this._destroyed = true
    this.removeAllListeners()
  }

  // --- Internal helpers ---

  private clampCursor(): void {
    this.cursorRow = Math.max(0, Math.min(this.cursorRow, this.lines.length - 1))
    this.cursorCol = Math.max(0, Math.min(this.cursorCol, this.lines[this.cursorRow].length))
  }
}
