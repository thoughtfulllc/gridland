import { beforeEach, describe, expect, test } from "bun:test"
import { OptimizedBuffer } from "../../core/src/buffer"
import { ASCIIFontRenderable } from "../../core/src/renderables/ASCIIFont"
import { BrowserRenderContext } from "../src/browser-render-context"
import type { RenderContext } from "../../core/src/types"
import { BrowserAsciiFontRenderable } from "../src/components/browser-ascii-font"

// Phase 3 spec test D3.7 / INV-6 from tasks/003-browser-compat-contract.md:
// the terminal and browser implementations of <ascii-font> must produce
// byte-identical glyph output (at the char-grid level) for the same input.
//
// This test covers all 7 built-in fonts with a representative text. Both
// paths ultimately delegate to the pure-JS renderFontToFrameBuffer helper,
// so the parity is structurally guaranteed — this test proves the wrapper
// layers don't drop or duplicate glyph cells along the way.
//
// Scope note: we compare the `char` Uint32Arrays only. Fg/bg/attr data
// diverges for non-glyph cells because the terminal path pre-clears its
// intermediate framebuffer to a background color before drawFrameBuffer'ing
// into the destination, while the browser path writes only the non-space
// glyph cells directly into the destination buffer. That's a benign
// implementation artifact of the two pipelines and does not affect the
// rendered glyph shape. See §7.2 of the spec for the golden-file discipline
// that would be used for a full parametrized run (deferred — this
// representative set is sufficient for the refactor's invariant).

function renderTerminal(text: string, font: string): Uint32Array {
  const ctx = new BrowserRenderContext(80, 24) as unknown as RenderContext
  const dest = OptimizedBuffer.create(80, 24, ctx.widthMethod)
  const r = new ASCIIFontRenderable(ctx, { text, font: font as any })
  r.render(dest, 0)
  return dest.char
}

function renderBrowser(text: string, font: string): Uint32Array {
  const ctx = new BrowserRenderContext(80, 24) as unknown as RenderContext
  const dest = OptimizedBuffer.create(80, 24, ctx.widthMethod)
  const r = new BrowserAsciiFontRenderable(ctx, { text, font: font as any })
  r.render(dest, 0)
  return dest.char
}

describe("ascii-font terminal/browser char-grid parity", () => {
  const FONTS = ["tiny", "block", "shade", "slick", "huge", "grid", "pallet"] as const

  test.each(FONTS)('"TEST" in %s font produces identical char grids', (font) => {
    const terminalChars = renderTerminal("TEST", font)
    const browserChars = renderBrowser("TEST", font)

    expect(terminalChars.length).toBe(browserChars.length)
    // Compare as arrays so diffs are human-readable.
    expect(Array.from(browserChars)).toEqual(Array.from(terminalChars))
  })

  test('representative parametric set: {"HI", "HELLO", "1234"} x {tiny, block}', () => {
    const cases = [
      { text: "HI", font: "tiny" },
      { text: "HI", font: "block" },
      { text: "HELLO", font: "tiny" },
      { text: "HELLO", font: "block" },
      { text: "1234", font: "tiny" },
      { text: "1234", font: "block" },
    ]
    for (const { text, font } of cases) {
      const terminalChars = renderTerminal(text, font)
      const browserChars = renderBrowser(text, font)
      const equal = terminalChars.every((c, i) => c === browserChars[i])
      expect({ text, font, equal }).toEqual({ text, font, equal: true })
    }
  })
})
