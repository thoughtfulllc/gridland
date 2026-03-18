import { useEffect, useRef } from "react"
import { useFocusContext } from "./focus-context"
import type { ShortcutEntry } from "./types"

/**
 * Register keyboard shortcuts for the currently focused component.
 * These shortcuts are available to StatusBar and useFocusedShortcuts.
 */
export function useShortcuts(shortcuts: ShortcutEntry[], focusId: string): void {
  const { dispatch } = useFocusContext()
  const prevKey = useRef("")

  // Serialize to a stable string for comparison so inline array literals
  // don't cause infinite re-render loops.
  const key = JSON.stringify(shortcuts)

  useEffect(() => {
    if (key === prevKey.current) return
    prevKey.current = key

    const parsed: ShortcutEntry[] = JSON.parse(key)
    if (parsed.length > 0) {
      dispatch({ type: "SET_SHORTCUTS", focusId, shortcuts: parsed })
    }

    return () => {
      dispatch({ type: "CLEAR_SHORTCUTS", focusId })
    }
  }, [focusId, key])
}
