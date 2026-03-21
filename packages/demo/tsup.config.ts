import { defineConfig } from "tsup"
import { resolve } from "path"

const sharedAlias = {
  "@gridland/ui": resolve(__dirname, "../ui/components/index.ts"),
}

export default defineConfig([
  // CLI entry — externalizes opentui (installed as runtime deps).
  // @opentui/* must be externalized to @gridland/bun to avoid duplicate
  // reconciler/yoga instances which cause native FFI segfaults.
  {
    entry: { run: "src/run.tsx" },
    format: ["esm"],
    dts: false,
    sourcemap: false,
    external: ["react", "@gridland/bun", "@gridland/utils", "figlet"],
    target: "esnext",
    esbuildOptions(options) {
      options.alias = sharedAlias
    },
    async onSuccess() {
      const { readFileSync, writeFileSync } = await import("fs")
      const source = readFileSync(resolve(__dirname, "./demos/index.tsx"), "utf-8")
      const names: string[] = []
      for (const match of source.matchAll(/\{\s*name:\s*"([^"]+)",\s*app:/g)) {
        names.push(match[1])
      }
      writeFileSync(resolve(__dirname, "dist/demo-names.json"), JSON.stringify(names))
    },
  },
  // Browser landing entry — @opentui/react is externalized and then
  // rewritten to @gridland/web in onSuccess so browser consumers use
  // the bundled hooks from @gridland/web (shared React context with TUI).
  {
    entry: { landing: "src/landing-entry.tsx" },
    format: ["esm"],
    dts: false,
    sourcemap: false,
    external: ["react", "@gridland/utils", "@gridland/web"],
    target: "esnext",
    esbuildOptions(options) {
      options.alias = sharedAlias
      options.jsx = "automatic"
    },
  },
])
