// Stub for opentui/packages/core/src/zig.ts
// Provides no-op RenderLib and resolveRenderLib

export type Pointer = number

export interface LineInfo {
  lineStarts: number[]
  lineWidths: number[]
  maxLineWidth: number
  lineSources: number[]
  lineWraps: number[]
}

export interface RenderLib {
  [key: string]: any
}

export function resolveRenderLib(): RenderLib {
  throw new Error("Zig render library not available in browser environment")
}
