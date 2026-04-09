import { test, expect } from "@playwright/test"
import { waitForReady, getCanvas } from "../helpers"

test.describe("Ascii Visual", () => {
  test("ascii text renders correctly", async ({ page }) => {
    await page.goto("/ascii")
    await waitForReady(page)

    const canvas = getCanvas(page)
    await expect(canvas).toHaveScreenshot("ascii.png")
  })
})
