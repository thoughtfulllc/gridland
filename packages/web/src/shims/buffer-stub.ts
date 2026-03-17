// Minimal browser stub for node:buffer
// parseKeypress accepts Buffer | string but only receives strings in the browser
export class Buffer extends Uint8Array {
  static isBuffer(obj: unknown): obj is Buffer {
    return obj instanceof Buffer
  }
  static from(data: string | ArrayBuffer | Uint8Array, encoding?: string): Buffer {
    if (typeof data === "string") {
      return new Buffer(new TextEncoder().encode(data))
    }
    return new Buffer(data instanceof ArrayBuffer ? new Uint8Array(data) : data)
  }
  toString(encoding?: string): string {
    return new TextDecoder().decode(this)
  }
}

export default { Buffer }
