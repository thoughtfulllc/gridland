import { useState, useEffect, useLayoutEffect, useRef } from "react"

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

export interface MatrixRipple {
  x: number
  y: number
  createdAt: number
}

function randomChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)]
}

function createDrop(height: number, seeded = false): Drop {
  const length = Math.floor(Math.random() * Math.floor(height * 0.6)) + 4
  return {
    y: seeded
      ? Math.floor(Math.random() * (height + length))
      : -Math.floor(Math.random() * height),
    speed: 1,
    length,
    chars: Array.from({ length }, randomChar),
  }
}

const PULL_RADIUS = 18
const PULL_STRENGTH = 7
const RIPPLE_DURATION_MS = 3200
const RIPPLE_SPEED = 0.008

/** Build grid/brightness arrays from current columns state */
function buildGrid(
  columns: (Drop | null)[],
  width: number,
  height: number,
  mousePos: { x: number; y: number } | null,
  ripples: MatrixRipple[],
  now: number = Date.now(),
) {
  const grid: string[][] = Array.from({ length: height }, () => Array(width).fill(" "))
  const brightness: number[][] = Array.from({ length: height }, () => Array(width).fill(0))

  for (let x = 0; x < width; x++) {
    const drop = columns[x]
    if (!drop) continue

    for (let i = 0; i < drop.length; i++) {
      const row = Math.floor(drop.y) - i
      if (row < 0 || row >= height) continue

      // Displace characters toward mouse cursor
      let renderX = x
      if (mousePos) {
        const dx = mousePos.x - x
        const dy = mousePos.y - row
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < PULL_RADIUS && dist > 0.5) {
          const t = 1 - dist / PULL_RADIUS
          const strength = t * t * PULL_STRENGTH
          renderX = Math.round(x + (dx / dist) * strength)
          renderX = Math.max(0, Math.min(width - 1, renderX))
        }
      }

      const b = i === 0 ? 1.0 : Math.max(0.15, 1 - i / drop.length)
      // Only place if brighter than what's already there
      if (brightness[row][renderX] < b) {
        grid[row][renderX] = drop.chars[i]
        brightness[row][renderX] = b
      }
    }
  }

  // Ripple expanding rings — boost brightness and fill empty cells
  for (const ripple of ripples) {
    const elapsed = now - ripple.createdAt
    if (elapsed > RIPPLE_DURATION_MS || elapsed < 0) continue
    const radius = elapsed * RIPPLE_SPEED
    const fade = 1 - elapsed / RIPPLE_DURATION_MS
    const maxR = Math.ceil(radius) + 2
    const rx = Math.round(ripple.x)
    const ry = Math.round(ripple.y)

    for (let dy = -maxR; dy <= maxR; dy++) {
      for (let dx = -maxR; dx <= maxR; dx++) {
        const cy = ry + dy
        const cx = rx + dx
        if (cy < 0 || cy >= height || cx < 0 || cx >= width) continue
        const dist = Math.sqrt(dx * dx + dy * dy)
        const ringDist = Math.abs(dist - radius)
        if (ringDist < 2) {
          const boost = (1 - ringDist / 2) * fade * 0.7
          brightness[cy][cx] = Math.min(1, brightness[cy][cx] + boost)
          if (grid[cy][cx] === " " && boost > 0.2) {
            grid[cy][cx] = randomChar()
          }
        }
      }
    }
  }

  return { grid, brightness }
}

export function useMatrix(
  width: number,
  height: number,
  mousePosRef?: { current: { x: number; y: number } | null },
  ripplesRef?: { current: MatrixRipple[] },
) {
  const columnsRef = useRef<(Drop | null)[]>([])

  const [state, setState] = useState<{ grid: string[][]; brightness: number[][] }>(() => {
    // Seed columns so the first frame already has coverage
    const columns: (Drop | null)[] = Array.from({ length: width }, () =>
      Math.random() < 0.5 ? createDrop(height, true) : null,
    )
    columnsRef.current = columns
    return buildGrid(columns, width, height, null, [])
  })

  useEffect(() => {
    if (width < 2 || height < 2) return

    const id = setInterval(() => {
      const columns = columnsRef.current
      const now = Date.now()

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

      // Clean expired ripples
      if (ripplesRef?.current) {
        ripplesRef.current = ripplesRef.current.filter(
          r => now - r.createdAt < RIPPLE_DURATION_MS,
        )
      }

      const mousePos = mousePosRef?.current ?? null
      const ripples = ripplesRef?.current ?? []
      setState(buildGrid(columns, width, height, mousePos, ripples, now))
    }, 80)

    return () => clearInterval(id)
  }, [width, height])

  useLayoutEffect(() => {
    // Re-seed columns on resize (synchronous so grid dimensions update immediately)
    columnsRef.current = Array.from({ length: width }, () =>
      Math.random() < 0.5 ? createDrop(height, true) : null,
    )
    setState(buildGrid(columnsRef.current, width, height, null, []))
  }, [width, height])

  return state
}
