# @gridland/ui — Component Library

## Component Catalog

| Component | Key Props |
|---|---|
| `SideNav` | `items`, `requestedActiveId`, `sidebarWidth`, `title`, `showStatusBar`, `children({ activeItem, isInteracting, captureKeyboard })`. Colors from `useTheme()` — focus indicators from `theme.focusSelected`/`focusFocused`/`focusIdle`, structural border from `theme.border` |
| `PromptInput` | `onSubmit`, `onStop`, `status`, `value`, `onChange`, `placeholder`, `disabled`, `focus`, `useKeyboard`, `dividerColor`, `dividerDashed`, `showDividers`, `model`, `commands`, `skills`, `files`. Compound: `PromptInput.Textarea`, `.Suggestions`, `.Submit`, `.Divider`, `.StatusText`, `.Model` |
| `Message` | `role`, `isStreaming`, `backgroundColor`. Named exports: `MessageContent`, `MessageText`, `MessageMarkdown` |
| `Modal` | `title`, `useKeyboard`, `onClose`, `borderColor`, `borderStyle` |
| `SelectInput` | `items`, `value`, `defaultValue`, `onChange`, `useKeyboard`, `onSubmit`, `disabled`, `limit` |
| `StatusBar` | `items` (from `useFocusedShortcuts`), `extra` |
| `ChainOfThought` | `open`, `defaultOpen`, `onOpenChange`. Sub: `ChainOfThoughtHeader`, `ChainOfThoughtContent`, `ChainOfThoughtStep` |
| `TextInput` | `value` (required), `label`, `onChange`, `onSubmit`, `placeholder`, `disabled`, `focus`, `maxLength` |
| `MultiSelect` | `items`, `selected`, `onChange`, `onSubmit`, `useKeyboard`, `limit`, `enableSelectAll`, `errorMessage` |
| `Table` | Compound: `TableRoot`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption` |
| `TabBar` | `options`, `selectedIndex` |
| `Tabs` | Compound: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` |
| `ChatPanel` | `messages`, `status`, `onSendMessage`, `onStop`, `placeholder`, `focus`, `useKeyboard` |
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
- Import `textStyle` from `"../text-style"` — never recreate the bitmask logic
- Use `useTheme()` from `"../theme/index"` — never hardcode hex colors
- Compound components use named exports (e.g., `MessageContent`, `MessageText`). Legacy `Component.Sub` pattern is deprecated.
- Props interface named `{ComponentName}Props` with JSDoc on every prop
