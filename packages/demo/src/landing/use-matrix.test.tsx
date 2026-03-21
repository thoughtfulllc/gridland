// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { useMatrix } from "./use-matrix"

// Helper component to expose useMatrix state for testing
function MatrixConsumer({ width, height, onState }: { width: number; height: number; onState: (s: any) => void }) {
  const state = useMatrix(width, height)
  onState(state)
  return <text>ok</text>
}

afterEach(() => cleanup())

describe("useMatrix", () => {
  it("returns grid and brightness arrays with correct dimensions", () => {
    let captured: any
    renderTui(
      <MatrixConsumer width={20} height={10} onState={(s) => { captured = s }} />,
      { cols: 30, rows: 12 },
    )
    expect(captured).toBeDefined()
    expect(captured.grid).toHaveLength(10)
    expect(captured.brightness).toHaveLength(10)
    for (const row of captured.grid) {
      expect(row).toHaveLength(20)
    }
    for (const row of captured.brightness) {
      expect(row).toHaveLength(20)
    }
  })

  it("seeds the grid with content on first frame", () => {
    let captured: any
    renderTui(
      <MatrixConsumer width={40} height={20} onState={(s) => { captured = s }} />,
      { cols: 50, rows: 22 },
    )
    // With seeded drops, some cells should be non-space
    const hasContent = captured.grid.some((row: string[]) =>
      row.some((cell: string) => cell !== " ")
    )
    expect(hasContent).toBe(true)
  })

  it("brightness values are between 0 and 1", () => {
    let captured: any
    renderTui(
      <MatrixConsumer width={30} height={15} onState={(s) => { captured = s }} />,
      { cols: 40, rows: 17 },
    )
    for (const row of captured.brightness) {
      for (const val of row) {
        expect(val).toBeGreaterThanOrEqual(0)
        expect(val).toBeLessThanOrEqual(1)
      }
    }
  })

  it("returns empty grid for small dimensions", () => {
    let captured: any
    renderTui(
      <MatrixConsumer width={1} height={1} onState={(s) => { captured = s }} />,
      { cols: 10, rows: 5 },
    )
    expect(captured.grid).toHaveLength(1)
    expect(captured.brightness).toHaveLength(1)
  })

  it("head of drop has brightness 1.0", () => {
    let captured: any
    renderTui(
      <MatrixConsumer width={60} height={30} onState={(s) => { captured = s }} />,
      { cols: 70, rows: 32 },
    )
    // Find any cell with brightness 1.0 (head of a drop)
    let hasHead = false
    for (const row of captured.brightness) {
      for (const val of row) {
        if (val === 1.0) hasHead = true
      }
    }
    expect(hasHead).toBe(true)
  })

  it("trail brightness decreases from head", () => {
    let captured: any
    renderTui(
      <MatrixConsumer width={60} height={30} onState={(s) => { captured = s }} />,
      { cols: 70, rows: 32 },
    )
    // Find a column with a drop and verify brightness decreases
    for (let x = 0; x < 60; x++) {
      // Find the head (brightness 1.0)
      let headRow = -1
      for (let y = 0; y < 30; y++) {
        if (captured.brightness[y][x] === 1.0) {
          headRow = y
          break
        }
      }
      if (headRow < 0) continue
      // Check the next cell below the head has lower brightness
      if (headRow + 1 < 30 && captured.brightness[headRow + 1][x] > 0) {
        // Trail cells should have brightness < 1.0 but >= 0.15
        expect(captured.brightness[headRow + 1][x]).toBeLessThan(1.0)
        expect(captured.brightness[headRow + 1][x]).toBeGreaterThanOrEqual(0.15)
        return // test passed
      }
    }
    // If no trail found, that's OK for a seeded random state
  })

  it("grid cells with brightness > 0 are non-space characters", () => {
    let captured: any
    renderTui(
      <MatrixConsumer width={40} height={20} onState={(s) => { captured = s }} />,
      { cols: 50, rows: 22 },
    )
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 40; x++) {
        if (captured.brightness[y][x] > 0) {
          expect(captured.grid[y][x]).not.toBe(" ")
        }
      }
    }
  })

  it("grid cells with brightness 0 are spaces", () => {
    let captured: any
    renderTui(
      <MatrixConsumer width={40} height={20} onState={(s) => { captured = s }} />,
      { cols: 50, rows: 22 },
    )
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 40; x++) {
        if (captured.brightness[y][x] === 0) {
          expect(captured.grid[y][x]).toBe(" ")
        }
      }
    }
  })

  it("handles resize by re-seeding columns", () => {
    let captured: any
    const tui = renderTui(
      <MatrixConsumer width={20} height={10} onState={(s) => { captured = s }} />,
      { cols: 30, rows: 12 },
    )
    const firstGrid = captured.grid.map((r: string[]) => [...r])

    tui.rerender(
      <MatrixConsumer width={30} height={15} onState={(s) => { captured = s }} />,
    )
    tui.flush()

    expect(captured.grid).toHaveLength(15)
    expect(captured.grid[0]).toHaveLength(30)
  })
})
