import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import wasm from "vite-plugin-wasm"
import topLevelAwait from "vite-plugin-top-level-await"
import { gridlandWebPlugin } from "../../packages/web/src/vite-plugin"

export default defineConfig({
  plugins: [
    ...gridlandWebPlugin(),
    wasm(),
    topLevelAwait(),
    react(),
  ],
  build: {
    target: "esnext",
  },
  esbuild: {
    target: "esnext",
  },
  optimizeDeps: {
    exclude: ["yoga-layout"],
    esbuildOptions: {
      target: "esnext",
    },
  },
  assetsInclude: ["**/*.scm"],
})
