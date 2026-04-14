// @gridland/utils type declarations.
// Portable hooks, types, and React context — no engine code.

import type React from "react"

// ── Hooks ────────────────────────────────────────────────────────────────

export interface UseKeyboardOptions {
  release?: boolean
  focusId?: string
  global?: boolean
  selectedOnly?: boolean
}

export declare const useKeyboard: (handler: (key: KeyEvent) => void, options?: UseKeyboardOptions) => void
export declare const useOnResize: (callback: (width: number, height: number) => void) => any
export declare const useRenderer: () => any
export declare const useTerminalDimensions: () => { width: number; height: number }
export declare const useTimeline: (options?: TimelineOptions) => Timeline

// ── React context ────────────────────────────────────────────────────────

export declare const AppContext: React.Context<{
  keyHandler: any | null
  renderer: any | null
}>
export declare const useAppContext: () => { keyHandler: any | null; renderer: any | null }
export declare class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {}
export { createElement } from "react"

// ── Animation ────────────────────────────────────────────────────────────

export interface TimelineOptions {
  duration?: number
  loop?: boolean
  autoplay?: boolean
  onComplete?: () => void
  onPause?: () => void
}

export interface AnimationOptions {
  duration: number
  ease?: EasingFunctions
  onUpdate?: (animation: JSAnimation) => void
  onComplete?: () => void
  onStart?: () => void
  onLoop?: () => void
  loop?: boolean | number
  loopDelay?: number
  alternate?: boolean
  once?: boolean
  [key: string]: any
}

export interface JSAnimation {
  targets: any[]
  deltaTime: number
  progress: number
  currentTime: number
}

export type EasingFunctions =
  | "linear" | "inQuad" | "outQuad" | "inOutQuad"
  | "inExpo" | "outExpo" | "inOutSine"
  | "outBounce" | "outElastic" | "inBounce"
  | "inCirc" | "outCirc" | "inOutCirc"
  | "inBack" | "outBack" | "inOutBack"

export declare class Timeline {
  items: any[]
  subTimelines: any[]
  currentTime: number
  isPlaying: boolean
  isComplete: boolean
  duration: number
  loop: boolean
  synced: boolean

  constructor(options?: TimelineOptions)
  add(target: any, properties: AnimationOptions, startTime?: number | string): this
  once(target: any, properties: AnimationOptions): this
  call(callback: () => void, startTime?: number | string): this
  sync(timeline: Timeline, startTime?: number): this
  play(): this
  pause(): this
  restart(): this
  update(deltaTime: number): void
}

export declare const engine: {
  attach(renderer: any): void
  detach(): void
  register(timeline: Timeline): void
  unregister(timeline: Timeline): void
  clear(): void
  update(deltaTime: number): void
  defaults: { frameRate: number }
}

export declare function createTimeline(options?: TimelineOptions): Timeline

// ── Color utilities ──────────────────────────────────────────────────────

export declare class RGBA {
  buffer: Float32Array
  constructor(buffer: Float32Array)
  static fromArray(array: Float32Array): RGBA
  static fromValues(r: number, g: number, b: number, a?: number): RGBA
  static fromInts(r: number, g: number, b: number, a?: number): RGBA
  static fromHex(hex: string): RGBA
  toInts(): [number, number, number, number]
  get r(): number
  set r(value: number)
  get g(): number
  set g(value: number)
  get b(): number
  set b(value: number)
  get a(): number
  set a(value: number)
  map<R>(fn: (value: number) => R): R[]
  toString(): string
  equals(other?: RGBA): boolean
}

export type ColorInput = string | RGBA

export declare function parseColor(color: ColorInput): RGBA
export declare function hexToRgb(hex: string): RGBA
export declare function rgbToHex(rgb: RGBA): string
export declare function hsvToRgb(h: number, s: number, v: number): RGBA

// ── Types ────────────────────────────────────────────────────────────────

export declare const TextAttributes: {
  NONE: number
  BOLD: number
  DIM: number
  ITALIC: number
  UNDERLINE: number
  BLINK: number
  INVERSE: number
  HIDDEN: number
  STRIKETHROUGH: number
}

export declare const ATTRIBUTE_BASE_BITS: number
export declare const ATTRIBUTE_BASE_MASK: number
export declare function getBaseAttributes(attr: number): number

export type CursorStyle = "block" | "line" | "underline"
export type MousePointerStyle = "default" | "pointer" | "text" | "crosshair" | "move" | "not-allowed"
export type ThemeMode = "dark" | "light"
export type WidthMethod = "wcwidth" | "unicode"
export type Timeout = ReturnType<typeof setTimeout> | undefined

export interface CursorStyleOptions {
  style?: CursorStyle
  blinking?: boolean
  color?: RGBA
  cursor?: MousePointerStyle
}

export declare enum DebugOverlayCorner {
  topLeft = 0,
  topRight = 1,
  bottomLeft = 2,
  bottomRight = 3,
}

export interface RenderContext {
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
  [key: string]: any
}

export interface RendererEvents {
  resize: (width: number, height: number) => void
  key: (data: Buffer) => void
  [key: string]: (...args: any[]) => void
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

// ── Key events ───────────────────────────────────────────────────────────

export type KeyEventType = "press" | "repeat" | "release"

export declare class KeyEvent {
  name: string
  ctrl: boolean
  meta: boolean
  shift: boolean
  option: boolean
  sequence: string
  number: boolean
  raw: string
  repeated: boolean
  eventType: KeyEventType
  source: string
  defaultPrevented: boolean
  propagationStopped: boolean
  preventDefault(): void
  stopPropagation(): void
}

// ── Focus system ────────────────────────────────────────────────────────

export interface UseFocusOptions {
  id?: string
  tabIndex?: number
  autoFocus?: boolean
  disabled?: boolean
  scopeId?: string | null
  selectable?: boolean
}

export interface UseFocusReturn {
  isFocused: boolean
  isSelected: boolean
  isAnySelected: boolean
  focus: () => void
  blur: () => void
  select: () => void
  deselect: () => void
  focusId: string
  focusRef: (node: any) => void
}

export declare function useFocus(options?: UseFocusOptions): UseFocusReturn

export interface FocusProviderProps {
  selectable?: boolean
  children: React.ReactNode
}

export declare function FocusProvider(props: FocusProviderProps): React.JSX.Element

export interface FocusScopeProps {
  trap?: boolean
  selectable?: boolean
  autoFocus?: boolean
  autoSelect?: boolean
  restoreOnUnmount?: boolean
  children: React.ReactNode
}

export declare function FocusScope(props: FocusScopeProps): React.JSX.Element

export interface FocusContextValue {
  dispatch: (action: any) => void
  store: any | null
}

export declare function useFocusContext(): FocusContextValue
export declare function useFocusScopeId(): string | null

export interface ShortcutEntry {
  key: string
  label: string
}

export declare function useShortcuts(shortcuts: ShortcutEntry[], focusId: string): void
export declare function useFocusedShortcuts(): ShortcutEntry[]

// ── Runtime context ─────────────────────────────────────────────────────

export type RuntimeType = "terminal" | "browser"

export interface RuntimeProviderProps {
  runtime: RuntimeType
  children: React.ReactNode
}

export declare function RuntimeProvider(props: RuntimeProviderProps): React.JSX.Element
export declare function useRuntime(): RuntimeType

// ── Browser utilities ────────────────────────────────────────────────────

export declare function isBrowser(): boolean
export declare function isCanvasSupported(): boolean
export declare function calculateGridSize(
  widthPx: number,
  heightPx: number,
  cellWidth: number,
  cellHeight: number,
): { cols: number; rows: number }
