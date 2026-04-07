/**
 * Minimal buffer interface — matches BrowserBuffer's public API.
 * This avoids a hard dependency on @gridland/web for the testing utilities.
 */
export interface ReadableBuffer {
  width: number
  height: number
  char: Uint32Array
  fg: Float32Array
  bg: Float32Array
  attributes: Uint32Array
}

/**
 * Screen provides query helpers for reading buffer content in tests.
 * Unlike ink-testing which parses ANSI, we read TypedArrays directly.
 */
export class Screen {
  private buffer: ReadableBuffer
  private _frames: string[] = []

  constructor(buffer: ReadableBuffer) {
    this.buffer = buffer
  }

  /** Capture a frame snapshot (call after each render) */
  captureFrame(): void {
    this._frames.push(this.text())
  }

  /** Get the current screen text (plain chars, trailing spaces trimmed) */
  text(): string {
    const lines: string[] = []
    for (let row = 0; row < this.buffer.height; row++) {
      let line = ""
      for (let col = 0; col < this.buffer.width; col++) {
        const idx = row * this.buffer.width + col
        const charCode = this.buffer.char[idx]
        line += charCode === 0 ? " " : String.fromCodePoint(charCode)
      }
      lines.push(line.trimEnd())
    }
    // Trim trailing empty lines
    while (lines.length > 0 && lines[lines.length - 1] === "") {
      lines.pop()
    }
    return lines.join("\n")
  }

  /** Get raw text including all spaces (no trimming) */
  rawText(): string {
    const lines: string[] = []
    for (let row = 0; row < this.buffer.height; row++) {
      let line = ""
      for (let col = 0; col < this.buffer.width; col++) {
        const idx = row * this.buffer.width + col
        const charCode = this.buffer.char[idx]
        line += charCode === 0 ? " " : String.fromCodePoint(charCode)
      }
      lines.push(line)
    }
    return lines.join("\n")
  }

  /** Check if the screen contains the given text */
  contains(text: string): boolean {
    return this.text().includes(text)
  }

  /** Check if the screen matches a regex */
  matches(pattern: RegExp): boolean {
    return pattern.test(this.text())
  }

  /** Get a specific line (0-indexed) */
  line(n: number): string {
    const lines = this.text().split("\n")
    return lines[n] ?? ""
  }

  /** Get all non-empty lines */
  lines(): string[] {
    return this.text().split("\n").filter((l) => l.length > 0)
  }

  /** Get all captured frames */
  frames(): string[] {
    return [...this._frames]
  }

  /** Get the number of columns */
  get width(): number {
    return this.buffer.width
  }

  /** Get the number of rows */
  get height(): number {
    return this.buffer.height
  }

  /** Get the raw attributes u32 at a cell position (0-indexed row, col) */
  attributeAt(row: number, col: number): number {
    const idx = row * this.buffer.width + col
    return this.buffer.attributes[idx] ?? 0
  }

  /** Get the raw fg RGBA floats at a cell position as [r, g, b, a] */
  fgAt(row: number, col: number): [number, number, number, number] {
    const idx = (row * this.buffer.width + col) * 4
    return [
      this.buffer.fg[idx] ?? 0,
      this.buffer.fg[idx + 1] ?? 0,
      this.buffer.fg[idx + 2] ?? 0,
      this.buffer.fg[idx + 3] ?? 0,
    ]
  }
}
