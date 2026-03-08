// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { SelectInput, useTheme, ThemeProvider, darkTheme } from "@gridland/ui"

const items = [
  { label: "TypeScript", value: "ts" },
  { label: "JavaScript", value: "js" },
  { label: "Python", value: "py" },
  { label: "Rust", value: "rs" },
]

function SelectInputApp() {
  const theme = useTheme()
  return (
    <box padding={1} flexDirection="column" gap={1}>
      <text style={{ fg: theme.text }} bold>Choose a language:</text>
      <text> </text>
      <SelectInput items={items} />
    </box>
  )
}

export default function SelectInputDemo() {
  return (
    <DemoWindow title="SelectInput" tuiStyle={{ width: "100%", height: 160 }}>
      <SelectInputApp />
    </DemoWindow>
  )
}
