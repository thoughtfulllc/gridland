"use client"

// Re-export the OpenTuiCanvas component with "use client" directive.
// This is all that's needed for Next.js — no dynamic imports required.
// Canvas is a standard HTML element, and OpenTuiCanvas handles SSR
// safety internally by rendering a placeholder during server rendering.

export { OpenTuiCanvas } from "./OpenTuiCanvas"
export type { OpenTuiCanvasProps } from "./OpenTuiCanvas"
