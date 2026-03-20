// @gridland/utils — portable hooks, types, and React context.
// No engine code (no reconciler, yoga, renderables, buffers, zig).
// Shared singleton: AppContext is the bridge between utils, @gridland/bun, and @gridland/web.

// Hooks
export { useKeyboard, type UseKeyboardOptions } from "../../core/src/react/hooks/use-keyboard"
export { useOnResize } from "../../core/src/react/hooks/use-resize"
export { useRenderer } from "../../core/src/react/hooks/use-renderer"
export { useTerminalDimensions } from "../../core/src/react/hooks/use-terminal-dimensions"
export { useTimeline } from "../../core/src/react/hooks/use-timeline"

// React context
export { AppContext, useAppContext } from "../../core/src/react/components/app"
export { ErrorBoundary } from "../../core/src/react/components/error-boundary"
export { createElement } from "react"

// Animation (needed by useTimeline at runtime)
export {
  Timeline,
  engine,
  createTimeline,
  type TimelineOptions,
  type AnimationOptions,
  type EasingFunctions,
  type JSAnimation,
} from "../../core/src/animation/Timeline"

// Color utilities
export {
  RGBA,
  parseColor,
  hexToRgb,
  rgbToHex,
  hsvToRgb,
  type ColorInput,
} from "../../core/src/lib/RGBA"

// Types
export {
  TextAttributes,
  ATTRIBUTE_BASE_BITS,
  ATTRIBUTE_BASE_MASK,
  getBaseAttributes,
  type CursorStyle,
  type CursorStyleOptions,
  type MousePointerStyle,
  type ThemeMode,
  type RenderContext,
  type RendererEvents,
  type WidthMethod,
  type Timeout,
  type ViewportBounds,
  type CapturedSpan,
  type CapturedLine,
  type CapturedFrame,
  type Highlight,
  type LineInfo,
  type LineInfoProvider,
  DebugOverlayCorner,
} from "../../core/src/types"

// KeyEvent class and types
export { KeyEvent, type KeyEventType } from "../../core/src/lib/KeyEvent"

// Focus system
export {
  useFocus,
  FocusProvider,
  FocusScope,
  useFocusContext,
  useFocusScopeId,
  useShortcuts,
  useFocusedShortcuts,
  type UseFocusOptions,
  type UseFocusReturn,
  type FocusProviderProps,
  type FocusScopeProps,
  type ShortcutEntry,
} from "../../core/src/react/focus"

// Runtime context
export {
  useRuntime,
  RuntimeProvider,
  type RuntimeType,
  type RuntimeProviderProps,
} from "../../core/src/react/runtime/runtime-context"

// Browser utilities
export { isBrowser, isCanvasSupported, calculateGridSize } from "./browser-utils"
