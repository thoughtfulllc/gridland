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
} from "../../../opentui/packages/core/src/Renderable"
export type {
  RenderableOptions,
  LayoutOptions,
  BaseRenderableOptions,
  Position,
  RenderCommand,
} from "../../../opentui/packages/core/src/Renderable"

// Border (pure TS)
export {
  BorderChars,
  BorderCharArrays,
  isValidBorderStyle,
  parseBorderStyle,
  getBorderFromSides,
  getBorderSides,
  borderCharsToArray,
} from "../../../opentui/packages/core/src/lib/border"
export type {
  BorderCharacters,
  BorderStyle,
  BorderSides,
  BorderConfig,
  BoxDrawOptions,
  BorderSidesConfig,
} from "../../../opentui/packages/core/src/lib/border"

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
} from "../../../opentui/packages/core/src/lib/styled-text"

// Yoga options (pure TS)
export {
  parseAlign,
  parseAlignItems,
  parseFlexDirection,
  parseJustify,
  parseOverflow,
  parsePositionType,
  parseWrap,
} from "../../../opentui/packages/core/src/lib/yoga.options"
export type {
  AlignString,
  FlexDirectionString,
  JustifyString,
  OverflowString,
  PositionTypeString,
  WrapString,
} from "../../../opentui/packages/core/src/lib/yoga.options"

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
} from "../../../opentui/packages/core/src/lib/renderable.validations"

// Selection (pure TS)
export {
  Selection,
  convertGlobalToLocalSelection,
} from "../../../opentui/packages/core/src/lib/selection"

// VNode composition (pure TS)
export { maybeMakeRenderable } from "../../../opentui/packages/core/src/renderables/composition/vnode"
export type { VNode } from "../../../opentui/packages/core/src/renderables/composition/vnode"

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

// Stub engine
export const engine = {
  attach(_renderer: any): void {},
  detach(): void {},
  register(_timeline: any): void {},
  unregister(_timeline: any): void {},
  clear(): void {},
  update(_deltaTime: number): void {},
  defaults: { frameRate: 60 },
}

// Yoga re-export
export * as Yoga from "yoga-layout"

// Stub types for renderer/mouse
export type MouseEvent = any
export type MouseEventType = any
export type CliRenderer = any

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
