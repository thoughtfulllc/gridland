import { test, expect } from "@playwright/test"
import { waitForReady, getCanvas } from "../helpers"

test.describe("MultiSelect Visual", () => {
  test("multi-select renders correctly", async ({ page }) => {
    await page.goto("/multi-select")
    await waitForReady(page)

    const canvas = getCanvas(page)
    await expect(canvas).toHaveScreenshot("multi-select.png")
  })
})
