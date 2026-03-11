// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { TextInput, useTheme } from "@gridland/ui"

function TextInputApp() {
  const theme = useTheme()
  return (
    <box padding={1} flexDirection="column" gap={1}>
      <text style={{ fg: theme.foreground }} bold>Enter your name:</text>
      <TextInput placeholder="Type something..." prompt="> " />
    </box>
  )
}

export default function TextInputDemo() {
  return (
    <DemoWindow title="TextInput" tuiStyle={{ width: "100%", height: 80 }}>
      <TextInputApp />
    </DemoWindow>
  )
}
