import { test, expect } from "@playwright/test"
import { waitForReady, getCanvas } from "../helpers"

test.describe("SideNav Visual", () => {
  test("side-nav renders correctly", async ({ page }) => {
    await page.goto("/side-nav")
    await waitForReady(page)

    const canvas = getCanvas(page)
    await expect(canvas).toHaveScreenshot("side-nav.png")
  })
})
