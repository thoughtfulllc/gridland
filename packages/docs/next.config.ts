import { createMDX } from "fumadocs-mdx/next"
import type { NextConfig } from "next"
import path from "path"

const withMDX = createMDX()

const opentui = path.resolve(__dirname, "../../opentui")
const pkgRoot = path.resolve(__dirname, "../web")

function shimPath(p: string) {
  return path.resolve(pkgRoot, p)
}

const nextConfig: NextConfig = {
  output: "export",
  distDir: "dist",
  reactStrictMode: true,
  images: { unoptimized: true },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer, webpack }) => {
    const sharedAliases: Record<string, string> = {
      // @opentui packages — source mode
      "@opentui/core$": path.resolve(opentui, "packages/core/src/index.ts"),
      "@opentui/core/native": shimPath("src/shims/native-stub.ts"),
      "@opentui/react": path.resolve(opentui, "packages/react/src/index.ts"),
      // Convenience aliases
      "opentui-web": path.resolve(pkgRoot, "src/index.ts"),
      "@gridland/utils": path.resolve(__dirname, "../utils/src/index.ts"),
      "@gridland/web": path.resolve(pkgRoot, "src/index.ts"),
      "opentui-ui": path.resolve(__dirname, "../ui/components/index.ts"),
      "@gridland/ui": path.resolve(__dirname, "../ui/components/index.ts"),

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

      // File-level shims for modules that call resolveRenderLib()
      [path.resolve(opentui, "packages/core/src/edit-buffer")]:
        shimPath("src/shims/edit-buffer-stub.ts"),
      [path.resolve(opentui, "packages/core/src/editor-view")]:
        shimPath("src/shims/editor-view-stub.ts"),
      [path.resolve(opentui, "packages/core/src/text-buffer")]:
        shimPath("src/shims/text-buffer-shim.ts"),
      [path.resolve(opentui, "packages/core/src/text-buffer-view")]:
        shimPath("src/shims/text-buffer-view-shim.ts"),
      [path.resolve(opentui, "packages/core/src/syntax-style")]:
        shimPath("src/shims/syntax-style-shim.ts"),
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
        "events$": shimPath("src/shims/events-shim.ts"),
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
