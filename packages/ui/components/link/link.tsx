import type { ReactNode } from "react"
import { useTheme } from "@/registry/gridland/lib/theme"

export type UnderlineStyle = "solid" | "dashed" | "dotted" | "none"

// Underline variant bits — UNDERLINE_DASHED reuses core BLINK (bit 4) and
// UNDERLINE_DOTTED reuses core HIDDEN (bit 6). The canvas painter interprets
// these as underline styles when combined with the UNDERLINE base bit.
const UNDERLINE = 1 << 3
const UNDERLINE_DASHED = 1 << 4
const UNDERLINE_DOTTED = 1 << 6

function underlineAttributes(style: UnderlineStyle): number {
  switch (style) {
    case "solid":  return UNDERLINE
    case "dashed": return UNDERLINE | UNDERLINE_DASHED
    case "dotted": return UNDERLINE | UNDERLINE_DOTTED
    case "none":   return 0
  }
}

export interface LinkProps {
  /** Link label content. */
  children: ReactNode
  /** Target URL for the hyperlink. */
  url: string
  /** Underline decoration style. @default "solid" */
  underline?: UnderlineStyle
  /** Override the link color. Defaults to theme.accent. */
  color?: string
}

/** Renders a clickable hyperlink with configurable underline style and color. */
export function Link({ children, url, underline = "solid", color }: LinkProps) {
  const theme = useTheme()
  const resolvedColor = color ?? theme.accent
  const attributes = underlineAttributes(underline)

  return (
    <text>
      <a href={url} style={{ attributes, fg: resolvedColor }}>{children}</a>
    </text>
  )
}
