import type { FocusState, FocusAction } from "./types"
import { focusReducer, initialFocusState } from "./focus-reducer"

type Listener = () => void

/**
 * External store for focus state — works reliably with concurrent React
 * because useSyncExternalStore ensures synchronous reads.
 */
export function createFocusStore() {
  let state: FocusState = initialFocusState
  const listeners = new Set<Listener>()
  // Renderable refs for spatial navigation — NOT part of state (no re-renders on change)
  const refs = new Map<string, any>()

  function getState(): FocusState {
    return state
  }

  function dispatch(action: FocusAction): void {
    const next = focusReducer(state, action)
    if (next !== state) {
      state = next
      for (const listener of [...listeners]) {
        try {
          listener()
        } catch (err) {
          console.error("Focus store listener error:", err)
        }
      }
    }
  }

  function subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  function setRef(id: string, node: any): void {
    if (node) refs.set(id, node)
    else refs.delete(id)
  }

  function getRefs(): Map<string, any> {
    return refs
  }

  function reset(): void {
    state = initialFocusState
    listeners.clear()
    refs.clear()
  }

  return { getState, dispatch, subscribe, reset, setRef, getRefs }
}

export type FocusStore = ReturnType<typeof createFocusStore>
