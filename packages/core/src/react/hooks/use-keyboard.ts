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
 * Focus-aware routing:
 * - `{ focusId }` — fires only when that component is focused
 * - `{ focusId, selectedOnly: true }` — fires only when that component is selected
 * - `{ global: true }` — fires always regardless of focus
 * - Neither — fires always (backward-compatible)
 *
 * @example
 * // Focus-scoped: only fires when this component is focused
 * const { focusId } = useFocus()
 * useKeyboard((e) => { ... }, { focusId })
 *
 * // Selection-scoped: only fires when this component is selected (entered)
 * const { focusId } = useFocus()
 * useKeyboard((e) => { ... }, { focusId, selectedOnly: true })
 *
 * // Global: always fires regardless of focus
 * useKeyboard((e) => { if (e.ctrl && e.name === 'q') quit() }, { global: true })
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
