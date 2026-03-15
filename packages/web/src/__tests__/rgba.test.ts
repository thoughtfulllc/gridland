import { describe, it, expect } from "bun:test"
import { RGBA, parseColor, hexToRgb, rgbToHex, hsvToRgb } from "@gridland/utils"

describe("RGBA", () => {
  it("creates from values", () => {
    const c = RGBA.fromValues(1, 0.5, 0.25, 1)
    expect(c.r).toBe(1)
    expect(c.g).toBe(0.5)
    expect(c.b).toBe(0.25)
    expect(c.a).toBe(1)
  })

  it("creates from ints", () => {
    const c = RGBA.fromInts(255, 128, 0, 255)
    expect(c.r).toBe(1)
    expect(c.g).toBeCloseTo(128 / 255)
    expect(c.b).toBe(0)
    expect(c.a).toBe(1)
  })

  it("creates from hex", () => {
    const c = RGBA.fromHex("#ff0000")
    expect(c.r).toBe(1)
    expect(c.g).toBe(0)
    expect(c.b).toBe(0)
  })

  it("toInts returns 0-255 values", () => {
    const c = RGBA.fromValues(1, 0, 0.5, 1)
    const ints = c.toInts()
    expect(ints[0]).toBe(255)
    expect(ints[1]).toBe(0)
    expect(ints[2]).toBe(128)
    expect(ints[3]).toBe(255)
  })

  it("toString returns CSS rgba", () => {
    const c = RGBA.fromValues(1, 0, 0, 1)
    expect(c.toString()).toBe("rgba(1.00, 0.00, 0.00, 1.00)")
  })

  it("equals compares correctly", () => {
    const a = RGBA.fromValues(1, 0, 0, 1)
    const b = RGBA.fromValues(1, 0, 0, 1)
    const c = RGBA.fromValues(0, 1, 0, 1)
    expect(a.equals(b)).toBe(true)
    expect(a.equals(c)).toBe(false)
    expect(a.equals(undefined)).toBe(false)
  })

  it("map transforms all channels", () => {
    const c = RGBA.fromValues(0.1, 0.2, 0.3, 0.4)
    const doubled = c.map((v) => v * 2)
    // Float32Array has limited precision
    expect(doubled[0]).toBeCloseTo(0.2)
    expect(doubled[1]).toBeCloseTo(0.4)
    expect(doubled[2]).toBeCloseTo(0.6)
    expect(doubled[3]).toBeCloseTo(0.8)
  })
})

describe("hexToRgb", () => {
  it("parses 6-char hex", () => {
    const c = hexToRgb("#00ff00")
    expect(c.r).toBe(0)
    expect(c.g).toBe(1)
    expect(c.b).toBe(0)
  })

  it("parses 3-char hex", () => {
    const c = hexToRgb("#f00")
    expect(c.r).toBe(1)
    expect(c.g).toBe(0)
    expect(c.b).toBe(0)
  })

  it("parses 8-char hex with alpha", () => {
    const c = hexToRgb("#ff000080")
    expect(c.r).toBe(1)
    expect(c.a).toBeCloseTo(128 / 255)
  })
})

describe("rgbToHex", () => {
  it("converts to hex string", () => {
    const c = RGBA.fromValues(1, 0, 0, 1)
    expect(rgbToHex(c)).toBe("#ff0000")
  })
})

describe("hsvToRgb", () => {
  it("converts red (0°)", () => {
    const c = hsvToRgb(0, 1, 1)
    expect(c.r).toBeCloseTo(1)
    expect(c.g).toBeCloseTo(0)
    expect(c.b).toBeCloseTo(0)
  })

  it("converts green (120°)", () => {
    const c = hsvToRgb(120, 1, 1)
    expect(c.r).toBeCloseTo(0)
    expect(c.g).toBeCloseTo(1)
    expect(c.b).toBeCloseTo(0)
  })

  it("converts blue (240°)", () => {
    const c = hsvToRgb(240, 1, 1)
    expect(c.r).toBeCloseTo(0)
    expect(c.g).toBeCloseTo(0)
    expect(c.b).toBeCloseTo(1)
  })
})

describe("parseColor", () => {
  it("parses hex", () => {
    const c = parseColor("#ff0000")
    expect(c.r).toBe(1)
    expect(c.g).toBe(0)
  })

  it("parses named colors", () => {
    const c = parseColor("red")
    expect(c.r).toBe(1)
    expect(c.g).toBe(0)
    expect(c.b).toBe(0)
  })

  it("parses named color", () => {
    const c = parseColor("red")
    expect(c.r).toBe(1)
    expect(c.g).toBe(0)
    expect(c.b).toBe(0)
    expect(c.a).toBe(1)
  })

  it("passes through RGBA instances", () => {
    const original = RGBA.fromValues(0.5, 0.5, 0.5, 1)
    const result = parseColor(original)
    expect(result).toBe(original)
  })

  it("returns magenta for unknown input", () => {
    const c = parseColor("nonsense")
    expect(c.r).toBe(1)
    expect(c.g).toBe(0)
    expect(c.b).toBe(1)
  })
})
