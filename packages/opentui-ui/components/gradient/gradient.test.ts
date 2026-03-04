import { describe, it, expect } from "bun:test"
import { generateGradient, hexToRgb, rgbToHex, GRADIENTS, type GradientName } from "./gradient"

describe("gradient utilities", () => {
  describe("hexToRgb", () => {
    it("parses hex color", () => {
      expect(hexToRgb("#ff0000")).toEqual({ r: 255, g: 0, b: 0 })
      expect(hexToRgb("#00ff00")).toEqual({ r: 0, g: 255, b: 0 })
      expect(hexToRgb("#0000ff")).toEqual({ r: 0, g: 0, b: 255 })
    })

    it("parses without hash", () => {
      expect(hexToRgb("ff8800")).toEqual({ r: 255, g: 136, b: 0 })
    })
  })

  describe("rgbToHex", () => {
    it("converts RGB to hex", () => {
      expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe("#ff0000")
      expect(rgbToHex({ r: 0, g: 128, b: 255 })).toBe("#0080ff")
    })

    it("pads single-digit components", () => {
      expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe("#000000")
      expect(rgbToHex({ r: 1, g: 2, b: 3 })).toBe("#010203")
    })
  })

  describe("generateGradient", () => {
    it("generates correct number of steps", () => {
      const result = generateGradient(["#ff0000", "#0000ff"], 5)
      expect(result.length).toBe(5)
    })

    it("starts and ends with the input colors", () => {
      const result = generateGradient(["#ff0000", "#0000ff"], 10)
      expect(result[0]).toBe("#ff0000")
      expect(result[9]).toBe("#0000ff")
    })

    it("handles single color", () => {
      const result = generateGradient(["#ff0000"], 5)
      expect(result.length).toBe(5)
      expect(result.every((c) => c === "#ff0000")).toBe(true)
    })

    it("handles single step", () => {
      const result = generateGradient(["#ff0000", "#0000ff"], 1)
      expect(result.length).toBe(1)
    })

    it("handles 3+ colors", () => {
      const result = generateGradient(["#ff0000", "#00ff00", "#0000ff"], 5)
      expect(result.length).toBe(5)
      expect(result[0]).toBe("#ff0000")
      expect(result[2]).toBe("#00ff00") // midpoint
      expect(result[4]).toBe("#0000ff")
    })

    it("throws on empty colors", () => {
      expect(() => generateGradient([], 5)).toThrow("At least one color")
    })

    it("produces interpolated colors", () => {
      const result = generateGradient(["#000000", "#ffffff"], 3)
      // Middle should be approximately #808080
      const mid = hexToRgb(result[1])
      expect(mid.r).toBeGreaterThan(100)
      expect(mid.r).toBeLessThan(160)
    })
  })

  describe("GRADIENTS presets", () => {
    it("has all named gradients", () => {
      const names: GradientName[] = [
        "cristal", "teen", "mind", "morning", "vice", "passion",
        "fruit", "instagram", "atlas", "retro", "summer", "pastel", "rainbow",
      ]
      for (const name of names) {
        expect(GRADIENTS[name]).toBeDefined()
        expect(GRADIENTS[name].length).toBeGreaterThanOrEqual(2)
      }
    })

    it("all gradients produce valid hex colors", () => {
      for (const [name, colors] of Object.entries(GRADIENTS)) {
        const result = generateGradient(colors, 10)
        for (const color of result) {
          expect(color).toMatch(/^#[0-9a-f]{6}$/)
        }
      }
    })
  })
})
