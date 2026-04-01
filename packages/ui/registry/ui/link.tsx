import type { ReactNode } from "react"
import { useTheme } from "./theme"

export type UnderlineStyle = "solid" | "dashed" | "dotted" | "none"

// Attribute bits matching opentui core TextAttributes
const UNDERLINE = 1 << 3
const UNDERLINE_DASHED = 1 << 4
const UNDERLINE_DOTTED = 1 << 6

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

  let attributes = 0
  if (underline === "solid") {
    attributes = UNDERLINE
  } else if (underline === "dashed") {
    attributes = UNDERLINE | UNDERLINE_DASHED
  } else if (underline === "dotted") {
    attributes = UNDERLINE | UNDERLINE_DOTTED
  }

  return (
    <text>
      <a href={url} style={{ attributes, fg: resolvedColor }}>{children}</a>
    </text>
  )
}
