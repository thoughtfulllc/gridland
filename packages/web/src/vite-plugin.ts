import { type Plugin } from "vite"
import path from "path"
import { createRequire } from "module"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Vite plugin that sets up module resolution for Gridland.
 * Handles:
 * - Redirecting Zig/FFI imports to browser shims
 * - Resolving @opentui/core, @opentui/react, @opentui/ui
 * - Shimming Node.js built-ins
 * - Breaking circular dependencies
 *
 * Requires @opentui/core, @opentui/react, and @opentui/ui as peer dependencies.
 */
export function gridlandWebPlugin(): Plugin[] {
  const pkgRoot = path.resolve(__dirname, "..")
  const _require = createRequire(path.resolve(pkgRoot, "package.json"))

  // Resolve opentui package roots — try installed packages first,
  // fall back to git submodule for monorepo development
  function resolvePackageRoot(pkg: string, fallbackRelative: string): string {
    try {
      const pkgJson = _require.resolve(`${pkg}/package.json`)
      return path.dirname(pkgJson)
    } catch {
      return path.resolve(pkgRoot, fallbackRelative)
    }
  }
  const coreRoot = resolvePackageRoot("@opentui/core", "../../opentui/packages/core")
  const reactRoot = resolvePackageRoot("@opentui/react", "../../opentui/packages/react")
  const uiRoot = resolvePackageRoot("@opentui/ui", "../../opentui/packages/ui")

  const coreShims = path.resolve(pkgRoot, "src/core-shims/index.ts")
  const opentuiCoreBarrel = path.resolve(coreRoot, "src/index.ts")
  const sliderDeps = path.resolve(pkgRoot, "src/shims/slider-deps.ts")
  const sliderFile = path.resolve(coreRoot, "src/renderables/Slider.ts")

  // Map of opentui source files that need browser shims
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

  // Lookup tables hoisted out of resolveId to avoid per-call allocation
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
    bun: "src/shims/bun-ffi.ts",
  }

  // Virtual module prefix for npm package redirects.
  // When external opentui code imports a bare npm package (e.g. "react"),
  // we can't return the raw file path because Vite would serve it via /@fs/
  // without CJS-to-ESM conversion. Instead, we return a virtual module that
  // re-exports from the bare package name, which Vite processes through its
  // normal pre-bundling pipeline (including CJS conversion).
  const NPM_REDIRECT = "\0npm-redirect:"

  const shimPlugin: Plugin = {
    name: "gridland-web-shims",
    enforce: "pre",
    resolveId(source, importer) {
      if (!importer) return null

      // Virtual module redirects should not be re-intercepted
      if (importer.startsWith(NPM_REDIRECT)) return null

      // Check if importer is in an opentui package
      const isExternalOpentui =
        importer.startsWith(coreRoot + path.sep) ||
        importer.startsWith(reactRoot + path.sep) ||
        importer.startsWith(uiRoot + path.sep)

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

      // @opentui/core routing
      if (source === "@opentui/core") {
        if (importer.startsWith(reactRoot + path.sep)) {
          return opentuiCoreBarrel
        }
        return coreShims
      }

      // @opentui/* subpath imports (e.g. @opentui/react/jsx-dev-runtime)
      if (source.startsWith("@opentui/")) {
        const parts = source.split("/")
        const pkgName = parts[1] // "react", "core", "ui"
        const subpath = parts.slice(2).join("/") // "jsx-dev-runtime"
        if (subpath) {
          const root = pkgRoots[pkgName]
          if (root) return path.resolve(root, subpath + ".js")
        }
      }

      // Relative imports from opentui tree → check shims
      if (source.startsWith(".") && isExternalOpentui) {
        const importerDir = path.dirname(importer)
        const resolved = path.resolve(importerDir, source)
        // Devtools polyfill stub (uses top-level await for ws import)
        if (resolved.endsWith("devtools-polyfill")) {
          return path.resolve(pkgRoot, "src/shims/devtools-polyfill-stub.ts")
        }
        const shim = resolvedCoreShims.get(resolved) || resolvedCoreShims.get(resolved + ".ts")
        if (shim) return shim
        const indexShim = resolvedCoreShims.get(resolved + "/index.ts")
        if (indexShim) return indexShim
      }

      // Tree-sitter stubs
      if (source.includes("tree-sitter") && isExternalOpentui) {
        if (source.includes("tree-sitter-styled-text")) return styledTextStub
        return treeStub
      }
      if (source.includes("hast-styled-text") && isExternalOpentui) {
        return path.resolve(pkgRoot, "src/shims/hast-stub.ts")
      }

      // Events shim — applies to ALL importers (browser-compatible EventEmitter)
      if (source === "events") {
        return path.resolve(pkgRoot, "src/shims/events-shim.ts")
      }

      // Node.js built-in stubs (only for imports from the opentui monorepo,
      // since our own workspace code doesn't import these)
      if (nodeShims[source] && isExternalOpentui) {
        return path.resolve(pkgRoot, nodeShims[source])
      }

      // Redirect bare npm imports from external opentui to virtual modules.
      // The virtual module re-exports from the bare package name, which lets
      // Vite's normal resolver + pre-bundler handle CJS-to-ESM conversion.
      // Skip @opentui/* since those are resolved above to monorepo source files.
      if (!source.startsWith(".") && !source.startsWith("/") && !source.startsWith("@opentui/") && isExternalOpentui) {
        return NPM_REDIRECT + source
      }

      return null
    },
    load(id) {
      if (id.startsWith(NPM_REDIRECT)) {
        const pkg = id.slice(NPM_REDIRECT.length)
        // Discover export names by require()-ing the module at build time.
        // We use `import * as __ns` (namespace import) which works for both
        // ESM packages (named exports on namespace) and CJS packages
        // (pre-bundled with only a default export, properties on __ns.default).
        // Each property checks both locations with a fallback.
        // NOTE: We use bare specifiers (not resolved paths) so Vite routes
        // these through its pre-bundling pipeline for CJS-to-ESM conversion.
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
        // Fallback for packages we can't introspect
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

      // FFI shims
      aliases["bun:ffi"] = path.resolve(pkgRoot, "src/shims/bun-ffi.ts")
      aliases["bun-ffi-structs"] = path.resolve(pkgRoot, "src/shims/bun-ffi-structs.ts")
      aliases["node:console"] = path.resolve(pkgRoot, "src/shims/console.ts")

      // Core file shims as aliases too
      for (const [key, shimPath] of Object.entries(coreFileShims)) {
        aliases[path.resolve(coreRoot, "src", key)] = path.resolve(pkgRoot, shimPath)
      }

      // Resolve npm packages from gridland-web's node_modules so consuming
      // projects don't need them as direct dependencies. Directory aliases
      // let subpath imports (e.g. react-reconciler/constants) work via
      // Vite's prefix matching, and ensure CJS packages go through
      // Vite's pre-bundling for proper ESM conversion.
      for (const pkg of ["react-reconciler", "yoga-layout", "diff", "marked"]) {
        aliases[pkg] = path.resolve(pkgRoot, "node_modules", pkg)
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
          // Pre-bundle npm packages imported by external opentui monorepo code.
          // These are resolved via virtual module redirects, so Vite's initial
          // crawl won't discover them — they must be listed explicitly.
          include: [
            "react",
            "react-dom",
            "react-reconciler",
            "react-reconciler/constants",
            "diff",
            "yoga-layout",
            "marked",
          ],
        },
        server: {
          fs: {
            // Allow serving from opentui source dirs (for dev-from-source).
            // Use strict: false so Vite's default allow list (project root) is preserved.
            strict: false,
          },
        },
      }
    },
  }

  return [shimPlugin, aliasPlugin]
}
