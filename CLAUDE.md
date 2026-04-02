# Gridland TUI Framework

Gridland is a React-based TUI framework built on OpenTUI that renders to an HTML canvas via a custom reconciler. Components are JSX but rendered to pixels, not HTML. Files using OpenTUI intrinsic elements (`<box>`, `<text>`, `<span>`) carry `// @ts-nocheck` at the top.

## Project Structure

```
packages/
├── bun/            @gridland/bun — Bun runtime bindings
├── chat-worker/    @gridland/chat-worker — chat worker (private)
├── container/      @gridland/container — isolated Docker container runner
├── core/           Internal — focus system, reconciler, hooks source (NOT for external import)
├── create-gridland/ create-gridland — project scaffolding CLI
├── demo/           @gridland/demo — canonical demo implementations (Bun CLI + browser via @demos/* alias)
├── docs/           Documentation site (Next.js, content in content/docs/)
├── testing/        @gridland/testing — test helpers
├── ui/             @gridland/ui — all UI components
├── utils/          @gridland/utils — hooks and utilities
└── web/            @gridland/web — browser renderer (TUI component)
```

## Import Rules

- `@gridland/ui` — UI components
- `@gridland/utils` — hooks (useFocus, FocusProvider, FocusScope, useKeyboard, useShortcuts, useCapturedKeyboard)
- `@gridland/web` — browser renderer (TUI)
- Never import from `@gridland/core` directly — it is internal
- Never import from internal paths (`packages/core/src/...`)

## Export Conventions

Every component in `packages/ui/components/` must have a matching entry in `packages/ui/components/index.ts` with both a runtime export and a type export:

```ts
export { SideNav } from "./side-nav/side-nav"
export type { SideNavProps } from "./side-nav/side-nav"
```

## Testing

- Per-package: `bun test` in each package directory
- All packages: `bun run test` at monorepo root
- UI: `bun run --cwd packages/ui test`
- E2E (Playwright): `bun run test:e2e`
- Never run `bun test --update-snapshots` unless explicitly intending to update — snapshot changes need review

## Anti-Patterns

- Importing from `@gridland/core` directly
- Hardcoded hex colors outside of a named constant or theme
- Running `bun test --update-snapshots` without reviewing changes
- Publishing to npm without explicit approval

## Development Workflow

```
edit code
  → /review              # contract-guardian + framework-compliance
  → /sync-context        # update context files if APIs or patterns changed
  → git commit
  → /review-full         # all 4 agents before opening a PR
  → /review-docs         # if you touched docs, demos, or MDX pages
  → /release-check       # before publishing a package version
```

Other skills: `/create-component` (guided scaffold), `/debug-layout` (layout diagnostics).

**`/sync-context` is required when:** adding/removing a component, hook, or utility; changing a prop name, type, or default; making a non-obvious design choice; changing how a pattern should be used.

**`/sync-context` can be skipped for:** pure bug fixes, renames/typos, test-only changes.

## Context Architecture

Domain knowledge loads automatically via path-scoped rules in `.claude/rules/` when you touch relevant files (OpenTUI layout, focus system, AI SDK conventions, design decisions). Per-package `CLAUDE.md` files in `packages/ui/`, `packages/docs/`, and `packages/demo/` provide package-specific context. Agents are self-contained and carry their own domain knowledge.
