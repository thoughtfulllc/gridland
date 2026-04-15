import type { KeyEvent } from "../../lib/KeyEvent"
import { useEffect, useContext, useRef } from "react"
import { useAppContext } from "../components/app"
import { useEffectEvent } from "./use-event"
import { FocusContext } from "../focus/focus-context"

export interface UseKeyboardOptions {
  /** Include release events - callback receives events with eventType: "release" */
  release?: boolean
  /** Only fire when this focus ID is focused. Obtain from useFocus(). */
  focusId?: string
  /** Always fire regardless of focus state. */
  global?: boolean
  /** Only fire when the component is selected (entered), not just focused. Requires focusId. */
  selectedOnly?: boolean
}

/**
 * Subscribe to keyboard events.
 *
 * By default, only receives press events (including key repeats with `repeated: true`).
 * Use `options.release` to also receive release events.
 *
 * Pass `{ global: true }` for app-level handlers (global quit, help, palette open) and
 * `{ focusId }` to scope a handler to a focus id — the handler then fires only while that
 * id owns focus.
 *
 * @example Global handler (app-level shortcut)
 * ```tsx
 * useKeyboard((event) => {
 *   if (event.ctrl && event.name === "q") quit()
 * }, { global: true })
 * ```
 *
 * @example Scoped to a focus id
 * ```tsx
 * const { focusId } = useFocus({ id: "editor" })
 * useKeyboard((event) => {
 *   if (event.ctrl && event.name === "s") save()
 * }, { focusId })
 * ```
 *
 * @example Selection-scoped (only when entered)
 * ```tsx
 * const { focusId } = useFocus({ id: "editor" })
 * useKeyboard((event) => { ... }, { focusId, selectedOnly: true })
 * ```
 *
 * Calling `useKeyboard(handler)` without an options bag is **deprecated**. Pass
 * `{ global: true }` explicitly for app-level handlers, or `{ focusId }` for focus-scoped
 * ones. The bare form still works — this deprecation exists to make the intent of each
 * call site explicit at the source. See `@gridland/utils` overload types for the
 * `@deprecated` tag that surfaces in IDE hover.
 */
export const useKeyboard = (handler: (key: KeyEvent) => void, options: UseKeyboardOptions = { release: false }) => {
  const { keyHandler } = useAppContext()
  const focusContext = useContext(FocusContext)
  const stableHandler = useEffectEvent(handler)

  const focusId = options.focusId
  const isGlobal = options.global
  const selectedOnly = options.selectedOnly

  // Store the current routing logic in a ref so the EventEmitter listener stays stable.
  // This prevents duplicate handler registration in React Strict Mode.
  const logicRef = useRef<((key: KeyEvent) => void) | null>(null)

  // Update the routing logic whenever deps change (without re-registering the listener)
  useEffect(() => {
    logicRef.current = (key: KeyEvent) => {
      if (focusId && !isGlobal) {
        const state = focusContext.store?.getState()
        if (!state) return
        const { focusedId, selectedId } = state
        if (focusedId !== focusId) return
        // If selectedOnly, only fire when this component is selected
        if (selectedOnly && selectedId !== focusId) return
        // If something else is selected, don't fire even if we're focused
        if (selectedId !== null && selectedId !== focusId) return
      }
      stableHandler(key)
    }
  }, [focusId, isGlobal, selectedOnly, focusContext, stableHandler])

  // Register the listener once per keyHandler. The stable wrapper delegates to logicRef.
  useEffect(() => {
    const stableWrapper = (key: KeyEvent) => logicRef.current?.(key)

    keyHandler?.on("keypress", stableWrapper)
    if (options?.release) {
      keyHandler?.on("keyrelease", stableWrapper)
    }
    return () => {
      keyHandler?.off("keypress", stableWrapper)
      if (options?.release) {
        keyHandler?.off("keyrelease", stableWrapper)
      }
    }
  }, [keyHandler, options?.release])
}
