# Gridland

Gridland renders [opentui](https://github.com/nicosalm/opentui) React apps directly in the browser using HTML5 `<canvas>`, bypassing any terminal emulator.

## Quick start

```bash
# Create a new project
npx create-gridland my-app
cd my-app
bun install
bun run dev
```

You can choose between **Vite** and **Next.js** during setup.

## Add to an existing project

```bash
bun add @gridland/web @gridland/utils
```

Then wrap your app with the `<TUI>` component:

```tsx
import { TUI } from "@gridland/web"
import { useKeyboard } from "@gridland/utils"

function App() {
  return (
    <TUI style={{ width: "100vw", height: "100vh" }} backgroundColor="#1a1a2e">
      {/* your components */}
    </TUI>
  )
}
```

**Vite** — add the plugin to your `vite.config.ts`:

```ts
import { gridlandWebPlugin } from "@gridland/web/vite-plugin"

export default defineConfig({
  plugins: [react(), gridlandWebPlugin()],
})
```

**Next.js** — use the `@gridland/web/next` export and the webpack plugin:

```ts
// next.config.ts
import { withGridland } from "@gridland/web/next-plugin"
export default withGridland({})
```

```tsx
// component.tsx
"use client"
import { TUI } from "@gridland/web/next"
```

## UI components

Gridland includes a component registry (shadcn-style). Install individual components into your project:

```bash
bunx shadcn@latest add @gridland/spinner
```

Available components include Chat, Table, TextInput, SelectInput, Modal, Spinner, StatusBar, and more.

## Packages

| Package | Description |
|---------|-------------|
| `@gridland/web` | Core browser runtime — `<TUI>` component, canvas renderer, Vite/Next.js plugins |
| `@gridland/utils` | Shared hooks and types (`useKeyboard`, `useOnResize`, color utilities) |
| `@gridland/ui` | Component registry (shadcn-style, not installed directly) |
| `@gridland/testing` | Test utilities — `renderTui()`, `Screen` queries, `KeySender` |
| `@gridland/demo` | Demo framework and landing page |
| `@gridland/bun` | Native Bun runtime with FFI for terminal rendering |
| `create-gridland` | Project scaffolding CLI |

## Development (contributors)

```bash
git clone git@github.com:thoughtfulllc/gridland.git
cd gridland
bun setup

# Run the docs site
bun run dev

# Run tests
bun run test

# Run e2e tests
bun run test:e2e

# Build all packages
bun run build
```
