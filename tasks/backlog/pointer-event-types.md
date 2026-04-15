# Backlog: Type the Pointer Event Surface

> **Status: DEFERRED post-launch.** Split from `tasks/004-types-and-docs-gap.md` — this was T1 of the original bundle. Deferred per the CTO review: highest effort, lowest first-hour-adopter visibility. Revisit after the launch tickets (005, 006, 007, 008) ship, as a dedicated types-hardening pass.

## Why this is deferred

A first-hour adopter does not hit the `[key: string]: any` catch-all in `GridlandBoxProps` unless they either (a) typo a handler name like `onClik`, or (b) hover an `onMouseDown` param expecting a typed event. The fix for both is invisible until the user stumbles into one of those paths.

Meanwhile, the refactor required to land this ticket has the largest blast radius of any item in the original bundle:
- Removing `[key: string]: any` from `GridlandBoxProps` and `GridlandInputProps` will surface real type errors across `packages/ui/components/` and `packages/demo/`, because the catch-all is currently papering over legitimate props (`focused`, `selectable`, every renderable style prop) that are not yet explicit in the type.
- Two pre-PR blocker Open Questions need file:line citations from `packages/core/src/renderer.ts` and `packages/core/src/Renderable.ts` before a single line of type code can be written.
- The React 19 `HTMLAttributes<T> { [key: string]: any }` augmentation at `gridland-jsx.d.ts:~87` is load-bearing for React's ambient JSX resolution; narrowing it without breaking typecheck in consumer packages is a separate subproblem.
- Both copies of `gridland-jsx.d.ts` (`packages/web/src/` and `packages/ui/`) must change in lockstep, with a `diff` check as part of acceptance.

**Launch decouples cleanly via `tasks/005-starter-no-tscheck.md` Path A**, which ships a clean starter using the *existing* type surface (no catch-all removal, no `@ts-nocheck`). That unblocks the visible first-impression win without blocking on this ticket.

## Goal (when picked up)

Declare **all 11** mouse handlers from `Renderable.ts:113-123` (`onMouse`, `onMouseDown`, `onMouseUp`, `onMouseMove`, `onMouseDrag`, `onMouseDragEnd`, `onMouseDrop`, `onMouseOver`, `onMouseOut`, `onMouseScroll`, `onClick`) on `GridlandBoxProps` with a concrete event payload type. Remove the `[key: string]: any` catch-all from `GridlandBoxProps` and `GridlandInputProps`. Mirror every change into `packages/ui/gridland-jsx.d.ts` (the byte-identical duplicate).

## Success Criteria

1. `GridlandBoxProps` has all 11 typed mouse handler props.
2. `packages/web/src/gridland-jsx.d.ts` and `packages/ui/gridland-jsx.d.ts` are byte-identical (`diff` returns empty).
3. Neither `GridlandBoxProps` nor `GridlandInputProps` contains a `[key: string]: any` line.
4. `import type { GridlandPointerEvent } from "@gridland/web"` resolves.
5. Typing `<box onClik={() => {}} />` raises a TypeScript error (satisfies the "typo detection" criterion deferred from `tasks/005-starter-no-tscheck.md`).
6. Typing `<box onC` in VS Code autocompletes `onClick`.
7. `bun run --cwd packages/web build`, `bun run --cwd packages/docs build`, `bun run --cwd packages/demo build`, `bun run --cwd packages/ui build`, and `bunx --cwd packages/ui tsc --noEmit` all pass — specifically including the `packages/ui` `tsc --noEmit` check, because `packages/ui` emits registry JSON (not a compiled bundle), so a regular `bun run build` will NOT catch type regressions there.
8. Every file in `packages/demo/` or `packages/ui/` that breaks due to the catch-all removal is fixed with **explicit types**, not by reintroducing `any` or `@ts-nocheck`.
9. Existing scaffolded projects (`tasks/005-starter-no-tscheck.md` output) continue to compile clean — update that starter's example handler to import `GridlandPointerEvent` and type the parameter explicitly once this ticket merges.
10. **Semver + CHANGELOG:**
    - `@gridland/web` — **minor bump.** Type surface widens additively (new event props, new exported types) and narrows in one spot (index signature removal). CHANGELOG entry must include a one-line migration note for users currently relying on the index signature.
    - `@gridland/ui` — **patch bump.** The duplicate `gridland-jsx.d.ts` changes; registry consumers see the new types on next `shadcn add`.
    - `@gridland/demo` — **patch bump** if `packages/demo/` files were edited to fix type errors.

## Pre-PR Blockers (Open Questions)

**Both must be answered in the PR description with file:line citations before the PR is opened for review.** Each answer determines a public type that becomes a breaking change to revise later.

1. **Exact payload shape of `MouseEvent`** at `packages/core/src/renderer.ts:202-246` (the field set captured below was taken 2026-04-15 — re-verify). Determines `GridlandPointerEvent` fields. Citation required. Also confirm the 11-handler list at `packages/core/src/Renderable.ts:113-123` has not grown or shrunk.

2. **Scroll event shape:** confirm scroll events share the same class with a discriminated `scroll?` field — not a separate class. Citations required: `packages/core/src/renderer.ts:~213` (`scroll?: ScrollInfo`) and `packages/web/src/browser-renderer.ts:355-363` (where the scroll payload is built — Gridland reduces DOM `WheelEvent.deltaX/deltaY` to `{ direction, delta }`).

A third question — whether `InputHTMLAttributes<T> { [key: string]: any }` at `gridland-jsx.d.ts:~87` can be removed/narrowed after the main surface is typed — is fine to answer during implementation, but if it cannot be removed, the "typo detection" success criterion (5 above) cannot be met and the criterion must be relaxed in writing inside the PR description.

## Architecture Context

### Where pointer events actually dispatch

**Important:** Gridland's reconciler does not unpack pointer events. The default case in `packages/core/src/react/utils/index.ts:96-99` assigns every unknown prop verbatim to the underlying instance: `instance[propKey] = propValue`. That means `onClick`, `onMouseOver`, etc. are forwarded to OpenTUI's renderable, and **the source of truth for the payload shape is OpenTUI itself, not Gridland**. A grep inside `packages/core/src/react/` will return nothing useful — that is expected, not a dead end.

**One exception — `onClick` is special-cased.** The reconciler handles `onClick` explicitly at `packages/core/src/react/utils/index.ts:76-80`, and Gridland's browser renderer synthesizes the click dispatch itself at `packages/web/src/browser-renderer.ts:249` (calling `renderable._clickHandler(this.createTuiMouseEvent(...))`). For `onClick` only, grepping Gridland is authoritative. For the other 10 mouse props, you must read OpenTUI's `Renderable.processMouseEvent`.

See `.claude/rules/opentui-event-dispatch.md` for the full rule, the verified browser-renderer event object shape, and the surprises (`x` / `y` are cell coordinates, scroll payload is `{ direction, delta }` not `{ deltaX, deltaY }`, no `timestamp` / `nativeEvent` / `clientX` / `clientY`). The rule file auto-loads when you touch any of the files this ticket edits.

### OpenTUI lives in-tree

OpenTUI's TypeScript is vendored into `packages/core/src/`. `@gridland/core` *is* OpenTUI's TS layer, living inside the monorepo. Do NOT look under `node_modules/@opentui/...` — only the native Zig binary packages (`core-darwin-arm64`, `core-linux-*`) are installed there, and they contain no `.ts` files. `find node_modules/@opentui -name "*.ts"` returns zero results.

### Source-of-truth paths

- **`packages/core/src/renderer.ts:202`** — `export class MouseEvent` (the payload class, with `preventDefault()` / `stopPropagation()` methods and `defaultPrevented` / `propagationStopped` getters).
- **`packages/core/src/Renderable.ts:113-123`** — the 11 mouse handler props on the base renderable.
- **`packages/core/src/Renderable.ts:1468-1536`** — `processMouseEvent` dispatcher and per-prop setter overrides.
- **`packages/core/src/lib/parse.mouse.ts`** — `MouseEventType` literal union (`"down" | "up" | "move" | "drag" | "drag-end" | "drop" | "over" | "out" | "scroll"`) and the `RawMouseEvent` wire shape.
- **`packages/web/src/browser-renderer.ts:335-366`** — `createTuiMouseEvent` constructs the object that gets handed to `processMouseEvent`. This is the layer the user's handler actually observes.

### Files that must change in lockstep

| Path | Role |
|---|---|
| `packages/web/src/gridland-jsx.d.ts` | Primary type surface. Currently has `[key: string]: any` on `GridlandBoxProps` (line ~61) and `GridlandInputProps` (line ~78). |
| `packages/ui/gridland-jsx.d.ts` | **Byte-identical duplicate.** Listed in `packages/ui/tsconfig.json`'s `include` array. Every change to the web copy must be mirrored here in the same PR, or the two drift and `packages/ui` will typecheck against a stale surface. `diff packages/web/src/gridland-jsx.d.ts packages/ui/gridland-jsx.d.ts` must return empty at the end of each commit. |
| `packages/web/src/events.ts` | **To create.** Runtime-importable file exporting `GridlandPointerEvent` and `GridlandPointerHandler`. `.d.ts` files cannot be imported as types from user code without a paired runtime file. |
| `packages/web/src/index.ts` | Must re-export `GridlandPointerEvent` and `GridlandPointerHandler`. |
| `packages/core/src/renderables/Box.ts` | **Pre-removal audit target.** List every prop the reconciler sets on the box instance — the catch-all is currently papering over these. Each must become an explicit field on `GridlandBoxProps`. |
| `packages/core/src/renderables/Input.ts` | Same pre-removal audit for `GridlandInputProps`. |

## Steps (outline — re-derive details after Open Questions are answered)

1. **Answer both Open Questions** with file:line citations. Write the citations into the PR description before a single line of type code.

2. **Audit `packages/core/src/renderables/Box.ts`** for every prop the reconciler sets on the instance. List them in the PR description. Each must become an explicit field on `GridlandBoxProps` before the catch-all is removed — otherwise real user code breaks.

3. **Audit `packages/core/src/renderables/Input.ts`** the same way for `GridlandInputProps`.

4. **Create `packages/web/src/events.ts`** with `GridlandPointerEvent` and `GridlandPointerHandler`. The draft from `.claude/rules/opentui-event-dispatch.md` and the archived `tasks/004-types-and-docs-gap.md` §Ticket 1 Step 2 is a starting point — verify against the answers to Open Questions 1 and 2 before copying. Field set (verify):

   ```ts
   export interface GridlandPointerEvent {
     type: MouseEventType
     button: number
     x: number    // cell column
     y: number    // cell row
     target: Renderable | null
     modifiers: { shift: boolean; alt: boolean; ctrl: boolean }
     scroll?: { direction: "up" | "down" | "left" | "right"; delta: number }
     source?: Renderable
     isDragging?: boolean
     readonly defaultPrevented: boolean
     readonly propagationStopped: boolean
     preventDefault(): void
     stopPropagation(): void
   }
   export type GridlandPointerHandler = (event: GridlandPointerEvent) => void
   ```

   **Expose the full runtime shape — do not fabricate a narrower one.** Narrowing a public type later is a breaking change; widening is additive.

5. **Update BOTH copies of `gridland-jsx.d.ts`** in the same commit. Add all 11 handler props to `GridlandBoxProps`, remove the `[key: string]: any` from `GridlandBoxProps` and `GridlandInputProps`, add every prop surfaced by the Box.ts / Input.ts audits. After each edit, run `diff packages/web/src/gridland-jsx.d.ts packages/ui/gridland-jsx.d.ts` — must be empty.

6. **Export the new types** from `packages/web/src/index.ts`:
   ```ts
   export type { GridlandPointerEvent, GridlandPointerHandler } from "./events"
   ```

7. **Narrow the React module augmentations** (the `HTMLAttributes<T> { [key: string]: any }` family around lines 81-107 of `gridland-jsx.d.ts`). Attempt removal one at a time. After each removal, run the full verification suite below. If a removal breaks the build, narrow the augmentation to the specific keys that conflict rather than reverting to `[key: string]: any`. Document every narrowed key in the PR description.

8. **Fix every type error** that surfaces in `packages/ui/` and `packages/demo/`. Do NOT reintroduce `any` or `@ts-nocheck`. Every fix must use an explicit type.

9. **Update `tasks/005-starter-no-tscheck.md`'s starter** (once shipped) to import `GridlandPointerEvent` and type the pointer handler parameter explicitly. This is a follow-up commit inside this PR — the starter was intentionally typed loosely in 005 pending this ticket.

10. **Confirm typo detection** — add `<box onClik={() => {}}>test</box>` to a scratch test file, run `bunx tsc --noEmit`, confirm it errors. Remove the line before committing.

## Verification

```bash
# Each of these must pass
bun run --cwd packages/web build
bun run --cwd packages/core build    # if core has a build step
bun run --cwd packages/demo build
bun run --cwd packages/ui build      # registry emission
bunx --cwd packages/ui tsc --noEmit  # catches type regressions in registry components

# Byte-identical duplicate check
diff packages/web/src/gridland-jsx.d.ts packages/ui/gridland-jsx.d.ts && echo "OK"

# Resolution check — the new exported types work from a consumer
cat > /tmp/types-check.ts <<'EOF'
import type { GridlandPointerEvent, GridlandPointerHandler } from "@gridland/web"
const handler: GridlandPointerHandler = (e: GridlandPointerEvent) => { console.log(e.x, e.y) }
EOF
# (resolve via your preferred typecheck invocation)

# Typo regression — manual
# Add `<box onClik={() => {}}>test</box>` to App.tsx of a scratch project.
# bunx tsc --noEmit must error. Remove the line before proceeding.
```

## References

- Original bundle (archived): `tasks/004-types-and-docs-gap.md` §Ticket 1 (has the fullest step-by-step, including the draft `GridlandPointerEvent` interface and the React augmentation narrowing plan).
- OpenTUI event dispatch rule: `.claude/rules/opentui-event-dispatch.md` — **required reading.** Auto-loads when you touch `packages/web/src/browser-renderer.ts` or `packages/web/src/gridland-jsx.d.ts`.
- Launch ticket that this unblocks (typo detection criterion): `tasks/005-starter-no-tscheck.md`.
- Companion docs ticket (will switch from inline interface to `import type` once this lands): `tasks/007-pointer-events-docs.md`.
