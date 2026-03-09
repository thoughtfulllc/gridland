// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
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
    let changed = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    renderTui(
      <MultiSelect
        items={items}
        selected={[]}
        onChange={(values) => { changed = values }}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    savedHandler({ name: "return" })
    expect(changed).toContain("ts")
    expect(changed).toHaveLength(1)
  })

  it("selects all with a key", () => {
    let changed = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    renderTui(
      <MultiSelect
        items={items}
        selected={[]}
        onChange={(values) => { changed = values }}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    savedHandler({ name: "a" })
    expect(changed).toHaveLength(4)
  })

  it("clears all with x key", () => {
    let changed = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    renderTui(
      <MultiSelect
        items={items}
        selected={["ts", "js"]}
        onChange={(values) => { changed = values }}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    savedHandler({ name: "x" })
    expect(changed).toHaveLength(0)
  })

  it("submits via submit row (uncontrolled)", () => {
    let submitted = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    renderTui(
      <MultiSelect
        items={items}
        defaultSelected={["ts", "py"]}
        useKeyboard={mockUseKeyboard}
        onSubmit={(values) => { submitted = values }}
      />,
      { cols: 40, rows: 12 },
    )
    // Move cursor past all 4 items to the submit row (index 4)
    savedHandler({ name: "j" })
    savedHandler({ name: "j" })
    savedHandler({ name: "j" })
    savedHandler({ name: "j" })
    savedHandler({ name: "return" })
    expect(submitted).toContain("ts")
    expect(submitted).toContain("py")
    expect(submitted).toHaveLength(2)
  })

  it("submits via submit row (controlled)", () => {
    let submitted = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    renderTui(
      <MultiSelect
        items={items}
        selected={["ts", "py"]}
        useKeyboard={mockUseKeyboard}
        onSubmit={(values) => { submitted = values }}
      />,
      { cols: 40, rows: 12 },
    )
    // Move cursor past all 4 items to the submit row (index 4)
    savedHandler({ name: "j" })
    savedHandler({ name: "j" })
    savedHandler({ name: "j" })
    savedHandler({ name: "j" })
    savedHandler({ name: "return" })
    expect(submitted).toContain("ts")
    expect(submitted).toContain("py")
    expect(submitted).toHaveLength(2)
  })

  it("ignores keys when disabled", () => {
    let changed = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    renderTui(
      <MultiSelect
        items={items}
        selected={[]}
        onChange={(values) => { changed = values }}
        disabled
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    savedHandler({ name: "return" })
    expect(changed).toBeNull()
  })

  it("skips disabled items on toggle", () => {
    const disabledItems = [
      { label: "TypeScript", value: "ts", disabled: true },
      { label: "JavaScript", value: "js" },
      { label: "Python", value: "py" },
    ]
    let changed = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    renderTui(
      <MultiSelect
        items={disabledItems}
        selected={[]}
        onChange={(values) => { changed = values }}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    // Cursor is on first item (disabled), enter should do nothing
    savedHandler({ name: "return" })
    expect(changed).toBeNull()
  })

  it("select all skips disabled items", () => {
    const disabledItems = [
      { label: "TypeScript", value: "ts", disabled: true },
      { label: "JavaScript", value: "js" },
      { label: "Python", value: "py" },
      { label: "Rust", value: "rs" },
    ]
    let changed = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    renderTui(
      <MultiSelect
        items={disabledItems}
        selected={[]}
        onChange={(values) => { changed = values }}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    savedHandler({ name: "a" })
    expect(changed).toHaveLength(3)
    expect(changed).not.toContain("ts")
  })

  it("respects maxCount on toggle", () => {
    let changed = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    renderTui(
      <MultiSelect
        items={items}
        selected={["ts", "js"]}
        onChange={(values) => { changed = values }}
        maxCount={2}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    // Cursor is on first item which is already selected — deselect should work
    savedHandler({ name: "return" })
    expect(changed).toHaveLength(1)
    expect(changed).not.toContain("ts")
  })

  it("blocks selection beyond maxCount", () => {
    let changed = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
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
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    // Cursor starts on "Python" (unselected) — selecting should be blocked at maxCount=2
    savedHandler({ name: "return" })
    expect(changed).toBeNull()
  })

  it("maxCount limits select all", () => {
    let changed = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    renderTui(
      <MultiSelect
        items={items}
        selected={[]}
        onChange={(values) => { changed = values }}
        maxCount={2}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    savedHandler({ name: "a" })
    expect(changed).toHaveLength(2)
  })

  it("disables select all when enableSelectAll is false", () => {
    let changed = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    renderTui(
      <MultiSelect
        items={items}
        selected={[]}
        onChange={(values) => { changed = values }}
        enableSelectAll={false}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    savedHandler({ name: "a" })
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
    let submitted = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    renderTui(
      <MultiSelect
        items={items}
        allowEmpty
        useKeyboard={mockUseKeyboard}
        onSubmit={(values) => { submitted = values }}
      />,
      { cols: 40, rows: 12 },
    )
    // Move cursor past all 4 items to the submit row (index 4)
    savedHandler({ name: "j" })
    savedHandler({ name: "j" })
    savedHandler({ name: "j" })
    savedHandler({ name: "j" })
    savedHandler({ name: "return" })
    expect(submitted).toHaveLength(0)
  })

  it("disables clear when enableClear is false", () => {
    let changed = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    renderTui(
      <MultiSelect
        items={items}
        selected={["ts"]}
        onChange={(values) => { changed = values }}
        enableClear={false}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    savedHandler({ name: "x" })
    expect(changed).toBeNull()
  })
})
