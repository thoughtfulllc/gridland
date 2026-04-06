import { test, expect } from "@playwright/test"
import { waitForReady, focusCanvas, waitForBufferContaining } from "../helpers"

test.describe("Keyboard Event Handling", () => {
  test("canvas receives keyboard focus", async ({ page }) => {
    await page.goto("/text-input-interactive")
    await waitForReady(page)

    const canvas = page.locator("canvas")
    await canvas.click()

    // Verify the canvas is the active element
    const isFocused = await canvas.evaluate((el) => document.activeElement === el)
    expect(isFocused).toBe(true)
  })

  test("typing in text-input updates the buffer", async ({ page }) => {
    await page.goto("/text-input-interactive")
    await waitForReady(page)
    await focusCanvas(page)

    await page.keyboard.type("test123", { delay: 50 })

    const text = await waitForBufferContaining(page, "test123")
    expect(text).toContain("test123")
  })

  test("select-input responds to keyboard navigation", async ({ page }) => {
    await page.goto("/select-input-interactive")
    await waitForReady(page)
    await focusCanvas(page)

    const text = await waitForBufferContaining(page, "Choose a language:")
    expect(text).toContain("Choose a language:")

    // Press Enter to select, should show "Selected:" feedback
    await page.keyboard.press("Enter")

    const afterEnter = await waitForBufferContaining(page, "Selected:")
    expect(afterEnter).toContain("Selected:")
  })
})
