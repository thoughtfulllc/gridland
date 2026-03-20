import { describe, it, expect } from "bun:test"
import { focusReducer, initialFocusState } from "../focus-reducer"
import type { FocusState, FocusEntry } from "../types"

function makeEntry(id: string, opts: Partial<FocusEntry> = {}): FocusEntry {
  return { id, tabIndex: 0, disabled: false, scopeId: null, ...opts }
}

function stateWith(entries: FocusEntry[], focusedId: string | null = null): FocusState {
  return { ...initialFocusState, entries, focusedId }
}

describe("focusReducer", () => {
  // ── Registration ──────────────────────────────────────────────────────

  it("registers elements in insertion order", () => {
    let state = initialFocusState
    state = focusReducer(state, { type: "REGISTER", entry: makeEntry("a") })
    state = focusReducer(state, { type: "REGISTER", entry: makeEntry("b") })
    state = focusReducer(state, { type: "REGISTER", entry: makeEntry("c") })
    expect(state.entries.map((e) => e.id)).toEqual(["a", "b", "c"])
  })

  it("does not register duplicates", () => {
    let state = initialFocusState
    state = focusReducer(state, { type: "REGISTER", entry: makeEntry("a") })
    state = focusReducer(state, { type: "REGISTER", entry: makeEntry("a") })
    expect(state.entries.length).toBe(1)
  })

  it("sorts by tabIndex: positive first, then 0s in insertion order", () => {
    let state = initialFocusState
    state = focusReducer(state, { type: "REGISTER", entry: makeEntry("a", { tabIndex: 0 }) })
    state = focusReducer(state, { type: "REGISTER", entry: makeEntry("b", { tabIndex: 2 }) })
    state = focusReducer(state, { type: "REGISTER", entry: makeEntry("c", { tabIndex: 1 }) })
    state = focusReducer(state, { type: "REGISTER", entry: makeEntry("d", { tabIndex: 0 }) })

    // Navigate to verify order: c(1), b(2), a(0), d(0)
    state = focusReducer(state, { type: "FOCUS_NEXT" })
    expect(state.focusedId).toBe("c") // tabIndex 1 first
    state = focusReducer(state, { type: "FOCUS_NEXT" })
    expect(state.focusedId).toBe("b") // tabIndex 2
    state = focusReducer(state, { type: "FOCUS_NEXT" })
    expect(state.focusedId).toBe("a") // tabIndex 0 (first inserted)
    state = focusReducer(state, { type: "FOCUS_NEXT" })
    expect(state.focusedId).toBe("d") // tabIndex 0 (second inserted)
  })

  // ── Unregister ────────────────────────────────────────────────────────

  it("unregister focused element focuses next", () => {
    let state = stateWith(
      [makeEntry("a"), makeEntry("b"), makeEntry("c")],
      "b",
    )
    state = focusReducer(state, { type: "UNREGISTER", id: "b" })
    expect(state.entries.map((e) => e.id)).toEqual(["a", "c"])
    expect(state.focusedId).toBe("a")
  })

  it("unregister last entry sets focus to null", () => {
    let state = stateWith([makeEntry("a")], "a")
    state = focusReducer(state, { type: "UNREGISTER", id: "a" })
    expect(state.focusedId).toBeNull()
  })

  it("unregister non-focused element keeps focus", () => {
    let state = stateWith(
      [makeEntry("a"), makeEntry("b"), makeEntry("c")],
      "a",
    )
    state = focusReducer(state, { type: "UNREGISTER", id: "c" })
    expect(state.focusedId).toBe("a")
  })

  // ── FOCUS_NEXT / FOCUS_PREV ───────────────────────────────────────────

  it("FOCUS_NEXT cycles through non-disabled elements", () => {
    let state = stateWith(
      [makeEntry("a"), makeEntry("b"), makeEntry("c")],
      "a",
    )
    state = focusReducer(state, { type: "FOCUS_NEXT" })
    expect(state.focusedId).toBe("b")
    state = focusReducer(state, { type: "FOCUS_NEXT" })
    expect(state.focusedId).toBe("c")
  })

  it("FOCUS_PREV cycles through non-disabled elements", () => {
    let state = stateWith(
      [makeEntry("a"), makeEntry("b"), makeEntry("c")],
      "c",
    )
    state = focusReducer(state, { type: "FOCUS_PREV" })
    expect(state.focusedId).toBe("b")
    state = focusReducer(state, { type: "FOCUS_PREV" })
    expect(state.focusedId).toBe("a")
  })

  it("FOCUS_NEXT wraps around", () => {
    let state = stateWith(
      [makeEntry("a"), makeEntry("b"), makeEntry("c")],
      "c",
    )
    state = focusReducer(state, { type: "FOCUS_NEXT" })
    expect(state.focusedId).toBe("a")
  })

  it("FOCUS_PREV wraps around", () => {
    let state = stateWith(
      [makeEntry("a"), makeEntry("b"), makeEntry("c")],
      "a",
    )
    state = focusReducer(state, { type: "FOCUS_PREV" })
    expect(state.focusedId).toBe("c")
  })

  it("FOCUS_NEXT skips tabIndex=-1", () => {
    let state = stateWith(
      [makeEntry("a"), makeEntry("b", { tabIndex: -1 }), makeEntry("c")],
      "a",
    )
    state = focusReducer(state, { type: "FOCUS_NEXT" })
    expect(state.focusedId).toBe("c")
  })

  it("FOCUS_NEXT skips disabled", () => {
    let state = stateWith(
      [makeEntry("a"), makeEntry("b", { disabled: true }), makeEntry("c")],
      "a",
    )
    state = focusReducer(state, { type: "FOCUS_NEXT" })
    expect(state.focusedId).toBe("c")
  })

  it("FOCUS_NEXT from null focuses first", () => {
    let state = stateWith(
      [makeEntry("a"), makeEntry("b")],
      null,
    )
    state = focusReducer(state, { type: "FOCUS_NEXT" })
    expect(state.focusedId).toBe("a")
  })

  it("FOCUS_PREV from null focuses last", () => {
    let state = stateWith(
      [makeEntry("a"), makeEntry("b")],
      null,
    )
    state = focusReducer(state, { type: "FOCUS_PREV" })
    expect(state.focusedId).toBe("b")
  })

  it("FOCUS_NEXT with no navigable returns same state", () => {
    let state = stateWith(
      [makeEntry("a", { disabled: true })],
      null,
    )
    const result = focusReducer(state, { type: "FOCUS_NEXT" })
    expect(result).toBe(state) // same reference
  })

  // ── Scopes ────────────────────────────────────────────────────────────

  it("PUSH_SCOPE saves focus", () => {
    let state = stateWith([makeEntry("a"), makeEntry("b")], "a")
    state = focusReducer(state, {
      type: "PUSH_SCOPE",
      scope: { id: "scope1", trap: true, savedFocusId: null },
    })
    expect(state.scopes.length).toBe(1)
    expect(state.scopes[0].savedFocusId).toBe("a")
  })

  it("POP_SCOPE restores focus", () => {
    let state = stateWith([makeEntry("a"), makeEntry("b")], "a")
    state = focusReducer(state, {
      type: "PUSH_SCOPE",
      scope: { id: "scope1", trap: true, savedFocusId: null },
    })
    state = focusReducer(state, { type: "FOCUS", id: "b" })
    expect(state.focusedId).toBe("b")

    state = focusReducer(state, { type: "POP_SCOPE", scopeId: "scope1" })
    expect(state.scopes.length).toBe(0)
    expect(state.focusedId).toBe("a") // restored
  })

  it("elements in scope filtered for FOCUS_NEXT/PREV when trap is active", () => {
    let state = stateWith([
      makeEntry("outside"),
      makeEntry("inside1", { scopeId: "s1" }),
      makeEntry("inside2", { scopeId: "s1" }),
    ], "outside")

    state = focusReducer(state, {
      type: "PUSH_SCOPE",
      scope: { id: "s1", trap: true, savedFocusId: null },
    })
    state = focusReducer(state, { type: "FOCUS", id: "inside1" })

    // FOCUS_NEXT should only cycle within scope
    state = focusReducer(state, { type: "FOCUS_NEXT" })
    expect(state.focusedId).toBe("inside2")
    state = focusReducer(state, { type: "FOCUS_NEXT" })
    expect(state.focusedId).toBe("inside1") // wraps within scope
  })

  // ── Shortcuts ─────────────────────────────────────────────────────────

  it("SET_SHORTCUTS and CLEAR_SHORTCUTS manage shortcuts", () => {
    let state = stateWith([makeEntry("a")])
    state = focusReducer(state, {
      type: "SET_SHORTCUTS",
      focusId: "a",
      shortcuts: [{ key: "↑↓", label: "Navigate" }],
    })
    expect(state.shortcuts.get("a")).toEqual([{ key: "↑↓", label: "Navigate" }])

    state = focusReducer(state, { type: "CLEAR_SHORTCUTS", focusId: "a" })
    expect(state.shortcuts.has("a")).toBe(false)
  })

  it("UNREGISTER clears shortcuts for that entry", () => {
    let state = stateWith([makeEntry("a")])
    state = focusReducer(state, {
      type: "SET_SHORTCUTS",
      focusId: "a",
      shortcuts: [{ key: "enter", label: "Select" }],
    })
    state = focusReducer(state, { type: "UNREGISTER", id: "a" })
    expect(state.shortcuts.has("a")).toBe(false)
  })
})
