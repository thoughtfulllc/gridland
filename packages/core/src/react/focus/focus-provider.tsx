import { useMemo, useSyncExternalStore, createElement, type ReactNode } from "react"
import { FocusContext, ShortcutsContext } from "./focus-context"
import { createFocusStore } from "./focus-store"
import { useKeyboard } from "../hooks/use-keyboard"

export interface FocusProviderProps {
  children: ReactNode
}

export function FocusProvider({ children }: FocusProviderProps) {
  const store = useMemo(() => createFocusStore(), [])

  const state = useSyncExternalStore(
    store.subscribe,
    store.getState,
    store.getState,
  )

  const dispatch = store.dispatch

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
