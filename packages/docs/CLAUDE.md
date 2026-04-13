# Gridland Documentation Site

## Structure

- MDX pages: `packages/docs/content/docs/` (component docs, guides)
- Demos: `packages/docs/components/demos/` (live components rendered inside `<TUI>`)
- Next.js app router with Fumadocs
- Registry JSON: `packages/docs/public/r/` (static files, served at `https://gridland.io/r/<name>.json`)

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
