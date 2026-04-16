# @gridland/core

Internal package. Houses the React reconciler, the renderable base classes, the JSX intrinsic catalogue, the runtime-capability contract, and the Zig FFI glue. **Never imported directly from `@gridland/ui` or scaffolded user projects** — only `@gridland/web`, `@gridland/bun`, and `@gridland/testing` are allowed to reach into `packages/core/src/...` paths.

## Adding a new JSX intrinsic

Two things must stay in lockstep, enforced by `bun run --cwd packages/core build`:

1. **The reconciler catalogue** at `packages/core/src/react/components/index.ts`. Add the renderable class to `baseComponents` under its intrinsic name (e.g. `"my-thing": MyThingRenderable`). The reconciler's `hostConfig.createInstance` reads this on every mount.
2. **The capability overlay** at `packages/core/src/react/types/runtime-capability.ts`. Add the same intrinsic name to `intrinsicCapabilities` with one of the four `RuntimeCapability` tags:
   - `universal` — pure JS, works everywhere.
   - `dual-impl` — terminal class lives here; a browser class is registered via `extend()` from `packages/web/src/components/register.ts` at import time.
   - `terminal-only` — depends on Zig FFI. The browser JSX namespace omits it, so misuse becomes a compile error rather than a runtime crash.
   - `browser-only` — reserved for future intrinsics that only make sense in a browser.

The build-time checker at `packages/core/scripts/check-intrinsic-tags.ts` fails with an actionable error if the catalogue keys and capability keys diverge (INV-1 from `tasks/003-browser-compat-contract.md`). Run it manually with `bun run --cwd packages/core lint:renderables` is the lint step; the checker is the first half of `bun run --cwd packages/core build`.

If the new intrinsic is `dual-impl`, also add the browser implementation under `packages/web/src/components/`, add an `extend({ "name": Renderable })` line to `packages/web/src/components/register.ts`, and add the name to all three `JSX.IntrinsicElements` blocks in `packages/web/src/gridland-jsx.d.ts` (the `react`, `react/jsx-runtime`, and `react/jsx-dev-runtime` augmentations).

## Anti-pattern: constructor-side singleton calls

**Renderable constructors must not call `resolveRenderLib`, `registerRenderLib`, or `OptimizedBuffer.create`.** Resource allocation belongs in `renderSelf()` via an `ensureBuffer()` helper or equivalent, called lazily on first render.

**Why:** constructors run during React reconciliation, before any runtime capability is known. A renderable that allocates an `OptimizedBuffer` in its constructor is asserting "a `RenderLib` is registered right now," which is false in the browser, false during SSR, and false in any future runtime that doesn't ship the Zig path. The bug it produces is opaque — the user sees a `resolveRenderLib` error referencing `@opentui/core`, a dep they have never heard of.

**Enforcement:** the AST lint at `packages/core/scripts/lint-renderable-constructors.ts` walks every file under `packages/core/src/renderables/**` and `packages/web/src/components/**` and fails the build if any constructor body contains a forbidden call. It runs as part of `bun run --cwd packages/core build` and `bun run check:renderables` at the monorepo root.

**Canonical example of the lazy pattern:** `packages/core/src/renderables/FrameBuffer.ts` — constructor stores width/height; `ensureBuffer()` allocates on first call from `renderSelf()` and on resize. `ASCIIFontRenderable` builds on this with a `_bufferDirty` flag that triggers `populateBuffer()` only when text/font/color props change.

See `.claude/rules/renderable-constructors.md` for the full rule and the IIFE escape-hatch matrix, and `tasks/003-browser-compat-contract.md` §2.2 / Phase 1 for the bug this rule prevents.

## Browser catalogue overrides via `extend()`

`componentCatalogue` is a module-level singleton at `packages/core/src/react/components/index.ts`. The reconciler reads it on every `createInstance` call, so any code path that mutates the singleton before the first render gets picked up automatically.

`@gridland/web` uses this to swap `dual-impl` intrinsics' default terminal classes for browser-friendly ones at import time. The mechanism is `extend()` (also exported from `components/index.ts`), called from a side-effect module at `packages/web/src/components/register.ts` that loads as the very first import of `packages/web/src/create-browser-root.tsx`. `packages/web/package.json` declares `"sideEffects": ["./src/components/register.ts"]` so bundlers cannot tree-shake the import away.

Known limitation (NG7 in `tasks/003-browser-compat-contract.md`): if a single process loads both `@gridland/bun` and `@gridland/web`, the last `extend()` call wins the catalogue singleton. Single-runtime consumers — the overwhelmingly common case — are unaffected. Per-container catalogue injection is tracked as future work; the escape hatch is to move `extend()` off module init into an explicit `register()` call from the app's entry point.

## Tests

```
bun run --cwd packages/core test         # unit + AST lint test
bun run --cwd packages/core build        # check-intrinsic-tags + lint-renderable-constructors
bun run --cwd packages/core lint:renderables  # just the AST lint
```

The `test` script preloads `packages/web/test/preload.ts`, which shims `core`'s buffer/text-buffer/zig layers to their browser equivalents so reconciler tests can run without a real native library. Tests that need the real Zig path (e.g., the `ascii-font` parity test) live under `packages/web/test/` so they run in the same Bun-native environment as the production code path.
