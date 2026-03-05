# Polyterm

Polyterm renders [opentui](https://github.com/nicosalm/opentui) React apps directly in the browser using HTML5 `<canvas>`, bypassing any terminal emulator. Polyterm is built on the opentui engine.

![Screenshot](screenshot.png)

## Architecture

```
React JSX  ->  @opentui/react reconciler  ->  Renderable tree  ->  Yoga layout
  ->  renderSelf() calls buffer.drawText / drawBox / setCell
  ->  BrowserBuffer (pure JS TypedArrays) stores cell grid
  ->  CanvasPainter reads buffer  ->  ctx.fillRect + ctx.fillText
```

The key insight: OpenTUI renderables never call Zig directly. They call `OptimizedBuffer` methods. By replacing the buffer + renderer with pure-JS implementations, the entire renderable/reconciler layer works unchanged.

## What's implemented

- **BrowserBuffer** — Pure-JS replacement for `OptimizedBuffer` using `Uint32Array`/`Float32Array` typed arrays. Same API: `setCell`, `drawText`, `drawBox`, `fillRect`, scissor rect stack, opacity stack.
- **BrowserTextBuffer / BrowserTextBufferView** — Pure-JS replacements for the Zig-backed text storage and word/char wrapping.
- **CanvasPainter** — Two-pass canvas renderer: background rects, then foreground chars with font style attributes (bold/italic/underline).
- **BrowserRenderer** — Orchestrator running `requestAnimationFrame` loop: lifecycle passes -> Yoga layout -> render commands -> paint.
- **BrowserRenderContext** — Implements the `RenderContext` interface (event emitter, lifecycle pass registry, focus management).
- **Vite plugin** — Custom `resolveId` plugin that intercepts all Zig/FFI/Node.js imports from the opentui source tree and redirects them to browser shims.
- **React integration** — `createBrowserRoot()` wires the @opentui/react reconciler to the browser renderer.

## Running

```bash
# Install dependencies
bun install

# Dev server
bun run dev
# -> http://localhost:5173

# Tests
bun run test

# Production build
bun run build
```

## Project structure

```
packages/
  polyterm-web/              # Core browser runtime (npm: @polyterm.io/web)
    src/
      index.ts               # Main exports (bundled mode)
      core.ts                # Core exports (external mode for Vite plugin users)
      TUI.tsx                # Single React component — THE mounting layer
      mount.ts               # Imperative mount API: mountPolyterm(canvas, element)
      browser-buffer.ts
      browser-text-buffer.ts
      browser-text-buffer-view.ts
      browser-renderer.ts
      browser-render-context.ts
      canvas-painter.ts
      selection-manager.ts
      vite-plugin.ts         # Vite plugin for shim resolution
      next.ts                # Next.js export (thin — just "use client" re-export)
      next-plugin.ts         # Next.js webpack plugin
      utils.ts               # SSR-safe utilities
      core-shims/            # @opentui/core browser replacements
      shims/                 # Node.js built-in stubs
    __tests__/               # Unit + integration tests

  polyterm-ui/               # UI component library (npm: @polyterm.io/ui)
    components/              # Components with tests

  polyterm-testing/           # Testing utilities (npm: @polyterm.io/testing)
    src/

examples/
  vite-example/              # Minimal Vite example
  next-example/              # Next.js example

packages/docs/               # Fumadocs documentation site
e2e/                         # Playwright E2E tests
```

## How the Vite plugin works

The opentui source tree (`../opentui/`) is loaded directly — Vite serves it via `/@fs/` URLs. A custom plugin intercepts imports at resolution time:

1. **File-level redirects** — Relative imports that resolve to zig-dependent files (buffer, text-buffer, text-buffer-view, syntax-style, renderer, etc.) are redirected to browser shims.
2. **Pattern-based interception** — tree-sitter, hast, and Node.js builtin imports are caught by string matching and redirected to stubs.
3. **Barrel routing** — `@opentui/core` is routed to the real opentui barrel when imported from the react package (to preserve the original module evaluation order), and to our core-shims barrel when imported from our own code.
4. **Circular dep fix** — `Slider.ts`'s import of `../index` is redirected to a minimal deps file to break a barrel-level circular dependency that causes TDZ errors in strict ESM.
