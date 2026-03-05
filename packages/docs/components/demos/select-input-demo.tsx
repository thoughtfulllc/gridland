// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { TUI } from "@polyterm.io/web"
import { MacWindow } from "@/components/ui/mac-window"
import { SelectInput } from "@polyterm.io/ui"

const items = [
  { label: "TypeScript", value: "ts" },
  { label: "JavaScript", value: "js" },
  { label: "Python", value: "py" },
  { label: "Rust", value: "rs" },
]

export default function SelectInputDemo() {
  return (
    <MacWindow title="SelectInput">
      <TUI style={{ width: "100%", height: 140 }}>
        <box padding={1} flexDirection="column" gap={1}>
          <text fg="#d8dee9" bold>Choose a language:</text>
          <SelectInput items={items} textColor="#d8dee9" selectedTextColor="#88c0d0" />
        </box>
      </TUI>
    </MacWindow>
  )
}
