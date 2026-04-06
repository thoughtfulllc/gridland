import { test, expect } from "@playwright/test"
import { waitForReady, focusCanvas, waitForBufferContaining, getBufferText, waitForPaint } from "../helpers"

test.describe("Focus Scope Trapping", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/focus-scope")
    await waitForReady(page)
    await focusCanvas(page)
  })

  test("Tab cycles between outer items A and B", async ({ page }) => {
    const text = await getBufferText(page)
    expect(text).toContain("Item A: focused")

    await page.keyboard.press("Tab")
    await waitForBufferContaining(page, "Item B: focused")

    await page.keyboard.press("Tab")
    await waitForBufferContaining(page, "Item A: focused")
  })

  test("Enter on Item A opens inner scope with focus on Inner 1", async ({ page }) => {
    await page.keyboard.press("Enter")
    await waitForBufferContaining(page, "Item A: selected")

    // Inner scope should appear with Inner 1 focused
    await waitForBufferContaining(page, "Inner 1 *")
  })

  test("Tab within inner scope is trapped", async ({ page }) => {
    // Enter Item A's inner scope
    await page.keyboard.press("Enter")
    await waitForBufferContaining(page, "Inner 1 *")

    // Tab should cycle within inner scope only
    await page.keyboard.press("Tab")
    await waitForBufferContaining(page, "Inner 2 *")

    // Tab again should wrap within the trapped scope
    await page.keyboard.press("Tab")
    await waitForBufferContaining(page, "Inner 1 *")
  })

  test("Esc pops inner scope and restores focus to parent item", async ({ page }) => {
    // Enter Item A's inner scope
    await page.keyboard.press("Enter")
    await waitForBufferContaining(page, "Inner 1 *")

    // Esc should pop inner scope
    await page.keyboard.press("Escape")
    await waitForPaint(page)

    // May need second Esc to deselect the outer item
    await page.keyboard.press("Escape")
    await waitForBufferContaining(page, "Item A: focused")

    // Inner items should no longer be visible
    const text = await getBufferText(page)
    expect(text).not.toContain("Inner 1")
  })

  test("can enter Item B scope after exiting Item A scope", async ({ page }) => {
    // Enter and exit Item A's scope
    await page.keyboard.press("Enter")
    await waitForBufferContaining(page, "Inner 1 *")
    await page.keyboard.press("Escape")
    await waitForPaint(page)
    await page.keyboard.press("Escape")
    await waitForBufferContaining(page, "Item A: focused")

    // Navigate to B and enter its scope
    await page.keyboard.press("Tab")
    await waitForBufferContaining(page, "Item B: focused")

    await page.keyboard.press("Enter")
    await waitForBufferContaining(page, "Item B: selected")
  })
})
