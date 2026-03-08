// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { MultiSelect, useTheme } from "@gridland/ui"
import { useKeyboard } from "@opentui/react"

const items = [
  { label: "TypeScript", value: "ts" },
  { label: "JavaScript", value: "js" },
  { label: "Python", value: "py" },
  { label: "Rust", value: "rs" },
]

function MultiSelectApp() {
  const theme = useTheme()
  return (
    <box padding={1} flexDirection="column" gap={1}>
      <text style={{ fg: theme.text }} bold>Select languages:</text>
      <MultiSelect items={items} useKeyboard={useKeyboard} />
    </box>
  )
}

export default function MultiSelectDemo() {
  return (
    <DemoWindow title="MultiSelect" tuiStyle={{ width: "100%", height: 160 }}>
      <MultiSelectApp />
    </DemoWindow>
  )
}
