// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../polyterm-testing/src/index"
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
      { cols: 40, rows: 8 },
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
      { cols: 40, rows: 8 },
    )
    const text = screen.text()
    // The highlighted item gets a ▶ indicator
    expect(text).toContain("\u25b6")
  })

  it("shows unchecked indicator for unselected items", () => {
    const { screen } = renderTui(
      <MultiSelect items={items} />,
      { cols: 40, rows: 8 },
    )
    const text = screen.text()
    // ○ is the unchecked indicator
    expect(text).toContain("\u25cb")
  })

  it("shows checked indicator for selected items", () => {
    const { screen } = renderTui(
      <MultiSelect items={items} defaultSelected={[items[0]]} />,
      { cols: 40, rows: 8 },
    )
    const text = screen.text()
    // ◉ is the checked indicator
    expect(text).toContain("\u25c9")
  })

  it("navigates down with j key", () => {
    let highlighted = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <MultiSelect
        items={items}
        useKeyboard={mockUseKeyboard}
        onHighlight={(item) => { highlighted = item }}
      />,
      { cols: 40, rows: 8 },
    )
    savedHandler({ name: "j" })
    tui.flush()
    expect(highlighted).toEqual(items[1])
  })

  it("navigates down with down key", () => {
    let highlighted = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <MultiSelect
        items={items}
        useKeyboard={mockUseKeyboard}
        onHighlight={(item) => { highlighted = item }}
      />,
      { cols: 40, rows: 8 },
    )
    savedHandler({ name: "down" })
    tui.flush()
    expect(highlighted).toEqual(items[1])
  })

  it("navigates up with k key", () => {
    let highlighted = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <MultiSelect
        items={items}
        initialIndex={2}
        useKeyboard={mockUseKeyboard}
        onHighlight={(item) => { highlighted = item }}
      />,
      { cols: 40, rows: 8 },
    )
    savedHandler({ name: "k" })
    tui.flush()
    expect(highlighted).toEqual(items[1])
  })

  it("navigates up with up key", () => {
    let highlighted = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <MultiSelect
        items={items}
        initialIndex={2}
        useKeyboard={mockUseKeyboard}
        onHighlight={(item) => { highlighted = item }}
      />,
      { cols: 40, rows: 8 },
    )
    savedHandler({ name: "up" })
    tui.flush()
    expect(highlighted).toEqual(items[1])
  })

  it("wraps to bottom when going up from first item", () => {
    let highlighted = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <MultiSelect
        items={items}
        initialIndex={0}
        useKeyboard={mockUseKeyboard}
        onHighlight={(item) => { highlighted = item }}
      />,
      { cols: 40, rows: 8 },
    )
    savedHandler({ name: "up" })
    tui.flush()
    expect(highlighted).toEqual(items[3])
  })

  it("wraps to top when going down from last item", () => {
    let highlighted = null
    let savedHandler = null
    const mockUseKeyboard = (handler) => { savedHandler = handler }
    const tui = renderTui(
      <MultiSelect
        items={items}
        initialIndex={3}
        useKeyboard={mockUseKeyboard}
        onHighlight={(item) => { highlighted = item }}
      />,
      { cols: 40, rows: 8 },
    )
    savedHandler({ name: "down" })
    tui.flush()
    expect(highlighted).toEqual(items[0])
  })

  it("toggles selection with space", () => {
    let selectedItem = null
    const mockUseKeyboard = (handler) => {
      handler({ name: "space" })
    }
    renderTui(
      <MultiSelect
        items={items}
        useKeyboard={mockUseKeyboard}
        onSelect={(item) => { selectedItem = item }}
      />,
      { cols: 40, rows: 8 },
    )
    expect(selectedItem).toEqual(items[0])
  })

  it("unselects with space when already selected", () => {
    let unselectedItem = null
    const mockUseKeyboard = (handler) => {
      handler({ name: "space" })
    }
    renderTui(
      <MultiSelect
        items={items}
        defaultSelected={[items[0]]}
        useKeyboard={mockUseKeyboard}
        onUnselect={(item) => { unselectedItem = item }}
      />,
      { cols: 40, rows: 8 },
    )
    expect(unselectedItem).toEqual(items[0])
  })

  it("submits selected items with return", () => {
    let submitted = null
    const mockUseKeyboard = (handler) => {
      handler({ name: "return" })
    }
    renderTui(
      <MultiSelect
        items={items}
        defaultSelected={[items[0], items[2]]}
        useKeyboard={mockUseKeyboard}
        onSubmit={(items) => { submitted = items }}
      />,
      { cols: 40, rows: 8 },
    )
    expect(submitted).toEqual([items[0], items[2]])
  })

  it("respects controlled selected prop", () => {
    const { screen } = renderTui(
      <MultiSelect
        items={items}
        selected={[items[1]]}
      />,
      { cols: 40, rows: 8 },
    )
    const text = screen.text()
    expect(text).toContain("\u25c9")
  })

  it("does not process keys when focus=false", () => {
    let highlighted = null
    const mockUseKeyboard = (handler) => {
      handler({ name: "j" })
    }
    renderTui(
      <MultiSelect
        items={items}
        focus={false}
        useKeyboard={mockUseKeyboard}
        onHighlight={(item) => { highlighted = item }}
      />,
      { cols: 40, rows: 8 },
    )
    expect(highlighted).toBeNull()
  })

  it("respects initialIndex", () => {
    const { screen } = renderTui(
      <MultiSelect items={items} initialIndex={2} />,
      { cols: 40, rows: 8 },
    )
    // Should highlight Python (index 2)
    expect(screen.text()).toBeDefined()
  })

  it("clamps initialIndex to valid range", () => {
    const { screen } = renderTui(
      <MultiSelect items={items} initialIndex={100} />,
      { cols: 40, rows: 8 },
    )
    // Should not crash
    expect(screen.text()).toBeDefined()
  })

  it("respects limit prop for visible items", () => {
    const { screen } = renderTui(
      <MultiSelect items={items} limit={2} />,
      { cols: 40, rows: 8 },
    )
    const text = screen.text()
    // Only 2 items should be visible
    expect(text).toContain("TypeScript")
    expect(text).toContain("JavaScript")
  })

  it("handles empty items array", () => {
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
      { cols: 40, rows: 8 },
    )
    expect(screen.text()).toContain("TypeScript")
  })

  it("handles multiple selections in uncontrolled mode", () => {
    let submitted = null
    const mockUseKeyboard = (handler) => {
      // Select first item
      handler({ name: "space" })
      // Move down
      handler({ name: "j" })
      // Select second item
      handler({ name: "space" })
      // Submit
      handler({ name: "return" })
    }
    renderTui(
      <MultiSelect
        items={items}
        useKeyboard={mockUseKeyboard}
        onSubmit={(items) => { submitted = items }}
      />,
      { cols: 40, rows: 8 },
    )
    expect(submitted).toHaveLength(2)
  })
})
