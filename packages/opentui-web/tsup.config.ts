import { defineConfig } from "tsup"

export default defineConfig([
  // Main bundle (browser runtime)
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    external: ["react", "react-dom"],
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
    target: "esnext",
    platform: "browser",
    banner: { js: '"use client";' },
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
