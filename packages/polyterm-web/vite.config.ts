import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { polytermWebPlugin } from "./src/vite-plugin"
import path from "path"

export default defineConfig({
  plugins: [
    ...polytermWebPlugin({ opentuiPath: path.resolve(__dirname, "../../../opentui") }),
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
