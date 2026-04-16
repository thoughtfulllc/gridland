// Gridland uses a custom React reconciler, not the DOM.
// Augment React's element attribute interfaces to accept any props,
// since HTML/SVG type constraints don't apply.

import "react"
import "react/jsx-runtime"
import "react/jsx-dev-runtime"
import "csstype"
import type * as React from "react"
import type { BrowserIntrinsicNames } from "../../core/src/react/types/runtime-capability"

// Compile-time coverage assertion (D2.3 of tasks/003-browser-compat-contract.md):
// every Gridland-unique browser-compatible intrinsic declared in
// runtime-capability.ts must appear in the IntrinsicElements augmentation
// below. If a new dual-impl/universal intrinsic is added to the capability
// map without updating this file, _MissingFromBrowserJsx resolves to a
// non-empty union and the assert errors with a literal type mismatch.
//
// "Gridland-unique" excludes names that React already types via its built-in
// HTML/SVG element interfaces (`a`, `b`, `code`, `i`, `em`, `strong`, `u`,
// `br`, `select`, `text` (SVG), `span`) — those compile in browser JSX
// regardless of whether we list them, because React provides the typings.
// See §5 INV-3 carve-out for the full rationale.
type _ReactProvidedNames = "a" | "b" | "code" | "i" | "em" | "strong" | "u" | "br" | "select" | "text" | "span"
type _GridlandUniqueBrowserNames = Exclude<BrowserIntrinsicNames, _ReactProvidedNames>
type _MissingFromBrowserJsx = Exclude<_GridlandUniqueBrowserNames, keyof React.JSX.IntrinsicElements>
// Constraint-style type assertion: the `T extends true` constraint is
// evaluated at alias instantiation, so if any Gridland-unique browser
// intrinsic is missing from the IntrinsicElements augmentation below,
// `_AssertCovered` is invoked with `false` and tsc errors with
// "Type 'false' does not satisfy the constraint 'true'." Update all three
// IntrinsicElements blocks (react, react/jsx-runtime, react/jsx-dev-runtime)
// when this fires.
type _AssertCovered<_T extends true> = void
type _IntrinsicCoverage = _AssertCovered<_MissingFromBrowserJsx extends never ? true : false>
export type { _IntrinsicCoverage }

// Strong types for Gridland-only elements (no React 19 conflict)
interface GridlandBoxProps {
  id?: string
  width?: number | string
  height?: number | string
  flexDirection?: "row" | "column" | "row-reverse" | "column-reverse"
  flexGrow?: number
  flexShrink?: number
  flexWrap?: "no-wrap" | "wrap" | "wrap-reverse"
  alignItems?: "auto" | "flex-start" | "center" | "flex-end" | "stretch" | "baseline"
  justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly"
  alignSelf?: "auto" | "flex-start" | "center" | "flex-end" | "stretch" | "baseline"
  padding?: number | string
  paddingX?: number | string
  paddingY?: number | string
  paddingTop?: number | string
  paddingRight?: number | string
  paddingBottom?: number | string
  paddingLeft?: number | string
  margin?: number | string
  marginX?: number | string
  marginY?: number | string
  marginTop?: number | string
  marginRight?: number | string
  marginBottom?: number | string
  marginLeft?: number | string
  border?: boolean | string[]
  borderStyle?: "single" | "double" | "rounded" | "heavy"
  borderColor?: string
  backgroundColor?: string
  shouldFill?: boolean
  title?: string
  titleAlignment?: "left" | "center" | "right"
  visible?: boolean
  opacity?: number
  gap?: number | string
  rowGap?: number | string
  columnGap?: number | string
  position?: "relative" | "absolute"
  top?: number | string
  right?: number | string
  bottom?: number | string
  left?: number | string
  minWidth?: number | string
  minHeight?: number | string
  maxWidth?: number | string
  maxHeight?: number | string
  zIndex?: number
  overflow?: "visible" | "hidden" | "scroll"
  style?: Record<string, any>
  children?: React.ReactNode
  [key: string]: any
}

// Strong types for Gridland <input> (overrides React's InputHTMLAttributes)
interface GridlandInputProps {
  value?: string
  placeholder?: string
  maxLength?: number
  focused?: boolean
  onInput?: (value: string) => void
  onSubmit?: (value: string) => void
  onChange?: (value: string) => void
  onKeyDown?: (event: any) => void
  cursorColor?: string
  cursorStyle?: any
  placeholderColor?: string
  textColor?: string
  [key: string]: any
}

declare module "react" {
  // Allow any props on all HTML elements
  interface HTMLAttributes<T> {
    [key: string]: any
  }
  // Override input-specific handler types that conflict with Gridland's <input> intrinsic
  interface InputHTMLAttributes<T> {
    onInput?: ((value: string) => void) | undefined
    onSubmit?: ((value: string) => void) | undefined
    [key: string]: any
  }
  // Allow any props on all SVG elements
  interface SVGAttributes<T> {
    [key: string]: any
  }
  // SVGProps and SVGTextElementAttributes are more specific than SVGAttributes —
  // TypeScript doesn't propagate index signatures through inheritance, so widen each directly
  interface SVGProps<T> {
    [key: string]: any
  }
  interface SVGTextElementAttributes<T> {
    [key: string]: any
  }
  // Allow any CSS properties (style prop accepts custom renderer props)
  interface CSSProperties {
    [key: string]: any
  }
  namespace JSX {
    // Phase 2 of tasks/003-browser-compat-contract.md: "ascii-font", "input",
    // "textarea", and "line-number" are tagged terminal-only and deliberately
    // omitted from the browser JSX namespace so misuse becomes a compile
    // error instead of a runtime crash. Phase 3 re-adds "ascii-font" when
    // BrowserAsciiFontRenderable lands (capability tag flips to "dual-impl").
    interface IntrinsicElements {
      // Custom elements not in React's definitions — strong types for Gridland-only elements
      box: GridlandBoxProps
      scrollbox: Record<string, any>
      "tab-select": Record<string, any>
      "ascii-font": Record<string, any>
      code: Record<string, any>
      diff: Record<string, any>
      markdown: Record<string, any>
    }
  }
}

// Augment jsx-runtime and jsx-dev-runtime for "jsx": "react-jsx" tsconfigs
// (React 19 resolves JSX types from these modules, not just "react")
declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      box: GridlandBoxProps
      scrollbox: Record<string, any>
      "tab-select": Record<string, any>
      "ascii-font": Record<string, any>
      code: Record<string, any>
      diff: Record<string, any>
      markdown: Record<string, any>
    }
  }
}

declare module "react/jsx-dev-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      box: GridlandBoxProps
      scrollbox: Record<string, any>
      "tab-select": Record<string, any>
      "ascii-font": Record<string, any>
      code: Record<string, any>
      diff: Record<string, any>
      markdown: Record<string, any>
    }
  }
}

// Also augment csstype since React uses it for style typing
declare module "csstype" {
  interface Properties<TLength, TTime> {
    [key: string]: any
  }
}
