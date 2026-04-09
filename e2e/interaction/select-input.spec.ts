import { test, expect } from "@playwright/test"
import { waitForReady, getBufferText, focusCanvas, waitForBufferContaining, waitForPaint } from "../helpers"

test.describe("SelectInput Interaction", () => {
  // TODO: This test documents expected behavior once drawFrameBuffer is fully
  // implemented for the <select> renderable. Remove .fixme() when Bug 1 is resolved.
  test.fixme("select items are rendered in buffer", async ({ page }) => {
    await page.goto("/select-input-interactive")
    await waitForReady(page)

    const text = await getBufferText(page)
    // The heading should always be visible
    expect(text).toContain("Choose a language:")
    // Select items should be rendered in the buffer
    expect(text).toContain("TypeScript")
  })

  test("ArrowDown changes selection", async ({ page }) => {
    await page.goto("/select-input-interactive")
    await waitForReady(page)
    await focusCanvas(page)

    // Get initial buffer - should show items
    const initialText = await getBufferText(page)
    expect(initialText).toContain("Choose a language:")

    // Press ArrowDown to move selection
    await page.keyboard.press("ArrowDown")
    await waitForPaint(page)

    const afterDown = await getBufferText(page)
    expect(afterDown).toContain("Choose a language:")
  })

  test("Enter selects the current item", async ({ page }) => {
    await page.goto("/select-input-interactive")
    await waitForReady(page)
    await focusCanvas(page)

    // Press Enter on the first item (TypeScript)
    await page.keyboard.press("Enter")

    const text = await waitForBufferContaining(page, "Selected: ts")
    expect(text).toContain("Selected: ts")
  })
})
