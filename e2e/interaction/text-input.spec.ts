import { test, expect } from "@playwright/test"
import { waitForReady, getBufferText, focusCanvas, waitForBufferContaining, waitForBufferText, waitForPaint } from "../helpers"

test.describe("TextInput Interaction", () => {
  test("typing text appears in buffer", async ({ page }) => {
    await page.goto("/text-input-interactive")
    await waitForReady(page)
    await focusCanvas(page)

    await page.keyboard.type("hello", { delay: 50 })

    const text = await waitForBufferContaining(page, "hello")
    expect(text).toContain("hello")
  })

  test("Backspace deletes characters", async ({ page }) => {
    await page.goto("/text-input-interactive")
    await waitForReady(page)
    await focusCanvas(page)

    await page.keyboard.type("abc", { delay: 50 })
    await waitForBufferContaining(page, "You typed: abc")

    await page.keyboard.press("Backspace")

    // Wait for the feedback line to reflect deletion
    const text = await waitForBufferText(
      page,
      (t) => t.includes("You typed: ab") && !t.includes("You typed: abc"),
    )
    expect(text).toContain("> ab")
  })

  test("prompt is visible", async ({ page }) => {
    await page.goto("/text-input-interactive")
    await waitForReady(page)

    const text = await getBufferText(page)
    expect(text).toContain("Enter your name:")
    // The prompt "> " should be in the buffer
    expect(text).toContain(">")
  })

  test("typed text shows in feedback line", async ({ page }) => {
    await page.goto("/text-input-interactive")
    await waitForReady(page)
    await focusCanvas(page)

    await page.keyboard.type("world", { delay: 50 })

    const text = await waitForBufferContaining(page, "You typed: world")
    expect(text).toContain("You typed: world")
  })
})
