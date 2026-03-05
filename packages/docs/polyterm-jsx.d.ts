// JSX intrinsic elements for Polyterm (built on the opentui engine)
// Override HTML/SVG intrinsics to allow Polyterm-specific props (fg, bg, bold, etc.)
// At runtime, the opentui reconciler handles these elements — not the DOM.

import "react"

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      // Custom elements (not in HTML/SVG)
      box: Record<string, any>
      scrollbox: Record<string, any>
      "ascii-font": Record<string, any>

      // Override built-in elements to accept OpenTUI props
      text: Record<string, any>
      span: Record<string, any>
      a: Record<string, any>
      b: Record<string, any>
      strong: Record<string, any>
      i: Record<string, any>
      em: Record<string, any>
      u: Record<string, any>
      br: Record<string, any>
      input: Record<string, any>
      select: Record<string, any>
    }
  }
}
