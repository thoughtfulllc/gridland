import { test, expect } from "@playwright/test"
import { waitForReady, focusCanvas, waitForBufferContaining, getBufferText, waitForPaint } from "../helpers"

test.describe("SideNav Interaction", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/side-nav-interactive")
    await waitForReady(page)
    await focusCanvas(page)
  })

  test("renders with title and first item active", async ({ page }) => {
    const text = await getBufferText(page)
    expect(text).toContain("Navigation")
    expect(text).toContain("Home")
    expect(text).toContain("Active: Home")
  })

  test("ArrowDown navigates to next item", async ({ page }) => {
    await page.keyboard.press("ArrowDown")
    await waitForBufferContaining(page, "Active: Settings")
  })

  test("ArrowUp navigates to previous item", async ({ page }) => {
    // Go down first, then back up
    await page.keyboard.press("ArrowDown")
    await waitForBufferContaining(page, "Active: Settings")

    await page.keyboard.press("ArrowUp")
    await waitForBufferContaining(page, "Active: Home")
  })

  test("Enter selects item for interaction", async ({ page }) => {
    await page.keyboard.press("Enter")
    await waitForBufferContaining(page, "Interacting: yes")
  })

  test("Esc returns from interaction mode", async ({ page }) => {
    await page.keyboard.press("Enter")
    await waitForBufferContaining(page, "Interacting: yes")

    await page.keyboard.press("Escape")
    await waitForBufferContaining(page, "Interacting: no")
  })

  test("can navigate through all items", async ({ page }) => {
    await page.keyboard.press("ArrowDown")
    await waitForBufferContaining(page, "Active: Settings")

    await page.keyboard.press("ArrowDown")
    await waitForBufferContaining(page, "Active: Messages")

    await page.keyboard.press("ArrowDown")
    await waitForBufferContaining(page, "Active: Profile")
  })
})
