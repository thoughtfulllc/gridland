# useInteractive refactor — Phase 2 hand-off

Status: **Phases 0, 1, 2 complete.** Pilot (SelectInput) fully migrated.
Phases 3–6 remain.

Branch: `update-focus-and-navigation`.
This document is uncommitted — it's meant to bootstrap the follow-up session.

## What the pilot validated

1. **useInteractive composes cleanly.** The four subsystems (useFocus,
   useKeyboard, useShortcuts, useFocusBorderStyle) plug together without
   fighting each other. One hook, one call site, one return object per
   interactive component.

2. **Ref-swap onKey works.** A component passes a fresh closure each
   render via `interactive.onKey(handler)`; the underlying listener is
   registered once per mount and just replaces a handlerRef. Mirrors the
   useCapturedKeyboard pattern. Verified with the "last call wins" test
   and the "old handler doesn't fire after unmount" test.

3. **shortcut function signature.** `shortcuts: ({ isFocused, isSelected }) => ShortcutEntry[]`
   works — the hook re-evaluates the function on every render, and
   different hint sets surface through useFocusedShortcuts as the state
   changes. SelectInput uses this to swap between "navigate/select"
   hints (focused) and "move/submit/back" hints (selected).

4. **Per-component characterization discipline is the right call.**
   Writing characterization tests upfront for every component would
   have consumed the session's budget before the first line of
   useInteractive shipped. Folding them into each migration's red
   commit preserves the TDD ratchet without the front-load.

## What the pilot changed about the plan

### 1. useInteractive lives in @gridland/ui, not @gridland/core

The original spec said "exported from @gridland/utils" but *also* said
"composes... the focus-border logic from useFocusBorderStyle". These
are mutually exclusive — useFocusBorderStyle lives in @gridland/ui
because it calls useTheme, and @gridland/utils cannot depend on
@gridland/ui (circular dependency; see design-decisions.md).

Resolution: `packages/ui/hooks/use-interactive.ts`, exported from
`@gridland/ui` via the components barrel and from the registry-local
alias `@/registry/gridland/hooks/use-interactive` for intra-package use.

Registry type: `registry:hook` (same channel as useBreakpoints).
Build-registry ITEMS entry: **not yet added** — that's Phase 5 work.

### 2. borderStyle return type corrected

The spec draft listed `borderStyle: "single" | "rounded" | "heavy" | "double"`.
Those are OpenTUI's border-style values, not the four-state affordance
values. The actual return type — matching `getFocusBorderStyle` in
@gridland/utils — is `"rounded" | "dashed"`. Tests lock this in.

### 3. disabled option was missing from the spec

The spec enumerated id, autoFocus, selectable, tabIndex, shortcuts but
not disabled. Every interactive component has a disabled prop that
should remove the component from the tab cycle. Added as a red/green
micro-cycle (commits `3841b24` + `c5a4b41`) mid-Phase-2 when SelectInput
needed it.

### 4. SelectInput has no border in its rendering

The 4-state border affordance pattern is documented as mandatory for
interactive components, but SelectInput doesn't render a border — it
uses cursor characters and foreground colors for affordance. The pilot
migration kept visual parity: useInteractive gives us
borderColor/borderStyle but SelectInput simply doesn't consume them.
The hook is composable — components take what they need.

Phase 3 components that DO use borders (Modal, PromptInput divider,
etc.) will actually consume borderColor/borderStyle from useInteractive.

### 5. Test harness flushSync quirk

`renderTui`'s `flush()` calls `_flushSync(() => {})` with an empty
callback. React state updates queued from **inside a keyHandler
listener** (not inside a React event handler) don't reliably commit
on an empty-callback flushSync. `rerender(sameTree)` does force a
commit because it calls `root.render` inside flushSync.

Workaround used in the pilot: two SelectInput submit-path tests
(`renders submitted state after enter`, `ignores keys after submission`)
use `rerender(tree)` instead of `flush()` after the submitting key.

A proper fix would be to have `flush()` track the last-rendered node
and re-run `root.render(lastNode)` inside flushSync. That's a
testing-package change, deferred. If you hit the same pattern in
Phase 3, reach for `rerender` — don't assume flush is enough after a
state-dispatching keypress.

## Ground rules the pilot set

- **Migration = remove the `useKeyboard` prop entirely, no shim.** The
  replacement is `focusId?: string` + `autoFocus?: boolean` on the
  component's props, and `interactive.onKey(handler)` inside the body.

- **Attach `interactive.focusRef` to the component's root `<box>`.**
  Both render branches if the component conditionally renders a
  different root (SelectInput has a submitted-state branch).

- **Existing mock-keyboard tests get rewritten to real key dispatch**,
  not kept as legacy. Wrap in `<FocusProvider selectable>`, use
  `autoFocus`, dispatch `keys.enter()` to transition to selected,
  then dispatch the actual key under test. Assertions preserved.

- **Shortcut hints as a function, not a static array**, whenever the
  hints differ between focused and selected states. Almost always
  they do — focused hints describe how to enter, selected hints
  describe how to interact.

## Sticky invariants for Phase 4

### SideNav keeps its internal FocusProvider

`packages/ui/components/side-nav/side-nav.tsx` wraps its entire render
in `<FocusProvider selectable>` at line ~176. This is intentional and
must **not** be touched when Phase 4 makes the outer `GridlandProvider`
implicitly wrap in `FocusProvider`.

Why: each FocusProvider creates its own store ref. Nesting is safe —
the inner SideNav store is isolated from whatever the outer GridlandProvider
sets up. This is what lets a page contain a SideNav plus other
focusable UI without cross-talk between their navigation.

If Phase 4 removes SideNav's internal FocusProvider thinking "the
implicit outer one replaces it", you'll discover that the sidebar
items no longer navigate correctly and the panel's FocusScope trap
doesn't work. Don't do it.

### NavItemRow's current useKeyboard + captureKeyboard plumbing is the
deepest legacy pattern and the riskiest migration. Plan extra time.

SideNav's render-prop contract is:
```tsx
children({ activeItem, isInteracting, captureKeyboard })
```

`captureKeyboard` is a callback the panel component calls to register
its keyboard handler with SideNav's own handlerRef. SideNav then
forwards events through that ref when the panel is "selected".

Target shape: panel uses its own useInteractive. SideNav drops
handlerRef and the render-prop's captureKeyboard entirely. Every
caller of `<SideNav>` in demos and docs changes. See the component
migration order below — SideNav is #5, after the simpler components
have validated the pattern.

### Landing-app integration test is still blocked

`packages/demo/src/landing/landing-app.test.tsx` is entirely
`describe.skip` because LandingApp → useBreakpoints → useTerminalDimensions
isn't mockable in the current preload. The plan's Phase 0.5
requirement (landing-app integration test) was deferred.

**Before starting SideNav or TextInput migration**, extend
`packages/web/test/preload.ts` to stub `useTerminalDimensions` so
the landing-app test can run. Those two components are most likely
to need the full-app integration test as their parity oracle.

Don't try to migrate SideNav or TextInput without the preload fix —
you'll have no way to verify the landing-app still navigates correctly.

## Component migration order (unchanged)

Modal → MultiSelect → TabBar / TabsList → PromptInput → SideNav → TextInput

Rationale:
1. **Modal** is nearly trivial. Its useKeyboard handler is one
   Escape-to-close branch. Migrates in ~20 lines.
2. **MultiSelect** is structurally identical to SelectInput but with
   multi-select state. Copy the SelectInput pattern verbatim.
3. **TabBar / TabsList** has simple left/right arrow handling.
4. **PromptInput** is the most intricate — history, suggestions, the
   `<input>` intrinsic, handleKeyAction that routes through both the
   focused `<input>` and useKeyboard. Take your time.
5. **SideNav** is a structural rewrite. Render-prop contract changes.
   Do after the preload fix.
6. **TextInput** is riskiest because it has NO focus system integration
   today. Read the target section of the plan carefully — the
   `focus` prop is deleted, `isSelected` drives whether `<input focused />`
   renders. Write the two-focusable integration test BEFORE migrating.

## Test helpers you'll want to reuse

Copy these verbatim into new test files:

```tsx
// Same pattern used in packages/core/src/react/focus/use-focus.test.tsx
// and packages/ui/hooks/use-interactive.behavioral.test.tsx
function flush2(flush: () => void) {
  flush()
  flush()
}

// Used in SelectInput to transition to selected state
function selectAnd(keys: any, flush: () => void) {
  keys.enter()
  flush(); flush()
}
```

For shortcut-hint assertions, render a sink component alongside the
interactive:

```tsx
function ShortcutSink() {
  const s = useFocusedShortcuts()
  return <text>{`hint:${s.map((e) => e.label).join("+")}:end`}</text>
}
```

And assert against `screen.text()` with a regex that pins the presence
and ordering of expected labels.

## Grep-discipline targets for Phase 4 (current counts at end of Phase 2)

These must all return zero hits at end of Phase 4. Current counts below
help you see your progress.

| Pattern | Current count | Spread across |
|---|---|---|
| `useCapturedKeyboard` | **16 occurrences in 8 files** | core source, utils barrel (.ts + .d.ts), utils README, docs guide + hook page + ai-chat block, demo ai-chat |
| `useKeyboardContext` | **16 occurrences in 9 files** | provider.tsx, provider behavioral test, modal, multi-select, prompt-input, tab-bar, link-demo, spinner-showcase, ui barrel |
| `KeyboardContext` (includes useKeyboardContext) | **20 occurrences in 9 files** | superset of the row above, adds provider.tsx's private `KeyboardContext` created via createContext |
| `useKeyboard\?:\s*\(handler` (the component-prop form) | **7 occurrences in 6 files** | modal, tab-bar, prompt-input, multi-select, link-demo, spinner-showcase. SelectInput cleaned. |
| `useFocusBorderStyle` directly called by a component | check per component | keep until Phase 3 migrations remove them — each component that migrates to useInteractive stops calling it directly. The hook itself lives on for edge cases. |

Note: `link-demo.tsx` and `spinner-showcase.tsx` have component-prop-style
`useKeyboard` too — neither is on the plan's migration list but both
count against the zero-hit target. Include them in Phase 3's sweep.

Don't delete `useFocusBorderStyle` — it's the implementation useInteractive
delegates to. Only delete the legacy keyboard names.

## Pre-existing bugs flagged (don't fix in this refactor)

1. **Gradient `line.split("")` at `packages/ui/components/gradient/gradient.tsx:94`.**
   Splits on UTF-16 code units, which breaks emoji/surrogate pairs. Not
   fixed on current main. Single-commit fix-with-test, its own PR.

2. **Landing-app `describe.skip`** at
   `packages/demo/src/landing/landing-app.test.tsx`. The comment documents
   the block (`useTerminalDimensions` not mocked in preload). Separate
   task: extend `packages/web/test/preload.ts` to stub it, then fill
   in the tests.

3. **Stale create-gridland SelectInput callers** at
   `packages/create-gridland/src/app.tsx` and
   `packages/create-gridland/src/components/confirm.tsx`. Both pass
   props (`initialIndex`, `onSelect`, `focus`) that don't exist on the
   current SelectInput interface. The `// @ts-nocheck` header lets
   them compile. Pre-dates this refactor. Flag in the migration PR
   but fix separately.

## Commit history (Phase 0 → Phase 2)

```
e5aa3f0 feat(ui): export useInteractive from the @gridland/ui barrel
34bb562 refactor(select-input): migrate to useInteractive (GREEN)
c5a4b41 feat(ui): pipe disabled through useInteractive to useFocus (GREEN)
3841b24 test(ui): spec useInteractive disabled option (RED)
eba02de test(select-input): spec focusId migration (RED)
ae9a331 refactor(ui): spread useFocus return instead of enumerating fields
795ddeb feat(ui): implement useInteractive (GREEN)
33037f3 test(ui): spec useInteractive primitive (RED)
```

The red/green/refactor alternation is visible directly in the history.

## Running the refactored system end-to-end

- **Unit + behavioral tests:** `bun run test` (full monorepo). All green.
- **SelectInput pilot demo, terminal:**
  `bun run demo -- select-input` (wraps in FocusProvider selectable,
  autoFocus, Tab/Enter/arrow navigation all via the focus system).
- **SelectInput pilot demo, docs:** `bun run --cwd packages/docs dev`
  then open `http://localhost:3000/docs/components/select-input`.
  The docs still reference the old `useKeyboard` prop — Phase 5 work.
  The rendered demo is the migrated version.
