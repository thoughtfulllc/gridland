import { textStyle } from "../text-style"

export interface TabBarProps {
  /** Text label shown before the options. When omitted, no label is rendered but the leading space is still present. */
  label?: string
  /** Array of option strings to display. */
  options: string[]
  /** Zero-based index of the currently selected option. */
  selectedIndex: number
  /** Whether the tab bar appears focused. Affects bold/dim/color styling. */
  focused?: boolean
  /** The foreground color applied to the selected option when focused. */
  activeColor?: string
}

export function TabBar({
  label,
  options,
  selectedIndex,
  focused = true,
  activeColor = "cyan",
}: TabBarProps) {
  const parts: any[] = []

  // Label
  if (label !== undefined) {
    parts.push(
      <span
        key="label"
        style={focused ? textStyle({ bold: true }) : textStyle({ dim: true })}
      >
        {label}
      </span>,
    )
  }

  // Space before options
  parts.push(<span key="sep">{" "}</span>)

  // Options
  options.forEach((option, i) => {
    const isSelected = i === selectedIndex
    const padded = ` ${option} `

    if (isSelected && focused) {
      parts.push(
        <span
          key={`opt-${i}`}
          style={textStyle({ inverse: true, bold: true, fg: activeColor })}
        >
          {padded}
        </span>,
      )
    } else if (isSelected && !focused) {
      parts.push(
        <span
          key={`opt-${i}`}
          style={textStyle({ inverse: true, bold: true, dim: true })}
        >
          {padded}
        </span>,
      )
    } else if (!focused) {
      parts.push(
        <span key={`opt-${i}`} style={textStyle({ dim: true })}>
          {padded}
        </span>,
      )
    } else {
      parts.push(<span key={`opt-${i}`}>{padded}</span>)
    }
  })

  return <text>{parts}</text>
}
