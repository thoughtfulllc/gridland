import { describe, it, expect } from "bun:test"
import { waitFor } from "../src/wait-for"
import { Screen } from "../src/screen"
import { BrowserBuffer } from "../../polyterm-web/src/browser-buffer"
import { RGBA } from "../../polyterm-web/src/core-shims/rgba"

const white = RGBA.fromValues(1, 1, 1, 1)
const black = RGBA.fromValues(0, 0, 0, 1)

describe("waitFor", () => {
  it("resolves immediately when string condition is met", async () => {
    const buf = BrowserBuffer.create(20, 5, "wcwidth")
    buf.drawText("Hello", 0, 0, white, black)
    const screen = new Screen(buf)

    await waitFor(screen, "Hello")
  })

  it("resolves immediately when function condition passes", async () => {
    const buf = BrowserBuffer.create(20, 5, "wcwidth")
    buf.drawText("Hello", 0, 0, white, black)
    const screen = new Screen(buf)

    await waitFor(screen, () => {
      expect(screen.contains("Hello")).toBe(true)
    })
  })

  it("waits for text to appear", async () => {
    const buf = BrowserBuffer.create(20, 5, "wcwidth")
    const screen = new Screen(buf)

    // Text appears after 100ms
    setTimeout(() => {
      buf.drawText("Delayed", 0, 0, white, black)
    }, 100)

    await waitFor(screen, "Delayed", { timeout: 1000, interval: 20 })
  })

  it("times out on missing text", async () => {
    const buf = BrowserBuffer.create(20, 5, "wcwidth")
    const screen = new Screen(buf)

    let threw = false
    try {
      await waitFor(screen, "Never", { timeout: 100, interval: 10 })
    } catch (error: any) {
      threw = true
      expect(error.message).toContain("timed out")
      expect(error.message).toContain("Never")
    }
    expect(threw).toBe(true)
  })

  it("times out on failing assertion", async () => {
    const buf = BrowserBuffer.create(20, 5, "wcwidth")
    const screen = new Screen(buf)

    let threw = false
    try {
      await waitFor(screen, () => {
        throw new Error("not ready")
      }, { timeout: 100, interval: 10 })
    } catch (error: any) {
      threw = true
      expect(error.message).toContain("not ready")
    }
    expect(threw).toBe(true)
  })
})
