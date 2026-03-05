import { EventEmitter } from "events"

/**
 * Minimal render context interface for key input.
 */
export interface KeyInputContext {
  keyInput: EventEmitter
  _internalKeyInput: EventEmitter
}

/**
 * KeySender simulates keyboard input for testing.
 */
export class KeySender {
  private ctx: KeyInputContext

  constructor(ctx: KeyInputContext) {
    this.ctx = ctx
  }

  private sendKey(name: string, options: {
    ctrl?: boolean
    meta?: boolean
    shift?: boolean
    option?: boolean
    sequence?: string
  } = {}): void {
    const event = {
      name,
      ctrl: options.ctrl ?? false,
      meta: options.meta ?? false,
      shift: options.shift ?? false,
      option: options.option ?? false,
      sequence: options.sequence ?? name,
      number: false,
      raw: name,
      eventType: "press" as const,
      source: "raw" as const,
      _defaultPrevented: false,
      _propagationStopped: false,
      get defaultPrevented() { return this._defaultPrevented },
      get propagationStopped() { return this._propagationStopped },
      preventDefault() { this._defaultPrevented = true },
      stopPropagation() { this._propagationStopped = true },
    }

    this.ctx._internalKeyInput.emit("keypress", event)
    this.ctx.keyInput.emit("keypress", event)
  }

  /** Type a string of text character by character */
  type(text: string): void {
    for (const char of text) {
      this.press(char)
    }
  }

  /** Press a single character key */
  press(char: string): void {
    this.sendKey(char)
  }

  /** Send raw data (for escape sequences etc.) */
  raw(data: string): void {
    this.sendKey(data, { sequence: data })
  }

  // Common keys
  enter(): void { this.sendKey("return") }
  escape(): void { this.sendKey("escape") }
  tab(): void { this.sendKey("tab") }
  backspace(): void { this.sendKey("backspace") }
  delete(): void { this.sendKey("delete") }
  space(): void { this.sendKey("space") }
  up(): void { this.sendKey("up") }
  down(): void { this.sendKey("down") }
  left(): void { this.sendKey("left") }
  right(): void { this.sendKey("right") }
  home(): void { this.sendKey("home") }
  end(): void { this.sendKey("end") }
  pageUp(): void { this.sendKey("pageup") }
  pageDown(): void { this.sendKey("pagedown") }
}
