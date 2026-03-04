// Core entry point for opentui-web
// Use this when you're using the Vite plugin (which resolves @opentui/* packages).
// This exports only the browser runtime without bundling opentui internals.

export { OpenTuiCanvas } from "./OpenTuiCanvas"
export type { OpenTuiCanvasProps } from "./OpenTuiCanvas"
export { mountOpenTui } from "./mount"
export type { MountOptions, MountResult } from "./mount"
export { BrowserRenderer } from "./browser-renderer"
export { BrowserBuffer } from "./browser-buffer"
export { BrowserTextBuffer } from "./browser-text-buffer"
export { BrowserTextBufferView } from "./browser-text-buffer-view"
export { BrowserRenderContext } from "./browser-render-context"
export { CanvasPainter } from "./canvas-painter"
export { SelectionManager } from "./selection-manager"
export { createBrowserRoot } from "./create-browser-root"
export type { BrowserRoot } from "./create-browser-root"
export { useFileDrop } from "./file-drop"
export { usePaste } from "./paste"
export { BrowserContext, useBrowserContext } from "./browser-context"
export { isBrowser, isCanvasSupported, calculateGridSize } from "./utils"
