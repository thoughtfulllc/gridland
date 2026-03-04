import { defineConfig } from "tsup"

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  external: ["react", "react-dom", "opentui-web"],
  target: "esnext",
})
