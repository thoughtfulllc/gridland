import { defineConfig } from "tsup"
import type { Plugin } from "esbuild"

// Browser entries import opentui engine code via relative paths and
// @opentui/* bare specifiers. These rely on the Vite/Next.js plugin for
// proper module resolution (zig stubs, tree-sitter stubs, etc.).
// Externalize them so the tsup build succeeds — consumers always use
// these entries through Vite or Next.js which handle resolution.
const externalOpentui: Plugin = {
  name: "external-opentui",
  setup(build) {
    // Bare @opentui/* imports (e.g. require("@opentui/core") in mount.ts)
    build.onResolve({ filter: /^@opentui\// }, (args) => ({
      path: args.path,
      external: true,
    }))
    // Relative imports reaching into the external opentui monorepo
    build.onResolve({ filter: /opentui\/packages/ }, (args) => ({
      path: args.path,
      external: true,
    }))
  },
}

export default defineConfig([
  // Main bundle (browser runtime)
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    external: ["react", "react-dom"],
    esbuildPlugins: [externalOpentui],
    target: "esnext",
    platform: "browser",
  },
  // Core bundle (smaller, for use with Vite plugin)
  {
    entry: { core: "src/core.ts" },
    format: ["esm"],
    dts: true,
    sourcemap: true,
    external: ["react", "react-dom"],
    esbuildPlugins: [externalOpentui],
    target: "esnext",
    platform: "browser",
  },
  // Vite plugin (Node.js)
  {
    entry: { "vite-plugin": "src/vite-plugin.ts" },
    format: ["esm"],
    dts: true,
    sourcemap: true,
    external: ["vite", "path"],
    target: "node18",
    platform: "node",
  },
  // Next.js export
  {
    entry: { next: "src/next.ts" },
    format: ["esm"],
    dts: true,
    sourcemap: true,
    external: ["react", "react-dom"],
    esbuildPlugins: [externalOpentui],
    target: "esnext",
    platform: "browser",
    banner: { js: '"use client";' },
  },
  // Next.js plugin (Node.js, ESM + CJS since Next.js loads config via require())
  {
    entry: { "next-plugin": "src/next-plugin.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    external: ["next", "webpack"],
    target: "node18",
    platform: "node",
  },
  // Utils (SSR-safe)
  {
    entry: { utils: "src/utils.ts" },
    format: ["esm"],
    dts: true,
    sourcemap: true,
    target: "esnext",
    platform: "neutral",
  },
])
