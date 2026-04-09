# Changelog

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
