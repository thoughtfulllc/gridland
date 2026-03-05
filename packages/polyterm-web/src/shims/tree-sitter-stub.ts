// Stub for opentui tree-sitter module
export function getTreeSitterClient(): any {
  return null
}

export function createTreeSitterClient(): any {
  return null
}

export function treeSitterToStyledText(..._args: any[]): any {
  return null
}

export function treeSitterToTextChunks(..._args: any[]): any[] {
  return []
}

export class TreeSitterClient {
  static create(): any {
    return null
  }
  setDataPath(_path: string): void {}
  highlight(_code: string, _language: string): any[] {
    return []
  }
  getLanguages(): string[] {
    return []
  }
}

export const defaultParsers: any[] = []
export function registerParser(): void {}
export function getParser(): any {
  return null
}

// Types
export type SimpleHighlight = any
export type TreeSitterClientOptions = any

// Re-export from tree-sitter-styled-text (which also gets stubbed)
export { treeSitterToTextChunks as treeSitterToTextChunksFromStyledText }

// resolve-ft exports
export function resolveFiletype(_filename: string): string | null {
  return null
}
