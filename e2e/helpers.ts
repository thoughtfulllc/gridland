import { type Page, expect } from "@playwright/test"

/**
 * Waits for the Gridland canvas to be fully initialized.
 * Polls for the data-gridland-ready attribute on the body element,
 * then waits for the renderer to complete a paint cycle.
 */
export async function waitForReady(page: Page, timeout = 15000): Promise<void> {
  await page.waitForSelector("body[data-gridland-ready='true']", { timeout })
  await waitForPaint(page)
}

/**
 * Waits for the renderer to complete a paint cycle (two RAF ticks).
 * Replaces arbitrary waitForTimeout calls after interactions.
 */
export async function waitForPaint(page: Page): Promise<void> {
  await page.evaluate(() => window.__gridland__.waitForNextPaint())
}

/**
 * Polls getBufferText() until the predicate returns true.
 * Use after interactions to wait for specific content instead of arbitrary timeouts.
 */
export async function waitForBufferText(
  page: Page,
  predicate: (text: string) => boolean,
  timeout = 5000,
): Promise<string> {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const text = await getBufferText(page)
    if (predicate(text)) return text
    await waitForPaint(page)
  }
  // Final attempt — let it fail with a useful message
  const text = await getBufferText(page)
  expect(predicate(text), `waitForBufferText timed out. Buffer:\n${text}`).toBe(true)
  return text
}

/**
 * Convenience: waits until buffer text contains the given substring.
 */
export async function waitForBufferContaining(
  page: Page,
  substring: string,
  timeout = 5000,
): Promise<string> {
  return waitForBufferText(page, (text) => text.includes(substring), timeout)
}

/**
 * Returns the full text content of the Gridland buffer as a string.
 * Each row is separated by a newline. Trailing whitespace per line is trimmed.
 * Trailing empty lines are removed.
 */
export async function getBufferText(page: Page): Promise<string> {
  return page.evaluate(() => window.__gridland__.getBufferText())
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
    ({ col, row }) => window.__gridland__.getCellAt(col, row),
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
