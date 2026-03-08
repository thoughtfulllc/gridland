// @ts-nocheck
import { useMemo } from "react"
import { useMatrix } from "./use-matrix"
import { generateGradient, GRADIENTS } from "../gradient/gradient"

interface ClearRect {
  top: number
  left: number
  width: number
  height: number
}

interface MatrixBackgroundProps {
  width: number
  height: number
  /** Rectangular area to exclude from matrix rendering */
  clearRect?: ClearRect
  /** Additional rectangular areas to exclude */
  clearRects?: ClearRect[]
}

// Mix a hex color with the page background, then lighten slightly
// factor 0 = invisible, 1 = full color
function mute(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  // Page background is #1a1a2e
  const br = 0x1a, bg = 0x1a, bb = 0x2e
  const mr = Math.round(br + (r - br) * factor)
  const mg = Math.round(bg + (g - bg) * factor)
  const mb = Math.round(bb + (b - bb) * factor)
  return `#${mr.toString(16).padStart(2, "0")}${mg.toString(16).padStart(2, "0")}${mb.toString(16).padStart(2, "0")}`
}

// Brightness levels — subtle tints above the page background
const MUTE_LEVELS = [0.12, 0.18, 0.24, 0.30, 0.38]

function colorForCell(baseHex: string, b: number): string {
  if (b >= 1.0) return mute(baseHex, MUTE_LEVELS[4])
  const idx = Math.min(Math.floor(b * (MUTE_LEVELS.length - 1)), MUTE_LEVELS.length - 2)
  return mute(baseHex, MUTE_LEVELS[idx])
}

export function MatrixBackground({ width, height, clearRect, clearRects }: MatrixBackgroundProps) {
  const { grid, brightness } = useMatrix(width, height)

  // Generate a gradient across the full width matching the logo palette
  const columnColors = useMemo(
    () => (width > 0 ? generateGradient(GRADIENTS.instagram, width) : []),
    [width],
  )

  return (
    <box flexDirection="column">
      {grid.map((row, y) => (
        <text key={y}>
          {row.map((cell, x) => {
            const inClearRect = (clearRect &&
              y >= clearRect.top && y < clearRect.top + clearRect.height &&
              x >= clearRect.left && x < clearRect.left + clearRect.width) ||
              (clearRects && clearRects.some(r =>
                y >= r.top && y < r.top + r.height &&
                x >= r.left && x < r.left + r.width
              ))
            const baseColor = columnColors[x]
            if (cell === " " || inClearRect || !baseColor) {
              return <span key={x}>{" "}</span>
            }
            return (
              <span
                key={x}
                style={{
                  fg: colorForCell(baseColor, brightness[y][x]),
                }}
              >
                {cell}
              </span>
            )
          })}
        </text>
      ))}
    </box>
  )
}
