import { useEffect, useId, useMemo, useCallback, useRef } from "react"
import { useFocusContext } from "./focus-context"

export interface UseFocusOptions {
  id?: string
  tabIndex?: number
  autoFocus?: boolean
  disabled?: boolean
  scopeId?: string | null
}

export interface UseFocusReturn {
  isFocused: boolean
  focus: () => void
  blur: () => void
  focusId: string
}

export function useFocus(options: UseFocusOptions = {}): UseFocusReturn {
  const generatedId = useId()
  const {
    id = generatedId,
    tabIndex = 0,
    autoFocus = false,
    disabled = false,
    scopeId = null,
  } = options

  const { state, dispatch } = useFocusContext()
  const mountedRef = useRef(false)

  // Register on mount and update on prop changes
  useEffect(() => {
    if (mountedRef.current) {
      // Re-register with updated properties
      dispatch({ type: "UNREGISTER", id })
    }
    mountedRef.current = true

    dispatch({
      type: "REGISTER",
      entry: { id, tabIndex, disabled, scopeId },
    })

    if (autoFocus) {
      dispatch({ type: "FOCUS", id })
    }

    return () => {
      dispatch({ type: "UNREGISTER", id })
      mountedRef.current = false
    }
  }, [id, tabIndex, disabled, scopeId])

  const isFocused = state.focusedId === id

  const focus = useCallback(() => {
    dispatch({ type: "FOCUS", id })
  }, [dispatch, id])

  const blur = useCallback(() => {
    dispatch({ type: "BLUR", id })
  }, [dispatch, id])

  return useMemo(() => ({
    isFocused,
    focus,
    blur,
    focusId: id,
  }), [isFocused, focus, blur, id])
}
