#!/usr/bin/env node
/**
 * Builds the browser entries (index, next) using esbuild directly.
 *
 * Now that web imports engine code from packages/core/src/ directly,
 * this build script handles all browser shimming (native stubs, tree-sitter,
 * bun:ffi, etc.) — previously done by build-utils.mjs for the old @gridland/utils
 * that bundled the full engine.
 */
import * as esbuild from "esbuild"
import path from "path"
import { readFileSync, writeFileSync } from "fs"
import { fileURLToPath } from "url"

const pkgRoot = path.dirname(fileURLToPath(import.meta.url))
const coreRoot = path.resolve(pkgRoot, "../core")
const coreSrc = path.resolve(coreRoot, "src")
const shimsDir = path.resolve(pkgRoot, "src/shims")

// File-level shims: replace core source files that call resolveRenderLib() or
// use native Zig code with pure-JS browser implementations.
const coreFileShims = new Map()
for (const [key, shimFile] of Object.entries({
  "edit-buffer": "edit-buffer-stub.ts",
  "editor-view": "editor-view-stub.ts",
  "text-buffer": "text-buffer-shim.ts",
  "text-buffer-view": "text-buffer-view-shim.ts",
  "syntax-style": "syntax-style-shim.ts",
})) {
  coreFileShims.set(path.resolve(coreSrc, key + ".ts"), path.resolve(shimsDir, shimFile))
}

// Slider circular dep fix
const sliderFile = path.resolve(coreSrc, "renderables/Slider.ts")
const sliderDeps = path.resolve(shimsDir, "slider-deps.ts")

function createPlugin() {
  return {
    name: "browser-shims",
    setup(build) {
      // Resolve @opentui/core → core source barrel
      build.onResolve({ filter: /^@opentui\/core$/ }, () => ({
        path: path.resolve(coreSrc, "index.ts"),
      }))
      build.onResolve({ filter: /^@opentui\/react$/ }, () => ({
        path: path.resolve(coreSrc, "react/index.ts"),
      }))

      // Stub @opentui/core/native
      build.onResolve({ filter: /^@opentui\/core\/native$/ }, () => ({
        path: "opentui-native-stub",
        namespace: "stub",
      }))

      // File-level shims + Slider circular dep fix + devtools stub
      build.onResolve({ filter: /^\./ }, (args) => {
        if (!args.resolveDir) return null

        const resolved = path.resolve(args.resolveDir, args.path)

        // Slider circular dep fix
        if (args.importer === sliderFile && args.path === "../index") {
          return { path: sliderDeps }
        }

        // Devtools polyfill stub
        if (resolved.endsWith("devtools-polyfill") || resolved.endsWith("devtools-polyfill.ts")) {
          return { path: path.resolve(shimsDir, "devtools-polyfill-stub.ts") }
        }

        // File-level shims
        for (const candidate of [resolved, resolved + ".ts", resolved + "/index.ts"]) {
          const shim = coreFileShims.get(candidate)
          if (shim) return { path: shim }
        }

        return null
      })

      // bun:ffi → shim (provides FFI stubs for browser)
      build.onResolve({ filter: /^bun:ffi$/ }, () => ({
        path: path.resolve(shimsDir, "bun-ffi.ts"),
      }))
      build.onResolve({ filter: /^bun$/ }, () => ({
        path: path.resolve(shimsDir, "bun-ffi.ts"),
      }))
      build.onResolve({ filter: /bun-ffi-structs/ }, () => ({
        path: path.resolve(shimsDir, "bun-ffi-structs.ts"),
      }))

      // tree-sitter stubs
      build.onResolve({ filter: /tree-sitter-styled-text/ }, () => ({
        path: path.resolve(shimsDir, "tree-sitter-styled-text-stub.ts"),
      }))
      build.onResolve({ filter: /tree-sitter/ }, () => ({
        path: path.resolve(shimsDir, "tree-sitter-stub.ts"),
      }))
      build.onResolve({ filter: /hast-styled-text/ }, () => ({
        path: path.resolve(shimsDir, "hast-stub.ts"),
      }))
      build.onResolve({ filter: /\.(wasm|scm)$/ }, () => ({
        path: "asset-stub",
        namespace: "stub",
      }))

      // react-devtools-core stub
      build.onResolve({ filter: /react-devtools-core/ }, () => ({
        path: path.resolve(shimsDir, "devtools-polyfill-stub.ts"),
      }))

      // events → browser shim
      build.onResolve({ filter: /^events$/ }, () => ({
        path: path.resolve(shimsDir, "events-shim.ts"),
      }))

      // Node builtins → stubs
      build.onResolve({ filter: /^node:buffer$/ }, () => ({
        path: "node-buffer-stub",
        namespace: "stub",
      }))
      build.onResolve({ filter: /^node:/ }, () => ({
        path: "node-stub",
        namespace: "stub",
      }))

      // Stub loaders
      build.onLoad({ filter: /opentui-native-stub/, namespace: "stub" }, () => ({
        contents: "export const CliRenderer = null; export const CliRenderEvents = null; export const createCliRenderer = null; export const NativeSpanFeed = null; export const setRenderLibPath = () => {};",
        loader: "js",
      }))
      build.onLoad({ filter: /asset-stub/, namespace: "stub" }, () => ({
        contents: "export default null;",
        loader: "js",
      }))
      build.onLoad({ filter: /node-buffer-stub/, namespace: "stub" }, () => ({
        contents: "export const Buffer = { from: (s) => s, isBuffer: () => false, alloc: (n) => new Uint8Array(n) };",
        loader: "js",
      }))
      build.onLoad({ filter: /node-stub/, namespace: "stub" }, () => ({
        contents: "export default {}; export const inspect = (v) => String(v);",
        loader: "js",
      }))
    },
  }
}

// require() shim for CJS packages (react-reconciler) in ESM bundle.
const requireShimBanner = [
  `import * as __REACT$ from "react";`,
  `import * as __REACTDOM$ from "react-dom";`,
  `var __EXT$ = { "react": __REACT$, "react-dom": __REACTDOM$ };`,
  `var require = globalThis.require || ((id) => {`,
  `  var m = __EXT$[id];`,
  `  if (m) return m;`,
  `  throw new Error('Dynamic require of "' + id + '" is not supported');`,
  `});`,
  `if (typeof process === "undefined") var process = { env: { NODE_ENV: "production" } };`,
].join(" ")

const shared = {
  bundle: true,
  format: "esm",
  platform: "neutral",
  target: "esnext",
  mainFields: ["module", "browser", "main"],
  conditions: ["import", "browser"],
  external: ["react", "react-dom", "react-reconciler", "react-reconciler/constants"],
  plugins: [createPlugin()],
  sourcemap: true,
  banner: { js: requireShimBanner },
  define: {
    "globalThis.Bun": "undefined",
  },
}

/**
 * Post-process: hoist Renderable class definition before first subclass usage.
 * esbuild may place the base Renderable class after subclasses due to circular deps.
 */
function postProcess(distPath) {
  let code = readFileSync(distPath, "utf-8")
  const lines = code.split("\n")

  // 1. Hoist Renderable class definition before first subclass
  const marker = "// ../core/src/Renderable.ts"

  let firstUsageIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (/class\s.*extends\s+(Renderable3|BaseRenderable)\b/.test(lines[i])) {
      firstUsageIdx = i
      break
    }
  }

  const markerPositions = []
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === marker) markerPositions.push(i)
  }

  if (firstUsageIdx !== -1 && markerPositions.length > 0) {
    const sectionIdx = markerPositions[markerPositions.length - 1]
    if (sectionIdx > firstUsageIdx) {
      let endIdx = lines.length
      for (let i = sectionIdx + 1; i < lines.length; i++) {
        if (lines[i].trim().startsWith("// ../core/src/")) {
          endIdx = i
          break
        }
      }
      const section = lines.splice(sectionIdx, endIdx - sectionIdx)
      let insertAt = firstUsageIdx
      for (let i = firstUsageIdx - 1; i >= 0; i--) {
        if (lines[i].trim().startsWith("// ../core/src/")) {
          insertAt = i
          break
        }
      }
      lines.splice(insertAt, 0, ...section)
      console.log(`  Hoisted Renderable (${section.length} lines) before first subclass`)
    }
  }

  // 2. Remove duplicate Yoga WASM + init code
  code = lines.join("\n")
  const beforeLen = code.length
  code = code.replace(/var loadYoga2 = \(\(\) => \{[\s\S]*?var Yoga2 = wrapAssembly2\(await yoga_wasm_base64_esm_default2\(\)\);\n?/m, "")
  if (code.length < beforeLen) {
    const removedKB = Math.round((beforeLen - code.length) / 1024)
    console.log(`  Removed duplicate Yoga WASM (${removedKB}KB)`)
  }

  writeFileSync(distPath, code)
}

async function main() {
  // Build index (main browser bundle)
  const indexPath = path.resolve(pkgRoot, "dist/index.js")
  await esbuild.build({
    ...shared,
    entryPoints: [path.resolve(pkgRoot, "src/index.ts")],
    outfile: indexPath,
  })
  postProcess(indexPath)
  console.log("dist/index.js built")

  // Build next (browser bundle with "use client" banner)
  const nextPath = path.resolve(pkgRoot, "dist/next.js")
  await esbuild.build({
    ...shared,
    entryPoints: [path.resolve(pkgRoot, "src/next.ts")],
    outfile: nextPath,
    banner: { js: '"use client";\n' + requireShimBanner },
  })
  postProcess(nextPath)
  console.log("dist/next.js built")
}

main().catch((e) => {
  console.error("Build failed:", e.message)
  process.exit(1)
})
