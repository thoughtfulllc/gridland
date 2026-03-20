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

  function getState(): FocusState {
    return state
  }

  function dispatch(action: FocusAction): void {
    const next = focusReducer(state, action)
    if (next !== state) {
      state = next
      for (const listener of listeners) {
        listener()
      }
    }
  }

  function subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  function reset(): void {
    state = initialFocusState
    listeners.clear()
  }

  return { getState, dispatch, subscribe, reset }
}

export type FocusStore = ReturnType<typeof createFocusStore>
