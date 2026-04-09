# @gridland/testing

Test utilities for [Gridland](https://gridland.io) components — render a TUI component in a test environment and assert against its rendered output.

Works with any test runner (Bun test, Jest, Vitest). Provides a React-Testing-Library-style API adapted for terminal UIs: query by text, send keys, wait for conditions.

## Install

```bash
bun add -d @gridland/testing
```

## API

- `renderTui(element, options?)` → `TuiInstance` — mount a component in a virtual terminal
- `Screen` — query helpers: find text, inspect cells, dump the framebuffer
- `KeySender` — simulate keyboard input (arrows, tab, enter, typed characters)
- `waitFor(predicate, options?)` — async assertion helper with retry

## Example

```ts
import { renderTui, waitFor } from "@gridland/testing"
import { Counter } from "./counter"

test("counter increments on space", async () => {
  const { screen, keys, cleanup } = renderTui(<Counter />)

  expect(screen.findText("count: 0")).toBeTruthy()

  keys.press("space")
  await waitFor(() => screen.findText("count: 1"))

  cleanup()
})
```

## Documentation

Full docs at [gridland.io/docs](https://gridland.io/docs)

Source: [github.com/thoughtfulllc/gridland](https://github.com/thoughtfulllc/gridland)
