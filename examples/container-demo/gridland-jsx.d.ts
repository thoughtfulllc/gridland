// Gridland uses a custom React reconciler, not the DOM.
// Augment React's element attribute interfaces to accept any props.

import "react"
import "csstype"

declare module "react" {
  interface HTMLAttributes<T> {
    [key: string]: any
  }
  interface SVGAttributes<T> {
    [key: string]: any
  }
  interface CSSProperties {
    [key: string]: any
  }
  namespace JSX {
    interface IntrinsicElements {
      box: Record<string, any>
      scrollbox: Record<string, any>
      "ascii-font": Record<string, any>
    }
  }
}

declare module "csstype" {
  interface Properties<TLength, TTime> {
    [key: string]: any
  }
}
