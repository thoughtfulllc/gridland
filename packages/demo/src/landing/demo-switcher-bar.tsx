// @ts-nocheck
import { textStyle, useTheme } from "@gridland/ui"

const DEMOS = ["ripple", "puzzle", "canvas", "snake"]

interface DemoSwitcherBarProps {
  activeIndex: number
  onSelect: (index: number) => void
}

export function DemoSwitcherBar({ activeIndex, onSelect }: DemoSwitcherBarProps) {
  const theme = useTheme()

  return (
    <box flexDirection="row" height={1} paddingX={1} flexShrink={0} shouldFill={false} alignItems="center">
      <text>
        <span style={textStyle({ bold: true, fg: theme.background, bg: theme.muted })}>{" Tab "}</span>
        <span style={textStyle({ dim: true, fg: theme.placeholder })}>{" next"}</span>
        <span style={textStyle({ dim: true, fg: theme.placeholder })}>{"  │  "}</span>
      </text>
      {DEMOS.map((name, i) => (
        <box key={name} onMouseDown={() => onSelect(i)}>
          <text>
            <span style={textStyle({ fg: i === activeIndex ? theme.accent : theme.placeholder })}>
              {i === activeIndex ? "● " : "○ "}
            </span>
            <span style={textStyle({
              bold: i === activeIndex,
              fg: i === activeIndex ? theme.accent : theme.placeholder,
            })}>
              {name}
            </span>
            <span>{"  "}</span>
          </text>
        </box>
      ))}
    </box>
  )
}
