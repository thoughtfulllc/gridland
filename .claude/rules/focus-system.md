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

**`getFocusBorderStyle({ isFocused, isSelected, isAnySelected })`** — Returns `{ borderColor, borderStyle }` for `<box border>` components. Encapsulates the 4-state visual affordance pattern.

**`getFocusDividerStyle({ isFocused, isSelected, isAnySelected })`** — Returns `{ dividerColor, dividerDashed }` for PromptInput-style dividers. Returns `undefined` (not `"transparent"`) when a sibling is selected, so the component's built-in design divider shows through.

**`FOCUS_BORDER_COLORS`** — Default colors: `{ selected: "#818cf8", focused: "#6366f1", idle: "#3b3466" }`. Pass custom colors as the second argument to either function to override.

## Focus Border Affordance (4-State Pattern)

Every selectable component must show visual affordance via borders or dividers. The utilities enforce this pattern automatically:

| # | State | Condition | Border | Divider |
|---|-------|-----------|--------|---------|
| 1 | Selected | `isSelected` | bright, rounded | bright, solid |
| 2 | Sibling selected | `isAnySelected` | transparent (hidden) | `undefined` (design border shows) |
| 3 | Focused | `isFocused` | bright, dashed | bright, dashed |
| 4 | Idle | none | dimmed, rounded | dimmed, solid |

```tsx
// Border affordance for <box border> components
const { isFocused, isSelected, isAnySelected, focusRef } = useFocus({ id })
const { borderColor, borderStyle } = getFocusBorderStyle({ isFocused, isSelected, isAnySelected })
return <box ref={focusRef} border borderStyle={borderStyle} borderColor={borderColor}>...</box>

// Divider affordance for PromptInput-style components
const { dividerColor, dividerDashed } = getFocusDividerStyle({ isFocused, isSelected, isAnySelected })
return <PromptInput dividerColor={dividerColor} dividerDashed={dividerDashed} showDividers />
```

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
5. Use `getFocusBorderStyle` or `getFocusDividerStyle` for visual affordance — never write manual border ternaries

## Anti-Patterns

- `tabIndex: disabled ? -1 : 0` alongside `disabled` in `useFocus` — redundant, `disabled` alone is sufficient
- Re-implementing `getNavigableEntries` or `getTopScope` instead of importing from `focus-reducer`
- Interactive component that doesn't call `useFocus` and attach `focusRef`
- Forgetting that `useFocus` inside a `FocusScope` auto-binds to that scope (pass `scopeId={null}` if global scope needed)
- Manual `borderColor`/`borderStyle` ternaries based on `isFocused`/`isSelected` — use `getFocusBorderStyle` or `getFocusDividerStyle` instead
- Hardcoded `"#818cf8"`, `"#6366f1"`, `"#3b3466"` in border/divider logic — use the utility functions which include these as defaults
- Using `"transparent"` as the idle border color — idle state must show a dimmed border for affordance
