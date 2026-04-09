import { useEffect, useId, useMemo, useCallback, useRef, useSyncExternalStore } from "react"
import { useFocusContext } from "./focus-context"
import { useFocusScopeId } from "./focus-scope"

export interface UseFocusOptions {
  id?: string
  tabIndex?: number
  autoFocus?: boolean
  disabled?: boolean
  scopeId?: string | null
  /** Whether this component supports selection. Default true. */
  selectable?: boolean
}

export interface UseFocusReturn {
  isFocused: boolean
  /** Whether this component is currently selected (entered for interaction). */
  isSelected: boolean
  /** Whether any component in the focus tree is currently selected.
   * For global-scope components, this also returns true when a selection is saved
   * behind a FocusScope (e.g., after PUSH_SCOPE), so sibling borders correctly hide. */
  isAnySelected: boolean
  focus: () => void
  blur: () => void
  /** Select (enter) this component. Only works when focused and selectable. */
  select: () => void
  /** Deselect (exit) the currently selected component. */
  deselect: () => void
  focusId: string
  /** Ref callback — attach to the root <box> to enable spatial arrow-key navigation. */
  focusRef: (node: any) => void
}

export function useFocus(options: UseFocusOptions = {}): UseFocusReturn {
  const generatedId = useId()
  const contextScopeId = useFocusScopeId()
  const {
    id = generatedId,
    tabIndex = 0,
    autoFocus = false,
    disabled = false,
    scopeId = contextScopeId,
    selectable = true,
  } = options

  const { dispatch, store } = useFocusContext()

  const noopSubscribe = useCallback((cb: () => void) => () => {}, [])
  const focusedId = useSyncExternalStore(
    store?.subscribe ?? noopSubscribe,
    () => store?.getState().focusedId ?? null,
    () => store?.getState().focusedId ?? null,
  )
  const selectedId = useSyncExternalStore(
    store?.subscribe ?? noopSubscribe,
    () => store?.getState().selectedId ?? null,
    () => store?.getState().selectedId ?? null,
  )
  // Derived boolean: is this ID saved as selectedId in any scope on the stack?
  const isScopeSelected = useSyncExternalStore(
    store?.subscribe ?? noopSubscribe,
    () => store?.getState().scopes.some(s => s.savedSelectedId === id) ?? false,
    () => false,
  )

  useEffect(() => {
    dispatch({
      type: "REGISTER",
      entry: { id, tabIndex, disabled, scopeId, selectable },
    })

    if (autoFocus) {
      dispatch({ type: "FOCUS", id })
    }

    return () => {
      dispatch({ type: "UNREGISTER", id })
    }
  }, [id])

  // Patch entry props without disrupting focus (avoids UNREGISTER+REGISTER gap)
  const isFirstPatchRun = useRef(true)
  useEffect(() => {
    if (isFirstPatchRun.current) {
      isFirstPatchRun.current = false
      return
    }
    dispatch({ type: "PATCH_ENTRY", id, patch: { tabIndex, disabled, scopeId, selectable } })
  }, [tabIndex, disabled, scopeId, selectable])

  // Check if any scope has a saved selection — means a peer at this level is still
  // logically selected even though selectedId was cleared by PUSH_SCOPE.
  // Only relevant for components outside the pushed scope (scopeId matches their level).
  const hasScopeSavedSelection = useSyncExternalStore(
    store?.subscribe ?? noopSubscribe,
    () => store?.getState().scopes.some(s => s.savedSelectedId !== null) ?? false,
    () => false,
  )

  const isFocused = focusedId === id
  const isSelected = selectedId === id || isScopeSelected
  const isAnySelected = selectedId !== null
    || (scopeId == null && hasScopeSavedSelection)

  const focus = useCallback(() => {
    dispatch({ type: "FOCUS", id })
  }, [dispatch, id])

  const blur = useCallback(() => {
    dispatch({ type: "BLUR", id })
  }, [dispatch, id])

  const select = useCallback(() => {
    dispatch({ type: "SELECT", id })
  }, [dispatch, id])

  const deselect = useCallback(() => {
    dispatch({ type: "DESELECT" })
  }, [dispatch])

  const focusRef = useCallback((node: any) => {
    store?.setRef(id, node)
  }, [id, store])

  return useMemo(() => ({
    isFocused,
    isSelected,
    isAnySelected,
    focus,
    blur,
    select,
    deselect,
    focusId: id,
    focusRef,
  }), [isFocused, isSelected, isAnySelected, focus, blur, select, deselect, id, focusRef])
}
