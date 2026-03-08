import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: false,
  sourcemap: false,
  clean: true,
  target: "node18",
  banner: {
    js: "#!/usr/bin/env node",
  },
  external: [
    "@opentui/core",
    "@opentui/react",
    "react",
  ],
  noExternal: ["@gridland/ui", "commander", "picocolors"],
})
