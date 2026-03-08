export interface ReadableCharBuffer {
  width: number
  height: number
  char: Uint32Array
}

export function bufferToText(buffer: ReadableCharBuffer): string {
  const lines: string[] = []
  for (let row = 0; row < buffer.height; row++) {
    let line = ""
    for (let col = 0; col < buffer.width; col++) {
      const idx = row * buffer.width + col
      const charCode = buffer.char[idx]
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
