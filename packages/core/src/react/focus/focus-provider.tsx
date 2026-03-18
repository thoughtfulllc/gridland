import { useMemo, useState, useEffect, useCallback, createElement, type ReactNode } from "react"
import { FocusContext, ShortcutsContext } from "./focus-context"
import { createFocusStore } from "./focus-store"
import type { FocusAction } from "./types"
import { useKeyboard } from "../hooks/use-keyboard"
import { useAppContext } from "../components/app"
import { reconciler } from "../reconciler/reconciler"

const _flushSync = (reconciler as any).flushSyncFromReconciler ?? (reconciler as any).flushSync

export interface FocusProviderProps {
  children: ReactNode
}

export function FocusProvider({ children }: FocusProviderProps) {
  const store = useMemo(() => createFocusStore(), [])
  const { renderer } = useAppContext()
  const [, setTick] = useState(0)

  // Subscribe to store changes for TUI canvas repaint
  useEffect(() => {
    return store.subscribe(() => {
      ;(renderer as any)?.requestRender?.()
    })
  }, [store, renderer])

  // Wrapped dispatch: update store then flush React synchronously
  const dispatch = useCallback((action: FocusAction) => {
    store.dispatch(action)
    // Force React to process the state update synchronously
    _flushSync(() => {
      setTick((n) => n + 1)
    })
  }, [store])

  // Read state directly from store — always up to date after flushSync
  const state = store.getState()

  // Handle navigation keys at the provider level
  useKeyboard((event) => {
    if (event.defaultPrevented) return

    if (event.name === "tab" && event.shift) {
      dispatch({ type: "FOCUS_PREV" })
      event.preventDefault()
    } else if (event.name === "tab") {
      dispatch({ type: "FOCUS_NEXT" })
      event.preventDefault()
    } else if (event.name === "up") {
      dispatch({ type: "FOCUS_PREV" })
      event.preventDefault()
    } else if (event.name === "down") {
      dispatch({ type: "FOCUS_NEXT" })
      event.preventDefault()
    }
  })

  const contextValue = useMemo(() => ({ state, dispatch }), [state, dispatch])
  const shortcutsValue = useMemo(
    () => ({ shortcuts: state.shortcuts, focusedId: state.focusedId }),
    [state.shortcuts, state.focusedId],
  )

  return createElement(
    FocusContext.Provider,
    { value: contextValue },
    createElement(
      ShortcutsContext.Provider,
      { value: shortcutsValue },
      children,
    ),
  )
}
