#!/usr/bin/env node
/**
 * Builds the browser entries (index, next) using esbuild directly.
 * tsup's internal plugins intercept bun:ffi and node built-in imports
 * before user plugins can shim them, so we bypass tsup for these entries.
 */
import * as esbuild from "esbuild"
import path from "path"
import { fileURLToPath } from "url"
import { createShimPlugin, requireShimBanner } from "./build-shims.mjs"

const pkgRoot = path.dirname(fileURLToPath(import.meta.url))

const shimPlugin = createShimPlugin(pkgRoot)

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
