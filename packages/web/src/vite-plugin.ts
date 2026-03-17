import { type Plugin } from "vite"
import path from "path"
import { existsSync } from "fs"
import { createRequire } from "module"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Vite plugin that sets up module resolution for Gridland.
 *
 * In **npm mode** (published packages), @gridland/utils resolves via its
 * package.json. No special aliasing needed.
 *
 * In **source mode** (monorepo with opentui submodule), the plugin handles
 * @opentui/* resolution, native stubs, tree-sitter stubs, and circular
 * dependency fixes.
 */
export function gridlandWebPlugin(): Plugin[] {
  const pkgRoot = path.resolve(__dirname, "..")
  const _require = createRequire(path.resolve(pkgRoot, "package.json"))

  // Resolve opentui package roots
  function resolvePackageRoot(pkg: string, fallbackRelative: string): string {
    for (const req of [_require]) {
      try {
        const pkgJson = req.resolve(`${pkg}/package.json`)
        return path.dirname(pkgJson)
      } catch {
        try {
          const entry = req.resolve(pkg)
          let dir = path.dirname(entry)
          for (let i = 0; i < 5; i++) {
            if (existsSync(path.join(dir, "package.json"))) return dir
            dir = path.dirname(dir)
          }
        } catch {
          // Package not installed in this context
        }
      }
    }
    return path.resolve(pkgRoot, fallbackRelative)
  }
  const coreRoot = resolvePackageRoot("@opentui/core", "../../core")
  const reactRoot = resolvePackageRoot("@opentui/react", "../../core")

  // Detect whether opentui TypeScript source is available (monorepo)
  const hasSource = existsSync(path.resolve(coreRoot, "src/react/index.ts"))

  const opentuiCoreBarrel = path.resolve(coreRoot, "src/index.ts")
  const sliderDeps = path.resolve(pkgRoot, "src/shims/slider-deps.ts")
  const sliderFile = path.resolve(coreRoot, "src/renderables/Slider.ts")
  const treeStub = path.resolve(pkgRoot, "src/shims/tree-sitter-stub.ts")
  const styledTextStub = path.resolve(pkgRoot, "src/shims/tree-sitter-styled-text-stub.ts")

  const pkgRoots: Record<string, string> = { core: coreRoot, react: coreRoot }

  // File-level shims: edit-buffer and editor-view call resolveRenderLib() at runtime.
  // Replace with pure-JS browser implementations.
  const coreFileShims: Record<string, string> = {
    "edit-buffer": "src/shims/edit-buffer-stub.ts",
    "editor-view": "src/shims/editor-view-stub.ts",
    "text-buffer": "src/shims/text-buffer-shim.ts",
    "text-buffer-view": "src/shims/text-buffer-view-shim.ts",
    "syntax-style": "src/shims/syntax-style-shim.ts",
  }
  const resolvedCoreShims = new Map<string, string>()
  for (const [key, shimPath] of Object.entries(coreFileShims)) {
    resolvedCoreShims.set(
      path.resolve(coreRoot, "src", key + ".ts"),
      path.resolve(pkgRoot, shimPath),
    )
  }

  const shimPlugin: Plugin = {
    name: "gridland-web-shims",
    enforce: "pre",
    resolveId(source, importer) {
      if (!importer) return null

      // ── Events shim (both source and npm mode) ────────────────
      if (source === "events") {
        return path.resolve(pkgRoot, "src/shims/events-shim.ts")
      }

      // ── Source mode only ──────────────────────────────────────
      if (!hasSource) return null

      const isExternalOpentui =
        importer.startsWith(coreRoot + path.sep) ||
        importer.includes("/packages/core/")

      // Slider circular dep fix
      if (source === "../index" && importer === sliderFile) {
        return sliderDeps
      }

      // Resolve @opentui packages
      if (source === "@opentui/react") {
        return path.resolve(coreRoot, "src/react/index.ts")
      }
      if (source === "@opentui/core") {
        return opentuiCoreBarrel
      }

      // Stub @opentui/core/native
      if (source === "@opentui/core/native") {
        return "\0opentui-core-native-stub"
      }

      // @opentui/* subpath imports
      if (source.startsWith("@opentui/")) {
        const parts = source.split("/")
        const pkgName = parts[1]
        const subpath = parts.slice(2).join("/")
        if (subpath) {
          const root = pkgRoots[pkgName]
          if (root) return path.resolve(root, subpath + ".js")
        }
      }

      // Relative imports: check for file-level shims and devtools-polyfill stub
      if (source.startsWith(".")) {
        const importerDir = path.dirname(importer)
        const resolved = path.resolve(importerDir, source)
        if (resolved.endsWith("devtools-polyfill")) {
          return path.resolve(pkgRoot, "src/shims/devtools-polyfill-stub.ts")
        }
        const shim = resolvedCoreShims.get(resolved) || resolvedCoreShims.get(resolved + ".ts")
        if (shim) return shim
      }

      // Tree-sitter and related stubs
      if (isExternalOpentui) {
        if (source.endsWith(".scm") || source.endsWith(".wasm")) {
          return "\0opentui-asset-stub"
        }
        if (source.includes("tree-sitter")) {
          if (source.includes("tree-sitter-styled-text")) return styledTextStub
          return treeStub
        }
        if (source.includes("hast-styled-text")) {
          return path.resolve(pkgRoot, "src/shims/hast-stub.ts")
        }
      }

      return null
    },
    load(id) {
      if (id === "\0opentui-asset-stub") {
        return "export default null;"
      }
      if (id === "\0opentui-core-native-stub") {
        return "export const CliRenderer = null; export const CliRenderEvents = null; export const createCliRenderer = null; export const NativeSpanFeed = null; export const setRenderLibPath = () => {};"
      }
    },
  }

  const devtoolsStub = path.resolve(pkgRoot, "src/shims/devtools-polyfill-stub.ts")
  const hastStub = path.resolve(pkgRoot, "src/shims/hast-stub.ts")

  const aliasPlugin: Plugin = {
    name: "gridland-web-aliases",
    config() {
      const aliases: Record<string, string> = {}

      // FFI shims — still needed for lazy require("bun:ffi") in buffer.ts
      aliases["bun:ffi"] = path.resolve(pkgRoot, "src/shims/bun-ffi.ts")
      aliases["bun-ffi-structs"] = path.resolve(pkgRoot, "src/shims/bun-ffi-structs.ts")
      aliases["bun"] = path.resolve(pkgRoot, "src/shims/bun-ffi.ts")

      // Devtools stubs — these are imported by devtools-polyfill.ts which
      // is itself shimmed, but esbuild dep scanning follows imports before
      // the shim plugin can intercept them.
      aliases["react-devtools-core"] = devtoolsStub
      aliases["ws"] = devtoolsStub

      // Tree-sitter and related stubs — esbuild needs aliases, not just
      // resolveId hooks, to avoid following these into missing packages
      // or WASM imports that vite-plugin-wasm can't handle.
      if (hasSource) {
        // npm package aliases
        aliases["web-tree-sitter"] = treeStub
        aliases["tree-sitter-styled-text"] = styledTextStub
        aliases["hast-styled-text"] = hastStub

        // Local file aliases — prevent esbuild from entering these files
        // and following their relative .wasm/.scm imports
        aliases[path.resolve(coreRoot, "src/lib/tree-sitter")] = treeStub
        aliases[path.resolve(coreRoot, "src/lib/tree-sitter-styled-text")] = styledTextStub
        aliases[path.resolve(coreRoot, "src/lib/hast-styled-text")] = hastStub
        aliases[path.resolve(coreRoot, "src/react/reconciler/devtools-polyfill")] = devtoolsStub
        aliases[path.resolve(coreRoot, "src/react/reconciler/devtools")] = devtoolsStub
      }

      // Resolve npm packages from @gridland/web's dependency tree
      for (const pkg of ["react-reconciler", "yoga-layout", "diff", "marked"]) {
        try {
          aliases[pkg] = path.dirname(_require.resolve(pkg + "/package.json"))
        } catch {
          aliases[pkg] = path.resolve(pkgRoot, "node_modules", pkg)
        }
      }

      return {
        define: {
          "process.env": JSON.stringify({}),
          "globalThis.Bun": "undefined",
        },
        resolve: {
          alias: aliases,
          dedupe: ["react", "react-dom", "react-reconciler", "yoga-layout", "events"],
        },
        optimizeDeps: {
          // yoga-layout uses WASM which esbuild can't handle; exclude from
          // dep scanning and let the browser load it at runtime.
          exclude: ["yoga-layout"],
          include: hasSource ? [
            "react",
            "react-dom",
            "react-reconciler",
            "react-reconciler/constants",
            "diff",
            "marked",
          ] : [
            "react",
            "react-dom",
          ],
        },
        server: {
          fs: {
            strict: false,
          },
        },
        assetsInclude: ["**/*.scm", "**/*.wasm"],
      }
    },
  }

  return [shimPlugin, aliasPlugin]
}
