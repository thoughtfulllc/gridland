import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { FocusProvider } from "@gridland/utils"
import { MultiSelect } from "./multi-select"

afterEach(() => cleanup())

const items = [
  { label: "TypeScript", value: "ts" },
  { label: "JavaScript", value: "js" },
  { label: "Python", value: "py" },
  { label: "Rust", value: "rs" },
]

// Wraps a MultiSelect in FocusProvider selectable, autoFocuses it, and
// transitions it to selected via Enter before returning the tui handle
// so tests can dispatch the actual key under test. Mirrors the pilot
// pattern from SelectInput.
function renderSelected(node: any, opts = { cols: 40, rows: 12 }) {
  const tui = renderTui(
    <FocusProvider selectable>{node}</FocusProvider>,
    opts,
  )
  tui.flush(); tui.flush()
  tui.keys.enter() // focused → selected
  tui.flush(); tui.flush()
  return tui
}

describe("MultiSelect behavior", () => {
  // ── Static rendering ──────────────────────────────────────────────────

  it("renders all items", () => {
    const { screen } = renderTui(
      <MultiSelect items={items} />,
      { cols: 40, rows: 10 },
    )
    const text = screen.text()
    expect(text).toContain("TypeScript")
    expect(text).toContain("JavaScript")
    expect(text).toContain("Python")
    expect(text).toContain("Rust")
  })

  it("highlights first item by default", () => {
    const { screen } = renderTui(
      <MultiSelect items={items} />,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toContain("▸")
  })

  it("shows unchecked indicator for unselected items", () => {
    const { screen } = renderTui(
      <MultiSelect items={items} />,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toContain("○")
  })

  it("shows checked indicator for default selected items", () => {
    const { screen } = renderTui(
      <MultiSelect items={items} defaultSelected={["ts"]} />,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toContain("●")
  })

  it("renders diamond header and left bar", () => {
    const { screen } = renderTui(
      <MultiSelect items={items} />,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toContain("◆")
    expect(screen.text()).toContain("│")
    expect(screen.text()).toContain("Select")
  })

  it("renders custom title", () => {
    const { screen } = renderTui(
      <MultiSelect items={items} title="Pick languages" />,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toContain("Pick languages")
  })

  it("renders group headers", () => {
    const groupedItems = [
      { label: "TypeScript", value: "ts", group: "Languages" },
      { label: "Python", value: "py", group: "Languages" },
      { label: "React", value: "react", group: "Frameworks" },
    ]
    const { screen } = renderTui(
      <MultiSelect items={groupedItems} />,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toContain("Languages")
    expect(screen.text()).toContain("Frameworks")
  })

  it("handles empty items", () => {
    const { screen } = renderTui(
      <MultiSelect items={[]} />,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toBeDefined()
  })

  it("handles single item", () => {
    const { screen } = renderTui(
      <MultiSelect items={[{ label: "Only", value: "only" }]} />,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toContain("Only")
  })

  it("renders without any focus wiring", () => {
    const { screen } = renderTui(
      <MultiSelect items={items} />,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toContain("TypeScript")
  })

  it("renders controlled selected values", () => {
    const { screen } = renderTui(
      <MultiSelect items={items} selected={["ts", "py"]} />,
      { cols: 40, rows: 10 },
    )
    const text = screen.text()
    const checkCount = (text.match(/●/g) || []).length
    expect(checkCount).toBe(2)
  })

  it("renders maxCount counter", () => {
    const { screen } = renderTui(
      <MultiSelect items={items} maxCount={3} defaultSelected={["ts"]} />,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toContain("(1/3)")
  })

  it("hides cursor when disabled", () => {
    const { screen } = renderTui(
      <MultiSelect items={items} disabled />,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).not.toContain("▸")
  })

  it("shows required indicator", () => {
    const { screen } = renderTui(
      <MultiSelect items={items} required />,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toContain("*")
  })

  it("shows invalid state", () => {
    const { screen } = renderTui(
      <MultiSelect items={items} invalid />,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toContain("Please select at least one option")
  })

  it("shows placeholder when no items", () => {
    const { screen } = renderTui(
      <MultiSelect items={[]} placeholder="No options available" />,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toContain("No options available")
  })

  it("renders separators between groups", () => {
    const groupedItems = [
      { label: "TypeScript", value: "ts", group: "Languages" },
      { label: "React", value: "react", group: "Frameworks" },
    ]
    const { screen } = renderTui(
      <MultiSelect items={groupedItems} />,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toContain("─")
  })

  // ── Keyboard interactions (real key dispatch via FocusProvider) ──────

  it("toggles selection with enter", () => {
    let changed: string[] | null = null
    const { keys, flush } = renderSelected(
      <MultiSelect
        focusId="ms"
        autoFocus
        items={items}
        selected={[]}
        onChange={(values) => { changed = values }}
      />,
    )
    keys.enter() // while selected, Enter toggles the current item
    flush(); flush()
    expect(changed).toContain("ts")
    expect(changed).toHaveLength(1)
  })

  it("toggles selection with space", () => {
    let changed: string[] | null = null
    const { keys, flush } = renderSelected(
      <MultiSelect
        focusId="ms"
        autoFocus
        items={items}
        selected={[]}
        onChange={(values) => { changed = values }}
      />,
    )
    keys.space()
    flush(); flush()
    expect(changed).toContain("ts")
    expect(changed).toHaveLength(1)
  })

  it("selects all with a key", () => {
    let changed: string[] | null = null
    const { keys, flush } = renderSelected(
      <MultiSelect
        focusId="ms"
        autoFocus
        items={items}
        selected={[]}
        onChange={(values) => { changed = values }}
      />,
    )
    keys.press("a")
    flush(); flush()
    expect(changed).toHaveLength(4)
  })

  it("clears all with x key", () => {
    let changed: string[] | null = null
    const { keys, flush } = renderSelected(
      <MultiSelect
        focusId="ms"
        autoFocus
        items={items}
        selected={["ts", "js"]}
        onChange={(values) => { changed = values }}
      />,
    )
    keys.press("x")
    flush(); flush()
    expect(changed).toHaveLength(0)
  })

  it("submits via submit row (uncontrolled)", () => {
    let submitted: string[] | null = null
    const tree = (
      <MultiSelect
        focusId="ms"
        autoFocus
        items={items}
        defaultSelected={["ts", "py"]}
        onSubmit={(values) => { submitted = values }}
      />
    )
    const { keys, flush, rerender } = renderSelected(tree)
    keys.press("j")
    keys.press("j")
    keys.press("j")
    keys.press("j")
    flush(); flush()
    keys.enter()
    rerender(<FocusProvider selectable>{tree}</FocusProvider>)
    expect(submitted).toContain("ts")
    expect(submitted).toContain("py")
    expect(submitted).toHaveLength(2)
  })

  it("submits via submit row (controlled)", () => {
    let submitted: string[] | null = null
    const tree = (
      <MultiSelect
        focusId="ms"
        autoFocus
        items={items}
        selected={["ts", "py"]}
        onSubmit={(values) => { submitted = values }}
      />
    )
    const { keys, flush, rerender } = renderSelected(tree)
    keys.press("j")
    keys.press("j")
    keys.press("j")
    keys.press("j")
    flush(); flush()
    keys.enter()
    rerender(<FocusProvider selectable>{tree}</FocusProvider>)
    expect(submitted).toContain("ts")
    expect(submitted).toContain("py")
    expect(submitted).toHaveLength(2)
  })

  it("ignores keys when disabled", () => {
    let changed: string[] | null = null
    const { keys, flush } = renderTui(
      <FocusProvider selectable>
        <MultiSelect
          focusId="ms"
          autoFocus
          items={items}
          selected={[]}
          disabled
          onChange={(values) => { changed = values }}
        />
      </FocusProvider>,
      { cols: 40, rows: 10 },
    )
    flush(); flush()
    // disabled → not in tab cycle, autoFocus is a no-op, Enter cannot select
    keys.enter()
    flush(); flush()
    keys.enter()
    flush(); flush()
    expect(changed).toBeNull()
  })

  it("skips disabled items on toggle", () => {
    const disabledItems = [
      { label: "TypeScript", value: "ts", disabled: true },
      { label: "JavaScript", value: "js" },
      { label: "Python", value: "py" },
    ]
    let changed: string[] | null = null
    const { keys, flush } = renderSelected(
      <MultiSelect
        focusId="ms"
        autoFocus
        items={disabledItems}
        selected={[]}
        onChange={(values) => { changed = values }}
      />,
    )
    // Cursor is on first item (disabled), enter should do nothing
    keys.enter()
    flush(); flush()
    expect(changed).toBeNull()
  })

  it("select all skips disabled items", () => {
    const disabledItems = [
      { label: "TypeScript", value: "ts", disabled: true },
      { label: "JavaScript", value: "js" },
      { label: "Python", value: "py" },
      { label: "Rust", value: "rs" },
    ]
    let changed: string[] | null = null
    const { keys, flush } = renderSelected(
      <MultiSelect
        focusId="ms"
        autoFocus
        items={disabledItems}
        selected={[]}
        onChange={(values) => { changed = values }}
      />,
    )
    keys.press("a")
    flush(); flush()
    expect(changed).toHaveLength(3)
    expect(changed).not.toContain("ts")
  })

  it("respects maxCount on toggle", () => {
    let changed: string[] | null = null
    const { keys, flush } = renderSelected(
      <MultiSelect
        focusId="ms"
        autoFocus
        items={items}
        selected={["ts", "js"]}
        onChange={(values) => { changed = values }}
        maxCount={2}
      />,
    )
    // Cursor is on first item which is already selected — deselect should work
    keys.enter()
    flush(); flush()
    expect(changed).toHaveLength(1)
    expect(changed).not.toContain("ts")
  })

  it("blocks selection beyond maxCount", () => {
    let changed: string[] | null = null
    const reordered = [
      { label: "Python", value: "py" },
      { label: "TypeScript", value: "ts" },
      { label: "JavaScript", value: "js" },
      { label: "Rust", value: "rs" },
    ]
    const { keys, flush } = renderSelected(
      <MultiSelect
        focusId="ms"
        autoFocus
        items={reordered}
        selected={["ts", "js"]}
        onChange={(values) => { changed = values }}
        maxCount={2}
      />,
    )
    // Cursor starts on "Python" (unselected) — selecting should be blocked
    keys.enter()
    flush(); flush()
    expect(changed).toBeNull()
  })

  it("maxCount limits select all", () => {
    let changed: string[] | null = null
    const { keys, flush } = renderSelected(
      <MultiSelect
        focusId="ms"
        autoFocus
        items={items}
        selected={[]}
        onChange={(values) => { changed = values }}
        maxCount={2}
      />,
    )
    keys.press("a")
    flush(); flush()
    expect(changed).toHaveLength(2)
  })

  it("disables select all when enableSelectAll is false", () => {
    let changed: string[] | null = null
    const { keys, flush } = renderSelected(
      <MultiSelect
        focusId="ms"
        autoFocus
        items={items}
        selected={[]}
        onChange={(values) => { changed = values }}
        enableSelectAll={false}
      />,
    )
    keys.press("a")
    flush(); flush()
    expect(changed).toBeNull()
  })

  it("shows submit row with no selection when allowEmpty is true", () => {
    const { screen } = renderTui(
      <MultiSelect items={items} allowEmpty />,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toContain("Submit")
  })

  it("hides submit row with no selection by default", () => {
    const { screen } = renderTui(
      <MultiSelect items={items} />,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).not.toContain("Submit")
  })

  it("submits empty selection when allowEmpty is true", () => {
    let submitted: string[] | null = null
    const tree = (
      <MultiSelect
        focusId="ms"
        autoFocus
        items={items}
        allowEmpty
        onSubmit={(values) => { submitted = values }}
      />
    )
    const { keys, flush, rerender } = renderSelected(tree)
    keys.press("j")
    keys.press("j")
    keys.press("j")
    keys.press("j")
    flush(); flush()
    keys.enter()
    rerender(<FocusProvider selectable>{tree}</FocusProvider>)
    expect(submitted).toHaveLength(0)
  })

  it("disables clear when enableClear is false", () => {
    let changed: string[] | null = null
    const { keys, flush } = renderSelected(
      <MultiSelect
        focusId="ms"
        autoFocus
        items={items}
        selected={["ts"]}
        onChange={(values) => { changed = values }}
        enableClear={false}
      />,
    )
    keys.press("x")
    flush(); flush()
    expect(changed).toBeNull()
  })

  // ── Cursor clamping ──────────────────────────────────────────────────

  it("clamps cursor when submit row disappears", () => {
    const first = (
      <MultiSelect
        focusId="ms"
        autoFocus
        items={items}
        selected={["ts"]}
        onChange={() => {}}
      />
    )
    const { keys, screen, rerender, flush } = renderSelected(first)
    // Move cursor to the submit row (position 4 for 4 items)
    keys.press("j")
    keys.press("j")
    keys.press("j")
    keys.press("j")
    flush(); flush()
    expect(screen.text()).toContain("Submit")

    // Re-render with empty selection — submit row disappears
    rerender(
      <FocusProvider selectable>
        <MultiSelect
          focusId="ms"
          autoFocus
          items={items}
          selected={[]}
          onChange={() => {}}
        />
      </FocusProvider>,
    )
    // Cursor should be clamped, not pointing at a ghost position
    expect(screen.text()).toContain("▸")
    expect(screen.text()).not.toContain("Submit")
  })

  // ── Custom error message ─────────────────────────────────────────────

  it("shows custom error message", () => {
    const { screen } = renderTui(
      <MultiSelect items={items} invalid errorMessage="Pick at least two" />,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toContain("Pick at least two")
    expect(screen.text()).not.toContain("Please select at least one option")
  })

  // ── Navigation wrapping ──────────────────────────────────────────────

  it("wraps cursor from first to last item on up", () => {
    let submitted: string[] | null = null
    const tree = (
      <MultiSelect
        focusId="ms"
        autoFocus
        items={items}
        selected={["ts"]}
        onChange={() => {}}
        onSubmit={(values) => { submitted = values }}
      />
    )
    const { keys, flush, rerender } = renderSelected(tree)
    // Cursor starts at 0 (TypeScript). With 4 items + submit row = 5 positions.
    // Up wraps to position 4 (the submit row).
    keys.up()
    flush(); flush()
    keys.enter()
    rerender(<FocusProvider selectable>{tree}</FocusProvider>)
    expect(submitted).toContain("ts")
    expect(submitted).toHaveLength(1)
  })

  // ── Controlled re-render sync ────────────────────────────────────────

  it("reflects updated controlled selected values on re-render", () => {
    const { rerender, screen } = renderTui(
      <MultiSelect
        items={items}
        selected={["ts"]}
        onChange={() => {}}
      />,
      { cols: 40, rows: 10 },
    )
    const text1 = screen.text()
    expect((text1.match(/●/g) || []).length).toBe(1)

    rerender(
      <MultiSelect
        items={items}
        selected={["ts", "js", "py"]}
        onChange={() => {}}
      />,
    )
    const text2 = screen.text()
    expect((text2.match(/●/g) || []).length).toBe(3)
  })

  // ── Group navigation ─────────────────────────────────────────────────

  it("cursor skips group headers and separators during navigation", () => {
    const groupedItems = [
      { label: "TypeScript", value: "ts", group: "Languages" },
      { label: "Python", value: "py", group: "Languages" },
      { label: "React", value: "react", group: "Frameworks" },
    ]
    let changed: string[] | null = null
    const { keys, flush } = renderSelected(
      <MultiSelect
        focusId="ms"
        autoFocus
        items={groupedItems}
        selected={[]}
        onChange={(values) => { changed = values }}
      />,
    )
    // Cursor starts at 0 (TypeScript). j twice → React. Toggle.
    keys.press("j")
    keys.press("j")
    flush(); flush()
    keys.enter()
    flush(); flush()
    expect(changed).toContain("react")
    expect(changed).toHaveLength(1)
  })

  // ── Scroll windowing ─────────────────────────────────────────────────

  it("hides items outside the visible window", () => {
    const manyItems = Array.from({ length: 20 }, (_, i) => ({
      label: `Item ${i}`,
      value: `item-${i}`,
    }))
    const { screen } = renderTui(
      <MultiSelect items={manyItems} limit={5} />,
      { cols: 40, rows: 10 },
    )
    const text = screen.text()
    expect(text).toContain("Item 0")
    expect(text).not.toContain("Item 10")
    expect(text).not.toContain("Item 19")
  })

  // ── Submitted state rendering ────────────────────────────────────────

  it("passes correct values to onSubmit and ignores subsequent presses", () => {
    let submitted: string[] | null = null
    const tree = (
      <MultiSelect
        focusId="ms"
        autoFocus
        items={items}
        defaultSelected={["ts", "py"]}
        onSubmit={(values) => { submitted = values }}
      />
    )
    const { keys, flush, rerender } = renderSelected(tree)
    // Navigate to submit row and submit
    keys.press("j")
    keys.press("j")
    keys.press("j")
    keys.press("j")
    flush(); flush()
    keys.enter()
    rerender(<FocusProvider selectable>{tree}</FocusProvider>)
    expect(submitted).toHaveLength(2)
    expect(submitted).toContain("ts")
    expect(submitted).toContain("py")

    // Subsequent key presses should be ignored after submit
    submitted = null
    keys.enter()
    flush(); flush()
    expect(submitted).toBeNull()
  })

  // ── onChange fires in uncontrolled mode ───────────────────────────────

  it("fires onChange in uncontrolled mode", () => {
    let changed: string[] | null = null
    const { keys, flush } = renderSelected(
      <MultiSelect
        focusId="ms"
        autoFocus
        items={items}
        defaultSelected={[]}
        onChange={(values) => { changed = values }}
      />,
    )
    keys.enter()
    flush(); flush()
    expect(changed).toContain("ts")
    expect(changed).toHaveLength(1)
  })
})

// ── Target API smoke test (kept as an explicit marker) ───────────────

describe("MultiSelect via useInteractive (target API)", () => {
  it("routes space to toggle the first item via real key dispatch", () => {
    let changed: string[] | null = null
    const { keys, flush } = renderSelected(
      <MultiSelect
        focusId="ms"
        autoFocus
        items={items}
        selected={[]}
        onChange={(values: string[]) => { changed = values }}
      />,
    )
    keys.space()
    flush(); flush()
    expect(changed).toContain("ts")
    expect(changed).toHaveLength(1)
  })
})
