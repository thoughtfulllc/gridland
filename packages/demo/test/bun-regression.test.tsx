// @ts-nocheck
// Phase 0 D0.1 — snapshot baseline for every terminal-runnable Bun demo.
// This is the regression set for INV-5 (see tasks/003-browser-compat-contract.md):
// "Mounting any existing intrinsic in a Bun CLI produces output byte-identical
// to the baseline."
//
// Scope caveat: the test environment uses packages/web/test/preload.ts, which
// shims @gridland/core's buffer/text-buffer/zig layers to their browser
// equivalents. So the captured snapshot is the cell-grid output of the React
// + reconciler + BrowserBuffer pipeline, not the real ANSI stream a running
// `bun packages/demo/demos/<name>.tsx` would emit.
//
// For the Phase 1 refactor (lazy frameBuffer allocation), this is sufficient:
// the refactor is purely about WHEN the buffer is allocated, not WHAT gets
// written into it, so byte-identical cell-grid output is the right invariant
// to enforce. Drift in this suite signals a rendering regression.
import { afterEach, describe, expect, test } from "bun:test"
import { FocusProvider } from "@gridland/utils"
import { cleanup, renderTui } from "../../testing/src/index"
import { demos } from "../demos/index"

afterEach(() => cleanup())

// Some demos depend on module surfaces the preload doesn't shim (e.g.
// `useBreakpoints` → `@opentui/react`'s `useTerminalDimensions`). Skip them
// with a documented reason instead of letting them block the suite.
const SKIPPED: Record<string, string> = {
  landing: "LandingApp imports useBreakpoints → @opentui/react.useTerminalDimensions (not shimmed)",
}

describe("Bun demo regression baselines", () => {
  for (const demo of demos) {
    const skipReason = SKIPPED[demo.name]
    if (skipReason) {
      test.skip(`${demo.name} (skipped: ${skipReason})`, () => {})
      continue
    }

    test(`${demo.name} first-frame snapshot`, () => {
      let captured: string
      try {
        const { screen } = renderTui(<FocusProvider>{demo.app()}</FocusProvider>, { cols: 80, rows: 24 })
        captured = screen.rawText()
      } catch (err) {
        captured = `ERROR: ${(err as Error).message}`
      }
      expect(captured).toMatchSnapshot()
    })
  }
})
