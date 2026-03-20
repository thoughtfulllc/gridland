// @ts-nocheck
"use client"
import { textStyle, useTheme } from "@gridland/ui"

export function TerminalWindowApp() {
  const theme = useTheme()
  return (
    <box flexDirection="column" padding={1}>
      <text style={textStyle({ fg: theme.secondary })}>$ echo "Hello from TerminalWindow"</text>
      <text style={textStyle({ fg: theme.foreground })}>Hello from TerminalWindow</text>
      <text style={textStyle({ fg: theme.secondary })}>$ _</text>
    </box>
  )
}
