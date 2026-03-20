import { describe, it, expect } from "bun:test"
import { isBrowser, isCanvasSupported, calculateGridSize } from "./utils"

describe("utils", () => {
  it("isBrowser returns boolean", () => {
    // In bun test environment, this depends on preload (happy-dom)
    expect(typeof isBrowser()).toBe("boolean")
  })

  it("calculateGridSize computes correct dimensions", () => {
    const result = calculateGridSize(800, 600, 8, 16)
    expect(result.cols).toBe(100)
    expect(result.rows).toBe(37)
  })

  it("calculateGridSize returns at least 1x1", () => {
    const result = calculateGridSize(1, 1, 100, 100)
    expect(result.cols).toBe(1)
    expect(result.rows).toBe(1)
  })

  it("calculateGridSize handles exact multiples", () => {
    const result = calculateGridSize(160, 320, 8, 16)
    expect(result.cols).toBe(20)
    expect(result.rows).toBe(20)
  })
})
