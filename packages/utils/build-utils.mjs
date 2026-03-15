#!/usr/bin/env node
/**
 * Builds @gridland/utils:
 * - dist/index.js — Browser-safe ESM bundle of @opentui/core + @opentui/react
 *
 * No native code. Stubs bun:ffi, tree-sitter, and other native-only deps.
 * Renderables are safe to bundle because they never CREATE buffers —
 * they receive them as parameters. OptimizedBuffer.create() is only called
 * by renderers (CliRenderer / BrowserRenderer), not by renderables.
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

const eventsShim = path.resolve(pkgRoot, "../web/src/shims/events-shim.ts")
const webShimsDir = path.resolve(pkgRoot, "../web/src/shims")

// File-level shims: edit-buffer and editor-view call resolveRenderLib() at runtime,
// which fails in browser because no native RenderLib is registered.
// These two files get replaced with pure-JS browser implementations.
const fileShims = new Map()
for (const [key, shimFile] of Object.entries({
  "edit-buffer": "edit-buffer-stub.ts",
  "editor-view": "editor-view-stub.ts",
  "text-buffer": "text-buffer-shim.ts",
  "text-buffer-view": "text-buffer-view-shim.ts",
  "syntax-style": "syntax-style-shim.ts",
})) {
  fileShims.set(path.resolve(opentuiRoot, "core/src", key + ".ts"), path.resolve(webShimsDir, shimFile))
}

function createPlugin() {
  return {
    name: "resolve-opentui",
    setup(build) {
      // Resolve @opentui packages to source
      build.onResolve({ filter: /^@opentui\/core$/ }, () => ({
        path: path.resolve(opentuiRoot, "core/src/index.ts"),
      }))
      build.onResolve({ filter: /^@opentui\/react$/ }, () => ({
        path: path.resolve(opentuiRoot, "react/src/index.ts"),
      }))

      // File-level shims for edit-buffer and editor-view.
      // Must run for ALL relative imports within opentui source.
      build.onResolve({ filter: /^\./ }, (args) => {
        if (!args.resolveDir) return null
        const resolved = path.resolve(args.resolveDir, args.path)
        for (const candidate of [resolved, resolved + ".ts", resolved + "/index.ts"]) {
          const shim = fileShims.get(candidate)
          if (shim) return { path: shim }
        }
        return null
      })

      // Stub @opentui/core/native
      build.onResolve({ filter: /^@opentui\/core\/native$/ }, () => ({
        path: "opentui-core-native-stub",
        namespace: "stub",
      }))
      build.onLoad({ filter: /opentui-core-native-stub/, namespace: "stub" }, () => ({
        contents: "export const CliRenderer = null; export const CliRenderEvents = null; export const createCliRenderer = null; export const NativeSpanFeed = null; export const setRenderLibPath = () => {};",
        loader: "js",
      }))

      // Stub bun:ffi, bun, bun-ffi-structs
      build.onResolve({ filter: /^bun(:ffi)?$/ }, () => ({
        path: "bun-stub",
        namespace: "stub",
      }))
      build.onResolve({ filter: /bun-ffi-structs/ }, () => ({
        path: "bun-ffi-structs-stub",
        namespace: "stub",
      }))
      build.onLoad({ filter: /bun-(stub|ffi-structs-stub)/, namespace: "stub" }, () => ({
        contents: "export default {}; export const ptr = () => 0; export const toBuffer = () => new Uint8Array(); export const CString = class {}; export const FFIType = {};",
        loader: "js",
      }))

      // Stub tree-sitter → use real shim files (they export all needed names)
      build.onResolve({ filter: /tree-sitter-styled-text/ }, () => ({
        path: path.resolve(webShimsDir, "tree-sitter-styled-text-stub.ts"),
      }))
      build.onResolve({ filter: /tree-sitter/ }, () => ({
        path: path.resolve(webShimsDir, "tree-sitter-stub.ts"),
      }))
      build.onResolve({ filter: /hast-styled-text/ }, () => ({
        path: path.resolve(webShimsDir, "hast-stub.ts"),
      }))
      build.onResolve({ filter: /\.(wasm|scm)$/ }, () => ({
        path: "asset-stub",
        namespace: "stub",
      }))
      build.onResolve({ filter: /devtools-polyfill/ }, () => ({
        path: path.resolve(webShimsDir, "devtools-polyfill-stub.ts"),
      }))
      build.onResolve({ filter: /react-devtools-core/ }, () => ({
        path: path.resolve(webShimsDir, "devtools-polyfill-stub.ts"),
      }))
      build.onLoad({ filter: /asset-stub/, namespace: "stub" }, () => ({
        contents: "export default null;",
        loader: "js",
      }))

      // events → real shim
      build.onResolve({ filter: /^events$/ }, () => ({
        path: eventsShim,
      }))

      // Safety net: stub any remaining node: imports
      build.onResolve({ filter: /^node:/ }, () => ({
        path: "node-stub",
        namespace: "stub",
      }))
      build.onLoad({ filter: /node-stub/, namespace: "stub" }, () => ({
        contents: "export default {}; export const inspect = (v) => String(v);",
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
    platform: "neutral",
    target: "esnext",
    sourcemap: true,
    external: ["react", "react-dom"],
    plugins: [createPlugin()],
    banner: { js: requireShimBanner },
    define: { "globalThis.Bun": "undefined" },
  })

  // Post-process: fix circular dependency ordering + remove duplicate Yoga WASM.
  // Single read → both transforms → single write.
  const fs = await import("fs")
  const distPath = path.resolve(pkgRoot, "dist/index.js")
  let code = fs.readFileSync(distPath, "utf-8")

  // 1. Hoist Renderable class definition before first subclass
  const lines = code.split("\n")
  const marker = "// ../../opentui/packages/core/src/Renderable.ts"

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
        if (lines[i].trim().startsWith("// ../../opentui/packages/")) {
          endIdx = i
          break
        }
      }
      const section = lines.splice(sectionIdx, endIdx - sectionIdx)
      let insertAt = firstUsageIdx
      for (let i = firstUsageIdx - 1; i >= 0; i--) {
        if (lines[i].trim().startsWith("// ../../opentui/packages/")) {
          insertAt = i
          break
        }
      }
      lines.splice(insertAt, 0, ...section)
      console.log(`  Hoisted Renderable class definition (${section.length} lines) before first subclass`)
    }
  }

  // 2. Remove duplicate Yoga WASM + init code
  code = lines.join("\n")
  const beforeLen = code.length
  code = code.replace(/var loadYoga2 = \(\(\) => \{[\s\S]*?var Yoga2 = wrapAssembly2\(await yoga_wasm_base64_esm_default2\(\)\);\n?/m, "")
  if (code.length < beforeLen) {
    const removedKB = Math.round((beforeLen - code.length) / 1024)
    console.log(`  Removed duplicate Yoga WASM code (${removedKB}KB)`)
  }

  fs.writeFileSync(distPath, code)

  console.log("✓ @gridland/utils dist/index.js")
}

main().catch((e) => {
  console.error("Build failed:", e.message)
  process.exit(1)
})
