// Main entry point for @gridland/web
// Browser-specific runtime. Portable hooks/utilities live in @gridland/utils.

// React component (the primary API)
export { TUI } from "./TUI"
export type { TUIProps } from "./TUI"

// Imperative mount API
export { mountGridland } from "./mount"
export type { MountOptions, MountResult } from "./mount"

// Core browser runtime
export { BrowserRenderer } from "./browser-renderer"
export { BrowserBuffer } from "./browser-buffer"
export type { WidthMethod, BorderDrawOptions } from "./browser-buffer"
export { BrowserTextBuffer } from "./browser-text-buffer"
export type { TextChunk, StyledTextInput } from "./browser-text-buffer"
export { BrowserTextBufferView } from "./browser-text-buffer-view"
export type { VisibleLine, VisibleLineChunk } from "./browser-text-buffer-view"
export { BrowserRenderContext } from "./browser-render-context"
export { BrowserSyntaxStyle } from "./browser-syntax-style"
export { CanvasPainter } from "./canvas-painter"
export type { CanvasPainterOptions } from "./canvas-painter"
export { SelectionManager } from "./selection-manager"
export { createBrowserRoot } from "./create-browser-root"
export type { BrowserRoot } from "./create-browser-root"

// Headless rendering
export { bufferToText } from "./buffer-to-text"
export { HeadlessRenderer, setHeadlessRootRenderableClass } from "./headless-renderer"
export type { HeadlessRendererOptions } from "./headless-renderer"
export { createHeadlessRoot } from "./create-headless-root"
export type { HeadlessRoot } from "./create-headless-root"

// Browser context
export { BrowserContext } from "./browser-context"
export type { BrowserContextValue } from "./browser-context"

// Utilities
export { isBrowser, isCanvasSupported, calculateGridSize } from "./utils"

// Browser-only hooks
export { useFileDrop } from "./file-drop"
export type { DroppedFile } from "./file-drop"
export { usePaste } from "./paste"
export { useBrowserContext } from "./browser-context"

// Gridland extension: textAlign property on TextBufferRenderable.
// Proxies to the BrowserTextBufferView's textAlign property for centered text rendering.
import { TextBufferRenderable } from "@gridland/utils"
Object.defineProperty(TextBufferRenderable.prototype, "textAlign", {
  get(this: any) {
    return this.textBufferView?.textAlign ?? "left"
  },
  set(this: any, value: "left" | "center" | "right") {
    if (this.textBufferView) {
      this.textBufferView.textAlign = value
      this.requestRender()
    }
  },
  enumerable: true,
  configurable: true,
})
