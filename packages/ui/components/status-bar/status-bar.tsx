import type { ReactNode } from "react"
import { textStyle } from "@/registry/gridland/lib/text-style"
import { useTheme } from "@/registry/gridland/lib/theme"

export interface StatusBarItem {
  /** The key or key combination text (e.g., "Tab", "←→", "q"). */
  key: string
  /** Description of what the key does (e.g., "switch focus", "navigate"). */
  label: string
}

export interface StatusBarProps {
  /** Array of keybinding hints to display. */
  items: StatusBarItem[]
  /**
   * Optional content rendered to the left of the keybinding hints.
   * When provided, a dim │ separator appears between it and the hints.
   *
   * **Note:** Since this renders inside a `<text>`, it must be inline content
   * (`<span>` or string). Block-level elements will cause rendering errors.
   */
  extra?: ReactNode
}

/** Horizontal bar displaying keybinding hints with optional extra content. */
export function StatusBar({ items, extra }: StatusBarProps) {
  const theme = useTheme()
  const parts: any[] = []

  if (extra != null) {
    parts.push(
      <span key="extra">{extra}</span>,
    )
    if (items.length > 0) {
      parts.push(
        <span key="pipe" style={textStyle({ dim: true, fg: theme.placeholder })}>{"  \u2502  "}</span>,
      )
    }
  }

  items.forEach((item, i) => {
    if (i > 0) {
      parts.push(<span key={`gap-${i}`}>{" "}</span>)
    }
    parts.push(
      <span key={`key-${i}`} style={textStyle({ bold: true, fg: theme.background, bg: theme.muted })}>
        {` ${item.key} `}
      </span>,
    )
    parts.push(
      <span key={`label-${i}`} style={textStyle({ dim: true, fg: theme.placeholder })}>
        {` ${item.label}`}
      </span>,
    )
  })

  if (parts.length === 0) {
    return null
  }

  return <text>{parts}</text>
}
