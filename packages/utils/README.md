# @gridland/utils

Portable hooks and utilities for [Gridland](https://gridland.io) — the React framework for building terminal apps that run in the browser and the terminal.

This package has no native dependencies and can be used in both terminal and browser environments. It's the shared foundation for `@gridland/web` (browser renderer) and `@gridland/bun` (terminal runtime).

## Install

```bash
bun add @gridland/utils
```

## What's in here

**Hooks**
- `useKeyboard(handler, options?)` — global keyboard listener
- `useCapturedKeyboard(focusId)` — keyboard scoped to a focused element
- `useTerminalDimensions()` — `{ width, height }` in terminal cells
- `useOnResize(callback)` — runs on resize events
- `useTimeline(options?)` — animation timeline

**Focus system**
- `FocusProvider`, `FocusScope` — wrap your app to enable keyboard navigation
- `useFocus({ id, tabIndex, autoFocus, disabled })` — register a focusable element
- `useShortcuts(shortcuts, focusId)` — register keyboard shortcut hints
- `useFocusedShortcuts()` — active shortcuts for the currently focused element

**Runtime context**
- `RuntimeProvider` / `useRuntime()` — detect `"terminal"` vs `"browser"` at runtime
- `isBrowser()`, `isCanvasSupported()` — environment checks

**Color utilities**
- `RGBA`, `parseColor`, `hexToRgb`, `rgbToHex`, `hsvToRgb`

## Example

```tsx
import { useKeyboard, useFocus, FocusProvider } from "@gridland/utils"

function Button() {
  const { isFocused, focusRef } = useFocus({ id: "submit" })
  useKeyboard((key) => {
    if (isFocused && key.name === "return") submit()
  })
  return <box ref={focusRef} border>Submit</box>
}

function App() {
  return (
    <FocusProvider selectable>
      <Button />
    </FocusProvider>
  )
}
```

## Documentation

Full docs at [gridland.io/docs](https://gridland.io/docs)

Source: [github.com/thoughtfulllc/gridland](https://github.com/thoughtfulllc/gridland)
