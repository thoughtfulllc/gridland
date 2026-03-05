// Browser shim for node:buffer
// TextEncoder/TextDecoder are available in browsers
class BrowserBuffer extends Uint8Array {
  static from(data: string | ArrayBuffer | Uint8Array, encoding?: string): BrowserBuffer {
    if (typeof data === "string") {
      const encoder = new TextEncoder()
      const bytes = encoder.encode(data)
      return new BrowserBuffer(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    }
    if (data instanceof ArrayBuffer) {
      return new BrowserBuffer(data)
    }
    if (data instanceof Uint8Array) {
      return new BrowserBuffer(data.buffer, data.byteOffset, data.byteLength)
    }
    return new BrowserBuffer(0)
  }

  static alloc(size: number): BrowserBuffer {
    return new BrowserBuffer(size)
  }

  static isBuffer(obj: any): boolean {
    return obj instanceof BrowserBuffer || obj instanceof Uint8Array
  }

  toString(encoding?: string): string {
    const decoder = new TextDecoder(encoding === "utf8" || encoding === "utf-8" ? "utf-8" : "utf-8")
    return decoder.decode(this)
  }
}

export const Buffer = BrowserBuffer
export default { Buffer: BrowserBuffer }
