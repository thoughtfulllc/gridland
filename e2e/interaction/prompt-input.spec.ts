import { test, expect } from "@playwright/test"
import { waitForReady, focusCanvas, waitForBufferContaining, getBufferText, waitForPaint } from "../helpers"

test.describe("PromptInput Interaction", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/prompt-input-interactive")
    await waitForReady(page)
    await focusCanvas(page)
  })

  test("placeholder is visible when empty", async ({ page }) => {
    const text = await getBufferText(page)
    expect(text).toContain("Type a message...")
  })

  test("typing text appears in buffer", async ({ page }) => {
    await page.keyboard.type("hello world", { delay: 50 })
    await waitForBufferContaining(page, "hello world")
  })

  test("Backspace deletes characters", async ({ page }) => {
    await page.keyboard.type("abc", { delay: 50 })
    await waitForBufferContaining(page, "abc")

    await page.keyboard.press("Backspace")
    await waitForPaint(page)

    const text = await getBufferText(page)
    expect(text).toContain("ab")
    expect(text).not.toContain("abc")
  })

  test("Enter submits the message", async ({ page }) => {
    await page.keyboard.type("test message", { delay: 50 })
    await waitForBufferContaining(page, "test message")

    await page.keyboard.press("Enter")
    await waitForBufferContaining(page, "Submitted: test message")
  })

  test("Enter on empty input does not submit", async ({ page }) => {
    await page.keyboard.press("Enter")
    await waitForPaint(page)

    const text = await getBufferText(page)
    expect(text).not.toContain("Submitted:")
  })
})
