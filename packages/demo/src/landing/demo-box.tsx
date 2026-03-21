// @ts-nocheck
import { textStyle, useTheme } from "@gridland/ui"

const DEMOS = [
  "gradient",
  "table",
  "select-input",
  "text-input",
  "modal",
  "chat",
  "terminal-window",
  "spinner",
]

export function DemoBox() {
  const theme = useTheme()

  return (
    <box
      border
      borderStyle="rounded"
      borderColor={theme.border}
      paddingX={1}
      flexDirection="column"
      gap={1}
    >
      <text style={textStyle({ bold: true, fg: theme.accent })}>Try a demo</text>
      <text>
        <span style={textStyle({ dim: true })}>$ </span>
        <span style={textStyle({ bold: true })}>bunx </span>
        <span style={textStyle({ fg: theme.accent })}>@gridland/demo </span>
        <span style={textStyle({ dim: true })}>{"<name>"}</span>
      </text>
      <box flexDirection="row" flexWrap="wrap" gap={0}>
        {DEMOS.map((demo, i) => (
          <text key={demo}>
            <span style={textStyle({ dim: true })}>{i > 0 ? " \u00b7 " : ""}</span>
            <span>{demo}</span>
          </text>
        ))}
      </box>
    </box>
  )
}
