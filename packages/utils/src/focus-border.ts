/** Colors used for focus border affordance. */
export interface FocusBorderColors {
  /** Border color when the component is selected (entered for interaction). @default "#FF71CE" */
  selected: string
  /** Border color when the component has keyboard focus. @default "#e065b8" */
  focused: string
  /** Dimmed border color when idle — visual hint that the component is selectable. @default "#33192a" */
  idle: string
}

/** Default focus border colors — matches darkTheme.focusSelected/focusFocused/focusIdle. */
export const FOCUS_BORDER_COLORS: FocusBorderColors = {
  selected: "#FF71CE",
  focused: "#e065b8",
  idle: "#33192a",
}

export interface FocusBorderState {
  isFocused: boolean
  isSelected: boolean
  isAnySelected: boolean
}

export interface FocusBorderResult {
  borderColor: string
  borderStyle: "rounded" | "dashed"
}

/**
 * Computes border color and style from focus state for `<box border>` components.
 *
 * Four states, highest priority first:
 * 1. **Selected** — bright border, rounded (component is being interacted with)
 * 2. **Sibling selected** — transparent border (reduce noise while sibling is active).
 *    `isAnySelected` from `useInteractive` is scope-aware: it stays true for global-scope
 *    components even when the active selection is saved behind a `FocusScope`.
 * 3. **Focused** — bright border, dashed (keyboard focus indicator)
 * 4. **Idle** — dimmed border (affordance hint that the component is selectable)
 */
export function getFocusBorderStyle(
  state: FocusBorderState,
  colors: FocusBorderColors = FOCUS_BORDER_COLORS,
): FocusBorderResult {
  const borderColor = state.isSelected ? colors.selected
    : state.isAnySelected ? "transparent"
    : state.isFocused ? colors.focused
    : colors.idle

  const borderStyle = state.isFocused && !state.isSelected
    ? "dashed" as const
    : "rounded" as const

  return { borderColor, borderStyle }
}

export interface FocusDividerResult {
  dividerColor: string | undefined
  dividerDashed: boolean
}

/**
 * Computes divider color and dashed state from focus state for PromptInput-style components.
 *
 * Same four-state logic as `getFocusBorderStyle`, except returns `undefined` (instead
 * of `"transparent"`) when a sibling is selected. This lets the component's built-in
 * design divider show through with its default muted appearance.
 */
export function getFocusDividerStyle(
  state: FocusBorderState,
  colors: FocusBorderColors = FOCUS_BORDER_COLORS,
): FocusDividerResult {
  const dividerColor = state.isSelected ? colors.selected
    : state.isAnySelected ? undefined
    : state.isFocused ? colors.focused
    : colors.idle

  const dividerDashed = state.isFocused && !state.isSelected && !state.isAnySelected

  return { dividerColor, dividerDashed }
}
