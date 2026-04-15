---
paths:
  - "packages/ui/components/**"
  - "packages/demo/**"
  - "packages/docs/components/demos/**"
  - "packages/web/src/**"
  - "packages/testing/**"
---

# OpenTUI Layout Model

**This is the #1 source of component bugs.** Understand this before writing any component.

## Intrinsic Elements

| Category | Elements | Notes |
|---|---|---|
| **Layout** | `<box>`, `<scrollbox>` | Flex containers. `<box>` defaults to `flexDirection="column"` (NOT "row" like CSS/Ink) |
| **Text (block)** | `<text>` | Block element — takes a full line, like `<p>` |
| **Text (inline)** | `<span>`, `<b>`/`<strong>`, `<i>`/`<em>`, `<u>`, `<br>`, `<a>` | Must go inside `<text>` |
| **Input** | `<input>`, `<textarea>` | Require Zig FFI (EditBuffer). `<input>` = single-line, `<textarea>` = multi-line |
| **Selection** | `<select>`, `<tab-select>` | Dropdown and tab-style selectors |
| **Content** | `<code>`, `<markdown>`, `<diff>` | Syntax-highlighted code, markdown rendering, diff viewer |
| **Display** | `<ascii-font>`, `<line-number>` | `<ascii-font>` ships in both runtimes (terminal via Zig FrameBuffer; browser via the pure-JS `BrowserAsciiFontRenderable` registered in `packages/web/src/components/register.ts`). `<line-number>` still requires Zig FFI (FrameBuffer) and is terminal-only. |

## Layout Rules

1. Multiple `<text>` inside a `<box>` stack vertically (one per line)
2. For horizontal inline content, use ONE `<text>` with `<span>` children
3. `<text>` cannot nest inside `<text>` — use `<span>` for inline nesting
4. Valid `borderStyle` values: `"single"`, `"double"`, `"rounded"`, `"heavy"` (upstream OpenTUI), plus `"dashed"` (Gridland-local). NOT `"round"` or `"bold"`.

## Text Attributes (bold, dim, inverse)

`bold`, `dim`, and `inverse` do NOT work as style keys or direct props. Two approaches:

**Semantic elements** — for bold, italic, underline only:
```tsx
<text><strong>bold text</strong> and <em>italic</em> and <u>underlined</u></text>
```

**`textStyle()` helper or `attributes` bitmask** — required for `dim` and `inverse`:
```tsx
// WRONG — silently ignored:
<span style={{ bold: true, inverse: true, fg: "cyan" }}>

// RIGHT — use textStyle helper:
//   Inside packages/ui/: import { textStyle } from "@/registry/gridland/lib/text-style"
//   Inside any other workspace package or docs demo: import { textStyle } from "@gridland/ui"
import { textStyle } from "@/registry/gridland/lib/text-style"
<span style={textStyle({ bold: true, inverse: true, fg: "cyan" })}>

// RIGHT — or set attributes directly (BOLD=1, DIM=2, ITALIC=4, UNDERLINE=8, INVERSE=32):
<span style={{ fg: "cyan", attributes: 33 }}>
```

## Anti-Patterns

- `<span style={{ bold: true }}>` — bold/dim/inverse as style keys are silently ignored; use `textStyle()` helper or semantic elements

## Runtime Capability — Terminal-only intrinsics

Every JSX intrinsic carries a runtime-capability tag in `packages/core/src/react/types/runtime-capability.ts` (`universal`, `dual-impl`, `terminal-only`, or `browser-only`). The browser JSX namespace in `packages/web/src/gridland-jsx.d.ts` filters the catalogue against this map so misuse becomes a compile error instead of a runtime crash. See `tasks/003-browser-compat-contract.md` §4.4.

| Intrinsic | Capability tag | Browser status |
|-----------|----------------|----------------|
| `<ascii-font>` | `dual-impl` | Browser implementation lives at `packages/web/src/components/browser-ascii-font.ts`, registered in core's `componentCatalogue` at import time via `packages/web/src/components/register.ts`. Byte-identical glyph parity with the terminal path is enforced by `packages/web/test/ascii-font.parity.test.tsx`. |
| `<input>`, `<textarea>` | `terminal-only` | Require Zig FFI (EditBuffer). Compile-time filter cannot stop them (their names collide with React's `HTMLInputElement` / `HTMLTextAreaElement`); the reconciler rejects them at mount time via `ErrorBoundary`. |
| `<line-number>` | `terminal-only` | Requires Zig FFI (FrameBuffer). Removed from the browser `JSX.IntrinsicElements` block, so usage in a browser-typed project is a compile error. |

**Adding a new browser-friendly intrinsic:** ship the renderable under `packages/web/src/components/`, add an `extend({ "name": Renderable })` line to `register.ts`, and flip the tag in `runtime-capability.ts` from `terminal-only` to `dual-impl` (or declare it as `dual-impl` at creation). The build-time checker at `packages/core/scripts/check-intrinsic-tags.ts` enforces that catalogue keys and capability keys stay in lockstep (INV-1), and `packages/core/scripts/lint-renderable-constructors.ts` enforces that the new renderable's constructor never calls `resolveRenderLib` / `OptimizedBuffer.create` (INV-2).

## Snapshot Testing

Components using terminal-only Zig FFI intrinsics (e.g. `<input>`, `<textarea>`, `<line-number>`) cannot render in the test environment because the underlying native libraries require Zig FFI. Their snapshots capture the `ErrorBoundary` fallback instead. `<ascii-font>` is no longer in this category — it renders normally in tests via the browser implementation.
