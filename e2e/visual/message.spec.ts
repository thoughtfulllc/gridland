import { test, expect } from "@playwright/test"
import { waitForReady, getCanvas } from "../helpers"

test.describe("Message Visual", () => {
  test("message renders correctly", async ({ page }) => {
    await page.goto("/message")
    await waitForReady(page)

    const canvas = getCanvas(page)
    await expect(canvas).toHaveScreenshot("message.png")
  })
})
