// @ts-nocheck
import { describe, it, expect } from "bun:test"
import { createElement } from "react"
import { MacWindow } from "./mac-window"

describe("MacWindow", () => {
  it("exports MacWindow function", () => {
    expect(typeof MacWindow).toBe("function")
  })

  it("returns a valid element with children", () => {
    const el = MacWindow({
      children: createElement("div", null, "Hello"),
    })
    expect(el).toBeDefined()
    expect(el.props.className).toContain("rounded-2xl")
    expect(el.props.className).toContain("border")
    expect(el.props.className).toContain("shadow-lg")
  })

  it("includes title in output when provided", () => {
    const el = MacWindow({
      children: createElement("div", null, "Content"),
      title: "My Terminal",
    })
    // The element tree should contain title text
    const titleBar = el.props.children[0] // title bar div
    expect(titleBar).toBeDefined()
  })

  it("applies className", () => {
    const el = MacWindow({
      children: createElement("div", null, "Content"),
      className: "custom-class",
    })
    expect(el.props.className).toContain("custom-class")
  })

  it("applies minWidth style", () => {
    const el = MacWindow({
      children: createElement("div", null, "Content"),
      minWidth: 400,
    })
    expect(el.props.style).toEqual({ minWidth: 400 })
  })

  it("does not apply style when minWidth is not provided", () => {
    const el = MacWindow({
      children: createElement("div", null, "Content"),
    })
    expect(el.props.style).toBeUndefined()
  })

  it("renders three traffic light buttons", () => {
    const el = MacWindow({
      children: createElement("div", null, "Content"),
    })
    const titleBar = el.props.children[0]
    const buttonsContainer = titleBar.props.children[0]
    const buttons = buttonsContainer.props.children
    expect(buttons).toHaveLength(3)
  })

  it("buttons have correct aria labels", () => {
    const el = MacWindow({
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
    const el = MacWindow({
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
    const el = MacWindow({
      children: createElement("div", null, "Content"),
      onClose,
    })
    const titleBar = el.props.children[0]
    const buttonsContainer = titleBar.props.children[0]
    expect(buttonsContainer.props.children[0].props.onClick).toBe(onClose)
  })

  it("does not render title element when title is omitted", () => {
    const el = MacWindow({
      children: createElement("div", null, "Content"),
    })
    const titleBar = el.props.children[0]
    // title is the second child; when omitted it's false/undefined
    expect(titleBar.props.children[1]).toBeFalsy()
  })

  it("renders title element when title is provided", () => {
    const el = MacWindow({
      children: createElement("div", null, "Content"),
      title: "Test",
    })
    const titleBar = el.props.children[0]
    const titleEl = titleBar.props.children[1]
    expect(titleEl).toBeTruthy()
    expect(titleEl.props.children).toBe("Test")
  })
})
