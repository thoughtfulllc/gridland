import type { BrowserBuffer } from "./browser-buffer"
import type { RGBA } from "@gridland/utils"
import type { SelectionManager } from "./selection-manager"

/** Cursor overlay info produced by the render pipeline, consumed by the painter */
export interface CursorOverlay {
  x: number
  y: number
  color: RGBA
  blinking: boolean
}

const TextAttributes = {
  BOLD: 1 << 0,
  DIM: 1 << 1,
  ITALIC: 1 << 2,
  UNDERLINE: 1 << 3,
  UNDERLINE_DASHED: 1 << 4,
  INVERSE: 1 << 5,
  UNDERLINE_DOTTED: 1 << 6,
}

const CONTINUATION = 0xc0000000
const LINE_CURSOR_WIDTH = 8
const CURSOR_BLINK_INTERVAL_MS = 530

// Box-drawing character definitions (U+2500–U+257F)
// Each entry defines which directions extend from cell center and the line weight.
interface BoxDrawDef {
  left?: boolean
  right?: boolean
  up?: boolean
  down?: boolean
  type: "light" | "heavy" | "double"
  arc?: "tl" | "tr" | "bl" | "br" // rounded corner arc direction
}

const BOX_DRAWING_MAP: Record<number, BoxDrawDef> = {
  // Light lines
  0x2500: { left: true, right: true, type: "light" },                    // ─
  0x2502: { up: true, down: true, type: "light" },                       // │
  0x250c: { right: true, down: true, type: "light" },                    // ┌
  0x2510: { left: true, down: true, type: "light" },                     // ┐
  0x2514: { right: true, up: true, type: "light" },                      // └
  0x2518: { left: true, up: true, type: "light" },                       // ┘
  0x251c: { up: true, down: true, right: true, type: "light" },          // ├
  0x2524: { up: true, down: true, left: true, type: "light" },           // ┤
  0x252c: { left: true, right: true, down: true, type: "light" },        // ┬
  0x2534: { left: true, right: true, up: true, type: "light" },          // ┴
  0x253c: { left: true, right: true, up: true, down: true, type: "light" }, // ┼

  // Heavy lines
  0x2501: { left: true, right: true, type: "heavy" },                    // ━
  0x2503: { up: true, down: true, type: "heavy" },                       // ┃
  0x250f: { right: true, down: true, type: "heavy" },                    // ┏
  0x2513: { left: true, down: true, type: "heavy" },                     // ┓
  0x2517: { right: true, up: true, type: "heavy" },                      // ┗
  0x251b: { left: true, up: true, type: "heavy" },                       // ┛
  0x2523: { up: true, down: true, right: true, type: "heavy" },          // ┣
  0x252b: { up: true, down: true, left: true, type: "heavy" },           // ┫
  0x2533: { left: true, right: true, down: true, type: "heavy" },        // ┳
  0x253b: { left: true, right: true, up: true, type: "heavy" },          // ┻
  0x254b: { left: true, right: true, up: true, down: true, type: "heavy" }, // ╋

  // Light/heavy mixed (treat as light for simplicity of joins)
  0x250d: { right: true, down: true, type: "heavy" },                    // ┍
  0x250e: { right: true, down: true, type: "heavy" },                    // ┎
  0x2511: { left: true, down: true, type: "heavy" },                     // ┑
  0x2512: { left: true, down: true, type: "heavy" },                     // ┒
  0x2515: { right: true, up: true, type: "heavy" },                      // ┕
  0x2516: { right: true, up: true, type: "heavy" },                      // ┖
  0x2519: { left: true, up: true, type: "heavy" },                       // ┙
  0x251a: { left: true, up: true, type: "heavy" },                       // ┚
  0x251d: { up: true, down: true, right: true, type: "heavy" },          // ┝
  0x251e: { up: true, down: true, right: true, type: "light" },          // ┞
  0x251f: { up: true, down: true, right: true, type: "light" },          // ┟
  0x2520: { up: true, down: true, right: true, type: "heavy" },          // ┠
  0x2521: { up: true, down: true, right: true, type: "heavy" },          // ┡
  0x2522: { up: true, down: true, right: true, type: "heavy" },          // ┢
  0x2525: { up: true, down: true, left: true, type: "heavy" },           // ┥
  0x2526: { up: true, down: true, left: true, type: "light" },           // ┦
  0x2527: { up: true, down: true, left: true, type: "light" },           // ┧
  0x2528: { up: true, down: true, left: true, type: "heavy" },           // ┨
  0x2529: { up: true, down: true, left: true, type: "heavy" },           // ┩
  0x252a: { up: true, down: true, left: true, type: "heavy" },           // ┪
  0x252d: { left: true, right: true, down: true, type: "heavy" },        // ┭
  0x252e: { left: true, right: true, down: true, type: "heavy" },        // ┮
  0x252f: { left: true, right: true, down: true, type: "heavy" },        // ┯
  0x2530: { left: true, right: true, down: true, type: "heavy" },        // ┰
  0x2531: { left: true, right: true, down: true, type: "heavy" },        // ┱
  0x2532: { left: true, right: true, down: true, type: "heavy" },        // ┲
  0x2535: { left: true, right: true, up: true, type: "heavy" },          // ┵
  0x2536: { left: true, right: true, up: true, type: "heavy" },          // ┶
  0x2537: { left: true, right: true, up: true, type: "heavy" },          // ┷
  0x2538: { left: true, right: true, up: true, type: "heavy" },          // ┸
  0x2539: { left: true, right: true, up: true, type: "heavy" },          // ┹
  0x253a: { left: true, right: true, up: true, type: "heavy" },          // ┺
  0x253d: { left: true, right: true, up: true, down: true, type: "heavy" }, // ┽
  0x253e: { left: true, right: true, up: true, down: true, type: "heavy" }, // ┾
  0x253f: { left: true, right: true, up: true, down: true, type: "heavy" }, // ┿
  0x2540: { left: true, right: true, up: true, down: true, type: "heavy" }, // ╀
  0x2541: { left: true, right: true, up: true, down: true, type: "heavy" }, // ╁
  0x2542: { left: true, right: true, up: true, down: true, type: "heavy" }, // ╂
  0x2543: { left: true, right: true, up: true, down: true, type: "heavy" }, // ╃
  0x2544: { left: true, right: true, up: true, down: true, type: "heavy" }, // ╄
  0x2545: { left: true, right: true, up: true, down: true, type: "heavy" }, // ╅
  0x2546: { left: true, right: true, up: true, down: true, type: "heavy" }, // ╆
  0x2547: { left: true, right: true, up: true, down: true, type: "heavy" }, // ╇
  0x2548: { left: true, right: true, up: true, down: true, type: "heavy" }, // ╈
  0x2549: { left: true, right: true, up: true, down: true, type: "heavy" }, // ╉
  0x254a: { left: true, right: true, up: true, down: true, type: "heavy" }, // ╊

  // Dashed lines (render as solid light/heavy)
  0x2504: { left: true, right: true, type: "light" },                    // ┄
  0x2505: { left: true, right: true, type: "heavy" },                    // ┅
  0x2506: { up: true, down: true, type: "light" },                       // ┆
  0x2507: { up: true, down: true, type: "heavy" },                       // ┇
  0x2508: { left: true, right: true, type: "light" },                    // ┈
  0x2509: { left: true, right: true, type: "heavy" },                    // ┉
  0x250a: { up: true, down: true, type: "light" },                       // ┊
  0x250b: { up: true, down: true, type: "heavy" },                       // ┋

  // Double lines
  0x2550: { left: true, right: true, type: "double" },                   // ═
  0x2551: { up: true, down: true, type: "double" },                      // ║
  0x2552: { right: true, down: true, type: "double" },                   // ╒
  0x2553: { right: true, down: true, type: "double" },                   // ╓
  0x2554: { right: true, down: true, type: "double" },                   // ╔
  0x2555: { left: true, down: true, type: "double" },                    // ╕
  0x2556: { left: true, down: true, type: "double" },                    // ╖
  0x2557: { left: true, down: true, type: "double" },                    // ╗
  0x2558: { right: true, up: true, type: "double" },                     // ╘
  0x2559: { right: true, up: true, type: "double" },                     // ╙
  0x255a: { right: true, up: true, type: "double" },                     // ╚
  0x255b: { left: true, up: true, type: "double" },                      // ╛
  0x255c: { left: true, up: true, type: "double" },                      // ╜
  0x255d: { left: true, up: true, type: "double" },                      // ╝
  0x255e: { up: true, down: true, right: true, type: "double" },         // ╞
  0x255f: { up: true, down: true, right: true, type: "double" },         // ╟
  0x2560: { up: true, down: true, right: true, type: "double" },         // ╠
  0x2561: { up: true, down: true, left: true, type: "double" },          // ╡
  0x2562: { up: true, down: true, left: true, type: "double" },          // ╢
  0x2563: { up: true, down: true, left: true, type: "double" },          // ╣
  0x2564: { left: true, right: true, down: true, type: "double" },       // ╤
  0x2565: { left: true, right: true, down: true, type: "double" },       // ╥
  0x2566: { left: true, right: true, down: true, type: "double" },       // ╦
  0x2567: { left: true, right: true, up: true, type: "double" },         // ╧
  0x2568: { left: true, right: true, up: true, type: "double" },         // ╨
  0x2569: { left: true, right: true, up: true, type: "double" },         // ╩
  0x256a: { left: true, right: true, up: true, down: true, type: "double" }, // ╪
  0x256b: { left: true, right: true, up: true, down: true, type: "double" }, // ╫
  0x256c: { left: true, right: true, up: true, down: true, type: "double" }, // ╬

  // Rounded corners
  0x256d: { right: true, down: true, type: "light", arc: "tl" },         // ╭
  0x256e: { left: true, down: true, type: "light", arc: "tr" },          // ╮
  0x256f: { left: true, up: true, type: "light", arc: "br" },            // ╯
  0x2570: { right: true, up: true, type: "light", arc: "bl" },           // ╰

  // Diagonal lines (render as simple connecting lines)
  0x2571: { type: "light" },                                              // ╱ (forward slash)
  0x2572: { type: "light" },                                              // ╲ (backslash)
  0x2573: { type: "light" },                                              // ╳ (cross)

  // Half lines
  0x2574: { left: true, type: "light" },                                  // ╴
  0x2575: { up: true, type: "light" },                                    // ╵
  0x2576: { right: true, type: "light" },                                 // ╶
  0x2577: { down: true, type: "light" },                                  // ╷
  0x2578: { left: true, type: "heavy" },                                  // ╸
  0x2579: { up: true, type: "heavy" },                                    // ╹
  0x257a: { right: true, type: "heavy" },                                 // ╺
  0x257b: { down: true, type: "heavy" },                                  // ╻
  0x257c: { left: true, right: true, type: "light" },                     // ╼ (light left, heavy right)
  0x257d: { up: true, down: true, type: "light" },                        // ╽ (light up, heavy down)
  0x257e: { left: true, right: true, type: "heavy" },                     // ╾ (heavy left, light right)
  0x257f: { up: true, down: true, type: "heavy" },                        // ╿ (heavy up, light down)
}

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

  paint(ctx: CanvasRenderingContext2D, buffer: BrowserBuffer, selection?: SelectionManager, cursor?: CursorOverlay | null): void {
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

        const effectiveA = isDim ? fgA * 0.5 : fgA

        // Box-drawing character rendering
        if (charCode >= 0x2500 && charCode <= 0x257f) {
          const def = BOX_DRAWING_MAP[charCode]
          if (def) {
            const cellX = col * cw
            const cellY = row * ch
            const cx = cellX + cw / 2
            const cy = cellY + ch / 2
            ctx.strokeStyle = rgbaToCSS(fgR, fgG, fgB, effectiveA)
            ctx.lineCap = "square"

            if (def.type === "double") {
              // Draw two parallel lines for each direction
              const gap = Math.max(2, Math.round(cw / 5))
              ctx.lineWidth = 1
              ctx.beginPath()
              if (def.left) {
                ctx.moveTo(cellX, cy - gap / 2); ctx.lineTo(cx, cy - gap / 2)
                ctx.moveTo(cellX, cy + gap / 2); ctx.lineTo(cx, cy + gap / 2)
              }
              if (def.right) {
                ctx.moveTo(cx, cy - gap / 2); ctx.lineTo(cellX + cw, cy - gap / 2)
                ctx.moveTo(cx, cy + gap / 2); ctx.lineTo(cellX + cw, cy + gap / 2)
              }
              if (def.up) {
                ctx.moveTo(cx - gap / 2, cellY); ctx.lineTo(cx - gap / 2, cy)
                ctx.moveTo(cx + gap / 2, cellY); ctx.lineTo(cx + gap / 2, cy)
              }
              if (def.down) {
                ctx.moveTo(cx - gap / 2, cy); ctx.lineTo(cx - gap / 2, cellY + ch)
                ctx.moveTo(cx + gap / 2, cy); ctx.lineTo(cx + gap / 2, cellY + ch)
              }
              ctx.stroke()
            } else if (def.arc) {
              // Rounded corners: use ellipse to handle rectangular cells (ch ≠ cw)
              const rx = cw / 2
              const ry = ch / 2
              ctx.lineWidth = 1
              ctx.beginPath()
              if (def.arc === "tl") {
                // ╭: arc from right edge to bottom edge
                ctx.ellipse(cellX + cw, cellY + ch, rx, ry, 0, Math.PI, Math.PI * 1.5)
              } else if (def.arc === "tr") {
                // ╮: arc from left edge to bottom edge
                ctx.ellipse(cellX, cellY + ch, rx, ry, 0, Math.PI * 1.5, Math.PI * 2)
              } else if (def.arc === "bl") {
                // ╰: arc from right edge to top edge
                ctx.ellipse(cellX + cw, cellY, rx, ry, 0, Math.PI * 0.5, Math.PI)
              } else if (def.arc === "br") {
                // ╯: arc from left edge to top edge
                ctx.ellipse(cellX, cellY, rx, ry, 0, 0, Math.PI * 0.5)
              }
              ctx.stroke()
            } else if (charCode === 0x2571 || charCode === 0x2572 || charCode === 0x2573) {
              // Diagonal lines
              ctx.lineWidth = 1
              ctx.beginPath()
              if (charCode === 0x2571 || charCode === 0x2573) {
                // ╱ forward slash
                ctx.moveTo(cellX + cw, cellY)
                ctx.lineTo(cellX, cellY + ch)
              }
              if (charCode === 0x2572 || charCode === 0x2573) {
                // ╲ backslash
                ctx.moveTo(cellX, cellY)
                ctx.lineTo(cellX + cw, cellY + ch)
              }
              ctx.stroke()
            } else {
              ctx.lineWidth = def.type === "heavy" ? 2 : 1
              ctx.beginPath()
              if (def.left)  { ctx.moveTo(cellX, cy); ctx.lineTo(cx, cy) }
              if (def.right) { ctx.moveTo(cx, cy); ctx.lineTo(cellX + cw, cy) }
              if (def.up)    { ctx.moveTo(cx, cellY); ctx.lineTo(cx, cy) }
              if (def.down)  { ctx.moveTo(cx, cy); ctx.lineTo(cx, cellY + ch) }
              ctx.stroke()
            }
            continue
          }
        }

        // Normal text rendering
        ctx.fillStyle = rgbaToCSS(fgR, fgG, fgB, effectiveA)

        // Build font string
        let fontStyle = ""
        if (isItalic) fontStyle += "italic "
        if (isBold) fontStyle += "bold "
        fontStyle += `${this.fontSize}px ${this.fontFamily}`
        ctx.font = fontStyle

        const character = String.fromCodePoint(charCode)
        const x = col * cw
        const y = row * this.cellHeight + this.baselineOffset

        ctx.fillText(character, x, y)

        // Draw underline
        if (isUnderline) {
          const isDashed = !!(attr & TextAttributes.UNDERLINE_DASHED)
          const isDotted = !!(attr & TextAttributes.UNDERLINE_DOTTED)
          ctx.strokeStyle = ctx.fillStyle
          ctx.lineWidth = 1
          const underlineY = row * this.cellHeight + this.baselineOffset + 2
          if (isDotted) {
            ctx.lineCap = "round"
            ctx.setLineDash([0.5, 2.5])
          } else if (isDashed) {
            ctx.setLineDash([2, 2])
          }
          ctx.beginPath()
          ctx.moveTo(x, underlineY)
          ctx.lineTo(x + cw, underlineY)
          ctx.stroke()
          if (isDotted || isDashed) {
            ctx.setLineDash([])
            ctx.lineCap = "butt"
          }
        }
      }
    }

    // Pass 3: Line cursor overlay
    if (cursor) {
      const visible = !cursor.blinking || Math.floor(performance.now() / CURSOR_BLINK_INTERVAL_MS) % 2 === 0
      if (visible) {
        ctx.fillStyle = rgbaToCSS(cursor.color.r, cursor.color.g, cursor.color.b, cursor.color.a ?? 1)
        ctx.fillRect(cursor.x * cw, cursor.y * ch, LINE_CURSOR_WIDTH, ch)
      }
    }

    // Pass 4: Selection overlay
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
