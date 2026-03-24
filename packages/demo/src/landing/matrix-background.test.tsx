// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { MatrixBackground } from "./matrix-background"

afterEach(() => cleanup())

describe("MatrixBackground", () => {
  it("renders without crashing", () => {
    const { screen } = renderTui(
      <MatrixBackground width={20} height={10} />,
      { cols: 20, rows: 10 },
    )
    // Should produce some output (matrix chars or spaces)
    expect(screen.text()).toBeDefined()
  })

  it("fills the given dimensions", () => {
    const { screen } = renderTui(
      <MatrixBackground width={30} height={8} />,
      { cols: 30, rows: 8 },
    )
    const raw = screen.rawText()
    const lines = raw.split("\n")
    expect(lines).toHaveLength(8)
    for (const line of lines) {
      expect(line).toHaveLength(30)
    }
  })

  it("renders matrix characters (non-empty content)", () => {
    const { screen } = renderTui(
      <MatrixBackground width={40} height={20} />,
      { cols: 40, rows: 20 },
    )
    // With seeded matrix, some cells should have characters
    const text = screen.text()
    const nonSpaceChars = text.replace(/[\s\n]/g, "")
    expect(nonSpaceChars.length).toBeGreaterThan(0)
  })

  it("clears the primary clearRect area", () => {
    const clearRect = { top: 2, left: 2, width: 10, height: 4 }
    const { screen } = renderTui(
      <MatrixBackground width={20} height={10} clearRect={clearRect} />,
      { cols: 20, rows: 10 },
    )
    const raw = screen.rawText()
    const lines = raw.split("\n")
    // All cells in the clearRect should be spaces
    for (let y = clearRect.top; y < clearRect.top + clearRect.height; y++) {
      for (let x = clearRect.left; x < clearRect.left + clearRect.width; x++) {
        expect(lines[y][x]).toBe(" ")
      }
    }
  })

  it("clears additional clearRects areas", () => {
    const clearRects = [
      { top: 0, left: 0, width: 5, height: 3 },
      { top: 5, left: 10, width: 8, height: 2 },
    ]
    const { screen } = renderTui(
      <MatrixBackground width={20} height={10} clearRects={clearRects} />,
      { cols: 20, rows: 10 },
    )
    const raw = screen.rawText()
    const lines = raw.split("\n")
    for (const rect of clearRects) {
      for (let y = rect.top; y < rect.top + rect.height; y++) {
        for (let x = rect.left; x < rect.left + rect.width; x++) {
          expect(lines[y][x]).toBe(" ")
        }
      }
    }
  })

  it("supports both clearRect and clearRects together", () => {
    const clearRect = { top: 1, left: 1, width: 5, height: 2 }
    const clearRects = [{ top: 5, left: 5, width: 5, height: 2 }]
    const { screen } = renderTui(
      <MatrixBackground width={15} height={10} clearRect={clearRect} clearRects={clearRects} />,
      { cols: 15, rows: 10 },
    )
    const raw = screen.rawText()
    const lines = raw.split("\n")
    // Check primary clearRect
    for (let y = clearRect.top; y < clearRect.top + clearRect.height; y++) {
      for (let x = clearRect.left; x < clearRect.left + clearRect.width; x++) {
        expect(lines[y][x]).toBe(" ")
      }
    }
    // Check additional clearRect
    for (let y = 5; y < 7; y++) {
      for (let x = 5; x < 10; x++) {
        expect(lines[y][x]).toBe(" ")
      }
    }
  })

  it("handles zero width gracefully", () => {
    const { screen } = renderTui(
      <MatrixBackground width={0} height={10} />,
      { cols: 10, rows: 10 },
    )
    expect(screen.text()).toBeDefined()
  })

  it("handles zero height gracefully", () => {
    const { screen } = renderTui(
      <MatrixBackground width={10} height={0} />,
      { cols: 10, rows: 5 },
    )
    expect(screen.text()).toBeDefined()
  })
})
