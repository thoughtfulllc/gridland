import { describe, it, expect } from "bun:test"
import { findSpatialTarget } from "./spatial-navigation"
import type { FocusEntry } from "./types"

function makeEntry(id: string): FocusEntry {
  return { id, tabIndex: 0, disabled: false, scopeId: null, selectable: true }
}

function makeRef(x: number, y: number, width: number, height: number) {
  return { x, y, width, height }
}

describe("findSpatialTarget – 3x4 grid layout (secret page)", () => {
  // Layout matching the secret page:
  // Row 1 (y=1):  spinner(x=1, w=24, h=8)  table(x=26, w=24, h=8)  text-input(x=51, w=24, h=8)
  // Row 2 (y=10): select-input              multi-select             gradient
  // Row 3 (y=21): message                   chain-of-thought         tabs
  // Row 4 (y=32): prompt-input(x=1, w=24, h=6)

  const entries: FocusEntry[] = [
    makeEntry("spinner"),
    makeEntry("table"),
    makeEntry("text-input"),
    makeEntry("select-input"),
    makeEntry("multi-select"),
    makeEntry("gradient"),
    makeEntry("message"),
    makeEntry("chain-of-thought"),
    makeEntry("tabs"),
    makeEntry("prompt-input"),
  ]

  const refs = new Map<string, any>()
  // Row 1 (y=1, h=8)
  refs.set("spinner",     makeRef(1, 1, 24, 8))
  refs.set("table",       makeRef(26, 1, 24, 8))
  refs.set("text-input",  makeRef(51, 1, 24, 8))
  // Row 2 (y=10, h=10)
  refs.set("select-input",  makeRef(1, 10, 24, 10))
  refs.set("multi-select",  makeRef(26, 10, 24, 10))
  refs.set("gradient",      makeRef(51, 10, 24, 10))
  // Row 3 (y=21, h=10)
  refs.set("message",            makeRef(1, 21, 24, 10))
  refs.set("chain-of-thought",   makeRef(26, 21, 24, 10))
  refs.set("tabs",               makeRef(51, 21, 24, 10))
  // Row 4 (y=32, h=6)
  refs.set("prompt-input",  makeRef(1, 32, 24, 6))

  it("down from spinner → select-input (directly below)", () => {
    expect(findSpatialTarget("down", "spinner", entries, refs)).toBe("select-input")
  })

  it("down from select-input → message (directly below)", () => {
    expect(findSpatialTarget("down", "select-input", entries, refs)).toBe("message")
  })

  it("down from table → multi-select (directly below)", () => {
    expect(findSpatialTarget("down", "table", entries, refs)).toBe("multi-select")
  })

  it("down from multi-select → chain-of-thought (directly below)", () => {
    expect(findSpatialTarget("down", "multi-select", entries, refs)).toBe("chain-of-thought")
  })

  it("up from select-input → spinner (directly above)", () => {
    expect(findSpatialTarget("up", "select-input", entries, refs)).toBe("spinner")
  })

  it("up from message → select-input (directly above)", () => {
    expect(findSpatialTarget("up", "message", entries, refs)).toBe("select-input")
  })

  it("right from spinner → table", () => {
    expect(findSpatialTarget("right", "spinner", entries, refs)).toBe("table")
  })

  it("left from table → spinner", () => {
    expect(findSpatialTarget("left", "table", entries, refs)).toBe("spinner")
  })

  it("down from message → prompt-input", () => {
    expect(findSpatialTarget("down", "message", entries, refs)).toBe("prompt-input")
  })

  it("up from prompt-input → message (closest above)", () => {
    expect(findSpatialTarget("up", "prompt-input", entries, refs)).toBe("message")
  })
})

describe("findSpatialTarget – rows with different heights (gap between edges)", () => {
  // Test case where row heights differ, creating larger gaps
  // This tests if skipping happens when rows have different heights
  const entries: FocusEntry[] = [
    makeEntry("a"),
    makeEntry("b"),
    makeEntry("c"),
  ]

  const refs = new Map<string, any>()
  refs.set("a", makeRef(0, 0, 24, 8))   // row 1, ends at y=8
  refs.set("b", makeRef(0, 9, 24, 10))  // row 2, ends at y=19
  refs.set("c", makeRef(0, 20, 24, 10)) // row 3, ends at y=30

  it("down from a → b (not c)", () => {
    expect(findSpatialTarget("down", "a", entries, refs)).toBe("b")
  })

  it("down from b → c", () => {
    expect(findSpatialTarget("down", "b", entries, refs)).toBe("c")
  })

  it("up from c → b (not a)", () => {
    expect(findSpatialTarget("up", "c", entries, refs)).toBe("b")
  })
})

describe("findSpatialTarget – all positions at (0,0)", () => {
  // This reproduces the yoga bug where all positions are 0
  const entries: FocusEntry[] = [
    makeEntry("a"),
    makeEntry("b"),
    makeEntry("c"),
  ]

  const refs = new Map<string, any>()
  refs.set("a", makeRef(0, 0, 24, 8))
  refs.set("b", makeRef(0, 0, 24, 10))
  refs.set("c", makeRef(0, 0, 24, 10))

  it("down from a → null (no candidates pass direction check)", () => {
    expect(findSpatialTarget("down", "a", entries, refs)).toBe(null)
  })
})
