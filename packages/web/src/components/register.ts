/**
 * Browser catalogue overrides for dual-impl intrinsics.
 *
 * Core's `componentCatalogue` is a module-level singleton. The reconciler
 * reads it via `getComponentCatalogue()` on every `createInstance` call.
 * `@gridland/web` mutates the singleton here at import time — before any
 * React render happens — so that intrinsics tagged "dual-impl" in
 * packages/core/src/react/types/runtime-capability.ts dispatch to their
 * browser implementations instead of the terminal Renderable classes that
 * depend on Zig FFI.
 *
 * This module is a side-effect-only import. Do not add exports. Load order
 * matters: `create-browser-root.tsx` imports this file before it calls
 * `_createContainer`, and `packages/web/package.json` marks this file as a
 * side-effect in the `sideEffects` field so bundlers (Vite, Next, Webpack,
 * esbuild in prod mode) cannot tree-shake the import away.
 *
 * See tasks/003-browser-compat-contract.md §4.3 and §12 for the full
 * rationale and the known single-process dual-runtime limitation (NG7).
 */
import { extend } from "../../../core/src/react/components"
import { BrowserAsciiFontRenderable } from "./browser-ascii-font"

extend({
  "ascii-font": BrowserAsciiFontRenderable,
  // Future dual-impl browser overrides for <input>, <textarea>, <line-number>
  // land here when their follow-up tasks ship (see NG8).
})
