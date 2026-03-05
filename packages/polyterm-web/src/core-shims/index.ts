// Core shims barrel — aliased as @opentui/core by Vite
// Re-exports portable code from opentui and swaps in browser replacements.
// Vite aliases intercept zig, buffer, text-buffer, text-buffer-view,
// syntax-style, renderer, console, etc. before they reach the filesystem.

// ─── Pure TS re-exports ───────────────────────────────────────────────────

// RGBA and color utilities (our own copy to avoid pulling in opentui's lib/index)
export { RGBA, parseColor, hexToRgb, rgbToHex, hsvToRgb } from "./rgba"
export type { ColorInput } from "./rgba"

// Types
export {
  TextAttributes,
  ATTRIBUTE_BASE_BITS,
  ATTRIBUTE_BASE_MASK,
  getBaseAttributes,
  DebugOverlayCorner,
} from "./types"
export type {
  RenderContext,
  ThemeMode,
  CursorStyle,
  CursorStyleOptions,
  MousePointerStyle,
  WidthMethod,
  Timeout,
  ViewportBounds,
  Highlight,
  LineInfo,
  LineInfoProvider,
  CapturedSpan,
  CapturedLine,
  CapturedFrame,
} from "./types"

// ─── Re-exports from opentui source (Vite intercepts Zig deps) ───────────

// Renderable base classes (needed by our own code — main.tsx uses RootRenderable)
// NOTE: The opentui react package imports from the real opentui barrel instead
// (redirected by the Vite plugin) to avoid cross-barrel circular dependency issues.
export {
  Renderable,
  BaseRenderable,
  RootRenderable,
  LayoutEvents,
  RenderableEvents,
  isRenderable,
} from "../../../../opentui/packages/core/src/Renderable"
export type {
  RenderableOptions,
  LayoutOptions,
  BaseRenderableOptions,
  Position,
  RenderCommand,
} from "../../../../opentui/packages/core/src/Renderable"

// Border (pure TS)
export {
  BorderChars,
  BorderCharArrays,
  isValidBorderStyle,
  parseBorderStyle,
  getBorderFromSides,
  getBorderSides,
  borderCharsToArray,
} from "../../../../opentui/packages/core/src/lib/border"
export type {
  BorderCharacters,
  BorderStyle,
  BorderSides,
  BorderConfig,
  BoxDrawOptions,
  BorderSidesConfig,
} from "../../../../opentui/packages/core/src/lib/border"

// Styled text (pure TS)
export {
  StyledText,
  isStyledText,
  stringToStyledText,
  t,
  bold,
  italic,
  underline,
  strikethrough,
  dim,
  reverse,
  blink,
  fg,
  bg,
  black,
  red,
  green,
  yellow,
  blue,
  magenta,
  cyan,
  white,
} from "../../../../opentui/packages/core/src/lib/styled-text"

// Yoga options (pure TS)
export {
  parseAlign,
  parseAlignItems,
  parseFlexDirection,
  parseJustify,
  parseOverflow,
  parsePositionType,
  parseWrap,
} from "../../../../opentui/packages/core/src/lib/yoga.options"
export type {
  AlignString,
  FlexDirectionString,
  JustifyString,
  OverflowString,
  PositionTypeString,
  WrapString,
} from "../../../../opentui/packages/core/src/lib/yoga.options"

// Renderable validations (pure TS)
export {
  validateOptions,
  isPositionType,
  isDimensionType,
  isFlexBasisType,
  isSizeType,
  isMarginType,
  isPaddingType,
  isPositionTypeType,
  isOverflowType,
} from "../../../../opentui/packages/core/src/lib/renderable.validations"

// Selection (pure TS)
export {
  Selection,
  convertGlobalToLocalSelection,
} from "../../../../opentui/packages/core/src/lib/selection"

// VNode composition (pure TS)
export { maybeMakeRenderable } from "../../../../opentui/packages/core/src/renderables/composition/vnode"
export type { VNode } from "../../../../opentui/packages/core/src/renderables/composition/vnode"

// ─── Renderable subclasses (re-exported from individual files, not barrel) ─

// These are needed by @opentui/react for the component catalogue and host-config.
// File-level shims (zig, buffer, renderer, etc.) handle their internal imports.
export * from "../../../../opentui/packages/core/src/renderables/Box"
export * from "../../../../opentui/packages/core/src/renderables/Text"
export * from "../../../../opentui/packages/core/src/renderables/TextNode"
export * from "../../../../opentui/packages/core/src/renderables/Code"
export * from "../../../../opentui/packages/core/src/renderables/Diff"
export * from "../../../../opentui/packages/core/src/renderables/Input"
export * from "../../../../opentui/packages/core/src/renderables/Select"
export * from "../../../../opentui/packages/core/src/renderables/TabSelect"
export * from "../../../../opentui/packages/core/src/renderables/Textarea"
export * from "../../../../opentui/packages/core/src/renderables/ScrollBox"
export * from "../../../../opentui/packages/core/src/renderables/ScrollBar"
export * from "../../../../opentui/packages/core/src/renderables/Slider"
export * from "../../../../opentui/packages/core/src/renderables/ASCIIFont"
export * from "../../../../opentui/packages/core/src/renderables/LineNumberRenderable"
export * from "../../../../opentui/packages/core/src/renderables/Markdown"
export * from "../../../../opentui/packages/core/src/renderables/FrameBuffer"
export * from "../../../../opentui/packages/core/src/renderables/TextBufferRenderable"

// ─── Browser replacements ─────────────────────────────────────────────────

// Buffer — browser replacement
export { BrowserBuffer as OptimizedBuffer } from "../browser-buffer"

// TextBuffer — browser replacement
export { BrowserTextBuffer as TextBuffer } from "../browser-text-buffer"
export type { TextChunk } from "../browser-text-buffer"

// TextBufferView — browser replacement
export { BrowserTextBufferView as TextBufferView } from "../browser-text-buffer-view"

// SyntaxStyle — browser stub
export { BrowserSyntaxStyle as SyntaxStyle } from "../browser-syntax-style"

// ─── Stubs ────────────────────────────────────────────────────────────────

export function resolveRenderLib(): any {
  return null
}

export type RenderLib = any
export type Pointer = number

// KeyHandler (re-implemented for browser)
export {
  BrowserKeyHandler as KeyHandler,
  BrowserInternalKeyHandler as InternalKeyHandler,
} from "../browser-render-context"

// Renderer — re-exported from shimmed source path (resolved to renderer-stub.ts)
export {
  CliRenderer,
  CliRenderEvents,
  createCliRenderer,
} from "../../../../opentui/packages/core/src/renderer"
export type { MouseEvent } from "../../../../opentui/packages/core/src/renderer"

// Timeline & engine — re-exported from shimmed source path (resolved to timeline-stub.ts)
export {
  Timeline,
  engine,
  createTimeline,
} from "../../../../opentui/packages/core/src/animation/Timeline"

// Yoga re-export
export * as Yoga from "yoga-layout"

// Stub types for mouse
export type MouseEventType = any

// Utils
export function createTextAttributes(opts: {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  dim?: boolean
  blink?: boolean
  inverse?: boolean
  hidden?: boolean
  strikethrough?: boolean
} = {}): number {
  const TA = {
    NONE: 0, BOLD: 1, DIM: 2, ITALIC: 4, UNDERLINE: 8,
    BLINK: 16, INVERSE: 32, HIDDEN: 64, STRIKETHROUGH: 128,
  }
  let attr = TA.NONE
  if (opts.bold) attr |= TA.BOLD
  if (opts.italic) attr |= TA.ITALIC
  if (opts.underline) attr |= TA.UNDERLINE
  if (opts.dim) attr |= TA.DIM
  if (opts.blink) attr |= TA.BLINK
  if (opts.inverse) attr |= TA.INVERSE
  if (opts.hidden) attr |= TA.HIDDEN
  if (opts.strikethrough) attr |= TA.STRIKETHROUGH
  return attr
}

export function attributesWithLink(baseAttributes: number, linkId: number): number {
  return (baseAttributes & 0xff) | ((linkId & 0xffffff) << 8)
}

export function getLinkId(attributes: number): number {
  return (attributes >>> 8) & 0xffffff
}

export function visualizeRenderableTree(..._args: any[]): void {}
