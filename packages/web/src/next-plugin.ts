import path from "path"
import { existsSync } from "fs"

type WebpackConfig = any
type WebpackInstance = any

interface NextConfig {
  webpack?: (config: WebpackConfig, context: { isServer: boolean; webpack: WebpackInstance }) => WebpackConfig
  [key: string]: any
}

/**
 * Next.js plugin that configures webpack for Gridland.
 *
 * In **npm mode**, @gridland/utils resolves via package.json. Minimal config needed.
 *
 * In **source mode**, the plugin handles @opentui/* resolution and native stubs.
 */
export function withGridland(nextConfig: NextConfig = {}): NextConfig {
  const pkgRoot = path.resolve(__dirname, "..")
  const opentuiRoot = path.resolve(pkgRoot, "../../opentui")
  const coreRoot = path.resolve(opentuiRoot, "packages/core")
  const reactRoot = path.resolve(opentuiRoot, "packages/react")
  const uiRoot = path.resolve(opentuiRoot, "packages/ui")

  const hasSource = existsSync(path.resolve(reactRoot, "src/index.ts"))

  function shimPath(p: string) {
    return path.resolve(pkgRoot, p)
  }

  const userWebpack = nextConfig.webpack

  return {
    ...nextConfig,
    transpilePackages: [
      ...(nextConfig.transpilePackages || []),
      "@gridland/web",
    ],
    webpack: (config: WebpackConfig, context: { isServer: boolean; webpack: WebpackInstance }) => {
      const { isServer, webpack } = context

      if (userWebpack) {
        config = userWebpack(config, context)
      }

      const sharedAliases: Record<string, string> = {
        // Source mode: @opentui packages + file-level shims
        ...(hasSource ? {
          "@opentui/core/native": shimPath("src/shims/native-stub.ts"),
          "@opentui/core": path.resolve(coreRoot, "src/index.ts"),
          "@opentui/react": path.resolve(reactRoot, "src/index.ts"),
          "@opentui/ui": path.resolve(uiRoot, "src/index.ts"),
          // File-level shims for modules that call resolveRenderLib()
          [path.resolve(coreRoot, "src/edit-buffer")]: shimPath("src/shims/edit-buffer-stub.ts"),
          [path.resolve(coreRoot, "src/editor-view")]: shimPath("src/shims/editor-view-stub.ts"),
          [path.resolve(coreRoot, "src/text-buffer")]: shimPath("src/shims/text-buffer-shim.ts"),
          [path.resolve(coreRoot, "src/text-buffer-view")]: shimPath("src/shims/text-buffer-view-shim.ts"),
          [path.resolve(coreRoot, "src/syntax-style")]: shimPath("src/shims/syntax-style-shim.ts"),
        } : {}),

        // FFI shims
        "bun:ffi": shimPath("src/shims/bun-ffi.ts"),
        "bun-ffi-structs": shimPath("src/shims/bun-ffi-structs.ts"),
        bun: shimPath("src/shims/bun-ffi.ts"),

        // Tree-sitter stubs
        "tree-sitter-styled-text": shimPath("src/shims/tree-sitter-styled-text-stub.ts"),
        "web-tree-sitter": shimPath("src/shims/tree-sitter-stub.ts"),
        "hast-styled-text": shimPath("src/shims/hast-stub.ts"),

        // Source-mode-only tree-sitter path aliases
        ...(hasSource ? {
          [path.resolve(coreRoot, "src/lib/tree-sitter-styled-text")]:
            shimPath("src/shims/tree-sitter-styled-text-stub.ts"),
          [path.resolve(coreRoot, "src/lib/tree-sitter")]:
            shimPath("src/shims/tree-sitter-stub.ts"),
          [path.resolve(coreRoot, "src/lib/hast-styled-text")]:
            shimPath("src/shims/hast-stub.ts"),
          [path.resolve(reactRoot, "src/reconciler/devtools-polyfill")]:
            shimPath("src/shims/devtools-polyfill-stub.ts"),
        } : {}),
      }

      config.resolve = config.resolve || {}
      config.resolve.alias = {
        ...config.resolve.alias,
        ...sharedAliases,
      }

      config.resolve.modules = [
        ...(config.resolve.modules || []),
        path.resolve(process.cwd(), "node_modules"),
        path.resolve(pkgRoot, "node_modules"),
        path.resolve(pkgRoot, "../../node_modules"),
      ]

      // Slider circular dependency fix — source mode only
      if (hasSource) {
        const renderablesDir = path.resolve(coreRoot, "src/renderables")
        config.plugins.push(
          new webpack.NormalModuleReplacementPlugin(/^\.\.\/index$/, (resource: any) => {
            if (resource.context === renderablesDir) {
              resource.request = shimPath("src/shims/slider-deps.ts")
            }
          }),
        )
      }

      if (!isServer) {
        const clientAliases: Record<string, string> = {
          "events$": shimPath("src/shims/events-shim.ts"),
        }

        config.resolve.alias = {
          ...config.resolve.alias,
          ...clientAliases,
        }

        config.plugins.push(
          new webpack.NormalModuleReplacementPlugin(/^bun:/, (resource: any) => {
            resource.request = resource.request.replace(/^bun:/, "")
          }),
        )
      }

      config.experiments = {
        ...config.experiments,
        topLevelAwait: true,
      }
      config.output = {
        ...config.output,
        environment: {
          ...config.output?.environment,
          asyncFunction: true,
        },
      }

      return config
    },
  }
}
