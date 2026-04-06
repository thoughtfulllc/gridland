// @ts-nocheck — Gridland intrinsic elements conflict with React's HTML/SVG types
import { type ReactNode, useCallback } from "react"
import { TUI } from "../../../packages/web/src/TUI"
import type { BrowserRenderer } from "../../../packages/web/src/browser-renderer"

declare global {
  interface Window {
    __gridland__: {
      renderer: BrowserRenderer
      getBufferText: () => string
      getCellAt: (col: number, row: number) => {
        char: string
        fg: { r: number; g: number; b: number; a: number }
        bg: { r: number; g: number; b: number; a: number }
        attributes: number
      }
      waitForNextPaint: () => Promise<void>
    }
  }
}

interface FixtureWrapperProps {
  cols: number
  rows: number
  children: ReactNode
  fontSize?: number
}

export function FixtureWrapper({ cols, rows, children, fontSize = 14 }: FixtureWrapperProps) {
  const handleReady = useCallback((renderer: BrowserRenderer) => {
    const buffer = renderer.buffer

    window.__gridland__ = {
      renderer,
      waitForNextPaint() {
        return new Promise<void>((resolve) => {
          // Wait for the renderer's next RAF loop to complete a paint cycle
          requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve())
          })
        })
      },
      getBufferText() {
        const lines: string[] = []
        for (let row = 0; row < buffer.height; row++) {
          let line = ""
          for (let col = 0; col < buffer.width; col++) {
            const idx = row * buffer.width + col
            const cp = buffer.char[idx]
            line += cp ? String.fromCodePoint(cp) : " "
          }
          lines.push(line.trimEnd())
        }
        // Remove trailing empty lines
        while (lines.length > 0 && lines[lines.length - 1] === "") {
          lines.pop()
        }
        return lines.join("\n")
      },
      getCellAt(col: number, row: number) {
        const idx = row * buffer.width + col
        const cp = buffer.char[idx]
        const fgBase = idx * 4
        const bgBase = idx * 4
        return {
          char: cp ? String.fromCodePoint(cp) : " ",
          fg: {
            r: buffer.fg[fgBase],
            g: buffer.fg[fgBase + 1],
            b: buffer.fg[fgBase + 2],
            a: buffer.fg[fgBase + 3],
          },
          bg: {
            r: buffer.bg[bgBase],
            g: buffer.bg[bgBase + 1],
            b: buffer.bg[bgBase + 2],
            a: buffer.bg[bgBase + 3],
          },
          attributes: buffer.attributes[idx],
        }
      },
    }

    document.body.setAttribute("data-gridland-ready", "true")
  }, [])

  // Calculate pixel dimensions from cell count
  // Cell height must match CanvasPainter.measureCell: Math.ceil(fontSize * 1.4)
  const fontFamily = "'JetBrains Mono', monospace"
  const cellHeight = Math.ceil(fontSize * 1.4)
  const widthPx = cols * 8.4
  const heightPx = rows * cellHeight

  return (
    <div style={{ padding: 0, background: "#1e1e2e" }}>
      <TUI
        style={{ width: `${widthPx}px`, height: `${heightPx}px` }}
        fontSize={fontSize}
        fontFamily={fontFamily}
        onReady={handleReady}
      >
        {children}
      </TUI>
    </div>
  )
}
