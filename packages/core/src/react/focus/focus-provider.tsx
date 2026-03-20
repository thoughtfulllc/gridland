import { useMemo, useEffect, createElement, type ReactNode } from "react"
import { FocusContext, ShortcutsContext } from "./focus-context"
import { createFocusStore } from "./focus-store"
import { useKeyboard } from "../hooks/use-keyboard"
import { useAppContext } from "../components/app"

export interface FocusProviderProps {
  children: ReactNode
}

export function FocusProvider({ children }: FocusProviderProps) {
  const store = useMemo(() => createFocusStore(), [])
  const { renderer } = useAppContext()

  // When the store changes, request a TUI render pass so the canvas repaints
  useEffect(() => {
    return store.subscribe(() => {
      ;(renderer as any)?.requestRender?.()
    })
  }, [store, renderer])

  const dispatch = store.dispatch
  const state = store.getState()

  // Handle navigation keys at the provider level
  useKeyboard((event) => {
    if (event.defaultPrevented) return

    if (event.name === "tab" || event.name === "up" || event.name === "down") {
      const isBack = event.name === "up" || (event.name === "tab" && event.shift)
      dispatch({ type: isBack ? "FOCUS_PREV" : "FOCUS_NEXT" })
      event.preventDefault()
    }
  })

  // Pass the store through context so child hooks can subscribe directly
  const contextValue = useMemo(() => ({ state, dispatch, store }), [state, dispatch, store])
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
