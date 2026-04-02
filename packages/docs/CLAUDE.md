# Gridland Documentation Site

## Structure

- MDX pages: `packages/docs/content/docs/` (component docs, guides)
- Demos: `packages/docs/components/demos/` (live components rendered inside `<TUI>`)
- Next.js app router with Fumadocs

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
