# Task 001: Headless Render-to-Text for SSR / LLMs.txt

## Summary

Enable server-side (or headless client-side) rendering of any Gridland TUI component tree into plain text — the same characters visible on screen (and used for copy/paste). This unlocks SSR fallbacks, `llms.txt` endpoints, and accessible text representations of canvas-rendered TUIs.

## Motivation

Gridland renders TUI components to an HTML5 Canvas. For copy/paste, the characters already exist as code points in `BrowserBuffer.char` (a `Uint32Array` grid). But there's no way to:

1. Get that text output without a browser/canvas
2. Use it for SSR (the `<TUI>` component returns an empty `<div>` during SSR today — see `TUI.tsx:136-143`)
3. Serve it from an API route like `llms.txt`

The data and pipeline already exist — they just need to be decoupled from the canvas.

## Scope

**Gridland only.** No modifications to opentui are required.

The rendering pipeline is:

```
RootRenderable.calculateLayout()
  → RootRenderable.updateLayout(dt, renderList)
    → renderable.render(buffer, dt)        ← writes chars into BrowserBuffer
      → CanvasPainter.paint(ctx2d, buffer) ← draws to canvas (NOT needed)
```

Everything before `CanvasPainter.paint()` is pure JS operating on typed arrays — no DOM, no canvas, no browser APIs. `BrowserBuffer`, `BrowserRenderContext`, and the opentui renderable tree all work with plain data.

## Architecture

### Key existing pieces

| File | What it does | Browser deps? |
|------|-------------|---------------|
| `packages/web/src/browser-buffer.ts` | Stores char/fg/bg/attr as typed arrays in a cols×rows grid | None |
| `packages/web/src/browser-render-context.ts` | Implements opentui's `RenderContext` interface (events, layout, focus) | None |
| `packages/web/src/browser-renderer.ts` | Orchestrates the render loop, owns the buffer, paints to canvas | **Yes** — canvas, RAF, DOM events |
| `packages/web/src/selection-manager.ts` | Extracts text from buffer for copy/paste (`getSelectedText`) | None |
| `packages/web/src/create-browser-root.tsx` | Wires React reconciler to the renderer | None (React only) |

### What currently happens for copy/paste

`SelectionManager.getSelectedText()` (`selection-manager.ts:91-115`) already reads the buffer and produces text:

```ts
for (let row = startRow; row <= endRow; row++) {
  let line = ""
  for (let col = lineStart; col < lineEnd; col++) {
    const charCode = buffer.char[row * buffer.width + col]
    line += charCode === 0 ? " " : String.fromCodePoint(charCode)
  }
  lines.push(line.trimEnd())
}
return lines.join("\n")
```

This is exactly the output we want — just for the entire buffer instead of a selection range.

## Implementation Plan

### Step 1: `bufferToText()` utility

Add a simple function that reads the entire buffer grid as text.

**File:** `packages/web/src/buffer-to-text.ts`

```ts
import type { BrowserBuffer } from "./browser-buffer"

export function bufferToText(buffer: BrowserBuffer): string {
  const lines: string[] = []
  for (let row = 0; row < buffer.height; row++) {
    let line = ""
    for (let col = 0; col < buffer.width; col++) {
      const idx = row * buffer.width + col
      const charCode = buffer.char[idx]
      line += charCode === 0 ? " " : String.fromCodePoint(charCode)
    }
    lines.push(line.trimEnd())
  }
  // Trim trailing empty lines
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop()
  }
  return lines.join("\n")
}
```

Export from `packages/web/src/core.ts` (or the appropriate entry point).

### Step 2: Headless renderer

Extract the render-to-buffer logic from `BrowserRenderer.loop()` (lines 233-296) into a class that doesn't need a canvas, RAF, DOM events, or `devicePixelRatio`.

**File:** `packages/web/src/headless-renderer.ts`

Responsibilities:
- Create a `BrowserBuffer(cols, rows)`
- Create a `BrowserRenderContext(cols, rows)`
- Create a `RootRenderable` (via `setRootRenderableClass`)
- Expose a `renderOnce()` method that runs one frame:
  1. `buffer.clear()`
  2. Run lifecycle passes
  3. `root.calculateLayout()`
  4. `root.updateLayout(0, renderList)` (deltaTime=0 for static render)
  5. Execute render commands (pushScissorRect, popScissorRect, pushOpacity, popOpacity, render)
  6. Clear stacks
- Expose `buffer` so callers can use `bufferToText(renderer.buffer)`

```ts
import { BrowserBuffer } from "./browser-buffer"
import { BrowserRenderContext } from "./browser-render-context"
import { bufferToText } from "./buffer-to-text"

export interface HeadlessRendererOptions {
  cols: number
  rows: number
}

export class HeadlessRenderer {
  public buffer: BrowserBuffer
  public renderContext: BrowserRenderContext
  public root: any

  constructor(options: HeadlessRendererOptions) {
    // ... create buffer, renderContext, root (same as BrowserRenderer constructor
    //     but without canvas, painter, selection, DOM listeners)
  }

  renderOnce(): void {
    // ... same logic as BrowserRenderer.loop() lines 244-283
    //     without the canvas paint step (lines 287-295)
  }

  toText(): string {
    return bufferToText(this.buffer)
  }

  resize(cols: number, rows: number): void {
    // ... resize buffer, renderContext, root
  }
}
```

### Step 3: Headless root (React integration)

Create a `createHeadlessRoot()` analogous to `createBrowserRoot()` that wires the React reconciler to the headless renderer.

**File:** `packages/web/src/create-headless-root.tsx`

```ts
export function createHeadlessRoot(renderer: HeadlessRenderer): HeadlessRoot {
  // Same as createBrowserRoot but uses HeadlessRenderer
  // Returns { render(node), renderToText(node), unmount() }
}
```

The key addition is a `renderToText()` convenience method:
1. Call `render(node)` to reconcile the React tree
2. Call `renderer.renderOnce()` to populate the buffer
3. Return `renderer.toText()`

### Step 4: Wire into SSR / API routes

#### Option A: `llms.txt` endpoint

In the docs site, create an endpoint that renders the landing page headlessly:

```ts
// packages/docs/app/tui.txt/route.ts
import { HeadlessRenderer } from "@gridland/web"
import { createHeadlessRoot } from "@gridland/web"
import { LandingApp } from "@gridland/ui"

export function GET() {
  const renderer = new HeadlessRenderer({ cols: 80, rows: 24 })
  const root = createHeadlessRoot(renderer)
  const text = root.renderToText(<LandingApp />)
  root.unmount()
  return new Response(text, { headers: { "Content-Type": "text/plain" } })
}
```

#### Option B: SSR fallback in `<TUI>`

Replace the empty SSR placeholder in `TUI.tsx:136-143` with a `<pre>` containing the headless-rendered text:

```tsx
if (!isClient) {
  // SSR: render headlessly and show as <pre> until client hydrates
  const renderer = new HeadlessRenderer({ cols: fallbackCols, rows: fallbackRows })
  const root = createHeadlessRoot(renderer)
  const text = root.renderToText(children)
  root.unmount()
  return (
    <div style={style} className={className}>
      <pre style={{ fontFamily, fontSize, margin: 0 }}>{text}</pre>
    </div>
  )
}
```

Note: SSR fallback requires choosing fixed `cols`/`rows` since there's no container to measure. Could accept as props (`fallbackCols`, `fallbackRows`) or use sensible defaults (80×24).

## Potential Issues

### 1. Animations and dynamic content
`renderOnce()` captures a single frame with `deltaTime=0`. Components with animations (like `MatrixRain` on the landing page) will render their initial frame. This is fine for SSR/llms.txt — you want the static content, not the animation.

### 2. `useBreakpoints` and responsive layout
The `LandingApp` uses `useBreakpoints()` which likely reads the render context dimensions. With the headless renderer, you control `cols`/`rows` explicitly, so you choose what "screen size" to render at. For `llms.txt`, 80×24 is a natural choice.

### 3. React reconciler timing
The opentui React reconciler (`_render`) may use microtask scheduling. `renderToText()` might need to flush the reconciler synchronously or wait a tick before calling `renderOnce()`. Test this — if the tree isn't populated immediately after `_render()`, a `Promise`-based API may be needed:

```ts
async renderToText(node: ReactNode): Promise<string> {
  this.render(node)
  await new Promise(r => setTimeout(r, 0)) // flush reconciler
  this.renderer.renderOnce()
  return this.renderer.toText()
}
```

### 4. Event emitter import
`BrowserRenderContext` imports `EventEmitter` from `"events"` (Node.js built-in). This works in SSR/API routes but would need a polyfill if you ever wanted headless rendering in a pure browser context. Not a problem for the SSR/llms.txt use case.

## Files to create/modify

| Action | File |
|--------|------|
| Create | `packages/web/src/buffer-to-text.ts` |
| Create | `packages/web/src/headless-renderer.ts` |
| Create | `packages/web/src/create-headless-root.tsx` |
| Modify | `packages/web/src/core.ts` — export new modules |
| Modify | `packages/web/tsup.config.ts` — ensure new files are in the build |
| Create | `packages/docs/app/tui.txt/route.ts` (or similar endpoint) |
| Optionally modify | `packages/web/src/TUI.tsx` — SSR fallback with `<pre>` |

## Estimated complexity

- `bufferToText`: trivial (~15 lines)
- `HeadlessRenderer`: low — extract and simplify from `BrowserRenderer` (~60 lines)
- `createHeadlessRoot`: low — adapt from `createBrowserRoot` (~30 lines)
- API route wiring: trivial
- SSR fallback in `<TUI>`: low, but needs reconciler timing investigation
- **Total: small feature, mostly extraction/adaptation of existing code**
