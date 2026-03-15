import { defineConfig } from "tsup"

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm"],
  // DTS is generated manually (src/index.ts imports raw opentui native files
  // that require bun:ffi types which tsup can't resolve in isolation).
  // The build script copies the hand-written index.d.ts to dist/.
  dts: false,
  external: [
    "react", "react-dom",
    "@gridland/utils",
    /^@opentui\//,
    /^bun/,
    "events",
    "fs", "fs/promises", "path", "os", "stream", "url", "util",
    /^node:/,
    /tree-sitter/, /hast-styled-text/, /bun-ffi-structs/,
  ],
  target: "esnext",
  platform: "neutral",
})
