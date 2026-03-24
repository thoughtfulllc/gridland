import { useCallback, useMemo, useSyncExternalStore } from "react"
import { useFocusContext } from "./focus-context"
import type { ShortcutEntry } from "./types"

const EMPTY: ShortcutEntry[] = []

/**
 * Returns the shortcuts registered by the currently focused component.
 * Use in StatusBar to show context-sensitive keyboard hints.
 */
export function useFocusedShortcuts(): ShortcutEntry[] {
  const { store } = useFocusContext()

  const noopSubscribe = useCallback((cb: () => void) => () => {}, [])

  // Subscribe to focusedId and shortcuts separately so we only re-render
  // when these specific values change, not on every state update.
  const focusedId = useSyncExternalStore(
    store?.subscribe ?? noopSubscribe,
    () => store?.getState().focusedId ?? null,
    () => null,
  )

  const shortcuts = useSyncExternalStore(
    store?.subscribe ?? noopSubscribe,
    () => store?.getState().shortcuts ?? null,
    () => null,
  )

  return useMemo(() => {
    if (!focusedId || !shortcuts) return EMPTY
    return shortcuts.get(focusedId) ?? EMPTY
  }, [focusedId, shortcuts])
}
