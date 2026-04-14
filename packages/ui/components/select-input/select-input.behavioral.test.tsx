// @ts-nocheck — new tests use OpenTUI intrinsic elements for Sink components
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { FocusProvider, useFocusedShortcuts } from "@gridland/utils"
import { SelectInput } from "./select-input"

afterEach(() => cleanup())

const items = [
  { label: "TypeScript", value: "ts" },
  { label: "JavaScript", value: "js" },
  { label: "Python", value: "py" },
  { label: "Rust", value: "rs" },
]

describe("SelectInput behavior", () => {
  // ── Static rendering ──────────────────────────────────────────────────

  it("renders all items", () => {
    const { screen } = renderTui(
      <SelectInput items={items} />,
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
      <SelectInput items={items} />,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toContain("▸")
  })

  it("shows radio indicator for items", () => {
    const { screen } = renderTui(
      <SelectInput items={items} />,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toContain("○")
  })

  it("renders diamond header and left bar", () => {
    const { screen } = renderTui(
      <SelectInput items={items} />,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toContain("◆")
    expect(screen.text()).toContain("│")
    expect(screen.text()).toContain("Select")
  })

  it("renders custom title", () => {
    const { screen } = renderTui(
      <SelectInput items={items} title="Pick a language" />,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toContain("Pick a language")
  })

  it("renders group headers", () => {
    const groupedItems = [
      { label: "TypeScript", value: "ts", group: "Languages" },
      { label: "Python", value: "py", group: "Languages" },
      { label: "React", value: "react", group: "Frameworks" },
    ]
    const { screen } = renderTui(
      <SelectInput items={groupedItems} />,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toContain("Languages")
    expect(screen.text()).toContain("Frameworks")
  })

  it("handles empty items", () => {
    const { screen } = renderTui(
      <SelectInput items={[]} />,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toBeDefined()
  })

  it("handles single item", () => {
    const { screen } = renderTui(
      <SelectInput items={[{ label: "Only", value: "only" }]} />,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toContain("Only")
  })

  it("works without useKeyboard prop", () => {
    const { screen } = renderTui(
      <SelectInput items={items} />,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toContain("TypeScript")
  })

  it("shows required indicator", () => {
    const { screen } = renderTui(
      <SelectInput items={items} required />,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toContain("*")
  })

  it("shows invalid state", () => {
    const { screen } = renderTui(
      <SelectInput items={items} invalid />,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toContain("Please select an option")
  })

  it("shows placeholder when no items", () => {
    const { screen } = renderTui(
      <SelectInput items={[]} placeholder="No options available" />,
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
      <SelectInput items={groupedItems} />,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).toContain("─")
  })

  it("hides cursor when disabled", () => {
    const { screen } = renderTui(
      <SelectInput items={items} disabled />,
      { cols: 40, rows: 10 },
    )
    expect(screen.text()).not.toContain("▸")
  })

  // ── Keyboard interactions (verified via callbacks) ────────────────────

  it("selects on move down", () => {
    let changed = null as string | null
    let savedHandler: ((event: any) => void) | null = null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <SelectInput
        items={items}
        value="ts"
        onChange={(value) => { changed = value }}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    savedHandler!({ name: "down" })
    expect(changed).toBe("js")
  })

  it("selects on move up", () => {
    let changed = null as string | null
    let savedHandler: ((event: any) => void) | null = null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <SelectInput
        items={items}
        value="ts"
        onChange={(value) => { changed = value }}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    savedHandler!({ name: "up" })
    expect(changed).toBe("rs")
  })

  it("submits with enter (uncontrolled)", () => {
    let submitted = null as string | null
    let savedHandler: ((event: any) => void) | null = null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <SelectInput
        items={items}
        defaultValue="py"
        useKeyboard={mockUseKeyboard}
        onSubmit={(value) => { submitted = value }}
      />,
      { cols: 40, rows: 10 },
    )
    savedHandler!({ name: "return" })
    expect(submitted).toBe("py")
  })

  it("submits with enter (controlled)", () => {
    let submitted = null as string | null
    let savedHandler: ((event: any) => void) | null = null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <SelectInput
        items={items}
        value="rs"
        useKeyboard={mockUseKeyboard}
        onSubmit={(value) => { submitted = value }}
      />,
      { cols: 40, rows: 10 },
    )
    savedHandler!({ name: "return" })
    expect(submitted).toBe("rs")
  })

  it("ignores keys when disabled", () => {
    let changed = null as string | null
    let savedHandler: ((event: any) => void) | null = null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <SelectInput
        items={items}
        value="ts"
        onChange={(value) => { changed = value }}
        disabled
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    savedHandler!({ name: "down" })
    expect(changed).toBeNull()
  })

  it("skips disabled items on move", () => {
    const disabledItems = [
      { label: "TypeScript", value: "ts" },
      { label: "JavaScript", value: "js", disabled: true },
      { label: "Python", value: "py" },
    ]
    let changed = null as string | null
    let savedHandler: ((event: any) => void) | null = null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <SelectInput
        items={disabledItems}
        value="ts"
        onChange={(value) => { changed = value }}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    // Move down — should skip disabled "js" and land on "py"
    savedHandler!({ name: "down" })
    expect(changed).toBe("py")
  })

  // ── j/k navigation ──────────────────────────────────────────────────

  it("selects on j key (move down)", () => {
    let changed = null as string | null
    let savedHandler: ((event: any) => void) | null = null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <SelectInput
        items={items}
        value="ts"
        onChange={(value) => { changed = value }}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    savedHandler!({ name: "j" })
    expect(changed).toBe("js")
  })

  it("selects on k key (move up)", () => {
    let changed = null as string | null
    let savedHandler: ((event: any) => void) | null = null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    renderTui(
      <SelectInput
        items={items}
        value="ts"
        onChange={(value) => { changed = value }}
        useKeyboard={mockUseKeyboard}
      />,
      { cols: 40, rows: 10 },
    )
    savedHandler!({ name: "k" })
    expect(changed).toBe("rs")
  })

  // ── Submitted state ─────────────────────────────────────────────────

  it("renders submitted state after enter", () => {
    let savedHandler: ((event: any) => void) | null = null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    const { screen, rerender } = renderTui(
      <SelectInput
        items={items}
        useKeyboard={mockUseKeyboard}
        onSubmit={() => {}}
      />,
      { cols: 40, rows: 10 },
    )
    savedHandler!({ name: "return" })
    rerender(
      <SelectInput
        items={items}
        useKeyboard={mockUseKeyboard}
        onSubmit={() => {}}
      />,
    )
    const text = screen.text()
    expect(text).toContain("submitted")
    expect(text).toContain("●")
  })

  it("ignores keys after submission", () => {
    let changed = null as string | null
    let savedHandler: ((event: any) => void) | null = null
    const mockUseKeyboard = (handler: (event: any) => void) => { savedHandler = handler }
    const props = {
      items,
      value: "ts" as const,
      onChange: (value: string) => { changed = value },
      useKeyboard: mockUseKeyboard,
      onSubmit: () => {},
    }
    const { rerender } = renderTui(
      <SelectInput {...props} />,
      { cols: 40, rows: 10 },
    )
    savedHandler!({ name: "return" })
    // Re-render to flush submitted state into ref
    rerender(<SelectInput {...props} />)
    savedHandler!({ name: "down" })
    expect(changed).toBeNull()
  })

  // ── Scroll windowing ────────────────────────────────────────────────

  it("limits visible rows via limit prop", () => {
    const manyItems = Array.from({ length: 20 }, (_, i) => ({
      label: `Item ${i}`,
      value: `item-${i}`,
    }))
    const { screen } = renderTui(
      <SelectInput items={manyItems} limit={5} />,
      { cols: 40, rows: 20 },
    )
    const text = screen.text()
    // Should show at most 5 items, not all 20
    const itemMatches = text.match(/Item \d+/g) ?? []
    expect(itemMatches.length).toBeLessThanOrEqual(5)
  })
})

// ── Target API (focusId + useInteractive) — Phase 2 migration ───────────
// These tests fail on current SelectInput because it doesn't yet accept
// focusId/autoFocus. They drive the migration to useInteractive.

function flush2(flush: () => void) {
  flush()
  flush()
}

describe("SelectInput via useInteractive (target API)", () => {
  it("routes arrow keys via the focus system when selected", () => {
    let changed: string | null = null
    const { keys, flush } = renderTui(
      <FocusProvider selectable>
        <SelectInput
          focusId="lang"
          autoFocus
          items={items}
          value="ts"
          onChange={(v) => {
            changed = v
          }}
        />
      </FocusProvider>,
      { cols: 40, rows: 10 },
    )
    flush2(flush)

    // Focused but not selected — arrow should NOT move the cursor
    keys.down()
    flush2(flush)
    expect(changed).toBeNull()

    // Enter to select, then ArrowDown should move
    keys.enter()
    flush2(flush)
    keys.down()
    flush2(flush)
    expect(changed).toBe("js")
  })

  it("mounts inside a FocusProvider with an auto-generated focusId", () => {
    const { screen, flush } = renderTui(
      <FocusProvider selectable>
        <SelectInput items={items} />
      </FocusProvider>,
      { cols: 40, rows: 10 },
    )
    flush2(flush)
    // Just: the component rendered successfully
    expect(screen.text()).toContain("TypeScript")
  })

  it("registers shortcut hints that reflect focused vs selected state", () => {
    function Sink() {
      const s = useFocusedShortcuts()
      return <text>{`hint:${s.map((e) => e.label).join("+")}:end`}</text>
    }
    const { screen, keys, flush } = renderTui(
      <FocusProvider selectable>
        <SelectInput focusId="lang" autoFocus items={items} />
        <Sink />
      </FocusProvider>,
      { cols: 60, rows: 12 },
    )
    flush2(flush)
    // Focused (not selected) — hints describe entering the component
    expect(screen.text()).toMatch(/hint:.*navigate.*select.*:end/)

    keys.enter()
    flush2(flush)
    // Selected — hints describe moving / submitting / exiting
    expect(screen.text()).toMatch(/hint:.*move.*submit.*back.*:end/)
  })
})

