import { createContext, useContext } from "react"
import { singleton } from "../../lib/singleton"
import type { FocusAction } from "./types"
import type { FocusStore } from "./focus-store"

export interface FocusContextValue {
  dispatch: (action: FocusAction) => void
  store: FocusStore | null
}

export const FocusContext = singleton("FocusContext", () =>
  createContext<FocusContextValue>({
    dispatch: () => {},
    store: null,
  }),
)

export function useFocusContext(): FocusContextValue {
  return useContext(FocusContext)
}
