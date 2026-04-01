---
name: create-component
description: Guide for creating a new UI component in @gridland/ui. Covers file structure, focus integration, keyboard handling, theme usage, JSDoc, and export registration.
---

# Creating a New UI Component

Follow this checklist when creating a new component in `packages/ui/components/`.

## 1. File structure

```
packages/ui/components/<component-name>/
  <component-name>.tsx       # Main component file
  index.ts                   # Re-export (optional, only if multiple files)
```

- Use kebab-case for directory and file names
- Use PascalCase for the component function and props interface

## 2. Component template

```tsx
// @ts-nocheck — only if using OpenTUI intrinsic elements (<box>, <text>, <span>)
import type { ReactNode } from "react"
import { textStyle } from "../text-style"
import { useTheme } from "../theme/index"

export interface MyComponentProps {
  /** JSDoc every prop — AI tools and docs generators read these. */
  children: ReactNode
}

/** One-line description of what the component does. */
export function MyComponent({ children }: MyComponentProps) {
  const theme = useTheme()
  // ...
}
```

Key rules:
- `// @ts-nocheck` at top ONLY when using `<box>`, `<text>`, `<span>` (OpenTUI elements)
- Import theme from `../theme/index`, use `textStyle()` for styling
- Never hardcode hex colors — use `theme.*` tokens or accept a color prop with theme fallback
- JSDoc on the props interface, every prop, and the component function

## 3. Focus integration (interactive components only)

Every interactive component must integrate with the focus system:

```tsx
import { useFocus, FocusScope, useShortcuts } from "@gridland/utils"

const { isFocused, isSelected, focusId, focusRef } = useFocus({ id, disabled })

// Attach ref to root <box> for spatial navigation
<box ref={focusRef}>...</box>

// Wrap nested interactive content
<FocusScope trap selectable autoFocus>
  {children}
</FocusScope>

// Register keyboard hints
useShortcuts([{ key: "enter", label: "select" }], focusId)
```

- `disabled` alone excludes from navigation — do NOT also set `tabIndex: -1`
- `useFocus` inside a `FocusScope` auto-binds to that scope

## 4. Keyboard handling

Accept `useKeyboard` as a prop with a context fallback:

```tsx
import { useKeyboardContext } from "../provider/provider"

export interface MyComponentProps {
  useKeyboard?: (handler: (event: any) => void) => void
}

// Inside the component:
const useKeyboard = useKeyboardContext(useKeyboardProp)
useKeyboard?.((event) => { /* handle keys */ })
```

## 5. Export registration

Add to `packages/ui/components/index.ts`:

```ts
export { MyComponent } from "./<component-name>/<component-name>"
export type { MyComponentProps } from "./<component-name>/<component-name>"
```

Both runtime export AND type export are required.

## 6. After creation

- Run `/review` to validate focus coverage and export conventions
- Run `/sync-context` to update CLAUDE.md with the new component
