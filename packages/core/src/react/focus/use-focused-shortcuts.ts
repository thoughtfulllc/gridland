import { useCallback, useMemo, useSyncExternalStore } from "react"
import { useFocusContext } from "./focus-context"
import type { ShortcutEntry } from "./types"

/**
 * Returns the shortcuts registered by the currently focused component.
 * Use in StatusBar to show context-sensitive keyboard hints.
 */
export function useFocusedShortcuts(): ShortcutEntry[] {
  const { store } = useFocusContext()

  const noopSubscribe = useCallback((cb: () => void) => () => {}, [])
  const state = useSyncExternalStore(
    store?.subscribe ?? noopSubscribe,
    () => store?.getState() ?? null,
    () => store?.getState() ?? null,
  )

  return useMemo(() => {
    if (!state?.focusedId) return []
    return state.shortcuts.get(state.focusedId) ?? []
  }, [state?.focusedId, state?.shortcuts])
}
