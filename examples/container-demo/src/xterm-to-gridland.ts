/**
 * Maps xterm.js color values to hex color strings for gridland rendering.
 */

// Standard 16 ANSI colors (xterm defaults)
const ANSI_COLORS: string[] = [
  "#000000", // 0: black
  "#cd0000", // 1: red
  "#00cd00", // 2: green
  "#cdcd00", // 3: yellow
  "#0000ee", // 4: blue
  "#cd00cd", // 5: magenta
  "#00cdcd", // 6: cyan
  "#e5e5e5", // 7: white
  "#7f7f7f", // 8: bright black
  "#ff0000", // 9: bright red
  "#00ff00", // 10: bright green
  "#ffff00", // 11: bright yellow
  "#5c5cff", // 12: bright blue
  "#ff00ff", // 13: bright magenta
  "#00ffff", // 14: bright cyan
  "#ffffff", // 15: bright white
]

// 216 color cube (indices 16-231)
function colorCubeToHex(index: number): string {
  const i = index - 16
  const r = Math.floor(i / 36)
  const g = Math.floor((i % 36) / 6)
  const b = i % 6
  const toVal = (v: number) => (v === 0 ? 0 : 55 + v * 40)
  return `#${toVal(r).toString(16).padStart(2, "0")}${toVal(g).toString(16).padStart(2, "0")}${toVal(b).toString(16).padStart(2, "0")}`
}

// 24 grayscale ramp (indices 232-255)
function grayscaleToHex(index: number): string {
  const v = 8 + (index - 232) * 10
  const hex = v.toString(16).padStart(2, "0")
  return `#${hex}${hex}${hex}`
}

/**
 * Convert a 256-color index to a hex string.
 */
export function ansi256ToHex(index: number): string {
  if (index < 16) return ANSI_COLORS[index]
  if (index < 232) return colorCubeToHex(index)
  return grayscaleToHex(index)
}

/**
 * Extract the foreground color from an xterm.js buffer cell.
 * Returns a hex color string or undefined for default color.
 */
export function getCellFg(cell: { isFgRGB(): boolean; isFgPalette(): boolean; isFgDefault(): boolean; getFgColor(): number }): string | undefined {
  if (cell.isFgDefault()) return undefined
  if (cell.isFgRGB()) {
    const rgb = cell.getFgColor()
    return `#${((rgb >> 16) & 0xff).toString(16).padStart(2, "0")}${((rgb >> 8) & 0xff).toString(16).padStart(2, "0")}${(rgb & 0xff).toString(16).padStart(2, "0")}`
  }
  if (cell.isFgPalette()) {
    return ansi256ToHex(cell.getFgColor())
  }
  return undefined
}

/**
 * Extract the background color from an xterm.js buffer cell.
 * Returns a hex color string or undefined for default color.
 */
export function getCellBg(cell: { isBgRGB(): boolean; isBgPalette(): boolean; isBgDefault(): boolean; getBgColor(): number }): string | undefined {
  if (cell.isBgDefault()) return undefined
  if (cell.isBgRGB()) {
    const rgb = cell.getBgColor()
    return `#${((rgb >> 16) & 0xff).toString(16).padStart(2, "0")}${((rgb >> 8) & 0xff).toString(16).padStart(2, "0")}${(rgb & 0xff).toString(16).padStart(2, "0")}`
  }
  if (cell.isBgPalette()) {
    return ansi256ToHex(cell.getBgColor())
  }
  return undefined
}

// Gridland attribute bitmask values
const BOLD = 1 << 0
const DIM = 1 << 1
const ITALIC = 1 << 2
const UNDERLINE = 1 << 3
const INVERSE = 1 << 5

/**
 * Convert xterm.js cell attributes to gridland attribute bitmask.
 */
export function getCellAttributes(cell: { isBold(): number; isDim(): number; isItalic(): number; isUnderline(): number; isInverse(): number }): number {
  let attrs = 0
  if (cell.isBold()) attrs |= BOLD
  if (cell.isDim()) attrs |= DIM
  if (cell.isItalic()) attrs |= ITALIC
  if (cell.isUnderline()) attrs |= UNDERLINE
  if (cell.isInverse()) attrs |= INVERSE
  return attrs
}
