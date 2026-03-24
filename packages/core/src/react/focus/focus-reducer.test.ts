import { describe, it, expect } from "bun:test"
import { focusReducer, initialFocusState } from "./focus-reducer"
import type { FocusState, FocusEntry } from "./types"

function makeEntry(id: string, opts: Partial<FocusEntry> = {}): FocusEntry {
  return { id, tabIndex: 0, disabled: false, scopeId: null, selectable: true, ...opts }
}

function stateWith(entries: FocusEntry[], focusedId: string | null = null, selectedId: string | null = null): FocusState {
  return { ...initialFocusState, entries, focusedId, selectedId }
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

  it("PUSH_SCOPE saves focus and clears selection", () => {
    let state = stateWith([makeEntry("a"), makeEntry("b")], "a", "a")
    state = focusReducer(state, {
      type: "PUSH_SCOPE",
      scope: { id: "scope1", trap: true, savedFocusId: null, savedSelectedId: null },
    })
    expect(state.scopes.length).toBe(1)
    expect(state.scopes[0].savedFocusId).toBe("a")
    expect(state.scopes[0].savedSelectedId).toBe("a")
    expect(state.selectedId).toBeNull()
  })

  it("POP_SCOPE restores focus and selection", () => {
    let state = stateWith([makeEntry("a"), makeEntry("b")], "a", "a")
    state = focusReducer(state, {
      type: "PUSH_SCOPE",
      scope: { id: "scope1", trap: true, savedFocusId: null, savedSelectedId: null },
    })
    state = focusReducer(state, { type: "FOCUS", id: "b" })
    expect(state.focusedId).toBe("b")

    state = focusReducer(state, { type: "POP_SCOPE", scopeId: "scope1" })
    expect(state.scopes.length).toBe(0)
    expect(state.focusedId).toBe("a") // restored
    expect(state.selectedId).toBe("a") // restored
  })

  it("POP_SCOPE falls back to first navigable if saved focus was removed", () => {
    let state = stateWith([makeEntry("a"), makeEntry("b"), makeEntry("c")], "a")
    state = focusReducer(state, {
      type: "PUSH_SCOPE",
      scope: { id: "scope1", trap: false, savedFocusId: null, savedSelectedId: null },
    })
    // Remove the saved entry while scope is active
    state = focusReducer(state, { type: "UNREGISTER", id: "a" })
    state = focusReducer(state, { type: "POP_SCOPE", scopeId: "scope1" })
    expect(state.focusedId).toBe("b") // falls back to first navigable
  })

  it("POP_SCOPE falls back if saved focus became disabled", () => {
    let state = stateWith([makeEntry("a"), makeEntry("b")], "a")
    state = focusReducer(state, {
      type: "PUSH_SCOPE",
      scope: { id: "scope1", trap: false, savedFocusId: null, savedSelectedId: null },
    })
    // Disable the saved entry via PATCH
    state = focusReducer(state, { type: "PATCH_ENTRY", id: "a", patch: { disabled: true } })
    state = focusReducer(state, { type: "POP_SCOPE", scopeId: "scope1" })
    expect(state.focusedId).toBe("b")
  })

  it("elements in scope filtered for FOCUS_NEXT/PREV when trap is active", () => {
    let state = stateWith([
      makeEntry("outside"),
      makeEntry("inside1", { scopeId: "s1" }),
      makeEntry("inside2", { scopeId: "s1" }),
    ], "outside")

    state = focusReducer(state, {
      type: "PUSH_SCOPE",
      scope: { id: "s1", trap: true, savedFocusId: null, savedSelectedId: null },
    })
    state = focusReducer(state, { type: "FOCUS", id: "inside1" })

    // FOCUS_NEXT should only cycle within scope
    state = focusReducer(state, { type: "FOCUS_NEXT" })
    expect(state.focusedId).toBe("inside2")
    state = focusReducer(state, { type: "FOCUS_NEXT" })
    expect(state.focusedId).toBe("inside1") // wraps within scope
  })

  it("UNREGISTER respects scope trap when refocusing", () => {
    let state = stateWith([
      makeEntry("outside"),
      makeEntry("inside1", { scopeId: "s1" }),
      makeEntry("inside2", { scopeId: "s1" }),
    ], "inside1")

    state = focusReducer(state, {
      type: "PUSH_SCOPE",
      scope: { id: "s1", trap: true, savedFocusId: null, savedSelectedId: null },
    })

    // Remove the focused entry — focus should stay inside scope
    state = focusReducer(state, { type: "UNREGISTER", id: "inside1" })
    expect(state.focusedId).toBe("inside2") // stays in scope, not "outside"
  })

  // ── Selection ────────────────────────────────────────────────────────

  it("SELECT requires focused and selectable", () => {
    let state = stateWith([makeEntry("a"), makeEntry("b")], "a")
    state = focusReducer(state, { type: "SELECT", id: "a" })
    expect(state.selectedId).toBe("a")
  })

  it("SELECT is a no-op when entry is not focused", () => {
    let state = stateWith([makeEntry("a"), makeEntry("b")], "a")
    const result = focusReducer(state, { type: "SELECT", id: "b" })
    expect(result).toBe(state)
  })

  it("SELECT is a no-op when entry is not selectable", () => {
    let state = stateWith([makeEntry("a", { selectable: false })], "a")
    const result = focusReducer(state, { type: "SELECT", id: "a" })
    expect(result).toBe(state)
  })

  it("DESELECT clears selectedId", () => {
    let state = stateWith([makeEntry("a")], "a", "a")
    state = focusReducer(state, { type: "DESELECT" })
    expect(state.selectedId).toBeNull()
  })

  it("DESELECT is a no-op when nothing is selected", () => {
    const state = stateWith([makeEntry("a")], "a")
    const result = focusReducer(state, { type: "DESELECT" })
    expect(result).toBe(state)
  })

  it("FOCUS clears selection when moving to a different entry", () => {
    let state = stateWith([makeEntry("a"), makeEntry("b")], "a", "a")
    state = focusReducer(state, { type: "FOCUS", id: "b" })
    expect(state.focusedId).toBe("b")
    expect(state.selectedId).toBeNull()
  })

  it("FOCUS_NEXT is a no-op while selected", () => {
    const state = stateWith([makeEntry("a"), makeEntry("b")], "a", "a")
    const result = focusReducer(state, { type: "FOCUS_NEXT" })
    expect(result).toBe(state)
  })

  it("FOCUS_PREV is a no-op while selected", () => {
    const state = stateWith([makeEntry("a"), makeEntry("b")], "a", "a")
    const result = focusReducer(state, { type: "FOCUS_PREV" })
    expect(result).toBe(state)
  })

  it("UNREGISTER clears selection if selected entry is removed", () => {
    let state = stateWith([makeEntry("a"), makeEntry("b")], "a", "a")
    state = focusReducer(state, { type: "UNREGISTER", id: "a" })
    expect(state.selectedId).toBeNull()
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

  // ── PATCH_ENTRY ──────────────────────────────────────────────────────

  it("PATCH_ENTRY updates entry props without removing it", () => {
    let state = stateWith([makeEntry("a"), makeEntry("b")], "a")
    state = focusReducer(state, { type: "PATCH_ENTRY", id: "a", patch: { disabled: true } })
    expect(state.entries.find((e) => e.id === "a")?.disabled).toBe(true)
    expect(state.focusedId).toBe("a") // focus preserved
  })

  it("PATCH_ENTRY is a no-op if nothing changed", () => {
    const state = stateWith([makeEntry("a")], "a")
    const result = focusReducer(state, { type: "PATCH_ENTRY", id: "a", patch: { tabIndex: 0 } })
    expect(result).toBe(state) // same reference
  })

  it("PATCH_ENTRY is a no-op for unknown id", () => {
    const state = stateWith([makeEntry("a")], "a")
    const result = focusReducer(state, { type: "PATCH_ENTRY", id: "z", patch: { disabled: true } })
    expect(result).toBe(state)
  })

  it("PATCH_ENTRY updates selectable", () => {
    let state = stateWith([makeEntry("a", { selectable: true })], "a")
    state = focusReducer(state, { type: "PATCH_ENTRY", id: "a", patch: { selectable: false } })
    expect(state.entries.find((e) => e.id === "a")?.selectable).toBe(false)
  })
})
