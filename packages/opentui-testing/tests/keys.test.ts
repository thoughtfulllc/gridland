import { describe, it, expect } from "bun:test"
import { KeySender } from "../src/keys"
import { BrowserRenderContext } from "../../opentui-web/src/browser-render-context"

describe("KeySender", () => {
  function setup() {
    const ctx = new BrowserRenderContext(80, 24)
    const keys = new KeySender(ctx)
    const received: any[] = []
    ctx.keyInput.on("keypress", (event: any) => {
      received.push(event)
    })
    return { keys, received, ctx }
  }

  it("press sends a character key", () => {
    const { keys, received } = setup()
    keys.press("a")
    expect(received.length).toBe(1)
    expect(received[0].name).toBe("a")
  })

  it("type sends multiple characters", () => {
    const { keys, received } = setup()
    keys.type("abc")
    expect(received.length).toBe(3)
    expect(received[0].name).toBe("a")
    expect(received[1].name).toBe("b")
    expect(received[2].name).toBe("c")
  })

  it("enter sends return", () => {
    const { keys, received } = setup()
    keys.enter()
    expect(received[0].name).toBe("return")
  })

  it("escape sends escape", () => {
    const { keys, received } = setup()
    keys.escape()
    expect(received[0].name).toBe("escape")
  })

  it("tab sends tab", () => {
    const { keys, received } = setup()
    keys.tab()
    expect(received[0].name).toBe("tab")
  })

  it("arrow keys send correct names", () => {
    const { keys, received } = setup()
    keys.up()
    keys.down()
    keys.left()
    keys.right()
    expect(received.map((r: any) => r.name)).toEqual(["up", "down", "left", "right"])
  })

  it("backspace sends backspace", () => {
    const { keys, received } = setup()
    keys.backspace()
    expect(received[0].name).toBe("backspace")
  })

  it("delete sends delete", () => {
    const { keys, received } = setup()
    keys.delete()
    expect(received[0].name).toBe("delete")
  })

  it("space sends space", () => {
    const { keys, received } = setup()
    keys.space()
    expect(received[0].name).toBe("space")
  })

  it("home and end", () => {
    const { keys, received } = setup()
    keys.home()
    keys.end()
    expect(received[0].name).toBe("home")
    expect(received[1].name).toBe("end")
  })

  it("pageUp and pageDown", () => {
    const { keys, received } = setup()
    keys.pageUp()
    keys.pageDown()
    expect(received[0].name).toBe("pageup")
    expect(received[1].name).toBe("pagedown")
  })

  it("sends to both keyInput and _internalKeyInput", () => {
    const ctx = new BrowserRenderContext(80, 24)
    const keys = new KeySender(ctx)
    const external: any[] = []
    const internal: any[] = []
    ctx.keyInput.on("keypress", (e: any) => external.push(e))
    ctx._internalKeyInput.on("keypress", (e: any) => internal.push(e))

    keys.press("x")
    expect(external.length).toBe(1)
    expect(internal.length).toBe(1)
  })
})
