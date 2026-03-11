// Text attribute bitmask constants matching opentui core TextAttributes
const BOLD = 1 << 0 // 1
const DIM = 1 << 1 // 2
const ITALIC = 1 << 2 // 4
const UNDERLINE = 1 << 3 // 8
// bit 4 (1 << 4) = BLINK — intentionally omitted, not rendered by canvas painter
const INVERSE = 1 << 5 // 32

/**
 * Converts friendly boolean flags into a style object that works with
 * opentui's `<span>` and `<text>` elements.
 *
 * The `style` prop copies values directly to the renderable instance.
 * Colors (`fg`, `bg`) are instance properties so they work directly,
 * but text decorations (bold, dim, inverse, etc.) must be packed into
 * the numeric `attributes` bitmask.
 */
export function textStyle(opts: {
  fg?: string
  bg?: string
  bold?: boolean
  dim?: boolean
  italic?: boolean
  underline?: boolean
  inverse?: boolean
}): { fg?: string; bg?: string; attributes?: number } {
  let attributes = 0
  if (opts.bold) attributes |= BOLD
  if (opts.dim) attributes |= DIM
  if (opts.italic) attributes |= ITALIC
  if (opts.underline) attributes |= UNDERLINE
  if (opts.inverse) attributes |= INVERSE

  const result: { fg?: string; bg?: string; attributes?: number } = {}
  if (opts.fg) result.fg = opts.fg
  if (opts.bg) result.bg = opts.bg
  if (attributes) result.attributes = attributes
  return result
}
