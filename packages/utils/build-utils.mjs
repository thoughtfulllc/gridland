#!/usr/bin/env node
/**
 * Builds @gridland/utils:
 * - dist/index.js — Browser-safe ESM bundle of hooks, types, and utilities.
 *
 * No engine code (reconciler, yoga, renderables, buffers).
 * No native code (bun:ffi, zig).
 * Dramatically simpler than the old build that bundled all of @opentui/core.
 */
import * as esbuild from "esbuild"
import path from "path"
import { fileURLToPath } from "url"

const pkgRoot = path.dirname(fileURLToPath(import.meta.url))
const coreRoot = path.resolve(pkgRoot, "../core/src")

function createPlugin() {
  return {
    name: "resolve-core",
    setup(build) {
      // Stub bun:ffi — nothing in utils touches FFI, but Timeline imports
      // CliRenderer as a type and some transitive imports may reference it.
      build.onResolve({ filter: /^bun:ffi$/ }, () => ({
        path: "bun:ffi",
        external: true,
      }))
      build.onResolve({ filter: /^bun$/ }, () => ({
        path: "bun-stub",
        namespace: "stub",
      }))
      build.onResolve({ filter: /bun-ffi-structs/ }, () => ({
        path: "bun-ffi-structs-stub",
        namespace: "stub",
      }))
      build.onLoad({ filter: /.*/, namespace: "stub" }, (args) => {
        // node:buffer needs a real Buffer stub (used by parse.keypress via KeyHandler)
        if (args.path === "node-stub" || args.path === "node-buffer-stub") {
          return {
            contents: "export default {}; export const Buffer = { from: (s) => s, isBuffer: () => false, alloc: (n) => new Uint8Array(n) };",
            loader: "js",
          }
        }
        return { contents: "export default {};", loader: "js" }
      })

      // Stub events (used by KeyHandler which KeyEvent extends)
      build.onResolve({ filter: /^events$/ }, () => ({
        path: "events-stub",
        namespace: "stub-events",
      }))
      build.onLoad({ filter: /.*/, namespace: "stub-events" }, () => ({
        contents: "export class EventEmitter { on(){} off(){} emit(){} removeListener(){} addListener(){} }; export default EventEmitter;",
        loader: "js",
      }))

      // Node builtins — stub all (utils is browser-safe, no node deps)
      build.onResolve({ filter: /^node:/ }, () => ({
        path: "node-stub",
        namespace: "stub",
      }))
      for (const mod of ["os", "path", "fs", "fs/promises", "util", "url", "stream", "crypto"]) {
        build.onResolve({ filter: new RegExp(`^${mod}$`) }, () => ({
          path: "node-stub",
          namespace: "stub",
        }))
      }

      // tree-sitter and related — stub (not needed for hooks/types)
      build.onResolve({ filter: /tree-sitter/ }, () => ({
        path: "tree-sitter-stub",
        namespace: "stub",
      }))
      build.onResolve({ filter: /hast-styled-text/ }, () => ({
        path: "hast-stub",
        namespace: "stub",
      }))
      build.onResolve({ filter: /\.(wasm|scm)$/ }, () => ({
        path: "asset-stub",
        namespace: "stub",
      }))
      // devtools polyfill
      build.onResolve({ filter: /devtools-polyfill/ }, () => ({
        path: "devtools-stub",
        namespace: "stub",
      }))
      build.onResolve({ filter: /react-devtools-core/ }, () => ({
        path: "devtools-stub",
        namespace: "stub",
      }))
    },
  }
}

// require() shim for CJS packages (events) in ESM bundle.
const requireShimBanner = [
  `import * as __REACT$ from "react";`,
  `var __EXT$ = { "react": __REACT$ };`,
  `var require = (id) => {`,
  `  if (__EXT$[id]) return __EXT$[id];`,
  `  if (id === "bun:ffi" && typeof Bun !== "undefined") return (__EXT$[id] = Bun.FFI);`,
  `  throw new Error('Dynamic require of "' + id + '" is not supported');`,
  `};`,
  `if (typeof process === "undefined") var process = { env: { NODE_ENV: "production" } };`,
].join(" ")

async function main() {
  await esbuild.build({
    entryPoints: [path.resolve(pkgRoot, "src/index.ts")],
    outfile: path.resolve(pkgRoot, "dist/index.js"),
    bundle: true,
    format: "esm",
    platform: "neutral",
    target: "esnext",
    sourcemap: true,
    treeShaking: true,
    external: ["react", "react-dom"],
    plugins: [createPlugin()],
    banner: { js: requireShimBanner },
    define: {
      "process.env.NODE_ENV": '"production"',
    },
  })

  console.log("@gridland/utils dist/index.js built")
}

main().catch((e) => {
  console.error("Build failed:", e.message)
  process.exit(1)
})
