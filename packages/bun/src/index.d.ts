// @gridland/bun type declarations.
// Re-exports everything from @gridland/utils plus native-only exports.
// Native types are declared here since @opentui/core/native isn't available to npm consumers.

export * from "@gridland/utils"

// Native-only exports — types inlined to avoid dependency on @opentui/core/native
export declare class CliRenderer {
  constructor(...args: any[])
  destroy(): void
  start(): void
  [key: string]: any
}

export declare enum CliRenderEvents {
  render = "render",
  resize = "resize",
}

export declare function createCliRenderer(config?: any): Promise<CliRenderer>

export declare class MouseEvent {
  x: number
  y: number
  button: number
  [key: string]: any
}

export declare class TerminalConsole {
  constructor(...args: any[])
  [key: string]: any
}

export declare enum ConsolePosition {
  top = "top",
  bottom = "bottom",
}

export declare const capture: any

export declare class NativeSpanFeed {
  constructor(...args: any[])
  [key: string]: any
}

export declare function setRenderLibPath(libPath: string): void
