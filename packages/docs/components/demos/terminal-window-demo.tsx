// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { TerminalWindow, textStyle, useTheme } from "@gridland/ui"
import { DemoWindow } from "@/components/ui/demo-window"

function TerminalApp() {
  const theme = useTheme()
  return (
    <box flexDirection="column" padding={1}>
      <text style={textStyle({ fg: theme.secondary })}>$ echo "Hello from TerminalWindow"</text>
      <text style={textStyle({ fg: theme.foreground })}>Hello from TerminalWindow</text>
      <text style={textStyle({ fg: theme.secondary })}>$ _</text>
    </box>
  )
}

export default function TerminalWindowDemo() {
  return (
    <DemoWindow title="Terminal" tuiStyle={{ width: "100%", height: 120 }}>
      <TerminalApp />
    </DemoWindow>
  )
}
