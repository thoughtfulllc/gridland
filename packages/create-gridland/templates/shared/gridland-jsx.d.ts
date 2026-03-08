// Gridland uses a custom React reconciler, not the DOM.
// Augment React's element attribute interfaces to accept any props,
// since HTML/SVG type constraints don't apply.

import "react"
import "csstype"

declare module "react" {
  // Allow any props on all HTML elements
  interface HTMLAttributes<T> {
    [key: string]: any
  }
  // Allow any props on all SVG elements
  interface SVGAttributes<T> {
    [key: string]: any
  }
  // Allow any CSS properties (style prop accepts custom renderer props)
  interface CSSProperties {
    [key: string]: any
  }
  namespace JSX {
    interface IntrinsicElements {
      // Add custom elements not in React's definitions
      box: Record<string, any>
      scrollbox: Record<string, any>
      "ascii-font": Record<string, any>
    }
  }
}

// Also augment csstype since React uses it for style typing
declare module "csstype" {
  interface Properties<TLength, TTime> {
    [key: string]: any
  }
}
