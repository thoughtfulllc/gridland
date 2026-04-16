/**
 * Runtime capability contract for JSX intrinsics.
 *
 * Every intrinsic in the reconciler catalogue declares a runtime-capability
 * tag via the overlay map below. The tag is the source of truth for:
 *
 *   1. INV-1 — catalogue keys and capability keys must be identical sets,
 *      enforced by the build-time checker at packages/core/scripts/check-intrinsic-tags.ts.
 *   2. INV-3 — the browser JSX namespace in packages/web/src/gridland-jsx.d.ts
 *      filters intrinsics through this overlay, converting "use of a
 *      terminal-only intrinsic in a browser-typed project" into a compile
 *      error instead of a runtime crash.
 *
 * The overlay is NOT a rewrite of the existing intrinsic prop types in
 * packages/core/src/react/types/components.ts — TextProps, BoxProps, etc.
 * stay untouched. The capability tag lives in a parallel structure keyed by
 * intrinsic name. See tasks/003-browser-compat-contract.md §4.4 and NG9.
 */

/**
 * The canonical list of runtime-capability variants. Declared as a readonly
 * tuple so both the `RuntimeCapability` type and runtime tests can derive
 * from a single source of truth — adding a new variant requires touching
 * exactly one line.
 */
export const RUNTIME_CAPABILITY_VARIANTS = [
  "universal",
  "dual-impl",
  "terminal-only",
  "browser-only",
] as const

export type RuntimeCapability = (typeof RUNTIME_CAPABILITY_VARIANTS)[number]

/** Overlay map keyed by intrinsic name, declared alongside the reconciler catalogue. */
export type IntrinsicCapabilities = Record<string, RuntimeCapability>

export const intrinsicCapabilities = {
  // Layout / text — all pure JS, work in every runtime.
  box: "universal",
  text: "universal",
  span: "universal",
  b: "universal",
  strong: "universal",
  i: "universal",
  em: "universal",
  u: "universal",
  br: "universal",
  a: "universal",
  code: "universal",
  diff: "universal",
  markdown: "universal",
  scrollbox: "universal",
  select: "universal",
  "tab-select": "universal",

  // Dual-impl: browser implementation shipped in Phase 3 of tasks/003.
  // BrowserAsciiFontRenderable at packages/web/src/components/browser-ascii-font.ts
  // is registered via packages/web/src/components/register.ts at import time.
  "ascii-font": "dual-impl",

  // Zig-FFI intrinsics — terminal-only until follow-up tasks ship browser impls.
  // See NG8 of tasks/003-browser-compat-contract.md.
  input: "terminal-only",
  textarea: "terminal-only",
  "line-number": "terminal-only",
} as const satisfies IntrinsicCapabilities

/**
 * Type-level predicate: is the intrinsic at key `K` browser-compatible?
 *
 * Evaluates to `true` for `universal`, `dual-impl`, and `browser-only` tags.
 * Evaluates to `false` for `terminal-only`.
 */
export type IsBrowserCompatible<K extends keyof typeof intrinsicCapabilities> =
  (typeof intrinsicCapabilities)[K] extends "universal" | "dual-impl" | "browser-only" ? true : false

/** The set of intrinsic names reachable from browser JSX. */
export type BrowserIntrinsicNames = {
  [K in keyof typeof intrinsicCapabilities]: IsBrowserCompatible<K> extends true ? K : never
}[keyof typeof intrinsicCapabilities]
