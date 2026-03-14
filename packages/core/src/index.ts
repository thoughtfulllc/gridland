// @gridland/core — portable hooks and utilities
// Works in both browser and CLI environments via opentui React context.

// React hooks (re-exported from @opentui/react so consumers don't need opentui directly)
export { useKeyboard } from "@opentui/react"
export { useTerminalDimensions } from "@opentui/react"

// Headless rendering
export { bufferToText } from "../../web/src/buffer-to-text"
export { HeadlessRenderer, setHeadlessRootRenderableClass } from "../../web/src/headless-renderer"
export type { HeadlessRendererOptions } from "../../web/src/headless-renderer"
export { createHeadlessRoot } from "../../web/src/create-headless-root"
export type { HeadlessRoot } from "../../web/src/create-headless-root"

// Shared React context
export { BrowserContext } from "../../web/src/browser-context"
export type { BrowserContextValue } from "../../web/src/browser-context"

// Utilities
export { isBrowser, isCanvasSupported, calculateGridSize } from "../../web/src/utils"
