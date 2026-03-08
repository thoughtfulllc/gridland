import { useState, useEffect, useCallback, useRef } from "react"

const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789@#$%^&*(){}[]|;:<>,.?/~`"

interface Drop {
  y: number
  speed: number
  length: number
  chars: string[]
}

export interface MatrixState {
  columns: (Drop | null)[]
  grid: string[][]
  brightness: number[][] // 0-1 brightness per cell
}

function randomChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)]
}

function createDrop(height: number): Drop {
  const length = Math.floor(Math.random() * Math.floor(height * 0.6)) + 4
  return {
    y: -Math.floor(Math.random() * height),
    speed: 1,
    length,
    chars: Array.from({ length }, randomChar),
  }
}

/** Create a drop already positioned somewhere on screen */
function createSeededDrop(height: number): Drop {
  const length = Math.floor(Math.random() * Math.floor(height * 0.6)) + 4
  return {
    y: Math.floor(Math.random() * (height + length)),
    speed: 1,
    length,
    chars: Array.from({ length }, randomChar),
  }
}

/** Build grid/brightness arrays from current columns state */
function buildGrid(columns: (Drop | null)[], width: number, height: number) {
  const grid: string[][] = Array.from({ length: height }, () => Array(width).fill(" "))
  const brightness: number[][] = Array.from({ length: height }, () => Array(width).fill(0))

  for (let x = 0; x < width; x++) {
    const drop = columns[x]
    if (!drop) continue

    for (let i = 0; i < drop.length; i++) {
      const row = Math.floor(drop.y) - i
      if (row < 0 || row >= height) continue

      grid[row][x] = drop.chars[i]
      if (i === 0) {
        brightness[row][x] = 1.0 // head is brightest
      } else {
        brightness[row][x] = Math.max(0.15, 1 - i / drop.length)
      }
    }
  }

  return { grid, brightness }
}

export function useMatrix(width: number, height: number) {
  const columnsRef = useRef<(Drop | null)[]>([])

  const init = useCallback((seeded: boolean) => {
    const createFn = seeded ? createSeededDrop : createDrop
    columnsRef.current = Array.from({ length: width }, () =>
      Math.random() < 0.5 ? createFn(height) : null,
    )
  }, [width, height])

  const [state, setState] = useState<{ grid: string[][]; brightness: number[][] }>(() => {
    // Seed columns so the first frame already has coverage
    const columns: (Drop | null)[] = Array.from({ length: width }, () =>
      Math.random() < 0.5 ? createSeededDrop(height) : null,
    )
    columnsRef.current = columns
    return buildGrid(columns, width, height)
  })

  useEffect(() => {
    if (width < 2 || height < 2) return

    const id = setInterval(() => {
      const columns = columnsRef.current

      // Advance drops
      for (let x = 0; x < width; x++) {
        if (columns[x] === null || columns[x] === undefined) {
          if (Math.random() < 0.03) {
            columns[x] = createDrop(height)
          }
          continue
        }

        const drop = columns[x]!
        drop.y += drop.speed

        // Occasionally mutate a character in the trail
        if (Math.random() < 0.1) {
          const idx = Math.floor(Math.random() * drop.chars.length)
          drop.chars[idx] = randomChar()
        }

        // Remove drop when fully off screen
        if (drop.y - drop.length > height) {
          columns[x] = null
        }
      }

      setState(buildGrid(columns, width, height))
    }, 80)

    return () => clearInterval(id)
  }, [width, height])

  useEffect(() => {
    init(true)
    setState(buildGrid(columnsRef.current, width, height))
  }, [width, height, init])

  return state
}
