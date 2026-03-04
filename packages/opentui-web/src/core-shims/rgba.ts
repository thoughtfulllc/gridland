// Pure-TS RGBA - copied from opentui core for standalone use
// This avoids importing from opentui which pulls in Zig

export class RGBA {
  buffer: Float32Array

  constructor(buffer: Float32Array) {
    this.buffer = buffer
  }

  static fromArray(array: Float32Array): RGBA {
    return new RGBA(array)
  }

  static fromValues(r: number, g: number, b: number, a: number = 1.0): RGBA {
    return new RGBA(new Float32Array([r, g, b, a]))
  }

  static fromInts(r: number, g: number, b: number, a: number = 255): RGBA {
    return new RGBA(new Float32Array([r / 255, g / 255, b / 255, a / 255]))
  }

  static fromHex(hex: string): RGBA {
    return hexToRgb(hex)
  }

  get r(): number {
    return this.buffer[0]
  }
  set r(v: number) {
    this.buffer[0] = v
  }

  get g(): number {
    return this.buffer[1]
  }
  set g(v: number) {
    this.buffer[1] = v
  }

  get b(): number {
    return this.buffer[2]
  }
  set b(v: number) {
    this.buffer[2] = v
  }

  get a(): number {
    return this.buffer[3]
  }
  set a(v: number) {
    this.buffer[3] = v
  }

  toInts(): [number, number, number, number] {
    return [
      Math.round(this.buffer[0] * 255),
      Math.round(this.buffer[1] * 255),
      Math.round(this.buffer[2] * 255),
      Math.round(this.buffer[3] * 255),
    ]
  }

  map<R>(fn: (value: number) => R): R[] {
    return [fn(this.buffer[0]), fn(this.buffer[1]), fn(this.buffer[2]), fn(this.buffer[3])]
  }

  toString(): string {
    const [r, g, b, a] = this.toInts()
    return `rgba(${r}, ${g}, ${b}, ${a / 255})`
  }

  equals(other?: RGBA): boolean {
    if (!other) return false
    return (
      this.buffer[0] === other.buffer[0] &&
      this.buffer[1] === other.buffer[1] &&
      this.buffer[2] === other.buffer[2] &&
      this.buffer[3] === other.buffer[3]
    )
  }
}

export type ColorInput = string | RGBA

const CSS_COLOR_NAMES: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  red: "#ff0000",
  green: "#008000",
  blue: "#0000ff",
  yellow: "#ffff00",
  cyan: "#00ffff",
  magenta: "#ff00ff",
  silver: "#c0c0c0",
  gray: "#808080",
  grey: "#808080",
  maroon: "#800000",
  olive: "#808000",
  lime: "#00ff00",
  aqua: "#00ffff",
  teal: "#008080",
  navy: "#000080",
  fuchsia: "#ff00ff",
  purple: "#800080",
  orange: "#ffa500",
  transparent: "#00000000",
  brightblack: "#808080",
  brightred: "#ff5555",
  brightgreen: "#55ff55",
  brightyellow: "#ffff55",
  brightblue: "#5555ff",
  brightmagenta: "#ff55ff",
  brightcyan: "#55ffff",
  brightwhite: "#ffffff",
}

export function hexToRgb(hex: string): RGBA {
  hex = hex.replace(/^#/, "")

  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  }

  if (hex.length === 6) {
    hex = hex + "ff"
  }

  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255
  const a = parseInt(hex.substring(6, 8), 16) / 255

  return RGBA.fromValues(r, g, b, a)
}

export function rgbToHex(rgb: RGBA): string {
  const [r, g, b] = rgb.toInts()
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
}

export function hsvToRgb(h: number, s: number, v: number): RGBA {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0,
    g = 0,
    b = 0

  if (h < 60) {
    r = c; g = x; b = 0
  } else if (h < 120) {
    r = x; g = c; b = 0
  } else if (h < 180) {
    r = 0; g = c; b = x
  } else if (h < 240) {
    r = 0; g = x; b = c
  } else if (h < 300) {
    r = x; g = 0; b = c
  } else {
    r = c; g = 0; b = x
  }

  return RGBA.fromValues(r + m, g + m, b + m, 1)
}

export function parseColor(color: ColorInput): RGBA {
  if (color instanceof RGBA) return color
  if (typeof color !== "string") return RGBA.fromValues(1, 1, 1, 1)

  const lower = color.toLowerCase().trim()

  // Check CSS named colors
  if (CSS_COLOR_NAMES[lower]) {
    return hexToRgb(CSS_COLOR_NAMES[lower])
  }

  // Hex
  if (lower.startsWith("#")) {
    return hexToRgb(lower)
  }

  // rgba(r, g, b, a)
  const rgbaMatch = lower.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/)
  if (rgbaMatch) {
    return RGBA.fromInts(
      parseInt(rgbaMatch[1]),
      parseInt(rgbaMatch[2]),
      parseInt(rgbaMatch[3]),
      rgbaMatch[4] ? Math.round(parseFloat(rgbaMatch[4]) * 255) : 255,
    )
  }

  return RGBA.fromValues(1, 1, 1, 1)
}
