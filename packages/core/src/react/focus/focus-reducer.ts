import type { FocusState, FocusAction, FocusEntry } from "./types"

export const initialFocusState: FocusState = {
  entries: [],
  focusedId: null,
  scopes: [],
  shortcuts: new Map(),
}

function getNavigableEntries(state: FocusState): FocusEntry[] {
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

      // If the unregistered element was focused, focus the next available
      if (focusedId === action.id) {
        const navigable = sortedNavigable(
          newEntries.filter((e) => !e.disabled && e.tabIndex !== -1),
        )
        focusedId = navigable.length > 0 ? navigable[0].id : null
      }

      return {
        ...state,
        entries: newEntries,
        focusedId,
        shortcuts,
      }
    }

    case "FOCUS": {
      return {
        ...state,
        focusedId: action.id,
      }
    }

    case "BLUR": {
      if (state.focusedId !== action.id) return state
      return {
        ...state,
        focusedId: null,
      }
    }

    case "FOCUS_NEXT": {
      const nextId = navigateNext(state)
      if (nextId === null || nextId === state.focusedId) return state
      return { ...state, focusedId: nextId }
    }

    case "FOCUS_PREV": {
      const prevId = navigatePrev(state)
      if (prevId === null || prevId === state.focusedId) return state
      return { ...state, focusedId: prevId }
    }

    case "PUSH_SCOPE": {
      return {
        ...state,
        scopes: [...state.scopes, {
          ...action.scope,
          savedFocusId: state.focusedId,
        }],
      }
    }

    case "POP_SCOPE": {
      const scopeIndex = state.scopes.findIndex((s) => s.id === action.scopeId)
      if (scopeIndex === -1) return state

      const poppedScope = state.scopes[scopeIndex]
      const newScopes = state.scopes.filter((_, i) => i !== scopeIndex)

      return {
        ...state,
        scopes: newScopes,
        focusedId: poppedScope.savedFocusId,
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
