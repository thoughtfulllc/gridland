import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { MultiSelect } from "./multi-select"

afterEach(() => cleanup())

const items = [
  { label: "TypeScript", value: "ts" },
  { label: "JavaScript", value: "js" },
  { label: "Python", value: "py" },
  { label: "Rust", value: "rs" },
]

function createMockKeyboard() {
  let handler: any = null
  const useKeyboard = (h: any) => { handler = h }
  const fire = (event: any) => handler(event)
  return { useKeyboard, fire }
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

  it("works without useKeyboard prop", () => {
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

  // ── Keyboard interactions (verified via callbacks) ────────────────────

  it("toggles selection with enter", () => {
    let changed = null as string[] | null
    const { useKeyboard, fire } = createMockKeyboard()
    renderTui(
      <MultiSelect
        items={items}
        selected={[]}
        onChange={(values) => { changed = values }}
        useKeyboard={useKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    fire({ name: "return" })
    expect(changed).toContain("ts")
    expect(changed).toHaveLength(1)
  })

  it("toggles selection with space", () => {
    let changed = null as string[] | null
    const { useKeyboard, fire } = createMockKeyboard()
    renderTui(
      <MultiSelect
        items={items}
        selected={[]}
        onChange={(values) => { changed = values }}
        useKeyboard={useKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    fire({ name: "space" })
    expect(changed).toContain("ts")
    expect(changed).toHaveLength(1)
  })

  it("selects all with a key", () => {
    let changed = null as string[] | null
    const { useKeyboard, fire } = createMockKeyboard()
    renderTui(
      <MultiSelect
        items={items}
        selected={[]}
        onChange={(values) => { changed = values }}
        useKeyboard={useKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    fire({ name: "a" })
    expect(changed).toHaveLength(4)
  })

  it("clears all with x key", () => {
    let changed = null as string[] | null
    const { useKeyboard, fire } = createMockKeyboard()
    renderTui(
      <MultiSelect
        items={items}
        selected={["ts", "js"]}
        onChange={(values) => { changed = values }}
        useKeyboard={useKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    fire({ name: "x" })
    expect(changed).toHaveLength(0)
  })

  it("submits via submit row (uncontrolled)", () => {
    let submitted = null as string[] | null
    const { useKeyboard, fire } = createMockKeyboard()
    renderTui(
      <MultiSelect
        items={items}
        defaultSelected={["ts", "py"]}
        useKeyboard={useKeyboard}
        onSubmit={(values) => { submitted = values }}
      />,
      { cols: 40, rows: 12 },
    )
    // Move cursor past all 4 items to the submit row (index 4)
    fire({ name: "j" })
    fire({ name: "j" })
    fire({ name: "j" })
    fire({ name: "j" })
    fire({ name: "return" })
    expect(submitted).toContain("ts")
    expect(submitted).toContain("py")
    expect(submitted).toHaveLength(2)
  })

  it("submits via submit row (controlled)", () => {
    let submitted = null as string[] | null
    const { useKeyboard, fire } = createMockKeyboard()
    renderTui(
      <MultiSelect
        items={items}
        selected={["ts", "py"]}
        useKeyboard={useKeyboard}
        onSubmit={(values) => { submitted = values }}
      />,
      { cols: 40, rows: 12 },
    )
    // Move cursor past all 4 items to the submit row (index 4)
    fire({ name: "j" })
    fire({ name: "j" })
    fire({ name: "j" })
    fire({ name: "j" })
    fire({ name: "return" })
    expect(submitted).toContain("ts")
    expect(submitted).toContain("py")
    expect(submitted).toHaveLength(2)
  })

  it("ignores keys when disabled", () => {
    let changed = null as string[] | null
    const { useKeyboard, fire } = createMockKeyboard()
    renderTui(
      <MultiSelect
        items={items}
        selected={[]}
        onChange={(values) => { changed = values }}
        disabled
        useKeyboard={useKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    fire({ name: "return" })
    expect(changed).toBeNull()
  })

  it("skips disabled items on toggle", () => {
    const disabledItems = [
      { label: "TypeScript", value: "ts", disabled: true },
      { label: "JavaScript", value: "js" },
      { label: "Python", value: "py" },
    ]
    let changed = null as string[] | null
    const { useKeyboard, fire } = createMockKeyboard()
    renderTui(
      <MultiSelect
        items={disabledItems}
        selected={[]}
        onChange={(values) => { changed = values }}
        useKeyboard={useKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    // Cursor is on first item (disabled), enter should do nothing
    fire({ name: "return" })
    expect(changed).toBeNull()
  })

  it("select all skips disabled items", () => {
    const disabledItems = [
      { label: "TypeScript", value: "ts", disabled: true },
      { label: "JavaScript", value: "js" },
      { label: "Python", value: "py" },
      { label: "Rust", value: "rs" },
    ]
    let changed = null as string[] | null
    const { useKeyboard, fire } = createMockKeyboard()
    renderTui(
      <MultiSelect
        items={disabledItems}
        selected={[]}
        onChange={(values) => { changed = values }}
        useKeyboard={useKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    fire({ name: "a" })
    expect(changed).toHaveLength(3)
    expect(changed).not.toContain("ts")
  })

  it("respects maxCount on toggle", () => {
    let changed = null as string[] | null
    const { useKeyboard, fire } = createMockKeyboard()
    renderTui(
      <MultiSelect
        items={items}
        selected={["ts", "js"]}
        onChange={(values) => { changed = values }}
        maxCount={2}
        useKeyboard={useKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    // Cursor is on first item which is already selected — deselect should work
    fire({ name: "return" })
    expect(changed).toHaveLength(1)
    expect(changed).not.toContain("ts")
  })

  it("blocks selection beyond maxCount", () => {
    let changed = null as string[] | null
    const { useKeyboard, fire } = createMockKeyboard()
    // Arrange items so the first (cursor default) is unselected while 2 others are selected
    const reordered = [
      { label: "Python", value: "py" },
      { label: "TypeScript", value: "ts" },
      { label: "JavaScript", value: "js" },
      { label: "Rust", value: "rs" },
    ]
    renderTui(
      <MultiSelect
        items={reordered}
        selected={["ts", "js"]}
        onChange={(values) => { changed = values }}
        maxCount={2}
        useKeyboard={useKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    // Cursor starts on "Python" (unselected) — selecting should be blocked at maxCount=2
    fire({ name: "return" })
    expect(changed).toBeNull()
  })

  it("maxCount limits select all", () => {
    let changed = null as string[] | null
    const { useKeyboard, fire } = createMockKeyboard()
    renderTui(
      <MultiSelect
        items={items}
        selected={[]}
        onChange={(values) => { changed = values }}
        maxCount={2}
        useKeyboard={useKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    fire({ name: "a" })
    expect(changed).toHaveLength(2)
  })

  it("disables select all when enableSelectAll is false", () => {
    let changed = null as string[] | null
    const { useKeyboard, fire } = createMockKeyboard()
    renderTui(
      <MultiSelect
        items={items}
        selected={[]}
        onChange={(values) => { changed = values }}
        enableSelectAll={false}
        useKeyboard={useKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    fire({ name: "a" })
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
    let submitted = null as string[] | null
    const { useKeyboard, fire } = createMockKeyboard()
    renderTui(
      <MultiSelect
        items={items}
        allowEmpty
        useKeyboard={useKeyboard}
        onSubmit={(values) => { submitted = values }}
      />,
      { cols: 40, rows: 12 },
    )
    // Move cursor past all 4 items to the submit row (index 4)
    fire({ name: "j" })
    fire({ name: "j" })
    fire({ name: "j" })
    fire({ name: "j" })
    fire({ name: "return" })
    expect(submitted).toHaveLength(0)
  })

  it("disables clear when enableClear is false", () => {
    let changed = null as string[] | null
    const { useKeyboard, fire } = createMockKeyboard()
    renderTui(
      <MultiSelect
        items={items}
        selected={["ts"]}
        onChange={(values) => { changed = values }}
        enableClear={false}
        useKeyboard={useKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    fire({ name: "x" })
    expect(changed).toBeNull()
  })

  // ── Cursor clamping ──────────────────────────────────────────────────

  it("clamps cursor when submit row disappears", () => {
    const { useKeyboard, fire } = createMockKeyboard()
    // Start with a selection so submit row is visible
    const { rerender, screen } = renderTui(
      <MultiSelect
        items={items}
        selected={["ts"]}
        onChange={() => {}}
        useKeyboard={useKeyboard}
      />,
      { cols: 40, rows: 12 },
    )
    // Move cursor to the submit row (position 4 for 4 items)
    fire({ name: "j" })
    fire({ name: "j" })
    fire({ name: "j" })
    fire({ name: "j" })
    expect(screen.text()).toContain("Submit")

    // Re-render with empty selection — submit row disappears
    rerender(
      <MultiSelect
        items={items}
        selected={[]}
        onChange={() => {}}
        useKeyboard={useKeyboard}
      />,
    )
    // Cursor should be clamped, not pointing at a ghost position
    // The last item should be highlighted since cursor was beyond bounds
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
    let submitted = null as string[] | null
    const { useKeyboard, fire } = createMockKeyboard()
    renderTui(
      <MultiSelect
        items={items}
        selected={["ts"]}
        onChange={() => {}}
        useKeyboard={useKeyboard}
        onSubmit={(values) => { submitted = values }}
      />,
      { cols: 40, rows: 12 },
    )
    // Cursor starts at 0 (TypeScript). With 4 items + submit row = 5 positions.
    // Pressing up should wrap to position 4 (the submit row).
    fire({ name: "up" })
    // Pressing enter should submit since cursor wrapped to the submit row.
    fire({ name: "return" })
    expect(submitted).toContain("ts")
    expect(submitted).toHaveLength(1)
  })

  // ── Controlled re-render sync ────────────────────────────────────────

  it("reflects updated controlled selected values on re-render", () => {
    const { useKeyboard } = createMockKeyboard()
    const { rerender, screen } = renderTui(
      <MultiSelect
        items={items}
        selected={["ts"]}
        onChange={() => {}}
        useKeyboard={useKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    const text1 = screen.text()
    expect((text1.match(/●/g) || []).length).toBe(1)

    // Re-render with 3 selected items
    rerender(
      <MultiSelect
        items={items}
        selected={["ts", "js", "py"]}
        onChange={() => {}}
        useKeyboard={useKeyboard}
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
    let changed = null as string[] | null
    const { useKeyboard, fire } = createMockKeyboard()
    renderTui(
      <MultiSelect
        items={groupedItems}
        selected={[]}
        onChange={(values) => { changed = values }}
        useKeyboard={useKeyboard}
      />,
      { cols: 40, rows: 12 },
    )
    // Cursor starts at index 0 (TypeScript). Move down twice to reach React (index 2).
    // If cursor incorrectly lands on separator/header, toggling would fail.
    fire({ name: "j" })
    fire({ name: "j" })
    fire({ name: "return" })
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
    // With limit=5, only 5 items visible. Items far from cursor (0) should be hidden.
    expect(text).toContain("Item 0")
    expect(text).not.toContain("Item 10")
    expect(text).not.toContain("Item 19")
  })

  // ── Submitted state rendering ────────────────────────────────────────

  it("passes correct values to onSubmit and ignores subsequent presses", () => {
    let submitted = null as string[] | null
    const { useKeyboard, fire } = createMockKeyboard()
    renderTui(
      <MultiSelect
        items={items}
        defaultSelected={["ts", "py"]}
        useKeyboard={useKeyboard}
        onSubmit={(values) => { submitted = values }}
      />,
      { cols: 40, rows: 12 },
    )
    // Navigate to submit row and submit
    fire({ name: "j" })
    fire({ name: "j" })
    fire({ name: "j" })
    fire({ name: "j" })
    fire({ name: "return" })
    expect(submitted).toHaveLength(2)
    expect(submitted).toContain("ts")
    expect(submitted).toContain("py")
    // Subsequent key presses should be ignored after submit
    submitted = null
    fire({ name: "return" })
    expect(submitted).toBeNull()
  })

  // ── onChange fires in uncontrolled mode ───────────────────────────────

  it("fires onChange in uncontrolled mode", () => {
    let changed = null as string[] | null
    const { useKeyboard, fire } = createMockKeyboard()
    renderTui(
      <MultiSelect
        items={items}
        defaultSelected={[]}
        onChange={(values) => { changed = values }}
        useKeyboard={useKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    fire({ name: "return" })
    expect(changed).toContain("ts")
    expect(changed).toHaveLength(1)
  })
})
