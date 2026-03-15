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

// Shim plugin applies browser stubs for any remaining opentui source
// imports (core-shims barrel, etc.). Web source now imports from
// @gridland/core directly (which is in the external list).
const shimPlugin = createShimPlugin(pkgRoot)

const shared = {
  bundle: true,
  format: "esm",
  platform: "neutral",
  target: "esnext",
  mainFields: ["module", "browser", "main"],
  conditions: ["import", "browser"],
  external: ["react", "react-dom", "@gridland/core"],
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

  // Build compiled core-shims for npm mode.
  // End-user projects don't have the opentui submodule, so the Vite and
  // Next.js plugins alias @opentui/core to this pre-compiled bundle
  // instead of the raw core-shims/index.ts (which has monorepo-relative paths).
  // Built from the REAL @opentui/core entry point with shims applied —
  // this ensures all exports are included (not just the manual subset).
  const coreShimsPlugin = createShimPlugin(pkgRoot)
  await esbuild.build({
    entryPoints: [path.resolve(pkgRoot, "src/core-shims-entry.ts")],
    outfile: path.resolve(pkgRoot, "dist/core-shims.js"),
    bundle: true,
    format: "esm",
    platform: "neutral",
    target: "esnext",
    mainFields: ["module", "browser", "main"],
    conditions: ["import", "browser"],
    external: ["react", "react-dom"],
    plugins: [coreShimsPlugin],
    sourcemap: true,
    banner: { js: requireShimBanner },
  })
  console.log("✓ dist/core-shims.js")
}

main().catch((e) => {
  console.error("Build failed:", e.message)
  process.exit(1)
})
