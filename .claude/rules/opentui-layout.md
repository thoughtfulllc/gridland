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
| **Display** | `<ascii-font>`, `<line-number>` | ASCII art text, line number gutter |

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
import { textStyle } from "@gridland/ui"
<span style={textStyle({ bold: true, inverse: true, fg: "cyan" })}>

// RIGHT — or set attributes directly (BOLD=1, DIM=2, ITALIC=4, UNDERLINE=8, INVERSE=32):
<span style={{ fg: "cyan", attributes: 33 }}>
```

## Anti-Patterns

- `<span style={{ bold: true }}>` — bold/dim/inverse as style keys are silently ignored; use `textStyle()` helper or semantic elements

## Snapshot Testing

Components using the `<input>` intrinsic (e.g. TextInput) cannot render in the test environment because the underlying EditBuffer requires the Zig FFI library. Their snapshots capture the ErrorBoundary fallback instead.
