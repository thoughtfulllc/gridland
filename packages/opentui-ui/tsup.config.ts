import { defineConfig } from "tsup"

export default defineConfig({
  entry: { index: "components/index.ts" },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  external: ["react", "react-dom", "@opentui/core", "@opentui/react"],
  target: "esnext",
})
