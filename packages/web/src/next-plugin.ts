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
 * Equivalent to `gridlandWebPlugin()` for Vite — handles module aliases,
 * FFI shims, tree-sitter stubs, Node.js built-in stubs, and circular
 * dependency fixes.
 *
 * In **npm mode**, @gridland/core resolves via package.json conditional exports
 * ("import" → dist/browser.js). No aliasing needed.
 *
 * In **source mode**, the plugin handles @opentui/* resolution and file-level
 * browser shims for native-backed classes.
 */
export function withGridland(nextConfig: NextConfig = {}): NextConfig {
  // __dirname works natively in CJS; tsup shims it for ESM via import.meta.url
  const pkgRoot = path.resolve(__dirname, "..")

  // Resolve opentui package roots from the git submodule
  const opentuiRoot = path.resolve(pkgRoot, "../../opentui")
  const coreRoot = path.resolve(opentuiRoot, "packages/core")
  const reactRoot = path.resolve(opentuiRoot, "packages/react")
  const uiRoot = path.resolve(opentuiRoot, "packages/ui")

  // Detect whether opentui source is available (monorepo/submodule)
  const hasSource = existsSync(path.resolve(reactRoot, "src/index.ts"))

  function shimPath(p: string) {
    return path.resolve(pkgRoot, p)
  }

  // File-level shims — browser replacements for native-backed classes.
  // NOT needed for: zig (zig-registry.ts is browser-safe), renderer, console,
  // NativeSpanFeed (no longer in browser barrel).
  const coreFileShims: Record<string, string> = {
    buffer: "src/browser-buffer.ts",
    "text-buffer": "src/shims/text-buffer-shim.ts",
    "text-buffer-view": "src/shims/text-buffer-view-shim.ts",
    "syntax-style": "src/shims/syntax-style-shim.ts",
    "edit-buffer": "src/shims/edit-buffer-stub.ts",
    "editor-view": "src/shims/editor-view-stub.ts",
    "post/filters": "src/shims/filters-stub.ts",
    "animation/Timeline": "src/shims/timeline-stub.ts",
  }

  const userWebpack = nextConfig.webpack

  return {
    ...nextConfig,
    // Ensure Next.js compiles .ts shim files from @gridland/web with SWC
    transpilePackages: [
      ...(nextConfig.transpilePackages || []),
      "@gridland/web",
    ],
    webpack: (config: WebpackConfig, context: { isServer: boolean; webpack: WebpackInstance }) => {
      const { isServer, webpack } = context

      // Chain user's webpack config first if provided
      if (userWebpack) {
        config = userWebpack(config, context)
      }

      const sharedAliases: Record<string, string> = {
        // npm mode: @gridland/core resolves via package.json conditional exports.
        // No alias needed.

        // @opentui packages — source mode only (monorepo dev)
        ...(hasSource ? {
          "@opentui/core": path.resolve(coreRoot, "src/index.ts"),
          "@opentui/react": path.resolve(reactRoot, "src/index.ts"),
          "@opentui/ui": path.resolve(uiRoot, "src/index.ts"),
        } : {}),

        // FFI shims (no Zig/Bun on server or client in browser context)
        "bun:ffi": shimPath("src/shims/bun-ffi.ts"),
        "bun-ffi-structs": shimPath("src/shims/bun-ffi-structs.ts"),
        bun: shimPath("src/shims/bun-ffi.ts"),

        // Tree-sitter stubs
        "tree-sitter-styled-text": shimPath("src/shims/tree-sitter-styled-text-stub.ts"),
        "web-tree-sitter": shimPath("src/shims/tree-sitter-stub.ts"),
        "hast-styled-text": shimPath("src/shims/hast-stub.ts"),

        // Source-mode-only aliases
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

      // Core file shims (opentui source → browser shim) — source mode only
      if (hasSource) {
        for (const [key, shimFile] of Object.entries(coreFileShims)) {
          sharedAliases[path.resolve(coreRoot, "src", key)] = shimPath(shimFile)
        }
      }

      config.resolve = config.resolve || {}
      config.resolve.alias = {
        ...config.resolve.alias,
        ...sharedAliases,
      }

      // Allow webpack to resolve workspace packages
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
        // Client-only: Node.js built-in stubs, events shim, console shim.
        // Both node:-prefixed and bare forms are needed because
        // NormalModuleReplacementPlugin strips the node: prefix.
        const clientAliases: Record<string, string> = {
          "node:console": shimPath("src/shims/console.ts"),
          "console$": shimPath("src/shims/console.ts"),
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

        // Strip `node:` and `bun:` prefixes from imports
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
}
