import { describe, expect, test } from "bun:test"
import { componentCatalogue } from "../../components"
import {
  RUNTIME_CAPABILITY_VARIANTS,
  intrinsicCapabilities,
  type BrowserIntrinsicNames,
  type RuntimeCapability,
} from "../runtime-capability"
import { checkIntrinsicTags } from "../../../../scripts/check-intrinsic-tags"

// Phase 2 spec: every JSX intrinsic in the reconciler catalogue declares a
// runtime-capability tag. Enforced at build time by the checker and at test
// time by the key-set equality assertion below. See INV-1 and INV-3 in
// tasks/003-browser-compat-contract.md §5.

describe("runtime-capability contract", () => {
  test("RUNTIME_CAPABILITY_VARIANTS is exactly the four expected values", () => {
    expect([...RUNTIME_CAPABILITY_VARIANTS].sort()).toEqual(
      ["browser-only", "dual-impl", "terminal-only", "universal"],
    )
  })

  test("every RuntimeCapability literal is accepted by the type", () => {
    // Compile-time shape check — if RuntimeCapability drifts, this fails to typecheck.
    const cases: Record<RuntimeCapability, true> = {
      universal: true,
      "dual-impl": true,
      "terminal-only": true,
      "browser-only": true,
    }
    expect(Object.keys(cases).length).toBe(4)
  })

  test("INV-1: componentCatalogue keys and intrinsicCapabilities keys are identical sets", () => {
    const catalogueKeys = Object.keys(componentCatalogue).sort()
    const capabilityKeys = Object.keys(intrinsicCapabilities).sort()
    expect(capabilityKeys).toEqual(catalogueKeys)
  })

  test("every intrinsic capability tag is one of the known variants", () => {
    for (const [name, tag] of Object.entries(intrinsicCapabilities)) {
      expect(RUNTIME_CAPABILITY_VARIANTS).toContain(tag as RuntimeCapability)
      // Anchor on name so the assertion failure points at the bad entry.
      expect({ [name]: tag }).toEqual({ [name]: tag })
    }
  })

  test("ascii-font is tagged dual-impl (Phase 3 shipped the browser renderable)", () => {
    expect(intrinsicCapabilities["ascii-font"]).toBe("dual-impl")
  })

  test("input, textarea, line-number remain terminal-only pending follow-up tasks", () => {
    expect(intrinsicCapabilities.input).toBe("terminal-only")
    expect(intrinsicCapabilities.textarea).toBe("terminal-only")
    expect(intrinsicCapabilities["line-number"]).toBe("terminal-only")
  })

  test("box, text, span, scrollbox are all tagged universal", () => {
    expect(intrinsicCapabilities.box).toBe("universal")
    expect(intrinsicCapabilities.text).toBe("universal")
    expect(intrinsicCapabilities.span).toBe("universal")
    expect(intrinsicCapabilities.scrollbox).toBe("universal")
  })

  test("BrowserIntrinsicNames type resolves to universal + dual-impl + browser-only names", () => {
    // Runtime mirror of the type-level filter: every name whose tag is one of
    // the browser-compatible variants should appear; terminal-only names must not.
    const browserCompatibleTags = new Set<RuntimeCapability>(["universal", "dual-impl", "browser-only"])
    const expected = Object.entries(intrinsicCapabilities)
      .filter(([, tag]) => browserCompatibleTags.has(tag as RuntimeCapability))
      .map(([name]) => name)
      .sort()

    // ascii-font is dual-impl after Phase 3 — included in the browser-compatible set.
    expect(expected).toContain("ascii-font")

    // input, textarea, line-number remain terminal-only.
    expect(expected).not.toContain("input")
    expect(expected).not.toContain("textarea")
    expect(expected).not.toContain("line-number")

    expect(expected).toContain("box")
    expect(expected).toContain("text")

    // Type-level assignability check: a value of type BrowserIntrinsicNames
    // must be assignable from a string that's in the filtered set.
    const _typecheck: BrowserIntrinsicNames = "box"
    void _typecheck
  })
})

describe("check-intrinsic-tags script", () => {
  test("passes on a catalogue/capabilities key set that match exactly", () => {
    const result = checkIntrinsicTags(["box", "text"], ["box", "text"])
    expect(result.ok).toBe(true)
  })

  test("fails on a catalogue key missing from the capability overlay", () => {
    const result = checkIntrinsicTags(["box", "text", "ghost"], ["box", "text"])
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain("ghost")
      expect(result.error).toMatch(/missing|untagged/i)
    }
  })

  test("fails on a capability overlay key missing from the catalogue", () => {
    const result = checkIntrinsicTags(["box"], ["box", "stale"])
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain("stale")
    }
  })

  test("passes on the real catalogue + capability overlay", () => {
    const result = checkIntrinsicTags(
      Object.keys(componentCatalogue),
      Object.keys(intrinsicCapabilities),
    )
    expect(result.ok).toBe(true)
  })
})
