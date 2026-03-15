// @gridland/utils — portable hooks, types, renderables, and React reconciler.
// No native code. Safe to import in any environment (browser, Bun, Node).

// @opentui/core is the base — export everything from it first.
export * from "@opentui/core"

// @opentui/react re-exports some types that overlap with @opentui/core
// (e.g. RenderableConstructor). TypeScript's `export *` treats duplicate
// names as ambiguous errors. We explicitly re-export from @opentui/react.
export {
  // Components
  baseComponents,
  componentCatalogue,
  extend,
  getComponentCatalogue,
  type ExtendedComponentProps,
  type ExtendedIntrinsicElements,
  type RenderableConstructor,
  // App
  AppContext,
  useAppContext,
  // Hooks
  useKeyboard,
  type UseKeyboardOptions,
  useOnResize,
  useRenderer,
  useTimeline,
  useTerminalDimensions,
  // Reconciler
  createRoot,
  createPortal,
  flushSync,
  type Root,
  // Reconciler internals
  _render,
  reconciler,
  // Error boundary
  ErrorBoundary,
  // React
  createElement,
} from "@opentui/react"
