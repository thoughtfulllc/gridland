export interface FocusEntry {
  id: string
  tabIndex: number
  disabled: boolean
  scopeId: string | null
  /** Whether this entry supports selection (enter to interact). Default true. */
  selectable: boolean
}

export interface FocusScope {
  id: string
  trap: boolean
  /** Whether this scope supports its own Enter/Esc selection lifecycle. */
  selectable: boolean
  savedFocusId: string | null
  savedSelectedId: string | null
}

export interface FocusState {
  entries: FocusEntry[]
  focusedId: string | null
  /** The ID of the currently selected (entered) component, or null. */
  selectedId: string | null
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
  | { type: "SELECT"; id: string }
  | { type: "DESELECT" }
  | { type: "PATCH_ENTRY"; id: string; patch: Partial<Omit<FocusEntry, "id">> }
  | { type: "PUSH_SCOPE"; scope: FocusScope }
  | { type: "POP_SCOPE"; scopeId: string; clearSelection?: boolean }
  | { type: "SET_SHORTCUTS"; focusId: string; shortcuts: ShortcutEntry[] }
  | { type: "CLEAR_SHORTCUTS"; focusId: string }
