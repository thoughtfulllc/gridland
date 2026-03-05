import { test, expect } from "@playwright/test"
import { waitForReady, getCanvas } from "../helpers"

/**
 * Direction map for standard box-drawing characters.
 * Each entry maps a Unicode codepoint to the directions its line segments should reach.
 */
const BOX_DRAWING_DIRECTIONS: Record<number, string[]> = {
  0x2500: ["left", "right"],                // ─
  0x2502: ["up", "down"],                   // │
  0x250c: ["right", "down"],                // ┌
  0x2510: ["left", "down"],                 // ┐
  0x2514: ["right", "up"],                  // └
  0x2518: ["left", "up"],                   // ┘
  0x251c: ["up", "down", "right"],          // ├
  0x2524: ["up", "down", "left"],           // ┤
  0x252c: ["left", "right", "down"],        // ┬
  0x2534: ["left", "right", "up"],          // ┴
  0x253c: ["left", "right", "up", "down"],  // ┼
}

test.describe("Table Border Connectivity", () => {
  test("box-drawing line segments reach cell edges without gaps", async ({ page }) => {
    await page.goto("/table")
    await waitForReady(page)

    const canvas = getCanvas(page)

    const results = await page.evaluate((directionMap) => {
      const canvas = document.querySelector("canvas") as HTMLCanvasElement
      const ctx = canvas.getContext("2d")!
      const renderer = window.__polyterm__.renderer as any
      const cellSize = renderer.painter.getCellSize()
      const cellWidth = cellSize.width as number
      const cellHeight = cellSize.height as number

      const buffer = renderer.buffer
      const width = buffer.width
      const height = buffer.height

      function isDrawn(px: number, py: number): boolean {
        const pixel = ctx.getImageData(Math.round(px), Math.round(py), 1, 1).data
        return pixel[3] > 0
      }

      const failures: Array<{
        char: string
        codepoint: string
        col: number
        row: number
        direction: string
        px: number
        py: number
      }> = []

      let totalChecks = 0
      let charsFound = 0

      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const idx = row * width + col
          const charCode = buffer.char[idx]
          const directions = directionMap[charCode]
          if (!directions) continue

          charsFound++

          const cellX = col * cellWidth
          const cellY = row * cellHeight
          const cx = cellX + cellWidth / 2
          const cy = cellY + cellHeight / 2

          for (const dir of directions) {
            let px: number, py: number
            switch (dir) {
              case "left":  px = cellX;              py = cy;               break
              case "right": px = cellX + cellWidth;  py = cy;               break
              case "up":    px = cx;                 py = cellY;            break
              case "down":  px = cx;                 py = cellY + cellHeight; break
              default: continue
            }

            totalChecks++
            if (!isDrawn(px, py)) {
              failures.push({
                char: String.fromCodePoint(charCode),
                codepoint: `0x${charCode.toString(16)}`,
                col,
                row,
                direction: dir,
                px: Math.round(px),
                py: Math.round(py),
              })
            }
          }
        }
      }

      return { cellWidth, cellHeight, charsFound, totalChecks, failures }
    }, BOX_DRAWING_DIRECTIONS)

    // Sanity: we should have found box-drawing characters
    expect(results.charsFound).toBeGreaterThan(0)
    expect(results.totalChecks).toBeGreaterThan(0)

    // Every edge pixel should be non-transparent
    if (results.failures.length > 0) {
      const details = results.failures
        .map(f => `  ${f.char} (${f.codepoint}) at [${f.col},${f.row}] ${f.direction} edge pixel (${f.px},${f.py})`)
        .join("\n")
      expect(results.failures).toEqual([])
    }
  })
})
