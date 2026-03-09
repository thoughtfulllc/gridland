import { defineConfig } from "tsup"
import { resolve } from "path"

export default defineConfig({
  entry: { run: "src/run.tsx" },
  format: ["esm"],
  dts: false,
  sourcemap: false,
  external: ["react", "@opentui/core", "@opentui/react", "figlet"],
  target: "esnext",
  esbuildOptions(options) {
    options.alias = {
      "@gridland/ui": resolve(__dirname, "../ui/components/index.ts"),
    }
  },
  async onSuccess() {
    // Extract demo names from the source (avoid importing the bundle which requires runtime deps)
    const { readFileSync, writeFileSync } = await import("fs")
    const source = readFileSync(resolve(__dirname, "../ui/scripts/demo-apps.tsx"), "utf-8")
    const names: string[] = []
    for (const match of source.matchAll(/\{\s*name:\s*"([^"]+)",\s*app:/g)) {
      names.push(match[1])
    }
    writeFileSync(resolve(__dirname, "dist/demo-names.json"), JSON.stringify(names))
  },
})
