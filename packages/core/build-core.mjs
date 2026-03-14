#!/usr/bin/env node
/**
 * Builds @gridland/core using esbuild with shared shim configuration.
 * Core's src/index.ts imports from ../../web/src/ paths which esbuild
 * resolves at build time — consumers only see the bundled output.
 */
import * as esbuild from "esbuild"
import path from "path"
import { fileURLToPath } from "url"
import { createShimPlugin } from "../web/build-shims.mjs"

const pkgRoot = path.dirname(fileURLToPath(import.meta.url))

// Core-specific require shim: only provides react (not react-dom).
// react-reconciler calls require("react") internally, but core
// has no dependency on react-dom.
const coreRequireShimBanner = [
  `import * as __REACT$ from "react";`,
  `var __EXT$ = { "react": __REACT$ };`,
  `var require = globalThis.require || ((id) => {`,
  `  var m = __EXT$[id];`,
  `  if (m) return m;`,
  `  throw new Error('Dynamic require of "' + id + '" is not supported');`,
  `});`,
  `if (typeof process === "undefined") var process = { env: {} };`,
].join(" ")

async function main() {
  await esbuild.build({
    entryPoints: [path.resolve(pkgRoot, "src/index.ts")],
    outfile: path.resolve(pkgRoot, "dist/index.js"),
    bundle: true,
    format: "esm",
    platform: "neutral",
    target: "esnext",
    mainFields: ["module", "browser", "main"],
    conditions: ["import", "browser"],
    external: ["react", "react-dom"],
    plugins: [createShimPlugin(pkgRoot)],
    sourcemap: true,
    banner: { js: coreRequireShimBanner },
  })
  console.log("✓ @gridland/core dist/index.js")
}

main().catch((e) => {
  console.error("Build failed:", e.message)
  process.exit(1)
})
