import { test, expect } from "@playwright/test"
import { waitForReady, getCanvas } from "../helpers"

test.describe("ChainOfThought Visual", () => {
  test("chain-of-thought renders correctly", async ({ page }) => {
    await page.goto("/chain-of-thought")
    await waitForReady(page)

    const canvas = getCanvas(page)
    await expect(canvas).toHaveScreenshot("chain-of-thought.png")
  })
})
