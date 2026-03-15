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
 * Requires @opentui/core, @opentui/react, and @opentui/ui as peer dependencies.
 *
 * @param nextConfig - Optional additional Next.js config to merge
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
  // Pre-compiled core-shims for npm mode (no monorepo-relative paths)
  const compiledCoreShims = path.resolve(pkgRoot, "dist/core-shims.js")

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

  const userWebpack = nextConfig.webpack

  return {
    ...nextConfig,
    webpack: (config: WebpackConfig, context: { isServer: boolean; webpack: WebpackInstance }) => {
      const { isServer, webpack } = context

      // Chain user's webpack config first if provided
      if (userWebpack) {
        config = userWebpack(config, context)
      }

      // Aliases needed on BOTH server and client (opentui packages, FFI stubs,
      // tree-sitter stubs, core file shims). The server doesn't actually render
      // the TUI but still walks the module graph for "use client" components.
      const sharedAliases: Record<string, string> = {
        // In npm mode, @gridland/core bundles real opentui with native deps
        // that browsers can't handle. Alias it to the core-shims bundle instead.
        ...(!hasSource ? { "@gridland/core": compiledCoreShims } : {}),

        // @opentui packages — source mode only (monorepo dev)
        ...(hasSource ? {
          "@gridland/core": shimPath("src/core-shims-entry.ts"),
          "@opentui/core": shimPath("src/core-shims/index.ts"),
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

        // Source-mode-only aliases: opentui source directories and file shims.
        // In npm mode, these are already compiled into the core-shims bundle.
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

      // Allow webpack to resolve workspace packages (e.g. @gridland/core)
      // from the consuming project's and monorepo root node_modules
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
}
