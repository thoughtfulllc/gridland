import { useEffect, useId, createElement, createContext, useContext, type ReactNode } from "react"
import { singleton } from "../../lib/singleton"
import { useFocusContext } from "./focus-context"
import { getNavigableEntries } from "./focus-reducer"

export interface FocusScopeProps {
  /** Trap focus within this scope — Tab/Shift+Tab won't leave */
  trap?: boolean
  /** Enable Enter/Esc selection within this scope. Esc with nothing selected pops the scope. */
  selectable?: boolean
  /** Auto-focus first focusable element on mount */
  autoFocus?: boolean
  /** Auto-select if only one focusable element exists on mount. Implies autoFocus. */
  autoSelect?: boolean
  /** Restore previous focus on unmount */
  restoreOnUnmount?: boolean
  children: ReactNode
}

export const FocusScopeContext = singleton("FocusScopeContext", () =>
  createContext<string | null>(null),
)

export function useFocusScopeId(): string | null {
  return useContext(FocusScopeContext)
}

export function FocusScope({
  trap = false,
  selectable = false,
  autoFocus = false,
  autoSelect = false,
  restoreOnUnmount = true,
  children,
}: FocusScopeProps) {
  const scopeId = useId()
  const { dispatch, store } = useFocusContext()

  useEffect(() => {
    dispatch({
      type: "PUSH_SCOPE",
      scope: { id: scopeId, trap, selectable, savedFocusId: null, savedSelectedId: null },
    })

    if (autoFocus || autoSelect) {
      // queueMicrotask defers until after children have registered via useFocus
      queueMicrotask(() => {
        dispatch({ type: "FOCUS_NEXT" })

        if (autoSelect && store) {
          const s = store.getState()
          // Filter to this scope only — getNavigableEntries handles trap/disabled/tabIndex,
          // but we also need to exclude siblings from other scopes when trap=false
          const scopeEntries = getNavigableEntries(s).filter(e => e.scopeId === scopeId)
          if (scopeEntries.length === 1 && s.focusedId === scopeEntries[0].id && scopeEntries[0].selectable) {
            dispatch({ type: "SELECT", id: scopeEntries[0].id })
          }
        }
      })
    }

    return () => {
      if (restoreOnUnmount) {
        dispatch({ type: "POP_SCOPE", scopeId })
      }
    }
  }, [scopeId])

  return createElement(FocusScopeContext.Provider, { value: scopeId }, children)
}
