// @gridland/bun — full Bun runtime. Re-exports @gridland/utils + native code.
// For CLI/terminal apps running on Bun with native FFI.

// Re-export everything from utils (hooks, types, renderables, reconciler)
export * from "@gridland/utils"

// Side-effect: import zig.ts which calls registerRenderLib() with native FFI
import "../../../opentui/packages/core/src/zig"

// Native-only exports
export { CliRenderer, CliRenderEvents, createCliRenderer } from "../../../opentui/packages/core/src/renderer"
export type { MouseEvent } from "../../../opentui/packages/core/src/renderer"
export { TerminalConsole, ConsolePosition, capture } from "../../../opentui/packages/core/src/console"
export { NativeSpanFeed } from "../../../opentui/packages/core/src/NativeSpanFeed"
export { setRenderLibPath } from "../../../opentui/packages/core/src/zig"
