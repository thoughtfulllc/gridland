# Task 003: Browser Compatibility Contract

**Status:** Draft rev 4 — ready for handoff once an owner is named
**Owner:** **TBD — must be assigned before Phase 0 starts.** This spec is written for a named engineer to execute; the reviewer/escalation path depends on knowing who owns the work. Do not begin Phase 0 without a name here. Recommended: core-platform lead assigns Engineer A (Phase 1 → Phase 3 critical path), web-platform lead assigns Engineer B (Phase 2 → Phase 4).
**Reviewers:** Core platform lead (Phases 1, 2, 4), Web platform lead (Phases 2, 3)
**Estimated effort:**
- **2 engineers, ~3 weeks wall clock.** Engineer A: Phase 1 → Phase 3. Engineer B: Phase 2 → Phase 4. Phase 3 cannot start until Phase 2 lands (Phase 3 flips the `ascii-font` capability tag from `terminal-only` → `dual-impl`, which Phase 2 must have introduced first). Phase 4 can start as soon as Phase 1 lands (the constructor contract applies from Phase 1 forward).
- **1 engineer, ~4 weeks wall clock serial.** Phases are 3d + 5d + 7.5d + 3d ≈ 18.5 working days. Do not promise 3 weeks with a single engineer.
- **Critical path: Phase 3.** The visible feature (`<ascii-font>` in the browser) lives here. If anything slips, it slips here. Phase 3's 1.5-week budget is tight; see §10 and Phase 3 risks.
**Blocks:** Browser `<ascii-font>`, capability-typed JSX intrinsics, regression guardrails for runtime-singleton misuse
**Depends on:** Nothing external.

**Rev 2 changes:** (a) Replaced §4.3's reconciler-merge architecture with the `extend()`-at-boot mechanism after Spike B revealed there is no reconciler-construction surface in `@gridland/web`. (b) Expanded the terminal-only intrinsic set from `{ascii-font}` to `{ascii-font, input, textarea, line-number}` after finding the Zig-FFI list in `.claude/rules/opentui-layout.md`. (c) Resolved the INV-6 contradiction (golden file is source of truth). (d) Fixed fabricated stack-trace line numbers in §2.1. (e) Added NG7 (no per-container catalogue refactor) and NG8 (no browser impls for input/textarea/line-number).

**Rev 3 changes:**
- (a) **Spike A closed by inspection.** Font data lives as plain JSON at `packages/core/src/lib/fonts/*.json` — seven fonts (`tiny`, `block`, `shade`, `slick`, `huge`, `grid`, `pallet`), ~8.8 KB gzipped total. `packages/core/src/lib/ascii.font.ts` has no top-level FFI side effects and is safe to import from browser code; the `measureText` / `getCharacterPositions` / `fonts` helpers are pure JS. Phase 3 reuses them directly instead of re-extracting font tables. D0.4 (Spike A) and the `ascii-font-glyphs.ts` deliverable are deleted.
- (b) **Base class for `BrowserAsciiFontRenderable` decided.** Extends `Renderable` from `packages/core/src/Renderable.ts`. Overrides `renderSelf(buffer, deltaTime)`. At runtime `buffer` is the browser's `BrowserBuffer` duck-typed against the `OptimizedBuffer` signature — the same pattern `box`, `text`, `span`, `scrollbox`, etc. already rely on today. Does **not** extend `FrameBufferRenderable`. Does **not** import `OptimizedBuffer.create`.
- (c) **Parity test relocated.** `ascii-font.parity.test.ts` moves from `packages/core/src/rendering/__tests__/` to `packages/web/src/components/__tests__/`. Golden files move to `packages/web/test/__goldens__/`. `packages/core` must never import from `packages/web`; rev 2's placement would have introduced exactly that reverse dep.
- (d) **Phase 2's refactor scope corrected.** The capability tag is added as an *overlay map* (`runtime-capability.ts` → `Record<IntrinsicName, RuntimeCapability>`) — **not** by rewriting existing intrinsic prop types into `IntrinsicDefinition<TProps>` wrappers. Existing `TextProps`, `BoxProps`, `AsciiFontProps`, etc. in `packages/core/src/react/types/components.ts` are untouched. The browser JSX filter reads the overlay map at the type level. This keeps Phase 2 scoped to ~1 week honestly.
- (e) **Bundle budget raised** from 8 KB to 12 KB gzipped (G6, §8). Bundling all 7 fonts upfront is the cleanest option; the raw JSON already gzips to ~8.8 KB, and the implementation + module overhead pushes the realistic delta to ~10 KB. 12 KB leaves headroom for the `BrowserAsciiFontRenderable` class and the `register.ts` side-effect module without forcing lazy-loading complexity.
- (f) **`@gridland/web` → `@gridland/core` internal-import precedent documented.** `packages/web/src/create-browser-root.tsx:5-8` already imports `../../core/src/react/reconciler/reconciler`, `../../core/src/react/components/app`, and `../../core/src/react/runtime/runtime-context`. The CLAUDE.md rule "never import from `@gridland/core` directly" is for user-facing packages (`@gridland/ui`, scaffolded user projects). `@gridland/web` has been a deep-coupling boundary crosser since inception. The new `register.ts` import follows the existing precedent — no new exception, no new rule change. §4.3 and §12 spell this out so framework-compliance won't flag the PR.
- (g) **Phase 3 test count reconciled** to 15 across the phase (was 13 in the exit criteria but 15 in the table; fixed the exit criterion).
- (h) **Font count corrected** from 4 to 7 throughout (rev 2 claimed `tiny, block, slick, shade`; the actual set from `packages/core/src/lib/ascii.font.ts:8-16` is `tiny, block, shade, slick, huge, grid, pallet`).
- (i) **Q1 and Q3 closed** (§14). Q1: bundle all 7 upfront; lazy-loading is a future optimization, not a Phase 3 deliverable. Q3: defer per-intrinsic custom error messages; generic "see tasks/003" is good enough for shipping.

**Rev 4 changes (pre-handoff cleanup, no scope change):**
- (a) **Staffing and critical path made explicit** in the header and §10. "3 weeks, 1–2 engineers" now reads "~3 weeks with 2 engineers OR ~4 weeks solo" with a concrete engineer A / engineer B split, Phase 3 named as the critical path, and the Phase 2 → Phase 3 dependency called out.
- (b) **`"sideEffects"` decision committed** — file-scoped `"sideEffects": ["./src/components/register.ts"]` in `packages/web/package.json`. Previously deferred in §16 as a "question to ask before starting"; that deferral created the exact tree-shaking risk already listed in §13. Decided in spec so the engineer doesn't have to litigate it on day one. Reflected in D3.4, D3.5, §13 risk row, and §16.
- (c) **INV-6 wording tightened.** Rev 3 said "both implementations render into a shared golden file" + "the golden file is the source of truth"; a reader could read that as self-contradictory. Rewritten to: *"Both implementations must produce cell output equal to the committed golden. The golden is authored once, committed, and is the source of truth. If the two implementations diverge, the golden is updated to match the JS output and web-platform lead signs off."*
- (d) **D3.7 parity-test stub language clarified.** Rev 3 said "mocked `OptimizedBuffer` stub that captures `drawText` / `setCell` calls." `bun test` runs in Bun, so the terminal path can use the real `OptimizedBuffer`. D3.7 now says: parity test runs under Bun, constructs the terminal `ASCIIFontRenderable` against a real `OptimizedBuffer`, reads the resulting cell grid, and compares against `BrowserAsciiFontRenderable` output captured via a `setCell`-spying `BrowserBuffer` harness. No stubbing of the native path.
- (e) **Phase 4 D4.1 rule file split.** Rev 3 bundled two unrelated rules into one file: the renderable-constructor contract (every renderable author) and the `@gridland/web` → `@gridland/core` internal-import exemption (only `packages/web/` authors). These have nothing to do with each other. Rev 4 ships them as two files: `.claude/rules/renderable-constructors.md` (constructor contract only) and `.claude/rules/web-core-import-exemption.md` (the exemption). Files-touched tables for Phase 4 updated accordingly.

---

## 1. Framing

Gridland is a TUI framework that happens to also render in the browser. Terminal is the mainline: Bun + Zig + PTY, optimized for throughput and feature completeness. Browser is a secondary compatibility target — useful for docs, live demos, agent UIs, and embedded dashboards — but it is not a peer runtime. The two surfaces have different performance expectations, different feature sets, and different ergonomics.

Today that hierarchy is not expressed in the architecture. `@gridland/core` exposes every JSX intrinsic as if it were universal. A user who reaches for `<ascii-font>` in a Vite app crashes at runtime with `"No RenderLib registered"` because the intrinsic secretly depends on a Bun+Zig native library. The types lie and users are on their own.

This task fixes the dishonesty. It adds a runtime-capability contract to every intrinsic, filters browser JSX types to exclude terminal-only components (so mistakes become compile errors, not runtime crashes), and ships a small dedicated browser implementation of `<ascii-font>` so the user-facing promise — "intrinsics work in both runtimes unless tagged otherwise" — holds honestly.

**The terminal mainline is not touched.** `RenderLib`, `OptimizedBuffer`, the zig-registry, and the native glyph path all stay exactly as they are. This is a browser-side and types-side change, plus one hygiene fix in `FrameBufferRenderable` that has value regardless of the browser story.

This is spec-and-test driven. Every contract below comes with a named test that must be written before the implementation. Every phase starts with a red test suite and lands only when its exit criteria are met. Reviewers verify the "failing tests" commit fails before reviewing any implementation commit.

## 2. Motivation

### 2.1 The surface bug

A Vite app using `@gridland/web`'s `<TUI>` with `<ascii-font text="hello" />` crashes on first render:

```
Error: No RenderLib registered. In Bun, import '@opentui/core'
or '@opentui/core/native' (which loads zig.ts). In browsers,
call registerRenderLib() with a browser implementation.
  at resolveRenderLib (packages/core/src/zig-registry.ts:534)
  at OptimizedBuffer.create (packages/core/src/buffer.ts)
  at FrameBufferRenderable.constructor (packages/core/src/renderables/FrameBuffer.ts:18)
  at ASCIIFontRenderable.constructor (packages/core/src/renderables/ASCIIFont.ts:58)
```

### 2.2 Three layered mistakes (evidence cited)

1. **Eager resource allocation in a renderable constructor.** `FrameBufferRenderable.constructor()` (`packages/core/src/renderables/FrameBuffer.ts:15-22`) calls `OptimizedBuffer.create()`, which calls `resolveRenderLib()`. Constructors run during React reconciliation, so platform capability must be available before any component tree exists. This couples renderable construction to a runtime singleton, which is a hygiene problem regardless of the browser story. `ASCIIFontRenderable` is the only renderable today that crashes in its *constructor* specifically because of this pattern, and it is the only subclass of `FrameBufferRenderable` in the tree (verified by grep: `grep -rn "extends FrameBufferRenderable" packages/`).

2. **No runtime-capability contract between `core` and renderer packages.** `core` exposes `ascii-font` as a JSX intrinsic (`packages/core/src/react/components/index.ts:35`) with no declaration that it depends on a Bun-only dep. TypeScript happily compiles browser usage; the crash is at runtime. The same dishonesty applies to `input`, `textarea`, and `line-number` — all three are Zig-FFI intrinsics (EditBuffer for input/textarea, FrameBuffer for line-number per `.claude/rules/opentui-layout.md`), all three are exposed as universal in today's browser JSX types (`packages/web/src/gridland-jsx.d.ts:113-120`), and all three crash in the browser the moment the Zig path is touched.

3. **The browser renderer is treated as a peer instead of a compat layer.** Today the browser tries to satisfy the same contracts the terminal does, inheriting abstractions like `RenderLib` that only make sense with FFI. Under TUI-first framing the browser should be a deliberately narrower surface, not a second implementation of the same interface.

There are four intrinsics today that depend on Zig FFI and cannot render in the browser: `ascii-font`, `line-number`, `input`, `textarea`. Of those, only `ascii-font` crashes in the constructor (Phase 1 fixes that hygiene issue). The other three crash later in the render lifecycle the moment an EditBuffer or FrameBuffer operation is triggered. The underlying defect is structural: there is no documented boundary between "terminal-primary intrinsics" and "cross-runtime intrinsics," so the browser path silently picks up things it can't support.

This task ships a browser implementation for `ascii-font` only. `input`, `textarea`, and `line-number` are tagged `terminal-only` in the capability contract (Phase 2) and become compile errors in browser context. Their browser implementations are separate, follow-up tasks — scoped out here so this one lands in three weeks.

### 2.3 Why now

- Users hit this bug the first time they try `<ascii-font>` in a Vite app. The error message references `@opentui/core`, a dep they've never heard of. That's the worst possible failure mode.
- The fix is small and self-contained (~3 weeks, 1–2 engineers). Doing it now retires a class of future bugs cheaply.
- A framework-compliance lint rule (Phase 4) prevents any future renderable from reintroducing the same constructor-side singleton dependency.

## 3. Goals and Non-Goals

### 3.1 Goals

- G1. `<ascii-font>` renders visibly in both Bun and browser, with the browser implementation producing output byte-identical to the terminal for all supported inputs across all 7 built-in fonts.
- G2. Every JSX intrinsic in the reconciler catalogue declares a runtime-capability tag.
- G3. Browser JSX types exclude every intrinsic tagged `terminal-only`. Using one in a browser-typed project is a compile error, not a runtime crash.
- G4. `FrameBufferRenderable` and its subclasses can be constructed without a registered render library. Constructors never call runtime singletons. (Hygiene fix.)
- G5. Zero regression in Bun demo snapshots.
- G6. `@gridland/web` bundle-size delta ≤ 12 KB gzipped after the full migration. Rationale: seven fonts of JSON ≈ 8.8 KB gzipped + class + glue ≈ 10 KB realistic; 12 KB leaves 2 KB headroom without forcing lazy-loading complexity.
- G7. A framework-compliance rule, enforced in CI, prevents any future renderable from calling runtime singletons in its constructor.

### 3.2 Non-goals

- NG1. Touching the terminal rendering path. `RenderLib`, `OptimizedBuffer`, `zig-registry`, and the native glyph rasterizer stay exactly as they are.
- NG2. Introducing a universal `Buffer` or `BufferFactory` abstraction. Earlier drafts explored this; it is over-engineered for a TUI-first project.
- NG3. Deleting `@gridland/core`'s renderables or refactoring any renderable other than `FrameBufferRenderable` / `ASCIIFontRenderable`.
- NG4. Adding new frame-buffered renderables (sparklines, image blits, glyph atlases). This task enables future browser implementations of such components but does not ship any.
- NG5. Making `@gridland/web` perf-competitive with Bun at every workload. The browser has different perf constraints and is treated as a compat layer.
- NG6. Pure-JS engine rewrite or unforking opentui. Both are separate strategic bets; out of scope here.
- NG7. Refactoring the reconciler from a module-level singleton to a per-container catalogue. Spike B confirmed that today's reconciler at `packages/core/src/react/reconciler/host-config.ts:42` dispatches through a module-level `componentCatalogue`. A cleaner "inject catalogue at createContainer time" API is on the table as future work, but shipping it means touching the React reconciler host config and every container construction site — out of scope for this task. We use the existing `extend()` API instead (see §4.3).
- NG8. Browser implementations for `input`, `textarea`, or `line-number`. Those are separate, larger tasks. This task tags them `terminal-only` so they error at compile time in browser context, and leaves them out of the browser catalogue registration.
- NG9. Rewriting existing intrinsic prop types in `packages/core/src/react/types/components.ts` into an `IntrinsicDefinition<TProps>` wrapper shape. The capability tag is an overlay map on the intrinsic *name*, not a prop-type refactor. `TextProps`, `BoxProps`, `AsciiFontProps`, etc. stay exactly as they are today. See §4.4 and Phase 2 D2.1/D2.3.

## 4. Architecture

### 4.1 Today

**Terminal path** (works, unchanged in this task):

```
React reconciles
  → new ASCIIFontRenderable(ctx, opts)
    → super(ctx, opts) // FrameBufferRenderable
      → OptimizedBuffer.create() // resolves RenderLib → Zig
  → render(rootBuffer)
    → blit own buffer into rootBuffer
  → ANSI diff → stdout
```

**Browser path** (broken):

```
React reconciles
  → new ASCIIFontRenderable(ctx, opts)
    → super(ctx, opts)
      → OptimizedBuffer.create()
        → resolveRenderLib() // THROWS: no RenderLib in browser
```

The browser crashes because `FrameBufferRenderable.constructor()` depends on a singleton that only exists in Bun.

### 4.2 Target

**Terminal path** — unchanged from today in final behavior, with one internal refactor: buffer allocation moves from `FrameBufferRenderable.constructor()` into a lazy `ensureBuffer()` called from `render()`. Observable output (ANSI bytes written to stdout) is byte-identical.

**Browser path** — new:

```
React reconciles
  → new BrowserAsciiFontRenderable(ctx, opts) // extends Renderable (NOT FrameBufferRenderable)
    → stores props (text, font, colors); calls measureText() to set width/height
    → no buffer allocation, no OptimizedBuffer, no resolveRenderLib
  → render(rootBuffer)   // rootBuffer is a BrowserBuffer at runtime
    → renderSelf(rootBuffer) walks glyph lines from fonts[font].chars
    → writes codepoints via rootBuffer.setCell(...) at (this.x + dx, this.y + dy)
  → canvas painter reads rootBuffer cell grid → draws to <canvas>
```

`BrowserAsciiFontRenderable` is a new ~80-LOC file in `packages/web/src/components/`. It extends `Renderable` from `packages/core/src/Renderable.ts`. It does **not** extend `FrameBufferRenderable`. It does **not** import from `packages/core/src/buffer.ts` as a value (type-only imports for signatures are fine, since `buffer.ts` is browser-safe at import time — only `OptimizedBuffer.create()` calls trigger FFI). It does **not** touch `RenderLib`. It operates directly on the buffer the browser renderer passes into `renderSelf()`, using the duck-typed `setCell` / `drawText` methods that `BrowserBuffer` already provides (see `packages/web/src/browser-buffer.ts:184,266`).

**Font data and helpers are reused, not re-extracted.** `packages/core/src/lib/ascii.font.ts` exports `fonts`, `measureText`, and `getCharacterPositions` — all pure JS, no FFI calls. The only Zig-coupled export is `renderFontToFrameBuffer`, which writes into an `OptimizedBuffer`. The browser implementation calls `measureText` for sizing, reads `fonts[font].chars[char]` (an array of string rows) for glyph lines, and copies codepoints into the destination buffer with `setCell`. No new file like `ascii-font-glyphs.ts` is needed. Import chain safety was verified in rev 3: `ascii.font.ts` → `buffer.ts` → `zig-registry.ts` all have browser-safe module init (no top-level `resolveRenderLib()`, no top-level `require("bun:ffi")` — `buffer.ts` lazy-wraps the FFI require).

### 4.3 Catalogue override at boot (via `extend()`)

**Spike B ground truth:** `@gridland/web` does not construct a reconciler. `create-browser-root.tsx:5` imports `_createContainer` / `_updateContainer` directly from core's singleton reconciler (`packages/core/src/react/reconciler/reconciler.ts`). Dispatch from JSX intrinsic name → Renderable class happens in `hostConfig.createInstance` at `packages/core/src/react/reconciler/host-config.ts:42`, which looks up `getComponentCatalogue()[type]` and constructs `new components[type](rootContainerInstance.ctx, { id, ...props })`. `componentCatalogue` is a module-level singleton at `packages/core/src/react/components/index.ts:52`. There is **no** browser-side reconciler-construction step to inject a separate catalogue into.

Core already exports an override API: `extend(objects)` at `packages/core/src/react/components/index.ts:66-68` does `Object.assign(componentCatalogue, objects)`. It is unused today.

**The mechanism:** `@gridland/web` calls `extend()` at import time, before any React render happens, to override terminal intrinsics with browser implementations. The call lives in a new side-effect module `packages/web/src/components/register.ts`, imported as the very first line of `packages/web/src/create-browser-root.tsx`. This is one `Object.assign` on module init — no reconciler refactoring, no new reconciler construction step, no per-container plumbing.

```ts
// packages/web/src/components/register.ts (new)
import { extend } from "../../../core/src/react/components"
import { BrowserAsciiFontRenderable } from "./browser-ascii-font"

extend({
  "ascii-font": BrowserAsciiFontRenderable,
  // future dual-impl browser overrides go here
})
```

**Import path precedent (read this before flagging the cross-package import).** `packages/web/` already imports directly from `packages/core/src/...` — see `packages/web/src/create-browser-root.tsx:5-8`, which imports `_createContainer`, `_updateContainer`, `AppContext`, `ErrorBoundary`, and `RuntimeProvider` from internal core paths. The CLAUDE.md rule "*Never import from `@gridland/core` directly — it is internal*" governs user-facing packages (`@gridland/ui`, scaffolded user projects). `@gridland/web` is a monorepo-internal package that is deliberately deep-coupled to core. The new `register.ts` import follows this existing precedent verbatim; it is not a new boundary crossing and does not require a CLAUDE.md rule change. If framework-compliance flags the PR anyway, the resolution is to update `.claude/rules/` with a note explicitly exempting `@gridland/web` — Phase 4 D4.1 adds this clarification alongside the renderable-constructor rule.

Behavior by capability tag:
- **`universal`** — core entry is used unchanged (no override needed). e.g. `box`, `text`, `span`.
- **`dual-impl`** — core entry is overwritten in-place by the browser class. Same intrinsic name, same props. e.g. `ascii-font` at end of Phase 3.
- **`terminal-only`** — left unchanged in the catalogue (there's nothing to override with), and the compile-time filter in `gridland-jsx.d.ts` keeps browser users from reaching them at all. If a user bypasses the types (e.g. dynamic JSX, ignored `@ts-expect-error`), the reconciler still dispatches to the terminal Renderable, which throws at `resolveRenderLib()`. That's acceptable: runtime safety is a secondary defense line; the primary defense is the type filter. e.g. `input`, `textarea`, `line-number`.
- **`browser-only`** — reserved for future browser-only intrinsics. Registered via `extend()` in the browser boot path only.

**Why this is honest about the compromise:** the catalogue is a shared global. If someone loads both `@gridland/bun` and `@gridland/web` into the same process (SSR during dev, some test harnesses), they'll fight for the singleton. That's the known limitation of the "extend at boot" approach. The cleaner alternative — per-container catalogue injection — is documented as NG7 and scoped out. For single-runtime consumers (the overwhelmingly common case) the extend approach is correct.

**Load-order requirement:** `register.ts` must import *before* any `_createContainer` call. Phase 3 enforces this by putting the import as the very first line of `create-browser-root.tsx`, and by adding a unit test (§6 Phase 3) that mounts `<ascii-font>` in a fresh JSDOM / Bun-test context and asserts the catalogue was overridden.

### 4.4 Runtime capability

```ts
// packages/core/src/react/types/runtime-capability.ts
export type RuntimeCapability =
  | "universal"     // one implementation works everywhere
  | "dual-impl"     // separate implementations per runtime, same intrinsic name and props
  | "terminal-only" // works only in terminal runtimes
  | "browser-only"  // reserved for future browser-specific intrinsics

/**
 * Overlay map — capability tag per intrinsic *name*.
 * Existing intrinsic prop types in components.ts are untouched.
 */
export type IntrinsicCapabilities = Record<string, RuntimeCapability>

export const intrinsicCapabilities = {
  // Layout / text — all pure JS
  box: "universal",
  text: "universal",
  span: "universal",
  b: "universal",
  strong: "universal",
  i: "universal",
  em: "universal",
  u: "universal",
  br: "universal",
  a: "universal",
  code: "universal",
  diff: "universal",
  markdown: "universal",
  scrollbox: "universal",
  select: "universal",
  "tab-select": "universal",

  // Zig-FFI intrinsics — terminal-only until separate tasks ship browser impls
  "ascii-font": "terminal-only", // → "dual-impl" at end of Phase 3
  input: "terminal-only",
  textarea: "terminal-only",
  "line-number": "terminal-only",
} as const satisfies IntrinsicCapabilities
```

`ascii-font` is tagged `terminal-only` at the end of Phase 2 (stop the crash at compile time) and upgraded to `dual-impl` at the end of Phase 3 (ship the browser implementation and register it via `extend()`). `input`, `textarea`, and `line-number` are tagged `terminal-only` in Phase 2 and stay that way until separate follow-up tasks ship their browser implementations (NG8).

Browser JSX types filter to `"universal" | "dual-impl" | "browser-only"` via a conditional type in `packages/web/src/gridland-jsx.d.ts`. The filter reads the capability overlay map — **not** a restructured `IntrinsicDefinition<TProps>` shape. Existing prop types (`TextProps`, `BoxProps`, `AsciiFontProps`, …) are untouched. The filter is the **primary** defense — it converts misuse into a compile error. The `extend()` mechanism in §4.3 is the **override** path for dual-impl; it does not "filter" the catalogue. Terminal-only intrinsics remain in the catalogue but are unreachable from well-typed browser code.

## 5. Invariants

- **INV-1.** Every intrinsic in the reconciler catalogue has a declared runtime-capability tag. Enforced by a build-time assertion script that cross-references `componentCatalogue` keys against `intrinsicCapabilities` keys.
- **INV-2.** No file under `packages/core/src/renderables/` or `packages/web/src/components/` calls `resolveRenderLib()` or `OptimizedBuffer.create()` from a constructor. Enforced by an AST walk in CI and a runtime spy test.
- **INV-3.** The `JSX.IntrinsicElements` augmentation in `packages/web/src/gridland-jsx.d.ts` lists exactly the **Gridland-unique** intrinsic names with capability `universal | dual-impl | browser-only`. Terminal-only Gridland-unique names (`ascii-font` before Phase 3, `line-number` permanently until its follow-up task ships) must not compile in browser JSX context — enforced by `@ts-expect-error` type-level tests in `packages/web/test/type-check/invalid-jsx.tsx`. **Carve-out:** `input` and `textarea` collide with HTML element names React already types (`HTMLInputElement`, `HTMLTextAreaElement`). Removing them from Gridland's augmentation does not stop them from compiling — they fall through to React's built-in HTML element types. So INV-3 is **only enforceable at the type level for Gridland-unique names**. For `input` and `textarea`, the runtime-capability tag (tested in `packages/core/src/react/types/__tests__/intrinsic-tags.test.ts`) is the source of truth, and runtime misuse is caught by the reconciler at mount time via the existing `ErrorBoundary` fallback path. This carve-out was discovered during Phase 2 execution; it is not a bug in the filter, it is a limitation of TypeScript module augmentation over built-in React types.
- **INV-4.** Mounting `<ascii-font text="X" />` in a browser does not throw. Enforced by Playwright e2e.
- **INV-5.** Mounting any existing intrinsic in a Bun CLI produces output byte-identical to the `0.2.58` baseline. Enforced by snapshot regression.
- **INV-6.** For any `dual-impl` intrinsic, terminal and browser implementations accept the same prop shape and must produce cell output equal to a single committed golden file at `packages/web/test/__goldens__/`. The golden is authored once, committed, and is the source of truth — **not** a co-authored artifact that both implementations write into at test time. Both implementations run against the golden independently; drift in either direction fails CI. If a byte-level divergence is discovered between the two implementations that cannot be reconciled, the golden is updated to match the JS (browser) output (because the JS path is the newer, simpler one), the divergence is documented in `packages/web/README.md`, and web-platform lead signs off. "Byte-identical terminal↔browser output" is the goal; golden parity is the enforced contract. CI never regenerates goldens automatically; regeneration is an explicit opt-in step (§7.2).

## 6. Phased Plan

4 phases, ~3 weeks, 1–2 engineers. Each phase is an independent PR stack and ships atomically. Phases 2 and 3 must ship together in one release (see §10).

---

### Phase 0 — Baselines (half day, 1 engineer)

**Goal:** Freeze the current behavior so regressions are detectable. Both spikes from rev 1 are resolved in-spec (rev 3 §2.2 and §4.3).

**Deliverables:**

- D0.1. Snapshot output for every Bun demo in `packages/demo/demos/`. Commit to `packages/demo/test/__snapshots__/baseline-0.2.58/`. This is the regression set for INV-5.
- D0.2. Current `@gridland/web` gzipped bundle size. Record in `packages/web/BUNDLE-SIZE.md`.
- D0.3. Proposed initial capability tags for every intrinsic in `packages/core/src/react/components/index.ts`. Use the initial overlay in §4.4 as the starting point. Reviewed and signed off by core-platform lead.
- ~~D0.4. **Spike A — font table access.**~~ **Closed in spec rev 3.** Font data is plain JSON at `packages/core/src/lib/fonts/*.json`; seven fonts; ~8.8 KB gzipped total. `packages/core/src/lib/ascii.font.ts` exports pure-JS helpers (`measureText`, `getCharacterPositions`, `fonts`). Browser code imports them directly. No extraction, no re-packing, no data-wrangling day.
- ~~D0.5. **Spike B — browser reconciler entry point.**~~ **Closed in spec rev 2.** Findings baked into §4.3.

**Exit criteria:**
- [ ] Goldens committed.
- [ ] Bundle size recorded.
- [ ] Tag proposal reviewed.

**Rollback:** N/A. No production code changes.

---

### Phase 1 — Hygiene: lazy FrameBuffer allocation (3 days, 1 engineer)

**Goal:** Remove the runtime-singleton dependency from `FrameBufferRenderable.constructor()`. Scoped to core; no browser changes. This phase has value even if Phases 2–4 never ship: it closes INV-2 and cleans up a constructor-side side-effect that should never have existed.

**Scope note:** `ASCIIFontRenderable` is the only subclass of `FrameBufferRenderable` in the monorepo today (verified: `grep -rn "extends FrameBufferRenderable" packages/` → one hit). Phase 1's blast radius is exactly two files.

**Deliverables:**

- D1.1. `FrameBufferRenderable.constructor()` stores `width` and `height` but no longer allocates an `OptimizedBuffer`. The `frameBuffer` field becomes nullable or guarded behind `ensureBuffer()`.
- D1.2. New private method `ensureBuffer()` allocates the buffer on first call and caches the result. Calls `OptimizedBuffer.create()` (terminal path still uses the native lib — this isn't a browser fix, just a timing fix). Also reallocates on resize after first render, destroying the previous buffer.
- D1.3. `renderSelf()` (and `onResize()`) call `ensureBuffer()` before touching `frameBuffer`.
- D1.4. `ASCIIFontRenderable` moves its `renderFontToBuffer` call from constructor (line 79) into a `populateBuffer()` method. A dirty flag triggers repopulation when `text`, `font`, `color`, or `backgroundColor` props change (see setters on lines 86-131 of rev 2's `ASCIIFont.ts`). `populateBuffer()` is called after `ensureBuffer()` on each render if the dirty flag is set.
- D1.5. Observable Bun behavior is byte-identical to baseline. Snapshot regression guard catches any drift.

**Tests to write first** (all must fail on main):

| Test file | Test name | Asserts |
|---|---|---|
| `packages/core/src/renderables/__tests__/frame-buffer.test.ts` | `constructor does not call resolveRenderLib` | Spy over `resolveRenderLib`, construct a `FrameBufferRenderable`, assert spy never called. INV-2 partial. |
| `packages/core/src/renderables/__tests__/frame-buffer.test.ts` | `constructor does not allocate a buffer` | Construct, assert the internal `frameBuffer` ref is null/undefined before any render. |
| `packages/core/src/renderables/__tests__/frame-buffer.test.ts` | `render allocates exactly once across 5 calls` | Spy over `OptimizedBuffer.create`, render 5 times, assert exactly one allocation. |
| `packages/core/src/renderables/__tests__/frame-buffer.test.ts` | `width and height are derived from props, not buffer` | Construct with width=10, height=5. Assert `renderable.width === 10` without any render call. |
| `packages/core/src/renderables/__tests__/frame-buffer.test.ts` | `resize before first render updates props without allocating` | Construct at 10×5, resize to 20×10 before rendering. Assert no allocation happened and `width/height` reflect the resize. |
| `packages/core/src/renderables/__tests__/frame-buffer.test.ts` | `resize after first render reallocates and destroys old buffer` | Render, resize, render. Assert `create` called twice and first buffer's `destroy()` was called. |
| `packages/core/src/renderables/__tests__/ascii-font.test.ts` | `ascii-font renders byte-identically to baseline golden for "hello" tiny font` | Compare output against Phase 0 golden. |
| `packages/core/src/renderables/__tests__/ascii-font.test.ts` | `text prop change triggers buffer repopulation on next render` | Change text, render, assert new glyph data overwrote old (dirty flag path). |
| `packages/core/src/renderables/__tests__/ascii-font.test.ts` | `font prop change triggers buffer repopulation on next render` | Same, for font. |
| `packages/demo/test/bun-regression.test.ts` | `all Bun demo snapshots match baseline-0.2.58` | Walks every demo, compares to Phase 0 goldens. INV-5. |

**Implementation checklist:**
- [ ] Write 10 tests. Run `bun test` and confirm all 10 fail.
- [ ] Refactor `FrameBufferRenderable` per D1.1–D1.3.
- [ ] Refactor `ASCIIFontRenderable` per D1.4.
- [ ] Iterate tests to green.
- [ ] Run full `bun run test` at monorepo root. Zero regressions.

**Exit criteria:**
- [ ] All 10 Phase 1 tests green.
- [ ] INV-2 validated (constructor spy test passes).
- [ ] INV-5 validated (snapshot regression clean).
- [ ] Zero regression in existing tests.

**Rollback:** Revert the PR. Self-contained; Phases 2+ have not started yet.

**Files touched:**

| File | Change |
|---|---|
| `packages/core/src/renderables/FrameBuffer.ts` | Lazy allocation via `ensureBuffer()` |
| `packages/core/src/renderables/ASCIIFont.ts` | Move population into `populateBuffer()`, dirty-flagged |
| `packages/core/src/renderables/__tests__/frame-buffer.test.ts` | **new** |
| `packages/core/src/renderables/__tests__/ascii-font.test.ts` | **new** |
| `packages/demo/test/bun-regression.test.ts` | **new** |

---

### Phase 2 — Runtime capability contract (1 week, 1 engineer)

**Goal:** Make the JSX types tell the truth about runtime support. Every intrinsic gets a capability tag in an **overlay map** (not a prop-type refactor). Browser JSX types filter to only browser-compatible intrinsics. Using `<ascii-font>` in a browser-typed project becomes a compile error with an actionable message.

Note: at the end of Phase 2, browser users can no longer reach `<ascii-font>` at all. Phase 3 restores it via a dedicated implementation. Phases 2 and 3 therefore ship together as a single release (see §10).

**Scope clarification (NG9).** We are **not** rewriting `packages/core/src/react/types/components.ts`. Existing prop types (`TextProps`, `BoxProps`, `AsciiFontProps`, `InputProps`, `TextareaProps`, `LineNumberProps`, …) stay byte-identical. The capability tag lives in a new overlay map keyed by intrinsic *name*. The browser JSX filter reads the overlay, not a restructured prop-type.

**Deliverables:**

- D2.1. New file `packages/core/src/react/types/runtime-capability.ts` exporting:
  - `RuntimeCapability` (the 4-variant union from §4.4)
  - `IntrinsicCapabilities` (the `Record<string, RuntimeCapability>` map type)
  - `intrinsicCapabilities` (the concrete `as const` overlay from §4.4)
  - A type helper `IsBrowserCompatible<K extends string>` that evaluates to `true` if `intrinsicCapabilities[K] extends "universal" | "dual-impl" | "browser-only"`.
- D2.2. `packages/core/src/react/types/runtime-capability.ts` is re-exported from `packages/core/src/react/components/index.ts` alongside `getComponentCatalogue`, so the browser JSX types file can reach both without crossing module layers.
- D2.3. `packages/web/src/gridland-jsx.d.ts` filters intrinsic names via the overlay:
  ```ts
  import type { intrinsicCapabilities } from "../../core/src/react/types/runtime-capability"
  type Caps = typeof intrinsicCapabilities
  type BrowserIntrinsicNames = {
    [K in keyof Caps]: Caps[K] extends "universal" | "dual-impl" | "browser-only" ? K : never
  }[keyof Caps]
  // In the `declare module "react"` IntrinsicElements block, include ONLY the keys
  // from BrowserIntrinsicNames. Terminal-only intrinsic names are omitted.
  ```
  Existing prop-type references in `gridland-jsx.d.ts` (e.g., `GridlandBoxProps`, `GridlandInputProps`) stay but `"input"`, `"textarea"`, `"line-number"`, and `"ascii-font"` are removed from the `IntrinsicElements` block. Phase 3 re-adds `"ascii-font"` when it flips to `dual-impl`.
- D2.4. Build-time assertion script `packages/core/scripts/check-intrinsic-tags.ts`. Reads `componentCatalogue` keys from `packages/core/src/react/components/index.ts` and `intrinsicCapabilities` keys from `packages/core/src/react/types/runtime-capability.ts`. Fails the build with an actionable error if the two key sets differ. Wired into `bun run build` via `packages/core/package.json` (currently has only a `test` script; add a `build` script that invokes this checker).
- D2.5. Update `packages/core/CLAUDE.md` (or create it if absent) with a new "Adding a new intrinsic" section documenting the capability-tag requirement.
- D2.6. Error message customization: when the TypeScript compile error fires for a terminal-only intrinsic used in browser context, TypeScript emits a "Property 'ascii-font' does not exist on type 'JSX.IntrinsicElements'" error by default. Enhance by attaching a JSDoc `@deprecated` tag with a link to this task on the terminal-only intrinsic entries in the *core* JSX namespace so tooling can surface migration guidance. If this proves impractical within the phase budget, ship the generic TS error and close Q3 (see §14).

**Tests to write first:**

| Test file | Test name | Asserts |
|---|---|---|
| `packages/core/src/react/types/__tests__/runtime-capability.test-d.ts` | `RuntimeCapability is exactly the 4 expected variants` | Type-level: union equals the 4 literals, no more, no less. `expect-type` or `tsd`. |
| `packages/core/src/react/types/__tests__/intrinsic-tags.test.ts` | `componentCatalogue keys and intrinsicCapabilities keys are identical sets` | INV-1. Runtime equality of `Object.keys(getComponentCatalogue()).sort()` vs `Object.keys(intrinsicCapabilities).sort()`. |
| `packages/core/scripts/__tests__/check-intrinsic-tags.test.ts` | `build script fails on untagged fixture` | Fixture with a missing tag, run checker, exit non-zero with an actionable error message. |
| `packages/core/scripts/__tests__/check-intrinsic-tags.test.ts` | `build script passes on clean catalogue` | Current state, exit zero. |
| `packages/web/test/type-check/browser-jsx-filter.test-d.ts` | `browser types include universal intrinsics` | `<box>`, `<text>`, `<span>` compile in a browser JSX context. |
| `packages/web/test/type-check/browser-jsx-filter.test-d.ts` | `browser types include dual-impl intrinsics (synthetic)` | A synthetic `intrinsicCapabilities` entry with `"dual-impl"` is assignable (test uses a type-only augmentation fixture). |
| `packages/web/test/type-check/browser-jsx-filter.test-d.ts` | `browser types exclude Gridland-unique terminal-only intrinsics` | INV-3. Gridland-unique terminal-only names (`<ascii-font>` pre-Phase-3, `<line-number>`) do NOT compile in browser context via `@ts-expect-error`. Note: `<input>` and `<textarea>` collide with HTML element names React already types, so they still compile but resolve to `HTMLInputElement` / `HTMLTextAreaElement`; the runtime-tag test in `intrinsic-tags.test.ts` is the source of truth for those two. See §5 INV-3 carve-out. |
| `packages/web/test/type-check/browser-jsx-filter.test-d.ts` | `BrowserIntrinsicNames type resolves to the expected name union` | Type equality assertion against the hand-written expected union of browser-compatible names. |

**Implementation checklist:**
- [ ] Write 8 tests. Confirm they fail.
- [ ] Create `runtime-capability.ts` with the union, overlay map, and `IsBrowserCompatible` helper.
- [ ] Re-export from `components/index.ts`.
- [ ] Update `packages/web/src/gridland-jsx.d.ts` to remove terminal-only keys and add the filtered-name mechanism. Also update `react/jsx-runtime` and `react/jsx-dev-runtime` blocks — all three must stay in lockstep (today they are, per `gridland-jsx.d.ts:81-159`).
- [ ] Implement `check-intrinsic-tags.ts`, wire into `packages/core/package.json` build script.
- [ ] Run `bun run build` at monorepo root; confirm green.
- [ ] Update `CLAUDE.md` and error message tooling.

**Exit criteria:**
- [ ] INV-1 and INV-3 validated.
- [ ] `bun run build` fails on untagged fixture with an actionable message (verified by the test).
- [ ] Documentation updated.
- [ ] Zero runtime behavior change.

**Rollback:** Revert the PR. Type-system only; no runtime impact.

**Files touched:**

| File | Change |
|---|---|
| `packages/core/src/react/types/runtime-capability.ts` | **new** |
| `packages/core/src/react/components/index.ts` | Re-export runtime-capability module |
| `packages/core/src/react/types/__tests__/runtime-capability.test-d.ts` | **new** |
| `packages/core/src/react/types/__tests__/intrinsic-tags.test.ts` | **new** |
| `packages/core/scripts/check-intrinsic-tags.ts` | **new** |
| `packages/core/scripts/__tests__/check-intrinsic-tags.test.ts` | **new** |
| `packages/core/package.json` | Add `build` script wired to checker |
| `packages/web/src/gridland-jsx.d.ts` | Drop terminal-only keys; wire filter |
| `packages/web/test/type-check/browser-jsx-filter.test-d.ts` | **new** |
| `packages/core/CLAUDE.md` | Document rule (create file if absent) |

---

### Phase 3 — Dedicated browser `<ascii-font>` (1.5 weeks, 1 engineer)

**Goal:** Ship a small, focused browser implementation of `<ascii-font>` that doesn't go through `RenderLib`. Upgrade the capability tag from `terminal-only` to `dual-impl`. Restore the cross-runtime promise without touching the terminal path.

**Deliverables:**

- D3.1. New file `packages/web/src/components/browser-ascii-font.ts` exporting `BrowserAsciiFontRenderable`. **Extends `Renderable` from `packages/core/src/Renderable.ts`** — not `FrameBufferRenderable`, not `BaseRenderable`. Overrides `renderSelf(buffer, deltaTime)`. At runtime, `buffer` is the browser's `BrowserBuffer` (see `packages/web/src/browser-buffer.ts`) duck-typed as `OptimizedBuffer`; the implementation calls `buffer.setCell(x, y, char, fgColor, bgColor, attr)` directly, using the same API shape that existing browser-renderable intrinsics already rely on. Constructor accepts the same options shape as `ASCIIFontRenderable` (`ASCIIFontOptions` from `packages/core/src/renderables/ASCIIFont.ts:19-27`); width/height computed by calling `measureText({ text, font })` from `packages/core/src/lib/ascii.font.ts`. No buffer allocation, no `OptimizedBuffer.create`, no `resolveRenderLib`.
- D3.2. Implementation approach: `renderSelf()` iterates characters in `this._text`, looks up glyph row arrays via `fonts[this._font].chars[char]` (a `string[]`, each entry is a row of the glyph, already pre-formatted in the JSON), and copies codepoints cell-by-cell into the destination `BrowserBuffer` at `(this.x + dx, this.y + dy)` via `setCell`. Color resolution uses the same `parseColor` helper the terminal path uses (already browser-safe — it's in `packages/core/src/lib/RGBA.ts`, no FFI). Target ≤ 100 LOC; realistically ~60-80. Prop setters for `text`, `font`, `color`, `backgroundColor` call `this.requestRender()` (no buffer repopulation needed — `renderSelf` reads props on every frame).
- D3.3. **No new font-data file.** `BrowserAsciiFontRenderable` reuses `packages/core/src/lib/ascii.font.ts`'s exports directly: `import { fonts, measureText, getCharacterPositions } from "../../../core/src/lib/ascii.font"`. Import chain verified browser-safe in spec rev 3 (§4.2): `ascii.font.ts` → `buffer.ts` → `zig-registry.ts` are all side-effect-free at module init; `buffer.ts`'s `bun:ffi` require is lazy-wrapped in a function that is never called from this code path; `zig-registry.ts`'s comment reads *"Zero native imports. Can be imported by both native and browser code."* `packages/core/src/lib/ascii.font.ts` is the single source of truth for font data in both runtimes.
- D3.4. New side-effect module `packages/web/src/components/register.ts`. Imports `extend` from `../../../core/src/react/components` (same path shape as `create-browser-root.tsx`'s existing core imports, see §4.3 precedent note) and registers browser overrides by calling `extend({ "ascii-font": BrowserAsciiFontRenderable })` at module init. Exports nothing. Re-imported exactly once from `packages/web/src/create-browser-root.tsx` as the very first import, so it runs before any `_createContainer` call. **Must be marked as a side-effect file** — add `"sideEffects": ["./src/components/register.ts"]` to `packages/web/package.json` so bundlers (Vite, Webpack, esbuild in production mode) cannot tree-shake the import away. File-scoped rather than `"sideEffects": true` so the rest of `@gridland/web` remains tree-shakable; this is decided (rev 4) and not an open question for the implementing engineer.
- D3.5. Update `packages/web/src/create-browser-root.tsx` to add the `import "./components/register"` side-effect import as its first line (before `import React`). Add a one-line comment pointing to §4.3 explaining why load order matters. No other changes to `browser-renderer.ts` are required — the override is applied to core's module-level `componentCatalogue` singleton, which `host-config.ts:42` reads on every `createInstance` call. Add the `"sideEffects": ["./src/components/register.ts"]` entry to `packages/web/package.json` in the same commit as this import, so the tree-shaking protection lands atomically with the code it protects.
- D3.6. Upgrade `ascii-font` capability tag from `terminal-only` to `dual-impl` in `packages/core/src/react/types/runtime-capability.ts`. Browser JSX namespace now includes it (automatic via the Phase 2 filter). Re-add the `"ascii-font": Record<string, any>` entries to all three `IntrinsicElements` blocks in `gridland-jsx.d.ts` that were removed in Phase 2.
- D3.7. Visual parity: browser `ascii-font` output matches terminal output byte-for-byte for the same input across all 7 supported fonts and all printable ASCII text 0x20–0x7E. Enforced by a shared golden file committed once per (font, text) pair at `packages/web/test/__goldens__/ascii-font/<font>-<text-hash>.txt`. Golden format: deterministic cell-by-cell dump (`x y codepoint fg bg attrs` per line). **Parity test lives in `packages/web/`, not `packages/core/`** (rev 3 fix — rev 2's placement in `packages/core/` would have forced `core → web` imports). The parity test at `packages/web/test/ascii-font.parity.test.ts` runs under `bun test`, which executes in a Bun runtime where `RenderLib` is available. The terminal side constructs the real `ASCIIFontRenderable` from core against a real `OptimizedBuffer` (no stubbing of the native path — Bun provides it natively during the test). After the render lands in the OptimizedBuffer, the test reads the resulting cell grid directly. The browser side constructs `BrowserAsciiFontRenderable` against a lightweight `BrowserBuffer`-shaped capture harness that records every `setCell` call into a cell grid of the same shape. Both cell grids are serialized with the golden's canonical format and compared against the committed golden (not against each other directly). No core code imports from web.
- D3.8. Documentation: new section in `packages/web/README.md` describing `<ascii-font>` browser support, list of supported fonts (all 7), and any documented divergences from the terminal path (ideally none).

**Tests to write first:**

| Test file | Test name | Asserts |
|---|---|---|
| `packages/web/src/components/__tests__/browser-ascii-font.test.ts` | `renders "hello" in tiny font into a mock BrowserBuffer` | Unit test. Construct, call renderSelf on mock buffer (captures `setCell` calls), compare captured writes to a small hand-crafted expected region derived from `fonts.tiny.chars`. |
| `packages/web/src/components/__tests__/browser-ascii-font.test.ts` | `renders all 7 built-in fonts for non-empty input` | Sanity per font: `tiny`, `block`, `shade`, `slick`, `huge`, `grid`, `pallet`. Each produces ≥ 1 non-space cell. |
| `packages/web/src/components/__tests__/browser-ascii-font.test.ts` | `empty text produces zero non-space cells` | Edge case. |
| `packages/web/src/components/__tests__/browser-ascii-font.test.ts` | `constructor does not allocate a buffer` | Spy over `OptimizedBuffer.create`, construct, confirm spy never called. |
| `packages/web/src/components/__tests__/browser-ascii-font.test.ts` | `constructor does not call resolveRenderLib` | Spy over `resolveRenderLib`, construct, confirm spy never called. |
| `packages/web/src/components/__tests__/browser-ascii-font.test.ts` | `clipping at right edge does not overflow buffer` | Render at x = width - 2, assert no captured writes to x ≥ width. |
| `packages/web/src/components/__tests__/browser-ascii-font.test.ts` | `clipping at bottom edge does not overflow buffer` | Analogous for y. |
| `packages/web/src/components/__tests__/browser-ascii-font.test.ts` | `text prop change triggers re-render of glyph data` | Change prop, render, assert captured cells differ. |
| `packages/web/src/components/__tests__/browser-ascii-font.test.ts` | `width and height derive from measureText(text, font)` | Construct with text="AB", font="tiny", assert `.width` and `.height` match `measureText` return values. |
| `packages/web/test/ascii-font.parity.test.ts` | `terminal and browser produce byte-identical cells for "TEST" in tiny font` | INV-6. Run terminal `ASCIIFontRenderable` path (mocked OptimizedBuffer capturing writes) and `BrowserAsciiFontRenderable` path (BrowserBuffer capturing writes) into independent cell maps; diff; must be zero-diff against the committed golden. |
| `packages/web/test/ascii-font.parity.test.ts` | `parity holds across all 7 fonts and a representative text set` | Parametrized: `["HELLO", "Hello, World!", "1234567890", "a b c"] × ["tiny", "block", "shade", "slick", "huge", "grid", "pallet"]` (28 cases). |
| `packages/web/test/browser-ascii-font.e2e.ts` | `ascii-font mounts in browser Vite app without console errors` | Playwright. Mount `<TUI><ascii-font text="hello" /></TUI>`, wait for first paint, assert no console errors containing "No RenderLib registered" or "resolveRenderLib". INV-4. |
| `packages/web/test/browser-ascii-font.e2e.ts` | `ascii-font produces visible cells in the canvas buffer` | Playwright. After paint, `page.evaluate` to read BrowserBuffer cells, assert ≥ 1 non-space codepoint in the renderable's region. |
| `packages/web/test/browser-ascii-font.e2e.ts` | `font prop change updates the canvas` | Playwright. Change from `tiny` to `block`, assert cells change. |
| `packages/web/src/components/__tests__/register.test.ts` | `importing create-browser-root registers BrowserAsciiFontRenderable in componentCatalogue` | Fresh module graph, `await import("../../create-browser-root")`, then assert `getComponentCatalogue()["ascii-font"] === BrowserAsciiFontRenderable`. Proves the side-effect import runs on core's singleton before any reconciler call. |

**Implementation checklist:**
- [ ] Write 15 tests. Confirm all fail on the Phase 2 HEAD.
- [ ] Implement `BrowserAsciiFontRenderable` per D3.1–D3.2. Extends `Renderable`. Imports `fonts`, `measureText`, `parseColor` from core via internal paths (§4.3 precedent).
- [ ] Create `packages/web/src/components/register.ts` that calls `extend({ "ascii-font": BrowserAsciiFontRenderable })` per §4.3.
- [ ] Add `import "./components/register"` as the first line of `packages/web/src/create-browser-root.tsx`.
- [ ] Upgrade capability tag for `ascii-font` from `terminal-only` to `dual-impl` in `runtime-capability.ts`. Re-add `"ascii-font"` to the three `IntrinsicElements` blocks in `gridland-jsx.d.ts`.
- [ ] Run parity tests. Iterate until byte-identical output across all (font, text) pairs against the committed golden.
- [ ] Run Playwright e2e. Confirm INV-4.
- [ ] Measure bundle delta. Must be ≤ 12 KB gzipped (G6).
- [ ] Update `packages/web/README.md`.

**Exit criteria:**
- [ ] All 15 Phase 3 tests green.
- [ ] INV-4 validated (browser mount doesn't throw).
- [ ] INV-5 still validated (no terminal regression).
- [ ] INV-6 validated (parity goldens match).
- [ ] Bundle delta ≤ 12 KB gzipped.
- [ ] Documentation updated.

**Rollback:** Revert the PR. `ascii-font` goes back to `terminal-only` from Phase 2; browser users go back to a compile error. Terminal path unaffected. No user is worse off than before this task started.

**Risks specific to Phase 3:**
- **Parity test reveals implementation differences.** If the terminal (native `renderFontToFrameBuffer`) and JS (walking `fonts[f].chars` by hand) outputs can't be made byte-identical for some edge case, the golden is updated to match the JS implementation's output and the divergence is documented in `packages/web/README.md`. Web-platform lead signs off. Mitigated by the fact that both paths read the same JSON data, so divergence is structurally unlikely.
- **Bundle delta exceeds 12 KB gzipped.** Mitigation: lazy-load per font (import `fonts/tiny.json` eagerly, dynamic-import the other 6). Implementation sketch documented in the changelog as a follow-up if the limit is hit; not implemented upfront.

**Files touched:**

| File | Change |
|---|---|
| `packages/web/src/components/browser-ascii-font.ts` | **new** |
| `packages/web/src/components/register.ts` | **new** — side-effect module; calls `extend()` at import time |
| `packages/web/src/components/__tests__/browser-ascii-font.test.ts` | **new** |
| `packages/web/src/components/__tests__/register.test.ts` | **new** |
| `packages/web/src/create-browser-root.tsx` | Add `import "./components/register"` as first line |
| `packages/web/src/gridland-jsx.d.ts` | Re-add `"ascii-font"` to the three IntrinsicElements blocks |
| `packages/web/README.md` | Document browser ascii-font support |
| `packages/core/src/react/types/runtime-capability.ts` | Upgrade `ascii-font` to `dual-impl` |
| `packages/web/test/ascii-font.parity.test.ts` | **new** — parity test lives in web, not core |
| `packages/web/test/__goldens__/ascii-font/*.txt` | **new** — 28 golden files (7 fonts × 4 text samples) |
| `packages/web/test/browser-ascii-font.e2e.ts` | **new** |

---

### Phase 4 — Guardrails (3 days, 1 engineer)

**Goal:** Prevent regression of the entire class of bug. Enforce the renderable constructor rule in CI so no future renderable can reintroduce runtime-singleton dependencies in its constructor.

**Deliverables:**

- D4.1a. New rule file `.claude/rules/renderable-constructors.md`. Scope: every renderable author in the monorepo. Content: *"Renderable constructors must not call `resolveRenderLib`, `registerRenderLib`, `OptimizedBuffer.create`, or any module-level import from `zig-registry.ts`. Resource allocation happens lazily in `renderSelf()` via `ensureBuffer()` or equivalent. Rationale: constructors run during React reconciliation, before any runtime capability is known; any singleton dependency at construction time will crash runtimes that don't provide it. See `tasks/003-browser-compat-contract.md` §2.2 and Phase 1 for the bug this rule prevents."*
- D4.1b. New rule file `.claude/rules/web-core-import-exemption.md`. Scope: `packages/web/` authors only. Content: *"The root CLAUDE.md rule 'Never import from `@gridland/core` directly — it is internal' governs `@gridland/ui` and user-facing scaffolded code. `@gridland/web` is a monorepo-internal package that is deliberately deep-coupled to core's internal paths. See `packages/web/src/create-browser-root.tsx:5-8` for the existing precedent — direct imports from `../../core/src/react/reconciler/reconciler`, `../../core/src/react/components/app`, and `../../core/src/react/runtime/runtime-context` have shipped since the package's inception. Framework-compliance must not flag direct `packages/core/src/...` imports originating from inside `packages/web/`. See `tasks/003-browser-compat-contract.md` §4.3 and §12 for the full rationale."* These two rules have distinct scopes and were deliberately split in rev 4; do not recombine them.
- D4.2. New script `scripts/lint-renderable-contracts.ts`. AST walk over `packages/core/src/renderables/**/*.ts` and `packages/web/src/components/**/*.ts`. Uses TypeScript's compiler API (not regex) to walk constructor bodies and detect forbidden calls or imports. Fails with an actionable error naming the file, line, and violating call.
- D4.3. Wire the script into CI as a required check. Fails the build on any violation.
- D4.4. Framework-compliance review agent extension: the agent reads `.claude/rules/renderable-constructors.md` during `/review` runs and flags any PR that violates either rule in D4.1, even before CI runs.
- D4.5. Update `packages/core/CLAUDE.md` with an "Anti-pattern: constructor-side singleton calls" section pointing to this rule.
- D4.6. Final audit. Run the script across the full monorepo (not just renderables/). Snapshot results to `tasks/003-audit-final.csv`. If any file outside the intended boundaries calls `resolveRenderLib`, file follow-up issues.

**Tests to write first:**

| Test file | Test name | Asserts |
|---|---|---|
| `scripts/__tests__/lint-renderable-contracts.test.ts` | `passes on clean tree` | Run on current state, exit zero. |
| `scripts/__tests__/lint-renderable-contracts.test.ts` | `fails on fixture importing resolveRenderLib from a renderable` | Fixture file with the forbidden import, run script, exit non-zero. Error message names the file and line. |
| `scripts/__tests__/lint-renderable-contracts.test.ts` | `fails on fixture calling OptimizedBuffer.create in constructor body` | Different violation class, same detection. |
| `scripts/__tests__/lint-renderable-contracts.test.ts` | `ignores calls outside constructor bodies` | Fixture with `OptimizedBuffer.create` in a method (not constructor), script passes. |
| `scripts/__tests__/lint-renderable-contracts.test.ts` | `ignores imports outside renderables/ and components/` | Fixture elsewhere in the monorepo with the forbidden import, script passes. |

**Implementation checklist:**
- [ ] Write 5 tests. Confirm they fail (the first should pass, the rest fail).
- [ ] Implement the AST walker.
- [ ] Wire into CI via `.github/workflows/lint.yml` or equivalent.
- [ ] Write the rule file.
- [ ] Update framework-compliance agent config.
- [ ] Update `CLAUDE.md`.
- [ ] Run final audit, snapshot to CSV.

**Exit criteria:**
- [ ] All 5 Phase 4 tests green.
- [ ] CI fails on synthetic violation fixture.
- [ ] CI passes on clean tree.
- [ ] INV-1, INV-2 fully enforced at build time.
- [ ] Rule file and CLAUDE.md updated.
- [ ] Audit CSV committed.

**Rollback:** Revert the PR. Regression protection removed; no other impact.

**Files touched:**

| File | Change |
|---|---|
| `.claude/rules/renderable-constructors.md` | **new** (D4.1a — constructor contract only) |
| `.claude/rules/web-core-import-exemption.md` | **new** (D4.1b — `@gridland/web` → core import exemption only) |
| `scripts/lint-renderable-contracts.ts` | **new** |
| `scripts/__tests__/lint-renderable-contracts.test.ts` | **new** |
| `.github/workflows/lint.yml` | Wire the script |
| `packages/core/CLAUDE.md` | Anti-pattern section |
| `tasks/003-audit-final.csv` | **new** |

## 7. Test Strategy

### 7.1 Test pyramid

| Layer | Count target | Purpose |
|---|---|---|
| Type-level (`tsd` / `expect-type`) | 4 | Validate capability-tag types and conditional-type filters (Phase 2) |
| Unit | 22 | Single-class behavior, fast feedback (Phase 1: 10, Phase 3 unit: 9, Phase 4: 5 minus 2 fixture-based = 3 pure unit) |
| Integration | 3 | Multi-class interaction (parity test + register test + snapshot regression) |
| E2E (Playwright) | 3 | Real browser mount and visual assertion (Phase 3) |
| Snapshot / golden | 2 | Byte-identical parity across runtimes and time (parity test reads 28 goldens but counts as one test file with parametrized cases) |
| Static / AST walk | 4 | Forbidden-construct detection (Phase 4 fixture cases) |

Total: 38 tests across 4 phases (Phase 1: 10, Phase 2: 8, Phase 3: 15, Phase 4: 5).

### 7.2 Golden files

Parity goldens live in `packages/web/test/__goldens__/ascii-font/`. Format: a deterministic textual dump of cell data (`x y codepoint fg bg attrs` per line) for a given (font, text) pair. Terminal and browser implementations both assert against the same goldens; the golden is the source of truth.

Regeneration is explicit opt-in via `bun run scripts/regenerate-goldens.ts`. CI never auto-updates goldens; drift fails the build and requires review.

### 7.3 Test-first discipline

Every phase's PR stack must have a "Phase N: failing tests" commit as the first commit. Reviewers verify the commit fails (by running CI on that commit alone or running locally) before reviewing subsequent implementation commits. This is enforced in the PR template (§15).

### 7.4 Local development loop

Engineers on this task run, in three terminals:
```
bun run --cwd packages/core test --watch
bun run --cwd packages/web test --watch
bun run --cwd packages/demo test --watch
```
Red tests are blockers; no commit lands red.

## 8. Performance Budgets

Measured on a 2023 M-series MacBook Pro, release builds.

| Metric | Budget | Phase gate |
|---|---|---|
| `ascii-font` Bun render, 10/40/80 chars | Baseline ± 5% | Phase 1 |
| `ascii-font` browser render, 10 chars | < 2 ms | Phase 3 |
| `ascii-font` browser render, 40 chars | < 5 ms | Phase 3 |
| `ascii-font` browser render, 80 chars | < 8 ms | Phase 3 |
| `@gridland/web` bundle size delta | ≤ 12 KB gzipped | Phase 3 final gate |
| `@gridland/core` bundle size delta | ≤ 2 KB gzipped | Phase 2 + Phase 4 |
| `@gridland/bun` bundle size delta | 0 | (terminal path untouched) |

Soft miss (≤ 10% over): file follow-up, may ship. Hard miss (> 10% over): phase does not land until resolved.

**Why 12 KB for web.** All 7 font JSONs gzip to ~8.8 KB (measured: `gzip -c packages/core/src/lib/fonts/*.json | wc -c` → 8789). Add `BrowserAsciiFontRenderable` (~80 LOC) + `register.ts` (~10 LOC) + module overhead. 12 KB is tight-but-honest; lazy-loading per font is the escape hatch if Phase 3 measurements exceed it (see Phase 3 risks).

## 9. Observability

- Dev-mode warning in `FrameBufferRenderable.ensureBuffer()` if called during reconciliation instead of render (defense-in-depth against regressing INV-2 at runtime).
- Type-check error messages for terminal-only intrinsics in browser context include a link to this task doc (via `@deprecated` JSDoc on the terminal-only JSX namespace entries, if feasible within Phase 2 budget — otherwise the generic TS error is acceptable; see Q3).
- `lint-renderable-contracts.ts` error messages include file path, line number, and the specific forbidden call. No silent failures.

## 10. Rollout

One release: **`0.3.0`** containing all 4 phases.

Phases 2 and 3 must ship together. Phase 2 alone breaks browser users' existing (crashing) `<ascii-font>` code by turning it into a compile error — that's arguably an improvement, but it removes the intrinsic from their toolbox. Phase 3 restores it with a working implementation. Shipping the two together means users go from "crashes at runtime" directly to "works in the browser," with no regression window.

Phase 1 is independent and could technically ship earlier (e.g., as 0.2.59). Recommendation: bundle into 0.3.0 to reduce release overhead. Phase 4 is internal-only (CI guardrail) and can ship in the same release or a patch follow-up.

**Critical path: Phase 3.** The visible feature — browser `<ascii-font>` — lands in Phase 3. Every user-facing commitment in the changelog (and the 0.3.0 release blurb) depends on Phase 3 being green. The 1.5-week Phase 3 budget is tight (new renderable class + 15 tests + 28 parity goldens + Playwright e2e + bundle measurement + README). If anything slips, it slips here. Watch the Phase 3 risk table (parity drift, bundle budget) at every standup.

**Staffing plan (2-engineer, ~3 weeks wall clock):**

| Week | Engineer A (critical path) | Engineer B |
|---|---|---|
| 1 | Phase 0 (half day) → Phase 1 (FrameBufferRenderable lazy allocation, ASCIIFontRenderable populateBuffer dirty flag) | Phase 0 (half day) → Phase 2 start (runtime-capability.ts, overlay map, build-time checker) |
| 2 | Phase 3 start (BrowserAsciiFontRenderable + register.ts + parity test scaffolding). Phase 2 must have merged before this week begins; if it hasn't, Engineer A picks up Phase 2 finish and Engineer B rolls forward to Phase 4. | Phase 2 finish → Phase 4 start (AST walker, rule file split, CI wire-up) |
| 3 | Phase 3 finish (goldens, Playwright e2e, bundle measurement, README) | Phase 4 finish (audit CSV, framework-compliance agent config, final review) |

**Single-engineer fallback:** If only one engineer is available, the phase order is strict (1 → 2 → 3 → 4) and the wall-clock estimate is ~4 weeks, not 3. Do not make 3-week commitments on a single-engineer staffing. Phase 3 is still the critical path and still the risk concentration; the single engineer should plan to hit Phase 3 no later than the start of week 3.

**Phase dependencies (make these explicit so an engineer doesn't accidentally start Phase 3 early):**
- Phase 2 → Phase 3: Phase 3 flips `ascii-font` from `terminal-only` to `dual-impl` in `runtime-capability.ts`. That file doesn't exist until Phase 2 lands.
- Phase 1 → Phase 4: Phase 4's AST lint rule assumes constructors no longer call runtime singletons. Phase 1 establishes that invariant. Phase 4 can start as soon as Phase 1 merges; it does not need to wait for Phase 2 or 3.
- Phase 0 → everything: baselines must be committed before any refactor, or Phase 1's INV-5 snapshot regression check has nothing to compare against.

No feature flags. No migration guide needed for terminal users — their path is byte-identical. Browser users get a breaking change (compile error on `terminal-only` intrinsics `input`, `textarea`, `line-number`), and a working browser implementation for `ascii-font` in the same release. Changelog must prominently call out the three terminal-only intrinsics and point to `<text>`-based workarounds.

Changelog entry drafted by the engineer executing Phase 3, reviewed by web-platform lead.

## 11. Appendix A — Runtime capability signatures

```ts
// packages/core/src/react/types/runtime-capability.ts

/** Where a JSX intrinsic can render. */
export type RuntimeCapability =
  /** Single implementation works in terminal and browser runtimes. */
  | "universal"
  /** Separate implementations per runtime, sharing an intrinsic name and prop shape. */
  | "dual-impl"
  /** Terminal runtimes only. Compile error in browser context. */
  | "terminal-only"
  /** Browser only. Reserved for future intrinsics that only make sense in a browser. */
  | "browser-only"

/** Overlay map keyed by intrinsic name. Declared alongside the reconciler catalogue. */
export type IntrinsicCapabilities = Record<string, RuntimeCapability>

export const intrinsicCapabilities = {
  box: "universal",
  text: "universal",
  span: "universal",
  b: "universal",
  strong: "universal",
  i: "universal",
  em: "universal",
  u: "universal",
  br: "universal",
  a: "universal",
  code: "universal",
  diff: "universal",
  markdown: "universal",
  scrollbox: "universal",
  select: "universal",
  "tab-select": "universal",
  "ascii-font": "terminal-only", // upgraded to "dual-impl" at end of Phase 3
  input: "terminal-only",
  textarea: "terminal-only",
  "line-number": "terminal-only",
} as const satisfies IntrinsicCapabilities

/** Type-level predicate: is this intrinsic name browser-compatible? */
export type IsBrowserCompatible<K extends keyof typeof intrinsicCapabilities> =
  (typeof intrinsicCapabilities)[K] extends "universal" | "dual-impl" | "browser-only" ? true : false

/** The set of intrinsic names reachable from browser JSX. */
export type BrowserIntrinsicNames = {
  [K in keyof typeof intrinsicCapabilities]: IsBrowserCompatible<K> extends true ? K : never
}[keyof typeof intrinsicCapabilities]
```

**Intentionally NOT used:** An earlier draft wrapped every intrinsic in `IntrinsicDefinition<TProps>`. That would have forced a rewrite of every existing prop type (`TextProps`, `BoxProps`, `AsciiFontProps`, etc.) in `packages/core/src/react/types/components.ts`, with cascading type-check failures across the whole codebase. The overlay-map approach above keeps all existing prop types untouched and adds the capability contract as a parallel structure. See NG9.

Invariants (validated by Phase 2 tests):
- **I-C1.** `RuntimeCapability` is exactly the 4 string literals above, no more.
- **I-C2.** `Object.keys(getComponentCatalogue())` and `Object.keys(intrinsicCapabilities)` are identical sets.
- **I-C3.** The browser JSX namespace is exactly the set of intrinsics in `BrowserIntrinsicNames`.

## 12. Appendix B — Browser catalogue override via `extend()`

The browser does **not** build its own catalogue. It mutates core's module-level singleton at boot, using the pre-existing `extend()` API:

```ts
// packages/web/src/components/register.ts (new, finalized in Phase 3)

import { extend } from "../../../core/src/react/components"
import { BrowserAsciiFontRenderable } from "./browser-ascii-font"

// Side-effect module. Runs once at import time, before any React render.
// Must be imported from create-browser-root.tsx before _createContainer is called.
extend({
  "ascii-font": BrowserAsciiFontRenderable,
  // Future dual-impl browser overrides added here.
})
```

**On the cross-package import path.** `../../../core/src/react/components` resolves from `packages/web/src/components/` to `packages/core/src/react/components/`. This looks like a CLAUDE.md violation ("*Never import from `@gridland/core` directly — it is internal*") but is in fact consistent with existing `@gridland/web` conventions — `packages/web/src/create-browser-root.tsx:5-8` already uses the same import shape for `_createContainer`, `AppContext`, `ErrorBoundary`, and `RuntimeProvider`:

```ts
// Existing precedent from packages/web/src/create-browser-root.tsx
import { _createContainer, _updateContainer } from "../../core/src/react/reconciler/reconciler"
import { AppContext } from "../../core/src/react/components/app"
import { ErrorBoundary as _ErrorBoundary } from "../../core/src/react/components/error-boundary"
import { RuntimeProvider } from "../../core/src/react/runtime/runtime-context"
```

The CLAUDE.md rule governs `@gridland/ui` and user-facing scaffolded code. `@gridland/web` is a monorepo-internal package that is deliberately deep-coupled to core. Phase 4 D4.1 adds an explicit exemption note to `.claude/rules/renderable-constructors.md` so framework-compliance reviewers don't re-flag this pattern.

And the load-order guarantee:

```ts
// packages/web/src/create-browser-root.tsx (first line, added in Phase 3)
import "./components/register"  // See tasks/003 §4.3 — must load before _createContainer
import React, { type ReactNode } from "react"
// ... existing imports
```

Under the hood, `extend` at `packages/core/src/react/components/index.ts:66-68` does:

```ts
export function extend<T extends ComponentCatalogue>(objects: T): void {
  Object.assign(componentCatalogue, objects)
}
```

After the side-effect import runs, `getComponentCatalogue()["ascii-font"]` returns `BrowserAsciiFontRenderable`. The reconciler's `hostConfig.createInstance` at `packages/core/src/react/reconciler/host-config.ts:42` reads the catalogue on every create, so the override is picked up by every subsequent React render.

The terminal runtime (`@gridland/bun`) never imports `packages/web/src/components/register.ts`, so the catalogue singleton in Bun processes is untouched. All intrinsics remain their core implementations there — the terminal path is byte-identical to today.

**Known limitation (see NG7):** this approach mutates a module-level singleton. If a process loads both `@gridland/bun` and `@gridland/web` (rare — mostly SSR edge cases), the last one to call `extend` wins. The per-container catalogue refactor that would remove this shared state is scoped out of this task. If it becomes a real problem before follow-up work lands, the escape hatch is: move `extend()` off module init and into a `register()` function called explicitly from the app's entry point.

## 13. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Browser output diverges from terminal output for edge-case glyphs | Low | Golden needs update | INV-6 resolution: golden is the source of truth, updated to match JS if divergence cannot be reconciled. Both runtimes read the same `fonts/*.json` data, so structural divergence is unlikely. Documented in `packages/web/README.md`, signed off by web-platform lead. |
| A renderable outside `packages/core/src/renderables/` or `packages/web/src/components/` silently calls `resolveRenderLib` | Low | Phase 4 lint scope miss | Phase 4 audit walks the entire monorepo once; if anything shows up outside the lint scope, file follow-up issues. |
| Engineers skip the test-first commit discipline | Medium | Spec fidelity erodes | PR template enforces "failing tests commit" as a checkbox. Framework-compliance agent review flags missing test commits. |
| Phase 1 refactor subtly regresses a Bun demo | Low | Phase 1 blocked | Phase 0 goldens catch any drift immediately; Phase 1's test matrix includes a full Bun demo regression check. |
| Bundle size delta exceeds 12 KB gzipped | Low | Phase 3 soft gate | All 7 fonts gzip to ~8.8 KB; realistic delta ~10 KB. Measure at every Phase 3 commit. Escape hatch: lazy-load per font via dynamic import, eager-loading only `tiny` by default. |
| `register.ts` side-effect import is tree-shaken or reordered | Low (mitigated) | `extend()` never runs; browser crashes with same symptom as today | **Decided in rev 4:** `packages/web/package.json` declares `"sideEffects": ["./src/components/register.ts"]` (file-scoped — rest of `@gridland/web` stays tree-shakable). This entry is added in the same commit as D3.4/D3.5 so the protection lands atomically with the import. Additional defense-in-depth: the `register.test.ts` unit test (Phase 3) asserts the override is present in `componentCatalogue` after import, and the Playwright e2e test catches any runtime regression end-to-end. |
| Someone loads both `@gridland/bun` and `@gridland/web` in one process and fights over the catalogue singleton | Low | Unpredictable intrinsic dispatch | Documented limitation (NG7). In practice, single-runtime consumers are not affected. If follow-up work needs per-container catalogues, that's a separate task. |
| `input`/`textarea`/`line-number` users get a new compile error after upgrading to 0.3.0 | Medium | Breaking change for some browser consumers | Surface in the changelog prominently. The alternative — letting them crash at runtime as they do today — is strictly worse. Migration guidance points to `<text>`-based workarounds and the upcoming browser-impl tasks. |
| Framework-compliance agent flags the new `register.ts` → `core` internal import | Medium | PR review blocked by false positive | Phase 4 D4.1 adds an explicit exemption note to `.claude/rules/renderable-constructors.md`. The import pattern is already used in `create-browser-root.tsx` today; the exemption documents the existing convention. |

## 14. Open Questions

- **Q1.** ~~Should `BrowserAsciiFontRenderable` lazy-load font data per font, or bundle all 4 fonts upfront?~~ **Closed.** Bundle all 7 fonts upfront. Gzipped delta is ~10 KB against the 12 KB budget (§8). Lazy-loading is the escape hatch if Phase 3 measurements exceed budget — not implemented upfront.
- **Q2.** Does the Phase 4 lint scope cover `packages/web/src/components/` as well as `packages/core/src/renderables/`? **Closed: Yes.** Browser-side renderables have the same constructor rule (stated in D4.2).
- **Q3.** ~~Should the terminal-only compile-error message be customizable per intrinsic~~ **Closed: defer.** The generic TS "Property does not exist" error plus a JSDoc `@deprecated` link in the core JSX namespace is sufficient for shipping. Per-intrinsic custom messages (e.g., suggesting `figlet` for `ascii-font`) are a post-shipping polish follow-up.
- **Q4.** ~~Is there a future component we should design into the contract now (e.g., a `<canvas-image>` browser-only intrinsic)?~~ **Closed: No.** `browser-only` is reserved in the type union for future use; no implementation work in this task.

All open questions closed in rev 3.

## 15. PR Template Checklist

Every Phase N PR in this task must satisfy:

- [ ] First commit is "Phase N: failing tests" and the test matrix from §6 Phase N is red before the implementation commits.
- [ ] All tests in §6 Phase N matrix are present and green at PR time.
- [ ] All invariants from §5 that apply to this phase are validated in CI.
- [ ] Performance budgets from §8 that apply to this phase are within limits.
- [ ] Documentation updates from §6 Phase N Deliverables are present.
- [ ] Rollback plan from §6 Phase N is noted in the PR description.
- [ ] No regressions in prior-phase tests.
- [ ] Reviewed by at least one of: core-platform lead (Phases 1, 2, 4), web-platform lead (Phases 2, 3).
- [ ] Changelog entry drafted.

## 16. Handoff Notes for the Engineer

Assumed context: familiar with React, TypeScript, AST tooling, and comfortable reading reconciler internals. This spec assumes you have already read `.claude/rules/opentui-layout.md` and skimmed `packages/web/src/create-browser-root.tsx`, `packages/core/src/react/reconciler/host-config.ts`, and `packages/core/src/Renderable.ts`.

**Read these first, in order:**
1. This spec end-to-end (once).
2. `packages/core/src/renderables/FrameBuffer.ts` (47 lines) — the Phase 1 target.
3. `packages/core/src/renderables/ASCIIFont.ts` (219 lines) — the Phase 1 target, understand the `renderFontToBuffer` dirty-flag pattern you'll be re-establishing.
4. `packages/core/src/lib/ascii.font.ts` (exports `fonts`, `measureText`, `getCharacterPositions`, `renderFontToFrameBuffer`). Note: the top-level `import { OptimizedBuffer } from "../buffer"` is a value import used only as a type on `renderFontToFrameBuffer`'s signature. The module is safe to import in browser code — `buffer.ts` and `zig-registry.ts` have no top-level FFI side effects (verified in spec rev 3 §4.2).
5. `packages/web/src/browser-buffer.ts:184` (`setCell`) and `:266` (`drawText`) — the API surface `BrowserAsciiFontRenderable.renderSelf` will call.
6. `packages/core/src/react/reconciler/host-config.ts:36-52` — understand the `createInstance` dispatch that reads `componentCatalogue`.
7. `packages/core/src/react/components/index.ts:66-68` — the `extend()` API.

**Surprises that cost previous drafts a day each (don't repeat):**
- `@gridland/web` already imports from `../../core/src/...` — you don't need to create a public re-export for `extend`. Just follow the existing pattern in `create-browser-root.tsx`.
- `ASCIIFontRenderable` is the only subclass of `FrameBufferRenderable`. Phase 1's blast radius is exactly two files.
- The browser buffer duck-types against `OptimizedBuffer`'s signature. `renderSelf(buffer: OptimizedBuffer)` works in browser without a type cast because `BrowserBuffer` exposes the same `setCell` / `drawText` methods.
- Font data is 7 fonts (not 4): `tiny, block, shade, slick, huge, grid, pallet`. The rev 2 draft missed `huge, grid, pallet`.
- `RuntimeCapability` is an overlay map on the intrinsic *name*, not a rewrite of the prop types. Do not touch `TextProps`, `BoxProps`, etc.

**Questions to ask before starting:**
- Who is the owner and the reviewer? Assign before Phase 0. This is a hard prerequisite — see the header warning. The spec is not considered handed off until a name is in the `Owner:` field.
- Acceptable to ship D2.6 as the generic TS error in Phase 2 if the JSDoc `@deprecated` approach proves fiddly? (Spec rev 3 closes Q3 as "yes" but the engineer can re-open if needed.)

**Previously-open questions now decided in the spec (do not reopen without discussing with the reviewer):**
- `"sideEffects"` for `packages/web/package.json`: **file-scoped** (`["./src/components/register.ts"]`). Decided in rev 4. See D3.4/D3.5 and §13 risk row. Rationale: rest of `@gridland/web` stays tree-shakable; protection is precise.
- Bundle-all-fonts vs lazy-load: **bundle all 7 upfront**. Decided in rev 3 (Q1). See §8.
- Per-intrinsic custom error messages for terminal-only compile errors: **defer**. Decided in rev 3 (Q3). See §14.

**Phase order flexibility:** Phases 1 and 2 are independent and can run in parallel if you have two engineers. Phase 3 depends on both (needs Phase 1's lazy allocation as a model, needs Phase 2's `dual-impl` tag slot). Phase 4 can start once Phases 1-3 are merged.
