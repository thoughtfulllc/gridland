// Stub for opentui/packages/core/src/animation/Timeline.ts
export class Timeline {
  public isPlaying: boolean = false
  public isComplete: boolean = false
  public duration: number = 1000
  public loop: boolean = false
  public synced: boolean = false
  public currentTime: number = 0
  public items: any[] = []
  public subTimelines: any[] = []

  constructor(_options: any = {}) {}
  addStateChangeListener(_listener: any): void {}
  removeStateChangeListener(_listener: any): void {}
  add(_target: any, _options: any): this { return this }
  call(_callback: () => void): this { return this }
  play(): this {
    this.isPlaying = true
    return this
  }
  pause(): this {
    this.isPlaying = false
    return this
  }
  restart(): void {}
  update(_deltaTime: number): void {}
}

class TimelineEngine {
  defaults = { frameRate: 60 }
  attach(_renderer: any): void {}
  detach(): void {}
  register(_timeline: Timeline): void {}
  unregister(_timeline: Timeline): void {}
  clear(): void {}
  update(_deltaTime: number): void {}
}

export const engine = new TimelineEngine()

export function createTimeline(options: any = {}): Timeline {
  return new Timeline(options)
}
