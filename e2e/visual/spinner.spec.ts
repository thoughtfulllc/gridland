import { test, expect } from "@playwright/test"
import { waitForReady, getCanvas } from "../helpers"

test.describe("Spinner Visual", () => {
  test("spinner variants render correctly", async ({ page }) => {
    await page.goto("/spinner")
    await waitForReady(page)

    const canvas = getCanvas(page)
    // Spinner animates, so use a higher diff tolerance for animation frames
    await expect(canvas).toHaveScreenshot("spinner.png", {
      maxDiffPixelRatio: 0.05,
    })
  })
})
