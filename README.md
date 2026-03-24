# Gridland

Gridland renders [opentui](https://github.com/nicosalm/opentui) React apps directly in the browser using HTML5 `<canvas>`, bypassing any terminal emulator. Gridland is built on the opentui engine.

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

## Getting started

```bash
git clone https://github.com/<org>/gridland.git
cd gridland
bun setup
```

This installs all dependencies and builds the packages.

## Running

```bash
# Dev server
bun run dev
# -> http://localhost:5173

# Tests
bun run test

# Production build
bun run build
```

### AI chat demo (Cloudflare Worker)

The docs site AI chat demo connects to a Cloudflare Worker that proxies requests to [OpenRouter](https://openrouter.ai/). The API key never lives in the repo — it's stored as a Cloudflare Workers secret.

**Local development:**

```bash
# 1. Create a local secrets file (gitignored)
echo "OPENROUTER_API_KEY=sk-or-..." > packages/chat-worker/.dev.vars

# 2. Start the Worker (localhost:8787)
bun run chat:dev

# 3. In another terminal, start the docs site
bun run dev
```

The `.env` at the repo root sets `NEXT_PUBLIC_CHAT_API_URL=http://localhost:8787/chat` so the docs site points at the local Worker.

**Production deployment:**

```bash
# Set the secret in Cloudflare (one-time, encrypted at rest)
cd packages/chat-worker && npx wrangler secret put OPENROUTER_API_KEY

# Deploy the Worker
bun run chat:deploy
```

Then set `NEXT_PUBLIC_CHAT_API_URL` to the deployed Worker URL in your static hosting environment (e.g. Render dashboard). This env var is baked into the static bundle at build time.

## How the Vite plugin works

The opentui source tree (`packages/core/`) is loaded directly. A custom plugin intercepts imports at resolution time:

1. **File-level redirects** — Relative imports that resolve to zig-dependent files (buffer, text-buffer, text-buffer-view, syntax-style, renderer, etc.) are redirected to browser shims.
2. **Pattern-based interception** — tree-sitter, hast, and Node.js builtin imports are caught by string matching and redirected to stubs.
3. **Barrel routing** — `@opentui/core` is routed to the real opentui barrel when imported from the react package (to preserve the original module evaluation order), and to our core-shims barrel when imported from our own code.
4. **Circular dep fix** — `Slider.ts`'s import of `../index` is redirected to a minimal deps file to break a barrel-level circular dependency that causes TDZ errors in strict ESM.
