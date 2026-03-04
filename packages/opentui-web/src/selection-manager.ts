import type { BrowserBuffer } from "./browser-buffer"

interface SelectionRange {
  startCol: number
  startRow: number
  endCol: number
  endRow: number
}

export class SelectionManager {
  private _startCol: number = 0
  private _startRow: number = 0
  private _endCol: number = 0
  private _endRow: number = 0
  private _active: boolean = false
  private _selecting: boolean = false

  startSelection(col: number, row: number): void {
    this._startCol = col
    this._startRow = row
    this._endCol = col
    this._endRow = row
    this._selecting = true
    this._active = true
  }

  updateSelection(col: number, row: number): void {
    if (!this._selecting) return
    this._endCol = col
    this._endRow = row
  }

  endSelection(): void {
    this._selecting = false
    // If start and end are the same cell, clear the selection
    if (this._startCol === this._endCol && this._startRow === this._endRow) {
      this._active = false
    }
  }

  clearSelection(): void {
    this._active = false
    this._selecting = false
  }

  get active(): boolean {
    return this._active
  }

  get selecting(): boolean {
    return this._selecting
  }

  /** Returns the selection range normalized to reading order (top-left to bottom-right) */
  getSelectedRange(): SelectionRange | null {
    if (!this._active) return null

    let startCol = this._startCol
    let startRow = this._startRow
    let endCol = this._endCol
    let endRow = this._endRow

    // Normalize to reading order
    if (startRow > endRow || (startRow === endRow && startCol > endCol)) {
      const tmpCol = startCol
      const tmpRow = startRow
      startCol = endCol
      startRow = endRow
      endCol = tmpCol
      endRow = tmpRow
    }

    return { startCol, startRow, endCol, endRow }
  }

  isSelected(col: number, row: number): boolean {
    const range = this.getSelectedRange()
    if (!range) return false

    const { startCol, startRow, endCol, endRow } = range

    if (row < startRow || row > endRow) return false
    if (startRow === endRow) {
      return col >= startCol && col < endCol
    }
    if (row === startRow) return col >= startCol
    if (row === endRow) return col < endCol
    return true
  }

  getSelectedText(buffer: BrowserBuffer): string {
    const range = this.getSelectedRange()
    if (!range) return ""

    const { startCol, startRow, endCol, endRow } = range
    const lines: string[] = []

    for (let row = startRow; row <= endRow; row++) {
      let lineStart = row === startRow ? startCol : 0
      let lineEnd = row === endRow ? endCol : buffer.width

      // Build the line text
      let line = ""
      for (let col = lineStart; col < lineEnd && col < buffer.width; col++) {
        const idx = row * buffer.width + col
        const charCode = buffer.char[idx]
        line += charCode === 0 ? " " : String.fromCodePoint(charCode)
      }

      // Trim trailing spaces
      lines.push(line.trimEnd())
    }

    return lines.join("\n")
  }
}
