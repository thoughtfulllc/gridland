import { test, expect } from "@playwright/test"
import { waitForReady, focusCanvas, getCellAt, getBufferText, waitForBufferContaining, waitForPaint } from "../helpers"

test.describe("Theme Switching", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/theme-switch")
    await waitForReady(page)
    await focusCanvas(page)
  })

  test("starts with dark theme", async ({ page }) => {
    const text = await getBufferText(page)
    expect(text).toContain("Theme: dark")
  })

  test("pressing t switches to light theme", async ({ page }) => {
    await page.keyboard.press("t")
    await waitForBufferContaining(page, "Theme: light")
  })

  test("theme colors change when switching", async ({ page }) => {
    // Capture a cell color in dark theme
    const text = await getBufferText(page)
    const lines = text.split("\n")
    const foregroundLine = lines.findIndex((l) => l.includes("Foreground text"))
    expect(foregroundLine).toBeGreaterThanOrEqual(0)

    const col = lines[foregroundLine].indexOf("F")
    const darkCell = await getCellAt(page, col, foregroundLine)

    // Switch to light theme
    await page.keyboard.press("t")
    await waitForBufferContaining(page, "Theme: light")

    const lightText = await getBufferText(page)
    const lightLines = lightText.split("\n")
    const lightFgLine = lightLines.findIndex((l) => l.includes("Foreground text"))
    const lightCol = lightLines[lightFgLine].indexOf("F")
    const lightCell = await getCellAt(page, lightCol, lightFgLine)

    // Foreground color should differ between dark and light themes
    const darkFg = `${darkCell.fg.r},${darkCell.fg.g},${darkCell.fg.b}`
    const lightFg = `${lightCell.fg.r},${lightCell.fg.g},${lightCell.fg.b}`
    expect(darkFg).not.toEqual(lightFg)
  })

  test("can toggle theme back and forth", async ({ page }) => {
    await page.keyboard.press("t")
    await waitForBufferContaining(page, "Theme: light")

    await page.keyboard.press("t")
    await waitForBufferContaining(page, "Theme: dark")
  })
})
