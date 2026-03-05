// Types matching opentui core types.ts
import type { RGBA } from "./rgba"
import type { Renderable } from "./renderable-types"

export const TextAttributes = {
  NONE: 0,
  BOLD: 1 << 0,
  DIM: 1 << 1,
  ITALIC: 1 << 2,
  UNDERLINE: 1 << 3,
  BLINK: 1 << 4,
  INVERSE: 1 << 5,
  HIDDEN: 1 << 6,
  STRIKETHROUGH: 1 << 7,
}

export const ATTRIBUTE_BASE_BITS = 8
export const ATTRIBUTE_BASE_MASK = 0xff

export function getBaseAttributes(attr: number): number {
  return attr & 0xff
}

export type ThemeMode = "dark" | "light"
export type CursorStyle = "block" | "line" | "underline"
export type MousePointerStyle = "default" | "pointer" | "text" | "crosshair" | "move" | "not-allowed"
export type WidthMethod = "wcwidth" | "unicode"
export type Timeout = ReturnType<typeof setTimeout> | undefined

export interface CursorStyleOptions {
  style?: CursorStyle
  blinking?: boolean
  color?: RGBA
  cursor?: MousePointerStyle
}

export enum DebugOverlayCorner {
  topLeft = 0,
  topRight = 1,
  bottomLeft = 2,
  bottomRight = 3,
}

export interface RenderContext {
  addToHitGrid: (x: number, y: number, width: number, height: number, id: number) => void
  pushHitGridScissorRect: (x: number, y: number, width: number, height: number) => void
  popHitGridScissorRect: () => void
  clearHitGridScissorRects: () => void
  width: number
  height: number
  requestRender: () => void
  setCursorPosition: (x: number, y: number, visible: boolean) => void
  setCursorStyle: (options: CursorStyleOptions) => void
  setCursorColor: (color: RGBA) => void
  setMousePointer: (shape: MousePointerStyle) => void
  widthMethod: WidthMethod
  capabilities: any | null
  requestLive: () => void
  dropLive: () => void
  hasSelection: boolean
  getSelection: () => any | null
  requestSelectionUpdate: () => void
  currentFocusedRenderable: any | null
  focusRenderable: (renderable: any) => void
  registerLifecyclePass: (renderable: any) => void
  unregisterLifecyclePass: (renderable: any) => void
  getLifecyclePasses: () => Set<any>
  keyInput: any
  _internalKeyInput: any
  clearSelection: () => void
  startSelection: (renderable: any, x: number, y: number) => void
  updateSelection: (
    currentRenderable: any | undefined,
    x: number,
    y: number,
    options?: { finishDragging?: boolean },
  ) => void
  // EventEmitter methods
  on: (event: string, listener: (...args: any[]) => void) => any
  off: (event: string, listener: (...args: any[]) => void) => any
  emit: (event: string, ...args: any[]) => boolean
  removeAllListeners: (event?: string) => any
}

export interface ViewportBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface Highlight {
  start: number
  end: number
  styleId: number
  priority?: number | null
  hlRef?: number | null
}

export interface LineInfo {
  lineStarts: number[]
  lineWidths: number[]
  maxLineWidth: number
  lineSources: number[]
  lineWraps: number[]
}

export interface LineInfoProvider {
  get lineInfo(): LineInfo
  get lineCount(): number
  get virtualLineCount(): number
  get scrollY(): number
}

export interface CapturedSpan {
  text: string
  fg: RGBA
  bg: RGBA
  attributes: number
  width: number
}

export interface CapturedLine {
  spans: CapturedSpan[]
}

export interface CapturedFrame {
  cols: number
  rows: number
  cursor: [number, number]
  lines: CapturedLine[]
}
