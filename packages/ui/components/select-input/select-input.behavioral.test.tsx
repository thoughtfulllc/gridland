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

  // ── Keyboard interactions — routed via real focus system + key dispatch ──

  function selectAnd(keys: any, flush: () => void) {
    keys.enter()
    flush()
    flush()
  }

  it("selects on move down", () => {
    let changed: string | null = null
    const { keys, flush } = renderTui(
      <FocusProvider selectable>
        <SelectInput
          focusId="s"
          autoFocus
          items={items}
          value="ts"
          onChange={(value) => { changed = value }}
        />
      </FocusProvider>,
      { cols: 40, rows: 10 },
    )
    flush(); flush()
    selectAnd(keys, flush)
    keys.down()
    flush(); flush()
    expect(changed).toBe("js")
  })

  it("selects on move up", () => {
    let changed: string | null = null
    const { keys, flush } = renderTui(
      <FocusProvider selectable>
        <SelectInput
          focusId="s"
          autoFocus
          items={items}
          value="ts"
          onChange={(value) => { changed = value }}
        />
      </FocusProvider>,
      { cols: 40, rows: 10 },
    )
    flush(); flush()
    selectAnd(keys, flush)
    keys.up()
    flush(); flush()
    expect(changed).toBe("rs")
  })

  it("submits with enter (uncontrolled)", () => {
    let submitted: string | null = null
    const { keys, flush } = renderTui(
      <FocusProvider selectable>
        <SelectInput
          focusId="s"
          autoFocus
          items={items}
          defaultValue="py"
          onSubmit={(value) => { submitted = value }}
        />
      </FocusProvider>,
      { cols: 40, rows: 10 },
    )
    flush(); flush()
    selectAnd(keys, flush)
    // Second enter triggers submit via interactive.onKey
    keys.enter()
    flush(); flush()
    expect(submitted).toBe("py")
  })

  it("submits with enter (controlled)", () => {
    let submitted: string | null = null
    const { keys, flush } = renderTui(
      <FocusProvider selectable>
        <SelectInput
          focusId="s"
          autoFocus
          items={items}
          value="rs"
          onSubmit={(value) => { submitted = value }}
        />
      </FocusProvider>,
      { cols: 40, rows: 10 },
    )
    flush(); flush()
    selectAnd(keys, flush)
    keys.enter()
    flush(); flush()
    expect(submitted).toBe("rs")
  })

  it("ignores keys when disabled", () => {
    let changed: string | null = null
    const { keys, flush } = renderTui(
      <FocusProvider selectable>
        <SelectInput
          focusId="s"
          autoFocus
          items={items}
          value="ts"
          disabled
          onChange={(value) => { changed = value }}
        />
      </FocusProvider>,
      { cols: 40, rows: 10 },
    )
    flush(); flush()
    // disabled => not in tab cycle, autoFocus is a no-op, Enter cannot select,
    // onKey never fires, onChange stays null
    keys.enter()
    flush(); flush()
    keys.down()
    flush(); flush()
    expect(changed).toBeNull()
  })

  it("skips disabled items on move", () => {
    const disabledItems = [
      { label: "TypeScript", value: "ts" },
      { label: "JavaScript", value: "js", disabled: true },
      { label: "Python", value: "py" },
    ]
    let changed: string | null = null
    const { keys, flush } = renderTui(
      <FocusProvider selectable>
        <SelectInput
          focusId="s"
          autoFocus
          items={disabledItems}
          value="ts"
          onChange={(value) => { changed = value }}
        />
      </FocusProvider>,
      { cols: 40, rows: 10 },
    )
    flush(); flush()
    selectAnd(keys, flush)
    keys.down()
    flush(); flush()
    expect(changed).toBe("py")
  })

  // ── j/k navigation ──────────────────────────────────────────────────

  it("selects on j key (move down)", () => {
    let changed: string | null = null
    const { keys, flush } = renderTui(
      <FocusProvider selectable>
        <SelectInput
          focusId="s"
          autoFocus
          items={items}
          value="ts"
          onChange={(value) => { changed = value }}
        />
      </FocusProvider>,
      { cols: 40, rows: 10 },
    )
    flush(); flush()
    selectAnd(keys, flush)
    keys.press("j")
    flush(); flush()
    expect(changed).toBe("js")
  })

  it("selects on k key (move up)", () => {
    let changed: string | null = null
    const { keys, flush } = renderTui(
      <FocusProvider selectable>
        <SelectInput
          focusId="s"
          autoFocus
          items={items}
          value="ts"
          onChange={(value) => { changed = value }}
        />
      </FocusProvider>,
      { cols: 40, rows: 10 },
    )
    flush(); flush()
    selectAnd(keys, flush)
    keys.press("k")
    flush(); flush()
    expect(changed).toBe("rs")
  })

  // ── Submitted state ─────────────────────────────────────────────────

  it("renders submitted state after enter", () => {
    // Note: we use rerender instead of flush after the submit because
    // useReducer updates dispatched from inside a keyHandler listener
    // don't commit on a subsequent flushSync with an empty callback —
    // rerender forces root.render which re-commits and picks them up.
    const tree = (
      <FocusProvider selectable>
        <SelectInput
          focusId="s"
          autoFocus
          items={items}
          onSubmit={() => {}}
        />
      </FocusProvider>
    )
    const { screen, keys, flush, rerender } = renderTui(tree, { cols: 40, rows: 10 })
    flush(); flush()
    selectAnd(keys, flush)
    keys.enter() // submit
    rerender(tree)
    const text = screen.text()
    expect(text).toContain("submitted")
    expect(text).toContain("●")
  })

  it("ignores keys after submission", () => {
    let changed: string | null = null
    const tree = (
      <FocusProvider selectable>
        <SelectInput
          focusId="s"
          autoFocus
          items={items}
          value="ts"
          onChange={(value) => { changed = value }}
          onSubmit={() => {}}
        />
      </FocusProvider>
    )
    const { keys, flush, rerender } = renderTui(tree, { cols: 40, rows: 10 })
    flush(); flush()
    selectAnd(keys, flush)
    keys.enter() // submit
    rerender(tree) // force state commit so submittedRef.current becomes true
    keys.down() // should be ignored
    flush(); flush()
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

