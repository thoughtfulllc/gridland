# @gridland/bun

Bun-native terminal runtime for [Gridland](https://gridland.io) — run React TUI apps in your terminal via Bun's FFI bridge to the OpenTUI rendering engine.

This is the package you install when you want your React app to render in an actual terminal (as opposed to the browser, which uses `@gridland/web`). It ships with platform-specific native binaries as optional dependencies so only the right one for your OS/arch is downloaded.

## Requirements

- [Bun](https://bun.sh) 1.0 or later (terminal runtime needs Bun's FFI support)

## Install

```bash
bun add @gridland/bun
```

## Usage

```tsx
// src/app.tsx
import { createCliRenderer } from "@gridland/bun"

function App() {
  return (
    <box border padding={1}>
      <text>Hello from the terminal</text>
    </box>
  )
}

createCliRenderer(<App />)
```

```bash
bun src/app.tsx
```

## Compile to a standalone binary

No runtime required — users don't need Bun, Node, or npm installed:

```bash
bun build --compile src/app.tsx --outfile my-app
./my-app
```

## Supported platforms

- macOS (x64, arm64)
- Linux (x64, arm64)

## Documentation

Full docs at [gridland.io/docs](https://gridland.io/docs)

Source: [github.com/thoughtfulllc/gridland](https://github.com/thoughtfulllc/gridland)
