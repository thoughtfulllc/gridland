# Gridland Monorepo Plan

## Overview

Recreate the ink-web monorepo architecture for opentui-web, with these key improvements:
- **Dramatically simpler mounting** — canvas-based rendering needs no xterm.js, no stream shims, no ANSI filtering
- **No ugly wrappers** — a single `<OpenTuiCanvas>` component replaces InkTerminalBox → InkXterm → mountInkInXterm chain
- **SSR-safe without dynamic imports** — canvas is just an HTML element, use `"use client"` + a simple browser check instead of `next/dynamic`

## Architecture

```
React JSX → @opentui/react reconciler → Renderable tree → Yoga layout
  → renderSelf() writes to BrowserBuffer (TypedArrays)
  → CanvasPainter reads buffer → ctx.fillRect + ctx.fillText
  → HTML5 Canvas
```

vs ink-web's chain:
```
React JSX → Ink reconciler → ANSI strings → xterm.js Terminal → Canvas
```

Our approach is fundamentally simpler — we go directly from the reconciler to canvas with no terminal emulator in between.

## Package Structure

```
opentui-web/
├── packages/
│   ├── opentui-web/          # Core browser runtime (npm: opentui-web)
│   │   ├── src/
│   │   │   ├── index.ts          # Main exports (bundled mode)
│   │   │   ├── core.ts           # Core exports (external mode for Vite plugin users)
│   │   │   ├── OpenTuiCanvas.tsx  # Single React component — THE mounting layer
│   │   │   ├── mount.ts          # Imperative mount API: mountOpenTui(canvas, element)
│   │   │   ├── browser-buffer.ts
│   │   │   ├── browser-text-buffer.ts
│   │   │   ├── browser-text-buffer-view.ts
│   │   │   ├── browser-renderer.ts
│   │   │   ├── browser-render-context.ts
│   │   │   ├── canvas-painter.ts
│   │   │   ├── selection-manager.ts
│   │   │   ├── hooks.ts          # useFileDrop, usePaste, useRenderer
│   │   │   ├── vite-plugin.ts    # Vite plugin for shim resolution
│   │   │   ├── next.ts           # Next.js export (thin — just "use client" re-export)
│   │   │   ├── utils.ts          # SSR-safe utilities
│   │   │   ├── core-shims/       # @opentui/core browser replacements
│   │   │   └── shims/            # Node.js built-in stubs
│   │   ├── test/
│   │   │   └── preload.ts        # Test setup (happy-dom for canvas mocking)
│   │   └── tsup.config.ts        # Build config
│   │
│   ├── opentui-ui/               # UI component library
│   │   ├── components/           # Components with tests
│   │   │   ├── gradient/
│   │   │   ├── spinner/
│   │   │   ├── text-input/
│   │   │   ├── select-input/
│   │   │   ├── multi-select/
│   │   │   ├── table/
│   │   │   ├── link/
│   │   │   └── ascii/
│   │   ├── registry/             # shadcn-style registry
│   │   └── scripts/build-registry.ts
│   │
│   └── opentui-testing/          # Testing utilities
│       ├── src/
│       │   ├── index.ts
│       │   ├── render-tui.ts     # renderTui() — main test API
│       │   ├── screen.ts         # Screen queries (reads buffer, not ANSI)
│       │   ├── keys.ts           # Key sender for input simulation
│       │   └── wait-for.ts       # Async polling helper
│       └── tests/
│           └── framework.test.tsx
│
├── docs/                         # Fumadocs documentation site
│   ├── content/docs/
│   │   ├── getting-started.mdx
│   │   ├── components.mdx
│   │   ├── testing.mdx
│   │   ├── vite.mdx
│   │   └── nextjs.mdx
│   └── ...
│
├── .github/workflows/test.yml    # CI: test with --randomize --rerun-each 3
├── AGENTS.md
└── package.json                  # Bun workspaces root
```

## Phase 1: Project Setup & Core Package Migration

### 1.1 Branch & Monorepo Scaffold
- Create branch `monorepo` from current main
- Set up root package.json with bun workspaces
- Set up root tsconfig.json
- Create AGENTS.md with development guidelines

### 1.2 Migrate PoC into packages/opentui-web/
- Move existing `src/` files into `packages/opentui-web/src/`
- Move existing `__tests__/` into `packages/opentui-web/src/` (colocate tests)
- Move `vite.config.ts` shim logic into `vite-plugin.ts`
- Convert from vitest to bun:test
- Set up tsup build with multiple entry points:
  - `index.ts` — bundled mode (bundles shims + reconciler deps)
  - `core.ts` — core mode (externalizes more for vite plugin users)
  - `vite-plugin.ts` — node platform
  - `next.ts` — Next.js support
  - `utils.ts` — SSR-safe utilities

### 1.3 Design the Simplified Mounting API

**The `<OpenTuiCanvas>` Component** (replaces InkTerminalBox + InkXterm + dynamic imports):

```tsx
// Usage in any React app:
import { OpenTuiCanvas } from "opentui-web"

function App() {
  return (
    <OpenTuiCanvas
      style={{ width: "100%", height: 400 }}
      fontSize={14}
      fontFamily="JetBrains Mono"
      autoFocus
    >
      <box border borderStyle="rounded">
        <text>Hello from OpenTUI!</text>
      </box>
    </OpenTuiCanvas>
  )
}
```

**Key design decisions:**
- Children are OpenTUI JSX — the component handles all mounting internally
- Auto-resizes with ResizeObserver (no manual cols/rows)
- Font configuration via props (sensible defaults)
- No dynamic imports needed — canvas is just an HTML element
- `autoFocus` prop for keyboard focus (replaces ink-web's `focus` prop)
- Returns a `<div>` containing a `<canvas>` — standard DOM

**Imperative API** for advanced use:
```tsx
import { mountOpenTui } from "opentui-web"

const canvas = document.getElementById("my-canvas")
const { unmount, resize } = mountOpenTui(canvas, <App />)
```

**Next.js usage** — just a `"use client"` re-export, no dynamic imports:
```tsx
// app/page.tsx
"use client"
import { OpenTuiCanvas } from "opentui-web/next"  // same component, "use client" directive

export default function Page() {
  return (
    <OpenTuiCanvas style={{ width: "100%", height: "100vh" }}>
      <box><text>Works in Next.js!</text></box>
    </OpenTuiCanvas>
  )
}
```

Why this works without dynamic imports:
- Canvas is a standard HTML element (no heavy library to lazy-load)
- The component renders `null` or a placeholder during SSR (checks `typeof window`)
- Hydration picks up the canvas seamlessly
- No xterm.js CSS to import separately

## Phase 2: Testing Package

### 2.1 opentui-testing API Design

```tsx
import { renderTui, cleanup } from "opentui-testing"

afterEach(() => cleanup())

test("renders text", async () => {
  const { screen, keys, waitFor, unmount } = renderTui(
    <box><text>Hello</text></box>
  )

  // Screen queries read from BrowserBuffer (not ANSI strings)
  expect(screen.text()).toContain("Hello")
  expect(screen.contains("Hello")).toBe(true)

  // Key input simulation
  keys.type("world")
  keys.enter()

  // Async waiting
  await waitFor("Result:")
  await waitFor(() => expect(screen.text()).toContain("done"))

  // Frame history
  expect(screen.frames().length).toBeGreaterThan(0)
})
```

**Key difference from ink-testing:** We read buffer cells directly instead of parsing ANSI text. This is more reliable and gives us exact positioning info.

### 2.2 Implementation
- `renderTui(node)` — creates BrowserRenderer with mock canvas, mounts component
- `Screen` — reads BrowserBuffer's `getSpanLines()` for text content
- `KeySender` — dispatches key events through BrowserRenderContext
- `waitFor` — polls screen content or assertion function
- `cleanup` — unmounts all instances

## Phase 3: UI Components

Port @opentui/ui components and add tests:
- Gradient (color gradient text)
- Spinner (animated loading)
- TextInput (text field)
- SelectInput (single select)
- MultiSelect (multi-select checkboxes)
- Table (data table)
- Link (clickable link)
- Ascii (ASCII art)

Each component gets:
- Source in `components/{name}/{name}.tsx`
- Test in `components/{name}/{name}.test.tsx`
- Registry JSON for shadcn-style installation

## Phase 4: Documentation

Set up Fumadocs site with:
- Getting Started (installation, first app)
- OpenTuiCanvas API reference
- Vite integration guide
- Next.js integration guide
- Testing guide
- Component documentation
- Architecture overview

## Phase 5: Examples

### 5.1 Vite Example
- Minimal Vite + React project
- Uses vite plugin
- Demonstrates components

### 5.2 Next.js Example
- Next.js 16 app
- Shows SSR-safe usage
- No dynamic imports needed

## Phase 6: Verification & Testing

### 6.1 Test Strategy
- All tests use bun:test
- CI runs: `bun test --randomize --rerun-each 3` for each package
- Test categories:
  - **Unit**: Buffer, TextBuffer, Painter, individual utilities
  - **Component**: UI components via opentui-testing
  - **Integration**: Full render pipeline (mount → render → paint)
  - **Browser**: Playwright tests against running Vite/Next.js apps

### 6.2 Verification Checklist
- [ ] `bun test --randomize --rerun-each 3` passes for all packages
- [ ] `bun run build` succeeds for all packages
- [ ] Vite example: `bun run dev` starts, renders correctly, keyboard works
- [ ] Next.js example: `bun run dev` starts, SSR works, hydration works
- [ ] Playwright: automated verification of rendered output
- [ ] No flaky tests (rerun-each 3 catches them)

## Implementation Order

1. **Project setup** — branch, monorepo scaffold, move files
2. **Core package** — migrate PoC, build system, simplified mounting component
3. **Testing package** — renderTui, screen, keys, waitFor
4. **Core tests** — convert vitest → bun:test, add mounting tests
5. **UI components** — port from @opentui/ui with tests
6. **Examples** — Vite and Next.js apps
7. **Documentation** — Fumadocs site
8. **Verification** — Playwright, randomized test runs, final check
