import { useContext, useMemo } from "react"
import { ShortcutsContext } from "./focus-context"
import type { ShortcutEntry } from "./types"

/**
 * Returns the shortcuts registered by the currently focused component.
 * Use in StatusBar to show context-sensitive keyboard hints.
 */
export function useFocusedShortcuts(): ShortcutEntry[] {
  const { shortcuts, focusedId } = useContext(ShortcutsContext)

  return useMemo(() => {
    if (!focusedId) return []
    return shortcuts.get(focusedId) ?? []
  }, [shortcuts, focusedId])
}
