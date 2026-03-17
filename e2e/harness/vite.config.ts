import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { gridlandWebPlugin } from "../../packages/web/src/vite-plugin"

export default defineConfig({
  plugins: [
    ...gridlandWebPlugin(),
    react(),
  ],
  build: {
    target: "esnext",
  },
  esbuild: {
    target: "esnext",
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
  },
})
