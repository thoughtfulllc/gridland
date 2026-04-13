import { useTheme } from "./theme-context"
import { getFocusBorderStyle, getFocusDividerStyle } from "@gridland/utils"
import type { FocusBorderState, FocusBorderResult, FocusDividerResult } from "@gridland/utils"

/** Returns focus border color and style from the current theme. */
export function useFocusBorderStyle(state: FocusBorderState): FocusBorderResult {
  const theme = useTheme()
  return getFocusBorderStyle(state, {
    selected: theme.focusSelected,
    focused: theme.focusFocused,
    idle: theme.focusIdle,
  })
}

/** Returns focus divider color and dashed state from the current theme. */
export function useFocusDividerStyle(state: FocusBorderState): FocusDividerResult {
  const theme = useTheme()
  return getFocusDividerStyle(state, {
    selected: theme.focusSelected,
    focused: theme.focusFocused,
    idle: theme.focusIdle,
  })
}
