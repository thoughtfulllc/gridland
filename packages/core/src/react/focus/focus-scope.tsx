import { useEffect, useId, createElement, createContext, useContext, type ReactNode } from "react"
import { singleton } from "../../lib/singleton"
import { useFocusContext } from "./focus-context"

export interface FocusScopeProps {
  /** Trap focus within this scope — Tab/Shift+Tab won't leave */
  trap?: boolean
  /** Auto-focus first focusable element on mount */
  autoFocus?: boolean
  /** Restore previous focus on unmount */
  restoreOnUnmount?: boolean
  children: ReactNode
}

// Internal context to pass scope ID to child useFocus calls
export const FocusScopeContext = singleton("FocusScopeContext", () =>
  createContext<string | null>(null),
)

export function useFocusScopeId(): string | null {
  return useContext(FocusScopeContext)
}

export function FocusScope({
  trap = false,
  autoFocus = false,
  restoreOnUnmount = true,
  children,
}: FocusScopeProps) {
  const scopeId = useId()
  const { dispatch } = useFocusContext()

  useEffect(() => {
    dispatch({
      type: "PUSH_SCOPE",
      scope: { id: scopeId, trap, savedFocusId: null },
    })

    if (autoFocus) {
      // Focus first element in this scope after dispatch settles
      queueMicrotask(() => {
        dispatch({ type: "FOCUS_NEXT" })
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
