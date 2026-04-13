import { createMDX } from "fumadocs-mdx/next"
import type { NextConfig } from "next"
import path from "path"

const withMDX = createMDX()

const coreRoot = path.resolve(__dirname, "../core")
const pkgRoot = path.resolve(__dirname, "../web")
const uiRoot = path.resolve(__dirname, "../ui")

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
      "@opentui/core$": path.resolve(coreRoot, "src/index.ts"),
      "@opentui/core/native": shimPath("src/shims/native-stub.ts"),
      "@opentui/react": path.resolve(coreRoot, "src/react/index.ts"),
      // Convenience aliases
      "opentui-web": path.resolve(pkgRoot, "src/index.ts"),
      "@gridland/utils": path.resolve(__dirname, "../utils/src/index.ts"),
      "@gridland/web": path.resolve(pkgRoot, "src/index.ts"),
      "opentui-ui": path.resolve(__dirname, "../ui/components/index.ts"),
      "@gridland/ui": path.resolve(__dirname, "../ui/components/index.ts"),
      "@gridland/demo/landing": path.resolve(__dirname, "../demo/src/landing/index.ts"),
      "@demos": path.resolve(__dirname, "../demo/demos"),

      // Registry-local aliases used inside packages/ui source files
      "@/registry/gridland/ui": path.resolve(uiRoot, "components"),
      "@/registry/gridland/lib": path.resolve(uiRoot, "lib"),
      "@/registry/gridland/hooks": path.resolve(uiRoot, "hooks"),

      // react-reconciler — resolve from web's dependency tree
      "react-reconciler": path.resolve(pkgRoot, "node_modules/react-reconciler"),
      "react-reconciler/constants": path.resolve(pkgRoot, "node_modules/react-reconciler/constants.js"),

      // FFI shims
      "bun:ffi": shimPath("src/shims/bun-ffi.ts"),
      "bun-ffi-structs": shimPath("src/shims/bun-ffi-structs.ts"),
      bun: shimPath("src/shims/bun-ffi.ts"),

      // Tree-sitter stubs
      "tree-sitter-styled-text": shimPath("src/shims/tree-sitter-styled-text-stub.ts"),
      "web-tree-sitter": shimPath("src/shims/tree-sitter-stub.ts"),
      "hast-styled-text": shimPath("src/shims/hast-stub.ts"),
      [path.resolve(coreRoot, "src/lib/tree-sitter-styled-text")]:
        shimPath("src/shims/tree-sitter-styled-text-stub.ts"),
      [path.resolve(coreRoot, "src/lib/tree-sitter")]:
        shimPath("src/shims/tree-sitter-stub.ts"),
      [path.resolve(coreRoot, "src/lib/hast-styled-text")]:
        shimPath("src/shims/hast-stub.ts"),

      // Devtools polyfill stub
      "react-devtools-core": shimPath("src/shims/devtools-polyfill-stub.ts"),
      [path.resolve(coreRoot, "src/react/reconciler/devtools-polyfill")]:
        shimPath("src/shims/devtools-polyfill-stub.ts"),

      // Devtools import in reconciler.ts (dynamic, but webpack resolves it)
      [path.resolve(coreRoot, "src/react/reconciler/devtools")]:
        shimPath("src/shims/devtools-polyfill-stub.ts"),

      // File-level shims for modules that call resolveRenderLib()
      [path.resolve(coreRoot, "src/edit-buffer")]:
        shimPath("src/shims/edit-buffer-stub.ts"),
      [path.resolve(coreRoot, "src/editor-view")]:
        shimPath("src/shims/editor-view-stub.ts"),
      [path.resolve(coreRoot, "src/text-buffer")]:
        shimPath("src/shims/text-buffer-shim.ts"),
      [path.resolve(coreRoot, "src/text-buffer-view")]:
        shimPath("src/shims/text-buffer-view-shim.ts"),
      [path.resolve(coreRoot, "src/syntax-style")]:
        shimPath("src/shims/syntax-style-shim.ts"),
    }

    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...config.resolve.alias,
      ...sharedAliases,
    }

    // Allow imports from outside the docs package (e.g. ../demo/demos/) to
    // resolve node_modules that live in the docs or root directories.
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      path.resolve(__dirname, "node_modules"),
      path.resolve(pkgRoot, "node_modules"),
      path.resolve(__dirname, "../../node_modules"),
    ]

    // Slider circular dependency fix
    const renderablesDir = path.resolve(coreRoot, "src/renderables")
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^\.\.\/index$/, (resource: any) => {
        if (resource.context === renderablesDir) {
          resource.request = shimPath("src/shims/slider-deps.ts")
        }
      }),
      // bun: scheme isn't handled by webpack — replace with shim for both server and client
      new webpack.NormalModuleReplacementPlugin(/^bun:/, (resource: any) => {
        resource.request = shimPath("src/shims/bun-ffi.ts")
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

      // Client-specific module paths already covered by shared resolve.modules above

      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: any) => {
          resource.request = resource.request.replace(/^node:/, "")
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
