// JSX intrinsic elements for Polyterm components
// Uses global JSX namespace override to avoid conflicts with React's HTML/SVG types.

declare namespace JSX {
  interface IntrinsicElements {
    box: Record<string, any>
    scrollbox: Record<string, any>
    "ascii-font": Record<string, any>
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
