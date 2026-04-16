import { describe, expect, test } from "bun:test"
import { getComponentCatalogue } from "../../../../core/src/react/components"
import { BrowserAsciiFontRenderable } from "../browser-ascii-font"

// Phase 3 spec test from tasks/003-browser-compat-contract.md §6 Phase 3,
// matrix row "importing create-browser-root registers BrowserAsciiFontRenderable".
//
// The register.ts module is imported as a side effect from
// create-browser-root.tsx; it mutates core's module-level componentCatalogue
// singleton. This test proves the override actually lands before the reconciler
// dispatches any createInstance call.
//
// Load path: import create-browser-root → its first line imports ./components/register
// → register.ts calls extend({ "ascii-font": BrowserAsciiFontRenderable }) →
// componentCatalogue["ascii-font"] now points at the browser impl.

describe("components/register side-effect", () => {
  test("importing create-browser-root replaces ascii-font in the catalogue", async () => {
    await import("../../create-browser-root")

    const catalogue = getComponentCatalogue()
    expect(catalogue["ascii-font"]).toBe(BrowserAsciiFontRenderable)
  })

  test("the override does not remove any other catalogue entries", async () => {
    await import("../../create-browser-root")

    const catalogue = getComponentCatalogue()
    // Every intrinsic that existed before register.ts ran must still be present.
    const requiredKeys = [
      "box",
      "text",
      "span",
      "code",
      "diff",
      "markdown",
      "scrollbox",
      "select",
      "tab-select",
      "ascii-font",
      "input",
      "textarea",
      "line-number",
      "br",
      "b",
      "strong",
      "i",
      "em",
      "u",
      "a",
    ]
    for (const key of requiredKeys) {
      expect(catalogue[key]).toBeDefined()
    }
  })
})
