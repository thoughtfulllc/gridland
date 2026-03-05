import { type Page, expect } from "@playwright/test"

/**
 * Waits for the Polyterm canvas to be fully initialized.
 * Polls for the data-polyterm-ready attribute on the body element.
 */
export async function waitForReady(page: Page, timeout = 15000): Promise<void> {
  await page.waitForSelector("body[data-polyterm-ready='true']", { timeout })
  // Give the renderer one extra frame to paint
  await page.waitForTimeout(200)
}

/**
 * Returns the full text content of the Polyterm buffer as a string.
 * Each row is separated by a newline. Trailing whitespace per line is trimmed.
 * Trailing empty lines are removed.
 */
export async function getBufferText(page: Page): Promise<string> {
  return page.evaluate(() => window.__polyterm__.getBufferText())
}

/**
 * Returns the cell data at a specific column and row in the buffer.
 */
export async function getCellAt(
  page: Page,
  col: number,
  row: number,
): Promise<{
  char: string
  fg: { r: number; g: number; b: number; a: number }
  bg: { r: number; g: number; b: number; a: number }
  attributes: number
}> {
  return page.evaluate(
    ({ col, row }) => window.__polyterm__.getCellAt(col, row),
    { col, row },
  )
}

/**
 * Locates the canvas element on the page.
 */
export function getCanvas(page: Page) {
  return page.locator("canvas")
}

/**
 * Focuses the canvas element so it receives keyboard input.
 */
export async function focusCanvas(page: Page): Promise<void> {
  await page.locator("canvas").click()
}
