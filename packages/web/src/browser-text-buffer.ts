import type { RGBA } from "@gridland/utils"
import type { WidthMethod } from "./browser-buffer"

export interface TextChunk {
  __isChunk: true
  text: string
  fg?: RGBA
  bg?: RGBA
  attributes?: number
  link?: { url: string }
}

export interface StyledTextInput {
  chunks: TextChunk[]
}

export class BrowserTextBuffer {
  private _text: string = ""
  private _chunks: TextChunk[] = []
  private _defaultFg: RGBA | null = null
  private _defaultBg: RGBA | null = null
  private _defaultAttributes: number = 0
  private _syntaxStyle: any = null
  private _tabWidth: number = 4
  private _widthMethod: WidthMethod

  constructor(widthMethod: WidthMethod) {
    this._widthMethod = widthMethod
  }

  static create(widthMethod: WidthMethod): BrowserTextBuffer {
    return new BrowserTextBuffer(widthMethod)
  }

  // Compat property
  get ptr(): number {
    return 1 // Non-zero so TextBufferRenderable.renderSelf proceeds
  }

  get length(): number {
    return this._text.length
  }

  get byteSize(): number {
    return new TextEncoder().encode(this._text).length
  }

  setText(text: string): void {
    this._text = text
    this._chunks = [
      {
        __isChunk: true,
        text,
        fg: this._defaultFg ?? undefined,
        bg: this._defaultBg ?? undefined,
        attributes: this._defaultAttributes,
      },
    ]
  }

  append(text: string): void {
    this._text += text
    this._chunks.push({
      __isChunk: true,
      text,
      fg: this._defaultFg ?? undefined,
      bg: this._defaultBg ?? undefined,
      attributes: this._defaultAttributes,
    })
  }

  setStyledText(styledText: StyledTextInput): void {
    this._chunks = styledText.chunks.map((chunk) => ({
      __isChunk: true,
      text: chunk.text,
      fg: chunk.fg ?? this._defaultFg ?? undefined,
      bg: chunk.bg ?? this._defaultBg ?? undefined,
      attributes: chunk.attributes ?? this._defaultAttributes,
      link: chunk.link,
    }))
    this._text = this._chunks.map((c) => c.text).join("")
  }

  getPlainText(): string {
    return this._text
  }

  getTextRange(startOffset: number, endOffset: number): string {
    return this._text.slice(startOffset, endOffset)
  }

  getLineCount(): number {
    if (this._text.length === 0) return 0
    return this._text.split("\n").length
  }

  getChunks(): TextChunk[] {
    return this._chunks
  }

  setDefaultFg(fg: RGBA | null): void {
    this._defaultFg = fg
  }

  setDefaultBg(bg: RGBA | null): void {
    this._defaultBg = bg
  }

  setDefaultAttributes(attributes: number | null): void {
    this._defaultAttributes = attributes ?? 0
  }

  resetDefaults(): void {
    this._defaultFg = null
    this._defaultBg = null
    this._defaultAttributes = 0
  }

  get defaultFg(): RGBA | null {
    return this._defaultFg
  }

  get defaultBg(): RGBA | null {
    return this._defaultBg
  }

  get defaultAttributes(): number {
    return this._defaultAttributes
  }

  setSyntaxStyle(style: any): void {
    this._syntaxStyle = style
  }

  getSyntaxStyle(): any {
    return this._syntaxStyle
  }

  setTabWidth(width: number): void {
    this._tabWidth = width
  }

  getTabWidth(): number {
    return this._tabWidth
  }

  addHighlightByCharRange(_highlight: any): void {}
  addHighlight(_lineIdx: number, _highlight: any): void {}
  removeHighlightsByRef(_hlRef: number): void {}
  clearLineHighlights(_lineIdx: number): void {}
  clearAllHighlights(): void {}
  getLineHighlights(_lineIdx: number): any[] {
    return []
  }
  getHighlightCount(): number {
    return 0
  }
  loadFile(_path: string): void {}

  clear(): void {
    this._text = ""
    this._chunks = []
  }

  reset(): void {
    this.clear()
    this.resetDefaults()
  }

  destroy(): void {
    this._text = ""
    this._chunks = []
  }
}
