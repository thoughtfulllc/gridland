# @gridland/web

Browser renderer for Gridland. Renders React-based TUI components to an HTML5 canvas.

## Install

```bash
npm install @gridland/web
```

## TypeScript Setup

Gridland uses custom JSX elements (`<box>`, `<text>`, `<span>`, etc.) that aren't standard HTML. To get type-checking and autocomplete, add the JSX type declarations to your `tsconfig.json`:

```json
{
  "include": ["src", "node_modules/@gridland/web/src/gridland-jsx.d.ts"]
}
```

Or add a triple-slash reference in any `.d.ts` file in your project:

```ts
/// <reference types="@gridland/web/jsx" />
```

This handles React 19 compatibility automatically — no conflicts with built-in `IntrinsicElements`.

## Usage

```tsx
import { TUI } from "@gridland/web"

function App() {
  return (
    <TUI style={{ width: "100vw", height: "100vh" }}>
      <box border borderStyle="rounded" padding={1}>
        <text fg="#a3be8c">Hello, Gridland!</text>
      </box>
    </TUI>
  )
}
```

See the [documentation](https://gridland.dev) for full setup guides (Vite, Next.js) and component reference.
