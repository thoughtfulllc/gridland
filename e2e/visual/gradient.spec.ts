import { test, expect } from "@playwright/test"
import { waitForReady, getCanvas } from "../helpers"

test.describe("Gradient Visual", () => {
  test("gradient text renders correctly", async ({ page }) => {
    await page.goto("/gradient")
    await waitForReady(page)

    const canvas = getCanvas(page)
    await expect(canvas).toHaveScreenshot("gradient.png")
  })
})
