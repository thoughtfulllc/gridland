import type { NextConfig } from "next"
import path from "path"

const opentui = path.resolve(__dirname, "../../../opentui")
const pkgRoot = path.resolve(__dirname, "../../packages/opentui-web")

function shimPath(p: string) {
  return path.resolve(pkgRoot, p)
}

// Core shims — same mappings as the Vite plugin
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

const nextConfig: NextConfig = {
  webpack: (config, { isServer, webpack }) => {
    // Aliases needed on BOTH server and client (opentui packages, FFI stubs,
    // tree-sitter stubs, core file shims). The server doesn't actually render
    // the TUI but still walks the module graph for "use client" components.
    const sharedAliases: Record<string, string> = {
      // @opentui packages — core-shims includes all exports @opentui/react needs
      "@opentui/core": shimPath("src/core-shims/index.ts"),
      "@opentui/react": path.resolve(opentui, "packages/react/src/index.ts"),
      "@opentui/ui": path.resolve(opentui, "packages/ui/src/index.ts"),

      // FFI shims (no Zig/Bun on server or client in browser context)
      "bun:ffi": shimPath("src/shims/bun-ffi.ts"),
      "bun-ffi-structs": shimPath("src/shims/bun-ffi-structs.ts"),
      bun: shimPath("src/shims/bun-ffi.ts"),

      // Tree-sitter stubs — IMPORTANT: longer prefix must come first to avoid
      // "tree-sitter" matching "tree-sitter-styled-text" (webpack prefix match)
      "tree-sitter-styled-text": shimPath("src/shims/tree-sitter-styled-text-stub.ts"),
      "web-tree-sitter": shimPath("src/shims/tree-sitter-stub.ts"),
      "hast-styled-text": shimPath("src/shims/hast-stub.ts"),
      // Internal tree-sitter source directories (pulled in via renderable imports)
      [path.resolve(opentui, "packages/core/src/lib/tree-sitter-styled-text")]:
        shimPath("src/shims/tree-sitter-styled-text-stub.ts"),
      [path.resolve(opentui, "packages/core/src/lib/tree-sitter")]:
        shimPath("src/shims/tree-sitter-stub.ts"),
      [path.resolve(opentui, "packages/core/src/lib/hast-styled-text")]:
        shimPath("src/shims/hast-stub.ts"),

      // Devtools polyfill stub (original uses top-level await for ws import)
      [path.resolve(opentui, "packages/react/src/reconciler/devtools-polyfill")]:
        shimPath("src/shims/devtools-polyfill-stub.ts"),
    }

    // Core file shims (opentui source → browser shim)
    for (const [key, shimFile] of Object.entries(coreFileShims)) {
      sharedAliases[path.resolve(opentui, "packages/core/src", key)] = shimPath(shimFile)
    }

    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...config.resolve.alias,
      ...sharedAliases,
    }

    // Slider circular dependency fix: Slider.ts imports from "../index" which
    // creates barrel → renderables → Slider → barrel cycle. Redirect to a
    // minimal deps file that provides only what Slider needs.
    const renderablesDir = path.resolve(opentui, "packages/core/src/renderables")
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^\.\.\/index$/, (resource: any) => {
        if (resource.context === renderablesDir) {
          resource.request = shimPath("src/shims/slider-deps.ts")
        }
      }),
    )

    if (!isServer) {
      // Client-only: Node.js built-in stubs, events shim, console shim.
      // Use "$" suffix for exact match to prevent "fs" from matching "fs/promises".
      const clientAliases: Record<string, string> = {
        "node:console": shimPath("src/shims/console.ts"),
        "events$": shimPath("src/shims/events-shim.ts"),
        "fs/promises": shimPath("src/shims/node-fs.ts"),
        "fs$": shimPath("src/shims/node-fs.ts"),
        "path$": shimPath("src/shims/node-path.ts"),
        "util$": shimPath("src/shims/node-util.ts"),
        "os$": shimPath("src/shims/node-os.ts"),
        "stream$": shimPath("src/shims/node-stream.ts"),
        "url$": shimPath("src/shims/node-url.ts"),
      }

      config.resolve.alias = {
        ...config.resolve.alias,
        ...clientAliases,
      }

      // Allow webpack to resolve modules from our workspace node_modules
      config.resolve.modules = [
        ...(config.resolve.modules || []),
        path.resolve(pkgRoot, "node_modules"),
        path.resolve(pkgRoot, "../../node_modules"),
      ]

      // Strip `node:` and `bun:` prefixes from imports so they resolve
      // through aliases. Webpack 5 treats these as unhandled URL schemes.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: any) => {
          resource.request = resource.request.replace(/^node:/, "")
        }),
        new webpack.NormalModuleReplacementPlugin(/^bun:/, (resource: any) => {
          resource.request = resource.request.replace(/^bun:/, "")
        }),
      )
    }

    // Enable top-level await (used by opentui source code)
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    }

    return config
  },
}

export default nextConfig
