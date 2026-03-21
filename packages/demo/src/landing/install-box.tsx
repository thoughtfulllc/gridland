// @ts-nocheck
import { textStyle, useTheme } from "@gridland/ui"

export function InstallBox() {
  const theme = useTheme()

  return (
    <box
      border
      borderStyle="rounded"
      borderColor={theme.border}
      paddingX={1}
      flexDirection="column"
      flexShrink={0}
    >
      <text>
        <span style={textStyle({ dim: true })}>$ </span>
        <span style={textStyle({ bold: true })}>bun create </span>
        <span style={textStyle({ fg: theme.accent })}>gridland</span>
      </text>
    </box>
  )
}
