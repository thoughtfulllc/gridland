# Task 005: Vite Starter Template Without `@ts-nocheck`

> Split from `tasks/004-types-and-docs-gap.md` — this was T2 (Path A) of the original bundle. Launch-priority #1 per the CTO review: highest first-impression ROI, independent of the deferred pointer-types work in `tasks/backlog/pointer-event-types.md`.

## Summary

`packages/create-gridland/templates/vite/src/App.tsx` ships with `// @ts-nocheck` on line 1. It is the first file a new adopter opens after running `bunx create-gridland my-app --template vite`, and the directive signals that Gridland's types are unreliable. Replace the body with a minimal, self-contained example that compiles clean under the existing type surface — no dependency on `@gridland/demo`, no type catch-all audit, no OpenTUI renderer spelunking.

## Motivation

First-hour adopter evaluation flagged the starter's `@ts-nocheck` as an immediate credibility hit. Decoupling this fix from the full pointer-event-types rewrite (now `tasks/backlog/pointer-event-types.md`) lets us ship the visible win in hours instead of a week.

## Scope

**Path A (chosen).** Replace `LandingApp` with a minimal self-contained example. Removes the `@gridland/demo` dependency from the starter entirely, which also eliminates the untyped `packages/demo/src/landing/` surfaces as a compile target. No touches to `packages/demo/`.

**In scope:** `packages/create-gridland/templates/vite/src/App.tsx`, any sibling template files that carry `@ts-nocheck`, and the scaffold verification loop.

**Out of scope:**
- Removing `[key: string]: any` from `GridlandBoxProps` / `GridlandInputProps` — deferred to `tasks/backlog/pointer-event-types.md`.
- Typo detection for `<box onClik>` — cannot be satisfied while the catch-all exists; inherited by the backlog ticket.
- Cleaning up `@ts-nocheck` elsewhere in the monorepo (framework internals that use intrinsic `<box>` / `<text>` / `<span>` are allowed to keep `@ts-nocheck` per `CLAUDE.md`).
- Fixing types in `packages/demo/src/landing/`.

## Success Criteria

1. `packages/create-gridland/templates/vite/src/App.tsx` has no `// @ts-nocheck` directive (line 1 starts with `import`).
2. Scaffolding via the locally built `create-gridland` and running `bunx tsc --noEmit` inside the new project exits 0.
3. The scaffolded project still starts with `bun dev` and renders a recognisable Gridland screen.
4. `rg "@ts-nocheck" packages/create-gridland/templates/` returns zero hits.
5. **Semver + CHANGELOG:** `@gridland/create-gridland` — **patch bump.** Starter template content changes only; no API changes.

## Architecture Context

### Files involved

| Path | Role |
|---|---|
| `packages/create-gridland/templates/vite/src/App.tsx` | The Vite starter. Currently 12 lines, line 1 is `// @ts-nocheck`, line 4 imports `LandingApp from "@gridland/demo/landing"`. |
| `packages/create-gridland/templates/vite/package.json` | Template's dependency manifest. Currently declares `@gridland/demo` — remove it under Path A if no other template file references the package. |
| `packages/create-gridland/dist/index.js` | Built CLI entry. Used for local scaffold verification — there is no published `@gridland/create-gridland` on npm, so `bunx --package` won't work. |

### Why Path A compiles clean today

The existing `GridlandBoxProps` in `packages/web/src/gridland-jsx.d.ts` has a `[key: string]: any` catch-all (line 61). Under this, a minimal `<box>` with an `onClick` handler typechecks as `any`-typed — not ideal, but not an error. The starter can therefore compile clean *without* the deferred types work, provided the example avoids surfaces that the current types reject (e.g. `LandingApp`'s untyped `useKeyboard((event: any) => ...)` pattern which triggers strict-mode complaints in downstream projects).

Minimal surfaces confirmed to compile under the current types: `<TUI>`, `<box>`, `<text>`, `useKeyboard` (bare form), `useState`, `useFocus`. Avoid `<box onMouseOver>` and friends in the example — they pass typecheck via the catch-all but pass `any` to the handler, which teaches new users the wrong shape.

## Steps

1. **Rewrite `packages/create-gridland/templates/vite/src/App.tsx`** to a minimal self-contained example. Remove line 1 in the same edit. Target body (verify against current types before committing):

   ```tsx
   import { useState } from "react"
   import { TUI } from "@gridland/web"
   import { useKeyboard, useFocus } from "@gridland/utils"

   export function App() {
     const [count, setCount] = useState(0)
     const { focus } = useFocus({ id: "counter" })

     useKeyboard((event) => {
       if (event.name === "up") setCount((n) => n + 1)
       if (event.name === "down") setCount((n) => n - 1)
       if (event.name === "q") process.exit(0)
     })

     return (
       <TUI style={{ width: "100vw", height: "100vh" }} backgroundColor="#1a1a2e">
         <box
           style={{ padding: 2, border: true }}
           onMouseOver={() => focus()}
         >
           <text>Gridland starter — count: {count}</text>
           <text>↑/↓ to change, q to quit</text>
         </box>
       </TUI>
     )
   }
   ```

   Notes:
   - Uses the bare `useKeyboard(handler)` form. This is still the supported form today. Ticket 008 will deprecate it in JSDoc — after 008 lands, open a follow-up to update this example to `{ global: true }`.
   - Do not import `KeyEvent` or `GridlandPointerEvent`. Leaving the handler parameter inferred sidesteps the deferred types ticket; explicit imports can land once `tasks/backlog/pointer-event-types.md` ships.

2. **Check `packages/create-gridland/templates/vite/package.json`** and remove `@gridland/demo` from `dependencies` if the rewritten App.tsx is the only file that referenced it. Run `rg "@gridland/demo" packages/create-gridland/templates/vite/` first to confirm no other file imports it.

3. **Audit the templates folder** for other `@ts-nocheck` directives:
   ```bash
   rg "@ts-nocheck" packages/create-gridland/templates/
   ```
   Remove every hit. Fix any real errors that surface. Templates are user-facing and must set the example.

4. **Scaffold a scratch project from the local build** and typecheck:
   ```bash
   bun run --cwd packages/create-gridland build
   cd /tmp && rm -rf scratch-005
   bun /Users/jessicacheng/thoughtful/gridland/packages/create-gridland/dist/index.js scratch-005 --template vite
   cd scratch-005 && bun install && bunx tsc --noEmit
   echo "exit code: $?"  # must be 0
   ```
   Confirm the `bin` entry and dist filename by reading `packages/create-gridland/package.json` first — the dist file may have been renamed since this ticket was written.

5. **Smoke-test the scaffolded app** runs:
   ```bash
   cd /tmp/scratch-005 && bun dev
   # Manual: confirm a Gridland screen renders, ↑/↓ changes the counter, q exits cleanly.
   ```

## Verification

```bash
# Typecheck
rm -rf /tmp/scratch-005
bun run --cwd packages/create-gridland build
cd /tmp && bun /Users/jessicacheng/thoughtful/gridland/packages/create-gridland/dist/index.js scratch-005 --template vite
cd scratch-005 && bun install && bunx tsc --noEmit && echo "OK"

# Negative check
rg "@ts-nocheck" /tmp/scratch-005 packages/create-gridland/templates/ && echo "FAIL" || echo "OK"

# Subprocess safety regression (unrelated but cheap to run after touching create-gridland)
bun /Users/jessicacheng/thoughtful/gridland/packages/create-gridland/dist/index.js add 'safe; echo PWNED_FROM_SHELL' --dry-run
# Expected: literal "safe; echo PWNED_FROM_SHELL" appears as one argv position; "PWNED_FROM_SHELL" does not appear on its own line.
```

## Done when

- `packages/create-gridland/templates/vite/src/App.tsx` starts with `import`, not `// @ts-nocheck`.
- Scaffold + `bunx tsc --noEmit` exits 0 with no added `@ts-nocheck`.
- `rg "@ts-nocheck" packages/create-gridland/templates/` returns zero hits.
- `bun dev` in the scaffolded project renders a working screen.
- `@gridland/create-gridland` patch-bumped with a CHANGELOG entry.

## References

- Original bundle (archived): `tasks/004-types-and-docs-gap.md` §Ticket 2.
- Deferred companion: `tasks/backlog/pointer-event-types.md` (will enable typo detection and typed handler parameters).
- Subprocess safety rule: `.claude/rules/subprocess-safety.md` (applies to any further `create-gridland` work).
