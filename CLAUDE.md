# Gridland TUI Framework

Gridland is a React-based TUI framework built on OpenTUI that renders to an HTML canvas via a custom reconciler. Components are JSX but rendered to pixels, not HTML. Files using OpenTUI intrinsic elements (`<box>`, `<text>`, `<span>`) carry `// @ts-nocheck` at the top.

## Project Structure

```
packages/
├── bun/            @gridland/bun — Bun runtime bindings
├── chat-worker/    @gridland/chat-worker — chat worker (private)
├── container/      @gridland/container — isolated Docker container runner
├── core/           Internal — focus system, reconciler, hooks source (NOT for external import)
├── create-gridland/ create-gridland — project scaffold CLI + `add <component>` proxy
├── demo/           @gridland/demo — canonical demo implementations (Bun CLI + browser via @demos/* alias)
├── docs/           Documentation site (Next.js, content in content/docs/, serves registry at public/r/)
├── testing/        @gridland/testing — test helpers
├── ui/             @gridland/ui — UI components (private, registry-only — never published to npm)
│   ├── components/   Component .tsx files, one directory per component
│   ├── lib/          Shared utilities copied alongside components (registry:lib)
│   │   ├── text-style.ts    Bitmask helper for OpenTUI text attributes
│   │   └── theme/           Theme types, provider, and token constants
│   ├── hooks/        Shared hooks (registry:hook) — e.g. use-breakpoints
│   └── scripts/      build-registry.ts — emits shadcn-schema JSON directly to ../docs/public/r/
├── utils/          @gridland/utils — hooks and utilities
└── web/            @gridland/web — browser renderer (TUI component)
```

## Import Rules

- `@gridland/ui` — UI components (workspace alias; the package is `"private": true` and never published to npm — end users get components via the shadcn registry, not `bun install`)
- `@gridland/utils` — hooks (useInteractive, FocusProvider, FocusScope, useKeyboard, useShortcuts, useCapturedKeyboard) and focus border utilities (getFocusBorderStyle, getFocusDividerStyle, FOCUS_BORDER_COLORS)
- `@gridland/web` — browser renderer (TUI)
- `@/registry/gridland/{ui,lib,hooks}/*` — **registry-local alias convention.** Source files *inside* `packages/ui/` import each other through these aliases (e.g. `@/registry/gridland/lib/theme`, `@/registry/gridland/ui/provider/provider`). The `tsconfig.json` in `packages/ui` and the webpack config in `packages/docs` map them to real directories during development. Shadcn's CLI rewrites them to the user's `components.json` aliases at install time, so end users never see these strings. Never write relative imports like `../../lib/theme` between `components/`, `lib/`, and `hooks/` — they would be baked into the emitted registry JSON and break for any user with non-default alias layouts.
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
- **Subprocess spawning:** using `node:child_process` `execSync` with a template-literal command string that interpolates user input. Always use `spawnSync(file, args)` or `execFileSync(file, args)` with an argv array — Node's default is `shell: false`, so metacharacters in argv positions can't be shell-interpreted. See `packages/create-gridland/src/index.ts` for the canonical pattern, or `.claude/rules/subprocess-safety.md` for the full rule.
- **Registry build:** reintroducing `IMPORT_REWRITES`, `rewriteImports`, or `buildThemeSource` inside `packages/ui/scripts/build-registry.ts`. Imports in source files now use `@/registry/gridland/*` aliases, and shadcn's upstream CLI rewrites them to user aliases at install time. Gridland does **no** build-time transformation. See `.claude/rules/registry-pipeline.md`.
- **Deleted artifacts:** recreating any of `packages/ui/registry/`, `packages/ui/registry.json`, `packages/ui/dist/`, `packages/ui/tsup.config.ts`, or `packages/docs/scripts/copy-registry.ts`. All five were removed on purpose. The registry builder writes directly to `packages/docs/public/r/`; `@gridland/ui` has no compiled output because nothing reads one.
- **Relative imports inside `packages/ui/`:** writing `from "../text-style"`, `from "../theme/index"`, `from "../../lib/..."`, or `from "../provider/provider"` inside a component file. Use `@/registry/gridland/{ui,lib,hooks}/*` aliases instead — they survive into the emitted JSON and get rewritten by shadcn's CLI at install time.

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

Other skills: `/create-component` (guided scaffold), `/production-ready` (ship-readiness review for a component), `/debug-layout` (layout diagnostics), `/audit-render` (rendering pipeline clipping audit).

End-user workflow (for scaffolded projects, not for monorepo contributors): users add components with `bunx create-gridland add <component>`, which proxies to `<dlx> shadcn@latest add @gridland/<component>`. The CLI fetches the item JSON from `https://gridland.io/r/<component>.json`, rewrites `@/registry/gridland/*` aliases to the user's `components.json` aliases, writes files into `@/components/ui/` / `@/lib/` / `@/hooks/` by item type, and installs any declared npm `dependencies`.

**`/sync-context` is required when:** adding/removing a component, hook, or utility; changing a prop name, type, or default; making a non-obvious design choice; changing how a pattern should be used.

**`/sync-context` can be skipped for:** pure bug fixes, renames/typos, test-only changes.

## Context Architecture

Domain knowledge loads automatically via path-scoped rules in `.claude/rules/` when you touch relevant files (OpenTUI layout, focus system, AI SDK conventions, design decisions). Per-package `CLAUDE.md` files in `packages/ui/`, `packages/docs/`, and `packages/demo/` provide package-specific context. Agents are self-contained and carry their own domain knowledge.
