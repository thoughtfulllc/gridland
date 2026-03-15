import { defineConfig } from "tsup"

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm"],
  dts: { only: true },
  external: [
    "react", "react-dom", "react-devtools-core",
    /^@opentui\//, /^bun/, "events",
    "fs", "fs/promises", "path", "os", "stream", "url", "util",
    /^node:/, /tree-sitter/, /hast-styled-text/, /bun-ffi-structs/,
  ],
  target: "esnext",
  platform: "neutral",
})
