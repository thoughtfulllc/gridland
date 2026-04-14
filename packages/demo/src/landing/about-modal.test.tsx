// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { FocusProvider } from "@gridland/utils"
import { renderTui, cleanup } from "../../../testing/src/index"
import { AboutModal } from "./about-modal"

afterEach(() => cleanup())

describe("AboutModal", () => {
  it("renders the title", () => {
    const { screen } = renderTui(
      <FocusProvider><AboutModal onClose={() => {}} /></FocusProvider>,
      { cols: 60, rows: 20 },
    )
    expect(screen.text()).toContain("About Gridland")
  })

  it("renders 'What is Gridland?' section", () => {
    const { screen } = renderTui(
      <FocusProvider><AboutModal onClose={() => {}} /></FocusProvider>,
      { cols: 60, rows: 20 },
    )
    expect(screen.text()).toContain("What is Gridland?")
  })

  it("renders Features section", () => {
    const { screen } = renderTui(
      <FocusProvider><AboutModal onClose={() => {}} /></FocusProvider>,
      { cols: 60, rows: 20 },
    )
    expect(screen.text()).toContain("Features")
    expect(screen.text()).toContain("Canvas-rendered TUI components")
  })

  it("renders Tech Stack section", () => {
    const { screen } = renderTui(
      <FocusProvider><AboutModal onClose={() => {}} /></FocusProvider>,
      { cols: 60, rows: 20 },
    )
    expect(screen.text()).toContain("Tech Stack")
    expect(screen.text()).toContain("yoga-layout")
  })

  it("shows 'Press q to close'", () => {
    const { screen } = renderTui(
      <FocusProvider><AboutModal onClose={() => {}} /></FocusProvider>,
      { cols: 60, rows: 20 },
    )
    expect(screen.text()).toContain("Press q to close")
  })

  it("calls onClose when escape is pressed via modal", () => {
    let closed = false
    const { keys, flush } = renderTui(
      <FocusProvider>
        <AboutModal onClose={() => { closed = true }} />
      </FocusProvider>,
      { cols: 60, rows: 20 },
    )
    flush(); flush()
    keys.escape()
    flush(); flush()
    expect(closed).toBe(true)
  })

  it("lists all expected feature bullets", () => {
    const { screen } = renderTui(
      <FocusProvider><AboutModal onClose={() => {}} /></FocusProvider>,
      { cols: 60, rows: 20 },
    )
    expect(screen.text()).toContain("React reconciler with JSX")
    expect(screen.text()).toContain("Yoga flexbox layout engine")
    expect(screen.text()).toContain("Keyboard, mouse, and clipboard support")
    expect(screen.text()).toContain("Next.js and Vite plugins")
  })
})
