---
name: create-component
description: Guide for creating a new UI component in @gridland/ui. Covers file structure, focus integration, keyboard handling, theme usage, JSDoc, export registration, and documentation.
---

Guide for creating a new UI component in `@gridland/ui`.

## 1. File structure

```
packages/ui/components/<component-name>/
  <component-name>.tsx       # Main component file
```

- Use kebab-case for directory/file names
- Use PascalCase for component function and props interface

## 2. Component template

```tsx
// @ts-nocheck — only if using OpenTUI intrinsic elements (<box>, <text>, <span>)
import type { ReactNode } from "react"
import { textStyle } from "../text-style"
import { useTheme } from "../theme/index"

export interface MyComponentProps {
  /** JSDoc every prop — agents and docs generators read these. */
  children: ReactNode
}

/** One-line description of what the component does. */
export function MyComponent({ children }: MyComponentProps) {
  const theme = useTheme()
  // ...
}
```

- `// @ts-nocheck` at top ONLY when using `<box>`, `<text>`, `<span>`
- Import theme from `"../theme/index"`, use `textStyle()` for styling
- Never hardcode hex colors — use `theme.*` tokens or accept color prop
- JSDoc on props interface, every prop, and component function

## 3. Focus integration (interactive components only)

```tsx
import { useFocus, FocusScope, useShortcuts } from "@gridland/utils"

const { isFocused, isSelected, focusId, focusRef } = useFocus({ id, disabled })

// Attach focusRef to root element
<box ref={focusRef}>...</box>

// Wrap nested interactive content
<FocusScope trap selectable autoFocus>{children}</FocusScope>

// Register keyboard shortcuts
useShortcuts([{ key: "enter", label: "select" }], focusId)
```

- `disabled` alone excludes from navigation — do NOT also set `tabIndex: -1`
- `useFocus` inside `FocusScope` auto-binds to that scope

## 4. Keyboard handling

```tsx
import { useKeyboardContext } from "../provider/provider"

export interface MyComponentProps {
  useKeyboard?: (handler: (event: any) => void) => void
}

const useKeyboard = useKeyboardContext(useKeyboardProp)
useKeyboard?.((event) => { /* handle keys */ })
```

## 5. Export registration

In `packages/ui/components/index.ts`:
```ts
export { MyComponent } from "./<component-name>/<component-name>"
export type { MyComponentProps } from "./<component-name>/<component-name>"
```

Both runtime export AND type export required.

## 6. Documentation

Create a doc page at `packages/docs/content/docs/components/<component-name>.mdx` and a demo at `packages/docs/components/demos/<component-name>-demo.tsx`. Interactive components need interactive demos with `useState` + `useKeyboard`.

## 7. After creation

- Run `/review` to validate focus coverage and export conventions
- Run `/sync-context` to update `packages/ui/CLAUDE.md` with the new component
