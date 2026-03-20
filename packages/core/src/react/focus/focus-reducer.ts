import type { FocusState, FocusAction, FocusEntry } from "./types"

export const initialFocusState: FocusState = {
  entries: [],
  focusedId: null,
  selectedId: null,
  scopes: [],
  shortcuts: new Map(),
}

export function getNavigableEntries(state: FocusState): FocusEntry[] {
  const currentScopeId = state.scopes.length > 0
    ? state.scopes[state.scopes.length - 1].id
    : null

  return state.entries.filter((e) => {
    if (e.disabled) return false
    if (e.tabIndex === -1) return false

    // If we're in a trapping scope, only navigate entries in that scope
    if (currentScopeId !== null) {
      const currentScope = state.scopes[state.scopes.length - 1]
      if (currentScope.trap && e.scopeId !== currentScopeId) return false
    }

    return true
  })
}

function sortedNavigable(entries: FocusEntry[]): FocusEntry[] {
  // Sort: positive tabIndex first (ascending), then tabIndex 0 in insertion order
  const positiveTab = entries.filter((e) => e.tabIndex > 0).sort((a, b) => a.tabIndex - b.tabIndex)
  const zeroTab = entries.filter((e) => e.tabIndex === 0)
  return [...positiveTab, ...zeroTab]
}

function navigateNext(state: FocusState): string | null {
  const navigable = sortedNavigable(getNavigableEntries(state))
  if (navigable.length === 0) return null

  if (state.focusedId === null) return navigable[0].id

  const currentIndex = navigable.findIndex((e) => e.id === state.focusedId)
  if (currentIndex === -1) return navigable[0].id

  const nextIndex = (currentIndex + 1) % navigable.length
  return navigable[nextIndex].id
}

function navigatePrev(state: FocusState): string | null {
  const navigable = sortedNavigable(getNavigableEntries(state))
  if (navigable.length === 0) return null

  if (state.focusedId === null) return navigable[navigable.length - 1].id

  const currentIndex = navigable.findIndex((e) => e.id === state.focusedId)
  if (currentIndex === -1) return navigable[navigable.length - 1].id

  const prevIndex = (currentIndex - 1 + navigable.length) % navigable.length
  return navigable[prevIndex].id
}

export function focusReducer(state: FocusState, action: FocusAction): FocusState {
  switch (action.type) {
    case "REGISTER": {
      // Don't register duplicates
      if (state.entries.some((e) => e.id === action.entry.id)) {
        return state
      }
      return {
        ...state,
        entries: [...state.entries, action.entry],
      }
    }

    case "UNREGISTER": {
      const newEntries = state.entries.filter((e) => e.id !== action.id)
      const shortcuts = new Map(state.shortcuts)
      shortcuts.delete(action.id)
      let focusedId = state.focusedId
      let selectedId = state.selectedId

      // If the unregistered element was selected, clear selection
      if (selectedId === action.id) {
        selectedId = null
      }

      // If the unregistered element was focused, focus the next available
      // Use getNavigableEntries to respect scope trapping
      if (focusedId === action.id) {
        const intermediateState = { ...state, entries: newEntries }
        const navigable = sortedNavigable(getNavigableEntries(intermediateState))
        focusedId = navigable.length > 0 ? navigable[0].id : null
      }

      return {
        ...state,
        entries: newEntries,
        focusedId,
        selectedId,
        shortcuts,
      }
    }

    case "FOCUS": {
      // Switching focus clears selection (can't be selected if not focused)
      const selectedId = state.selectedId !== null && state.selectedId !== action.id
        ? null
        : state.selectedId
      return {
        ...state,
        focusedId: action.id,
        selectedId,
      }
    }

    case "BLUR": {
      if (state.focusedId !== action.id) return state
      return {
        ...state,
        focusedId: null,
        // Clear selection if blurring the selected component
        selectedId: state.selectedId === action.id ? null : state.selectedId,
      }
    }

    case "FOCUS_NEXT": {
      if (state.selectedId !== null) return state
      const nextId = navigateNext(state)
      if (nextId === null || nextId === state.focusedId) return state
      return { ...state, focusedId: nextId }
    }

    case "FOCUS_PREV": {
      if (state.selectedId !== null) return state
      const prevId = navigatePrev(state)
      if (prevId === null || prevId === state.focusedId) return state
      return { ...state, focusedId: prevId }
    }

    case "SELECT": {
      // Only select if the entry is focused and selectable
      if (state.focusedId !== action.id) return state
      const entry = state.entries.find((e) => e.id === action.id)
      if (!entry || !entry.selectable) return state
      return { ...state, selectedId: action.id }
    }

    case "DESELECT": {
      if (state.selectedId === null) return state
      return { ...state, selectedId: null }
    }

    case "PATCH_ENTRY": {
      const idx = state.entries.findIndex((e) => e.id === action.id)
      if (idx === -1) return state
      const current = state.entries[idx]
      const patched = { ...current, ...action.patch }
      if (
        current.tabIndex === patched.tabIndex &&
        current.disabled === patched.disabled &&
        current.scopeId === patched.scopeId &&
        current.selectable === patched.selectable
      ) {
        return state
      }
      const entries = [...state.entries]
      entries[idx] = patched
      return { ...state, entries }
    }

    case "PUSH_SCOPE": {
      return {
        ...state,
        scopes: [...state.scopes, {
          ...action.scope,
          savedFocusId: state.focusedId,
          savedSelectedId: state.selectedId,
        }],
        selectedId: null,
      }
    }

    case "POP_SCOPE": {
      const scopeIndex = state.scopes.findIndex((s) => s.id === action.scopeId)
      if (scopeIndex === -1) return state

      const poppedScope = state.scopes[scopeIndex]
      const newScopes = state.scopes.filter((_, i) => i !== scopeIndex)

      // Validate saved focus ID still exists and is navigable
      let focusedId = poppedScope.savedFocusId
      if (focusedId !== null) {
        const entry = state.entries.find((e) => e.id === focusedId)
        if (!entry || entry.disabled || entry.tabIndex === -1) {
          const intermediateState = { ...state, scopes: newScopes }
          const navigable = sortedNavigable(getNavigableEntries(intermediateState))
          focusedId = navigable.length > 0 ? navigable[0].id : null
        }
      }

      return {
        ...state,
        scopes: newScopes,
        focusedId,
        selectedId: poppedScope.savedSelectedId ?? null,
      }
    }

    case "SET_SHORTCUTS": {
      const shortcuts = new Map(state.shortcuts)
      shortcuts.set(action.focusId, action.shortcuts)
      return { ...state, shortcuts }
    }

    case "CLEAR_SHORTCUTS": {
      const shortcuts = new Map(state.shortcuts)
      shortcuts.delete(action.focusId)
      return { ...state, shortcuts }
    }

    default:
      return state
  }
}
