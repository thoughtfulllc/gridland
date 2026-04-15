# Task 004: Close the Types ↔ Docs Gap

> **⚠️ SUPERSEDED — 2026-04-15.** This bundle was split into five smaller tickets after a CTO review. The original contents below are retained as an architectural reference (the Architecture Context, Open Questions, file:line citations, and the `.claude/rules/opentui-event-dispatch.md` cross-reference are still load-bearing) but no PR should cite this file as its scope document.
>
> **Launch cut (ship in order, one PR each):**
> 1. `tasks/005-starter-no-tscheck.md` — T2 Path A. Starter compiles clean with a minimal self-contained example. Removes `@ts-nocheck` from `packages/create-gridland/templates/vite/src/App.tsx`. Highest first-impression ROI.
> 2. `tasks/006-keyevent-jsdoc.md` — T3. JSDoc for every `KeyEvent` field + worked example in `hooks/use-keyboard.mdx`. Cheap, zero risk.
> 3. `tasks/007-pointer-events-docs.md` — T4. New `/docs/guides/pointer-events.mdx` page, sidebar entry, cross-link from `primitives.mdx`, thin the duplicate section in `focus-and-navigation.mdx`.
> 4. `tasks/008-bless-usekeyboard-global.md` — T5. Bless `{ global: true }` in JSDoc and docs; migrate only unambiguously app-level call sites.
>
> **Deferred post-launch:**
> - `tasks/backlog/pointer-event-types.md` — T1. Type the 11 mouse handlers and remove the `[key: string]: any` catch-alls. Biggest blast radius, lowest first-hour-adopter visibility. Revisit after launch as a dedicated types-hardening pass.
>
> **Why the split:** T1 is the riskiest and least visible ticket — invisible unless a user typos a handler name or hovers for intellisense, but removing the catch-all will surface real type errors across `packages/ui` and `packages/demo` and requires two pre-PR blocker Open Questions answered with file:line citations. Decoupling T2 from T1 (via Path A) unblocks shipping the visible first-impression win without the invisible refactor. Success Criterion 3 of the original bundle (typo detection) is explicitly deferred to the backlog ticket.

## Summary

Gridland's TypeScript types and documentation lag the runtime surface. `GridlandBoxProps` in `packages/web/src/gridland-jsx.d.ts` has no explicit pointer event props (`onClick`, `onMouseOver`, etc.) — they only pass the type checker via a `[key: string]: any` catch-all at line 61. As a downstream effect, the `create-gridland` starter template ships with `// @ts-nocheck` on line 1 of `packages/create-gridland/templates/vite/src/App.tsx`, which signals to new adopters that types are unreliable and pushes them to grep compiled JS in `node_modules` for the real API.

This task closes four related gaps. The single non-negotiable acceptance gate is: **the starter template compiles cleanly with no `@ts-nocheck` directive anywhere in it.**

## Motivation

A first-hour adopter evaluation surfaced four concrete friction points (a fifth — auto-generated prop references — is deferred). Each one individually is minor; together they paint "this framework's types are vestigial" to a new user. All four are addressable with sprint-sized changes.

| # | Gap | Blast radius |
|---|---|---|
| 1 | Event props absent from types; starter has `@ts-nocheck` | Every first-hour adopter |
| 2 | `KeyEvent` class has zero JSDoc | Anyone writing a custom keyboard handler |
| 3 | Pointer event docs buried inside `focus-and-navigation.mdx` — not discoverable by slug search for "click"/"mouse"/"pointer" | Anyone exploring the docs site |
| 4 | `useKeyboard` has two equivalent forms for "global scope" (bare call vs. `{ global: true }`); no blessed canonical form | Anyone reading examples |

Fixing #1 incidentally closes the user-facing half of a fifth complaint (the reconciler silently accepts unknown props): once the `[key: string]: any` catch-all is gone, typos like `onClik` become compile errors. Runtime passthrough stays as-is.

## Success Criteria

A PR is not complete until **all** of the following hold:

1. `packages/create-gridland/templates/vite/src/App.tsx` has no `// @ts-nocheck` directive (line 1).
2. Scaffolding a fresh project via `bunx create-gridland my-test --template vite` and running `bunx tsc --noEmit` inside it produces **zero** errors without any `@ts-nocheck` additions.
3. Typing `<box onClik={() => {}} />` in the starter raises a TypeScript error (catches typos). Typing `<box onC` in VS Code autocompletes `onClick`.
4. `import type { GridlandPointerEvent } from "@gridland/web"` works and resolves to the correct type.
5. Hovering over `KeyEvent` in VS Code shows field-level JSDoc for every public field.
6. `packages/docs/content/docs/guides/pointer-events.mdx` exists as a standalone page and appears in the sidebar under Guides.
7. Searching the docs site for "click", "mouse", or "pointer" surfaces the new pointer-events page.
8. `packages/docs/content/docs/components/primitives.mdx` contains a visible cross-link to the new pointer-events page.
9. `packages/core/src/react/hooks/use-keyboard.ts` JSDoc blesses `{ global: true }` as canonical and marks the bare form as deprecated.
10. No regression: `bun run test` at monorepo root passes, `bun run --cwd packages/docs build` passes, `bun run --cwd packages/web build` passes, `bun run --cwd packages/demo build` passes, **and `bun run --cwd packages/ui build` passes with `bunx tsc --noEmit` clean inside `packages/ui`** (registry components use `<box>` extensively and will silently break if the catch-all removal surfaces errors there — `packages/ui` emits registry JSON, not a compiled bundle, so a regular build won't catch type regressions).
11. **Semver + CHANGELOG:**
    - `@gridland/web` — **minor bump** (type surface widens additively and narrows in one spot). CHANGELOG entry describes the newly-typed event props and the removal of `[key: string]: any` from `GridlandBoxProps` / `GridlandInputProps`. Include a one-line migration note for users currently relying on the index signature.
    - `@gridland/utils` — **patch bump.** `KeyEvent` gains JSDoc (no runtime change) but IDE intellisense surfaces change, which is user-observable.
    - `@gridland/ui` — **patch bump.** The duplicate `gridland-jsx.d.ts` changes; registry consumers will see the new types on next `shadcn add`.
    - `@gridland/create-gridland` — **patch bump.** Starter template content changes.
    - `@gridland/demo` — **patch bump** only if Path B was chosen in Ticket 2 (type cleanup in `packages/demo/src/landing/`). Skip if Path A.

## Scope

**In scope:** Tickets 1–5 below.
**Out of scope:** Auto-generating a prop reference page from OpenTUI renderable class definitions. Tightening the runtime default case in `packages/core/src/react/utils/index.ts:96-99`. Auditing `useFocus` vs `FocusScope` API overlap. These are tracked as follow-ups.

## Architecture Context

### Files involved

| Path | Role |
|---|---|
| `packages/web/src/gridland-jsx.d.ts` | Module augmentation declaring JSX intrinsic elements and their props for `@gridland/web` users. The primary type surface. Currently all elements accept `Record<string, any>` as props, except `<box>` and `<input>` which have partial types widened by a `[key: string]: any` catch-all |
| `packages/ui/gridland-jsx.d.ts` | **Byte-identical duplicate** of the web copy, included by `packages/ui/tsconfig.json`'s `include` array so registry component sources type-check against the same JSX surface. Every change to the web copy must be mirrored here in the same PR, or the two will drift |
| `packages/web/src/index.ts` | Entry point for `@gridland/web`. Must re-export new event types |
| `packages/create-gridland/templates/vite/src/App.tsx` | The Vite starter template. Ships to every user of `bunx create-gridland` |
| `packages/core/src/lib/KeyEvent.ts` | Defines the `KeyEvent` class. Re-exported from `@gridland/utils` (`packages/utils/src/index.ts:63`). Has zero JSDoc currently |
| `packages/core/src/react/hooks/use-keyboard.ts` | The `useKeyboard` hook. Lines 56-68 contain the global-vs-scoped dispatch logic |
| `packages/core/src/renderer.ts` | Defines `MouseEvent` class at line 202 — **this is the event class every `onMouse*` handler receives.** Re-read before writing types |
| `packages/core/src/Renderable.ts` | Lines 113-123 declare all 11 mouse handler props on the base renderable — this is the canonical list |
| `packages/docs/content/docs/guides/focus-and-navigation.mdx` | Lines ~290-303 contain the only pointer events reference in the docs |
| `packages/docs/content/docs/components/primitives.mdx` | Documents intrinsic elements. No mention of event handlers |
| `packages/docs/content/docs/hooks/use-keyboard.mdx` | **This file exists already.** Has a Parameters table and a (minimal) KeyEvent table. Ticket 3 extends it — do not create a new page under `api/` |
| `packages/docs/content/docs/guides/meta.json` | Sidebar ordering config for the Guides section (fumadocs) |

### Where pointer events actually dispatch

**Important:** Gridland's reconciler does not unpack pointer events. The default case in `packages/core/src/react/utils/index.ts:96-99` assigns every unknown prop verbatim to the underlying instance: `instance[propKey] = propValue`. That means `onClick`, `onMouseOver`, etc. are forwarded to OpenTUI's renderable, and **the source of truth for the payload shape is OpenTUI itself, not Gridland**. A grep inside `packages/core/src/react/` will return nothing useful — that is expected, not a dead end.

**One exception — `onClick` is special-cased.** The reconciler does handle `onClick` explicitly at `packages/core/src/react/utils/index.ts:76-80`, and Gridland's browser renderer synthesizes the click dispatch itself at `packages/web/src/browser-renderer.ts:249` (calling `renderable._clickHandler(this.createTuiMouseEvent(...))`). For `onClick` only, grepping Gridland is authoritative. For the other five mouse props, you must read OpenTUI's `Renderable.processMouseEvent`.

See `.claude/rules/opentui-event-dispatch.md` for the full rule, the verified browser-renderer event object shape, and the surprises (`x`/`y` are cell coordinates, scroll payload is `{ direction, delta }` not `{ deltaX, deltaY }`, no `timestamp` / `nativeEvent` / `clientX` / `clientY`).

**OpenTUI's TypeScript is vendored into `packages/core/src/`.** `@gridland/core` *is* OpenTUI's TS layer, living inside the monorepo. Do NOT look under `node_modules/@opentui/...` — only the native Zig binary packages (`core-darwin-arm64`, `core-linux-*`) are installed there, and they contain no `.ts` files. `find node_modules/@opentui -name "*.ts"` returns zero results; `rg` against that path is a dead end.

The concrete source-of-truth paths for this task:

- **`packages/core/src/renderer.ts:202`** — `export class MouseEvent` (the payload class, with `preventDefault()` / `stopPropagation()` methods and `defaultPrevented` / `propagationStopped` getters).
- **`packages/core/src/Renderable.ts:113-123`** — the **11** mouse handler props declared on the base renderable (see "Full handler list" below).
- **`packages/core/src/Renderable.ts:1468-1536`** — `processMouseEvent` dispatcher and the per-prop setter overrides.
- **`packages/core/src/lib/parse.mouse.ts`** — `MouseEventType` literal union (`"down" | "up" | "move" | "drag" | "drag-end" | "drop" | "over" | "out" | "scroll"`) and the `RawMouseEvent` wire shape.
- **`packages/web/src/browser-renderer.ts:335-366`** — `createTuiMouseEvent` constructs the object that gets handed to `processMouseEvent`. This is the layer the user's handler actually observes.
- **`packages/core/src/lib/KeyEvent.ts`** — `KeyEvent` class (for Ticket 3).
- **`packages/core/src/react/focus/focus-provider.tsx`** and **`packages/core/src/lib/KeyHandler.ts`** — dispatcher loops that decide whether `KeyEvent.stopPropagation()` is honored (for Ticket 3 and Open Question 3).

**Full handler list** from `Renderable.ts:113-123` (re-read before writing the `.d.ts` — may have drifted):

```
onMouse, onMouseDown, onMouseUp, onMouseMove, onMouseDrag,
onMouseDragEnd, onMouseDrop, onMouseOver, onMouseOut, onMouseScroll, onClick
```

That is **11** handlers, not 6. The original evaluator complaint listed the six "hot" ones (`onClick`, `onMouseDown`, `onMouseUp`, `onMouseOver`, `onMouseOut`, `onMouseScroll`) but the other five exist in OpenTUI today and will start failing typecheck the moment `[key: string]: any` is removed. See Ticket 1 Step 3 for the resolution (type all 11 or explicitly defer drag/move with a follow-up ticket — do not leave them silently broken).

**For reference,** `MouseEvent` at `renderer.ts:202-246` currently exposes (re-verify before typing): `type: MouseEventType`, `button: number`, `x: number` (cell column, not pixels), `y: number` (cell row), `source?: Renderable`, `modifiers: { shift, alt, ctrl }`, `scroll?: ScrollInfo`, `target: Renderable | null`, `isDragging?: boolean`, plus the four propagation members. See `.claude/rules/opentui-event-dispatch.md` for the verified browser-renderer construction shape and surprises (`scroll` is `{ direction, delta }` not `{ deltaX, deltaY }`; no `timestamp` / `nativeEvent` / `clientX` / `clientY`).

Record the final payload type in the PR description with a file:line citation from one of the paths above. **Expose the full runtime shape — do not fabricate a narrower one.** Narrowing a public type later is a breaking change; widening it is additive.

### Gridland type conventions

- Files that use OpenTUI intrinsic elements (`<box>`, `<text>`, `<span>`) in framework *internals* carry `// @ts-nocheck` at the top. This is an existing convention for framework code. **Do not remove `@ts-nocheck` from those files in this task** — only from the starter template.
- Source files inside `packages/ui/` use `@/registry/gridland/*` aliases for cross-file imports. Do not introduce relative imports there.
- Never import from `@gridland/core` directly — it is internal. `KeyEvent` must be re-exported through `@gridland/utils`.

---

## Ticket 1: Type the Pointer Event Surface

**Goal:** Declare **all 11** mouse handlers from `Renderable.ts:113-123` (`onMouse`, `onMouseDown`, `onMouseUp`, `onMouseMove`, `onMouseDrag`, `onMouseDragEnd`, `onMouseDrop`, `onMouseOver`, `onMouseOut`, `onMouseScroll`, `onClick`) on `GridlandBoxProps` with a concrete event payload type. Remove the `[key: string]: any` catch-all from `GridlandBoxProps` and `GridlandInputProps`. Mirror the change into `packages/ui/gridland-jsx.d.ts` (the byte-identical duplicate).

### Steps

1. **Re-verify the runtime event payload shape** by reading `packages/core/src/renderer.ts:202-246` and `packages/core/src/Renderable.ts:113-123` (see Architecture section). Do NOT grep Gridland's reconciler; for every handler except `onClick` it forwards props verbatim to OpenTUI's `Renderable.processMouseEvent`. Document the exact field set in the PR description with a file:line citation from those two paths. This is a **pre-PR blocker**: Open Questions 1 and 2 below must be answered before writing any type definitions, because changing the shape of an exported public type after release is a breaking change.

2. **Create the event type definitions.** Because `gridland-jsx.d.ts` is a pure declaration file, put the types in a separate runtime-importable file so users can `import type` them. The shape below is derived from `packages/core/src/renderer.ts:202-246` and `packages/web/src/browser-renderer.ts:335-366` as of 2026-04-15 — re-verify before copying:

   Create `packages/web/src/events.ts`:
   ```ts
   import type { Renderable } from "../../core/src/Renderable"
   import type { MouseEventType } from "../../core/src/lib/parse.mouse"

   /**
    * Payload passed to every `onMouse*` / `onClick` handler on Gridland
    * intrinsic elements. Constructed by `createTuiMouseEvent` in
    * `packages/web/src/browser-renderer.ts:335`, then handed to OpenTUI's
    * `Renderable.processMouseEvent` at `packages/core/src/Renderable.ts:1468`
    * for per-prop dispatch.
    */
   export interface GridlandPointerEvent {
     /** Which mouse interaction this is. Note: `onClick` handlers receive `type: "down"` (not `"click"`) — see `.claude/rules/opentui-event-dispatch.md`. */
     type: MouseEventType
     /** Mouse button: 0 = left, 1 = middle, 2 = right. */
     button: number
     /** Cell column (NOT pixels — already translated via `pixelToCell`). */
     x: number
     /** Cell row. */
     y: number
     /** The renderable this event is being dispatched to. Null only in synthetic/global dispatch. */
     target: Renderable | null
     /** Keyboard modifiers held during the event. */
     modifiers: { shift: boolean; alt: boolean; ctrl: boolean }
     /** Present only when `type === "scroll"`. Gridland reduces raw `WheelEvent.deltaX/deltaY` to a single direction + a positive step count (see browser-renderer.ts:355-363). */
     scroll?: { direction: "up" | "down" | "left" | "right"; delta: number }
     /** Originating renderable for synthesized events (e.g. the scroll target). Rarely needed. */
     source?: Renderable
     /** True while a drag gesture is in progress (set on `drag` and `drag-end` types). */
     isDragging?: boolean
     /** Getter: true if `preventDefault()` was called. Do not assign — strict mode throws. */
     readonly defaultPrevented: boolean
     /** Getter: true if `stopPropagation()` was called. Do not assign — strict mode throws. */
     readonly propagationStopped: boolean
     /** Prevents the framework's default handling for this event. Does not stop other listeners. */
     preventDefault(): void
     /** Stops propagation. Verify behavior against `Renderable.processMouseEvent` before documenting which listeners stop firing. */
     stopPropagation(): void
   }

   /**
    * Handler signature for every `onMouse*` / `onClick` prop. Scroll events
    * are the same shape as other pointer events — the `scroll` field is only
    * populated when `type === "scroll"`. There is no separate scroll type.
    */
   export type GridlandPointerHandler = (event: GridlandPointerEvent) => void
   ```

   **Notes:**
   - There is **no** separate `GridlandScrollEvent`. The runtime dispatches one `MouseEvent` class to every handler; the `scroll` field is discriminated by `type === "scroll"`. The earlier plan for two types (`GridlandPointerEvent` + `GridlandScrollEvent`) was wrong — the first-draft spec didn't reflect the actual class.
   - Re-verify the field set from `renderer.ts:202-246` before Step 3. If anything has drifted (new field, renamed field, different modifier shape), update this file first.
   - `Renderable` import is an internal path via relative resolution inside `packages/web/src/` — this is **only** allowed because `@gridland/web` is a workspace sibling of `@gridland/core`. Users of `@gridland/web` never see this path. Do not re-export `Renderable` itself from `@gridland/web`.

3. **Update BOTH copies of `gridland-jsx.d.ts`.** There are two byte-identical files — `packages/web/src/gridland-jsx.d.ts` and `packages/ui/gridland-jsx.d.ts`. The `ui` copy is listed in `packages/ui/tsconfig.json`'s `include` array and is how registry component sources type-check against the JSX surface. **Every edit in this step must be applied to both files in the same commit, or the two will drift and `packages/ui` will pass typecheck against a stale surface.** After editing, `diff packages/web/src/gridland-jsx.d.ts packages/ui/gridland-jsx.d.ts` must be empty.
   - Add an `import type` for the new event types at the top of the file.
   - Add all 11 fields to `GridlandBoxProps` (alphabetized within the existing prop list):
     ```ts
     onClick?: GridlandPointerHandler
     onMouse?: GridlandPointerHandler
     onMouseDown?: GridlandPointerHandler
     onMouseDrag?: GridlandPointerHandler
     onMouseDragEnd?: GridlandPointerHandler
     onMouseDrop?: GridlandPointerHandler
     onMouseMove?: GridlandPointerHandler
     onMouseOut?: GridlandPointerHandler
     onMouseOver?: GridlandPointerHandler
     onMouseScroll?: GridlandPointerHandler
     onMouseUp?: GridlandPointerHandler
     ```
     All 11 use `GridlandPointerHandler` — the event type carries a discriminated `scroll?` field, so `onMouseScroll` does **not** need a separate handler type.
   - **Remove `[key: string]: any`** from `GridlandBoxProps` (currently line 61).
   - **Before removing the catch-all, audit `packages/core/src/renderables/Box.ts` (and its base `Renderable.ts`) for every prop the reconciler sets verbatim on the instance.** The catch-all is currently papering over legitimate props — `focused`, `selectable`, any style-affecting prop on the renderable. List them in the PR description and add each as an explicit field on `GridlandBoxProps`. Otherwise real user code that worked yesterday will fail typecheck tomorrow.
   - **Remove `[key: string]: any`** from `GridlandInputProps` (currently line 78). Same audit against `packages/core/src/renderables/Input.ts`. This change is coupled with the `InputHTMLAttributes<T> { [key: string]: any }` augmentation at line 90 — removing one without the other leaves the input type inconsistent (the intrinsic props get strict, but React's ambient `InputHTMLAttributes` is still wide open). Both must come out together, or the narrowing pass in Step 5 must land simultaneously.

4. **Export the new types from `@gridland/web`.** Open `packages/web/src/index.ts` and add:
   ```ts
   export type { GridlandPointerEvent, GridlandPointerHandler } from "./events"
   ```

5. **Narrow the React module augmentations** (lines 81-107 of `gridland-jsx.d.ts`). The `interface HTMLAttributes<T> { [key: string]: any }` block was added to silence React 19 type conflicts. **This is a hard blocker, not "try" — Success Criterion 3 (typos like `<box onClik>` must fail) cannot be satisfied while `HTMLAttributes` is widened with `[key: string]: any`, because React 19's JSX resolution falls through to that ambient type.** Sequence:
   - Attempt to remove the `[key: string]: any` from `HTMLAttributes`, `InputHTMLAttributes`, `SVGAttributes`, `SVGProps`, `SVGTextElementAttributes`, and `CSSProperties`, one at a time.
   - After each removal, run `bun run --cwd packages/web build`, `bun run --cwd packages/docs build`, AND `bunx --cwd packages/ui tsc --noEmit`.
   - If a removal breaks the build, **narrow** the augmentation to the specific keys that conflict, rather than reverting to `[key: string]: any`. List the keys in the PR description with a one-line justification per key.
   - If narrowing `HTMLAttributes` is literally infeasible (e.g. React 19 requires the widening for some structural reason), **relax Success Criterion 3** in the PR description with a written explanation and fall back to a `// TODO(types):` comment citing the specific conflict. Do not quietly leave the catch-all and claim the criterion is met.

### Verification

```bash
bun run --cwd packages/web build
bun run --cwd packages/core build   # if core has a build step
bun run --cwd packages/demo build
bun run --cwd packages/ui build                  # registry emission
bunx --cwd packages/ui tsc --noEmit              # catches type regressions in components that use <box>/<input>
```

All must succeed. Report any files in `packages/demo/` or `packages/ui/` that break because they were relying on the now-removed catch-all — fix them with explicit types, **not** by reintroducing `any` or `@ts-nocheck`.

**Bump `@gridland/web` version and add a CHANGELOG entry** before opening the PR. Minimum minor bump: this widens the public type surface additively (new event props, new exported types) and narrows it in one spot (index signature removal). The index signature removal can break a user currently passing through arbitrary props untyped, so the CHANGELOG must include a one-line migration note.

### Done when

- `GridlandBoxProps` has **all 11** typed mouse handler props (or a PR-description-documented decision to defer a subset to a follow-up, with each deferred prop listed explicitly).
- `packages/web/src/gridland-jsx.d.ts` and `packages/ui/gridland-jsx.d.ts` are byte-identical (`diff` returns empty).
- Neither `GridlandBoxProps` nor `GridlandInputProps` contains a `[key: string]: any` line.
- `import type { GridlandPointerEvent } from "@gridland/web"` resolves.
- `bun run --cwd packages/web build` succeeds.
- `bunx --cwd packages/ui tsc --noEmit` succeeds.

---

## Ticket 2: Remove `@ts-nocheck` from the Starter Template

**Goal:** `packages/create-gridland/templates/vite/src/App.tsx` must start with `import`, not `// @ts-nocheck`. Must compile clean when scaffolded.

**Scope decision — read before starting:** The current template imports `LandingApp from "@gridland/demo/landing"`. `packages/demo/src/landing/landing-app.tsx` uses `useKeyboard((event: any) => ...)` and has other untyped surfaces. Removing `@ts-nocheck` from the template will surface type errors rooted in `@gridland/demo`, which is a scope rabbit hole. **Pick one of these two paths before coding:**

- **Path A (preferred):** Replace `LandingApp` in the starter with a minimal, self-contained example — a `<TUI>` with one `<box>`, a `useKeyboard((event) => ...)` demonstrating the blessed `{ global: true }` form (per Ticket 5), and a typed pointer handler. This makes the starter a better teaching surface AND removes the `@gridland/demo` dependency entirely. Recommended.
- **Path B:** Keep `LandingApp` and fix `@gridland/demo` types as part of PR 1. This is a larger diff and must include its own version bump for `@gridland/demo`. Only pick this if Path A is explicitly rejected.

Record the choice in the PR description. The rest of this ticket assumes Path A unless noted.

### Steps

1. **Replace the starter's `App.tsx` body** (under Path A) with a minimal, self-contained example that exercises the type surface users care about on day one. Remove line 1 (`// @ts-nocheck`) in the same edit.

2. **Build `create-gridland` and scaffold a scratch project** using the local build output (there is no published `@gridland/create-gridland` on npm, so `bunx --package @gridland/create-gridland` will not work):
   ```bash
   bun run --cwd packages/create-gridland build
   cd /tmp && rm -rf scratch-test
   bun /Users/jessicacheng/thoughtful/gridland/packages/create-gridland/dist/index.js scratch-test --template vite
   cd scratch-test && bun install && bunx tsc --noEmit
   ```
   Confirm the `bin` entry and main dist path by reading `packages/create-gridland/package.json` first — the dist file may be named differently after a refactor.

3. **Fix every real type error** that surfaces. Do not reintroduce `@ts-nocheck`. Under Path A the only expected fixes are:
   - Event handlers may need explicit parameter types imported from `@gridland/web` (`GridlandPointerEvent`).
   - The `useKeyboard` callback parameter may need `KeyEvent` imported from `@gridland/utils`.

   Under Path B, additionally: trace every untyped surface in `packages/demo/src/landing/` to its source and fix it there, not at the call site. This is the rabbit hole the scope decision is supposed to prevent.

4. **Audit every other file in `packages/create-gridland/templates/`** for `@ts-nocheck` directives:
   ```bash
   rg "@ts-nocheck" packages/create-gridland/templates/
   ```
   Remove any found and fix real errors. Templates are user-facing — they must set the example.

5. **Audit workspace-wide `@ts-nocheck` usage**:
   ```bash
   rg "@ts-nocheck" packages/ --type ts --type tsx
   ```
   Framework-internal files that use OpenTUI intrinsic elements are allowed to keep `@ts-nocheck` (per `CLAUDE.md`). For every hit, decide:
   - **Keep:** Framework file or test fixture that instantiates raw OpenTUI intrinsics (`<box>`, `<text>`, `<span>`) for internal testing — e.g. `packages/core/src/react/hooks/use-keyboard.test.tsx:1`. These are not user-facing and the comment already explains why. Document the reason in a one-line comment if one isn't already there.
   - **Remove:** Template files, published demos (anything under `packages/demo/demos/` that ships to users via docs site), example snippets in MDX. Do NOT remove from `.test.tsx` files in framework packages — those are "Keep".

### Verification

```bash
# Full scaffold + typecheck
rm -rf /tmp/scratch-test
cd /tmp && bun /Users/jessicacheng/thoughtful/gridland/packages/create-gridland/dist/index.js scratch-test --template vite
cd scratch-test && bun install && bunx tsc --noEmit
echo "exit code: $?"  # must be 0

# Typo detection
# Manually add `<box onClik={() => {}}>test</box>` to the scaffolded App.tsx
# and re-run tsc — MUST error. Remove the line before proceeding.

# Negative check: no @ts-nocheck leaked back in
rg "@ts-nocheck" /tmp/scratch-test && echo "FAIL: nocheck present" || echo "OK: clean"
```

### Done when

- Starter scaffolds cleanly and `tsc --noEmit` exits 0.
- Introducing `onClik` in the starter raises a type error.
- No `@ts-nocheck` in the template folder or in the scaffolded output.

---

## Ticket 3: Document `KeyEvent` via JSDoc

**Goal:** Every public field of `KeyEvent` has a one-line JSDoc comment answering "when do I use this field?". Add a `useKeyboard` docs page section showing one worked example per key category.

### Steps

1. **Add JSDoc to every field of the `KeyEvent` class** at `packages/core/src/lib/KeyEvent.ts`. The block below is a **draft**, not authoritative — every claim must be verified against `packages/core/src/lib/parse.keypress.ts` (where `ParsedKey` is defined and the fields are populated) and `packages/core/src/lib/KeyHandler.ts` (the Kitty-protocol parser) before it ships. Pay particular attention to: when `name` is set vs when only `sequence` is, and exactly which fields are Kitty-only. If a claim turns out to be wrong, rewrite that line — do not copy the draft verbatim.

   ```ts
   export class KeyEvent implements ParsedKey {
     /** Logical key name: `"a"`, `"left"`, `"f1"`, `"escape"`, `"return"`. Prefer this over `sequence` for letter, modifier, arrow, and function keys. */
     name: string
     /** True if the literal Ctrl key was held. Ctrl and Meta are independent flags; do not treat them as cross-platform equivalents. */
     ctrl: boolean
     /** True if Meta was held (Command on macOS, Windows key on Windows, Super on Linux). Independent of `ctrl`. */
     meta: boolean
     /** True if Shift was held. */
     shift: boolean
     /** True if Option (Mac) / Alt was held. */
     option: boolean
     /** Raw byte sequence the terminal emitted. Use this for printable punctuation like `"["`, `"]"`, `";"`, `"/"` where `name` may not be set. */
     sequence: string
     /** True if the key is a number (0-9). */
     number: boolean
     /** Unescaped raw input — the literal bytes before parsing. Rarely needed; prefer `sequence` or `name`. */
     raw: string
     /** Event type: `"press"`, `"release"`, or `"repeat"`. Only non-`"press"` if running under a terminal that supports Kitty keyboard protocol. */
     eventType: KeyEventType
     /** How this event was parsed: `"raw"` = legacy xterm decoding, `"kitty"` = Kitty keyboard protocol (richer data). */
     source: "raw" | "kitty"
     /** Kitty-only: physical key code (e.g. US-layout `"KeyA"`). Use `name` unless you specifically need layout-independent identification. */
     code?: string
     /** Kitty-only: true if Super / Windows / Command was held. */
     super?: boolean
     /** Kitty-only: true if Hyper was held. */
     hyper?: boolean
     /** Kitty-only: true if Caps Lock was on. */
     capsLock?: boolean
     /** Kitty-only: true if Num Lock was on. */
     numLock?: boolean
     /** Kitty-only: base key code without modifiers. */
     baseCode?: number
     /** Kitty-only: true if this is a key-repeat event. */
     repeated?: boolean
   ```

2. **Add JSDoc to `preventDefault` and `stopPropagation`** methods on `KeyEvent` (lines 55-61). Document the propagation model. **This is a pre-PR blocker:** `KeyEvent._propagationStopped` is only a flag on the class (`packages/core/src/lib/KeyEvent.ts:25`) — whether it's actually honored is decided by the dispatcher, which lives in one of:
   - `packages/core/src/react/focus/focus-provider.tsx` (focus-aware key dispatch into scoped listeners)
   - `packages/core/src/lib/KeyHandler.ts` (the raw event emitter)
   - `packages/core/src/react/hooks/use-keyboard.ts` (the consumer wrapper at lines 56-86 that decides which handler fires based on focus/selection)

   Read all three, find where the flag is checked (`propagationStopped` or `_propagationStopped`), and document what "propagation" means in Gridland's model. Answer Open Question 3 in the PR description with a file:line citation. Do not ship approximate or guessed propagation semantics. Draft below, rewrite as needed:
   ```ts
   /** Prevents the framework's default handling for this key event (e.g. blocks built-in focus navigation on Tab). Does not stop other listeners from firing. */
   preventDefault(): void

   /** Stops this event from propagating to <describe: ancestor listeners? sibling listeners? both?>. Sibling listeners on the same focus id <do/do not> still fire. */
   stopPropagation(): void
   ```

3. **Extend `packages/docs/content/docs/hooks/use-keyboard.mdx`.** This file already exists (74 lines as of 2026-04-15) — it has an Import block, basic/modifier/release usage examples, a Focus-aware routing section, a Parameters table, and a minimal KeyEvent table. **Do not create a new page under `api/` — that directory contains package-entry pages (`gridland-utils.mdx`, `gridland-web.mdx`), not per-hook docs.** Replace the existing KeyEvent table with a complete one covering every field of the class, and add the "Which field should I read?" worked example from step 4 below.

4. **Add a "Which field should I read?" worked example** to `packages/docs/content/docs/hooks/use-keyboard.mdx`:

   ```tsx
   import { useKeyboard, type KeyEvent } from "@gridland/utils"

   useKeyboard((event: KeyEvent) => {
     // Letter with modifier → name + ctrl
     if (event.name === "s" && event.ctrl) save()

     // Arrow keys and named keys → name
     if (event.name === "left") prevItem()
     if (event.name === "escape") closeModal()

     // Function keys → name
     if (event.name === "f1") showHelp()

     // Printable punctuation → sequence
     if (event.sequence === "[") prevPage()
     if (event.sequence === "]") nextPage()
   }, { global: true })
   ```

### Verification

```bash
bun run --cwd packages/docs build                     # docs page renders
# Manual: open packages/core/src/lib/KeyEvent.ts in VS Code, hover over `name`, confirm JSDoc appears
# Manual: open the built docs site, navigate to the useKeyboard page, confirm the worked example renders
```

### Done when

- Every field of `KeyEvent` has JSDoc.
- `preventDefault` and `stopPropagation` have JSDoc that accurately describes the propagation model.
- The `useKeyboard` docs page includes the KeyEvent reference table and the worked-example block.

---

## Ticket 4: Promote Pointer Events to a First-Class Docs Page

**Goal:** Pointer events get their own top-level guide, discoverable by sidebar search for "mouse", "click", or "pointer". Cross-linked from `components/primitives.mdx`.

### Steps

1. **Create `packages/docs/content/docs/guides/pointer-events.mdx`** with this structure (use the existing frontmatter format from other files in `guides/`):

   ```mdx
   ---
   title: Pointer Events
   description: Mouse and click handling on Gridland intrinsic elements.
   ---

   All intrinsic elements (`<box>`, `<text>`, `<input>`, etc.) support pointer event handlers. Handlers receive a `GridlandPointerEvent` with cell coordinates and button info.

   ## Supported Events

   All 11 handlers use `GridlandPointerHandler`. The `type` field on the event object discriminates (`"down"`, `"up"`, `"over"`, `"out"`, `"move"`, `"drag"`, `"drag-end"`, `"drop"`, `"scroll"`).

   | Event | Fires when |
   |---|---|
   | `onMouseDown` | Button pressed over the element |
   | `onMouseUp` | Button released over the element |
   | `onClick` | Press + release on the same element |
   | `onMouseOver` | Pointer enters the element |
   | `onMouseOut` | Pointer leaves the element |
   | `onMouseMove` | Pointer moves while over the element |
   | `onMouseDrag` | Drag gesture in progress over the element |
   | `onMouseDragEnd` | Drag gesture released |
   | `onMouseDrop` | Dragged item dropped onto the element |
   | `onMouseScroll` | Mouse wheel scrolled over the element |
   | `onMouse` | Catch-all: fires for every mouse event type |

   ## Event Payload

   `\`\`\`ts
   interface GridlandPointerEvent {
     type: "down" | "up" | "over" | "out" | "move" | "drag" | "drag-end" | "drop" | "scroll"
     button: number                // 0 = left, 1 = middle, 2 = right
     x: number                     // cell column (NOT pixels)
     y: number                     // cell row
     target: Renderable | null
     modifiers: { shift: boolean; alt: boolean; ctrl: boolean }
     scroll?: { direction: "up" | "down" | "left" | "right"; delta: number }
     readonly defaultPrevented: boolean
     readonly propagationStopped: boolean
     preventDefault(): void
     stopPropagation(): void
   }
   `\`\`\`

   > **Note:** `x` and `y` are cell coordinates, not pixels. Scroll events expose `scroll.direction` + `scroll.delta`, **not** DOM-style `deltaX`/`deltaY`. There is no `timestamp`, `nativeEvent`, `clientX`, or `clientY`.

   ## Hover-Steals-Focus Pattern

   Combine `onMouseOver` with `useFocus().focus()` to make hovering an element grab keyboard focus — a common multi-modal UI pattern.

   `\`\`\`tsx
   const { focus } = useFocus({ id: "item-1" })
   return <box onMouseOver={() => focus()}>…</box>
   `\`\`\`

   ## Scroll Events

   `onMouseScroll` fires when the mouse wheel is scrolled over the element. The `scroll` field is populated only for `type === "scroll"` events; check `event.scroll?.direction` (`"up" | "down" | "left" | "right"`) and `event.scroll?.delta` (a positive step count).

   ## Hit Testing

   When multiple elements overlap (e.g. a modal above a page), the element with the higher `zIndex` receives the event.
   <!-- If pointer events support stopPropagation, document it here with a code example. If not, document the actual behavior: do they bubble at all? Is there any way to prevent ancestor handlers from firing? Answer must be verified against OpenTUI's mouse dispatcher before this page ships — no "TODO" strings are allowed to land in MDX. -->
   ```

   **Verify the table content against the runtime** before finalizing. Also confirm whether `stopPropagation` is actually available on pointer events in Gridland — if not, rewrite the "Hit Testing" section to describe the actual behavior. **No `TODO` strings may land in the published MDX.** Run `rg "TODO" packages/docs/content/docs/guides/pointer-events.mdx` as a final check — must return zero hits.

2. **Update the Guides sidebar config** to include `pointer-events` in the order. Look for `packages/docs/content/docs/guides/meta.json` (or whatever fumadocs/Next.js convention is in use — check adjacent files). Add `"pointer-events"` to the pages array near `"focus-and-navigation"`.

3. **Thin the duplicate section in `focus-and-navigation.mdx`.** Lines 292-303 currently contain the full pointer events reference. Replace with a short one-paragraph summary plus a link:
   ```mdx
   ## Pointer Events

   Gridland intrinsic elements accept standard mouse event props (`onClick`, `onMouseOver`, `onMouseScroll`, etc.). See the [Pointer Events guide](/docs/guides/pointer-events) for the full reference.
   ```

4. **Add a cross-link to `packages/docs/content/docs/components/primitives.mdx`.** Insert near the top of the file (after the intro paragraph, before the first element table):
   ```mdx
   > All primitives accept pointer event handlers. See [Pointer Events](/docs/guides/pointer-events).
   ```

### Verification

```bash
bun run --cwd packages/docs dev
# Manual checks in the running dev server:
# 1. Sidebar shows "Pointer Events" under Guides
# 2. Searching the docs site for "click", "mouse", or "pointer" surfaces the new page
# 3. /docs/components/primitives shows the cross-link callout visibly near the top
# 4. /docs/guides/focus-and-navigation no longer duplicates the pointer events table
# 5. The new page renders without MDX errors
```

Also run the production build to catch any broken links:
```bash
bun run --cwd packages/docs build
```

### Done when

- `pointer-events.mdx` exists and is in the sidebar.
- Docs-site search matches "click"/"mouse"/"pointer".
- `primitives.mdx` links to it.
- `focus-and-navigation.mdx` no longer duplicates the reference table.
- `bun run --cwd packages/docs build` succeeds with no broken-link warnings.

---

## Ticket 5: Bless `{ global: true }` for `useKeyboard`

**Goal:** One canonical form for global keyboard handlers. The bare `useKeyboard(handler)` form stays functional (no runtime break) but is marked deprecated in JSDoc and docs.

### Steps

1. **Update the docstring at `packages/core/src/react/hooks/use-keyboard.ts`.** Find the JSDoc block above the `useKeyboard` export (currently describes the three scoping modes around line 28). Rewrite so that:
   - `{ global: true }` is presented as the blessed form for global handlers.
   - The bare form (no options bag) is marked `@deprecated` with a one-line migration note: `"Pass { global: true } explicitly. The bare form still works but will be removed in a future version."`
   - Add `@example` blocks for both (a) scoped to a focus id and (b) global via `{ global: true }`.

2. **Do not change the runtime behavior.** The `if (focusId && !isGlobal)` branch at line ~58 must keep working identically. This is a docs-only change to the hook source.

3. **Migrate in-repo call sites — ONE AT A TIME, with review.** Grep for bare `useKeyboard(` call sites:
   ```bash
   rg -n "useKeyboard\([a-zA-Z_$]" packages/ --type ts --type tsx
   ```
   **Expected hit count as of 2026-04-15: ~30 sites.** Many of these are in components that are already inside a `useFocus` scope (`packages/ui/components/modal/modal.tsx`, `packages/ui/components/tab-bar/tab-bar.tsx`, `packages/ui/components/prompt-input/prompt-input.tsx`, `packages/ui/components/spinner/spinner-showcase.tsx`, `packages/ui/components/link/link-demo.tsx`, several `packages/demo/demos/*.tsx` files). **Blindly appending `{ global: true }` to these will break their focus scoping** — e.g. a `Modal` that currently only fires keys when the modal is focused will start eating keys globally, which is the opposite of the intent.

   Rule: **only convert call sites whose handler reads `Ctrl+Q`, a global quit/help shortcut, or is unambiguously app-level.** For call sites inside a component body (especially under `packages/ui/components/`), the bare form is almost certainly intentional — leave it and add a one-line comment: `// intentional bare form: fires while this component's subtree is mounted`.

   Include the full annotated grep output (site-by-site "convert"/"leave + reason") in the PR description as a review artifact. Do **not** batch-modify. PR reviewers should be able to audit each site independently.

4. **Leave one regression test that covers the bare form** so that removing it later is an intentional decision. If no test currently exercises the bare form, add one at `packages/core/src/react/hooks/use-keyboard.test.ts` (or wherever hook tests live). Give the test a findable name — future maintainers deleting the deprecated form must be able to `rg` for it and understand *why it exists*, not just that it's a passing test:
   ```ts
   // Keep until @gridland/utils v<next major>: pins deprecated bare-form behavior so
   // removal is an intentional, grep-able change, not silent drift.
   test("deprecated: bare useKeyboard(handler) fires globally", () => {
     // ... test implementation
   })
   ```

5. **Update the `useKeyboard` docs page** (created or extended in Ticket 3) to show only `{ global: true }` in examples, with a one-line "deprecation" note at the bottom of the page:
   > The bare form `useKeyboard(handler)` without an options bag is deprecated. Pass `{ global: true }` explicitly.

### Verification

```bash
bun run --cwd packages/core test      # existing tests pass, new regression test passes
bun run --cwd packages/docs build     # docs build clean

# User-facing surfaces must not demo the deprecated form:
rg "useKeyboard\([a-zA-Z_$]" packages/docs/content packages/demo packages/ui
# Every hit must either pass a second argument (options bag) or be flagged as intentional and commented.

# Manual: hover over `useKeyboard` in VS Code, confirm the new @deprecated tag surfaces in intellisense for the bare form
```

### Done when

- `use-keyboard.ts` JSDoc blesses `{ global: true }` and deprecates the bare form.
- All in-repo global `useKeyboard` call sites use `{ global: true }`.
- A regression test pins the bare-form behavior.
- Docs page shows the blessed form.

---

## Execution Order

Ship as **three PRs**, not five. T1+T2 must land together (the success criteria can't be met otherwise); T3+T4 share context and can ship together once T1's type names are confirmed; T5 is small and lands last.

1. **PR 1 — Types + Starter (Tickets 1 & 2 combined).** Largest blast radius. Removing the `[key: string]: any` catch-alls will surface real type errors elsewhere in the monorepo that must be fixed before anything else can build cleanly. **These two tickets must be one PR, not two** — shipping T1 alone leaves `@ts-nocheck` in the starter (violates success criterion 1); shipping T2 alone leaves the starter uncompilable. Blocked on Open Questions 1, 2, and 4 being answered in the PR description with file:line citations from `packages/core/src/renderer.ts`, `packages/core/src/Renderable.ts`, and `packages/web/src/browser-renderer.ts`. Must include the full version bump matrix from criterion 11, and the "Path A vs Path B" scope decision from Ticket 2.
2. **PR 2 — Docs (Tickets 3 & 4 combined).** Opens *after* PR 1's type exports are confirmed (so T4's MDX can reference `GridlandPointerHandler` etc. without guessing at names). Blocked on Open Question 3 being answered in the PR description. Pure docs + JSDoc — no runtime changes.
3. **PR 3 — Bless `{ global: true }` (Ticket 5).** Smallest. Best reviewed after the type system is tight so the grep for call sites returns clean results and the demos/docs (which PR 2 just touched) don't need re-sweeping.

Each PR must pass `/review-full` before merge (runs `contract-guardian`, `framework-compliance`, `docs-mirror`, `dependency-auditor`). PR 1 is the one most likely to trip `contract-guardian` because it both widens and narrows a public type — pre-empt by pre-writing the CHANGELOG entry with the migration note and listing every removed index signature explicitly.

## Final Verification (Golden Path)

Before merging Ticket 2, run the evaluator's acceptance test:

```bash
cd /tmp && rm -rf my-test
# (adjust invocation to match what create-gridland's bin expects after build)
bun /Users/jessicacheng/thoughtful/gridland/packages/create-gridland/dist/index.js my-test --template vite
cd my-test && bun install

# Manually extend App.tsx to exercise the full surface:
#   - a second conditional view toggled by a useState flag (Gridland does not ship a router;
#     do NOT add a routing library for this test — use state-driven view switching)
#   - a global keyboard handler using useKeyboard(..., { global: true })
#   - a pointer handler: <box onClick={(e) => console.log(e.x, e.y)}>click me</box>
#   - a focus transition: useFocus({ id: "a" }) and useFocus({ id: "b" }) with focus() calls

bunx tsc --noEmit         # MUST pass with zero errors and zero @ts-nocheck additions
bun dev                   # manual smoke — click, hover, keyboard, focus transitions all work

# Negative checks
rg "@ts-nocheck" src/     # must return zero hits
```

If any step of this sequence requires reaching into `node_modules/@gridland/web/dist` to figure out what's available, the fix is not complete.

## Out of Scope (Tracked as Follow-Ups)

- **Auto-generated prop reference from OpenTUI renderable classes.** Would eliminate the runtime default-case passthrough in `packages/core/src/react/utils/index.ts:96-99` by providing a complete enumeration of legal props. Requires a codegen step and coordination with upstream OpenTUI. Separate task.
- **`useFocus` vs `FocusScope` API overlap audit.** Evaluator flagged this as part of the same review. Requires a dedicated design pass.
- **Page-scoped keyboard handlers.** Evaluator wanted `useKeyboard` scoped to a page (not a focus id) without hand-rolling it at the app shell. May be a new primitive or a `FocusScope` extension. Design pass required.
- **Hit-testing story for modals/popovers/click-through.** The Ticket 4 docs page should include a stub answer, but a complete story (including tests) is separate work.

## Open Questions

Questions 1–3 are **pre-PR blockers** — they must be answered in the PR description with file:line citations *before* the PR is opened for review. Each answer determines a public type or published JSDoc string that becomes a breaking change if revised later. Question 4 is fine to answer during implementation.

1. **[BLOCKER — PR 1]** Re-verify the *exact* payload shape of `MouseEvent` at `packages/core/src/renderer.ts:202-246` (the field set documented in the Architecture section was captured 2026-04-15). Determines `GridlandPointerEvent` fields in Ticket 1. Citation required: `packages/core/src/renderer.ts:<line>`. Also confirm the 11 handler list at `packages/core/src/Renderable.ts:113-123` hasn't grown or shrunk.

2. **[BLOCKER — PR 1]** Confirm that scroll events share the same class with a discriminated `scroll?` field — not a separate class. Citation required: `packages/core/src/renderer.ts:213` (`scroll?: ScrollInfo`) and `packages/web/src/browser-renderer.ts:355-363` (where the scroll payload is built).

3. **[BLOCKER — PR 2]** Does `KeyEvent.stopPropagation()` actually halt anything today, or is the flag set but never checked? Search for `propagationStopped` and `_propagationStopped` across `packages/core/src/lib/KeyHandler.ts`, `packages/core/src/react/hooks/use-keyboard.ts`, and `packages/core/src/react/focus/focus-provider.tsx`. If no reader exists, the honest JSDoc is "Sets a flag that framework listeners do not currently check; exists for forward compatibility." Do not document a propagation semantics that the runtime does not implement.

4. Is the `InputHTMLAttributes<T> { [key: string]: any }` augmentation at `gridland-jsx.d.ts:87` still load-bearing after Ticket 1, or can it be removed/narrowed? Answer during implementation — but note that if it cannot be removed, Success Criterion 3 cannot be met, and the criterion must be relaxed in writing (see Ticket 1 Step 5).

## References

- Plan file: `/Users/jessicacheng/.claude/plans/expressive-cooking-panda.md` (CTO assessment and rationale)
- Framework conventions: `CLAUDE.md` at repo root
- Subprocess safety (for any Ticket 2 work in `create-gridland`): `.claude/rules/subprocess-safety.md`
- Registry pipeline (if Ticket 1 touches `packages/ui/`): `.claude/rules/registry-pipeline.md`
