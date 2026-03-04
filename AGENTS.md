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
- `packages/opentui-web` — Core browser runtime
- `packages/opentui-ui` — UI component library
- `packages/opentui-testing` — Testing utilities

## Debugging Component Rendering

### CLI Demo Runner
Render any component to text in the terminal without a browser:
```bash
bun run demo              # all components
bun run demo table        # specific component
bun run demo select-input # by name
```
Fixtures are defined in `packages/opentui-ui/scripts/demo-fixtures.tsx`. Add new
fixtures there to include them in the demo runner.

### Snapshot Tests
Each UI component has snapshot tests (`*.snapshot.test.tsx`) that capture rendered
text output. Use these to catch visual regressions:
```bash
bun run test                        # verify snapshots match
bun run --cwd packages/opentui-ui test -- --update-snapshots  # regenerate
```
When modifying a component's rendering, run the tests — any visual change will
cause a snapshot mismatch. Review the diff, then update snapshots if the change
is intentional.

**Note:** Components using the `<input>` intrinsic (e.g. TextInput) cannot render
in the test environment because the underlying EditBuffer requires the Zig FFI
library. Their snapshots capture the ErrorBoundary fallback instead.

## Key Rules
1. New Node.js dependencies in opentui must be shimmed in `packages/opentui-web/src/shims/`
2. Browser code must not import from Zig/FFI — use the core-shims barrel
3. The Vite plugin handles module resolution — don't add manual aliases
4. Do NOT publish to npm without explicit approval
