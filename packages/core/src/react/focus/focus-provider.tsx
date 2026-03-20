import { useMemo, useEffect, useRef, createElement, type ReactNode } from "react"
import { FocusContext } from "./focus-context"
import { createFocusStore } from "./focus-store"
import { getNavigableEntries } from "./focus-reducer"
import { findSpatialTarget } from "./spatial-navigation"
import { useAppContext } from "../components/app"

export interface FocusProviderProps {
  /** Enable select mode: Enter selects the focused component, Escape deselects. */
  selectable?: boolean
  children: ReactNode
}

export function FocusProvider({ selectable = false, children }: FocusProviderProps) {
  const storeRef = useRef<ReturnType<typeof createFocusStore> | null>(null)
  if (!storeRef.current) storeRef.current = createFocusStore()
  const store = storeRef.current
  const { keyHandler, renderer } = useAppContext()

  // When the store changes, request a TUI render pass so the canvas repaints
  useEffect(() => {
    return store.subscribe(() => {
      ;(renderer as any)?.requestRender?.()
    })
  }, [store, renderer])

  const dispatch = store.dispatch

  const selectableRef = useRef(selectable)
  selectableRef.current = selectable

  // Key handler: navigation (tab/up/down) and selection (enter/escape).
  // Subscribes directly to keyHandler to avoid hook interaction / Strict Mode issues.
  useEffect(() => {
    if (!keyHandler) return

    const handler = (event: any) => {
      if (event.defaultPrevented) return

      const s = store.getState()

      // Tab: always linear cycling
      if (event.name === "tab") {
        if (s.selectedId) return
        dispatch({ type: event.shift ? "FOCUS_PREV" : "FOCUS_NEXT" })
        event.preventDefault()
        return
      }

      // Arrow keys: spatial navigation only (no linear fallback)
      if (event.name === "up" || event.name === "down" || event.name === "left" || event.name === "right") {
        if (s.selectedId) return
        if (s.focusedId) {
          const navigable = getNavigableEntries(s)
          const target = findSpatialTarget(event.name, s.focusedId, navigable, store.getRefs())
          if (target) {
            dispatch({ type: "FOCUS", id: target })
            event.preventDefault()
            return
          }
        }
        // No spatial match — do nothing. Use Tab for linear cycling.
        return
      }

      // Selection: Enter to select, Escape to deselect
      if (selectableRef.current) {
        if (event.name === "return" && s.focusedId && !s.selectedId) {
          dispatch({ type: "SELECT", id: s.focusedId })
          event.preventDefault()
        }
        if (event.name === "escape" && s.selectedId) {
          dispatch({ type: "DESELECT" })
          event.preventDefault()
        }
      }
    }

    keyHandler.on("keypress", handler)
    return () => {
      keyHandler.off("keypress", handler)
    }
  }, [keyHandler, store, dispatch])

  const contextValue = useMemo(() => ({ dispatch, store }), [dispatch, store])

  return createElement(
    FocusContext.Provider,
    { value: contextValue },
    children,
  )
}
