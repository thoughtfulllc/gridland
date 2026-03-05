// @ts-nocheck
import { describe, it, expect } from "bun:test"
import { CornerRibbon, BadgeButton, TextBadge } from "./made-with-opentui"

describe("CornerRibbon", () => {
  it("exports CornerRibbon function", () => {
    expect(typeof CornerRibbon).toBe("function")
  })

  it("renders with fixed positioning by default", () => {
    const el = CornerRibbon({})
    expect(el.props.style.position).toBe("fixed")
  })

  it("renders with absolute positioning when absolute=true", () => {
    const el = CornerRibbon({ absolute: true })
    expect(el.props.style.position).toBe("absolute")
  })

  it("positions in top-right by default", () => {
    const el = CornerRibbon({})
    expect(el.props.style.top).toBe(0)
    expect(el.props.style.right).toBe(0)
  })

  it("positions in top-left", () => {
    const el = CornerRibbon({ position: "top-left" })
    expect(el.props.style.top).toBe(0)
    expect(el.props.style.left).toBe(0)
  })

  it("positions in bottom-right", () => {
    const el = CornerRibbon({ position: "bottom-right" })
    expect(el.props.style.bottom).toBe(0)
    expect(el.props.style.right).toBe(0)
  })

  it("positions in bottom-left", () => {
    const el = CornerRibbon({ position: "bottom-left" })
    expect(el.props.style.bottom).toBe(0)
    expect(el.props.style.left).toBe(0)
  })

  it("has z-index 9999", () => {
    const el = CornerRibbon({})
    expect(el.props.style.zIndex).toBe(9999)
  })

  it("has pointer-events none on container", () => {
    const el = CornerRibbon({})
    expect(el.props.style.pointerEvents).toBe("none")
  })

  it("renders link to opentui.dev", () => {
    const el = CornerRibbon({})
    const link = el.props.children
    expect(link.props.href).toBe("https://opentui.dev")
    expect(link.props.target).toBe("_blank")
    expect(link.props.rel).toBe("noopener noreferrer")
  })

  it("link has pointer-events auto", () => {
    const el = CornerRibbon({})
    const link = el.props.children
    expect(link.props.style.pointerEvents).toBe("auto")
  })

  it("applies className to link", () => {
    const el = CornerRibbon({ className: "custom" })
    const link = el.props.children
    expect(link.props.className).toContain("custom")
  })

  it("link contains correct text", () => {
    const el = CornerRibbon({})
    const link = el.props.children
    expect(link.props.children).toBe("made with opentui")
  })
})

describe("BadgeButton", () => {
  it("exports BadgeButton function", () => {
    expect(typeof BadgeButton).toBe("function")
  })

  it("renders a link to opentui.dev", () => {
    const el = BadgeButton({})
    expect(el.props.href).toBe("https://opentui.dev")
    expect(el.props.target).toBe("_blank")
    expect(el.props.rel).toBe("noopener noreferrer")
  })

  it("renders >_ icon and text", () => {
    const el = BadgeButton({})
    const children = el.props.children
    expect(children[0].props.children).toBe(">_")
    expect(children[1].props.children).toBe("made with opentui")
  })

  it("uses dark variant by default", () => {
    const el = BadgeButton({})
    expect(el.props.className).toContain("bg-black")
  })

  it("uses light variant", () => {
    const el = BadgeButton({ variant: "light" })
    expect(el.props.className).toContain("bg-white")
  })

  it("uses outline variant", () => {
    const el = BadgeButton({ variant: "outline" })
    expect(el.props.className).toContain("bg-transparent")
  })

  it("applies className", () => {
    const el = BadgeButton({ className: "extra" })
    expect(el.props.className).toContain("extra")
  })
})

describe("TextBadge", () => {
  it("exports TextBadge function", () => {
    expect(typeof TextBadge).toBe("function")
  })

  it("renders a link to opentui.dev", () => {
    const el = TextBadge({})
    expect(el.props.href).toBe("https://opentui.dev")
    expect(el.props.target).toBe("_blank")
    expect(el.props.rel).toBe("noopener noreferrer")
  })

  it("renders >_ and text", () => {
    const el = TextBadge({})
    const children = el.props.children
    expect(children[0].props.children).toBe(">_")
    expect(children[1].props.children).toBe("made with opentui")
  })

  it("has opacity-50 class", () => {
    const el = TextBadge({})
    expect(el.props.className).toContain("opacity-50")
  })

  it("applies className", () => {
    const el = TextBadge({ className: "my-class" })
    expect(el.props.className).toContain("my-class")
  })
})
