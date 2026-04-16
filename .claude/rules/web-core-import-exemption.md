# `@gridland/web` → `@gridland/core` Internal Import Exemption

**When this loads:** You are reviewing a PR that imports from `../../core/src/...` inside `packages/web/src/...`, or you are writing new code in `packages/web/` that needs to reach into core's internals.

## The Rule

The root `CLAUDE.md` rule — **"Never import from `@gridland/core` directly — it is internal"** — governs user-facing packages (`@gridland/ui`, scaffolded user projects). `@gridland/web` is a monorepo-internal package that is deliberately deep-coupled to core's internal paths.

Framework-compliance reviewers and lint rules must not flag direct `packages/core/src/...` imports originating from inside `packages/web/`. This pattern is pre-existing, intentional, and load-bearing.

## Precedent

`packages/web/src/create-browser-root.tsx` has imported from core's internal paths since the package's inception:

```ts
import { _createContainer, _updateContainer } from "../../core/src/react/reconciler/reconciler"
import { AppContext } from "../../core/src/react/components/app"
import { ErrorBoundary as _ErrorBoundary } from "../../core/src/react/components/error-boundary"
import { RuntimeProvider } from "../../core/src/react/runtime/runtime-context"
```

Phase 3 of `tasks/003-browser-compat-contract.md` added two more internal imports in the same shape:

```ts
// packages/web/src/components/register.ts
import { extend } from "../../../core/src/react/components"
import { BrowserAsciiFontRenderable } from "./browser-ascii-font"
// BrowserAsciiFontRenderable itself imports from ../../../core/src/lib/ascii.font,
// ../../../core/src/buffer, ../../../core/src/Renderable, ../../../core/src/types.
```

These are not leaks. They are the architectural contract for this package.

## Why

`@gridland/web` does not construct its own reconciler — it mutates core's module-level `componentCatalogue` singleton at boot time via `extend()` to override terminal intrinsics with browser implementations. That mechanism requires a direct handle on core's `extend` function and on the base `Renderable` class. A public API layer would add indirection for no safety benefit: both packages live in the same monorepo, both ship together, and breaking changes to core's internals are caught by the monorepo-wide test suite in a single commit cycle.

See `tasks/003-browser-compat-contract.md` §4.3 and §12 for the full rationale and the known single-process dual-runtime limitation (NG7 — if both `@gridland/bun` and `@gridland/web` are loaded in the same process, the last-imported `extend()` call wins).

## When This Rule Does NOT Apply

- **`@gridland/ui` components.** These ship as shadcn registry items to end users. They must only import from `@gridland/utils` and their own registry-local aliases (`@/registry/gridland/{ui,lib,hooks}/*`). Never from `@gridland/core` internals, never from `@gridland/web` internals. Framework-compliance flags those imports correctly.
- **Scaffolded user projects.** A Vite or Next app that installs `@gridland/web` and adds components via `bunx create-gridland add` must never see `packages/core/src/...` in its own source. The import pattern lives inside `@gridland/web` only; it disappears at the bundler boundary when the user builds their app.
- **`@gridland/bun`, `@gridland/testing`, or any other monorepo package.** Each has its own integration story with core — some through the public `@opentui/core` entry point, some via direct source imports. This exemption is specifically about `@gridland/web`; other packages need to justify their own coupling on a case-by-case basis.

## What to Do If You're Writing a Framework-Compliance Check

Treat `packages/web/src/**` as an exempted scope. Either (a) skip direct `packages/core/src/...` imports originating there, or (b) if your check needs to flag all deep imports, add an explicit allowlist for `packages/web/`.

The linter at `packages/core/scripts/lint-renderable-constructors.ts` explicitly does not check the `packages/core/src/zig-registry.ts` / `packages/core/src/buffer.ts` import sites themselves — it only checks renderable constructor *bodies*. That's intentional: importing those modules is fine; calling them during reconciliation is not.

## Background

The deep-coupling precedent was established when `packages/web` was first written. The tasks/003 refactor (Phase 3 browser `<ascii-font>`) surfaced it explicitly because the `register.ts` side-effect module needed to reach core's `extend()` function, and a first-pass review flagged that as a boundary violation. Spec rev 3 documented the precedent in §4.3; rev 4 split this exemption out of Phase 4's rule file into its own standalone rule (this file) because the exemption has nothing to do with the constructor contract — it's a completely separate concern that happens to be enforced against the same package.
