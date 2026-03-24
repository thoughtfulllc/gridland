// @ts-nocheck
"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { useKeyboard } from "@gridland/utils"
import { StatusBar, useTheme } from "@gridland/ui"

const DEFAULT_COLS = 40
const DEFAULT_ROWS = 10

const CHARS = ["·", "░", "▒", "▓", "█"]

interface Ripple {
  x: number
  y: number
  time: number
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  return (
    "#" +
    clamp(r).toString(16).padStart(2, "0") +
    clamp(g).toString(16).padStart(2, "0") +
    clamp(b).toString(16).padStart(2, "0")
  )
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

interface RippleAppProps {
  mouseOffset?: { x: number; y: number }
  containerWidth?: number
  containerHeight?: number
}

export function RippleApp({ mouseOffset = { x: 0, y: 0 }, containerWidth, containerHeight }: RippleAppProps = {}) {
  const theme = useTheme()
  const [, setTick] = useState(0)

  const COLS = containerWidth ? containerWidth - 2 : DEFAULT_COLS
  // instruction(1) + grid(ROWS) + statusbar(1) = containerHeight - 2 (borders)
  const ROWS = containerHeight ? Math.max(3, containerHeight - 2 - 2) : DEFAULT_ROWS
  const cursorRef = useRef({ x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) })
  const ripplesRef = useRef<Ripple[]>([])
  const frameRef = useRef(0)
  const mousePosRef = useRef<{ x: number; y: number } | null>(null)

  const accentRgb = hexToRgb(theme.accent)
  const dimRgb: [number, number, number] = [40, 40, 50]
  const baseRgb: [number, number, number] = [60, 60, 70]

  const addRipple = useCallback((x: number, y: number) => {
    ripplesRef.current = [
      ...ripplesRef.current,
      { x, y, time: frameRef.current },
    ]
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      frameRef.current++

      // Remove expired ripples (older than 30 frames)
      ripplesRef.current = ripplesRef.current.filter(
        (r) => frameRef.current - r.time < 30
      )

      setTick((t) => t + 1)
    }, 60)

    return () => clearInterval(interval)
  }, [])

  useKeyboard((event) => {
    const cursor = cursorRef.current
    if (event.name === "up") {
      cursorRef.current = { ...cursor, y: Math.max(0, cursor.y - 1) }
    } else if (event.name === "down") {
      cursorRef.current = { ...cursor, y: Math.min(ROWS - 1, cursor.y + 1) }
    } else if (event.name === "left") {
      cursorRef.current = { ...cursor, x: Math.max(0, cursor.x - 1) }
    } else if (event.name === "right") {
      cursorRef.current = { ...cursor, x: Math.min(COLS - 1, cursor.x + 1) }
    } else if (event.name === "return") {
      addRipple(cursorRef.current.x, cursorRef.current.y)
    }
    event.preventDefault()
  })

  const cursor = cursorRef.current
  const frame = frameRef.current
  const ripples = ripplesRef.current

  const grid = Array.from({ length: ROWS }, (_, row) => (
    <text key={row}>
      {Array.from({ length: COLS }, (_, col) => {
        const isCursor = col === cursor.x && row === cursor.y

        // Subtle base animation: gentle shimmer
        const baseWave =
          Math.sin(frame * 0.08 + col * 0.3 + row * 0.5) * 0.5 + 0.5
        let intensity = baseWave * 0.15

        // Calculate ripple contributions
        for (const ripple of ripples) {
          const dx = col - ripple.x
          const dy = row - ripple.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const age = frame - ripple.time
          const radius = age * 0.5
          const fade = 1 - age / 30

          // Ring intensity: bright near the wavefront
          const ringDist = Math.abs(dist - radius)
          if (ringDist < 1.5) {
            const ringIntensity = (1 - ringDist / 1.5) * fade
            intensity = Math.max(intensity, ringIntensity)
          }
          // Inner glow: dimmer fill inside the ring
          else if (dist < radius) {
            const innerIntensity = fade * 0.3 * (1 - dist / radius)
            intensity = Math.max(intensity, innerIntensity)
          }
        }

        intensity = Math.max(0, Math.min(1, intensity))

        // Pick character based on intensity
        const charIndex = Math.min(
          CHARS.length - 1,
          Math.floor(intensity * CHARS.length)
        )
        const char = isCursor ? "◆" : CHARS[charIndex]

        // Color: interpolate between dim gray and accent
        let fg: string
        if (isCursor) {
          fg = theme.primary
        } else {
          const r = lerp(dimRgb[0], accentRgb[0], intensity)
          const g = lerp(dimRgb[1], accentRgb[1], intensity)
          const b = lerp(dimRgb[2], accentRgb[2], intensity)
          fg = rgbToHex(r, g, b)
        }

        return (
          <span key={col} style={{ fg, bold: isCursor || intensity > 0.7 }}>
            {char}
          </span>
        )
      })}
    </text>
  ))

  return (
    <box flexDirection="column" flexGrow={1}>
      <box
        flexDirection="column"
        flexGrow={1}
        paddingX={1}
        onMouseMove={(e: any) => {
          // Map mouse position to grid coordinates
          // Account for border (1) + instruction row (1)
          const gx = e.x - mouseOffset.x - 1
          const gy = e.y - mouseOffset.y - 2
          if (gx >= 0 && gx < COLS && gy >= 0 && gy < ROWS) {
            mousePosRef.current = { x: gx, y: gy }
            cursorRef.current = { x: gx, y: gy }
          }
        }}
        onMouseDown={(e: any) => {
          const gx = e.x - mouseOffset.x - 1
          const gy = e.y - mouseOffset.y - 2
          if (gx >= 0 && gx < COLS && gy >= 0 && gy < ROWS) {
            addRipple(gx, gy)
          }
        }}
      >
        <text style={{ dim: true, fg: theme.muted }}>
          Click or press Enter to create ripples
        </text>
        <box flexDirection="column">{grid}</box>
      </box>
      <box flexGrow={1} />
      <box paddingX={1}>
        <StatusBar
          items={[
            { key: "↑↓←→", label: "move" },
            { key: "enter/click", label: "ripple" },
          ]}
        />
      </box>
    </box>
  )
}
