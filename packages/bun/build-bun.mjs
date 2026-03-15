#!/usr/bin/env node
/**
 * Builds @gridland/bun:
 * - dist/index.js — Bun-native ESM bundle
 *
 * Bundles the native-only opentui files (zig, renderer, console, NativeSpanFeed).
 * Shared modules (renderables, buffer, zig-registry, etc.) are externalized
 * to @gridland/utils to ensure a single shared instance of the registry.
 */
import * as esbuild from "esbuild"
import path from "path"
import { fileURLToPath } from "url"

const pkgRoot = path.dirname(fileURLToPath(import.meta.url))
const opentuiRoot = path.resolve(pkgRoot, "../../opentui/packages")
const coreSrc = path.resolve(opentuiRoot, "core/src")

// These files are native-only and should be bundled into @gridland/bun.
// Everything else from opentui/core/src is already in @gridland/utils.
const nativeFiles = new Set([
  "zig.ts",
  "zig-structs.ts",
  "native.ts",
  "renderer.ts",
  "console.ts",
  "NativeSpanFeed.ts",
  "lib/stdin-buffer.ts",
  "lib/bunfs.ts",
  "lib/output.capture.ts",
  "lib/data-paths.ts",
  "lib/KeyHandler.ts",
  "lib/parse.keypress.ts",
].map(f => path.resolve(coreSrc, f)))

// Build a second Set without .ts extensions for extensionless lookups
const nativeFilesNoExt = new Set([...nativeFiles].map(f => f.replace(/\.ts$/, "")))

function isNativeFile(filePath) {
  const normalized = path.resolve(filePath)
  return nativeFiles.has(normalized) || nativeFilesNoExt.has(normalized)
}

function createPlugin() {
  return {
    name: "bun-bundle",
    setup(build) {
      // @gridland/utils is external — shared instance
      build.onResolve({ filter: /^@gridland\/utils$/ }, () => ({
        path: "@gridland/utils",
        external: true,
      }))

      // Resolve @opentui/core barrel → @gridland/utils (external)
      build.onResolve({ filter: /^@opentui\/core$/ }, () => ({
        path: "@gridland/utils",
        external: true,
      }))

      // Resolve @opentui/react → @gridland/utils (external)
      build.onResolve({ filter: /^@opentui\/react$/ }, () => ({
        path: "@gridland/utils",
        external: true,
      }))

      // Resolve @opentui/core/native to source (this IS native code we bundle)
      build.onResolve({ filter: /^@opentui\/core\/native$/ }, () => ({
        path: path.resolve(opentuiRoot, "core/src/native.ts"),
      }))

      // Relative imports from within opentui/core/src:
      // If the resolved file is NOT a native file, externalize to @gridland/utils
      build.onResolve({ filter: /^\./ }, (args) => {
        if (!args.resolveDir || !args.resolveDir.includes("opentui/packages/core/src")) return null

        const resolved = path.resolve(args.resolveDir, args.path)
        const candidates = [resolved, resolved + ".ts", resolved + "/index.ts"]

        for (const candidate of candidates) {
          if (isNativeFile(candidate)) {
            return null // Let esbuild bundle it normally
          }
        }

        // Not a native file → it's in @gridland/utils
        return { path: "@gridland/utils", external: true }
      })
    },
  }
}

// require() shim for CJS packages in ESM bundle.
const requireShimBanner = [
  `import * as __REACT$ from "react";`,
  `var __EXT$ = { "react": __REACT$ };`,
  `var require = globalThis.require || ((id) => {`,
  `  var m = __EXT$[id];`,
  `  if (m) return m;`,
  `  throw new Error('Dynamic require of "' + id + '" is not supported');`,
  `});`,
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
    external: [
      "react", "react-dom",
      "@gridland/utils",
      "bun:ffi", "bun",
      "events",
      "fs", "fs/promises", "path", "os", "stream", "url", "util",
      "node:fs", "node:path", "node:os", "node:stream", "node:url",
      "node:util", "node:buffer", "node:console", "node:child_process",
      "node:net", "node:tty", "node:process", "node:events",
      "tree-sitter-styled-text", "web-tree-sitter", "hast-styled-text",
      "ws",
    ],
    plugins: [createPlugin()],
    banner: { js: requireShimBanner },
  })

  // Copy hand-written DTS to dist
  const fs = await import("fs")
  fs.copyFileSync(
    path.resolve(pkgRoot, "src/index.d.ts"),
    path.resolve(pkgRoot, "dist/index.d.ts"),
  )

  console.log("✓ @gridland/bun dist/index.js + dist/index.d.ts")
}

main().catch((e) => {
  console.error("Build failed:", e.message)
  process.exit(1)
})
