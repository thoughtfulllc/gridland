# Task 008: Bless `{ global: true }` as the Canonical Global `useKeyboard` Form

> Split from `tasks/004-types-and-docs-gap.md` — this was T5 of the original bundle. Launch-priority #4 per the CTO review. Included in the launch cut per user direction; the JSDoc half is the cheap part, the call-site migration is the expensive part that may slip to a follow-up.

## Summary

`useKeyboard` currently has two equivalent forms for "global scope": the bare `useKeyboard(handler)` form and the explicit `useKeyboard(handler, { global: true })`. Example code in docs and demos mixes both, which teaches new users that the shape is ambiguous. Bless `{ global: true }` as the canonical form in JSDoc and the docs page, mark the bare form `@deprecated` (JSDoc-only — no runtime behavior change), migrate only unambiguously app-level in-repo call sites, and leave a regression test pinning the bare-form behavior so removing it later is an intentional change.

## Motivation

First-hour adopter evaluation flagged the two-forms ambiguity. Picking one canonical form is cheap in JSDoc terms but high-value for documentation consistency across examples, tests, and the scaffolded starter.

**Risk the original ticket flagged and this ticket honors:** roughly 30 in-repo bare `useKeyboard(` call sites exist as of 2026-04-15. Many are inside components that are already inside a `useFocus` scope (`packages/ui/components/modal/modal.tsx`, `tab-bar/tab-bar.tsx`, `prompt-input/prompt-input.tsx`, `spinner/spinner-showcase.tsx`, `link/link-demo.tsx`, several `packages/demo/demos/*.tsx`). **Blindly appending `{ global: true }` to these breaks their focus scoping** — e.g. a `Modal` that today only fires keys when focused would start eating keys globally. The rule this ticket follows: *only convert call sites whose handler is unambiguously app-level (global quit, global help, top-level shortcut). Leave every component-internal bare form as-is with a short `// intentional bare form` comment.*

## Scope

**In scope:**
1. JSDoc rewrite at `packages/core/src/react/hooks/use-keyboard.ts` blessing `{ global: true }` and marking the bare form `@deprecated`.
2. Call-site migration **one at a time, with per-site judgment**. PR description must include an annotated grep output (site-by-site "convert" / "leave + reason").
3. Regression test at `packages/core/src/react/hooks/use-keyboard.test.ts` (or wherever the hook tests live) pinning the bare-form behavior with a findable name.
4. Docs page update — `packages/docs/content/docs/hooks/use-keyboard.mdx` examples show only `{ global: true }`, plus a deprecation note at the bottom.

**Out of scope:**
- Runtime removal of the bare form. This ticket does not change behavior; it only changes the recommended form. The `if (focusId && !isGlobal)` branch at `packages/core/src/react/hooks/use-keyboard.ts:~58` must keep working identically.
- Migrating the `packages/create-gridland/templates/vite/src/App.tsx` example rewritten in `tasks/005-starter-no-tscheck.md`. That starter uses the bare form intentionally for now to keep dependencies minimal; open a follow-up ticket to update it once this ticket merges.
- Mass-migrating component-internal bare call sites (see Motivation).

## Success Criteria

1. `packages/core/src/react/hooks/use-keyboard.ts` JSDoc blesses `{ global: true }` and marks the bare form `@deprecated` with a one-line migration note.
2. `@example` blocks show (a) scoped to a focus id, (b) global via `{ global: true }`.
3. Every **app-level** bare call site has been converted to `{ global: true }`. Every **component-internal** bare call site has a one-line `// intentional bare form: …` comment explaining why.
4. A regression test with a findable name (grep-able: `deprecated: bare useKeyboard`) pins the bare-form behavior.
5. `packages/docs/content/docs/hooks/use-keyboard.mdx` examples show only `{ global: true }` with a deprecation note at the bottom.
6. `bun run --cwd packages/core test` passes (including the new regression test).
7. `bun run --cwd packages/docs build` passes clean.
8. User-facing grep is clean: `rg "useKeyboard\([a-zA-Z_$]" packages/docs/content packages/demo packages/ui` — every hit must either pass an options bag **or** carry the intentional-bare-form comment.
9. **Semver + CHANGELOG:**
   - `@gridland/utils` — **patch bump.** JSDoc change + deprecation tag. No runtime break.
   - `@gridland/ui` — **patch bump** *only if* any in-repo call sites under `packages/ui/components/` were modified (either converted or had the intentional-bare comment added). If untouched, skip.
   - `@gridland/demo` — **patch bump** *only if* any in-repo call sites under `packages/demo/` were modified. Skip otherwise.

## Architecture Context

### Files involved

| Path | Role |
|---|---|
| `packages/core/src/react/hooks/use-keyboard.ts` | The hook implementation. JSDoc block above the `useKeyboard` export (currently describes the three scoping modes around line 28). Dispatch logic at lines ~56-68 — **do not modify.** |
| `packages/core/src/react/hooks/use-keyboard.test.ts` (or `.tsx`) | Location of the regression test. Verify the exact path before writing — there may already be a test file in a sibling directory. |
| `packages/docs/content/docs/hooks/use-keyboard.mdx` | Docs page. Note: `tasks/006-keyevent-jsdoc.md` also touches this file. **If 006 has not yet landed, coordinate — do not duplicate the KeyEvent table work here.** |

### Classifying call sites — the rule

For every hit in `rg -n "useKeyboard\([a-zA-Z_$]" packages/ --type ts --type tsx`:

- **Convert to `{ global: true }`** if the handler:
  - Reads a universally-global shortcut (Ctrl+Q, Ctrl+C, global help, global palette open).
  - Is called from an app shell or top-level `App.tsx` / `main.tsx` / root-page file.
  - Is unambiguously documented in a neighboring comment as "global".

- **Leave as bare + comment** if the handler:
  - Is called inside a `useFocus`-scoped component that today only fires when its subtree is mounted or focused.
  - Is called inside a modal / overlay / popover / tab / input component where the bare form matches the component's mount lifetime by design.
  - Is ambiguous — **default to leave + comment.** Converting the wrong site silently breaks focus scoping; leaving it creates no regression.

When in doubt, leave it. The PR reviewer must be able to audit each decision independently.

## Steps

1. **Grep all current bare call sites** and freeze the list for the PR:
   ```bash
   rg -n "useKeyboard\([a-zA-Z_$]" packages/ --type ts --type tsx > /tmp/008-bare-sites.txt
   wc -l /tmp/008-bare-sites.txt   # expect ~30 as of 2026-04-15; confirm exact count in the PR description
   ```
   Annotate each line in the PR description with "convert" / "leave + reason". This list becomes the review artifact.

2. **Rewrite the JSDoc block above `useKeyboard`** at `packages/core/src/react/hooks/use-keyboard.ts`. Rough target:

   ```ts
   /**
    * Subscribes to keyboard events.
    *
    * Pass `{ global: true }` for app-level handlers (global shortcuts, quit, help).
    * Pass `{ focusId: "…" }` to scope the handler to a focus id — the handler fires
    * only while that id owns focus.
    *
    * @example Global handler
    * ```tsx
    * useKeyboard((event) => {
    *   if (event.name === "q" && event.ctrl) quit()
    * }, { global: true })
    * ```
    *
    * @example Scoped to a focus id
    * ```tsx
    * const { focused } = useFocus({ id: "editor" })
    * useKeyboard((event) => {
    *   if (event.name === "s" && event.ctrl) save()
    * }, { focusId: "editor" })
    * ```
    *
    * @deprecated Calling `useKeyboard(handler)` without an options bag is deprecated.
    * Pass `{ global: true }` explicitly. The bare form still works but will be removed
    * in a future version.
    */
   export function useKeyboard(...) { /* unchanged */ }
   ```

   Verify the parameter and options types match the actual function signature before committing — the signature may have drifted since this ticket was written.

3. **Do NOT modify the runtime** at lines ~56-68. The `if (focusId && !isGlobal)` dispatch branch must keep working identically. This is a docs-only change to the hook source.

4. **Migrate call sites one at a time.** For each line in `/tmp/008-bare-sites.txt`:
   - If the classifier rule says **convert**: add `, { global: true }` to the call, commit with a message citing the file.
   - If the classifier rule says **leave**: add a one-line comment above the call, e.g. `// intentional bare form: fires while this Modal's subtree is mounted`.
   - Commit granularly — one commit per logical group (per component or per demo) so reviewers can bisect.

5. **Add the regression test** at `packages/core/src/react/hooks/use-keyboard.test.ts` (verify path first — check for existing sibling tests). Give it a findable name:

   ```ts
   // Keep until @gridland/utils v<next major>: pins deprecated bare-form behavior so
   // removal is an intentional, grep-able change, not silent drift.
   test("deprecated: bare useKeyboard(handler) fires globally", () => {
     // ... test implementation: mount a tree without a useFocus scope,
     // call useKeyboard(handler), dispatch a key event, assert handler fired.
   })
   ```

   The test's existence is the point — future maintainers deleting the deprecated form must be able to `rg "deprecated: bare useKeyboard"` and find one place where the behavior is pinned.

6. **Update `packages/docs/content/docs/hooks/use-keyboard.mdx`.** Rewrite every code example that uses the bare form to pass `{ global: true }`. At the bottom of the page, add a "Deprecation" section:

   ```mdx
   ## Deprecation: bare form

   Calling `useKeyboard(handler)` without an options bag is deprecated. Pass
   `{ global: true }` explicitly. The bare form still works but will be removed
   in a future version.
   ```

   If `tasks/006-keyevent-jsdoc.md` has already updated this file with a worked example, update that example too — it uses the bare form in its draft.

## Verification

```bash
# Tests — including the new regression test
bun run --cwd packages/core test

# Docs build clean
bun run --cwd packages/docs build

# User-facing surfaces have no un-commented bare forms
rg "useKeyboard\([a-zA-Z_$]" packages/docs/content packages/demo packages/ui
# Every hit must either pass an options bag OR have an "intentional bare form" comment on the preceding line.

# Manual — IDE deprecation surface
# Open packages/core/src/react/hooks/use-keyboard.ts in VS Code.
# In a test file, type `useKeyboard((e) => {})` — the intellisense hover must show the @deprecated tag with strikethrough.
```

## Done when

- `use-keyboard.ts` JSDoc blesses `{ global: true }` and deprecates the bare form with `@example` blocks for both shapes.
- Every in-repo app-level bare call site converted; every component-internal bare call site annotated with the intentional-bare comment.
- Regression test named `deprecated: bare useKeyboard` exists and passes.
- Docs page shows only `{ global: true }` in examples with a deprecation note.
- Grep check passes (no uncommented bare forms in user-facing packages).
- Version bumps applied per criterion 9.

## References

- Original bundle (archived): `tasks/004-types-and-docs-gap.md` §Ticket 5.
- Companion docs ticket: `tasks/006-keyevent-jsdoc.md` (also touches `use-keyboard.mdx` — coordinate).
- Follow-up after merge: update `packages/create-gridland/templates/vite/src/App.tsx` (written in `tasks/005-starter-no-tscheck.md`) to use `{ global: true }`.
