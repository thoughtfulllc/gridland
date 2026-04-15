# Task 009: Collapse the Focus API Into a Single `useInteractive` Hook

## Summary

Today Gridland ships three near-overlapping hooks for focus-aware components: `useFocus` (registration + state observation), `useInteractive` (focus + keyboard + shortcuts composed), and `useInteractiveStyled` (interactive + border styling). Reviewers inside the monorepo have picked the wrong one twice in a single editing session, and the split has no independent technical justification — `useInteractive` is already a strict superset of `useFocus` in every dimension except the `scopeId` option. This ticket **deletes `useFocus` entirely** (source file, test file, type exports), **inlines its registration logic into `useInteractive`**, and **promotes `scopeId` to a first-class option on `UseInteractiveOptions`**. The result is one public focus hook in `@gridland/utils`, one sugar variant in `@gridland/ui` (`useInteractiveStyled`, kept because of the utils→ui package boundary), and no "which primitive do I reach for?" decision for users.

The migration leans on an existing invariant that is **not** changing: the `length > 0` dispatch guard at `packages/core/src/react/focus/use-shortcuts.ts:21`. That guard is what lets `useInteractive({ id })` be safe in pure observer mode — calling it without a `shortcuts` option is a no-op at the dispatch level, so a display-only wrapper sharing a focusId with an already-interactive child does not stomp on the child's shortcut registration. A regression test is added in scope to pin this invariant permanently.

## Motivation

### The confusion surface

Reviewing `packages/demo/demos/focus.tsx` on 2026-04-15, the editor had to trace the difference between `useFocus`, `useInteractive`, and `useInteractiveStyled` across four code paths (demo, focus-grid, multi-select internals, focus-reducer dedupe) before the correct answer emerged. That's not a junior-engineer trap — it was a full turn of back-and-forth for a reader who already knew the framework. A first-hour adopter would stall here for an hour, pick the wrong hook, and ship a demo with six competing focusables in one FocusProvider (exactly the bug that motivated this session's fix).

The three-way split has no independent technical justification. Every property of it is historical:

- `useFocus` was the original primitive, shipped in commit `abb6865` (2026-03-18) with the initial unified focus system.
- `useInteractive` was added later as a convenience composing `useFocus + useKeyboard + useShortcuts`. When it shipped, `useFocus` was already in use across dozens of call sites, so it stayed public for compatibility, not because it served a distinct purpose.
- `useInteractiveStyled` lives in `@gridland/ui` only because `useFocusBorderStyle` depends on `useTheme()`, and `@gridland/utils` cannot depend on `@gridland/ui` (circular). That's a real constraint and the only one that survives this ticket.

### Why `useFocus` has no independent use

`useInteractive` composes three sub-hooks at `packages/core/src/react/interactive/use-interactive.ts:68-91`:

```ts
const focusState = useFocus({ id, autoFocus, disabled, selectable, tabIndex })  // line 71
// ...
useKeyboard((event) => handlerRef.current?.(event), { focusId, selectedOnly: true })  // line 79
// ...
useShortcuts(resolvedShortcuts, focusId)  // line 88
```

For every documented reason to use `useFocus` directly today, `useInteractive` handles it:

1. **"I just want focus state for a display-only wrapper."** Call `useInteractive({ id })` with no `shortcuts` and don't call `onKey(...)`. The `useShortcuts` call gets an empty array, which short-circuits at `use-shortcuts.ts:21` (the load-bearing guard — see below). The `useKeyboard` subscription fires its handler into `null` on every keystroke while the component is selected, which is measurably free and functionally harmless. **Verified working** in `packages/demo/demos/focus.tsx` as of this session.

2. **"I need to override the scope."** Today this is the one thing `useFocus` has that `useInteractive` doesn't — `useFocus` accepts `scopeId?: string | null`, `useInteractive` doesn't pass it through. **This ticket adds `scopeId` to `UseInteractiveOptions` and pipes it into the internal registration path.**

3. **"I'm writing a test that exercises the focus system without keyboard noise."** Tests can call `useInteractive({ id })` without shortcuts/onKey. The internal keyboard/shortcut paths are no-ops from the outside; assertions on `isFocused`, `isSelected`, `isAnySelected`, and dispatch actions remain clean.

No residual case. `useFocus` is dead weight.

### Why `scopeId` at scale is first-class, not a niche

The prior-session thinking — "scopeId is rarely used, we can leave it on `useFocus`" — was me sampling the current monorepo's ~30 call sites and concluding "rarely used." That's a false extrapolation. At scale, `scopeId` override is the escape hatch for several real patterns:

- **Modals within modals.** Inner modal opens while outer modal is still mounted. Some focusables inside the inner modal (e.g., a global "cancel all" button wired to app shell) should route to the outermost scope, not the inner modal's scope.
- **Scoped toolbars inside layouts.** A floating toolbar rendered inside a `FocusScope` (for z-order reasons) that conceptually belongs to the layout scope.
- **Floating overlays via portals.** A tooltip or popover rendered via a portal inside a scoped region but owned by the root scope.
- **Headless-component composition.** A consumer wrapping a third-party registry component (installed via shadcn CLI) that needs to override where the wrapped focusable lands in the scope tree, without forking the component.

None of these patterns appear at the current monorepo scale because the monorepo is still small. All of them will appear at application scale. `scopeId` must be on the one public hook users reach for, not buried in a deprecated primitive.

### The one-rule API this produces

**Before:**
- Use `useFocus` for display-only cells.
- Use `useInteractive` for fully interactive components.
- Use `useInteractiveStyled` for interactive components with a responsive border.
- When composing a bordered wrapper around an already-interactive child, use `useFocus` on the wrapper and share the focusId, because calling `useInteractive` would... (three more paragraphs on the shortcut-collision debate)

**After:**
- Call `useInteractive({ id })` on every focus-aware component.
- If it handles its own keyboard, pass `shortcuts` and call `onKey(...)`.
- If it's a display wrapper around another interactive component, don't pass `shortcuts`, don't call `onKey`, and share the `focusId` with the inner component.
- For the "interactive leaf with a responsive border" case, `useInteractiveStyled` is a one-line sugar. Optional.

One hook. One rule. One debugging surface. No "which primitive" decision.

## Scope

### In scope

1. **Inline `useFocus` logic into `useInteractive`.**
   - Copy the body of `packages/core/src/react/focus/use-focus.ts` into `packages/core/src/react/interactive/use-interactive.ts`.
   - Remove the `import { useFocus } from "../focus/use-focus"` line (line 2).
   - The inlined logic owns: context lookup via `useFocusContext()`, id generation via `useId()`, scope resolution via context (or the new `scopeId` override), dispatch of `REGISTER` on mount and `UNREGISTER` on unmount, computation of `isFocused` / `isSelected` / `isAnySelected` from state, and the `focusRef` callback that feeds spatial navigation position data.
   - `useInteractive` keeps its `useKeyboard` and `useShortcuts` sub-hook calls unchanged.
   - No behavior change — the inlined path must be byte-for-byte equivalent to what `useFocus` does today. Existing `useFocus` tests get ported to `useInteractive` tests (see point 6).

2. **Add `scopeId` to `UseInteractiveOptions`.**
   - Type: `scopeId?: string | null` matching `UseFocusOptions`.
   - Semantics: `undefined` → use the enclosing `FocusScope` from context (the existing default). `null` → opt out of any enclosing scope, route to the root scope. A concrete string → override with that specific scope id. This matches `useFocus`'s current behavior exactly.
   - Pipe through to the inlined registration logic.

3. **Delete `packages/core/src/react/focus/use-focus.ts`.** And its test file `packages/core/src/react/focus/use-focus.test.tsx`. Tests move to `packages/core/src/react/interactive/use-interactive.test.tsx` (see point 6).

4. **Remove `useFocus` exports from every public and internal barrel.**
   - `packages/utils/src/index.ts` lines 66-79 — drop the `useFocus` / `UseFocusOptions` / `UseFocusReturn` entries, keep the rest of the Focus system block (`FocusProvider`, `FocusScope`, `useFocusContext`, `useFocusScopeId`, `useShortcuts`, `useFocusedShortcuts`, and their types — they're still consumer-facing).
   - `packages/utils/src/index.d.ts` — mirror.
   - `packages/core/src/react/focus/index.ts` — drop the `useFocus` re-export. `useInteractive` no longer imports from here.
   - Grep check: `rg "from .*use-focus" packages/` must return zero hits after the ticket lands.

5. **Merge type aliases.**
   - `UseFocusOptions` → delete the standalone type. Its fields are now part of `UseInteractiveOptions`.
   - `UseFocusReturn` → delete. `UseInteractiveReturn` is the replacement (it already contains everything `UseFocusReturn` did plus `onKey`).
   - Any code that imported these types from `@gridland/utils` gets migrated to `UseInteractiveOptions` / `UseInteractiveReturn`.

6. **Port tests.**
   - `packages/core/src/react/focus/use-focus.test.tsx` — move every test case into `packages/core/src/react/interactive/use-interactive.test.tsx` under a "registration" describe block. Rename the test file path, not the assertions. Every test that exercised registration, dispatch, unregister-on-unmount, scope resolution, or spatial-position tracking must survive the move.
   - `packages/core/src/react/focus/selection.test.tsx`, `focus-scope.test.tsx`, `use-shortcuts.test.tsx`, `focus-reducer.test.ts` — these test the reducer / context layer, NOT `useFocus` specifically. They stay. Any that happen to call `useFocus` directly for setup purposes get migrated to `useInteractive({ id })` at the setup site.
   - **New regression test:** add an `empty-array-no-op` test to `packages/core/src/react/focus/use-shortcuts.test.tsx` pinning the load-bearing guard. Assertion: `useShortcuts([], focusId)` does **not** dispatch `SET_SHORTCUTS` and does **not** clear a prior non-empty registration under the same focusId. Findable name so any future refactor of `use-shortcuts.ts` sees the fence and stops.

7. **Internal call-site migration.** Every in-repo consumer of `useFocus` gets migrated to `useInteractive`. Per-site judgment required — see the classification rule in Architecture Context. PR description must include an annotated grep output: one line per hit, marked `[migrate]` or `[delete]` with a short reason.

8. **Docs migration.**
   - `packages/docs/content/docs/interaction/focus.mdx` — rewrite so that `useInteractive` is the single public hook taught on the page. The current "Low-level APIs" section (which promotes `useFocus`, `FocusProvider`, `useKeyboard`, etc. as co-equal primitives) gets restructured: `useInteractive` first and prominent, then `FocusProvider` / `FocusScope` as structural context (still important), then `useShortcuts` / `useKeyboard` / `useFocusedShortcuts` as power-user escape hatches in a collapsed "Advanced" section. Every code example that imports `useFocus` gets rewritten to `useInteractive`.
   - `packages/docs/content/docs/hooks/use-keyboard.mdx` — audit every code example. If any imports `useFocus`, rewrite to `useInteractive`.
   - `packages/docs/content/docs/interaction/pointer-events.mdx` — the "Hover-Steals-Focus Pattern" section on the page uses `useFocus` in its example. Rewrite to `useInteractive`.
   - Any other `.mdx` file surfaced by `rg "useFocus" packages/docs/content` — audit.

9. **Rule update.** Revise `.claude/rules/focus-system.md`:
   - Collapse the "Core API" section to list `useInteractive` as the primary hook with `FocusProvider`, `FocusScope`, `useShortcuts`, `useKeyboard`, `useCapturedKeyboard` as structural/advanced primitives.
   - Update the "Correct Patterns" section to show `useInteractive({ id })` as the default, including the wrapper-shares-focusId pattern as an explicit example.
   - Add an anti-pattern: "Importing `useFocus` from `@gridland/utils`" (deleted from the public API).
   - The 4-state affordance table and the `useFocusBorderStyle` / `useFocusDividerStyle` section stay exactly as-is — unchanged by this ticket.

10. **README update.** `packages/utils/README.md` surfaces `useFocus` — audit and rewrite any example or export list.

11. **Semver + CHANGELOG:**
    - `@gridland/utils` — **minor bump pre-1.0, major bump post-1.0.** This is a removed public export. Every downstream consumer importing `useFocus` directly from `@gridland/utils` breaks. CHANGELOG entry must include a one-line migration: "Replace `useFocus({ ... })` with `useInteractive({ ... })`. All returned properties are identical; `useInteractive` additionally returns `onKey`, which you can ignore."
    - `@gridland/ui` — **patch bump** if any `packages/ui/components/*/` source file was migrated (call-site changes only — no API surface change).
    - `@gridland/demo` — **patch bump** if any `packages/demo/demos/*` was migrated.
    - `@gridland/web`, `@gridland/bun`, `@gridland/testing` — audit before committing to no bump. If any re-export `useFocus`, they bump too.

### Out of scope

- **Modifying `useShortcuts`.** The `length > 0` guard at `use-shortcuts.ts:21` is load-bearing for this ticket's correctness. Don't touch it, don't refactor it, don't "improve" it here. Any change to `useShortcuts` is a separate ticket that must demonstrate it preserves the guard or rewrites this ticket's call-site assumptions.
- **Modifying `useKeyboard` to be conditionally skippable.** Rules of Hooks forbid conditional hook calls. The wasted null-handler subscription from `useInteractive` in pure observer mode is harmless (measured zero overhead). Don't try to optimize it; don't introduce a `skipKeyboard` option. Both paths undo the "one hook to learn" goal.
- **Collapsing `useInteractiveStyled` into `useInteractive`.** It can't move to `@gridland/utils` because `useTheme()` lives in `@gridland/ui`. It stays exactly where it is, unchanged. The docs note it as "optional sugar for the bordered-leaf case, not a separate concept."
- **Removing `FocusProvider` / `FocusScope` from the public API.** These are structural context providers, not hooks. They have no collapse target. Keep them exported, keep them documented.
- **Deprecating `useShortcuts` / `useKeyboard` / `useFocusedShortcuts` from the public API.** These remain exported. The docs should teach `useInteractive` as the default but keep these as escape hatches for advanced cases (global keyboard listeners, custom shortcut reducers, status bar integration). A future ticket may revisit whether they should become internal-only.
- **Migrating `packages/create-gridland/templates/` starter files.** The starter gets a follow-up ticket once this one merges. The starter is currently minimal and does not use the focus system directly, but confirm before closing the ticket.
- **Runtime change to how focus registration works.** This ticket is a rename-plus-inline. The behavior of `useInteractive({ id })` after the ticket must be observably identical to `useFocus({ id })` before the ticket for every input combination. Any functional delta is a bug.
- **Adding new options beyond `scopeId`.** Don't use this ticket as a hook-design vehicle. If there's a missing option, propose it in a separate ticket.

## Success Criteria

1. `packages/core/src/react/focus/use-focus.ts` is deleted.
2. `packages/core/src/react/focus/use-focus.test.tsx` is deleted. Every test case it contained has an equivalent in `packages/core/src/react/interactive/use-interactive.test.tsx` under a "registration" describe block.
3. `packages/core/src/react/interactive/use-interactive.ts` contains the inlined registration logic. It does **not** import from `../focus/use-focus`. `UseInteractiveOptions` includes `scopeId?: string | null` with the documented semantics.
4. `packages/utils/src/index.ts` and `index.d.ts` no longer export `useFocus`, `UseFocusOptions`, or `UseFocusReturn`.
5. `packages/core/src/react/focus/index.ts` no longer re-exports `useFocus`.
6. Every in-repo call site of `useFocus` (29 files as of 2026-04-15) has been migrated per the classification rule, with annotations in the PR description.
7. `packages/core/src/react/focus/use-shortcuts.test.tsx` contains the `empty-array-no-op` regression test. Grep-able name.
8. `packages/docs/content/docs/interaction/focus.mdx` teaches `useInteractive` as the single public hook. Zero `useFocus` imports in code examples.
9. `packages/docs/content/docs/hooks/use-keyboard.mdx` and `packages/docs/content/docs/interaction/pointer-events.mdx` have zero `useFocus` imports in code examples.
10. `.claude/rules/focus-system.md` is updated — `useInteractive` is the primary hook, `useFocus` is listed as a deleted anti-pattern.
11. `packages/utils/README.md` is updated.
12. `bun run --cwd packages/core test` passes.
13. `bun run --cwd packages/ui test` passes.
14. `bun run --cwd packages/demo test` passes.
15. `bun run --cwd packages/docs build` passes clean.
16. `/review-full` produces zero surprise contract-guardian findings. Semver bump matches the removed public exports.
17. **End-to-end manual check:** start the docs dev server, open `/docs/interaction/focus`, verify the "Focus with Multi-Select" demo still navigates (Tab between panels, Enter to select, arrows inside, Esc out, StatusBar updates), verify the "Spatial Navigation" demo still navigates. Open `/docs/components/multi-select` and verify the standalone MultiSelect demo still works.
18. Grep hygiene:
    ```
    rg "useFocus\b" packages/
    ```
    Expected hits: only inside `packages/core/src/react/focus/focus-scope.tsx` (internal plumbing, if any — classify per rule) and nowhere in `packages/demo/`, `packages/ui/components/`, `packages/docs/content/`, `packages/utils/`.

## Architecture Context

### The load-bearing invariant

`packages/core/src/react/focus/use-shortcuts.ts:17-24`:

```ts
useEffect(() => {
  if (key === prevKey.current) return
  prevKey.current = key

  if (shortcuts.length > 0) {
    dispatch({ type: "SET_SHORTCUTS", focusId, shortcuts })
  }
}, [focusId, key])
```

The `length > 0` guard is what makes `useInteractive({ id })` safe in pure observer mode. Without it, the observer case would dispatch `SET_SHORTCUTS` with an empty array and overwrite any other caller's shortcuts for the same focusId (the "shortcut collision" that earlier discussion feared). With it, the observer call is a no-op at the dispatch level and the shared-focusId wrapper pattern just works.

**This ticket does not modify `useShortcuts`.** It adds a regression test that pins the guard so a future refactor cannot silently break this ticket's assumptions. The test's findable name (`empty-array-no-op`) lets any future maintainer reading `use-shortcuts.ts` find the reason the guard exists by grepping the test suite.

### What's inlined into `useInteractive`

Structurally, the post-ticket `use-interactive.ts` looks like:

```ts
// Before (current): ~90 lines, composes 3 sub-hooks via imports
export function useInteractive(options = {}) {
  const focusState = useFocus({ ... })   // ← external import
  const { focusId, isFocused, isSelected } = focusState
  // ... handlerRef, useKeyboard, useShortcuts, return
}

// After (this ticket): ~150 lines, registration inlined, one file owns the full primitive
export function useInteractive(options = {}) {
  // ── inlined from use-focus.ts ──
  const { dispatch, state } = useFocusContext()
  const scopeFromContext = useFocusScopeId()
  const resolvedScopeId = options.scopeId !== undefined ? options.scopeId : scopeFromContext
  const generatedId = useId()
  const focusId = options.id ?? generatedId
  // ... REGISTER dispatch on mount, UNREGISTER on unmount
  // ... compute isFocused, isSelected, isAnySelected from state
  // ... focusRef callback that measures DOM position for spatial nav

  // ── existing useInteractive logic, unchanged ──
  const handlerRef = useRef(null)
  const onKey = useCallback((handler) => { handlerRef.current = handler }, [])
  useKeyboard((e) => handlerRef.current?.(e), { focusId, selectedOnly: true })

  const resolvedShortcuts = typeof shortcuts === "function"
    ? shortcuts({ isFocused, isSelected })
    : shortcuts ?? []
  useShortcuts(resolvedShortcuts, focusId)

  return { focusRef, focusId, isFocused, isSelected, isAnySelected, focus, blur, select, deselect, onKey }
}
```

The inlining is mechanical. Every line that `useFocus` ran on the caller's behalf now runs directly inside `useInteractive`. No behavior delta.

### Files to modify

| Path | Change |
|---|---|
| `packages/core/src/react/interactive/use-interactive.ts` | Inline `useFocus` logic. Add `scopeId` option. Remove `import { useFocus }`. |
| `packages/core/src/react/focus/use-focus.ts` | **Delete.** |
| `packages/core/src/react/focus/use-focus.test.tsx` | **Delete.** Tests move to `use-interactive.test.tsx`. |
| `packages/core/src/react/interactive/use-interactive.test.tsx` | Add all registration test cases ported from `use-focus.test.tsx`. |
| `packages/core/src/react/focus/index.ts` | Remove `useFocus` / type re-exports. |
| `packages/core/src/react/focus/use-shortcuts.test.tsx` | Add the `empty-array-no-op` regression test. |
| `packages/utils/src/index.ts` | Remove `useFocus` / `UseFocusOptions` / `UseFocusReturn` exports (lines 66-79 block). |
| `packages/utils/src/index.d.ts` | Mirror. |
| `packages/utils/README.md` | Audit and rewrite. |
| `packages/docs/content/docs/interaction/focus.mdx` | Rewrite. `useInteractive` is the single public hook. |
| `packages/docs/content/docs/interaction/pointer-events.mdx` | Migrate the "Hover-Steals-Focus Pattern" example. |
| `packages/docs/content/docs/hooks/use-keyboard.mdx` | Audit code examples. |
| `.claude/rules/focus-system.md` | Collapse three-hook section. Update Correct Patterns. Add anti-pattern. |
| Call sites (see next section) | Migrate per classification rule. |

### Call-site classification rule

For every hit in `rg -l "useFocus\b" packages/`:

**[migrate] — rewrite to `useInteractive`:**
- Files under `packages/ui/components/*/` that use `useFocus` directly. These are always either interactive components (should own keyboard via `useInteractive({ id, shortcuts: [...] })`) or bordered-wrapper patterns (should use `useInteractive({ id })` in observer mode, sharing the focusId with an inner component).
- Files under `packages/demo/demos/*.tsx` that use `useFocus` in app demos (not unit tests).
- Files under `packages/docs/components/demos/*.tsx`.
- Any other consumer-facing code.

**[delete] — remove the `useFocus` reference entirely:**
- Files in `packages/core/src/react/focus/*.test.tsx` that imported `useFocus` only to test it as a primitive. The test cases themselves get ported to `use-interactive.test.tsx`; the import gets deleted along with the file.
- `packages/core/src/react/focus/use-focus.ts` itself.

**[judgment] — audit per file, document in PR:**
- `packages/core/src/react/focus/focus-scope.tsx` — may import `useFocus` for internal plumbing. If so, either inline into `focus-scope.tsx` or migrate to the equivalent internal primitive. Do not leave a dangling import after `use-focus.ts` is deleted.
- `packages/core/src/react/hooks/use-keyboard.ts` — the barrel may re-export types related to focus. Audit.
- `packages/core/src/react/focus/selection.test.tsx`, `use-shortcuts.test.tsx` — these test the reducer, not `useFocus`. Any `useFocus` imports here are setup-only and should migrate to `useInteractive({ id })` at the setup site.
- `packages/utils/src/focus-border.ts` — if it references `useFocus` types only, delete the references and use `UseInteractiveReturn` instead.

### Known call sites as of 2026-04-15

From `rg -l "useFocus\b" packages/`, 29 files:

**[migrate] — consumer code:**
- `packages/demo/demos/focus.tsx` — `FocusMultiSelectPanel` wrapper. The proof case. Rewrite to `useInteractive({ id })`.
- `packages/demo/demos/focus-grid.tsx` — `GridCell`. Rewrite to `useInteractive({ id, shortcuts: [...] })` (also replaces its manual `useShortcuts` call).
- `packages/demo/demos/focus-chat.tsx`
- `packages/demo/demos/ai-chat-interface.tsx`
- `packages/ui/components/tab-bar/tab-bar.tsx`
- `packages/ui/components/side-nav/side-nav.tsx`
- `packages/ui/components/prompt-input/prompt-input.tsx`
- `packages/ui/components/spinner/spinner-showcase.tsx`
- `packages/ui/components/link/link-demo.tsx`
- `packages/docs/content/docs/interaction/focus.mdx`
- `packages/docs/content/docs/interaction/pointer-events.mdx`
- `packages/docs/content/docs/hooks/use-keyboard.mdx`

**[delete] — internals:**
- `packages/core/src/react/focus/use-focus.ts` (the file)
- `packages/core/src/react/focus/use-focus.test.tsx`
- `packages/core/src/react/focus/index.ts` (the `useFocus` re-export lines only)
- `packages/utils/src/index.ts` (the export block lines 66-79, `useFocus` portion only)
- `packages/utils/src/index.d.ts` (mirror)

**[judgment] — audit:**
- `packages/core/src/react/focus/focus-scope.tsx`
- `packages/core/src/react/focus/selection.test.tsx`
- `packages/core/src/react/focus/use-shortcuts.test.tsx`
- `packages/core/src/react/hooks/use-keyboard.test.tsx`
- `packages/core/src/react/hooks/use-keyboard.ts`
- `packages/ui/components/tab-bar/tab-bar.behavioral.test.tsx`
- `packages/ui/components/modal/modal.behavioral.test.tsx`
- `packages/ui/components/provider/provider.behavioral.test.tsx`
- `packages/core/src/react/interactive/use-interactive.ts` (deletes the internal import; the file remains)
- `packages/core/src/react/interactive/use-interactive.test.tsx` (receives the ported registration tests)
- `packages/utils/src/focus-border.ts`
- `packages/utils/README.md`

## Verification

1. **Unit tests.**
   ```
   bun run --cwd packages/core test
   bun run --cwd packages/ui test
   bun run --cwd packages/demo test
   ```
   All passing. The new `empty-array-no-op` regression test and the ported registration tests appear in the output.

2. **Docs build.**
   ```
   bun run --cwd packages/docs build
   ```
   No broken imports, no missing exports.

3. **Snapshot regression.** If any component under `packages/ui/components/` was migrated, its snapshot test output must match pre-migration. The migration is a rename-plus-inline with no behavior change, so every snapshot should be byte-identical.

4. **Docs dev end-to-end walkthrough.**
   ```
   bun run --cwd packages/docs dev
   ```
   Open each URL and verify interactively:
   - `/docs/interaction/focus` — "Focus with Multi-Select" demo navigates (Tab between panels, Enter to select, arrows inside, Esc out, StatusBar updates). "Spatial Navigation" demo navigates. The MDX teaches `useInteractive` as the single hook.
   - `/docs/interaction/pointer-events` — "Hover-Steals-Focus Pattern" example uses `useInteractive`.
   - `/docs/components/multi-select` — standalone demo works.
   - `/docs/components/tab-bar`, `/docs/components/side-nav`, `/docs/components/prompt-input` — every component that was touched renders and navigates correctly.

5. **Grep hygiene.**
   ```
   rg "useFocus\b" packages/
   ```
   Expected: zero hits in `packages/demo/`, `packages/ui/components/`, `packages/docs/content/`, `packages/utils/`. Core package should have at most the `focus-scope.tsx` and reducer-test setup references if any survive the [judgment] audit.

6. **Full review pass.**
   ```
   /review-full
   ```
   contract-guardian confirms the semver bump matches the removed public exports. framework-compliance reports no regressions in focus pattern usage. docs-mirror confirms every code example in `interaction/focus.mdx`, `interaction/pointer-events.mdx`, and `hooks/use-keyboard.mdx` uses `useInteractive` and imports resolve. dependency-auditor confirms no external API usage drift.

7. **Release check.**
   ```
   /release-check
   ```
   Runs before publishing the `@gridland/utils` minor bump.

## Background

Surfaced on 2026-04-15 during the `interaction` docs reorg. The `FocusMultiSelectPanel` demo wrapper was broken by an earlier refactor that moved `MultiSelect` onto `useInteractive`; the fix was to restore the outer wrapper and share `focusId` with the inner component. Explaining the fix to the user required three consecutive turns of API-layering discussion, at the end of which the user said "I feel like this could be confusing to users" — correctly.

The first draft of this ticket (deleted) proposed Option 1: deprecate `useFocus` from the public API but keep it as an internal primitive that `useInteractive` consumes. The user pushed back: if we can rewrite from scratch, why keep the dead primitive? And they flagged that the prior-session "`scopeId` is rarely used" claim was false at application scale. Both points landed. This ticket is the Option 2 version: delete `useFocus` entirely, inline its logic into `useInteractive`, promote `scopeId` to first-class. The spec above is written against a clean-slate API design, not against the smallest possible diff.

The key insight that unblocks Option 2 as safe (and has unblocked both drafts) is the length-guard at `packages/core/src/react/focus/use-shortcuts.ts:21`. It makes `useInteractive({ id })` in observer mode a no-op at the dispatch level, which is what allows the "shared-focusId display wrapper" pattern to work. The regression test added in scope pins this guard so no future refactor can silently break it.
