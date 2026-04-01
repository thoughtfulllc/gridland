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

**`FocusProvider`** — Root wrapper. `selectable` prop enables Enter/Esc lifecycle globally.

**`FocusScope`** — Manages focus within a region.
Props: `trap`, `selectable`, `autoFocus`, `autoSelect`, `restoreOnUnmount`

**`useFocus`** — Registers a focusable element.
Options: `id`, `tabIndex`, `autoFocus`, `disabled`, `scopeId`, `selectable`
Returns: `isFocused`, `isSelected`, `isAnySelected`, `focusId`, `focusRef`, `focus`, `blur`, `select`, `deselect`

**`useShortcuts(shortcuts, focusId)`** — Registers keyboard shortcut hints shown in StatusBar.

**`useFocusedShortcuts()`** — Returns active shortcuts for the focused element (pass to StatusBar).

**`useCapturedKeyboard(focusId)`** — Returns a keyboard hook scoped to when this element is selected.

## Correct Patterns

```tsx
// disabled alone excludes from navigation — tabIndex redundancy not needed
useFocus({ id, disabled })

// FocusScope with selectable for Enter/Esc interaction regions
<FocusScope trap selectable autoFocus autoSelect>
  {children}
</FocusScope>
```

## Every New Interactive Component Must

1. Call `useFocus` to register with the focus system
2. Attach `focusRef` to its root `<box>` for spatial navigation
3. Wrap nested interactive content in `FocusScope` with `selectable`
4. Register shortcuts via `useShortcuts`

## Anti-Patterns

- `tabIndex: disabled ? -1 : 0` alongside `disabled` in `useFocus` — redundant, `disabled` alone is sufficient
- Re-implementing `getNavigableEntries` or `getTopScope` instead of importing from `focus-reducer`
- Interactive component that doesn't call `useFocus` and attach `focusRef`
- Forgetting that `useFocus` inside a `FocusScope` auto-binds to that scope (pass `scopeId={null}` if global scope needed)
