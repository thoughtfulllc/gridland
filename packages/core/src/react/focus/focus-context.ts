import { createContext, useContext } from "react"
import { singleton } from "../../lib/singleton"
import type { FocusState, FocusAction, ShortcutEntry } from "./types"
import { initialFocusState } from "./focus-reducer"
import type { FocusStore } from "./focus-store"

export interface FocusContextValue {
  state: FocusState
  dispatch: (action: FocusAction) => void
  store: FocusStore | null
}

export const FocusContext = singleton("FocusContext", () =>
  createContext<FocusContextValue>({
    state: initialFocusState,
    dispatch: () => {},
    store: null,
  }),
)

export function useFocusContext(): FocusContextValue {
  return useContext(FocusContext)
}

// Shortcuts context — provides the shortcuts for the currently focused component
export interface ShortcutsContextValue {
  shortcuts: Map<string, ShortcutEntry[]>
  focusedId: string | null
}

export const ShortcutsContext = singleton("ShortcutsContext", () =>
  createContext<ShortcutsContextValue>({
    shortcuts: new Map(),
    focusedId: null,
  }),
)
