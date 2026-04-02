// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import { useBreakpoints, BREAKPOINTS } from "./use-breakpoints"

afterEach(() => cleanup())

function BreakpointDisplay() {
  const bp = useBreakpoints()
  return (
    <text>{`tiny:${bp.isTiny} narrow:${bp.isNarrow} mobile:${bp.isMobile} desktop:${bp.isDesktop} w:${bp.width} h:${bp.height}`}</text>
  )
}

describe("useBreakpoints behavior", () => {
  it("returns isTiny=true when width < 40", () => {
    const { screen } = renderTui(<BreakpointDisplay />, { cols: 30, rows: 5 })
    expect(screen.text()).toContain("tiny:true")
  })

  it("returns isTiny=false when width >= 40", () => {
    const { screen } = renderTui(<BreakpointDisplay />, { cols: 40, rows: 5 })
    expect(screen.text()).toContain("tiny:false")
  })

  it("returns isNarrow=true when width < 60", () => {
    const { screen } = renderTui(<BreakpointDisplay />, { cols: 50, rows: 5 })
    expect(screen.text()).toContain("narrow:true")
  })

  it("returns isNarrow=false when width >= 60", () => {
    const { screen } = renderTui(<BreakpointDisplay />, { cols: 60, rows: 5 })
    expect(screen.text()).toContain("narrow:false")
  })

  it("returns isMobile=true when width < 70", () => {
    const { screen } = renderTui(<BreakpointDisplay />, { cols: 65, rows: 5 })
    expect(screen.text()).toContain("mobile:true")
  })

  it("returns isDesktop=true when width >= 70", () => {
    const { screen } = renderTui(<BreakpointDisplay />, { cols: 70, rows: 5 })
    expect(screen.text()).toContain("desktop:true")
  })

  it("returns isDesktop=false when width < 70", () => {
    const { screen } = renderTui(<BreakpointDisplay />, { cols: 69, rows: 5 })
    expect(screen.text()).toContain("desktop:false")
  })

  it("returns correct width and height", () => {
    const { screen } = renderTui(<BreakpointDisplay />, { cols: 80, rows: 24 })
    expect(screen.text()).toContain("w:80")
    expect(screen.text()).toContain("h:24")
  })

  it("all breakpoint flags true at very small width", () => {
    const { screen } = renderTui(<BreakpointDisplay />, { cols: 20, rows: 5 })
    const text = screen.text()
    expect(text).toContain("tiny:true")
    expect(text).toContain("narrow:true")
    expect(text).toContain("mobile:true")
    expect(text).toContain("desktop:false")
  })

  it("only desktop true at large width", () => {
    const { screen } = renderTui(<BreakpointDisplay />, { cols: 100, rows: 30 })
    const text = screen.text()
    expect(text).toContain("tiny:false")
    expect(text).toContain("narrow:false")
    expect(text).toContain("mobile:false")
    expect(text).toContain("desktop:true")
  })
})
