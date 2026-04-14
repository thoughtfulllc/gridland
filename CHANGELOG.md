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
and `useShortcuts` into one hook. It lives in `@gridland/utils` (published to
npm), so consumers get bug fixes through `bun update` without re-running the
shadcn registry. The theme-aware focus border styling that used to bundle into
the same return object is now a separate concern — call `useFocusBorderStyle`
alongside it, or use the `useInteractiveStyled` wrapper from `@gridland/ui` for
the one-hook ergonomic (see below).

```tsx
import { useInteractive } from "@gridland/utils"
import { useFocusBorderStyle } from "@/lib/theme"

const interactive = useInteractive({
  id: "my-component",
  autoFocus,
  disabled,
  shortcuts: ({ isSelected }) =>
    isSelected
      ? [{ key: "⏎", label: "submit" }, { key: "esc", label: "back" }]
      : [{ key: "enter", label: "select" }],
})

const { borderColor, borderStyle } = useFocusBorderStyle({
  isFocused: interactive.isFocused,
  isSelected: interactive.isSelected,
  isAnySelected: interactive.isAnySelected,
})

interactive.onKey((event) => {
  if (event.name === "return") handleSubmit()
})

return (
  <box
    ref={interactive.focusRef}
    border
    borderStyle={borderStyle}
    borderColor={borderColor}
  >
    ...
  </box>
)
```

**New registry wrapper: `useInteractiveStyled`**

Ships as `registry:hook` (`@gridland/use-interactive-styled`). Thin wrapper
over `useInteractive` that bundles the themed focus border back in:

```tsx
import { useInteractiveStyled } from "@/hooks/use-interactive-styled"

const { focusRef, borderColor, borderStyle } = useInteractiveStyled({ id })
return <box ref={focusRef} border borderColor={borderColor} borderStyle={borderStyle} />
```

Because it depends on the theme, it must live in the shadcn registry (not in
`@gridland/utils`). Install via `bunx shadcn@latest add @gridland/use-interactive-styled`.

**Why the split:** the pre-split `useInteractive` lived in the shadcn registry
because it imported `useFocusBorderStyle` from the theme item. That made the
primitive user-forkable on install — bug fixes stopped propagating and the API
was frozen to whatever shape each consumer had copied. Moving the pure
composition into `@gridland/utils` fixes both: the npm package is versioned and
update-propagating; the theme-dependent piece stays forkable because it's
the theme-shaped piece that users most want to customize.

**Removed registry items**

- `@gridland/use-interactive` — no longer a registry item. Import the primitive
  from `@gridland/utils` instead. Any component that previously read
  `borderColor`/`borderStyle` off the return value should now either call
  `useFocusBorderStyle` separately or migrate to `useInteractiveStyled`.

**Migration**

```diff
- import { useInteractive } from "@/registry/gridland/hooks/use-interactive"
- const interactive = useInteractive({ id })
- const { borderColor, borderStyle } = interactive  // used to be bundled
+ import { useInteractive } from "@gridland/utils"
+ import { useFocusBorderStyle } from "@/lib/theme"
+ const interactive = useInteractive({ id })
+ const { borderColor, borderStyle } = useFocusBorderStyle({
+   isFocused: interactive.isFocused,
+   isSelected: interactive.isSelected,
+   isAnySelected: interactive.isAnySelected,
+ })
```

Or, to keep the one-hook ergonomic:

```diff
- import { useInteractive } from "@/registry/gridland/hooks/use-interactive"
- const { focusRef, borderColor, borderStyle } = useInteractive({ id })
+ import { useInteractiveStyled } from "@/hooks/use-interactive-styled"
+ const { focusRef, borderColor, borderStyle } = useInteractiveStyled({ id })
```

The three in-monorepo consumers (`SelectInput`, `MultiSelect`, `TextInput`) did
not read the theme-coupled fields, so they migrated to the pure primitive with
a one-line import change.

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
