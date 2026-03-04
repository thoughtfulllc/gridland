// Browser stub for node:stream
export class Writable {
  write(_chunk: any): boolean { return true }
  end(): void {}
}
export class Readable {
  read(): any { return null }
}
export class Transform extends Writable {}
export default { Writable, Readable, Transform }
