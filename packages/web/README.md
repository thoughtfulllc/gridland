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

## Browser `<ascii-font>`

`<ascii-font>` renders large ASCII-art text using one of seven bundled fonts. In a terminal runtime it ships glyphs through the Zig-native frame buffer; in a browser runtime it ships the same glyphs through a pure-JS Renderable that writes cells directly into the canvas buffer.

```tsx
import { TUI } from "@gridland/web"

function Banner() {
  return (
    <TUI style={{ width: "100vw", height: "100vh" }}>
      <ascii-font text="gridland" font="block" />
    </TUI>
  )
}
```

### Supported fonts

All seven `@gridland/core` built-in fonts work in both runtimes:

| Font | Height | Notes |
|---|--:|---|
| `tiny` | 2 rows | Default. Smallest footprint — ideal for status lines and dense layouts. |
| `block` | 6 rows | Solid block glyphs, highest contrast. |
| `shade` | 3 rows | Shaded blocks — lighter visual weight than `block`. |
| `slick` | 4 rows | Thin slanted strokes. |
| `huge` | 8 rows | Largest. Reserve for splash screens. |
| `grid` | 5 rows | Grid-style glyphs, retro feel. |
| `pallet` | 4 rows | Color-palette-friendly — supports per-segment `<c1>`/`<c2>` tags inside glyph definitions. |

Font sources: [cfonts](https://github.com/dominikwilkowski/cfonts). Data lives at `packages/core/src/lib/fonts/*.json` and is reused byte-for-byte by both runtimes.

### Props

```tsx
<ascii-font
  text="hello"            // required; rendered as uppercase
  font="tiny"              // tiny | block | shade | slick | huge | grid | pallet
  color="#FFFFFF"          // single color or array of colors for <cN> segments
  backgroundColor="transparent"
/>
```

### Parity guarantee

The browser and terminal implementations produce byte-identical glyph output for the same `(text, font, color, backgroundColor)` inputs. Both paths call the same pure-JS `renderFontToFrameBuffer` helper from `@gridland/core/lib/ascii.font`; the two Renderable wrappers differ only in whether they write into an intermediate frame buffer (terminal, via `FrameBufferRenderable`) or directly into the destination canvas buffer (browser, via `Renderable`).

Automated regression guards:
- `packages/web/test/ascii-font.parity.test.tsx` — 13 parametric (font, text) cases asserting byte-equal char grids between the two implementations.
- `packages/web/src/components/__tests__/browser-ascii-font.test.tsx` — 9 unit tests for the browser renderable (constructor contract, all 7 fonts, clipping at buffer edges, prop changes).
- `packages/web/src/components/__tests__/register.test.ts` — proves the browser override is registered in `componentCatalogue["ascii-font"]` before any React render runs.

### How the override works

`@gridland/core` exports a module-level `componentCatalogue` that the reconciler reads on every `createInstance` call. `@gridland/web` mutates that singleton at import time via a side-effect module at `src/components/register.ts` that calls `extend({ "ascii-font": BrowserAsciiFontRenderable })`. The import lives on the first line of `src/create-browser-root.tsx` so it runs before any container is created, and `package.json` marks it as a side-effect file so bundlers (Vite, Next, Webpack, esbuild in prod mode) do not tree-shake the import away.

If you load both `@gridland/bun` and `@gridland/web` into the same process — rare, mostly SSR edge cases — the last one imported wins the catalogue singleton. Single-runtime consumers are not affected. The root cause is `componentCatalogue` being a module-level singleton; a per-container catalogue refactor is tracked as a future task and documented as NG7 in `tasks/003-browser-compat-contract.md`.

### What still runs in the terminal only

Three Zig-FFI intrinsics remain terminal-only until their own follow-up tasks land:

- `<input>` — single-line text input (requires `EditBuffer`)
- `<textarea>` — multi-line text input (requires `EditBuffer`)
- `<line-number>` — line-number gutter (requires `FrameBuffer`)

For `<line-number>`, using the intrinsic in a browser-typed project is a compile error — the filter in `gridland-jsx.d.ts` excludes it from `JSX.IntrinsicElements`. For `<input>` and `<textarea>`, the filter cannot stop them from compiling because those names collide with React's built-in HTML element types (`HTMLInputElement`, `HTMLTextAreaElement`); the runtime-capability tag in `@gridland/core`'s `runtime-capability.ts` marks them as `terminal-only`, and the reconciler catches the misuse at mount time via the existing `ErrorBoundary` fallback. See `tasks/003-browser-compat-contract.md` §5 INV-3 for the detailed carve-out.

If you need ASCII-art text in the browser and you want a font that isn't one of the seven bundled ones, the `packages/demo/demos/ascii.tsx` demo is a reference implementation using [figlet](https://github.com/patorjk/figlet.js) with `<text>` elements instead of `<ascii-font>`. The `<ascii-font>` intrinsic is recommended when you want byte-identical parity with the terminal output; `figlet + <text>` is recommended when you need a specific font that's not in the built-in set.
