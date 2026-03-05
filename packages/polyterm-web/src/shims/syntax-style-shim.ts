// Shim that re-exports BrowserSyntaxStyle as SyntaxStyle
export { BrowserSyntaxStyle as SyntaxStyle } from "../browser-syntax-style"

// Types that opentui imports from syntax-style
export interface StyleDefinition {
  fg?: any
  bg?: any
  attributes?: number
  [key: string]: any
}

export interface MergedStyle {
  attributes: number
}

export interface ThemeTokenStyle {
  scope: string | string[]
  settings: Record<string, any>
}

export function convertThemeToStyles(_theme: ThemeTokenStyle[]): Record<string, StyleDefinition> {
  return {}
}
