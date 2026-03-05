/**
 * SSR-safe utilities for @polyterm.io/web.
 * These can be imported in any environment (Node.js, browser, edge).
 */

/** Check if running in a browser environment */
export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined"
}

/** Check if canvas is supported */
export function isCanvasSupported(): boolean {
  if (!isBrowser()) return false
  const canvas = document.createElement("canvas")
  return !!canvas.getContext("2d")
}

/** Calculate grid dimensions from pixel dimensions and font size */
export function calculateGridSize(
  widthPx: number,
  heightPx: number,
  cellWidth: number,
  cellHeight: number,
): { cols: number; rows: number } {
  return {
    cols: Math.max(1, Math.floor(widthPx / cellWidth)),
    rows: Math.max(1, Math.floor(heightPx / cellHeight)),
  }
}
