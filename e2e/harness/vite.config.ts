import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import { fileURLToPath } from "url"
import { gridlandWebPlugin } from "../../packages/web/src/vite-plugin"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uiRoot = path.resolve(__dirname, "../../packages/ui")

export default defineConfig({
  plugins: [
    ...gridlandWebPlugin(),
    react(),
  ],
  resolve: {
    alias: {
      "@/registry/gridland/ui": path.resolve(uiRoot, "components"),
      "@/registry/gridland/lib": path.resolve(uiRoot, "lib"),
      "@/registry/gridland/hooks": path.resolve(uiRoot, "hooks"),
    },
  },
})
