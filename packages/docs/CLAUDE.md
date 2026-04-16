# Gridland Documentation Site

## Structure

- MDX pages: `packages/docs/content/docs/` (component docs, guides)
- Demos: `packages/docs/components/demos/` (live components rendered inside `<TUI>`)
- Next.js app router with Fumadocs
- Registry JSON: `packages/docs/public/r/` (static files, served at `https://gridland.io/r/<name>.json`)

## Information Architecture

Top-level sections carry specific semantics. Put a new page in the section whose question it answers:

| Section | Answers | Example content |
|---|---|---|
| `index.mdx` | What is Gridland? | positioning, 4 principles, no code examples |
| `getting-started/` | How do I start? | installation, framework plugins |
| `core-concepts/` | How does the framework *work*? | rendering, cells and layout, intrinsic elements |
| `theming/` | How do I customize visuals? | colors, text style, breakpoints |
| `interaction/` | How do I handle input? | focus, keyboard, pointer events |
| `components/` | What pre-built UI can I use? | user-facing components from the `@gridland/ui` registry |
| `blocks/` | What composed patterns can I use? | full layouts, AI chat interface |
| `guides/` | How do I do X? | compile-binary, testing, sandboxing, ssr-for-agents |
| `hooks/` | What hooks exist? | `use-*` reference pages |
| `api/` | What does package X export? | per-package reference |

**Core concepts is not guides.** `core-concepts/` is for things users need to *understand* (the rendering model, cell grid, intrinsic elements). `guides/` is for things users need to *do* (compile a binary, write tests, sandbox). These were previously merged under `core-concepts/` and the section became a dumping ground. Don't merge them again.

**Intrinsic elements (`<box>`, `<text>`, `<input>`, etc.) live in `core-concepts/intrinsic-elements.mdx`, not in `components/`.** They are framework primitives, not installable components. The `components/` section is reserved for React components users install via the shadcn registry.

**`index.mdx` follows the shadcn intro model.** One-sentence pitch, a "this is not..." positioning line, four H2 principle sections, then cards. No code examples on the intro page: they belong on installation and component pages, one click away. Resist the urge to add a quick snippet.

## Registry emission

The shadcn registry that end users consume is emitted directly into this package's `public/r/` by `packages/ui/scripts/build-registry.ts`. Next.js serves the files as static assets \u2014 there is no separate copy step and no intermediate staging folder.

`next.config.ts` and `tsconfig.json` both declare path aliases so that source files under `packages/ui/{components,lib,hooks}/` \u2014 which import each other through `@/registry/gridland/{ui,lib,hooks}/*` \u2014 resolve correctly when the docs site builds demos against them:

- webpack: `@/registry/gridland/ui` \u2192 `../ui/components`, `@/registry/gridland/lib` \u2192 `../ui/lib`, `@/registry/gridland/hooks` \u2192 `../ui/hooks`
- tsconfig `paths`: same three entries for type-checking

If you ever see a runtime `Cannot find module "@/registry/gridland/..."` error when rendering a demo, the alias entries in `next.config.ts` or `tsconfig.json` have drifted out of sync with `packages/ui/tsconfig.json`.

Do not reintroduce `packages/docs/scripts/copy-registry.ts` \u2014 it was deleted on purpose, and the docs build script no longer calls it.

## Demo Conventions

- Core demo logic lives in `packages/demo/demos/`. Files in `packages/docs/components/demos/` are thin wrappers that import from `@demos/*` and add docs-specific variants (multiple states, pickers, DemoWindow chrome). Never put standalone demo implementations in the docs wrapper directory.
- Import from `@gridland/ui`, `@gridland/utils`, `@gridland/web` — never internal paths
- Interactive components need interactive demos with `useState` + `useKeyboard`
- Static components (Spinner, Ascii) can use simple rendering
- Every component exported from `@gridland/ui` should have a doc page and demo

## Code Examples in MDX

Every fenced code block is verified by the `docs-mirror` agent as testable code:
- Import paths must match actual exports from `packages/ui/components/index.ts`
- Props must exist in the current `{ComponentName}Props` interface
- No anti-patterns (e.g., `tool-invocation`, `@ai-sdk/react` for `UIMessagePart`)

## Next.js Conventions

- `"use client"` directive when component uses React hooks or browser APIs
- App router patterns for pages and layouts
- Canvas-based TUI component requires client-side rendering
