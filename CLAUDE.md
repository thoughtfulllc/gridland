# Gridland TUI Framework

Gridland is a React-based TUI (Terminal UI) framework that renders to an HTML canvas via a custom reconciler. Components are written as JSX but rendered to pixels, not HTML. All intrinsic elements (`<box>`, `<text>`, `<span>`) are OpenTUI elements, not HTML — files using them carry `// @ts-nocheck` at the top.

## Project Structure

```
packages/
├── core/       Internal — focus system, reconciler, hooks source (NOT for external import)
├── ui/         @gridland/ui — all UI components
├── utils/      @gridland/utils — hooks and utilities
├── web/        @gridland/web — browser renderer (TUI component)
├── docs/       Documentation site (Next.js, content in content/docs/)
├── demo/       Demo app (Bun)
└── testing/    @gridland/testing — test helpers
```

## Package Import Rules

- ✅ `@gridland/ui` — UI components (SideNav, Message, PromptInput, Modal, etc.)
- ✅ `@gridland/utils` — hooks (useFocus, FocusProvider, FocusScope, useKeyboard, useShortcuts, useCapturedKeyboard)
- ✅ `@gridland/web` — browser renderer (TUI)
- ❌ Never import from `@gridland/core` directly — it is internal
- ❌ Never import from internal paths (`packages/core/src/...`)

## Focus System

The focus system drives all keyboard navigation. Every interactive component must integrate with it.

### Core API (all from `@gridland/utils`)

**`FocusProvider`** — Root wrapper. `selectable` prop enables Enter/Esc lifecycle globally.

**`FocusScope`** — Manages focus within a region.
Props: `trap`, `selectable`, `autoFocus`, `autoSelect`, `restoreOnUnmount`

**`useFocus`** — Registers a focusable element.
Options: `id`, `tabIndex`, `autoFocus`, `disabled`, `scopeId`, `selectable`
Returns: `isFocused`, `isSelected`, `isAnySelected`, `focusId`, `focusRef`, `focus`, `blur`, `select`, `deselect`

**`useShortcuts(shortcuts, focusId)`** — Registers keyboard shortcut hints shown in StatusBar.

**`useFocusedShortcuts()`** — Returns active shortcuts for the focused element (pass to StatusBar).

**`useCapturedKeyboard(focusId)`** — Returns a keyboard hook scoped to when this element is selected.

### Correct Patterns

```tsx
// ✅ disabled alone excludes from navigation — tabIndex redundancy not needed
useFocus({ id, disabled })

// ❌ Wrong — tabIndex: disabled ? -1 : 0 alongside disabled is redundant
useFocus({ id, disabled, tabIndex: disabled ? -1 : 0 })

// ✅ FocusScope with selectable for Enter/Esc interaction regions
<FocusScope trap selectable autoFocus autoSelect>
  {children}
</FocusScope>
```

### Every New Interactive Component Must

1. Call `useFocus` to register with the focus system
2. Attach `focusRef` to its root `<box>` for spatial navigation
3. Wrap nested interactive content in `FocusScope` with `selectable`
4. Register shortcuts via `useShortcuts`

## UI Components (`@gridland/ui`)

| Component | Key Props |
|---|---|
| `SideNav` | `items`, `requestedActiveId`, `borderColor`, `activeBorderColor`, `focusedColor`, `selectedColor`, `mutedColor`, `highlightBg`, `children({ activeItem, isInteracting })` |
| `PromptInput` | `onSubmit`, `onStop`, `status`, `focus`, `useKeyboard`, `dividerColor`, `dividerDashed`, `showDividers`, `model`, `commands`, `placeholder` |
| `Message` | `role`, `isStreaming`. Sub: `Message.Content`, `Message.Text`, `Message.ToolCall`, `Message.Source`, `Message.Reasoning` |
| `Modal` | `title`, `useKeyboard`, `onClose` |
| `SelectInput` | `items`, `defaultValue`, `useKeyboard`, `onSubmit` |
| `StatusBar` | `items` (from `useFocusedShortcuts`) |
| `ChainOfThought` | `open`, `onOpenChange`. Sub: `ChainOfThoughtHeader`, `ChainOfThoughtContent`, `ChainOfThoughtStep` |

## AI SDK Conventions

The framework must remain AI-SDK agnostic. Component interfaces must not depend on any specific SDK.

- `ChatStatus` is our own type: `"ready" | "submitted" | "streaming" | "error"` — never imported from any SDK
- `UIMessagePart` (when needed) must come from `"ai"` package, NOT `"@ai-sdk/react"`
- Tool call part type: `"dynamic-tool"` (AI SDK v6) — NOT `"tool-invocation"` (old v2)
- Tool state values: `"input-streaming"` | `"input-available"` | `"output-available"` | `"output-error"`
- `useChat` prop for pre-populated messages: `messages` (not `initialMessages`)
- Component props accept generic `messages: any[]` — no SDK-specific shapes in prop interfaces

## Export Conventions

Every component in `packages/ui/components/` must have a matching entry in `packages/ui/components/index.ts` with both a runtime export and a type export:

```ts
export { SideNav } from "./side-nav/side-nav"
export type { SideNavProps } from "./side-nav/side-nav"
```

## Development Workflow

The intended sequence for every meaningful change:

```
edit code
  → /review              # contract-guardian + framework-compliance (catches issues early)
  → /sync-context        # update CLAUDE.md if design decisions or APIs changed
  → git commit
  → /review-full         # all 5 agents before opening a PR
  → /review-docs         # if you touched docs, demos, or MDX pages
  → /release-check       # before publishing a package version
```

**When `/sync-context` is required** (not optional):
- Added or removed a component, hook, or utility
- Changed a prop name, type, or default value
- Made a choice that could look wrong without knowing the reason (non-obvious design decision)
- Changed how a pattern should be used (correct/incorrect example update)

**When `/sync-context` can be skipped:**
- Pure bug fix with no API or pattern change
- Rename / typo / formatting
- Test file only changes

## Testing

- Per-package: `bun test` in each package directory
- All packages: `bun run test` at monorepo root
- UI: `bun run --cwd packages/ui test`
- E2E (Playwright): `bun run test:e2e`
- ⚠️ Never run `bun test --update-snapshots` unless explicitly intending to update — snapshot changes need review

## Anti-Patterns

- ❌ Importing from `@gridland/core` directly
- ❌ `tabIndex: disabled ? -1 : 0` alongside `disabled` in `useFocus`
- ❌ SDK-specific types in component prop interfaces
- ❌ `UIMessagePart` from `"@ai-sdk/react"` (must be from `"ai"`)
- ❌ `"tool-invocation"` part type (use `"dynamic-tool"`)
- ❌ Hardcoded hex colors outside of a named constant or theme
- ❌ Re-implementing `getNavigableEntries` or `getTopScope` instead of importing from `focus-reducer`
- ❌ Interactive component that doesn't call `useFocus` and attach `focusRef`
- ❌ Forgetting that `useFocus` inside a `FocusScope` auto-binds to that scope (pass `scopeId={null}` if global scope needed)

## Design Decisions

Non-obvious choices and the reasoning behind them. Read this before refactoring any of these patterns.

### `selectable` on `FocusScope` — scope declares Enter/Esc semantics, not the consumer

The `selectable` prop on `FocusScope` means the scope itself participates in the Enter/Esc lifecycle. Without this, a parent would need to intercept keyboard events and manually push/pop the scope, coupling the parent to focus internals. With `selectable`, the scope composition is self-contained: `<FocusScope trap selectable autoFocus>` is the complete declaration.

### `clearSelection: true` on `POP_SCOPE` when Esc exits a selectable scope

When a user presses Esc to leave a selectable scope, they are signalling intent to fully exit that context. If selection state were preserved, the previously-selected item would re-appear selected when the scope mounts again, which would be surprising. `clearSelection: true` ensures the scope starts fresh on re-entry.

### `getTopScope` exported from `focus-reducer`, not re-implemented in consumers

`getTopScope` and `getNavigableEntries` are the canonical way to inspect focus state. Exporting them from `focus-reducer` creates one source of truth. Any consumer that re-implements the "get top scope" logic (e.g., `state.scopes[state.scopes.length - 1]`) risks subtle divergence if the data structure changes. Import from `focus-reducer`, never re-derive.

### `interactingItemIdRef` in `SideNav` — decoupled from `activeIndex`

Tracking which item is "interacting" via `activeIndex` creates a timing bug: when `requestedActiveId` changes `activeIndex` programmatically, the `onSelectChange` handler for the old item fires `setIsInteracting(false)` before the new item can fire `setIsInteracting(true)`, causing a flash of `isInteracting=false`. The `interactingItemIdRef` stores the item's `id` rather than its index, so `onSelectChange(false)` only clears interaction if the deselecting item is actually the one that last set it — programmatic navigation leaves the ref unaffected.

### `requestedActiveId` prop on `SideNav` — declarative, not imperative

An imperative API (e.g., `ref.current.navigate(id)`) would require consumers to hold a ref and call methods in effect hooks, coupling them to the component lifecycle. `requestedActiveId` is a React prop: the parent just sets state and React propagates it. The `lastRequestedActiveIdRef` inside `SideNav` prevents the same value from triggering navigation twice on re-renders.

### `lastAutoNavIdRef` as a single ref, not a `Set`

When auto-navigating back to a previous conversation after Esc, only the most recent navigation matters. Using a `Set` to track "already navigated to" IDs would grow unbounded over a long session. A single ref that tracks the last auto-nav ID is sufficient because the guard only needs to prevent re-processing the same ID on consecutive renders.

### `autoSelect` on `FocusScope` — only fires for single-item scopes

`autoSelect` does not unconditionally select the first focusable item. It auto-selects only when all three conditions hold after mount: (1) there is exactly one focusable entry registered in the scope, (2) that entry is itself `selectable`, and (3) `FOCUS_NEXT` landed on it. For scopes with multiple focusable children, `autoSelect` is a no-op — the user must press Enter manually. This prevents unexpected auto-selection in lists or grids where Enter semantics should remain explicit.

### Spatial navigation forces a layout flush before hit-testing

Before computing which element is spatially closest in a given direction, `findSpatialTarget` calls `ensureLayoutComputed` to flush any pending yoga layout calculations. Without this, the first spatial nav keypress after a render can fail silently — yoga has computed sizes internally but not yet propagated positions to the node tree, so all rects appear at `(0,0)`. If spatial navigation seems broken only on the very first keypress, check whether a layout flush is being triggered.

### AI SDK agnosticism — `ChatStatus` is our own type

SDK-specific status types (e.g., from `@ai-sdk/react`) couple components to a specific vendor. Our `ChatStatus = "ready" | "submitted" | "streaming" | "error"` is defined in our codebase and mapped from whatever SDK the consumer uses. This allows the same components to work with any AI backend without modification.
