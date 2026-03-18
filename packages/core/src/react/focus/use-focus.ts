import { useEffect, useId, useMemo, useCallback, useRef, useSyncExternalStore } from "react"
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

  const { dispatch, store } = useFocusContext()
  const mountedRef = useRef(false)

  // Subscribe to store for reactivity — this is what drives re-renders
  const noopSubscribe = useCallback((cb: () => void) => () => {}, [])
  const focusedId = useSyncExternalStore(
    store?.subscribe ?? noopSubscribe,
    () => store?.getState().focusedId ?? null,
    () => store?.getState().focusedId ?? null,
  )

  // Register on mount and update on prop changes
  useEffect(() => {
    if (mountedRef.current) {
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

  const isFocused = focusedId === id

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
