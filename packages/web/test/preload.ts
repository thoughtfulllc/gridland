import { GlobalRegistrator } from "@happy-dom/global-registrator"
import { plugin } from "bun"
import path from "path"
import fs from "fs"
import os from "os"

// Suppress React's console.error for expected zig shim errors caught by ErrorBoundary
const _origConsoleError = console.error
console.error = (...args: any[]) => {
  const msg = typeof args[0] === "string" ? args[0] : String(args[0] ?? "")
  if (msg.includes("Zig render library not available")) return
  _origConsoleError(...args)
}

// Pre-load React modules and cache on globalThis for the patched reconciler.
const _react = await import("react")
;(globalThis as any).__OPENTUI_REACT = _react.default ?? _react

// Create a patched copy of react-reconciler that uses our React via globalThis
// instead of require("react"), and uses absolute paths for scheduler.
const reconcilerPkgPath = path.dirname(import.meta.resolveSync("react-reconciler"))
const reconcilerCjsPath = path.join(reconcilerPkgPath, "cjs/react-reconciler.development.js")
const schedulerPath = import.meta.resolveSync("scheduler", reconcilerCjsPath)
const constantsCjsPath = path.join(reconcilerPkgPath, "cjs/react-reconciler-constants.development.js")

const tmpDir = path.join(os.tmpdir(), "opentui-test-shims")
fs.mkdirSync(tmpDir, { recursive: true })

// Patched reconciler: replace require("react") and require("scheduler") with
// absolute references so the file works from any directory.
const reconcilerSource = fs.readFileSync(reconcilerCjsPath, "utf8")
const reconcilerPatched = reconcilerSource
  .replace(/var React = require\("react"\)/, "var React = globalThis.__OPENTUI_REACT")
  .replace(/Scheduler = require\("scheduler"\)/, `Scheduler = require("${schedulerPath}")`)

const tmpReconcilerPath = path.join(tmpDir, "react-reconciler.js")
fs.writeFileSync(tmpReconcilerPath, reconcilerPatched)

// Constants file (copy with absolute scheduler path if needed)
const constantsSource = fs.readFileSync(constantsCjsPath, "utf8")
const tmpConstantsPath = path.join(tmpDir, "react-reconciler-constants.js")
fs.writeFileSync(tmpConstantsPath, constantsSource)

// Pre-load the patched reconciler factory and constants from the temp files.
// This ensures CJS-ESM interop works correctly (loaded from disk, not onLoad).
const _reconcilerFactory = await import(tmpReconcilerPath)
;(globalThis as any).__OPENTUI_RECONCILER_FACTORY = _reconcilerFactory.default ?? _reconcilerFactory
const _reconcilerConstants = await import(tmpConstantsPath)
;(globalThis as any).__OPENTUI_RECONCILER_CONSTANTS = _reconcilerConstants.default ?? _reconcilerConstants

GlobalRegistrator.register()

// Bun test doesn't need React act environment
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = false

// ── Module resolution plugins ────────────────────────────────────────────
const pkgRoot = path.resolve(import.meta.dir, "..")
const srcDir = path.resolve(pkgRoot, "src")

plugin({
  name: "opentui-test-shims",
  setup(build) {
    // Replace core files with browser shims via onLoad
    const shimReplacements: Array<{
      filter: RegExp
      contents: string
    }> = [
      {
        filter: /opentui\/packages\/core\/src\/text-buffer\.ts$/,
        contents: `
          export { BrowserTextBuffer as TextBuffer } from "${path.resolve(srcDir, "browser-text-buffer.ts")}"
          export type { TextChunk, StyledTextInput } from "${path.resolve(srcDir, "browser-text-buffer.ts")}"
        `,
      },
      {
        filter: /opentui\/packages\/core\/src\/text-buffer-view\.ts$/,
        contents: `
          export { BrowserTextBufferView as TextBufferView } from "${path.resolve(srcDir, "browser-text-buffer-view.ts")}"
        `,
      },
      {
        filter: /opentui\/packages\/core\/src\/syntax-style\.ts$/,
        contents: `
          export { BrowserSyntaxStyle as SyntaxStyle } from "${path.resolve(srcDir, "browser-syntax-style.ts")}"
          export interface StyleDefinition { fg?: any; bg?: any; attributes?: number; [key: string]: any }
          export interface MergedStyle { attributes: number }
          export interface ThemeTokenStyle { scope: string | string[]; settings: Record<string, any> }
          export function convertThemeToStyles(_theme: ThemeTokenStyle[]): Record<string, StyleDefinition> { return {} }
        `,
      },
      {
        filter: /opentui\/packages\/core\/src\/zig\.ts$/,
        contents: `
          export type Pointer = number
          export interface LineInfo {
            lineStarts: number[]; lineWidths: number[]; maxLineWidth: number;
            lineSources: number[]; lineWraps: number[]
          }
          export interface RenderLib { [key: string]: any }
          export function resolveRenderLib(): RenderLib {
            throw new Error("Zig render library not available in test environment")
          }
        `,
      },
      {
        filter: /opentui\/packages\/core\/src\/buffer\.ts$/,
        contents: `
          export { BrowserBuffer as OptimizedBuffer } from "${path.resolve(srcDir, "browser-buffer.ts")}"
        `,
      },
    ]

    for (const { filter, contents } of shimReplacements) {
      build.onLoad({ filter }, () => ({ contents, loader: "ts" }))
    }

    // Redirect @gridland/core to source so test shims apply.
    // Bun resolves workspace packages before plugins, so onResolve can't
    // intercept @gridland/core. Instead, intercept the loaded dist/index.js
    // and replace it with re-exports from the source tree.
    const coreShimsIndex = path.resolve(srcDir, "core-shims/index.ts")
    const opentuiReactSrc = path.resolve(pkgRoot, "../../opentui/packages/react/src/index.ts")
    build.onLoad({ filter: /packages\/core\/dist\/index\.js$/ }, () => ({
      contents: `export * from "${coreShimsIndex}"; export * from "${opentuiReactSrc}";`,
      loader: "ts",
    }))
    build.onResolve({ filter: /^@opentui\/core$/ }, () => ({ path: coreShimsIndex }))
    build.onResolve({ filter: /^@opentui\/react$/ }, () => ({ path: opentuiReactSrc }))

    // Redirect bare module imports to our local copies (opentui submodule
    // can't resolve these from its own directory).
    const reactPath = import.meta.resolveSync("react")
    build.onResolve({ filter: /^react$/ }, () => ({ path: reactPath }))
    const yogaPath = import.meta.resolveSync("yoga-layout")
    build.onResolve({ filter: /^yoga-layout$/ }, () => ({ path: yogaPath }))

    // Intercept reconciler.ts to use our pre-loaded patched reconciler factory
    // and constants from globalThis. This avoids loading react-reconciler from
    // rebalance-opentui (which would bring in a second React copy).
    build.onLoad({ filter: /opentui\/packages\/react\/src\/reconciler\/reconciler\.ts$/ }, (args) => {
      const source = fs.readFileSync(args.path, "utf8")
      const patched = source
        .replace(
          /import ReactReconciler from "react-reconciler"/,
          "const ReactReconciler = (globalThis as any).__OPENTUI_RECONCILER_FACTORY",
        )
        .replace(
          /import \{ ConcurrentRoot \} from "react-reconciler\/constants"/,
          "const { ConcurrentRoot } = (globalThis as any).__OPENTUI_RECONCILER_CONSTANTS",
        )
      return { contents: patched, loader: "ts" }
    })
  },
})
