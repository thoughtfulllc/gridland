/**
 * Shared esbuild shim configuration for @gridland/web's browser builds.
 * Provides browser-compatible shims for bun, node built-ins, and opentui packages.
 */
import path from "path"

/**
 * Creates bare specifier shim mappings for a given package root.
 * @param {string} pkgRoot - The root directory of the package being built
 */
export function createBareShims(pkgRoot) {
  const webRoot = path.resolve(pkgRoot, pkgRoot.endsWith("web") ? "." : "../web")
  const coreRoot = path.resolve(webRoot, "../../opentui/packages/core")
  const reactRoot = path.resolve(webRoot, "../../opentui/packages/react")

  return {
    "react-reconciler": path.resolve(webRoot, "node_modules/react-reconciler/index.js"),
    "react-reconciler/constants": path.resolve(webRoot, "node_modules/react-reconciler/constants.js"),
    "@opentui/core": path.resolve(webRoot, "src/core-shims/index.ts"),
    "@opentui/react": path.resolve(reactRoot, "src/index.ts"),
    "bun:ffi": path.resolve(webRoot, "src/shims/bun-ffi.ts"),
    "bun-ffi-structs": path.resolve(webRoot, "src/shims/bun-ffi-structs.ts"),
    bun: path.resolve(webRoot, "src/shims/bun-ffi.ts"),
    "node:console": path.resolve(webRoot, "src/shims/console.ts"),
    events: path.resolve(webRoot, "src/shims/events-shim.ts"),
    "node:buffer": path.resolve(webRoot, "src/shims/node-buffer.ts"),
    "node:path": path.resolve(webRoot, "src/shims/node-path.ts"),
    path: path.resolve(webRoot, "src/shims/node-path.ts"),
    "node:fs": path.resolve(webRoot, "src/shims/node-fs.ts"),
    fs: path.resolve(webRoot, "src/shims/node-fs.ts"),
    "fs/promises": path.resolve(webRoot, "src/shims/node-fs.ts"),
    "node:util": path.resolve(webRoot, "src/shims/node-util.ts"),
    util: path.resolve(webRoot, "src/shims/node-util.ts"),
    os: path.resolve(webRoot, "src/shims/node-os.ts"),
    "node:os": path.resolve(webRoot, "src/shims/node-os.ts"),
    stream: path.resolve(webRoot, "src/shims/node-stream.ts"),
    "node:stream": path.resolve(webRoot, "src/shims/node-stream.ts"),
    url: path.resolve(webRoot, "src/shims/node-url.ts"),
    "node:url": path.resolve(webRoot, "src/shims/node-url.ts"),
  }
}

/**
 * Creates the file-level shim map for opentui core source files.
 * @param {string} pkgRoot - The root directory of the package being built
 */
export function createCoreFileShims(pkgRoot) {
  const webRoot = path.resolve(pkgRoot, pkgRoot.endsWith("web") ? "." : "../web")
  const coreRoot = path.resolve(webRoot, "../../opentui/packages/core")

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
      path.resolve(webRoot, shimPath),
    )
  }
  return coreFileShims
}

/**
 * Creates the esbuild shim plugin.
 * Applies browser-compatible stubs for native modules when bundling
 * opentui source (core-shims entry, etc.).
 * @param {string} pkgRoot - The root directory of the package being built
 */
export function createShimPlugin(pkgRoot) {
  const webRoot = path.resolve(pkgRoot, pkgRoot.endsWith("web") ? "." : "../web")
  const bareShims = createBareShims(pkgRoot)
  const coreFileShims = createCoreFileShims(pkgRoot)

  return {
    name: "browser-shims",
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        if (bareShims[args.path]) return { path: bareShims[args.path] }

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
        path: path.resolve(webRoot, "src/shims/tree-sitter-stub.ts"),
      }))
      build.onResolve({ filter: /hast-styled-text/ }, () => ({
        path: path.resolve(webRoot, "src/shims/hast-stub.ts"),
      }))
      build.onResolve({ filter: /devtools-polyfill/ }, () => ({
        path: path.resolve(webRoot, "src/shims/devtools-polyfill-stub.ts"),
      }))
      build.onResolve({ filter: /react-devtools-core/ }, () => ({
        path: path.resolve(webRoot, "src/shims/devtools-polyfill-stub.ts"),
      }))
      build.onResolve({ filter: /\.(wasm|scm)$/ }, () => ({
        path: path.resolve(webRoot, "src/shims/tree-sitter-stub.ts"),
      }))
    },
  }
}

/** require() shim banner for CJS packages in ESM bundles */
export const requireShimBanner = [
  `import * as __REACT$ from "react";`,
  `import * as __REACTDOM$ from "react-dom";`,
  `var __EXT$ = { "react": __REACT$, "react-dom": __REACTDOM$ };`,
  `var require = globalThis.require || ((id) => {`,
  `  var m = __EXT$[id];`,
  `  if (m) return m;`,
  `  throw new Error('Dynamic require of "' + id + '" is not supported');`,
  `});`,
  `if (typeof process === "undefined") var process = { env: {} };`,
].join(" ")

/** Shared esbuild config */
export function createSharedConfig(pkgRoot) {
  return {
    bundle: true,
    format: "esm",
    platform: "neutral",
    target: "esnext",
    mainFields: ["module", "browser", "main"],
    conditions: ["import", "browser"],
    external: ["react", "react-dom"],
    plugins: [createShimPlugin(pkgRoot)],
    sourcemap: true,
    banner: { js: requireShimBanner },
  }
}
