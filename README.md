# OpenTUI Web PoC

Proof-of-concept that renders [OpenTUI](https://github.com/nicosalm/opentui) React apps directly in the browser using HTML5 `<canvas>`, bypassing any terminal emulator.

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

# Tests (38 tests across 5 suites)
bun run test

# Production build
bun run build
```

## Project structure

```
src/
  browser-buffer.ts          # Pure-JS OptimizedBuffer replacement
  browser-text-buffer.ts     # Pure-JS TextBuffer replacement
  browser-text-buffer-view.ts # Pure-JS TextBufferView (word/char wrapping)
  browser-syntax-style.ts    # SyntaxStyle stub
  browser-render-context.ts  # RenderContext implementation
  browser-renderer.ts        # Render loop orchestrator
  canvas-painter.ts          # Canvas 2D painter
  create-browser-root.tsx    # React integration (createBrowserRoot)
  App.tsx                    # Demo app
  main.tsx                   # Entry point
  core-shims/
    index.ts                 # Barrel aliased as @opentui/core
    rgba.ts                  # Standalone RGBA + parseColor
    types.ts                 # RenderContext interface, TextAttributes, etc.
  shims/
    zig-stub.ts              # No-op Zig render lib
    bun-ffi.ts               # Dummy bun:ffi exports
    bun-ffi-structs.ts       # Stub defineStruct/defineEnum
    text-buffer-shim.ts      # Re-exports BrowserTextBuffer as TextBuffer
    text-buffer-view-shim.ts # Re-exports BrowserTextBufferView as TextBufferView
    syntax-style-shim.ts     # Re-exports BrowserSyntaxStyle as SyntaxStyle
    slider-deps.ts           # Breaks circular dep for Slider.ts
    node-*.ts                # Browser stubs for Node.js builtins
    ...
  __tests__/                 # Unit + integration tests
```

## How the Vite plugin works

The opentui source tree (`../opentui/`) is loaded directly — Vite serves it via `/@fs/` URLs. A custom plugin intercepts imports at resolution time:

1. **File-level redirects** — Relative imports that resolve to zig-dependent files (buffer, text-buffer, text-buffer-view, syntax-style, renderer, etc.) are redirected to browser shims.
2. **Pattern-based interception** — tree-sitter, hast, and Node.js builtin imports are caught by string matching and redirected to stubs.
3. **Barrel routing** — `@opentui/core` is routed to the real opentui barrel when imported from the react package (to preserve the original module evaluation order), and to our core-shims barrel when imported from our own code.
4. **Circular dep fix** — `Slider.ts`'s import of `../index` is redirected to a minimal deps file to break a barrel-level circular dependency that causes TDZ errors in strict ESM.
