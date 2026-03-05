"use client"

// Re-export the TUI component with "use client" directive.
// This is all that's needed for Next.js — no dynamic imports required.
// Canvas is a standard HTML element, and TUI handles SSR
// safety internally by rendering a placeholder during server rendering.

export { TUI } from "./TUI"
export type { TUIProps } from "./TUI"
