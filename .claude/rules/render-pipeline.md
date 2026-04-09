# Render Pipeline Clipping Invariant

**When this loads:** You are touching `packages/web/src/browser-buffer.ts`, `packages/web/src/canvas-painter.ts`, or `packages/core/src/renderables/Box.ts`.

## The Invariant

The browser renderer has two phases:

1. **Buffer phase** (`BrowserBuffer`): Writes to a cell grid. Maintains a `scissorStack` — every cell write checks `isInScissor()`. Elements with `overflow="hidden"` push/pop scissor rects.
2. **Paint phase** (`CanvasPainter.paint()`): Reads the cell grid and draws to canvas via `ctx.*`.

**Any data structure accumulated during the buffer phase that the canvas painter draws directly (bypassing the cell grid) MUST carry the active scissor rect.** Otherwise, that drawing will ignore `overflow="hidden"` containers.

## The Pattern

When adding a new buffer→painter data channel:

1. **Type**: Add `clipRect?: { x: number; y: number; width: number; height: number }` to the entry type
2. **Write site** (in BrowserBuffer): Read `this.scissorStack[top]`, skip if fully outside, store as `clipRect`
3. **Read site** (in CanvasPainter): Apply `ctx.save()` → `ctx.rect(clipRect)` → `ctx.clip()` before drawing, `ctx.restore()` after
4. **Tests**: Verify capture, skip-when-outside, paint-clipping, and no-clip-when-absent

## Current Channels

| Channel | Scissor-aware | Notes |
|---------|--------------|-------|
| `lineCursorPosition` | No (bounds-checked) | Editor cursor — always within grid bounds |

## Anti-Patterns

- Adding a `public` array to `BrowserBuffer` consumed by `CanvasPainter` without `clipRect`
- Drawing via `ctx.arc()`, `ctx.drawImage()` etc. in the painter without checking for a clip region
- Assuming cell-grid bounds checking is sufficient — it prevents out-of-bounds but doesn't respect `overflow="hidden"` containers
