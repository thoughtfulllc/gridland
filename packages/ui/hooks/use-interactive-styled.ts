import { useInteractive, type UseInteractiveOptions, type UseInteractiveReturn } from "@gridland/utils"
import { useFocusBorderStyle } from "@/registry/gridland/lib/theme"

export interface UseInteractiveStyledReturn extends UseInteractiveReturn {
  /** Theme-aware border color for the four-state affordance pattern. */
  borderColor: string
  /** Theme-aware border style (rounded when idle/selected, dashed when focused). */
  borderStyle: "rounded" | "dashed"
}

/**
 * Convenience wrapper over `useInteractive` that adds theme-aware focus
 * border styling. Use this when you want the one-hook ergonomics for a
 * component that renders a focus-responsive border. For components that
 * don't render a border (e.g., TextInput, which renders a native input
 * intrinsic), use the pure `useInteractive` primitive from
 * `@gridland/utils` directly.
 */
export function useInteractiveStyled(
  options?: UseInteractiveOptions,
): UseInteractiveStyledReturn {
  const interactive = useInteractive(options)
  const { borderColor, borderStyle } = useFocusBorderStyle({
    isFocused: interactive.isFocused,
    isSelected: interactive.isSelected,
    isAnySelected: interactive.isAnySelected,
  })
  return { ...interactive, borderColor, borderStyle }
}
