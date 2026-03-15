#!/usr/bin/env node
/**
 * Builds @gridland/core by bundling @opentui/core and @opentui/react from
 * the monorepo source WITHOUT browser stubs. Native modules (bun:ffi, node
 * built-ins, etc.) are externalized — they resolve at runtime in Bun/Node.
 *
 * Browser environments never load this bundle directly; the Vite and Next.js
 * plugins in @gridland/web alias @gridland/core to a browser-compatible
 * core-shims bundle instead.
 */
import * as esbuild from "esbuild"
import path from "path"
import { fileURLToPath } from "url"

const pkgRoot = path.dirname(fileURLToPath(import.meta.url))
const opentuiRoot = path.resolve(pkgRoot, "../../opentui/packages")

// require() shim for CJS packages (react-reconciler) in ESM bundle.
const requireShimBanner = [
  `import * as __REACT$ from "react";`,
  `var __EXT$ = { "react": __REACT$ };`,
  `var require = globalThis.require || ((id) => {`,
  `  var m = __EXT$[id];`,
  `  if (m) return m;`,
  `  throw new Error('Dynamic require of "' + id + '" is not supported');`,
  `});`,
  `if (typeof process === "undefined") var process = { env: {} };`,
].join(" ")

// Plugin that resolves @opentui/* to the monorepo source (no shims).
const resolvePlugin = {
  name: "resolve-opentui",
  setup(build) {
    build.onResolve({ filter: /^@opentui\/core$/ }, () => ({
      path: path.resolve(opentuiRoot, "core/src/index.ts"),
    }))
    build.onResolve({ filter: /^@opentui\/react$/ }, () => ({
      path: path.resolve(opentuiRoot, "react/src/index.ts"),
    }))
    // Stub zig native FFI loader (loads platform-specific .dylib/.so binaries)
    build.onResolve({ filter: /\/zig$/ }, (args) => {
      if (args.resolveDir.includes("opentui")) {
        return { path: path.resolve(pkgRoot, "../web/src/shims/zig-stub.ts") }
      }
    })
    // Stub bun-ffi-structs (not available outside Bun's native FFI)
    build.onResolve({ filter: /bun-ffi-structs/ }, () => ({
      path: path.resolve(pkgRoot, "../web/src/shims/bun-ffi-structs.ts"),
    }))
    // Stub tree-sitter (uses `import with { type: "file" }` which esbuild
    // can't handle). Tree-sitter is for syntax highlighting, not core rendering.
    build.onResolve({ filter: /tree-sitter/ }, () => ({
      path: path.resolve(pkgRoot, "../web/src/shims/tree-sitter-stub.ts"),
    }))
    build.onResolve({ filter: /hast-styled-text/ }, () => ({
      path: path.resolve(pkgRoot, "../web/src/shims/hast-stub.ts"),
    }))
    build.onResolve({ filter: /\.(wasm|scm)$/ }, () => ({
      path: path.resolve(pkgRoot, "../web/src/shims/tree-sitter-stub.ts"),
    }))
    // Stub devtools polyfill (uses top-level await for ws import)
    build.onResolve({ filter: /devtools-polyfill/ }, () => ({
      path: path.resolve(pkgRoot, "../web/src/shims/devtools-polyfill-stub.ts"),
    }))
    build.onResolve({ filter: /react-devtools-core/ }, () => ({
      path: path.resolve(pkgRoot, "../web/src/shims/devtools-polyfill-stub.ts"),
    }))
  },
}

async function main() {
  await esbuild.build({
    entryPoints: [path.resolve(pkgRoot, "src/index.ts")],
    outfile: path.resolve(pkgRoot, "dist/index.js"),
    bundle: true,
    format: "esm",
    platform: "neutral",
    target: "esnext",
    external: [
      "react", "react-dom",
      "bun:ffi", "bun",
      "events",
      "fs", "fs/promises", "path", "os", "stream", "url", "util",
      "node:fs", "node:path", "node:os", "node:stream", "node:url",
      "node:util", "node:buffer", "node:console", "node:child_process",
      "node:net", "node:tty", "node:process", "node:events",
      "tree-sitter-styled-text", "web-tree-sitter", "hast-styled-text",
      "ws",
    ],
    plugins: [resolvePlugin],
    sourcemap: true,
    banner: { js: requireShimBanner },
  })
  console.log("✓ @gridland/core dist/index.js")
}

main().catch((e) => {
  console.error("Build failed:", e.message)
  process.exit(1)
})
