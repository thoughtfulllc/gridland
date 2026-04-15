import { useCallback, useEffect, useId, useMemo, useRef, useSyncExternalStore } from "react"
import { useFocusContext } from "../focus/focus-context"
import { useFocusScopeId } from "../focus/focus-scope"
import { useShortcuts } from "../focus/use-shortcuts"
import { useKeyboard } from "../hooks/use-keyboard"
import type { ShortcutEntry } from "../focus/types"

export interface UseInteractiveOptions {
  /** Stable id for the focus system. Auto-generated via useId if omitted. */
  id?: string
  /** Focus this component on mount. */
  autoFocus?: boolean
  /**
   * Remove this component from the tab cycle. Equivalent to the disabled
   * prop on a typical form input — the component is still rendered but
   * cannot receive focus.
   */
  disabled?: boolean
  /** Whether this component supports selection via Enter/Escape. @default true */
  selectable?: boolean
  /** Tab order. A value of -1 removes the component from the tab cycle. @default 0 */
  tabIndex?: number
  /**
   * Override the enclosing `FocusScope`. `undefined` (default) uses the scope
   * from context. `null` opts out of any enclosing scope and routes to the
   * root. A concrete string overrides with a specific scope id. Used for
   * modals-within-modals, portal overlays, and headless composition where a
   * focusable needs to land in a different scope than the one it renders under.
   */
  scopeId?: string | null
  /**
   * Shortcuts to surface to `useFocusedShortcuts` while focused. Accepts
   * either a static array or a function that receives the current
   * focus/selection state. The function form is re-evaluated on every
   * render, so it can return different hints for focused vs. selected.
   */
  shortcuts?:
    | ShortcutEntry[]
    | ((state: { isFocused: boolean; isSelected: boolean }) => ShortcutEntry[])
}

export interface UseInteractiveReturn {
  /** Ref callback — attach to the component's root `<box>` for spatial navigation. */
  focusRef: (node: any) => void
  /** Stable focus id (provided or auto-generated). */
  focusId: string
  /** True when this component has keyboard focus. */
  isFocused: boolean
  /** True when this component is selected (entered for interaction). */
  isSelected: boolean
  /** True when any component in the focus tree is selected. Scope-aware. */
  isAnySelected: boolean
  /**
   * Register (or replace) the keyboard handler that fires while this
   * component is selected. Last call in a render wins — components pass
   * a fresh closure each render without re-subscribing the listener.
   */
  onKey: (handler: (event: any) => void) => void
  /** Imperatively focus this component. */
  focus: () => void
  /** Imperatively blur this component. */
  blur: () => void
  /** Imperatively select (enter) this component. */
  select: () => void
  /** Imperatively deselect (exit) the currently selected component. */
  deselect: () => void
}

/**
 * Pure runtime primitive for interactive components. Composes focus
 * registration, selection-scoped keyboard routing, and shortcut
 * registration into one hook. Does NOT handle visual styling — consumers
 * that want theme-aware focus borders should call `useFocusBorderStyle`
 * separately, or use `useInteractiveStyled` from `@gridland/ui` for the
 * combined helper.
 *
 * Display-only wrapper components that share a focusId with an inner
 * interactive child can call `useInteractive({ id })` without `shortcuts`
 * and without `onKey`. The internal `useShortcuts` call short-circuits on
 * an empty array (load-bearing guard in `use-shortcuts.ts`), so the wrapper
 * does not stomp the inner component's shortcut registration.
 */
export function useInteractive(options: UseInteractiveOptions = {}): UseInteractiveReturn {
  const generatedId = useId()
  const contextScopeId = useFocusScopeId()
  const {
    id = generatedId,
    tabIndex = 0,
    autoFocus = false,
    disabled = false,
    scopeId = contextScopeId,
    selectable = true,
    shortcuts,
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

  const handlerRef = useRef<((event: any) => void) | null>(null)
  const onKey = useCallback((handler: (event: any) => void) => {
    handlerRef.current = handler
  }, [])

  useKeyboard(
    (event: any) => handlerRef.current?.(event),
    { focusId: id, selectedOnly: true },
  )

  const resolvedShortcuts: ShortcutEntry[] =
    typeof shortcuts === "function"
      ? shortcuts({ isFocused, isSelected })
      : shortcuts ?? []
  useShortcuts(resolvedShortcuts, id)

  return useMemo(
    () => ({
      isFocused,
      isSelected,
      isAnySelected,
      focus,
      blur,
      select,
      deselect,
      focusId: id,
      focusRef,
      onKey,
    }),
    [isFocused, isSelected, isAnySelected, focus, blur, select, deselect, id, focusRef, onKey],
  )
}
