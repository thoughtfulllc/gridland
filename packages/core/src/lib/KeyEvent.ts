import type { KeyEventType, ParsedKey } from "./parse.keypress"

export type { KeyEventType, ParsedKey }

export class KeyEvent implements ParsedKey {
  /**
   * Logical key name. Examples: `"a"`, `"left"`, `"f1"`, `"escape"`, `"return"`, `"tab"`.
   * Also set to the literal character for single-char printable input (`"["`, `"]"`, `";"`, `"/"`).
   * Prefer `name` over `sequence` for keyboard logic — it is normalized across terminals.
   */
  name: string
  /** True if the literal Ctrl key was held. `ctrl` and `meta` are independent flags — treat them as distinct, not cross-platform equivalents. */
  ctrl: boolean
  /** True if Meta was held. Under the raw parser this is also set for Alt/Option escape sequences (`\x1b<key>`), so `meta` and `option` often co-occur. */
  meta: boolean
  /** True if Shift was held. For letter keys the `name` is lowercased and `shift` carries the case; e.g. pressing `A` gives `{ name: "a", shift: true }`. */
  shift: boolean
  /** True if Option (macOS) / Alt was held. Raw parser sets this alongside `meta` for Alt+key sequences. */
  option: boolean
  /**
   * Raw byte sequence the terminal emitted. For printable single characters this matches `name`.
   * For named keys (arrows, function keys) this is the ANSI escape sequence (`"\x1b[A"`), not the name.
   * Prefer `name` for keyboard logic; reach for `sequence` only when detecting a specific byte pattern.
   */
  sequence: string
  /** True if the key is a digit `0`–`9`. */
  number: boolean
  /** Literal bytes received before parsing. Rarely needed — prefer `sequence` or `name`. */
  raw: string
  /**
   * `"press"`, `"release"`, or `"repeat"`. Releases and repeats are only produced when the terminal
   * supports the Kitty keyboard protocol and the handler was subscribed with `{ release: true }`.
   * Under the raw parser this is always `"press"`.
   */
  eventType: KeyEventType
  /** `"raw"` = legacy xterm decoding, `"kitty"` = Kitty keyboard protocol (richer modifier + event-type data). */
  source: "raw" | "kitty"
  /**
   * Parsed ANSI code for escape sequences (raw mode, e.g. `"[A"` for up arrow) or the
   * Kitty CSI-u code for known keys (kitty mode, e.g. `"[57352u"`). Undefined for single-char input.
   */
  code?: string
  /** True if the Super / Windows / Command key was held. Populated by Kitty and by `modifyOtherKeys` in raw mode; undefined otherwise. */
  super?: boolean
  /** True if the Hyper key was held. Populated by Kitty and by `modifyOtherKeys` in raw mode; undefined otherwise. */
  hyper?: boolean
  /** Kitty-only: true if Caps Lock was on. */
  capsLock?: boolean
  /** Kitty-only: true if Num Lock was on. */
  numLock?: boolean
  /** Kitty-only: base layout codepoint for keyboard-layout disambiguation (QWERTY vs Dvorak etc.). */
  baseCode?: number
  /** Kitty-only: true if this is a key-repeat event (Kitty event type 2). Undefined in raw mode. */
  repeated?: boolean

  private _defaultPrevented: boolean = false
  private _propagationStopped: boolean = false

  constructor(key: ParsedKey) {
    this.name = key.name
    this.ctrl = key.ctrl
    this.meta = key.meta
    this.shift = key.shift
    this.option = key.option
    this.sequence = key.sequence
    this.number = key.number
    this.raw = key.raw
    this.eventType = key.eventType
    this.source = key.source
    this.code = key.code
    this.super = key.super
    this.hyper = key.hyper
    this.capsLock = key.capsLock
    this.numLock = key.numLock
    this.baseCode = key.baseCode
    this.repeated = key.repeated
  }

  /** Getter — read-only. Mutate via `preventDefault()`. */
  get defaultPrevented(): boolean {
    return this._defaultPrevented
  }

  /** Getter — read-only. Mutate via `stopPropagation()`. */
  get propagationStopped(): boolean {
    return this._propagationStopped
  }

  /**
   * Marks the event as handled. The key-dispatch runtime honors this flag:
   * `KeyHandler` skips all renderable-scoped listeners if `defaultPrevented` is true,
   * and `focus-provider` skips its focus-navigation logic. Does NOT stop subsequent
   * global listeners from firing — use `stopPropagation()` for that.
   * Readers: `packages/core/src/lib/KeyHandler.ts:138`, `packages/core/src/react/focus/focus-provider.tsx:38`,
   * `packages/core/src/Renderable.ts:396`.
   */
  preventDefault(): void {
    this._defaultPrevented = true
  }

  /**
   * Stops propagation to later listeners. `KeyHandler` checks this flag between every listener
   * invocation and bails out: remaining global listeners are skipped, and renderable listeners
   * are not entered at all. Use this to make one handler "win" a key exclusively.
   * Reader: `packages/core/src/lib/KeyHandler.ts:120, 139, 152`.
   */
  stopPropagation(): void {
    this._propagationStopped = true
  }
}
