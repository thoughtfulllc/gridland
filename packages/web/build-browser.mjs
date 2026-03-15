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

// require() shim for CJS packages in ESM bundle.
const requireShimBanner = [
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

const shared = {
  bundle: true,
  format: "esm",
  platform: "neutral",
  target: "esnext",
  mainFields: ["module", "browser", "main"],
  conditions: ["import", "browser"],
  external: ["react", "react-dom", "@gridland/utils"],
  sourcemap: true,
  banner: { js: requireShimBanner },
}

async function main() {
  // Build index (main browser bundle)
  await esbuild.build({
    ...shared,
    entryPoints: [path.resolve(pkgRoot, "src/index.ts")],
    outfile: path.resolve(pkgRoot, "dist/index.js"),
  })
  console.log("✓ dist/index.js")

  // Build next (browser bundle with "use client" banner)
  await esbuild.build({
    ...shared,
    entryPoints: [path.resolve(pkgRoot, "src/next.ts")],
    outfile: path.resolve(pkgRoot, "dist/next.js"),
    banner: { js: '"use client";\n' + requireShimBanner },
  })
  console.log("✓ dist/next.js")
}

main().catch((e) => {
  console.error("Build failed:", e.message)
  process.exit(1)
})
