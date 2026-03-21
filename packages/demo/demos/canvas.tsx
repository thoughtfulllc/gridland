// @ts-nocheck
"use client"
import { useState, useRef } from "react"
import { useKeyboard } from "@gridland/utils"
import { StatusBar, useTheme, textStyle } from "@gridland/ui"

const DEFAULT_COLS = 24
const DEFAULT_ROWS = 8

const PALETTE = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"]

function makeEmptyGrid(cols: number, rows: number): number[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(0))
}

function seedGrid(cols: number, rows: number): number[][] {
  const g = makeEmptyGrid(cols, rows)
  // Small heart near center
  const heart = [
    [0, 1, 1, 0, 0, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
  ]
  const ox = Math.floor(cols / 2) - 4
  const oy = 1
  for (let r = 0; r < heart.length; r++) {
    for (let c = 0; c < heart[r].length; c++) {
      if (heart[r][c] && oy + r < rows && ox + c < cols) {
        g[oy + r][ox + c] = 1 // red
      }
    }
  }
  return g
}

interface CanvasAppProps {
  mouseOffset?: { x: number; y: number }
  containerWidth?: number
  containerHeight?: number
}

export function CanvasApp({ mouseOffset = { x: 0, y: 0 }, containerWidth, containerHeight }: CanvasAppProps = {}) {
  const theme = useTheme()
  const COLS = containerWidth ? Math.floor((containerWidth - 2) / 2) : DEFAULT_COLS
  // instruction(1) + grid(ROWS) + spacer(1) + palette(1) + spacer(1) + statusbar(1) = containerHeight - 2 (borders)
  const ROWS = containerHeight ? Math.max(3, containerHeight - 2 - 5) : DEFAULT_ROWS
  const [grid, setGrid] = useState<number[][]>(() => seedGrid(COLS, ROWS))
  const [cursor, setCursor] = useState({ x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) })
  const [selectedColor, setSelectedColor] = useState(0)
  const [drawing, setDrawing] = useState(false)

  const gridRef = useRef(grid)
  const cursorRef = useRef(cursor)
  const selectedColorRef = useRef(selectedColor)
  gridRef.current = grid
  cursorRef.current = cursor
  selectedColorRef.current = selectedColor

  useKeyboard((event) => {
    const cur = cursorRef.current
    const col = selectedColorRef.current

    if (event.name === "up") {
      const ny = Math.max(0, cur.y - 1)
      cursorRef.current = { ...cur, y: ny }
      setCursor({ ...cur, y: ny })
    } else if (event.name === "down") {
      const ny = Math.min(ROWS - 1, cur.y + 1)
      cursorRef.current = { ...cur, y: ny }
      setCursor({ ...cur, y: ny })
    } else if (event.name === "left") {
      const nx = Math.max(0, cur.x - 1)
      cursorRef.current = { x: nx, y: cur.y }
      setCursor({ x: nx, y: cur.y })
    } else if (event.name === "right") {
      const nx = Math.min(COLS - 1, cur.x + 1)
      cursorRef.current = { x: nx, y: cur.y }
      setCursor({ x: nx, y: cur.y })
    } else if (event.name === "return") {
      const g = gridRef.current.map((r) => [...r])
      const current = g[cur.y][cur.x]
      g[cur.y][cur.x] = current === col + 1 ? 0 : col + 1
      gridRef.current = g
      setGrid(g)
    } else if (event.name >= "1" && event.name <= "8") {
      const idx = parseInt(event.name) - 1
      selectedColorRef.current = idx
      setSelectedColor(idx)
    } else if (event.name === "c") {
      const g = makeEmptyGrid(COLS, ROWS)
      gridRef.current = g
      setGrid(g)
    }
    event.preventDefault()
  })

  function paintCell(x: number, y: number) {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return
    const g = grid.map((r) => [...r])
    g[y][x] = selectedColor + 1
    setGrid(g)
  }

  function gridMousePos(e: any): { gx: number; gy: number } | null {
    // Each cell is 2 chars wide; grid has 1 padding left
    const gx = Math.floor((e.x - mouseOffset.x - 1) / 2)
    const gy = e.y - mouseOffset.y - 2 // account for border (1) + instruction row (1)
    if (gx >= 0 && gx < COLS && gy >= 0 && gy < ROWS) {
      return { gx, gy }
    }
    return null
  }

  return (
    <box
      flexDirection="column"
      flexGrow={1}
      onMouseDown={(e: any) => {
        // Check if clicking on palette row (padding + title + subtitle + spacer + grid + spacer = row 13)
        const paletteY = mouseOffset.y + 1 + 1 + ROWS + 1
        if (e.y === paletteY) {
          const px = Math.floor((e.x - mouseOffset.x - 1) / 4)
          if (px >= 0 && px < PALETTE.length) {
            selectedColorRef.current = px
            setSelectedColor(px)
            return
          }
        }
        setDrawing(true)
        const p = gridMousePos(e)
        if (p) {
          paintCell(p.gx, p.gy)
          setCursor({ x: p.gx, y: p.gy })
        }
      }}
      onMouseUp={() => {
        setDrawing(false)
      }}
      onMouseMove={(e: any) => {
        const p = gridMousePos(e)
        if (p) {
          setCursor({ x: p.gx, y: p.gy })
          if (drawing) {
            paintCell(p.gx, p.gy)
          }
        }
      }}
    >
      <box flexDirection="column" paddingX={1}>
        <text style={textStyle({ dim: true, fg: theme.muted })}>Draw with mouse or keyboard</text>
        <box flexDirection="column">
          {grid.map((row, r) => (
            <text key={r}>
              {row.map((cell, c) => {
                const isCursor = cursor.x === c && cursor.y === r
                if (isCursor) {
                  const color = cell > 0 ? PALETTE[cell - 1] : PALETTE[selectedColor]
                  return (
                    <span key={c} style={{ fg: "#1e1e2e", bg: color, bold: true }}>
                      {"▒▒"}
                    </span>
                  )
                }
                if (cell > 0) {
                  return (
                    <span key={c} style={{ fg: PALETTE[cell - 1] }}>
                      {"▓▓"}
                    </span>
                  )
                }
                return (
                  <span key={c} style={{ fg: "#444", dim: true }}>
                    {"··"}
                  </span>
                )
              })}
            </text>
          ))}
        </box>
        <box height={1} />
        <text>
          {PALETTE.map((color, i) => {
            const isSelected = i === selectedColor
            return (
              <span key={i} style={{ fg: color, bold: isSelected }}>
                {isSelected ? "[██]" : " ██ "}
              </span>
            )
          })}
        </text>
      </box>
      <box flexGrow={1} />
      <box paddingX={1}>
        <StatusBar items={[
          { key: "↑↓←→", label: "move" },
          { key: "enter", label: "paint" },
          { key: "1-8", label: "color" },
          { key: "c", label: "clear" },
        ]} />
      </box>
    </box>
  )
}
