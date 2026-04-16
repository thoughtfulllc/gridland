import { describe, expect, test } from "bun:test"
import { lintRenderableConstructor, type LintFinding } from "../lint-renderable-constructors"

// Phase 4 tests from tasks/003-browser-compat-contract.md §6 Phase 4.
// Exercised via the pure function `lintRenderableConstructor(filename, source)`
// which returns an array of findings. Empty array means clean.

function firstFindingMessage(findings: LintFinding[]): string {
  return findings[0]?.message ?? ""
}

describe("lint-renderable-constructors AST walker", () => {
  test("clean tree — a real renderable constructor with no forbidden calls produces zero findings", () => {
    const source = `
      import { Renderable } from "../Renderable"
      export class CleanRenderable extends Renderable {
        constructor(ctx: any, options: any) {
          super(ctx, options)
          this.someField = options.someField ?? "default"
        }
      }
    `
    const findings = lintRenderableConstructor("packages/core/src/renderables/Clean.ts", source)
    expect(findings).toEqual([])
  })

  test("fails on a renderable constructor that imports resolveRenderLib", () => {
    const source = `
      import { resolveRenderLib } from "../zig-registry"
      import { Renderable } from "../Renderable"
      export class BadRenderable extends Renderable {
        constructor(ctx: any, options: any) {
          super(ctx, options)
          const lib = resolveRenderLib()
          this.lib = lib
        }
      }
    `
    const findings = lintRenderableConstructor("packages/core/src/renderables/Bad.ts", source)
    expect(findings.length).toBeGreaterThanOrEqual(1)
    const msg = findings.map((f) => f.message).join("\n")
    expect(msg).toMatch(/resolveRenderLib/)
    for (const f of findings) {
      expect(f.filename).toBe("packages/core/src/renderables/Bad.ts")
      expect(f.line).toBeGreaterThan(0)
    }
  })

  test("fails on a renderable constructor that calls OptimizedBuffer.create", () => {
    const source = `
      import { OptimizedBuffer } from "../buffer"
      import { Renderable } from "../Renderable"
      export class AllocRenderable extends Renderable {
        public frameBuffer: OptimizedBuffer
        constructor(ctx: any, options: any) {
          super(ctx, options)
          this.frameBuffer = OptimizedBuffer.create(options.width, options.height, ctx.widthMethod, {})
        }
      }
    `
    const findings = lintRenderableConstructor(
      "packages/core/src/renderables/Alloc.ts",
      source,
    )
    expect(findings.length).toBeGreaterThanOrEqual(1)
    expect(firstFindingMessage(findings)).toMatch(/OptimizedBuffer\.create/)
  })

  test("ignores OptimizedBuffer.create calls outside constructor bodies (e.g., inside methods)", () => {
    const source = `
      import { OptimizedBuffer } from "../buffer"
      import { Renderable } from "../Renderable"
      export class LazyRenderable extends Renderable {
        public frameBuffer: OptimizedBuffer | null = null
        constructor(ctx: any, options: any) {
          super(ctx, options)
        }
        ensureBuffer(): OptimizedBuffer {
          if (!this.frameBuffer) {
            this.frameBuffer = OptimizedBuffer.create(this.width, this.height, this._ctx.widthMethod, {})
          }
          return this.frameBuffer
        }
      }
    `
    const findings = lintRenderableConstructor("packages/core/src/renderables/Lazy.ts", source)
    expect(findings).toEqual([])
  })

  test("also fails on registerRenderLib() in the constructor", () => {
    const source = `
      import { registerRenderLib } from "../zig-registry"
      import { Renderable } from "../Renderable"
      export class RegisterRenderable extends Renderable {
        constructor(ctx: any, options: any) {
          super(ctx, options)
          registerRenderLib(null as any)
        }
      }
    `
    const findings = lintRenderableConstructor("packages/core/src/renderables/Reg.ts", source)
    expect(findings.length).toBeGreaterThanOrEqual(1)
    expect(firstFindingMessage(findings)).toMatch(/registerRenderLib/)
  })

  test("nested function declarations inside constructors do not mask violations", () => {
    // A constructor that defines a local helper and then calls it is still
    // doing work during reconciliation. The call site inside a nested helper
    // is flagged if the helper is invoked from the constructor body.
    // (We detect the direct call inside the constructor body; nested IIFE
    // inside ctor still counts.)
    const source = `
      import { OptimizedBuffer } from "../buffer"
      import { Renderable } from "../Renderable"
      export class IIFERenderable extends Renderable {
        constructor(ctx: any, options: any) {
          super(ctx, options)
          ;(() => { OptimizedBuffer.create(1, 1, "wcwidth", {}) })()
        }
      }
    `
    const findings = lintRenderableConstructor("packages/core/src/renderables/Iife.ts", source)
    expect(findings.length).toBeGreaterThanOrEqual(1)
    expect(firstFindingMessage(findings)).toMatch(/OptimizedBuffer\.create/)
  })

  test("the real FrameBufferRenderable source is clean (post Phase 1)", async () => {
    const { readFileSync } = await import("node:fs")
    const path = new URL("../../src/renderables/FrameBuffer.ts", import.meta.url)
    const source = readFileSync(path, "utf-8")
    const findings = lintRenderableConstructor(
      "packages/core/src/renderables/FrameBuffer.ts",
      source,
    )
    expect(findings).toEqual([])
  })

  test("the real ASCIIFontRenderable source is clean (post Phase 1)", async () => {
    const { readFileSync } = await import("node:fs")
    const path = new URL("../../src/renderables/ASCIIFont.ts", import.meta.url)
    const source = readFileSync(path, "utf-8")
    const findings = lintRenderableConstructor(
      "packages/core/src/renderables/ASCIIFont.ts",
      source,
    )
    expect(findings).toEqual([])
  })
})
