import { test, expect } from "@playwright/test"
import { waitForReady, focusCanvas, waitForBufferContaining, getBufferText, waitForPaint } from "../helpers"

test.describe("Multi-Component Composition", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/composition")
    await waitForReady(page)
    await focusCanvas(page)
  })

  test("renders SideNav with first page active", async ({ page }) => {
    const text = await getBufferText(page)
    expect(text).toContain("Page A")
    expect(text).toContain("Page: Page A")
    expect(text).toContain("Interacting: no")
  })

  test("ArrowDown in nav switches active page", async ({ page }) => {
    await page.keyboard.press("ArrowDown")
    await waitForBufferContaining(page, "Page: Page B")
  })

  test("Enter on nav item enters interaction mode", async ({ page }) => {
    await page.keyboard.press("Enter")
    await waitForBufferContaining(page, "Interacting: yes")

    // TextInput should now appear
    const text = await getBufferText(page)
    expect(text).toContain("Type here...")
  })

  test("full flow: navigate → enter → type → submit → Esc", async ({ page }) => {
    // Navigate to Page B
    await page.keyboard.press("ArrowDown")
    await waitForBufferContaining(page, "Page: Page B")

    // Enter interaction mode
    await page.keyboard.press("Enter")
    await waitForBufferContaining(page, "Interacting: yes")

    // Type in the TextInput
    await page.keyboard.type("hello", { delay: 50 })
    await waitForBufferContaining(page, "hello")

    // Submit
    await page.keyboard.press("Enter")
    await waitForBufferContaining(page, "Sent: hello")

    // Esc back to nav — may need multiple presses to exit nested focus scopes
    await page.keyboard.press("Escape")
    await waitForPaint(page)
    await page.keyboard.press("Escape")
    await waitForPaint(page)
    // If still interacting, one more Esc
    const text = await getBufferText(page)
    if (text.includes("Interacting: yes")) {
      await page.keyboard.press("Escape")
    }
    await waitForBufferContaining(page, "Interacting: no")

    // Can navigate again
    await page.keyboard.press("ArrowUp")
    await waitForBufferContaining(page, "Page: Page A")
  })

  test("Esc from interaction returns to navigation", async ({ page }) => {
    await page.keyboard.press("Enter")
    await waitForBufferContaining(page, "Interacting: yes")

    await page.keyboard.press("Escape")
    await waitForBufferContaining(page, "Interacting: no")

    // Should be able to navigate again
    await page.keyboard.press("ArrowDown")
    await waitForBufferContaining(page, "Page: Page B")
  })
})
