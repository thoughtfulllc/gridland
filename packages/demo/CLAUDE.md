# Gridland Demo Package

Canonical source of all demo implementations. Demos here are shared between the terminal CLI (`bunx @gridland/demo`) and the docs site (via `@demos/*` path alias).

## Architecture

```
packages/demo/
├── demos/              Core demo implementations (all demo logic lives here)
│   ├── index.tsx       Registry — imports + exports all terminal-runnable demos
│   ├── spinner.tsx     Example: export function SpinnerApp() { ... }
│   └── ...
├── src/
│   ├── run.tsx         CLI runner — loads demo by name, renders via createCliRenderer
│   ├── landing.tsx     Browser landing page (separate build entry)
│   └── cli.test.ts     Tests — validates demo registry and CLI behavior
├── bin/cli.mjs         CLI entry point (bunx @gridland/demo <name>)
└── tsup.config.ts      Build config — bundles demos inline, externalizes runtime deps
```

## Two consumers, one source

| Consumer | How it imports | What it adds |
|---|---|---|
| **Terminal CLI** | `demos/index.tsx` registry | `DemoShell` wrapper, `createCliRenderer` |
| **Docs site** | `@demos/*` path alias (Next.js) | `<DemoWindow>` wrapper, theme toggle, SSR |

The `@demos/*` alias is configured in `packages/docs/tsconfig.json` and resolves to `packages/demo/demos/*`.

## Adding a new demo

1. Create `demos/<name>.tsx` — export a named app component (e.g., `export function MyApp()`)
2. If terminal-runnable: import in `demos/index.tsx`, add to exports and `demos` array
3. If browser-only (uses `@ai-sdk/react`, `localStorage`, etc.): do NOT add to `index.tsx` — docs can still import directly via `@demos/<name>`
4. Run `bun run --cwd packages/demo build` to verify the CLI bundle
5. Update `src/cli.test.ts` if registered in the terminal demo array

## Browser-only demos

Some demos depend on browser APIs and are not registered in the terminal CLI:
- `ai-chat-interface.tsx` — uses `@ai-sdk/react`, `localStorage`, requires `transport` prop
- `focus-ai-chat.tsx` — uses `@ai-sdk/react`, requires `transport` prop
- `ai-chat-models.ts` — uses `localStorage` for model persistence
- `render-message-parts-demo-utils.tsx` — maps AI SDK types to Gridland components

These are imported by docs wrappers via `@demos/*` and receive browser-specific dependencies (like `chatTransport`) as props.

## Conventions

- One exported app component per file (e.g., `SpinnerApp`, `SideNavApp`)
- Files use `// @ts-nocheck` when using OpenTUI intrinsic elements
- Import from `@gridland/ui` and `@gridland/utils`, never internal paths
- Terminal demos must work without browser APIs (no `localStorage`, `fetch`, `@ai-sdk/react`)
