// Main entry point for opentui-web
// This is the "bundled" mode — includes all browser runtime components.

// React component (the primary API)
export { OpenTuiCanvas } from "./OpenTuiCanvas"
export type { OpenTuiCanvasProps } from "./OpenTuiCanvas"

// Imperative mount API
export { mountOpenTui } from "./mount"
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

// React hooks
export { useFileDrop } from "./file-drop"
export type { DroppedFile } from "./file-drop"
export { usePaste } from "./paste"
export { BrowserContext, useBrowserContext } from "./browser-context"
export type { BrowserContextValue } from "./browser-context"

// Utilities
export { isBrowser, isCanvasSupported, calculateGridSize } from "./utils"
