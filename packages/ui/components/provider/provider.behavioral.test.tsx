// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { useInteractive } from "@gridland/utils"
import { renderTui, cleanup } from "../../../testing/src/index"
import { GridlandProvider } from "./provider"
import { useTheme } from "@/registry/gridland/lib/theme"

afterEach(() => cleanup())

function ThemeConsumer() {
  const theme = useTheme()
  return <text>{`primary:${theme.primary}`}</text>
}

function FocusConsumer({ id, autoFocus }: { id: string; autoFocus?: boolean }) {
  const { isFocused } = useInteractive({ id, autoFocus })
  return <text>{isFocused ? `[${id}:FOCUSED]` : `[${id}]`}</text>
}

describe("GridlandProvider behavior", () => {
  // ── Theme ─────────────────────────────────────────────────────────

  it("wraps with ThemeProvider when theme is provided", () => {
    const customTheme = { primary: "#FF0000" } as any
    const { screen } = renderTui(
      <GridlandProvider theme={customTheme}>
        <ThemeConsumer />
      </GridlandProvider>,
      { cols: 40, rows: 5 },
    )
    expect(screen.text()).toContain("primary:#FF0000")
  })

  // ── Children ──────────────────────────────────────────────────────

  it("renders children", () => {
    const { screen } = renderTui(
      <GridlandProvider>
        <text>hello world</text>
      </GridlandProvider>,
      { cols: 40, rows: 5 },
    )
    expect(screen.text()).toContain("hello world")
  })

  // ── Implicit FocusProvider (Phase 4 migration) ──────────────────

  it("wraps children in an implicit FocusProvider", () => {
    const { screen, flush } = renderTui(
      <GridlandProvider>
        <FocusConsumer id="a" autoFocus />
      </GridlandProvider>,
      { cols: 40, rows: 5 },
    )
    flush(); flush()
    // autoFocus only works when a FocusProvider is present in the tree.
    // This test fails if GridlandProvider doesn't wrap in one implicitly.
    expect(screen.text()).toContain("[a:FOCUSED]")
  })

  it("disableFocusProvider={true} disables the implicit wrap", () => {
    const { screen, flush } = renderTui(
      <GridlandProvider disableFocusProvider>
        <FocusConsumer id="a" autoFocus />
      </GridlandProvider>,
      { cols: 40, rows: 5 },
    )
    flush(); flush()
    // Without the wrapper, useInteractive dispatches land on the default noop
    // store, so autoFocus is a no-op and the component stays unfocused.
    expect(screen.text()).not.toContain("[a:FOCUSED]")
    expect(screen.text()).toContain("[a]")
  })
})
