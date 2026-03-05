# Development Guidelines

## Testing
- Use bun:test (not vitest or jest)
- After making changes: `bun run test` from the root
- CI runs: `bun run test:ci` which uses `--randomize --rerun-each 3`
- Tests must be deterministic — no flaky tests allowed

## Build
- After changes: `bun run build` from the root
- Clean rebuild: `bun run clean && bun install && bun run build`

## Monorepo Structure
- `packages/polyterm-web` — Core browser runtime (@polyterm.io/web)
- `packages/polyterm-ui` — UI component library (@polyterm.io/ui)
- `packages/polyterm-testing` — Testing utilities (@polyterm.io/testing)

Polyterm is built on the [opentui](https://opentui.dev) engine. The underlying
`@opentui/core`, `@opentui/react`, and `@opentui/ui` packages are preserved unchanged.

## Debugging Component Rendering

### CLI Demo Runner
Render any component to text in the terminal without a browser:
```bash
bun run demo              # all components
bun run demo table        # specific component
bun run demo select-input # by name
```
Fixtures are defined in `packages/polyterm-ui/scripts/demo-fixtures.tsx`. Add new
fixtures there to include them in the demo runner.

### Snapshot Tests
Each UI component has snapshot tests (`*.snapshot.test.tsx`) that capture rendered
text output. Use these to catch visual regressions:
```bash
bun run test                        # verify snapshots match
bun run --cwd packages/polyterm-ui test -- --update-snapshots  # regenerate
```
When modifying a component's rendering, run the tests — any visual change will
cause a snapshot mismatch. Review the diff, then update snapshots if the change
is intentional.

**Note:** Components using the `<input>` intrinsic (e.g. TextInput) cannot render
in the test environment because the underlying EditBuffer requires the Zig FFI
library. Their snapshots capture the ErrorBoundary fallback instead.

## OpenTUI Layout Model

**This is the #1 source of component bugs.** Understand this before writing any component.

- `<box>` = flex container (default `flexDirection="column"`, NOT "row" like CSS/ink)
- `<text>` = **block element** (takes a full line, like `<p>`)
- `<span>` = **inline element** (goes inside `<text>`, like HTML `<span>`)

Rules:
1. Multiple `<text>` inside a `<box>` stack vertically (one per line)
2. For horizontal inline content, use ONE `<text>` with `<span>` children
3. `<text>` cannot nest inside `<text>` — use `<span>` for inline nesting
4. Valid `borderStyle` values: `"single"`, `"double"`, `"rounded"`, `"heavy"` (NOT `"round"` or `"bold"`)

### Text Attributes (bold, dim, inverse)

`bold`, `dim`, and `inverse` do NOT work as style keys or direct props on `<span>`/`<text>`.
They must be packed into the numeric `attributes` bitmask:

```tsx
// WRONG — these are silently ignored:
<span style={{ bold: true, inverse: true, fg: "cyan" }}>

// RIGHT — use the textStyle helper:
import { textStyle } from "./text-style"
<span style={textStyle({ bold: true, inverse: true, fg: "cyan" })}>

// RIGHT — or set attributes directly (BOLD=1, DIM=2, INVERSE=32):
<span style={{ fg: "cyan", attributes: 33 }}>
```

The `textStyle()` helper is exported from `@polyterm.io/ui` and converts
`{ bold, dim, italic, underline, inverse, fg, bg }` into `{ attributes, fg, bg }`.

## Docs Demos

Demos live in `packages/docs/components/demos/`. They render inside `<TUI>`.

**Demos for interactive components must be interactive.** If a component accepts
keyboard input (`useKeyboard` prop) or has state that changes on user action,
the demo must:

- Use `useState` for dynamic state
- Import and wire `useKeyboard` from `@opentui/react`
- Show the component responding to user input in real time
- Reference the ink-web demo (`/dev/ink-web/docs/components/demos/`) for the
  equivalent component as the behavioral model

**Do NOT use the static spinner-demo pattern for interactive components.** The
spinner demo is static because spinners animate on their own. Components like
TabBar, Modal, Chat, StatusBar need state management and keyboard wiring in
their demos.

Example — TabBar demo (interactive):
```tsx
function TabBarApp() {
  const [selectedIndex, setSelectedIndex] = useState(0)
  useKeyboard((event) => {
    if (event.name === "left") setSelectedIndex((i) => (i > 0 ? i - 1 : tabs.length - 1))
    if (event.name === "right") setSelectedIndex((i) => (i < tabs.length - 1 ? i + 1 : 0))
  })
  return <TabBar options={tabs} selectedIndex={selectedIndex} />
}
```

## Porting Components from ink-web

**Never do a structural translation** (swapping element names). Use spec-first porting:

1. Read the ink-web source → extract a behavioral spec (what it renders, props, keyboard, edge cases)
2. Build from the spec using opentui idioms (see layout model above)
3. Run `bun run demo` to visually verify
4. Write tests that verify layout, not just text content

Structural translation copies assumptions from ink's element model (`<Text>` can
be inline) that don't hold in opentui (`<text>` is always block).

## Key Rules
1. New Node.js dependencies in opentui must be shimmed in `packages/polyterm-web/src/shims/`
2. Browser code must not import from Zig/FFI — use the core-shims barrel
3. The Vite plugin handles module resolution — don't add manual aliases
4. Do NOT publish to npm without explicit approval
