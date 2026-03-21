// @ts-nocheck
import { useMemo } from "react"
import { useTheme } from "@gridland/ui"
import { useMatrix } from "./use-matrix"

interface MatrixRainProps {
  width: number
  height: number
}

const GREENS = [
  "#0a3a0a",
  "#0d4f0d",
  "#117711",
  "#22aa22",
  "#33cc33",
  "#44ff44",
  "#ccffcc",
]

function greenForBrightness(b: number): string {
  if (b >= 1.0) return GREENS[6] // head: white-green
  const idx = Math.min(Math.floor(b * (GREENS.length - 1)), GREENS.length - 2)
  return GREENS[idx]
}

export function MatrixRain({ width, height }: MatrixRainProps) {
  const theme = useTheme()
  const { grid, brightness } = useMatrix(width, height)

  return (
    <box
      flexDirection="column"
      border
      borderStyle="rounded"
      borderColor={theme.border}
      flexGrow={1}
    >
      {grid.map((row, y) => (
        <text key={y}>
          {row.map((cell, x) => {
            if (cell === " ") {
              return <span key={x}>{cell}</span>
            }
            return (
              <span
                key={x}
                style={{
                  fg: greenForBrightness(brightness[y][x]),
                  bold: brightness[y][x] >= 1.0,
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
