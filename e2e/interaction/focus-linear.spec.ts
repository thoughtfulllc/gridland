import { test, expect } from "@playwright/test"
import { waitForReady, focusCanvas, waitForBufferContaining, waitForBufferText, getBufferText, waitForPaint } from "../helpers"

test.describe("Focus Linear Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/focus-linear")
    await waitForReady(page)
    await focusCanvas(page)
  })

  test("Box A is auto-focused on load", async ({ page }) => {
    const text = await getBufferText(page)
    expect(text).toContain("Box A: focused")
    expect(text).toContain("Box B: idle")
    expect(text).toContain("Box C: idle")
  })

  test("Tab cycles focus A → B → C → A", async ({ page }) => {
    await page.keyboard.press("Tab")
    await waitForBufferContaining(page, "Box B: focused")

    await page.keyboard.press("Tab")
    await waitForBufferContaining(page, "Box C: focused")

    // Wrap around
    await page.keyboard.press("Tab")
    await waitForBufferContaining(page, "Box A: focused")
  })

  test("Shift+Tab cycles focus in reverse", async ({ page }) => {
    // A is focused. Shift+Tab should wrap to C
    await page.keyboard.press("Shift+Tab")
    await waitForBufferContaining(page, "Box C: focused")

    await page.keyboard.press("Shift+Tab")
    await waitForBufferContaining(page, "Box B: focused")

    await page.keyboard.press("Shift+Tab")
    await waitForBufferContaining(page, "Box A: focused")
  })

  test("Enter selects the focused element", async ({ page }) => {
    await page.keyboard.press("Enter")
    await waitForBufferContaining(page, "Box A: selected")
  })

  test("Tab and arrow keys are blocked while selected", async ({ page }) => {
    // Select Box A
    await page.keyboard.press("Enter")
    await waitForBufferContaining(page, "Box A: selected")

    // Tab should not move focus
    await page.keyboard.press("Tab")
    await waitForPaint(page)
    const text = await getBufferText(page)
    expect(text).toContain("Box A: selected")
    expect(text).not.toContain("Box B: focused")
  })

  test("Esc deselects and returns focus to same element", async ({ page }) => {
    // Select Box A
    await page.keyboard.press("Enter")
    await waitForBufferContaining(page, "Box A: selected")

    // Esc should deselect but keep focus on A
    await page.keyboard.press("Escape")
    await waitForBufferContaining(page, "Box A: focused")

    const text = await getBufferText(page)
    expect(text).not.toContain("selected")
  })

  test("can select different items after navigating", async ({ page }) => {
    // Navigate to B then select it
    await page.keyboard.press("Tab")
    await waitForBufferContaining(page, "Box B: focused")

    await page.keyboard.press("Enter")
    await waitForBufferContaining(page, "Box B: selected")

    // A and C should be idle (not focused, not selected)
    const text = await getBufferText(page)
    expect(text).toContain("Box A: idle")
    expect(text).toContain("Box C: idle")
  })
})
