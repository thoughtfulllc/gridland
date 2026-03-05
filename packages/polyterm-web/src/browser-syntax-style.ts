// Stub SyntaxStyle for browser - no native Zig backing needed
export class BrowserSyntaxStyle {
  private _destroyed = false

  static create(): BrowserSyntaxStyle {
    return new BrowserSyntaxStyle()
  }

  static fromTheme(_theme: any): BrowserSyntaxStyle {
    return new BrowserSyntaxStyle()
  }

  static fromStyles(_styles: any): BrowserSyntaxStyle {
    return new BrowserSyntaxStyle()
  }

  get ptr(): number {
    return 0
  }

  registerStyle(_name: string, _style: any): number {
    return 0
  }

  resolveStyleId(_name: string): number | null {
    return null
  }

  getStyleId(_name: string): number | null {
    return null
  }

  getStyleCount(): number {
    return 0
  }

  clearNameCache(): void {}

  getStyle(_name: string): any {
    return undefined
  }

  mergeStyles(..._styleNames: string[]): { attributes: number } {
    return { attributes: 0 }
  }

  clearCache(): void {}
  getCacheSize(): number {
    return 0
  }
  getAllStyles(): Map<string, any> {
    return new Map()
  }
  getRegisteredNames(): string[] {
    return []
  }

  destroy(): void {
    this._destroyed = true
  }
}
