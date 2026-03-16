#!/usr/bin/env node
/**
 * Builds @gridland/bun:
 * - dist/index.js — Monolithic Bun-native ESM bundle.
 *
 * Bundles EVERYTHING (engine + reconciler + native FFI) in one file from
 * packages/core/ source. No engine code is externalized to @gridland/utils.
 * This prevents segfaults caused by bun:ffi pointers crossing npm package boundaries.
 *
 * Shared state (AppContext, engine) uses globalThis singletons so that hooks
 * imported from @gridland/utils reference the same instances as the bundled engine.
 */
import * as esbuild from "esbuild"
import path from "path"
import { copyFileSync } from "fs"
import { fileURLToPath } from "url"

const pkgRoot = path.dirname(fileURLToPath(import.meta.url))
const coreSrc = path.resolve(pkgRoot, "../core/src")

// require() shim for CJS packages (react-reconciler) in ESM bundle.
const requireShimBanner = [
  `import * as __REACT$ from "react";`,
  `var __EXT$ = { "react": __REACT$ };`,
  `var require = globalThis.require || ((id) => {`,
  `  var m = __EXT$[id];`,
  `  if (m) return m;`,
  `  throw new Error('Dynamic require of "' + id + '" is not supported');`,
  `});`,
  // Force production mode for react-reconciler — the development build's user timing
  // code writes errors to stderr that get captured by TerminalConsole.
  `if (typeof process !== "undefined" && !process.env.NODE_ENV) process.env.NODE_ENV = "production";`,
].join(" ")

function createPlugin() {
  const webShimsDir = path.resolve(pkgRoot, "../web/src/shims")

  return {
    name: "bun-monolithic",
    setup(build) {
      // Stub devtools (optional peer dep)
      build.onResolve({ filter: /devtools-polyfill/ }, () => ({
        path: path.resolve(webShimsDir, "devtools-polyfill-stub.ts"),
      }))
      build.onResolve({ filter: /react-devtools-core/ }, () => ({
        path: path.resolve(webShimsDir, "devtools-polyfill-stub.ts"),
      }))

      // tree-sitter file assets (wasm/scm) — stub with null exports
      build.onResolve({ filter: /\.(wasm|scm)$/ }, () => ({
        path: "asset-stub",
        namespace: "bun-stub",
      }))
      build.onLoad({ filter: /asset-stub/, namespace: "bun-stub" }, () => ({
        contents: "export default null;",
        loader: "js",
      }))

      // Resolve package.json imports (used by host-config for rendererPackageName)
      build.onResolve({ filter: /package\.json$/ }, (args) => {
        if (args.resolveDir) {
          return { path: path.resolve(args.resolveDir, args.path) }
        }
        return null
      })

      // tree-sitter default-parsers.ts uses `with { type: "file" }` imports
      // that esbuild doesn't support. Stub the entire file.
      build.onResolve({ filter: /default-parsers/ }, (args) => {
        if (args.resolveDir?.includes("tree-sitter")) {
          return { path: "default-parsers-stub", namespace: "bun-stub" }
        }
        return null
      })
      build.onLoad({ filter: /default-parsers-stub/, namespace: "bun-stub" }, () => ({
        contents: "export const defaultParsers = []; export function getParsers() { return defaultParsers; }",
        loader: "js",
      }))
    },
  }
}

async function main() {
  await esbuild.build({
    entryPoints: [path.resolve(pkgRoot, "src/index.ts")],
    outfile: path.resolve(pkgRoot, "dist/index.js"),
    bundle: true,
    format: "esm",
    platform: "node",
    target: "esnext",
    sourcemap: true,
    treeShaking: true,
    loader: { ".json": "json" },
    external: [
      // React — peer dep, must be singleton
      "react", "react-dom",
      // react-reconciler — CJS, resolved at runtime via Bun's require()
      "react-reconciler", "react-reconciler/constants",
      // Bun native FFI — resolved at runtime
      "bun:ffi",
      // Node builtins
      "events", "fs", "fs/promises", "path", "os", "stream", "url", "util", "crypto",
      "node:fs", "node:path", "node:os", "node:stream", "node:url",
      "node:util", "node:buffer", "node:console", "node:child_process",
      "node:net", "node:tty", "node:process", "node:events", "node:crypto",
      // tree-sitter (optional, loaded dynamically)
      "web-tree-sitter",
      // bun internals
      "bun",
      // WebSocket (devtools, optional)
      "ws",
    ],
    plugins: [createPlugin()],
    banner: { js: requireShimBanner },
  })

  // Copy hand-written DTS to dist
  copyFileSync(
    path.resolve(pkgRoot, "src/index.d.ts"),
    path.resolve(pkgRoot, "dist/index.d.ts"),
  )

  console.log("@gridland/bun dist/index.js built")
}

main().catch((e) => {
  console.error("Build failed:", e.message)
  process.exit(1)
})
