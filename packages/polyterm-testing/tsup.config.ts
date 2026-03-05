import { defineConfig } from "tsup"
import type { Plugin } from "esbuild"

// Externalize imports that reach into the external opentui monorepo
// and sibling workspace packages via relative paths. These are resolved
// at runtime by the test runner (bun) which has module resolution
// configured for the monorepo.
const externalMonorepo: Plugin = {
  name: "external-monorepo",
  setup(build) {
    build.onResolve({ filter: /^@opentui\// }, (args) => ({
      path: args.path,
      external: true,
    }))
    build.onResolve({ filter: /opentui\/packages/ }, (args) => ({
      path: args.path,
      external: true,
    }))
    build.onResolve({ filter: /polyterm-web\/src/ }, (args) => ({
      path: args.path,
      external: true,
    }))
  },
}

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  external: ["react", "react-dom", "@polyterm.io/web"],
  esbuildPlugins: [externalMonorepo],
  target: "esnext",
})
