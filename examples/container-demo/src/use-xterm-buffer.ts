import { useEffect, useRef, useState, useCallback } from "react"
import type { Terminal } from "@xterm/headless"
import { getCellFg, getCellBg, getCellAttributes } from "./xterm-to-gridland"

export interface StyledSpan {
  text: string
  fg?: string
  bg?: string
  attributes: number
}

export interface TerminalRow {
  spans: StyledSpan[]
}

/**
 * Polls the xterm headless terminal buffer and returns rows of styled spans
 * for rendering with gridland <text>/<span> elements.
 */
export function useXtermBuffer(terminal: Terminal | null): TerminalRow[] {
  const [rows, setRows] = useState<TerminalRow[]>([])
  const rafRef = useRef<number>(0)
  const lastSnapshotRef = useRef<string>("")

  const readBuffer = useCallback(() => {
    if (!terminal) return

    const buffer = terminal.buffer.active
    const newRows: TerminalRow[] = []

    for (let y = 0; y < terminal.rows; y++) {
      const line = buffer.getLine(y)
      if (!line) {
        newRows.push({ spans: [{ text: "", attributes: 0 }] })
        continue
      }

      const spans: StyledSpan[] = []
      let currentSpan: StyledSpan | null = null

      for (let x = 0; x < terminal.cols; x++) {
        const cell = line.getCell(x)
        if (!cell) continue

        const char = cell.getChars() || " "
        const fg = getCellFg(cell)
        const bg = getCellBg(cell)
        const attributes = getCellAttributes(cell)

        // Merge into current span if same style
        if (
          currentSpan &&
          currentSpan.fg === fg &&
          currentSpan.bg === bg &&
          currentSpan.attributes === attributes
        ) {
          currentSpan.text += char
        } else {
          currentSpan = { text: char, fg, bg, attributes }
          spans.push(currentSpan)
        }
      }

      newRows.push({ spans: spans.length > 0 ? spans : [{ text: "", attributes: 0 }] })
    }

    // Only update state if buffer content changed (avoid unnecessary re-renders)
    const snapshot = JSON.stringify(newRows)
    if (snapshot !== lastSnapshotRef.current) {
      lastSnapshotRef.current = snapshot
      setRows(newRows)
    }
  }, [terminal])

  useEffect(() => {
    if (!terminal) return

    const poll = () => {
      readBuffer()
      rafRef.current = requestAnimationFrame(poll)
    }
    rafRef.current = requestAnimationFrame(poll)

    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [terminal, readBuffer])

  return rows
}
