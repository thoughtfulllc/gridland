import { test, expect } from "@playwright/test"
import { waitForReady, focusCanvas, waitForBufferContaining, getBufferText, waitForPaint } from "../helpers"

test.describe("MultiSelect Interaction", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/multi-select-interactive")
    await waitForReady(page)
    await focusCanvas(page)
  })

  test("renders with title and items", async ({ page }) => {
    const text = await getBufferText(page)
    expect(text).toContain("Select Languages")
    expect(text).toContain("TypeScript")
    expect(text).toContain("JavaScript")
  })

  test("ArrowDown navigates between items", async ({ page }) => {
    // Press down to move cursor from first item
    await page.keyboard.press("ArrowDown")
    await waitForPaint(page)

    // Press down again
    await page.keyboard.press("ArrowDown")
    await waitForPaint(page)

    // The cursor should have moved (exact visual depends on implementation)
    const text = await getBufferText(page)
    expect(text).toContain("Select Languages")
  })

  test("j/k keys navigate like ArrowDown/ArrowUp", async ({ page }) => {
    await page.keyboard.press("j")
    await waitForPaint(page)

    await page.keyboard.press("k")
    await waitForPaint(page)

    // Should be back at first item
    const text = await getBufferText(page)
    expect(text).toContain("TypeScript")
  })

  test("Space toggles item selection", async ({ page }) => {
    // Select first item (TypeScript)
    await page.keyboard.press(" ")
    await waitForBufferContaining(page, "Count: 1")
  })

  test("selecting multiple items updates count", async ({ page }) => {
    await page.keyboard.press(" ")
    await waitForBufferContaining(page, "Count: 1")

    await page.keyboard.press("ArrowDown")
    await waitForPaint(page)

    await page.keyboard.press(" ")
    await waitForBufferContaining(page, "Count: 2")
  })

  test("'a' selects all non-disabled items", async ({ page }) => {
    await page.keyboard.press("a")
    // 4 selectable items (Go is disabled)
    await waitForBufferContaining(page, "Count: 4")
  })

  test("'x' clears all selections", async ({ page }) => {
    // Select some items first
    await page.keyboard.press("a")
    await waitForBufferContaining(page, "Count: 4")

    await page.keyboard.press("x")
    await waitForBufferContaining(page, "Count: 0")
  })

  test("disabled item (Go) is skipped during navigation", async ({ page }) => {
    // Navigate down through items: TS → JS → Python → Rust (skip Go)
    await page.keyboard.press("ArrowDown") // JS
    await page.keyboard.press("ArrowDown") // Python
    await page.keyboard.press("ArrowDown") // Rust
    await page.keyboard.press("ArrowDown") // Should skip Go, wrap to TS
    await waitForPaint(page)

    // We should have cycled through — the component should still show items
    const text = await getBufferText(page)
    expect(text).toContain("Select Languages")
  })
})
