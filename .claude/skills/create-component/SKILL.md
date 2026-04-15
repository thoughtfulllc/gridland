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
import { textStyle } from "@/registry/gridland/lib/text-style"
import { useTheme } from "@/registry/gridland/lib/theme"

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
- Import theme from `"@/registry/gridland/lib/theme"`, use `textStyle()` for styling
- Use the `@/registry/gridland/{ui,lib,hooks}/*` alias form for every intra-package import; shadcn's CLI rewrites these to the user's `components.json` aliases at install time
- Never hardcode hex colors — use `theme.*` tokens or accept color prop
- JSDoc on props interface, every prop, and component function

## 3. Focus integration (interactive components only)

```tsx
import { useInteractive, FocusScope } from "@gridland/utils"

const { isFocused, isSelected, focusId, focusRef, onKey } = useInteractive({
  id,
  disabled,
  shortcuts: [{ key: "enter", label: "select" }],
})

// Attach focusRef to root element
<box ref={focusRef}>...</box>

// Wrap nested interactive content
<FocusScope trap selectable autoFocus>{children}</FocusScope>

// Handle keys while selected (fires only when isSelected)
onKey((e) => {
  if (e.name === "return") submit()
})
```

- `disabled` alone excludes from navigation — do NOT also set `tabIndex: -1`
- `useInteractive` inside `FocusScope` auto-binds to that scope (pass `scopeId={null}` for global scope)
- Display-only wrappers that share a `focusId` with an inner interactive child should call `useInteractive({ id })` without `shortcuts` and without `onKey` — the internal dispatch is a no-op so the inner component's shortcuts survive

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

1. Create the core demo in `packages/demo/demos/<component-name>.tsx` — export a named app component (e.g., `export function MyComponentApp()`)
2. Register it in `packages/demo/demos/index.tsx` (import, re-export, and add to `demos` array)
3. Create a doc page at `packages/docs/content/docs/components/<component-name>.mdx`
4. If the MDX page needs multiple demo variants, create a thin wrapper at `packages/docs/components/demos/<component-name>-demo.tsx` that imports from `@demos/<component-name>`

Interactive components need interactive demos with `useState` + `useKeyboard`.

## 7. After creation

- Run `/review` to validate focus coverage and export conventions
- Run `/sync-context` to update `packages/ui/CLAUDE.md` with the new component
