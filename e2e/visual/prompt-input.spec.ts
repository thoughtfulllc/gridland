import { test, expect } from "@playwright/test"
import { waitForReady, getCanvas } from "../helpers"

test.describe("PromptInput Visual", () => {
  test("prompt-input renders correctly", async ({ page }) => {
    await page.goto("/prompt-input")
    await waitForReady(page)

    const canvas = getCanvas(page)
    await expect(canvas).toHaveScreenshot("prompt-input.png")
  })
})
