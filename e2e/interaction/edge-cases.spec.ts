import { test, expect } from "@playwright/test"
import { waitForReady, getBufferText, getCanvas } from "../helpers"

test.describe("Edge Cases", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/edge-cases")
    await waitForReady(page)
  })

  test("empty box renders without crash", async ({ page }) => {
    const canvas = getCanvas(page)
    await expect(canvas).toBeVisible()

    // Page should have rendered successfully
    const text = await getBufferText(page)
    expect(text).toContain("After empty")
  })

  test("long text is truncated by container", async ({ page }) => {
    const text = await getBufferText(page)

    // The text should be present but not the full string (truncated at width 20)
    expect(text).toContain("This is")
    expect(text).not.toContain("container boundary")
  })

  test("deeply nested boxes render correctly", async ({ page }) => {
    const text = await getBufferText(page)
    expect(text).toContain("Deep nesting OK")
  })

  test("no console errors on render", async ({ page }) => {
    const errors: string[] = []
    page.on("pageerror", (err) => errors.push(err.message))

    await page.goto("/edge-cases")
    await waitForReady(page)

    expect(errors).toEqual([])
  })
})
