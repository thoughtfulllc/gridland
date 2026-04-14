import { useCallback, useRef } from "react"
import { useFocus } from "../focus/use-focus"
import { useShortcuts } from "../focus/use-shortcuts"
import { useKeyboard } from "../hooks/use-keyboard"
import type { ShortcutEntry } from "../focus/types"

export interface UseInteractiveOptions {
  /** Stable id for the focus system. Auto-generated via useId if omitted. */
  id?: string
  /** Focus this component on mount. */
  autoFocus?: boolean
  /**
   * Remove this component from the tab cycle. Equivalent to the disabled
   * prop on a typical form input — the component is still rendered but
   * cannot receive focus.
   */
  disabled?: boolean
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
}

/**
 * Pure runtime primitive for interactive components. Composes focus
 * registration, selection-scoped keyboard routing, and shortcut
 * registration into one hook. Does NOT handle visual styling — consumers
 * that want theme-aware focus borders should call `useFocusBorderStyle`
 * separately, or use `useInteractiveStyled` from `@gridland/ui` for the
 * combined helper.
 */
export function useInteractive(options: UseInteractiveOptions = {}): UseInteractiveReturn {
  const { id, autoFocus, disabled, selectable = true, tabIndex, shortcuts } = options

  const focusState = useFocus({ id, autoFocus, disabled, selectable, tabIndex })
  const { focusId, isFocused, isSelected } = focusState

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

  return { ...focusState, onKey }
}
