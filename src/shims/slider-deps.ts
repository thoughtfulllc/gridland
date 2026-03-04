// Minimal barrel for Slider.ts that avoids the circular dependency.
// Slider.ts imports { OptimizedBuffer, parseColor, Renderable, RGBA, RenderableOptions, RenderContext } from "../index"
// We provide these directly from the source files, bypassing any barrel that re-exports renderables.

export { Renderable, type RenderableOptions } from "../../../opentui/packages/core/src/Renderable"
export type { RenderContext } from "../core-shims/types"
export { BrowserBuffer as OptimizedBuffer } from "../browser-buffer"
export { RGBA, parseColor, type ColorInput } from "../core-shims/rgba"
