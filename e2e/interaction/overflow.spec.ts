import { test, expect } from "@playwright/test"
import { waitForReady, getBufferText, getCanvas } from "../helpers"

test.describe("Overflow Clipping", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/overflow")
    await waitForReady(page)
  })

  test("overflow hidden container renders without crash", async ({ page }) => {
    const canvas = getCanvas(page)
    await expect(canvas).toBeVisible()

    // Page loaded and rendered — verifies overflow="hidden" doesn't crash the renderer
    const text = await getBufferText(page)
    expect(text.trim().length).toBeGreaterThan(0)
  })

  test("not all content lines are visible in limited height container", async ({ page }) => {
    const text = await getBufferText(page)

    // With height=3 and border (2 rows), only 1 row of content fits.
    // The container should clip — not all 4 text lines should appear together
    const allLinesVisible =
      text.includes("Visible line 1") &&
      text.includes("Hidden line 2") &&
      text.includes("Hidden line 3") &&
      text.includes("Hidden line 4")

    expect(allLinesVisible).toBe(false)
  })
})
