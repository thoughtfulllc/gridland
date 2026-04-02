---
paths:
  - "packages/core/src/react/focus/**"
  - "packages/ui/components/side-nav/**"
  - "packages/demo/demos/ai-chat-interface.tsx"
  - "packages/docs/components/demos/ai-chat-interface-demo.tsx"
---

# Design Decisions

Non-obvious choices and the reasoning behind them. Read this before refactoring any of these patterns.

## `selectable` on `FocusScope` — scope declares Enter/Esc semantics, not the consumer

The `selectable` prop on `FocusScope` means the scope itself participates in the Enter/Esc lifecycle. Without this, a parent would need to intercept keyboard events and manually push/pop the scope, coupling the parent to focus internals. With `selectable`, the scope composition is self-contained: `<FocusScope trap selectable autoFocus>` is the complete declaration.

## `clearSelection: true` on `POP_SCOPE` when Esc exits a selectable scope

When a user presses Esc to leave a selectable scope, they are signalling intent to fully exit that context. If selection state were preserved, the previously-selected item would re-appear selected when the scope mounts again, which would be surprising. `clearSelection: true` ensures the scope starts fresh on re-entry.

## `getTopScope` exported from `focus-reducer`, not re-implemented in consumers

`getTopScope` and `getNavigableEntries` are the canonical way to inspect focus state. Exporting them from `focus-reducer` creates one source of truth. Any consumer that re-implements the "get top scope" logic (e.g., `state.scopes[state.scopes.length - 1]`) risks subtle divergence if the data structure changes. Import from `focus-reducer`, never re-derive.

## `interactingItemIdRef` in `SideNav` — decoupled from `activeIndex`

Tracking which item is "interacting" via `activeIndex` creates a timing bug: when `requestedActiveId` changes `activeIndex` programmatically, the `onSelectChange` handler for the old item fires `setIsInteracting(false)` before the new item can fire `setIsInteracting(true)`, causing a flash of `isInteracting=false`. The `interactingItemIdRef` stores the item's `id` rather than its index, so `onSelectChange(false)` only clears interaction if the deselecting item is actually the one that last set it.

## `requestedActiveId` prop on `SideNav` — declarative, not imperative

An imperative API (e.g., `ref.current.navigate(id)`) would require consumers to hold a ref and call methods in effect hooks, coupling them to the component lifecycle. `requestedActiveId` is a React prop: the parent just sets state and React propagates it. The `lastRequestedActiveIdRef` inside `SideNav` prevents the same value from triggering navigation twice on re-renders.

## `lastAutoNavIdRef` as a single ref, not a `Set`

When auto-navigating back to a previous conversation after Esc (e.g., in `packages/demo/demos/ai-chat-interface.tsx`), only the most recent navigation matters. Using a `Set` to track "already navigated to" IDs would grow unbounded over a long session. A single ref that tracks the last auto-nav ID is sufficient because the guard only needs to prevent re-processing the same ID on consecutive renders.

## `autoSelect` on `FocusScope` — only fires for single-item scopes

`autoSelect` does not unconditionally select the first focusable item. It auto-selects only when all three conditions hold after mount: (1) there is exactly one focusable entry registered in the scope, (2) that entry is itself `selectable`, and (3) `FOCUS_NEXT` landed on it. For scopes with multiple focusable children, `autoSelect` is a no-op — the user must press Enter manually.

## Spatial navigation forces a layout flush before hit-testing

Before computing which element is spatially closest in a given direction, `findSpatialTarget` calls `ensureLayoutComputed` to flush any pending yoga layout calculations. Without this, the first spatial nav keypress after a render can fail silently — yoga has computed sizes internally but not yet propagated positions to the node tree, so all rects appear at `(0,0)`.

## AI SDK agnosticism — `ChatStatus` is our own type

SDK-specific status types (e.g., from `@ai-sdk/react`) couple components to a specific vendor. Our `ChatStatus = "ready" | "submitted" | "streaming" | "error"` is defined in our codebase and mapped from whatever SDK the consumer uses.
