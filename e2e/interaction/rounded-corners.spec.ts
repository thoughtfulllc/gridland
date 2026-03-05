import { test, expect } from "@playwright/test"
import { waitForReady, getCanvas } from "../helpers"

test.describe("Rounded Corner Alignment", () => {
  test("arc endpoints connect to straight line segments", async ({ page }) => {
    await page.goto("/borders")
    await waitForReady(page)

    const canvas = getCanvas(page)

    const results = await page.evaluate(() => {
      const canvas = document.querySelector("canvas") as HTMLCanvasElement
      const ctx = canvas.getContext("2d")!
      const renderer = window.__polyterm__.renderer as any
      const cellSize = renderer.painter.getCellSize()
      const cellWidth = cellSize.width as number
      const cellHeight = cellSize.height as number

      const buffer = renderer.buffer
      const width = buffer.width
      const height = buffer.height

      // Scan for ╭ (0x256d) to find the top-left corner of the round box
      let tlCol = -1, tlRow = -1
      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const idx = row * width + col
          if (buffer.char[idx] === 0x256d) {
            tlCol = col
            tlRow = row
            break
          }
        }
        if (tlCol >= 0) break
      }

      if (tlCol < 0) return { found: false } as any

      // Find ╮ (0x256e) on same row for top-right
      let trCol = -1
      for (let col = tlCol + 1; col < width; col++) {
        const idx = tlRow * width + col
        if (buffer.char[idx] === 0x256e) {
          trCol = col
          break
        }
      }

      // Find ╰ (0x2570) in same column as tlCol for bottom-left
      let blRow = -1
      for (let row = tlRow + 1; row < height; row++) {
        const idx = row * width + tlCol
        if (buffer.char[idx] === 0x2570) {
          blRow = row
          break
        }
      }

      const brCol = trCol, brRow = blRow

      if (trCol < 0 || blRow < 0) return { found: false, tlCol, tlRow, trCol, blRow } as any

      // Helper: check if a pixel at (px, py) is non-transparent (has been drawn)
      function isDrawn(px: number, py: number): boolean {
        const pixel = ctx.getImageData(Math.round(px), Math.round(py), 1, 1).data
        return pixel[3] > 0
      }

      // For each corner, check the junction point where the arc should meet the straight line.
      // The arc endpoints should land at cell-center positions on both axes.

      // ╭ (tl): arc ends at right edge (vertical center) and bottom edge (horizontal center)
      const tlCellX = tlCol * cellWidth
      const tlCellY = tlRow * cellHeight
      const tlRightJunction = isDrawn(tlCellX + cellWidth, tlCellY + cellHeight / 2)
      const tlBottomJunction = isDrawn(tlCellX + cellWidth / 2, tlCellY + cellHeight)

      // ╮ (tr): arc ends at left edge (vertical center) and bottom edge (horizontal center)
      const trCellX = trCol * cellWidth
      const trCellY = tlRow * cellHeight
      const trLeftJunction = isDrawn(trCellX, trCellY + cellHeight / 2)
      const trBottomJunction = isDrawn(trCellX + cellWidth / 2, trCellY + cellHeight)

      // ╰ (bl): arc ends at right edge (vertical center) and top edge (horizontal center)
      const blCellX = tlCol * cellWidth
      const blCellY = blRow * cellHeight
      const blRightJunction = isDrawn(blCellX + cellWidth, blCellY + cellHeight / 2)
      const blTopJunction = isDrawn(blCellX + cellWidth / 2, blCellY)

      // ╯ (br): arc ends at left edge (vertical center) and top edge (horizontal center)
      const brCellX = brCol * cellWidth
      const brCellY = brRow * cellHeight
      const brLeftJunction = isDrawn(brCellX, brCellY + cellHeight / 2)
      const brTopJunction = isDrawn(brCellX + cellWidth / 2, brCellY)

      return {
        found: true,
        cellWidth,
        cellHeight,
        tl: { right: tlRightJunction, bottom: tlBottomJunction },
        tr: { left: trLeftJunction, bottom: trBottomJunction },
        bl: { right: blRightJunction, top: blTopJunction },
        br: { left: brLeftJunction, top: brTopJunction },
      }
    })

    expect(results.found).toBe(true)

    // Verify cell is actually rectangular (ch > cw) — this is the condition that causes the bug
    expect(results.cellHeight).toBeGreaterThan(results.cellWidth)

    // Each arc endpoint should connect to the straight line segment
    expect(results.tl.right).toBe(true)
    expect(results.tl.bottom).toBe(true)
    expect(results.tr.left).toBe(true)
    expect(results.tr.bottom).toBe(true)
    expect(results.bl.right).toBe(true)
    expect(results.bl.top).toBe(true)
    expect(results.br.left).toBe(true)
    expect(results.br.top).toBe(true)
  })
})
