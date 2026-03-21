// @ts-nocheck
"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { useKeyboard, useTerminalDimensions } from "@gridland/utils"
import { StatusBar, textStyle, useTheme } from "@gridland/ui"

// Layout constants (in terminal rows/cols)
const SCORE_ROW = 0       // row 0: score line
const GRID_TOP = 1        // row 1: border top
const GRID_LEFT = 1       // col 1: border left (1 col margin)
const BORDER = 1          // border is 1 char thick
const CELL_WIDTH = 2      // each game cell = 2 terminal columns
const STATUS_HEIGHT = 1   // status bar at bottom

const HEAD_COLOR = "#22d3ee"
const BODY_COLOR = "#0e7490"
const FOOD_COLOR = "#ef4444"

function randomFood(cols: number, rows: number, snake: { x: number; y: number }[]): { x: number; y: number } {
  const occupied = new Set(snake.map((s) => `${s.x},${s.y}`))
  const empty: { x: number; y: number }[] = []
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!occupied.has(`${x},${y}`)) {
        empty.push({ x, y })
      }
    }
  }
  if (empty.length === 0) return { x: 0, y: 0 }
  return empty[Math.floor(Math.random() * empty.length)]
}

function makeInitialSnake(cols: number, rows: number): { x: number; y: number }[] {
  const cx = Math.floor(cols / 2)
  const cy = Math.floor(rows / 2)
  return [
    { x: cx, y: cy },
    { x: cx - 1, y: cy },
    { x: cx - 2, y: cy },
  ]
}

interface SnakeAppProps {
  containerWidth?: number
  containerHeight?: number
  mouseOffset?: { x: number; y: number }
}

export function SnakeApp({ containerWidth, containerHeight, mouseOffset = { x: 0, y: 0 } }: SnakeAppProps = {}) {
  const theme = useTheme()
  const termDims = useTerminalDimensions()
  const termW = containerWidth ?? termDims.width
  const termH = containerHeight ? containerHeight - 2 : termDims.height // -2 for outer game box borders when embedded
  const [, setTick] = useState(0)

  // Derive game grid size from terminal dimensions
  // Available width: termW - 2 (margin) - 2 (border left+right), divided by cell width
  // Available height: termH - 1 (score) - 2 (border top+bottom) - 1 (status bar)
  const cols = Math.max(4, Math.floor((termW - 2 * GRID_LEFT - 2 * BORDER) / CELL_WIDTH))
  const rows = Math.max(4, termH - GRID_TOP - 2 * BORDER - STATUS_HEIGHT)

  // Content area starts after margin + border
  const contentLeft = GRID_LEFT + BORDER
  const contentTop = GRID_TOP + BORDER

  const colsRef = useRef(cols)
  const rowsRef = useRef(rows)
  colsRef.current = cols
  rowsRef.current = rows

  const snakeRef = useRef(makeInitialSnake(cols, rows))
  const dirRef = useRef({ dx: 1, dy: 0 })
  const foodRef = useRef(randomFood(cols, rows, snakeRef.current))
  const scoreRef = useRef(0)
  const gameOverRef = useRef(false)
  const gameStartedRef = useRef(false)

  const restart = useCallback(() => {
    const c = colsRef.current
    const r = rowsRef.current
    snakeRef.current = makeInitialSnake(c, r)
    dirRef.current = { dx: 1, dy: 0 }
    foodRef.current = randomFood(c, r, snakeRef.current)
    scoreRef.current = 0
    gameOverRef.current = false
    gameStartedRef.current = false
    setTick((t) => t + 1)
  }, [])

  useKeyboard((event) => {
    if (gameOverRef.current) {
      if (event.name === "return") restart()
      event.preventDefault()
      return
    }

    const dir = dirRef.current
    if (event.name === "up" && dir.dy !== 1) {
      dirRef.current = { dx: 0, dy: -1 }
      if (!gameStartedRef.current) gameStartedRef.current = true
    } else if (event.name === "down" && dir.dy !== -1) {
      dirRef.current = { dx: 0, dy: 1 }
      if (!gameStartedRef.current) gameStartedRef.current = true
    } else if (event.name === "left" && dir.dx !== 1) {
      dirRef.current = { dx: -1, dy: 0 }
      if (!gameStartedRef.current) gameStartedRef.current = true
    } else if (event.name === "right" && dir.dx !== -1) {
      dirRef.current = { dx: 1, dy: 0 }
      if (!gameStartedRef.current) gameStartedRef.current = true
    }
    event.preventDefault()
  })

  useEffect(() => {
    const id = setInterval(() => {
      if (!gameStartedRef.current || gameOverRef.current) return

      const c = colsRef.current
      const r = rowsRef.current
      const snake = snakeRef.current
      const dir = dirRef.current
      const head = snake[0]
      const newHead = { x: head.x + dir.dx, y: head.y + dir.dy }

      // Wall collision
      if (newHead.x < 0 || newHead.x >= c || newHead.y < 0 || newHead.y >= r) {
        gameOverRef.current = true
        setTick((t) => t + 1)
        return
      }

      const ate = newHead.x === foodRef.current.x && newHead.y === foodRef.current.y

      // Self collision — exclude the tail if we're not growing
      const checkSegments = ate ? snake : snake.slice(0, -1)
      for (const seg of checkSegments) {
        if (seg.x === newHead.x && seg.y === newHead.y) {
          gameOverRef.current = true
          setTick((t) => t + 1)
          return
        }
      }

      const newSnake = [newHead, ...snake]
      if (!ate) {
        newSnake.pop()
      } else {
        scoreRef.current++
        foodRef.current = randomFood(c, r, newSnake)
      }
      snakeRef.current = newSnake

      setTick((t) => t + 1)
    }, 150)
    return () => clearInterval(id)
  }, [])

  const handleClick = useCallback((e: any) => {
    if (gameOverRef.current) return

    // Map absolute terminal coordinates to game cell
    const cellX = Math.floor((e.x - mouseOffset.x - contentLeft) / CELL_WIDTH)
    const cellY = e.y - mouseOffset.y - contentTop
    if (cellX < 0 || cellX >= colsRef.current || cellY < 0 || cellY >= rowsRef.current) return

    const head = snakeRef.current[0]
    const dx = cellX - head.x
    const dy = cellY - head.y
    const dir = dirRef.current

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0 && dir.dx !== -1) dirRef.current = { dx: 1, dy: 0 }
      else if (dx < 0 && dir.dx !== 1) dirRef.current = { dx: -1, dy: 0 }
    } else {
      if (dy > 0 && dir.dy !== -1) dirRef.current = { dx: 0, dy: 1 }
      else if (dy < 0 && dir.dy !== 1) dirRef.current = { dx: 0, dy: -1 }
    }

    if (!gameStartedRef.current) gameStartedRef.current = true
  }, [contentLeft, contentTop])

  // Reset game when terminal resizes
  useEffect(() => {
    restart()
  }, [cols, rows])

  const snake = snakeRef.current
  const food = foodRef.current
  const score = scoreRef.current
  const gameOver = gameOverRef.current
  const gameStarted = gameStartedRef.current

  const snakeSet = new Map<string, number>()
  snake.forEach((s, i) => snakeSet.set(`${s.x},${s.y}`, i))

  return (
    <box width={termW} height={termH} flexDirection="column" onMouseDown={handleClick}>
      {/* Score row */}
      <box height={1} paddingX={1}>
        <text style={textStyle({ dim: true, fg: theme.muted })}>
          {"Score: "}
          <span style={textStyle({ bold: true, fg: HEAD_COLOR })}>{String(score)}</span>
          {!gameStarted && (
            <span style={textStyle({ dim: true, fg: theme.muted })}>{" — press an arrow key to start"}</span>
          )}
        </text>
      </box>
      {/* Game area with border */}
      <box
        height={rows + 2 * BORDER}
        marginX={GRID_LEFT}
        border
        borderStyle="rounded"
        borderColor={gameOver ? "#ef4444" : theme.muted}
      >
        <box flexDirection="column">
          {Array.from({ length: rows }, (_, row) => (
            <text key={row}>
              {Array.from({ length: cols }, (_, col) => {
                const key = `${col},${row}`
                const snakeIdx = snakeSet.get(key)
                if (snakeIdx !== undefined) {
                  return (
                    <span key={col} style={textStyle({ fg: snakeIdx === 0 ? HEAD_COLOR : BODY_COLOR })}>
                      {"██"}
                    </span>
                  )
                }
                if (food.x === col && food.y === row) {
                  return (
                    <span key={col} style={textStyle({ fg: FOOD_COLOR })}>
                      {"██"}
                    </span>
                  )
                }
                return (
                  <span key={col} style={textStyle({ fg: "#1e1e2e" })}>
                    {"  "}
                  </span>
                )
              })}
            </text>
          ))}
          {gameOver && (
            <box position="absolute" width="100%" height="100%" justifyContent="center" alignItems="center" flexDirection="column">
              <text style={{ bold: true, fg: "#ef4444" }}>{" GAME OVER "}</text>
              <text style={{ dim: true, fg: "#888" }}>{" press enter to restart "}</text>
            </box>
          )}
        </box>
      </box>
      {/* Status bar */}
      <box flexGrow={1} />
      <box height={STATUS_HEIGHT} paddingX={1}>
        <StatusBar items={[
          { key: "↑↓←→", label: "move" },
          { key: "click", label: "steer" },
          { key: "enter", label: "restart" },
        ]} />
      </box>
    </box>
  )
}
