import { test, expect } from "@playwright/test"
import { waitForReady, focusCanvas, waitForBufferContaining, getBufferText, waitForPaint } from "../helpers"

test.describe("Focus Spatial Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/focus-spatial")
    await waitForReady(page)
    await focusCanvas(page)
  })

  test("TL is auto-focused on load", async ({ page }) => {
    const text = await getBufferText(page)
    expect(text).toContain("TL *")
  })

  test("ArrowRight moves focus from TL to TR", async ({ page }) => {
    await page.keyboard.press("ArrowRight")
    await waitForBufferContaining(page, "TR *")

    const text = await getBufferText(page)
    expect(text).not.toContain("TL *")
  })

  test("ArrowDown moves focus from TL to BL", async ({ page }) => {
    await page.keyboard.press("ArrowDown")
    await waitForBufferContaining(page, "BL *")
  })

  test("full spatial navigation around the grid", async ({ page }) => {
    // TL → TR (right)
    await page.keyboard.press("ArrowRight")
    await waitForBufferContaining(page, "TR *")

    // TR → BR (down)
    await page.keyboard.press("ArrowDown")
    await waitForBufferContaining(page, "BR *")

    // BR → BL (left)
    await page.keyboard.press("ArrowLeft")
    await waitForBufferContaining(page, "BL *")

    // BL → TL (up)
    await page.keyboard.press("ArrowUp")
    await waitForBufferContaining(page, "TL *")
  })

  test("arrow key at edge does nothing", async ({ page }) => {
    // TL is focused. ArrowLeft and ArrowUp should do nothing (no element in that direction)
    await page.keyboard.press("ArrowLeft")
    await waitForPaint(page)
    let text = await getBufferText(page)
    expect(text).toContain("TL *")

    await page.keyboard.press("ArrowUp")
    await waitForPaint(page)
    text = await getBufferText(page)
    expect(text).toContain("TL *")
  })

  test("Tab cycles linearly regardless of spatial layout", async ({ page }) => {
    // Tab should cycle through all items in insertion order
    await page.keyboard.press("Tab")
    await waitForBufferContaining(page, "TR *")

    await page.keyboard.press("Tab")
    await waitForBufferContaining(page, "BL *")

    await page.keyboard.press("Tab")
    await waitForBufferContaining(page, "BR *")

    // Wrap back to TL
    await page.keyboard.press("Tab")
    await waitForBufferContaining(page, "TL *")
  })
})
