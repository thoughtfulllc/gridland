# Renderable Constructor Contract

**When this loads:** You are touching any file under `packages/core/src/renderables/**` or `packages/web/src/components/**`, or you are adding a new Renderable subclass anywhere in the monorepo.

## The Rule

Renderable constructors must not call any of the following:

- `resolveRenderLib()` or `registerRenderLib()` from `packages/core/src/zig-registry.ts`
- `OptimizedBuffer.create(...)` from `packages/core/src/buffer.ts`
- Anything else that depends on the Zig FFI runtime singleton being registered

Resource allocation happens lazily — in `renderSelf(buffer, deltaTime)` via an `ensureBuffer()` helper or equivalent — so that the constructor completes without the runtime singleton being ready.

The linter at `packages/core/scripts/lint-renderable-constructors.ts` enforces this rule at build time (it runs as part of `bun run --cwd packages/core build` and `bun run check:renderables` at the monorepo root).

## Why

Constructors for React intrinsics run during reconciliation, before the renderer has committed to a runtime. A renderable that allocates an `OptimizedBuffer` in its constructor is asserting "I know a RenderLib is registered right now" — which is false in the browser (no Zig), false in SSR (no mounted renderer), and false in any future runtime we bolt on.

The specific bug this rule prevents: a Vite app mounts `<ascii-font text="hello" />`, React constructs `ASCIIFontRenderable`, that chains into `FrameBufferRenderable.constructor()`, which calls `OptimizedBuffer.create()`, which calls `resolveRenderLib()`, which throws because no RenderLib has been registered in the browser. The user sees a cryptic error mentioning `@opentui/core`, a dep they have never heard of.

Phase 1 of `tasks/003-browser-compat-contract.md` retrofitted `FrameBufferRenderable` to follow this rule. This lint rule keeps it that way as the codebase grows.

## How to Write a Renderable That Passes

### Good: lazy allocation

```ts
export class FrameBufferRenderable extends Renderable {
  public frameBuffer: OptimizedBuffer | null = null

  constructor(ctx: RenderContext, options: FrameBufferOptions) {
    super(ctx, options)
    this.respectAlpha = options.respectAlpha || false
    // ← no OptimizedBuffer.create here
  }

  protected ensureBuffer(): OptimizedBuffer | null {
    if (this.frameBuffer) return this.frameBuffer
    const w = this.width, h = this.height
    if (w <= 0 || h <= 0) return null
    this.frameBuffer = OptimizedBuffer.create(w, h, this._ctx.widthMethod, { ... })
    return this.frameBuffer
  }

  protected renderSelf(buffer: OptimizedBuffer, deltaTime: number): void {
    const fb = this.ensureBuffer()
    if (!fb) return
    buffer.drawFrameBuffer(this.x, this.y, fb)
  }
}
```

### Good: delegate to a browser-friendly primitive

`BrowserAsciiFontRenderable` (`packages/web/src/components/browser-ascii-font.ts`) extends `Renderable` directly and calls the pure-JS `renderFontToFrameBuffer(buffer, { ... })` in `renderSelf`. No internal frameBuffer, no allocation, no singleton lookup. This is the preferred shape for any new browser-compatible renderable.

### Bad: constructor-side allocation

```ts
// DO NOT DO THIS
constructor(ctx: RenderContext, options: FrameBufferOptions) {
  super(ctx, options)
  this.frameBuffer = OptimizedBuffer.create(options.width, options.height, ...)  // lint fail
}
```

## What the Linter Detects

The AST walker at `packages/core/scripts/lint-renderable-constructors.ts` walks:

- `packages/core/src/renderables/**/*.{ts,tsx}` (excluding `__tests__/` and `*.test.ts`)
- `packages/web/src/components/**/*.{ts,tsx}` (same exclusions)

Inside any `ConstructorDeclaration` body (including nested arrow functions, IIFEs, and helper function expressions defined and invoked inline), it flags:

- `resolveRenderLib()` — direct identifier call
- `registerRenderLib()` — direct identifier call
- `OptimizedBuffer.create(...)` — property-access call

The linter does NOT flag:
- The same calls inside a method (that's the whole point of `ensureBuffer`)
- Imports of `resolveRenderLib` / `OptimizedBuffer` themselves (importing is fine; calling in the constructor is not)
- Files outside the two lint roots (`zig-registry.ts` itself has to call `resolveRenderLib`; that's its job)

## Tests

`packages/core/scripts/__tests__/lint-renderable-constructors.test.ts` — 8 unit tests covering clean trees, the three violation classes, the IIFE escape-hatch, and the two real refactored files (`FrameBuffer.ts`, `ASCIIFont.ts`).

Run: `bun run --cwd packages/core test scripts/__tests__/lint-renderable-constructors.test.ts`

## Background

This rule is Phase 4 of `tasks/003-browser-compat-contract.md`. Phases 1–3 shipped the refactor; Phase 4 ships the lint rule that keeps the invariant enforced. See §2.2 of the spec for the original bug, §6 Phase 1 for the hygiene fix, and §6 Phase 4 for this rule's test matrix.
