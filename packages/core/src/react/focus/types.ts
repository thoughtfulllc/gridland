export interface FocusEntry {
  id: string
  tabIndex: number
  disabled: boolean
  scopeId: string | null
}

export interface FocusScope {
  id: string
  trap: boolean
  savedFocusId: string | null
}

export interface FocusState {
  entries: FocusEntry[]
  focusedId: string | null
  scopes: FocusScope[]
  shortcuts: Map<string, ShortcutEntry[]>
}

export interface ShortcutEntry {
  key: string
  label: string
}

export type FocusAction =
  | { type: "REGISTER"; entry: FocusEntry }
  | { type: "UNREGISTER"; id: string }
  | { type: "FOCUS"; id: string }
  | { type: "BLUR"; id: string }
  | { type: "FOCUS_NEXT" }
  | { type: "FOCUS_PREV" }
  | { type: "PUSH_SCOPE"; scope: FocusScope }
  | { type: "POP_SCOPE"; scopeId: string }
  | { type: "SET_SHORTCUTS"; focusId: string; shortcuts: ShortcutEntry[] }
  | { type: "CLEAR_SHORTCUTS"; focusId: string }
