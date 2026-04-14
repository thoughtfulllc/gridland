import { useCallback, useRef } from "react"
import { useFocus, useKeyboard, useShortcuts, type ShortcutEntry } from "@gridland/utils"
import { useFocusBorderStyle } from "@/registry/gridland/lib/theme"

export interface UseInteractiveOptions {
  /** Stable id for the focus system. Auto-generated via useId if omitted. */
  id?: string
  /** Focus this component on mount. */
  autoFocus?: boolean
  /** Whether this component supports selection via Enter/Escape. @default true */
  selectable?: boolean
  /** Tab order. A value of -1 removes the component from the tab cycle. @default 0 */
  tabIndex?: number
  /**
   * Shortcuts to surface to `useFocusedShortcuts` while focused. Accepts
   * either a static array or a function that receives the current
   * focus/selection state. The function form is re-evaluated on every
   * render, so it can return different hints for focused vs. selected.
   */
  shortcuts?:
    | ShortcutEntry[]
    | ((state: { isFocused: boolean; isSelected: boolean }) => ShortcutEntry[])
}

export interface UseInteractiveReturn {
  /** Ref callback — attach to the component's root `<box>` for spatial navigation. */
  focusRef: (node: any) => void
  /** Stable focus id (provided or auto-generated). */
  focusId: string
  /** True when this component has keyboard focus. */
  isFocused: boolean
  /** True when this component is selected (entered for interaction). */
  isSelected: boolean
  /** True when any component in the focus tree is selected. Scope-aware. */
  isAnySelected: boolean
  /**
   * Register (or replace) the keyboard handler that fires while this
   * component is selected. Last call in a render wins — components pass
   * a fresh closure each render without re-subscribing the listener.
   */
  onKey: (handler: (event: any) => void) => void
  /** Imperatively focus this component. */
  focus: () => void
  /** Imperatively blur this component. */
  blur: () => void
  /** Imperatively select (enter) this component. */
  select: () => void
  /** Imperatively deselect (exit) the currently selected component. */
  deselect: () => void
  /** Theme-aware border color for the four-state affordance pattern. */
  borderColor: string
  /** Theme-aware border style (rounded when idle/selected, dashed when focused). */
  borderStyle: "rounded" | "dashed"
}

/**
 * Single primitive for interactive components. Composes focus registration,
 * selection-scoped keyboard routing, shortcut registration, and theme-aware
 * focus border styling into one hook.
 */
export function useInteractive(options: UseInteractiveOptions = {}): UseInteractiveReturn {
  const { id, autoFocus, selectable = true, tabIndex, shortcuts } = options

  const focusState = useFocus({ id, autoFocus, selectable, tabIndex })
  const { focusId, isFocused, isSelected, isAnySelected } = focusState

  const handlerRef = useRef<((event: any) => void) | null>(null)
  const onKey = useCallback((handler: (event: any) => void) => {
    handlerRef.current = handler
  }, [])

  useKeyboard(
    (event: any) => handlerRef.current?.(event),
    { focusId, selectedOnly: true },
  )

  const resolvedShortcuts: ShortcutEntry[] =
    typeof shortcuts === "function"
      ? shortcuts({ isFocused, isSelected })
      : shortcuts ?? []
  useShortcuts(resolvedShortcuts, focusId)

  const { borderColor, borderStyle } = useFocusBorderStyle({
    isFocused,
    isSelected,
    isAnySelected,
  })

  return { ...focusState, onKey, borderColor, borderStyle }
}
