import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

const opentui = path.resolve(__dirname, "../opentui")
const coreShims = path.resolve(__dirname, "src/core-shims/index.ts")
const nodeModules = path.resolve(__dirname, "node_modules")

// Map of opentui source files that need to be replaced with browser shims.
// Keys are basenames (without .ts) relative to packages/core/src/.
const coreFileShims: Record<string, string> = {
  zig: "src/shims/zig-stub.ts",
  buffer: "src/browser-buffer.ts",
  "text-buffer": "src/shims/text-buffer-shim.ts",
  "text-buffer-view": "src/shims/text-buffer-view-shim.ts",
  "syntax-style": "src/shims/syntax-style-shim.ts",
  renderer: "src/shims/renderer-stub.ts",
  console: "src/shims/console-stub.ts",
  "edit-buffer": "src/shims/edit-buffer-stub.ts",
  "editor-view": "src/shims/editor-view-stub.ts",
  NativeSpanFeed: "src/shims/native-span-feed-stub.ts",
  "post/filters": "src/shims/filters-stub.ts",
  "animation/Timeline": "src/shims/timeline-stub.ts",
}

// Resolve all shim paths once at startup
const resolvedCoreShims = new Map<string, string>()
for (const [key, shimPath] of Object.entries(coreFileShims)) {
  const absoluteTarget = path.resolve(opentui, "packages/core/src", key + ".ts")
  resolvedCoreShims.set(absoluteTarget, path.resolve(__dirname, shimPath))
}

// Note: We do NOT redirect the opentui barrel (index.ts) to our core-shims because
// it creates circular dependencies when renderables import from "../index".
// Instead, we let the opentui barrel load naturally, with our plugin intercepting
// its zig-dependent imports (buffer, text-buffer, etc.).

// Plugin to intercept opentui imports that can't be handled by simple aliases
function opentuiShims(): Plugin {
  const treeStub = path.resolve(__dirname, "src/shims/tree-sitter-stub.ts")
  const styledTextStub = path.resolve(__dirname, "src/shims/tree-sitter-styled-text-stub.ts")
  const opentuiCoreBarrel = path.resolve(opentui, "packages/core/src/index.ts")
  const sliderDeps = path.resolve(__dirname, "src/shims/slider-deps.ts")
  const sliderFile = path.resolve(opentui, "packages/core/src/renderables/Slider.ts")
  return {
    name: "opentui-shims",
    enforce: "pre",
    resolveId(source, importer) {
      if (!importer) return null

      // Slider.ts imports from "../index" creating a circular dep within the barrel.
      // Redirect to a minimal deps file that provides only what Slider needs.
      if (source === "../index" && importer === sliderFile) {
        return sliderDeps
      }

      // Resolve @opentui/ui and @opentui/react bare specifiers
      if (source === "@opentui/ui") {
        return path.resolve(opentui, "packages/ui/src/index.ts")
      }
      if (source === "@opentui/react") {
        return path.resolve(opentui, "packages/react/src/index.ts")
      }

      // When the opentui react package imports @opentui/core, redirect to
      // the REAL opentui barrel (not our core-shims). The opentui barrel's
      // zig-dependent imports are handled by the file-level redirects below.
      // This avoids cross-barrel circular dependency issues.
      if (source === "@opentui/core" && importer.includes("opentui/packages/react")) {
        return opentuiCoreBarrel
      }

      // For relative imports from within the opentui tree, resolve and check against shims
      if (source.startsWith(".") && importer.includes("opentui")) {
        const importerDir = path.dirname(importer)
        const resolved = path.resolve(importerDir, source)
        // Try exact match, then with .ts extension
        const shim = resolvedCoreShims.get(resolved) || resolvedCoreShims.get(resolved + ".ts")
        if (shim) return shim
        // Also try resolving with /index.ts for directory imports
        const indexShim = resolvedCoreShims.get(resolved + "/index.ts")
        if (indexShim) return indexShim
      }

      // Intercept tree-sitter imports
      if (source.includes("tree-sitter") && importer.includes("opentui")) {
        if (source.includes("tree-sitter-styled-text")) return styledTextStub
        return treeStub
      }
      // Intercept hast-styled-text
      if (source.includes("hast-styled-text") && importer.includes("opentui")) {
        return path.resolve(__dirname, "src/shims/hast-stub.ts")
      }
      // Intercept Node.js built-in modules
      if (source === "node:buffer" && importer.includes("opentui")) {
        return path.resolve(__dirname, "src/shims/node-buffer.ts")
      }
      if ((source === "node:path" || source === "path") && importer.includes("opentui")) {
        return path.resolve(__dirname, "src/shims/node-path.ts")
      }
      if ((source === "node:fs" || source === "fs") && importer.includes("opentui")) {
        return path.resolve(__dirname, "src/shims/node-fs.ts")
      }
      if ((source === "node:util" || source === "util") && importer.includes("opentui")) {
        return path.resolve(__dirname, "src/shims/node-util.ts")
      }
      if ((source === "os" || source === "node:os") && importer.includes("opentui")) {
        return path.resolve(__dirname, "src/shims/node-os.ts")
      }
      if ((source === "stream" || source === "node:stream") && importer.includes("opentui")) {
        return path.resolve(__dirname, "src/shims/node-stream.ts")
      }
      if ((source === "url" || source === "node:url") && importer.includes("opentui")) {
        return path.resolve(__dirname, "src/shims/node-url.ts")
      }
      if ((source === "fs/promises") && importer.includes("opentui")) {
        return path.resolve(__dirname, "src/shims/node-fs.ts")
      }
      // Intercept Bun global
      if (source === "bun" && importer.includes("opentui")) {
        return path.resolve(__dirname, "src/shims/bun-ffi.ts")
      }
      // Handle @opentui/core imports:
      // - From the react package → use real opentui barrel (avoids cross-barrel cycles)
      // - From our code → use core-shims barrel (has browser replacements)
      if (source === "@opentui/core") {
        if (importer.includes("opentui/packages/react")) {
          return opentuiCoreBarrel
        }
        return coreShims
      }
      return null
    },
  }
}

export default defineConfig({
  define: {
    "process.env": JSON.stringify({}),
  },
  plugins: [opentuiShims(), react()],
  resolve: {
    alias: {
      // NOTE: @opentui/core is handled by the plugin, NOT here.
      // The plugin routes react-package imports to the real barrel and our imports to core-shims.
      // Redirect opentui internal imports that reference zig/FFI modules
      [path.resolve(opentui, "packages/core/src/zig")]: path.resolve(__dirname, "src/shims/zig-stub.ts"),
      [path.resolve(opentui, "packages/core/src/buffer")]: path.resolve(__dirname, "src/browser-buffer.ts"),
      [path.resolve(opentui, "packages/core/src/text-buffer")]: path.resolve(
        __dirname,
        "src/shims/text-buffer-shim.ts",
      ),
      [path.resolve(opentui, "packages/core/src/text-buffer-view")]: path.resolve(
        __dirname,
        "src/shims/text-buffer-view-shim.ts",
      ),
      [path.resolve(opentui, "packages/core/src/syntax-style")]: path.resolve(
        __dirname,
        "src/shims/syntax-style-shim.ts",
      ),
      [path.resolve(opentui, "packages/core/src/renderer")]: path.resolve(__dirname, "src/shims/renderer-stub.ts"),
      [path.resolve(opentui, "packages/core/src/console")]: path.resolve(__dirname, "src/shims/console-stub.ts"),
      [path.resolve(opentui, "packages/core/src/edit-buffer")]: path.resolve(
        __dirname,
        "src/shims/edit-buffer-stub.ts",
      ),
      [path.resolve(opentui, "packages/core/src/editor-view")]: path.resolve(
        __dirname,
        "src/shims/editor-view-stub.ts",
      ),
      [path.resolve(opentui, "packages/core/src/NativeSpanFeed")]: path.resolve(
        __dirname,
        "src/shims/native-span-feed-stub.ts",
      ),
      [path.resolve(opentui, "packages/core/src/post/filters")]: path.resolve(
        __dirname,
        "src/shims/filters-stub.ts",
      ),
      [path.resolve(opentui, "packages/core/src/animation/Timeline")]: path.resolve(
        __dirname,
        "src/shims/timeline-stub.ts",
      ),
      // FFI shims
      "bun:ffi": path.resolve(__dirname, "src/shims/bun-ffi.ts"),
      "bun-ffi-structs": path.resolve(__dirname, "src/shims/bun-ffi-structs.ts"),
      "node:console": path.resolve(__dirname, "src/shims/console.ts"),
      // Ensure npm packages resolve from our node_modules (opentui has no node_modules)
      "react-reconciler": path.resolve(nodeModules, "react-reconciler"),
      "react-reconciler/constants": path.resolve(nodeModules, "react-reconciler/constants.js"),
      react: path.resolve(nodeModules, "react"),
      "yoga-layout": path.resolve(nodeModules, "yoga-layout"),
      events: path.resolve(nodeModules, "events"),
      diff: path.resolve(nodeModules, "diff"),
      marked: path.resolve(nodeModules, "marked"),
    },
    dedupe: ["react", "react-reconciler", "yoga-layout", "events"],
  },
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
  server: {
    fs: {
      allow: [__dirname, opentui],
    },
  },
  test: {
    globals: true,
    environment: "node",
    alias: {
      "@opentui/core": coreShims,
      "bun:ffi": path.resolve(__dirname, "src/shims/bun-ffi.ts"),
      [path.resolve(opentui, "packages/core/src/zig")]: path.resolve(__dirname, "src/shims/zig-stub.ts"),
      [path.resolve(opentui, "packages/core/src/buffer")]: path.resolve(__dirname, "src/browser-buffer.ts"),
      [path.resolve(opentui, "packages/core/src/text-buffer")]: path.resolve(
        __dirname,
        "src/shims/text-buffer-shim.ts",
      ),
      [path.resolve(opentui, "packages/core/src/text-buffer-view")]: path.resolve(
        __dirname,
        "src/shims/text-buffer-view-shim.ts",
      ),
      [path.resolve(opentui, "packages/core/src/syntax-style")]: path.resolve(
        __dirname,
        "src/shims/syntax-style-shim.ts",
      ),
      [path.resolve(opentui, "packages/core/src/renderer")]: path.resolve(__dirname, "src/shims/renderer-stub.ts"),
      [path.resolve(opentui, "packages/core/src/console")]: path.resolve(__dirname, "src/shims/console-stub.ts"),
      [path.resolve(opentui, "packages/core/src/edit-buffer")]: path.resolve(
        __dirname,
        "src/shims/edit-buffer-stub.ts",
      ),
      [path.resolve(opentui, "packages/core/src/editor-view")]: path.resolve(
        __dirname,
        "src/shims/editor-view-stub.ts",
      ),
      [path.resolve(opentui, "packages/core/src/NativeSpanFeed")]: path.resolve(
        __dirname,
        "src/shims/native-span-feed-stub.ts",
      ),
      [path.resolve(opentui, "packages/core/src/post/filters")]: path.resolve(
        __dirname,
        "src/shims/filters-stub.ts",
      ),
      [path.resolve(opentui, "packages/core/src/animation/Timeline")]: path.resolve(
        __dirname,
        "src/shims/timeline-stub.ts",
      ),
    },
  },
})
