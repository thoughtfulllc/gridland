# @gridland/ui — Component Library

`@gridland/ui` is `"private": true` and never published to npm. End users get its contents by running the upstream shadcn CLI against the registry served at `https://gridland.io/r/{name}.json`. The package exists as the authoritative source the registry builder reads from; inside the monorepo other packages (docs, demo) import it through the workspace alias.

## Directory layout

```
packages/ui/
├── components/        Component source — one directory per component
│   ├── side-nav/side-nav.tsx
│   ├── spinner/spinner.tsx
│   └── ...
├── lib/               Shared utilities (emitted as registry:lib)
│   ├── text-style.ts      Bitmask helper for OpenTUI text attributes
│   └── theme/             Theme types, themes, provider, and focus-style hooks
├── hooks/             Shared hooks (emitted as registry:hook)
│   └── use-breakpoints.ts
├── scripts/
│   └── build-registry.ts  Reads source files verbatim, writes JSON to ../docs/public/r/
├── package.json       No main/exports/files — this package ships no compiled output
└── tsconfig.json      Declares the @/registry/gridland/* path aliases
```

The three subfolders map to shadcn's item types: `components/` → `registry:ui`, `lib/` → `registry:lib`, `hooks/` → `registry:hook`. Shadcn's CLI uses the item type to decide which `components.json` alias to write the file into on the end user's disk (`@/components/ui`, `@/lib`, `@/hooks`).

## Build

```bash
bun run --cwd packages/ui build    # runs scripts/build-registry.ts
```

There is **no** tsup, no bundler, no `dist/` directory. The only build output is the set of JSON files under `packages/docs/public/r/`.

## `exports` points at source, not `dist/`

`package.json` declares `"exports": { ".": "./components/index.ts" }` — pointing at the barrel source file, not a compiled artifact. Bun's workspace resolver honors this when sibling packages (`packages/demo/`, tests, etc.) `import { ... } from "@gridland/ui"`. There is no `main`, no `types`, no `files` field, and no `dist/` output — nothing is bundled. The docs site does not rely on this entry because `packages/docs/next.config.ts` aliases `@gridland/ui` to the same source path directly.

## Do NOT re-add

These artifacts were deleted on purpose during the `make-it-better` registry refactor. Do not recreate them:

- `packages/ui/tsup.config.ts` — nothing ever imported a bundled output; workspace siblings read source directly via the `exports` entry above
- `packages/ui/dist/` — there is no build step that produces compiled JS in this package
- `packages/ui/registry/` — was a staging folder for build-time-rewritten TSX + intermediate JSON. Source now uses `@/registry/gridland/*` aliases directly, so there's nothing to stage
- `packages/ui/registry.json` — intermediate index, replaced by `packages/docs/public/r/index.json`
- `packages/docs/scripts/copy-registry.ts` — its entire job was copying files out of `packages/ui/registry/`; the builder now writes directly to the docs site

If you find yourself wanting any of these back, something is probably already wrong with the approach. Check `.claude/rules/registry-pipeline.md`.

## Component Catalog

| Component | Key Props |
|---|---|
| `SideNav` | `items`, `requestedActiveId`, `onActiveItemChange`, `sidebarWidth`, `title`, `showStatusBar`, `children({ activeItem, isInteracting })`. Colors from `useTheme()` — focus indicators from `theme.focusSelected`/`focusFocused`/`focusIdle`, structural border from `theme.borderMuted`, title/header from `theme.primary` |
| `PromptInput` | `focusId`, `autoFocus`, `onSubmit`, `onStop`, `status`, `value`, `onChange`, `placeholder`, `disabled`, `dividerColor`, `dividerDashed`, `showDividers`, `model`, `commands`, `skills`, `files`. Compound: `PromptInput.Textarea`, `.Suggestions`, `.Submit`, `.Divider`, `.StatusText`, `.Model` |
| `Message` | `role`, `isStreaming`, `backgroundColor`. Named exports: `MessageContent`, `MessageText`, `MessageMarkdown` |
| `Modal` | `title`, `onClose`, `borderColor`, `borderStyle` (Escape handling wired internally via `useKeyboard`) |
| `SelectInput` | `focusId`, `autoFocus`, `items`, `value`, `defaultValue`, `onChange`, `onSubmit`, `disabled`, `limit` |
| `StatusBar` | `items` (from `useFocusedShortcuts`), `extra` |
| `ChainOfThought` | `open`, `defaultOpen`, `onOpenChange`. Sub: `ChainOfThoughtHeader`, `ChainOfThoughtContent`, `ChainOfThoughtStep` |
| `TextInput` | `focusId`, `autoFocus`, `value` (required), `label`, `onChange`, `onSubmit`, `placeholder`, `disabled`, `maxLength` |
| `MultiSelect` | `focusId`, `autoFocus`, `items`, `selected`, `onChange`, `onSubmit`, `limit`, `enableSelectAll`, `errorMessage` |
| `Table` | Compound: `TableRoot`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption` |
| `TabBar` | `focusId`, `autoFocus`, `options`, `selectedIndex`, `onValueChange` |
| `Tabs` | Compound: `Tabs`, `TabsList` (with `focusId`/`autoFocus`), `TabsTrigger`, `TabsContent` |
| `Link` | `url`, `children`, `underline`, `color` |
| `Ascii` | `text`, `font`, `color` |
| `Spinner` | `variant`, `text`, `color`, `status` |
| `Gradient` | `children`. Helper: `GRADIENTS` constant |
| `GridlandProvider` | Root provider for theme + keyboard context |
| `ThemeProvider` | Theme wrapper. Exports: `darkTheme`, `lightTheme`, `useTheme` |
| `TerminalWindow` | `title`, `children` (HTML/web component for docs) |

## Conventions

- Every component must be exported from `packages/ui/components/index.ts` with both runtime and type exports
- `// @ts-nocheck` at the top of any file using OpenTUI intrinsic elements (`<box>`, `<text>`, `<span>`)
- Import `textStyle` from `"@/registry/gridland/lib/text-style"` — never recreate the bitmask logic
- Use `useTheme()` from `"@/registry/gridland/lib/theme"` — never hardcode hex colors
- Use the `@/registry/gridland/{ui,lib,hooks}/*` alias form for every intra-package import (provider, theme, text-style, status-bar, hooks). Never write `../../lib/...` or `../theme/index` — shadcn's CLI won't rewrite relative paths at install time and users with non-default aliases will get broken imports.
- Compound components use named exports (e.g., `MessageContent`, `MessageText`). Legacy `Component.Sub` pattern is deprecated.
- Props interface named `{ComponentName}Props` with JSDoc on every prop
