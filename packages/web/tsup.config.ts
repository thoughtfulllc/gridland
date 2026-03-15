import { defineConfig } from "tsup"

export default defineConfig([
  // DTS-only for browser entries (JS built by build-browser.mjs via esbuild directly,
  // because tsup's internal plugins intercept bun:ffi and node built-ins before
  // user plugins can shim them)
  {
    entry: { index: "src/index.ts", next: "src/next.ts" },
    format: ["esm"],
    dts: { only: true },
    external: [
      "react", "react-dom", "react-devtools-core",
      /^@opentui\//, /^@gridland\/utils/, /^bun/, "events",
      "fs", "fs/promises", "path", "os", "stream", "url", "util",
      /^node:/, /tree-sitter/, /hast-styled-text/, /bun-ffi-structs/,
    ],
    target: "esnext",
    platform: "neutral",
  },
  // Vite plugin (Node.js)
  {
    entry: { "vite-plugin": "src/vite-plugin.ts" },
    format: ["esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    external: ["vite", "path", "module", "url"],
    target: "node18",
    platform: "node",
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
