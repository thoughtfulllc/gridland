# Registry Emission Pipeline

**When this loads:** You are touching `packages/ui/scripts/build-registry.ts`, `packages/ui/package.json`, `packages/ui/tsconfig.json`, any file under `packages/ui/lib/` or `packages/ui/hooks/`, or you are adding a new component under `packages/ui/components/`.

## The Invariant

Source files in `packages/ui/{components,lib,hooks}/` import each other through **registry-local aliases** — `@/registry/gridland/ui/*`, `@/registry/gridland/lib/*`, `@/registry/gridland/hooks/*`. The builder (`packages/ui/scripts/build-registry.ts`) reads those files **verbatim** and inlines their content into a JSON item at `packages/docs/public/r/<name>.json`. It does **not** transform imports, rewrite paths, concatenate files, or run any kind of codegen. Shadcn's upstream CLI — the one end users run as `shadcn@latest add` — rewrites the `@/registry/gridland/*` aliases to the user's `components.json` aliases at install time.

If you find yourself wanting to add a transformation step to the builder, stop. The whole point of the post-refactor design is that transformation happens on the user's machine, not ours.

## The Three Channels

Shadcn's schema ties each item type to a `components.json` alias on the end user's disk:

| Item type | Gridland source folder | User's `components.json` alias | Default location on user disk |
|---|---|---|---|
| `registry:ui` | `packages/ui/components/<name>/` | `aliases.ui` | `@/components/ui/<name>.tsx` |
| `registry:lib` | `packages/ui/lib/<name>.ts` or `lib/<group>/` | `aliases.lib` | `@/lib/<name>.ts` |
| `registry:hook` | `packages/ui/hooks/<name>.ts` | `aliases.hooks` | `@/hooks/<name>.ts` |

Pick the type based on what the file *is*, not where it happens to live. A React component goes under `components/` and ships as `registry:ui`. A helper function goes under `lib/` and ships as `registry:lib`. A hook goes under `hooks/` and ships as `registry:hook`.

## Checklist when adding a new item to `ITEMS`

For every new entry in `packages/ui/scripts/build-registry.ts`:

1. **Decide the type.** Component → `registry:ui`. Utility → `registry:lib`. Hook → `registry:hook`. If it's multi-file (e.g. a theme item with types + themes + provider + hooks in one registry unit), each file inside `files[]` can carry its own `type`.
2. **Set `files`** with each file's `src` (path inside `packages/ui`) and `registryPath` (path that appears in the emitted JSON, always starting with `registry/gridland/...`).
3. **List `dependencies`** — the npm packages the source imports from. Any `import ... from "@gridland/utils"` or `from "react-hook-form"` or `from "cmdk"` must appear here. Shadcn's CLI runs `npm install` / `pnpm add` / etc. on this list when the user adds the item.
4. **List `registryDependencies`** — other registry items this one depends on, using bare names (`"theme"`, `"text-style"`, `"provider"`). The emitter prepends `@gridland/` automatically. Shadcn's resolver fetches these recursively and topo-sorts so dependencies install before dependents.
5. **Add `categories`** (optional but helpful) — `["input"]`, `["overlay"]`, `["navigation"]`, `["feedback"]`, `["layout"]`, `["primitive"]`, `["utility"]`, `["theme"]`.
6. **Run the build and inspect.** `bun run --cwd packages/ui build`, then `cat packages/docs/public/r/<name>.json | jq '.dependencies, .registryDependencies, .files[0].path'`.

## Verification One-Liners

```bash
bun run --cwd packages/ui build                            # builds, should print "Built 20 registry items" (or N after adding)
jq '.type, (.files | length)' packages/docs/public/r/theme.json
jq '.dependencies, .registryDependencies' packages/docs/public/r/modal.json
jq '.type' packages/docs/public/r/use-breakpoints.json     # → "registry:hook"
# No relative imports should leak into emitted content:
rg '"\.\./|"\./theme"' packages/docs/public/r/*.json && echo "FAIL: relative imports leaked"
```

## Anti-Patterns

- **Reintroducing `IMPORT_REWRITES`, `rewriteImports`, or `buildThemeSource` in the builder.** These were regex-based build-time transformations in the pre-refactor code. They are gone. The builder now just reads files and writes JSON.
- **Writing relative imports between `components/`, `lib/`, and `hooks/`.** Use `@/registry/gridland/{ui,lib,hooks}/*` aliases. Relative paths get baked into the emitted JSON and break for users whose `components.json` puts `lib` and `ui` in different directories.
- **Adding a multi-file item but forgetting to declare all files.** If component X imports a helper file Y, both must be listed in the item's `files` array (or Y must be a separate registry item that X lists in `registryDependencies`). Shadcn will not synthesize missing files.
- **Forgetting `dependencies` when a file imports from `@gridland/utils` or another npm package.** Shadcn installs only the packages you list. Missing entries cause `Cannot find module` at runtime on the user's machine.
- **Emitting to anywhere other than `packages/docs/public/r/`.** The docs site serves this directory as static files. Writing to an intermediate folder (e.g. `packages/ui/registry/`) and expecting something else to copy it is the pre-refactor pipeline and it is gone.
- **Recreating `packages/ui/registry/`, `packages/ui/registry.json`, `packages/ui/dist/`, `packages/ui/tsup.config.ts`, or `packages/docs/scripts/copy-registry.ts`.** All five were deleted on purpose.

## Background

The `make-it-better` branch refactored this pipeline. See the Notion page *Registry pipeline refactor + create-gridland add — what shipped on make-it-better* for the history, the three critical defects that motivated the refactor, and the five-phase execution that shipped it.
