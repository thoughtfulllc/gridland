// @ts-nocheck
import { useMemo } from "react"
import { useMatrix } from "./use-matrix"
import { generateGradient, hexToRgb, rgbToHex, useTheme } from "@gridland/ui"

interface ClearRect {
  top: number
  left: number
  width: number
  height: number
}

interface MatrixBackgroundProps {
  width: number
  height: number
  /** Rectangular areas to exclude from matrix rendering */
  clearRects?: ClearRect[]
}

// Brightness levels — subtle tints above the page background
const MUTE_LEVELS = [0.12, 0.18, 0.24, 0.30, 0.38]
const BG = hexToRgb("#1a1a2e")

/** Precompute muted hex colors for a base color at each brightness level */
function buildMutedColors(baseHex: string): string[] {
  const fg = hexToRgb(baseHex)
  return MUTE_LEVELS.map(factor => rgbToHex({
    r: Math.round(BG.r + (fg.r - BG.r) * factor),
    g: Math.round(BG.g + (fg.g - BG.g) * factor),
    b: Math.round(BG.b + (fg.b - BG.b) * factor),
  }))
}

function colorForCell(mutedColors: string[], b: number): string {
  if (b >= 1.0) return mutedColors[4]
  const idx = Math.min(Math.floor(b * (MUTE_LEVELS.length - 1)), MUTE_LEVELS.length - 2)
  return mutedColors[idx]
}

export function MatrixBackground({ width, height, clearRects }: MatrixBackgroundProps) {
  const { grid, brightness } = useMatrix(width, height)
  const theme = useTheme()

  // Generate a gradient across the full width from theme colors
  const columnColors = useMemo(
    () => (width > 0 ? generateGradient([theme.accent, theme.secondary, theme.primary], width) : []),
    [width, theme.accent, theme.secondary, theme.primary],
  )

  // Precompute muted color variants for each column (width × 5 entries)
  const columnMutedColors = useMemo(
    () => columnColors.map(buildMutedColors),
    [columnColors],
  )

  return (
    <box flexDirection="column">
      {grid.map((row, y) => (
        <text key={y}>
          {row.map((cell, x) => {
            const mutedColors = columnMutedColors[x]
            const inClearRect = clearRects?.some(r =>
              y >= r.top && y < r.top + r.height &&
              x >= r.left && x < r.left + r.width
            )
            if (cell === " " || inClearRect || !mutedColors) {
              return <span key={x}>{" "}</span>
            }
            return (
              <span
                key={x}
                style={{
                  fg: colorForCell(mutedColors, brightness[y][x]),
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
