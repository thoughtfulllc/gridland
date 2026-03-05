// Shim for bun-ffi-structs
export class Struct {
  constructor(_def: any) {}
}

export function defineStruct(_def: any): any {
  return class StubStruct {
    constructor(..._args: any[]) {}
  }
}

export function defineEnum(_def: any): any {
  return {}
}

export function defineUnion(_def: any): any {
  return class StubUnion {
    constructor(..._args: any[]) {}
  }
}
