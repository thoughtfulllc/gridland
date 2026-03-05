// Browser shim for node:buffer
// TextEncoder/TextDecoder are available in browsers
const BrowserBuffer = {
  from(data: string | ArrayBuffer | Uint8Array, encoding?: string): Uint8Array {
    if (typeof data === "string") {
      const encoder = new TextEncoder()
      return encoder.encode(data)
    }
    if (data instanceof ArrayBuffer) {
      return new Uint8Array(data)
    }
    if (data instanceof Uint8Array) {
      return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
    }
    return new Uint8Array(0)
  },

  alloc(size: number): Uint8Array {
    return new Uint8Array(size)
  },

  isBuffer(obj: any): boolean {
    return obj instanceof Uint8Array
  },

  concat(list: Uint8Array[], totalLength?: number): Uint8Array {
    const length = totalLength ?? list.reduce((acc, buf) => acc + buf.byteLength, 0)
    const result = new Uint8Array(length)
    let offset = 0
    for (const buf of list) {
      result.set(buf, offset)
      offset += buf.byteLength
    }
    return result
  },
}

export const Buffer = BrowserBuffer
export default { Buffer: BrowserBuffer }
