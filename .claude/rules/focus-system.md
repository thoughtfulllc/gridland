---
paths:
  - "packages/ui/components/**"
  - "packages/utils/src/**"
  - "packages/core/src/react/focus/**"
  - "packages/demo/**"
  - "packages/docs/components/demos/**"
---

# Focus System

The focus system drives all keyboard navigation. Every interactive component must integrate with it.

## Core API (all from `@gridland/utils`)

**`useInteractive`** — The single public hook for focus-aware components. Composes focus registration, selection-scoped keyboard routing, and shortcut registration in one call.
Options: `id`, `autoFocus`, `disabled`, `selectable`, `tabIndex`, `scopeId`, `shortcuts`
Returns: `isFocused`, `isSelected`, `isAnySelected`, `focusId`, `focusRef`, `onKey`, `focus`, `blur`, `select`, `deselect`
- `isAnySelected` is scope-aware for global-scope components: it returns true when a selection is saved behind a `FocusScope` (via `PUSH_SCOPE`), so sibling borders correctly hide even when `selectedId` is cleared inside the scope
- `onKey(handler)` uses a ref swap — call it every render with a fresh closure; the handler fires only while the component is selected
- `shortcuts` accepts either a static array or a function `({ isFocused, isSelected }) => ShortcutEntry[]` that is re-evaluated on every render

**`FocusProvider`** — Structural root wrapper. `selectable` prop enables Enter/Esc lifecycle globally.

**`FocusScope`** — Structural region wrapper that manages focus within a subtree.
Props: `trap`, `selectable`, `autoFocus`, `autoSelect`, `restoreOnUnmount`

### Advanced primitives (power-user escape hatches)

Reach for these only when `useInteractive` does not fit your case (global keyboard listeners, status bar integration, custom shortcut reducers).

**`useShortcuts(shortcuts, focusId)`** — Registers keyboard shortcut hints shown in StatusBar. Prefer `useInteractive({ shortcuts })` which calls this internally.

**`useFocusedShortcuts()`** — Returns active shortcuts for the focused element (pass to StatusBar).

**`useKeyboard(handler, { focusId, global, selectedOnly })`** — Raw keyboard subscription. Prefer `useInteractive({ ... }).onKey(handler)` when routing to a selected component.

## Focus Style Hooks (from `@gridland/ui`)

**`useFocusBorderStyle({ isFocused, isSelected, isAnySelected })`** — Returns `{ borderColor, borderStyle }` for `<box border>` components. Reads colors from `theme.focusSelected`/`focusFocused`/`focusIdle` via `useTheme()`.

**`useFocusDividerStyle({ isFocused, isSelected, isAnySelected })`** — Returns `{ dividerColor, dividerDashed }` for PromptInput-style dividers. Reads colors from `theme.focusSelected`/`focusFocused`/`focusIdle` via `useTheme()`.

These hooks live in `@gridland/ui` (not `@gridland/utils`) because they depend on `useTheme()`. They delegate to the lower-level plain functions `getFocusBorderStyle`/`getFocusDividerStyle` from `@gridland/utils`.

**`theme.focusSelected`**, **`theme.focusFocused`**, **`theme.focusIdle`** — Focus colors defined on the Theme. Set once in `ThemeProvider`, consumed automatically by the hooks above.

**`FOCUS_BORDER_COLORS`** — Legacy default constant in `@gridland/utils`. Still available for edge cases where `useTheme()` is not accessible. Prefer the hooks.

## Focus Border Affordance (4-State Pattern)

Every selectable component must show visual affordance via borders or dividers. The utilities enforce this pattern automatically:

| # | State | Condition | Border | Divider |
|---|-------|-----------|--------|---------|
| 1 | Selected | `isSelected` | bright, rounded | bright, solid |
| 2 | Sibling selected | `isAnySelected` (scope-aware) | transparent (hidden) | `undefined` (design border shows) |
| 3 | Focused | `isFocused` | bright, dashed | bright, dashed |
| 4 | Idle | none | dimmed, rounded | dimmed, solid |

```tsx
// Border affordance for <box border> components
const { isFocused, isSelected, isAnySelected, focusRef } = useInteractive({ id })
const { borderColor, borderStyle } = useFocusBorderStyle({ isFocused, isSelected, isAnySelected })
return <box ref={focusRef} border borderStyle={borderStyle} borderColor={borderColor}>...</box>

// Divider affordance for PromptInput-style components
const { dividerColor, dividerDashed } = useFocusDividerStyle({ isFocused, isSelected, isAnySelected })
return <PromptInput dividerColor={dividerColor} dividerDashed={dividerDashed} showDividers />
```

## Correct Patterns

```tsx
// Default: call useInteractive({ id }) on every focus-aware component.
const interactive = useInteractive({
  id,
  shortcuts: [{ key: "enter", label: "Submit" }],
})
interactive.onKey((e) => {
  if (e.name === "return") submit()
})

// disabled alone excludes from navigation — tabIndex redundancy not needed
useInteractive({ id, disabled })

// Display-only wrapper around an already-interactive child: share the focusId,
// don't pass `shortcuts`, and don't call `onKey`. The inner child owns the
// keyboard and shortcut registration; the outer wrapper is a pure observer.
function BorderedWrapper({ id, children }) {
  const { isFocused, isSelected, isAnySelected, focusRef } = useInteractive({ id })
  const { borderColor, borderStyle } = useFocusBorderStyle({ isFocused, isSelected, isAnySelected })
  return (
    <box ref={focusRef} border borderStyle={borderStyle} borderColor={borderColor}>
      {children /* inner component uses useInteractive({ id }) with the same id */}
    </box>
  )
}

// FocusScope with selectable for Enter/Esc interaction regions
<FocusScope trap selectable autoFocus autoSelect>
  {children}
</FocusScope>
```

## Every New Interactive Component Must

1. Call `useInteractive` to register with the focus system
2. Attach `focusRef` to its root `<box>` for spatial navigation
3. Wrap nested interactive content in `FocusScope` with `selectable`
4. Pass `shortcuts` to `useInteractive` (don't reach for `useShortcuts` directly)
5. Use `useFocusBorderStyle` or `useFocusDividerStyle` for visual affordance — never write manual border ternaries or hardcode focus colors

## Anti-Patterns

- **Importing `useFocus` from `@gridland/utils`** — it has been deleted from the public API. Use `useInteractive` instead. Every property that `useFocus` returned (`isFocused`, `isSelected`, `isAnySelected`, `focusId`, `focusRef`, `focus`, `blur`, `select`, `deselect`) is returned by `useInteractive` with identical semantics, plus `onKey`.
- `tabIndex: disabled ? -1 : 0` alongside `disabled` in `useInteractive` — redundant, `disabled` alone is sufficient
- Re-implementing `getNavigableEntries` or `getTopScope` instead of importing from `focus-reducer`
- Interactive component that doesn't call `useInteractive` and attach `focusRef`
- Forgetting that `useInteractive` inside a `FocusScope` auto-binds to that scope (pass `scopeId={null}` if global scope needed)
- Manual `borderColor`/`borderStyle` ternaries based on `isFocused`/`isSelected` — use `useFocusBorderStyle` or `useFocusDividerStyle` instead
- Hardcoded focus color hex values in border/divider logic — use the hooks which read from `theme.focusSelected`/`focusFocused`/`focusIdle`
- Using `"transparent"` as the idle border color — idle state must show a dimmed border for affordance
- Importing `getFocusBorderStyle`/`getFocusDividerStyle` from `@gridland/utils` in components that have access to `@gridland/ui` — prefer the theme-aware hooks
