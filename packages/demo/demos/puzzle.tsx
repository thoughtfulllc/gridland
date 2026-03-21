// @ts-nocheck
"use client"
import { useState, useEffect, useRef, useMemo } from "react"
import { useKeyboard } from "@gridland/utils"
import { StatusBar, useTheme, textStyle } from "@gridland/ui"

const COLS = 4
const ROWS = 3
const TILE_COUNT = COLS * ROWS
const DEFAULT_TILE_WIDTH = 8
const DEFAULT_TILE_HEIGHT = 3

const SOLVED = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0]

const tileColors = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
  "#f43f5e", "#6366f1", "#84cc16",
]

function isSolved(board: number[]): boolean {
  for (let i = 0; i < TILE_COUNT; i++) {
    if (board[i] !== SOLVED[i]) return false
  }
  return true
}

function getEmptyIndex(board: number[]): number {
  return board.indexOf(0)
}

function getNeighbor(emptyIdx: number, direction: string): number | null {
  const row = Math.floor(emptyIdx / COLS)
  const col = emptyIdx % COLS
  switch (direction) {
    case "up": return row > 0 ? emptyIdx - COLS : null
    case "down": return row < ROWS - 1 ? emptyIdx + COLS : null
    case "left": return col > 0 ? emptyIdx - 1 : null
    case "right": return col < COLS - 1 ? emptyIdx + 1 : null
    default: return null
  }
}

function swap(board: number[], a: number, b: number): number[] {
  const next = [...board]
  next[a] = board[b]
  next[b] = board[a]
  return next
}

function shuffle(board: number[], count: number): number[] {
  let current = [...board]
  const directions = ["up", "down", "left", "right"]
  let lastDir = ""
  for (let i = 0; i < count; i++) {
    const emptyIdx = getEmptyIndex(current)
    const validMoves = directions.filter((d) => {
      if (d === lastDir) return false
      return getNeighbor(emptyIdx, d) !== null
    })
    const dir = validMoves[Math.floor(Math.random() * validMoves.length)]
    const neighbor = getNeighbor(emptyIdx, dir)!
    current = swap(current, emptyIdx, neighbor)
    const opposites: Record<string, string> = { up: "down", down: "up", left: "right", right: "left" }
    lastDir = opposites[dir]
  }
  return current
}

function isAdjacentToEmpty(board: number[], tileIdx: number): boolean {
  const emptyIdx = getEmptyIndex(board)
  const eRow = Math.floor(emptyIdx / COLS)
  const eCol = emptyIdx % COLS
  const tRow = Math.floor(tileIdx / COLS)
  const tCol = tileIdx % COLS
  return (
    (Math.abs(eRow - tRow) === 1 && eCol === tCol) ||
    (Math.abs(eCol - tCol) === 1 && eRow === tRow)
  )
}

interface PuzzleAppProps {
  containerWidth?: number
  containerHeight?: number
}

export function PuzzleApp({ containerWidth, containerHeight }: PuzzleAppProps = {}) {
  const theme = useTheme()
  const TILE_WIDTH = containerWidth ? Math.floor((containerWidth - 2) / COLS) : DEFAULT_TILE_WIDTH
  // instruction(1) + tiles(ROWS * TILE_HEIGHT) + spacer(1) + moves(1) + statusbar(1) = containerHeight - 2 (borders)
  const TILE_HEIGHT = containerHeight ? Math.max(3, Math.floor((containerHeight - 2 - 4) / ROWS)) : DEFAULT_TILE_HEIGHT
  const [board, setBoard] = useState<number[]>(SOLVED)
  const [moves, setMoves] = useState(0)
  const [solved, setSolved] = useState(false)

  const boardRef = useRef(board)
  const movesRef = useRef(moves)
  boardRef.current = board
  movesRef.current = moves

  const doMove = (direction: string) => {
    const current = boardRef.current
    if (isSolved(current) && movesRef.current > 0) return
    const emptyIdx = getEmptyIndex(current)
    const neighbor = getNeighbor(emptyIdx, direction)
    if (neighbor === null) return
    const next = swap(current, emptyIdx, neighbor)
    boardRef.current = next
    movesRef.current++
    setBoard(next)
    setMoves(movesRef.current)
    setSolved(isSolved(next))
  }

  const doShuffle = () => {
    const shuffled = shuffle(SOLVED, 30)
    boardRef.current = shuffled
    movesRef.current = 0
    setBoard(shuffled)
    setMoves(0)
    setSolved(false)
  }

  useEffect(() => {
    doShuffle()
  }, [])

  useKeyboard((event) => {
    if (event.name === "up") {
      doMove("down")
      event.preventDefault()
    } else if (event.name === "down") {
      doMove("up")
      event.preventDefault()
    } else if (event.name === "left") {
      doMove("right")
      event.preventDefault()
    } else if (event.name === "right") {
      doMove("left")
      event.preventDefault()
    } else if (event.key === "r") {
      doShuffle()
      event.preventDefault()
    }
  })

  const rows = useMemo(() => {
    const result: number[][] = []
    for (let r = 0; r < ROWS; r++) {
      result.push(board.slice(r * COLS, r * COLS + COLS))
    }
    return result
  }, [board])

  return (
    <box flexDirection="column" flexGrow={1} paddingX={1}>
      <text style={textStyle({ dim: true, fg: theme.muted })}>
        Slide tiles to solve the puzzle
      </text>
      <box flexDirection="column">
        {rows.map((row, rowIdx) => (
          <box key={rowIdx} flexDirection="row">
            {row.map((tile, colIdx) => {
              const idx = rowIdx * COLS + colIdx
              if (tile === 0) {
                return (
                  <box key={idx} width={TILE_WIDTH} height={TILE_HEIGHT} />
                )
              }
              const color = tileColors[tile - 1]
              return (
                <box
                  key={idx}
                  width={TILE_WIDTH}
                  height={TILE_HEIGHT}
                  border
                  borderStyle="rounded"
                  borderColor={solved ? theme.success : color}
                  onMouseDown={() => {
                    if (isAdjacentToEmpty(boardRef.current, idx)) {
                      const emptyIdx = getEmptyIndex(boardRef.current)
                      const next = swap(boardRef.current, emptyIdx, idx)
                      boardRef.current = next
                      movesRef.current++
                      setBoard(next)
                      setMoves(movesRef.current)
                      setSolved(isSolved(next))
                    }
                  }}
                >
                  <text style={textStyle({
                    fg: solved ? theme.success : color,
                    bold: true,
                  })}>
                    {String(tile).padStart(2)}
                  </text>
                </box>
              )
            })}
          </box>
        ))}
      </box>
      <box height={1} />
      <box flexDirection="row" gap={2}>
        <text style={textStyle({ dim: true, fg: theme.muted })}>
          Moves: {moves}
        </text>
        {solved && moves > 0 && (
          <text style={textStyle({ fg: theme.success, bold: true })}>
            Solved!
          </text>
        )}
      </box>
      <box flexGrow={1} />
      <box paddingX={1}>
        <StatusBar items={[
          { key: "↑↓←→", label: "slide" },
          { key: "click", label: "slide tile" },
          { key: "r", label: "shuffle" },
        ]} />
      </box>
    </box>
  )
}
