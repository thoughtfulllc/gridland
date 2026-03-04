import type { BrowserBuffer } from "./browser-buffer"
import type { SelectionManager } from "./selection-manager"

const TextAttributes = {
  BOLD: 1 << 0,
  DIM: 1 << 1,
  ITALIC: 1 << 2,
  UNDERLINE: 1 << 3,
  INVERSE: 1 << 5,
}

const CONTINUATION = 0xc0000000

export interface CanvasPainterOptions {
  fontFamily?: string
  fontSize?: number
}

export class CanvasPainter {
  private cellWidth: number = 0
  private cellHeight: number = 0
  private fontFamily: string
  private fontSize: number
  private baselineOffset: number = 0

  constructor(options: CanvasPainterOptions = {}) {
    this.fontFamily = options.fontFamily ?? "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace"
    this.fontSize = options.fontSize ?? 14
  }

  measureCell(ctx: CanvasRenderingContext2D): { width: number; height: number } {
    ctx.font = `${this.fontSize}px ${this.fontFamily}`
    const metrics = ctx.measureText("M")
    this.cellWidth = metrics.width
    this.cellHeight = Math.ceil(this.fontSize * 1.4)
    this.baselineOffset = Math.ceil(this.fontSize * 1.1)
    return { width: this.cellWidth, height: this.cellHeight }
  }

  getCellSize(): { width: number; height: number } {
    return { width: this.cellWidth, height: this.cellHeight }
  }

  paint(ctx: CanvasRenderingContext2D, buffer: BrowserBuffer, selection?: SelectionManager): void {
    const { char, fg, bg, attributes } = buffer
    const cols = buffer.width
    const rows = buffer.height
    const cw = this.cellWidth
    const ch = this.cellHeight

    // Pass 1: Background rects — batch adjacent same-color cells per row
    for (let row = 0; row < rows; row++) {
      let runStartCol = 0
      let runR = -1,
        runG = -1,
        runB = -1,
        runA = -1

      for (let col = 0; col <= cols; col++) {
        let r = 0,
          g = 0,
          b = 0,
          a = 0
        if (col < cols) {
          const idx = row * cols + col
          const offset = idx * 4
          const attr = attributes[idx] & 0xff
          const isInverse = !!(attr & TextAttributes.INVERSE)
          if (isInverse) {
            // INVERSE: use fg color as background
            r = fg[offset]
            g = fg[offset + 1]
            b = fg[offset + 2]
            a = fg[offset + 3]
          } else {
            r = bg[offset]
            g = bg[offset + 1]
            b = bg[offset + 2]
            a = bg[offset + 3]
          }
        }

        if (col < cols && r === runR && g === runG && b === runB && a === runA) {
          continue
        }

        // Flush previous run
        if (runA > 0 && col > runStartCol) {
          ctx.fillStyle = rgbaToCSS(runR, runG, runB, runA)
          ctx.fillRect(runStartCol * cw, row * ch, (col - runStartCol) * cw, ch)
        }

        runStartCol = col
        runR = r
        runG = g
        runB = b
        runA = a
      }
    }

    // Pass 2: Foreground characters
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col

        // Skip continuation cells (wide char placeholders)
        if (attributes[idx] & CONTINUATION) continue

        const charCode = char[idx]
        if (charCode === 0 || charCode === 0x20) continue // skip spaces

        const offset = idx * 4
        const attr = attributes[idx] & 0xff
        const isInverse = !!(attr & TextAttributes.INVERSE)

        let fgR: number, fgG: number, fgB: number, fgA: number
        if (isInverse) {
          // INVERSE: use bg color as text color
          fgR = bg[offset]
          fgG = bg[offset + 1]
          fgB = bg[offset + 2]
          fgA = bg[offset + 3]
          // If bg is transparent, use black (default terminal bg) as text color
          if (fgA === 0) {
            fgR = 0; fgG = 0; fgB = 0; fgA = 1
          }
        } else {
          fgR = fg[offset]
          fgG = fg[offset + 1]
          fgB = fg[offset + 2]
          fgA = fg[offset + 3]
        }

        if (fgA === 0) continue

        const isBold = !!(attr & TextAttributes.BOLD)
        const isItalic = !!(attr & TextAttributes.ITALIC)
        const isDim = !!(attr & TextAttributes.DIM)
        const isUnderline = !!(attr & TextAttributes.UNDERLINE)

        // Build font string
        let fontStyle = ""
        if (isItalic) fontStyle += "italic "
        if (isBold) fontStyle += "bold "
        fontStyle += `${this.fontSize}px ${this.fontFamily}`
        ctx.font = fontStyle

        const effectiveA = isDim ? fgA * 0.5 : fgA
        ctx.fillStyle = rgbaToCSS(fgR, fgG, fgB, effectiveA)

        const ch = String.fromCodePoint(charCode)
        const x = col * cw
        const y = row * this.cellHeight + this.baselineOffset

        ctx.fillText(ch, x, y)

        // Draw underline
        if (isUnderline) {
          ctx.strokeStyle = ctx.fillStyle
          ctx.lineWidth = 1
          const underlineY = row * this.cellHeight + this.baselineOffset + 2
          ctx.beginPath()
          ctx.moveTo(x, underlineY)
          ctx.lineTo(x + cw, underlineY)
          ctx.stroke()
        }
      }
    }

    // Pass 3: Selection overlay
    if (selection?.active) {
      ctx.fillStyle = "rgba(51, 153, 255, 0.3)"
      for (let row = 0; row < rows; row++) {
        let runStart = -1
        for (let col = 0; col <= cols; col++) {
          const selected = col < cols && selection.isSelected(col, row)
          if (selected && runStart === -1) {
            runStart = col
          } else if (!selected && runStart !== -1) {
            ctx.fillRect(runStart * cw, row * ch, (col - runStart) * cw, ch)
            runStart = -1
          }
        }
      }
    }
  }
}

function rgbaToCSS(r: number, g: number, b: number, a: number): string {
  const ri = Math.round(r * 255)
  const gi = Math.round(g * 255)
  const bi = Math.round(b * 255)
  return `rgba(${ri},${gi},${bi},${a})`
}
