# Changelog

## Unreleased — Focus system unification

### Breaking changes (`@gridland/ui`, `@gridland/utils`)

Every interactive component now integrates with the focus system through a
single primitive — `useInteractive` for selectable components, or the raw
`useFocus` + `useKeyboard` pair for focused-is-interactive components. The
legacy `useKeyboard` prop is gone from every component.

**Removed APIs**

- `useCapturedKeyboard` — deleted from `@gridland/utils`. Replaced by
  `useInteractive`'s built-in `onKey(handler)` ref-swap mechanism.
- `useKeyboardContext` — deleted from `@gridland/ui`. Components register
  with the focus system directly instead of reading a hook from context.
- `useKeyboard` prop on `GridlandProvider` — deleted. The provider now
  wraps children in a `<FocusProvider selectable>` implicitly.
- `useKeyboard` prop on **every** interactive component — deleted from
  `SelectInput`, `MultiSelect`, `Modal`, `TabBar`, `TabsList`, `PromptInput`,
  `SideNav`, `TextInput`, `SpinnerPicker`, `LinkDemo`.
- `focus` prop on `TextInput` — deleted. Rendering of the `<input>`
  intrinsic is now driven by `isSelected` from the focus system.
- `captureKeyboard` on `SideNav`'s children render-prop — deleted. The
  signature is now `{ activeItem, isInteracting }`. Panel content uses
  its own focus-system registrations instead.

**New primary primitive**

`useInteractive` — composes `useFocus`, `useKeyboard({ focusId, selectedOnly: true })`,
`useShortcuts`, and theme-aware focus border styling into one hook.
Shipped as `registry:hook` (`@gridland/use-interactive` in the shadcn
registry), exported from `@gridland/ui` as a named import.

```tsx
const interactive = useInteractive({
  id: "my-component",
  autoFocus,
  disabled,
  shortcuts: ({ isSelected }) =>
    isSelected
      ? [{ key: "⏎", label: "submit" }, { key: "esc", label: "back" }]
      : [{ key: "enter", label: "select" }],
})

interactive.onKey((event) => {
  if (event.name === "return") handleSubmit()
})

return (
  <box
    ref={interactive.focusRef}
    border
    borderStyle={interactive.borderStyle}
    borderColor={interactive.borderColor}
  >
    ...
  </box>
)
```

**New component props**

Every interactive component now accepts:
- `focusId?: string` — stable id for the focus system, auto-generated if omitted
- `autoFocus?: boolean` — focus on mount

**Migration examples**

Before:
```tsx
<GridlandProvider theme={darkTheme} useKeyboard={useKeyboard}>
  <FocusProvider selectable>
    <SelectInput items={items} useKeyboard={useKeyboard} />
  </FocusProvider>
</GridlandProvider>
```

After:
```tsx
<GridlandProvider theme={darkTheme}>
  <SelectInput focusId="lang" autoFocus items={items} />
</GridlandProvider>
```

Before:
```tsx
const { focusId } = useFocus({ id: "prompt" })
const capture = useCapturedKeyboard(focusId)
return (
  <PromptInput useKeyboard={capture} focus={isSelected} />
)
```

After:
```tsx
return <PromptInput focusId="prompt" autoFocus />
```

### Internal

- Every migrated component attaches `interactive.focusRef` (or `focusRef`
  from `useFocus`) to its root `<box>` for spatial-navigation hit-testing.
- `useInteractive` exposes `disabled` which forwards to `useFocus` — disabled
  components are skipped by Tab navigation without needing a separate
  `tabIndex: -1` override.
- `KeySender.pressWith(char, modifiers)` added to `@gridland/testing` so
  tests can dispatch ctrl/meta/shift/option-keyed events without reaching
  into private internals.

## 0.2.55

### Breaking changes (`@gridland/ui`)

These changes are breaking for consumers of `@gridland/ui < 0.2.55` but ship under a non-major version because no monorepo-internal call sites remained on the old APIs.

**Removed components**

- `ChatPanel` (and types `ChatPanelProps`, `ChatMessage`, `ToolCallInfo`) — replaced by the new `PromptInput` + `Message` compound APIs.
- `CornerRibbon`, `BadgeButton`, `TextBadge`
- `GridlandCornerRibbon`, `GridlandBadgeButton`, `GridlandTextBadge`

Migration: compose the new primitives (`PromptInput`, `Message`, `MessageContent`, `MessageText`, `MessageMarkdown`) directly, or inline the small ribbon/badge markup in your app.

**`Table` refactored to a compound API**

- Old: `<Table data={...} />`
- New: `TableRoot`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`
- `padCell` now accepts an optional `align` parameter (`"left"` default — backward compatible).

**`TabBar` augmented with a compound `Tabs` API**

- New exports: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- Legacy `TabBar` export is preserved — existing consumers are unaffected.

### Additions

- `PromptInput` component + compound API (textarea, suggestions, submit, divider, status text, model)
- `ChainOfThought` component + compound API
- `Message` component + `MessageContent` / `MessageText` / `MessageMarkdown`
- `SideNav` component
- `GridlandProvider` root provider
- `ThemeProvider` now exposes `useFocusBorderStyle` and `useFocusDividerStyle` hooks
- `Spinner`: new `SpinnerStatus` type and `VARIANT_NAMES` constant
- `@gridland/utils` first public API — 102 exports including `useFocus`, `FocusProvider`, `FocusScope`, `useKeyboard`, `useShortcuts`, `useCapturedKeyboard`, `getFocusBorderStyle`, `getFocusDividerStyle`, `FOCUS_BORDER_COLORS`

### Fixes

- Externalized `react-reconciler` in the browser bundle to match the host React mode (fixes production-mode breakage).
- Synced `@gridland/ui` package version from `0.2.20` to `0.2.55` to align with the rest of the monorepo.
- Relaxed `@gridland/ui` peer dependency on `@gridland/utils` from `>=0.3.0` to `>=0.2.55`.

### Docs

- Fixed `borderStyle` type in `packages/docs/content/docs/components/primitives.mdx` (`"bold"` → `"heavy"`).
