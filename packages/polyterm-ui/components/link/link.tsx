import type { ReactNode } from "react"

export type UnderlineStyle = "solid" | "dashed" | "dotted" | "none"

// Attribute bits matching opentui core TextAttributes
const UNDERLINE = 1 << 3
const UNDERLINE_DASHED = 1 << 4
const UNDERLINE_DOTTED = 1 << 6

export interface LinkProps {
  children: ReactNode
  url: string
  underline?: UnderlineStyle
}

export function Link({ children, url, underline = "solid" }: LinkProps) {
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
      <a href={url} style={{ attributes }}>{children}</a>
    </text>
  )
}
