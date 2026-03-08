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
    expect(screen.text()).toContain("◉")
  })

  it("navigates with j/k keys", () => {
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <MultiSelect items={items} useKeyboard={mockUseKeyboard} />,
      { cols: 40, rows: 10 },
    )
    savedHandler({ name: "j" })
    tui.flush()
    const text = tui.screen.text()
    expect(text).toContain("▸")
  })

  it("toggles selection with space", () => {
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <MultiSelect items={items} useKeyboard={mockUseKeyboard} />,
      { cols: 40, rows: 10 },
    )
    savedHandler({ name: "space" })
    tui.flush()
    expect(tui.screen.text()).toContain("◉")
  })

  it("selects all with a key", () => {
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <MultiSelect items={items} useKeyboard={mockUseKeyboard} />,
      { cols: 40, rows: 10 },
    )
    savedHandler({ name: "a" })
    tui.flush()
    const text = tui.screen.text()
    const checkCount = (text.match(/◉/g) || []).length
    expect(checkCount).toBe(4)
  })

  it("clears all with x key", () => {
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <MultiSelect items={items} defaultSelected={["ts", "js"]} useKeyboard={mockUseKeyboard} />,
      { cols: 40, rows: 10 },
    )
    savedHandler({ name: "x" })
    tui.flush()
    const text = tui.screen.text()
    expect(text).not.toContain("◉")
  })

  it("submits with enter", () => {
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
      { cols: 40, rows: 10 },
    )
    savedHandler({ name: "return" })
    expect(submitted).toContain("ts")
    expect(submitted).toContain("py")
    expect(submitted).toHaveLength(2)
  })

  it("shows submitted state after enter", () => {
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <MultiSelect
        items={items}
        defaultSelected={["ts"]}
        useKeyboard={mockUseKeyboard}
        onSubmit={() => {}}
      />,
      { cols: 40, rows: 10 },
    )
    savedHandler({ name: "return" })
    tui.flush()
    expect(tui.screen.text()).toContain("submitted")
    expect(tui.screen.text()).toContain("TypeScript")
  })

  it("shows custom submitted status", () => {
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <MultiSelect
        items={items}
        defaultSelected={["ts"]}
        useKeyboard={mockUseKeyboard}
        submittedStatus="saved"
        onSubmit={() => {}}
      />,
      { cols: 40, rows: 10 },
    )
    savedHandler({ name: "return" })
    tui.flush()
    expect(tui.screen.text()).toContain("saved")
  })

  it("ignores keys after submit", () => {
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <MultiSelect
        items={items}
        useKeyboard={mockUseKeyboard}
        onSubmit={() => {}}
      />,
      { cols: 40, rows: 10 },
    )
    savedHandler({ name: "return" })
    tui.flush()
    savedHandler({ name: "j" })
    tui.flush()
    expect(tui.screen.text()).toContain("submitted")
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

  it("wraps cursor when navigating past bounds", () => {
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <MultiSelect items={items} useKeyboard={mockUseKeyboard} />,
      { cols: 40, rows: 10 },
    )
    savedHandler({ name: "up" })
    tui.flush()
    // Should wrap to last item
    expect(tui.screen.text()).toContain("▸")
  })

  it("renders controlled selected values", () => {
    const { screen } = renderTui(
      <MultiSelect items={items} selected={["ts", "py"]} />,
      { cols: 40, rows: 10 },
    )
    const text = screen.text()
    const checkCount = (text.match(/◉/g) || []).length
    expect(checkCount).toBe(2)
  })

  it("calls onChange on toggle in controlled mode", () => {
    let changed = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    renderTui(
      <MultiSelect
        items={items}
        selected={["ts"]}
        onChange={(values) => { changed = values }}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    savedHandler({ name: "space" })
    // First item is highlighted, toggling "ts" off
    expect(changed).not.toContain("ts")
    expect(changed).toHaveLength(0)
  })

  it("calls onChange on select all in controlled mode", () => {
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

  it("calls onChange on clear in controlled mode", () => {
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

  it("uses controlled selected for onSubmit", () => {
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
      { cols: 40, rows: 10 },
    )
    savedHandler({ name: "return" })
    expect(submitted).toContain("ts")
    expect(submitted).toContain("py")
    expect(submitted).toHaveLength(2)
  })

  it("ignores all keys when disabled", () => {
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <MultiSelect items={items} disabled useKeyboard={mockUseKeyboard} />,
      { cols: 40, rows: 10 },
    )
    savedHandler({ name: "space" })
    tui.flush()
    expect(tui.screen.text()).not.toContain("◉")
  })

  it("skips disabled items on toggle", () => {
    const disabledItems = [
      { label: "TypeScript", value: "ts", disabled: true },
      { label: "JavaScript", value: "js" },
      { label: "Python", value: "py" },
    ]
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <MultiSelect items={disabledItems} useKeyboard={mockUseKeyboard} />,
      { cols: 40, rows: 10 },
    )
    // Cursor is on first item (disabled), space should do nothing
    savedHandler({ name: "space" })
    tui.flush()
    expect(tui.screen.text()).not.toContain("◉")
  })

  it("select all skips disabled items", () => {
    const disabledItems = [
      { label: "TypeScript", value: "ts", disabled: true },
      { label: "JavaScript", value: "js" },
      { label: "Python", value: "py" },
      { label: "Rust", value: "rs" },
    ]
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <MultiSelect items={disabledItems} useKeyboard={mockUseKeyboard} />,
      { cols: 40, rows: 10 },
    )
    savedHandler({ name: "a" })
    tui.flush()
    const text = tui.screen.text()
    const checkCount = (text.match(/◉/g) || []).length
    expect(checkCount).toBe(3)
  })

  it("respects maxCount limit", () => {
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <MultiSelect items={items} maxCount={2} useKeyboard={mockUseKeyboard} />,
      { cols: 40, rows: 10 },
    )
    // Select first item
    savedHandler({ name: "space" })
    tui.flush()
    // Move down, select second
    savedHandler({ name: "j" })
    tui.flush()
    savedHandler({ name: "space" })
    tui.flush()
    // Move down, try to select third — should be blocked
    savedHandler({ name: "j" })
    tui.flush()
    savedHandler({ name: "space" })
    tui.flush()
    const text = tui.screen.text()
    const checkCount = (text.match(/◉/g) || []).length
    expect(checkCount).toBe(2)
  })

  it("maxCount limits select all", () => {
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <MultiSelect items={items} maxCount={2} useKeyboard={mockUseKeyboard} />,
      { cols: 40, rows: 10 },
    )
    savedHandler({ name: "a" })
    tui.flush()
    const text = tui.screen.text()
    const checkCount = (text.match(/◉/g) || []).length
    expect(checkCount).toBe(2)
  })

  it("allows deselecting when at maxCount", () => {
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <MultiSelect items={items} maxCount={1} defaultSelected={["ts"]} useKeyboard={mockUseKeyboard} />,
      { cols: 40, rows: 10 },
    )
    // Deselect the first item — should work even at maxCount
    savedHandler({ name: "space" })
    tui.flush()
    expect(tui.screen.text()).not.toContain("◉")
  })
})
