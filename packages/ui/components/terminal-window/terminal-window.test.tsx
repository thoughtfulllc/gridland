import { describe, it, expect } from "bun:test"
import { createElement } from "react"
import { TerminalWindow } from "./terminal-window"

describe("TerminalWindow", () => {
  it("exports TerminalWindow function", () => {
    expect(typeof TerminalWindow).toBe("function")
  })

  it("returns a valid element with children", () => {
    const el = TerminalWindow({
      children: createElement("div", null, "Hello"),
    })
    expect(el).toBeDefined()
    expect(el.props.className).toContain("rounded-2xl")
    expect(el.props.className).toContain("shadow-lg")
  })

  it("includes title in output when provided", () => {
    const el = TerminalWindow({
      children: createElement("div", null, "Content"),
      title: "My Terminal",
    })
    const titleBar = el.props.children[0]
    expect(titleBar).toBeDefined()
  })

  it("applies className", () => {
    const el = TerminalWindow({
      children: createElement("div", null, "Content"),
      className: "custom-class",
    })
    expect(el.props.className).toContain("custom-class")
  })

  it("applies minWidth style", () => {
    const el = TerminalWindow({
      children: createElement("div", null, "Content"),
      minWidth: 400,
    })
    expect(el.props.style.minWidth).toBe(400)
  })

  it("has dark background by default", () => {
    const el = TerminalWindow({
      children: createElement("div", null, "Content"),
    })
    expect(el.props.style.backgroundColor).toBe("#1e1e2e")
  })

  it("has no background when transparent", () => {
    const el = TerminalWindow({
      children: createElement("div", null, "Content"),
      transparent: true,
    })
    expect(el.props.style.backgroundColor).toBeUndefined()
  })

  it("renders three traffic light buttons", () => {
    const el = TerminalWindow({
      children: createElement("div", null, "Content"),
    })
    const titleBar = el.props.children[0]
    const buttonsContainer = titleBar.props.children[0]
    const buttons = buttonsContainer.props.children
    expect(buttons).toHaveLength(3)
  })

  it("buttons have correct aria labels", () => {
    const el = TerminalWindow({
      children: createElement("div", null, "Content"),
    })
    const titleBar = el.props.children[0]
    const buttonsContainer = titleBar.props.children[0]
    const buttons = buttonsContainer.props.children
    expect(buttons[0].props["aria-label"]).toBe("Close")
    expect(buttons[1].props["aria-label"]).toBe("Minimize")
    expect(buttons[2].props["aria-label"]).toBe("Maximize")
  })

  it("buttons have type=button", () => {
    const el = TerminalWindow({
      children: createElement("div", null, "Content"),
    })
    const titleBar = el.props.children[0]
    const buttonsContainer = titleBar.props.children[0]
    const buttons = buttonsContainer.props.children
    expect(buttons[0].props.type).toBe("button")
    expect(buttons[1].props.type).toBe("button")
    expect(buttons[2].props.type).toBe("button")
  })

  it("passes onClose to close button", () => {
    const onClose = () => {}
    const el = TerminalWindow({
      children: createElement("div", null, "Content"),
      onClose,
    })
    const titleBar = el.props.children[0]
    const buttonsContainer = titleBar.props.children[0]
    expect(buttonsContainer.props.children[0].props.onClick).toBe(onClose)
  })

  it("does not render title element when title is omitted", () => {
    const el = TerminalWindow({
      children: createElement("div", null, "Content"),
    })
    const titleBar = el.props.children[0]
    expect(titleBar.props.children[1]).toBeFalsy()
  })

  it("renders title element when title is provided", () => {
    const el = TerminalWindow({
      children: createElement("div", null, "Content"),
      title: "Test",
    })
    const titleBar = el.props.children[0]
    const titleEl = titleBar.props.children[1]
    expect(titleEl).toBeTruthy()
    expect(titleEl.props.children).toBe("Test")
  })
})
