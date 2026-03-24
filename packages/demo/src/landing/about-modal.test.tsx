// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { AboutModal } from "./about-modal"

afterEach(() => cleanup())

describe("AboutModal", () => {
  it("renders the title", () => {
    const mockUseKeyboard = () => {}
    const { screen } = renderTui(
      <AboutModal onClose={() => {}} useKeyboard={mockUseKeyboard} />,
      { cols: 60, rows: 20 },
    )
    expect(screen.text()).toContain("About Gridland")
  })

  it("renders 'What is Gridland?' section", () => {
    const mockUseKeyboard = () => {}
    const { screen } = renderTui(
      <AboutModal onClose={() => {}} useKeyboard={mockUseKeyboard} />,
      { cols: 60, rows: 20 },
    )
    expect(screen.text()).toContain("What is Gridland?")
  })

  it("renders Features section", () => {
    const mockUseKeyboard = () => {}
    const { screen } = renderTui(
      <AboutModal onClose={() => {}} useKeyboard={mockUseKeyboard} />,
      { cols: 60, rows: 20 },
    )
    expect(screen.text()).toContain("Features")
    expect(screen.text()).toContain("Canvas-rendered TUI components")
  })

  it("renders Tech Stack section", () => {
    const mockUseKeyboard = () => {}
    const { screen } = renderTui(
      <AboutModal onClose={() => {}} useKeyboard={mockUseKeyboard} />,
      { cols: 60, rows: 20 },
    )
    expect(screen.text()).toContain("Tech Stack")
    expect(screen.text()).toContain("yoga-layout")
  })

  it("shows 'Press q to close'", () => {
    const mockUseKeyboard = () => {}
    const { screen } = renderTui(
      <AboutModal onClose={() => {}} useKeyboard={mockUseKeyboard} />,
      { cols: 60, rows: 20 },
    )
    expect(screen.text()).toContain("Press q to close")
  })

  it("calls onClose when escape is pressed via modal", () => {
    let closed = false
    let savedHandler: any = null
    const mockUseKeyboard = (handler: any) => { savedHandler = handler }
    const tui = renderTui(
      <AboutModal onClose={() => { closed = true }} useKeyboard={mockUseKeyboard} />,
      { cols: 60, rows: 20 },
    )
    savedHandler({ name: "escape" })
    tui.flush()
    expect(closed).toBe(true)
  })

  it("lists all expected feature bullets", () => {
    const mockUseKeyboard = () => {}
    const { screen } = renderTui(
      <AboutModal onClose={() => {}} useKeyboard={mockUseKeyboard} />,
      { cols: 60, rows: 20 },
    )
    expect(screen.text()).toContain("React reconciler with JSX")
    expect(screen.text()).toContain("Yoga flexbox layout engine")
    expect(screen.text()).toContain("Keyboard, mouse, and clipboard support")
    expect(screen.text()).toContain("Next.js and Vite plugins")
  })
})
