import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { useFocusBorderStyle, useFocusDividerStyle } from "./use-focus-styles"
import { ThemeProvider } from "./theme-context"
import { darkTheme } from "./themes"
import type { Theme } from "./types"

afterEach(() => cleanup())

function BorderStyleDisplay(props: { isFocused: boolean; isSelected: boolean; isAnySelected: boolean }) {
  const { borderColor, borderStyle } = useFocusBorderStyle(props)
  return <text>{`borderColor:${borderColor} borderStyle:${borderStyle}`}</text>
}

function DividerStyleDisplay(props: { isFocused: boolean; isSelected: boolean; isAnySelected: boolean }) {
  const { dividerColor, dividerDashed } = useFocusDividerStyle(props)
  return <text>{`dividerColor:${dividerColor} dividerDashed:${dividerDashed}`}</text>
}

describe("useFocusBorderStyle", () => {
  it("returns selected color with rounded style when selected", () => {
    const { screen } = renderTui(
      <BorderStyleDisplay isFocused={true} isSelected={true} isAnySelected={true} />,
      { cols: 60, rows: 5 },
    )
    expect(screen.text()).toContain(`borderColor:${darkTheme.focusSelected}`)
    expect(screen.text()).toContain("borderStyle:rounded")
  })

  it("returns transparent when a sibling is selected", () => {
    const { screen } = renderTui(
      <BorderStyleDisplay isFocused={false} isSelected={false} isAnySelected={true} />,
      { cols: 60, rows: 5 },
    )
    expect(screen.text()).toContain("borderColor:transparent")
    expect(screen.text()).toContain("borderStyle:rounded")
  })

  it("returns focused color with dashed style when focused", () => {
    const { screen } = renderTui(
      <BorderStyleDisplay isFocused={true} isSelected={false} isAnySelected={false} />,
      { cols: 60, rows: 5 },
    )
    expect(screen.text()).toContain(`borderColor:${darkTheme.focusFocused}`)
    expect(screen.text()).toContain("borderStyle:dashed")
  })

  it("returns idle color with rounded style when idle", () => {
    const { screen } = renderTui(
      <BorderStyleDisplay isFocused={false} isSelected={false} isAnySelected={false} />,
      { cols: 60, rows: 5 },
    )
    expect(screen.text()).toContain(`borderColor:${darkTheme.focusIdle}`)
    expect(screen.text()).toContain("borderStyle:rounded")
  })

  it("reads colors from a custom theme", () => {
    const custom: Theme = { ...darkTheme, focusSelected: "#AA0000" }
    const { screen } = renderTui(
      <ThemeProvider theme={custom}>
        <BorderStyleDisplay isFocused={true} isSelected={true} isAnySelected={true} />
      </ThemeProvider>,
      { cols: 60, rows: 5 },
    )
    expect(screen.text()).toContain("borderColor:#AA0000")
  })
})

describe("useFocusDividerStyle", () => {
  it("returns selected color when selected", () => {
    const { screen } = renderTui(
      <DividerStyleDisplay isFocused={true} isSelected={true} isAnySelected={true} />,
      { cols: 60, rows: 5 },
    )
    expect(screen.text()).toContain(`dividerColor:${darkTheme.focusSelected}`)
    expect(screen.text()).toContain("dividerDashed:false")
  })

  it("returns undefined color when a sibling is selected", () => {
    const { screen } = renderTui(
      <DividerStyleDisplay isFocused={false} isSelected={false} isAnySelected={true} />,
      { cols: 60, rows: 5 },
    )
    expect(screen.text()).toContain("dividerColor:undefined")
    expect(screen.text()).toContain("dividerDashed:false")
  })

  it("returns focused color with dashed when focused", () => {
    const { screen } = renderTui(
      <DividerStyleDisplay isFocused={true} isSelected={false} isAnySelected={false} />,
      { cols: 60, rows: 5 },
    )
    expect(screen.text()).toContain(`dividerColor:${darkTheme.focusFocused}`)
    expect(screen.text()).toContain("dividerDashed:true")
  })

  it("returns idle color when idle", () => {
    const { screen } = renderTui(
      <DividerStyleDisplay isFocused={false} isSelected={false} isAnySelected={false} />,
      { cols: 60, rows: 5 },
    )
    expect(screen.text()).toContain(`dividerColor:${darkTheme.focusIdle}`)
    expect(screen.text()).toContain("dividerDashed:false")
  })

  it("reads colors from a custom theme", () => {
    const custom: Theme = { ...darkTheme, focusIdle: "#CC0000" }
    const { screen } = renderTui(
      <ThemeProvider theme={custom}>
        <DividerStyleDisplay isFocused={false} isSelected={false} isAnySelected={false} />
      </ThemeProvider>,
      { cols: 60, rows: 5 },
    )
    expect(screen.text()).toContain("dividerColor:#CC0000")
  })
})
