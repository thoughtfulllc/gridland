import { test, expect } from "@playwright/test"
import { waitForReady, focusCanvas, waitForBufferContaining, getBufferText, waitForPaint } from "../helpers"

test.describe("Focus Disabled Elements", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/focus-disabled")
    await waitForReady(page)
    await focusCanvas(page)
  })

  test("Tab skips disabled middle item", async ({ page }) => {
    // First should be focused
    const text = await getBufferText(page)
    expect(text).toContain("First *")

    // Tab should skip disabled middle, go straight to Last
    await page.keyboard.press("Tab")
    await waitForBufferContaining(page, "Last *")
  })

  test("Shift+Tab also skips disabled item", async ({ page }) => {
    // First is focused. Shift+Tab should wrap and skip middle → Last
    await page.keyboard.press("Shift+Tab")
    await waitForBufferContaining(page, "Last *")
  })

  test("disabled item shows disabled text", async ({ page }) => {
    const text = await getBufferText(page)
    expect(text).toContain("Middle (disabled)")
  })

  test("toggling disabled state with d key makes middle navigable", async ({ page }) => {
    // Press 'd' to enable middle
    await page.keyboard.press("d")
    await waitForPaint(page)

    // Now Tab should go First → Middle
    await page.keyboard.press("Tab")
    await waitForBufferContaining(page, "Middle *")

    // Verify it's no longer showing (disabled)
    const text = await getBufferText(page)
    expect(text).not.toContain("(disabled)")
  })
})
