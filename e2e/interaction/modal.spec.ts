import { test, expect } from "@playwright/test"
import { waitForReady, focusCanvas, waitForBufferContaining, getBufferText, waitForPaint } from "../helpers"

test.describe("Modal Interaction", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/modal-interactive")
    await waitForReady(page)
    await focusCanvas(page)
  })

  test("modal is initially closed", async ({ page }) => {
    const text = await getBufferText(page)
    expect(text).toContain("Modal: closed")
    expect(text).not.toContain("Modal content here")
  })

  test("pressing 'o' opens the modal", async ({ page }) => {
    await page.keyboard.press("o")
    await waitForBufferContaining(page, "Test Modal")

    const text = await getBufferText(page)
    expect(text).toContain("Modal content here")
  })

  test("Esc closes the modal", async ({ page }) => {
    // Open modal
    await page.keyboard.press("o")
    await waitForBufferContaining(page, "Test Modal")

    // Modal uses FocusScope with trap — may need multiple Esc presses
    // First Esc may exit the scope selection, second triggers onClose
    await page.keyboard.press("Escape")
    await waitForPaint(page)
    await page.keyboard.press("Escape")
    await waitForBufferContaining(page, "Modal: closed")

    const text = await getBufferText(page)
    expect(text).not.toContain("Modal content here")
  })

  test("modal renders with border and title", async ({ page }) => {
    await page.keyboard.press("o")
    await waitForBufferContaining(page, "Test Modal")

    const text = await getBufferText(page)
    expect(text).toContain("Test Modal")
    expect(text).toContain("Modal content here")
  })

  test("can reopen modal after closing", async ({ page }) => {
    // Open
    await page.keyboard.press("o")
    await waitForBufferContaining(page, "Test Modal")

    // Close (may need double Esc for FocusScope)
    await page.keyboard.press("Escape")
    await waitForPaint(page)
    await page.keyboard.press("Escape")
    await waitForBufferContaining(page, "Modal: closed")

    // Reopen
    await page.keyboard.press("o")
    await waitForBufferContaining(page, "Test Modal")
  })
})
