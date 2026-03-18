import { useEffect } from "react"
import { useFocusContext } from "./focus-context"
import type { ShortcutEntry } from "./types"

/**
 * Register keyboard shortcuts for the currently focused component.
 * These shortcuts are available to StatusBar and useFocusedShortcuts.
 */
export function useShortcuts(shortcuts: ShortcutEntry[], focusId: string): void {
  const { dispatch } = useFocusContext()

  useEffect(() => {
    if (shortcuts.length > 0) {
      dispatch({ type: "SET_SHORTCUTS", focusId, shortcuts })
    }

    return () => {
      dispatch({ type: "CLEAR_SHORTCUTS", focusId })
    }
  }, [focusId, shortcuts])
}
