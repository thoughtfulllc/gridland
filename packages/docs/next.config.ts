import { createMDX } from "fumadocs-mdx/next"
import type { NextConfig } from "next"
import path from "path"

const withMDX = createMDX()

const opentui = path.resolve(__dirname, "../../opentui")
const pkgRoot = path.resolve(__dirname, "../polyterm-web")

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
  reactStrictMode: true,
  typescript: {
    // Source imports from @polyterm.io/ui and @polyterm.io/web use custom JSX intrinsics
    // (box, text, span) that conflict with React's HTML/SVG types.
    // Type safety is enforced in those packages' own builds.
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer, webpack }) => {
    const sharedAliases: Record<string, string> = {
      // @opentui packages
      "@opentui/core": shimPath("src/core-shims/index.ts"),
      "@opentui/react": path.resolve(opentui, "packages/react/src/index.ts"),
      // Convenience aliases for docs imports
      "opentui-web": path.resolve(pkgRoot, "src/index.ts"),
      "@polyterm.io/web": path.resolve(pkgRoot, "src/index.ts"),
      "opentui-ui": path.resolve(__dirname, "../polyterm-ui/components/index.ts"),
      "@polyterm.io/ui": path.resolve(__dirname, "../polyterm-ui/components/index.ts"),

      // FFI shims
      "bun:ffi": shimPath("src/shims/bun-ffi.ts"),
      "bun-ffi-structs": shimPath("src/shims/bun-ffi-structs.ts"),
      bun: shimPath("src/shims/bun-ffi.ts"),

      // Tree-sitter stubs
      "tree-sitter-styled-text": shimPath("src/shims/tree-sitter-styled-text-stub.ts"),
      "web-tree-sitter": shimPath("src/shims/tree-sitter-stub.ts"),
      "hast-styled-text": shimPath("src/shims/hast-stub.ts"),
      [path.resolve(opentui, "packages/core/src/lib/tree-sitter-styled-text")]:
        shimPath("src/shims/tree-sitter-styled-text-stub.ts"),
      [path.resolve(opentui, "packages/core/src/lib/tree-sitter")]:
        shimPath("src/shims/tree-sitter-stub.ts"),
      [path.resolve(opentui, "packages/core/src/lib/hast-styled-text")]:
        shimPath("src/shims/hast-stub.ts"),

      // Devtools polyfill stub
      [path.resolve(opentui, "packages/react/src/reconciler/devtools-polyfill")]:
        shimPath("src/shims/devtools-polyfill-stub.ts"),
    }

    // Core file shims
    for (const [key, shimFile] of Object.entries(coreFileShims)) {
      sharedAliases[path.resolve(opentui, "packages/core/src", key)] = shimPath(shimFile)
    }

    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...config.resolve.alias,
      ...sharedAliases,
    }

    // Slider circular dependency fix
    const renderablesDir = path.resolve(opentui, "packages/core/src/renderables")
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^\.\.\/index$/, (resource: any) => {
        if (resource.context === renderablesDir) {
          resource.request = shimPath("src/shims/slider-deps.ts")
        }
      }),
    )

    if (!isServer) {
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

      config.resolve.modules = [
        ...(config.resolve.modules || []),
        path.resolve(pkgRoot, "node_modules"),
        path.resolve(pkgRoot, "../../node_modules"),
      ]

      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: any) => {
          resource.request = resource.request.replace(/^node:/, "")
        }),
        new webpack.NormalModuleReplacementPlugin(/^bun:/, (resource: any) => {
          resource.request = resource.request.replace(/^bun:/, "")
        }),
      )
    }

    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    }

    return config
  },
}

export default withMDX(nextConfig)
