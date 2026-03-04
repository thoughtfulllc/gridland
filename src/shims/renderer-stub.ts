// Stub for opentui/packages/core/src/renderer.ts
import { EventEmitter } from "events"

export enum CliRenderEvents {
  DESTROY = "destroy",
  DEBUG_OVERLAY_TOGGLE = "debug_overlay_toggle",
}

export class CliRenderer extends EventEmitter {
  root: any = null
  keyInput: any = new EventEmitter()
  destroy(): void {
    this.emit(CliRenderEvents.DESTROY)
  }
}

export type MouseEvent = any

export function createCliRenderer(): Promise<CliRenderer> {
  return Promise.resolve(new CliRenderer())
}
