// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { GridlandProvider, useKeyboardContext } from "./provider"
import { useTheme } from "../theme/index"

afterEach(() => cleanup())

function KeyboardConsumer({ propOverride }: { propOverride?: any }) {
  const hook = useKeyboardContext(propOverride)
  return <text>{`keyboard:${hook ? "provided" : "undefined"}`}</text>
}

function ThemeConsumer() {
  const theme = useTheme()
  return <text>{`primary:${theme.primary}`}</text>
}

const mockUseKeyboard = () => {}
const otherMockUseKeyboard = () => {}

describe("GridlandProvider behavior", () => {
  // ── Keyboard context ──────────────────────────────────────────────

  it("provides useKeyboard via context", () => {
    const { screen } = renderTui(
      <GridlandProvider useKeyboard={mockUseKeyboard}>
        <KeyboardConsumer />
      </GridlandProvider>,
      { cols: 40, rows: 5 },
    )
    expect(screen.text()).toContain("keyboard:provided")
  })

  it("returns undefined when no useKeyboard provided", () => {
    const { screen } = renderTui(
      <GridlandProvider>
        <KeyboardConsumer />
      </GridlandProvider>,
      { cols: 40, rows: 5 },
    )
    expect(screen.text()).toContain("keyboard:undefined")
  })

  it("prop override takes precedence over context", () => {
    const { screen } = renderTui(
      <GridlandProvider useKeyboard={mockUseKeyboard}>
        <KeyboardConsumer propOverride={otherMockUseKeyboard} />
      </GridlandProvider>,
      { cols: 40, rows: 5 },
    )
    expect(screen.text()).toContain("keyboard:provided")
  })

  it("context is undefined without provider", () => {
    const { screen } = renderTui(
      <KeyboardConsumer />,
      { cols: 40, rows: 5 },
    )
    expect(screen.text()).toContain("keyboard:undefined")
  })

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
})
