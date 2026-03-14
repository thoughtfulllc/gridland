#!/usr/bin/env node
/**
 * Builds the browser entries (index, next) using esbuild directly.
 * tsup's internal plugins intercept bun:ffi and node built-in imports
 * before user plugins can shim them, so we bypass tsup for these entries.
 */
import * as esbuild from "esbuild"
import path from "path"
import { fileURLToPath } from "url"

const pkgRoot = path.dirname(fileURLToPath(import.meta.url))
const coreRoot = path.resolve(pkgRoot, "../../opentui/packages/core")
const reactRoot = path.resolve(pkgRoot, "../../opentui/packages/react")

// Bare specifier shims: bun, node built-ins, events, @opentui packages
// react-reconciler is pinned to packages/web/node_modules to ensure the
// version matches the consumer's React (0.33.0 for React 19.2+)
const bareShims = {
  "react-reconciler": path.resolve(pkgRoot, "node_modules/react-reconciler/index.js"),
  "react-reconciler/constants": path.resolve(pkgRoot, "node_modules/react-reconciler/constants.js"),
  // Route @opentui/core to our browser-compatible core-shims barrel
  // (the npm-published @opentui/core is built for Bun/terminal, not browsers)
  "@opentui/core": path.resolve(pkgRoot, "src/core-shims/index.ts"),
  "@opentui/react": path.resolve(reactRoot, "src/index.ts"),
  "bun:ffi": path.resolve(pkgRoot, "src/shims/bun-ffi.ts"),
  "bun-ffi-structs": path.resolve(pkgRoot, "src/shims/bun-ffi-structs.ts"),
  bun: path.resolve(pkgRoot, "src/shims/bun-ffi.ts"),
  "node:console": path.resolve(pkgRoot, "src/shims/console.ts"),
  events: path.resolve(pkgRoot, "src/shims/events-shim.ts"),
  "node:buffer": path.resolve(pkgRoot, "src/shims/node-buffer.ts"),
  "node:path": path.resolve(pkgRoot, "src/shims/node-path.ts"),
  path: path.resolve(pkgRoot, "src/shims/node-path.ts"),
  "node:fs": path.resolve(pkgRoot, "src/shims/node-fs.ts"),
  fs: path.resolve(pkgRoot, "src/shims/node-fs.ts"),
  "fs/promises": path.resolve(pkgRoot, "src/shims/node-fs.ts"),
  "node:util": path.resolve(pkgRoot, "src/shims/node-util.ts"),
  util: path.resolve(pkgRoot, "src/shims/node-util.ts"),
  os: path.resolve(pkgRoot, "src/shims/node-os.ts"),
  "node:os": path.resolve(pkgRoot, "src/shims/node-os.ts"),
  stream: path.resolve(pkgRoot, "src/shims/node-stream.ts"),
  "node:stream": path.resolve(pkgRoot, "src/shims/node-stream.ts"),
  url: path.resolve(pkgRoot, "src/shims/node-url.ts"),
  "node:url": path.resolve(pkgRoot, "src/shims/node-url.ts"),
}

// File-level shims: replace entire opentui core source files with browser stubs
// (mirrors the coreFileShims in vite-plugin.ts)
const coreFileShimDefs = {
  zig: "src/shims/zig-stub.ts",
  buffer: "src/browser-buffer.ts",
  "text-buffer": "src/shims/text-buffer-shim.ts",
  "text-buffer-view": "src/shims/text-buffer-view-shim.ts",
  "syntax-style": "src/shims/syntax-style-shim.ts",
  renderer: "src/shims/renderer-stub.ts",
  console: "src/shims/console-stub.ts",
  "edit-buffer": "src/shims/edit-buffer-stub.ts",
  "editor-view": "src/shims/editor-view-stub.ts",
  NativeSpanFeed: "src/shims/native-span-feed-stub.ts",
  "post/filters": "src/shims/filters-stub.ts",
  "animation/Timeline": "src/shims/timeline-stub.ts",
}

const coreFileShims = new Map()
for (const [key, shimPath] of Object.entries(coreFileShimDefs)) {
  coreFileShims.set(
    path.resolve(coreRoot, "src", key + ".ts"),
    path.resolve(pkgRoot, shimPath),
  )
}

const shimPlugin = {
  name: "browser-shims",
  setup(build) {
    build.onResolve({ filter: /.*/ }, (args) => {
      // Bare specifier shims
      if (bareShims[args.path]) return { path: bareShims[args.path] }

      // File-level shims: intercept relative imports that resolve to shimmed opentui files
      if (args.path.startsWith(".") && args.resolveDir) {
        const resolved = path.resolve(args.resolveDir, args.path)
        const shim =
          coreFileShims.get(resolved) ||
          coreFileShims.get(resolved + ".ts") ||
          coreFileShims.get(resolved + "/index.ts")
        if (shim) return { path: shim }
      }

      return undefined
    })
    build.onResolve({ filter: /tree-sitter/ }, () => ({
      path: path.resolve(pkgRoot, "src/shims/tree-sitter-stub.ts"),
    }))
    build.onResolve({ filter: /hast-styled-text/ }, () => ({
      path: path.resolve(pkgRoot, "src/shims/hast-stub.ts"),
    }))
    build.onResolve({ filter: /devtools-polyfill/ }, () => ({
      path: path.resolve(pkgRoot, "src/shims/devtools-polyfill-stub.ts"),
    }))
    build.onResolve({ filter: /react-devtools-core/ }, () => ({
      path: path.resolve(pkgRoot, "src/shims/devtools-polyfill-stub.ts"),
    }))
    build.onResolve({ filter: /\.(wasm|scm)$/ }, () => ({
      path: path.resolve(pkgRoot, "src/shims/tree-sitter-stub.ts"),
    }))
  },
}

// Banner: provide a require() shim for CJS packages (react-reconciler) that
// call require("react") in the ESM bundle. ESM imports are hoisted, so
// __React/__ReactDOM are available when the var require definition runs.
const requireShimBanner = [
  `import * as __REACT$ from "react";`,
  `import * as __REACTDOM$ from "react-dom";`,
  `var __EXT$ = { "react": __REACT$, "react-dom": __REACTDOM$ };`,
  `var require = globalThis.require || ((id) => {`,
  `  var m = __EXT$[id];`,
  `  if (m) return m;`,
  `  throw new Error('Dynamic require of "' + id + '" is not supported');`,
  `});`,
  // Provide process.env for CJS packages that check NODE_ENV at runtime.
  `if (typeof process === "undefined") var process = { env: {} };`,
].join(" ")

const shared = {
  bundle: true,
  format: "esm",
  platform: "neutral",
  target: "esnext",
  mainFields: ["module", "browser", "main"],
  conditions: ["import", "browser"],
  external: ["react", "react-dom"],
  plugins: [shimPlugin],
  sourcemap: true,
  outdir: path.resolve(pkgRoot, "dist"),
  banner: { js: requireShimBanner },
}

async function main() {
  // Build index (main browser bundle)
  await esbuild.build({
    ...shared,
    entryPoints: [path.resolve(pkgRoot, "src/index.ts")],
    outfile: path.resolve(pkgRoot, "dist/index.js"),
    outdir: undefined,
  })
  console.log("✓ dist/index.js")

  // Build next (browser bundle with "use client" banner)
  await esbuild.build({
    ...shared,
    entryPoints: [path.resolve(pkgRoot, "src/next.ts")],
    outfile: path.resolve(pkgRoot, "dist/next.js"),
    outdir: undefined,
    banner: { js: '"use client";\n' + requireShimBanner },
  })
  console.log("✓ dist/next.js")
}

main().catch((e) => {
  console.error("Build failed:", e.message)
  process.exit(1)
})
