// Shim for bun:ffi - provides dummy types for browser environment
export type Pointer = number

export function toArrayBuffer(_ptr: Pointer, _offset: number, _size: number): ArrayBuffer {
  return new ArrayBuffer(0)
}

export function ptr(_buf: ArrayBuffer): Pointer {
  return 0
}

export function read(ptr: Pointer): { ptr: Pointer } {
  return { ptr: 0 }
}
