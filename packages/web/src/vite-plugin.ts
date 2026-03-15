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
 * In **npm mode** (published packages), the plugin simply aliases @gridland/core
 * to a pre-compiled browser-compatible bundle (dist/core-shims.js). No other
 * interception is needed since @gridland/web's published dist already has
 * all opentui code compiled in.
 *
 * In **source mode** (monorepo with opentui submodule), the plugin additionally
 * handles @opentui/* resolution, file-level browser shims, tree-sitter stubs,
 * node built-in stubs, and circular dependency fixes.
 */
export function gridlandWebPlugin(): Plugin[] {
  const pkgRoot = path.resolve(__dirname, "..")
  const _require = createRequire(path.resolve(pkgRoot, "package.json"))
  const _projectRequire = createRequire(path.resolve(process.cwd(), "package.json"))

  // Pre-compiled core-shims for npm mode (no monorepo-relative paths)
  const compiledCoreShims = path.resolve(pkgRoot, "dist/core-shims.js")

  // Resolve opentui package roots
  function resolvePackageRoot(pkg: string, fallbackRelative: string): string {
    for (const req of [_projectRequire, _require]) {
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
  const coreRoot = resolvePackageRoot("@opentui/core", "../../opentui/packages/core")
  const reactRoot = resolvePackageRoot("@opentui/react", "../../opentui/packages/react")
  const uiRoot = resolvePackageRoot("@opentui/ui", "../../opentui/packages/ui")

  // Detect whether opentui TypeScript source is available (monorepo/submodule)
  const hasSource = existsSync(path.resolve(reactRoot, "src/index.ts"))

  const coreShims = path.resolve(pkgRoot, "src/core-shims/index.ts")
  const opentuiCoreBarrel = path.resolve(coreRoot, "src/index.ts")
  const sliderDeps = path.resolve(pkgRoot, "src/shims/slider-deps.ts")
  const sliderFile = path.resolve(coreRoot, "src/renderables/Slider.ts")

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

  const resolvedCoreShims = new Map<string, string>()
  for (const [key, shimPath] of Object.entries(coreFileShims)) {
    const absoluteTarget = path.resolve(coreRoot, "src", key + ".ts")
    resolvedCoreShims.set(absoluteTarget, path.resolve(pkgRoot, shimPath))
  }

  const treeStub = path.resolve(pkgRoot, "src/shims/tree-sitter-stub.ts")
  const styledTextStub = path.resolve(pkgRoot, "src/shims/tree-sitter-styled-text-stub.ts")

  const pkgRoots: Record<string, string> = { core: coreRoot, react: reactRoot, ui: uiRoot }

  const nodeShims: Record<string, string> = {
    "node:buffer": "src/shims/node-buffer.ts",
    "node:path": "src/shims/node-path.ts",
    path: "src/shims/node-path.ts",
    "node:fs": "src/shims/node-fs.ts",
    fs: "src/shims/node-fs.ts",
    "fs/promises": "src/shims/node-fs.ts",
    "node:util": "src/shims/node-util.ts",
    util: "src/shims/node-util.ts",
    os: "src/shims/node-os.ts",
    "node:os": "src/shims/node-os.ts",
    stream: "src/shims/node-stream.ts",
    "node:stream": "src/shims/node-stream.ts",
    url: "src/shims/node-url.ts",
    "node:url": "src/shims/node-url.ts",
    console: "src/shims/console.ts",
    bun: "src/shims/bun-ffi.ts",
  }

  const NPM_REDIRECT = "\0npm-redirect:"

  const shimPlugin: Plugin = {
    name: "gridland-web-shims",
    enforce: "pre",
    resolveId(source, importer) {
      if (!importer) return null
      if (importer.startsWith(NPM_REDIRECT)) return null

      // ── Source mode only ──────────────────────────────────────────
      // All @opentui/* interception, file-level shims, and node built-in
      // stubs are only needed when processing opentui TypeScript source.
      // In npm mode, @gridland/core is aliased to the pre-compiled
      // core-shims bundle and no opentui packages are resolved directly.
      if (!hasSource) return null

      const isExternalOpentui =
        importer.startsWith(coreRoot + path.sep) ||
        importer.startsWith(reactRoot + path.sep) ||
        importer.startsWith(uiRoot + path.sep) ||
        importer.includes("/@opentui/core/") ||
        importer.includes("/@opentui/react/") ||
        importer.includes("/@opentui/ui/")

      // Slider circular dep fix
      if (source === "../index" && importer === sliderFile) {
        return sliderDeps
      }

      // Resolve @opentui packages
      if (source === "@opentui/ui") {
        return path.resolve(uiRoot, "src/index.ts")
      }
      if (source === "@opentui/react") {
        return path.resolve(reactRoot, "src/index.ts")
      }
      if (source === "@opentui/core") {
        if (importer.startsWith(reactRoot + path.sep)) {
          return opentuiCoreBarrel
        }
        return coreShims
      }

      // @opentui/* subpath imports (e.g. @opentui/react/jsx-dev-runtime)
      if (source.startsWith("@opentui/")) {
        const parts = source.split("/")
        const pkgName = parts[1]
        const subpath = parts.slice(2).join("/")
        if (subpath) {
          const root = pkgRoots[pkgName]
          if (root) return path.resolve(root, subpath + ".js")
        }
      }

      // Relative imports from opentui tree → check shims
      if (source.startsWith(".") && isExternalOpentui) {
        const importerDir = path.dirname(importer)
        const resolved = path.resolve(importerDir, source)
        if (resolved.endsWith("devtools-polyfill")) {
          return path.resolve(pkgRoot, "src/shims/devtools-polyfill-stub.ts")
        }
        const shim = resolvedCoreShims.get(resolved) || resolvedCoreShims.get(resolved + ".ts")
        if (shim) return shim
        const indexShim = resolvedCoreShims.get(resolved + "/index.ts")
        if (indexShim) return indexShim
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

      // Events shim
      if (source === "events") {
        return path.resolve(pkgRoot, "src/shims/events-shim.ts")
      }

      // Node.js built-in stubs
      if (nodeShims[source] && isExternalOpentui) {
        return path.resolve(pkgRoot, nodeShims[source])
      }

      // Redirect bare npm imports from external opentui to virtual modules
      if (!source.startsWith(".") && !source.startsWith("/") && !source.startsWith("@opentui/") && isExternalOpentui) {
        return NPM_REDIRECT + source
      }

      return null
    },
    load(id) {
      if (id === "\0opentui-asset-stub") {
        return "export default null;"
      }
      if (id.startsWith(NPM_REDIRECT)) {
        const pkg = id.slice(NPM_REDIRECT.length)
        try {
          const mod = _require(pkg)
          if (typeof mod === "object" && mod !== null) {
            const names = Object.keys(mod).filter(
              (k) => k !== "default" && k !== "__esModule" && /^[a-zA-Z_$][\w$]*$/.test(k),
            )
            if (names.length > 0) {
              return [
                `import * as __ns from "${pkg}";`,
                `export default __ns.default ?? __ns;`,
                ...names.map(
                  (n) => `export const ${n} = __ns["${n}"] ?? __ns.default?.["${n}"];`,
                ),
              ].join("\n")
            }
          }
        } catch {
          // Fall through to generic approach
        }
        return [
          `export * from "${pkg}";`,
          `import * as __ns from "${pkg}";`,
          `export default __ns.default ?? __ns;`,
        ].join("\n")
      }
    },
  }

  const aliasPlugin: Plugin = {
    name: "gridland-web-aliases",
    config() {
      const aliases: Record<string, string> = {}

      // In npm mode, alias @gridland/core to the pre-compiled core-shims bundle.
      // @gridland/core bundles the real opentui (with native deps like bun:ffi),
      // which browsers can't handle. The core-shims bundle has browser stubs.
      if (!hasSource) {
        aliases["@gridland/core"] = compiledCoreShims
      }

      // FFI shims
      aliases["bun:ffi"] = path.resolve(pkgRoot, "src/shims/bun-ffi.ts")
      aliases["bun-ffi-structs"] = path.resolve(pkgRoot, "src/shims/bun-ffi-structs.ts")
      aliases["node:console"] = path.resolve(pkgRoot, "src/shims/console.ts")

      // Core file shims as aliases too (source mode)
      if (hasSource) {
        for (const [key, shimPath] of Object.entries(coreFileShims)) {
          aliases[path.resolve(coreRoot, "src", key)] = path.resolve(pkgRoot, shimPath)
        }
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
        },
        resolve: {
          alias: aliases,
          dedupe: ["react", "react-dom", "react-reconciler", "yoga-layout", "events"],
        },
        optimizeDeps: {
          include: hasSource ? [
            "react",
            "react-dom",
            "react-reconciler",
            "react-reconciler/constants",
            "diff",
            "yoga-layout",
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
      }
    },
  }

  return [shimPlugin, aliasPlugin]
}
