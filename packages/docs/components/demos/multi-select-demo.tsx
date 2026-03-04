// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { OpenTuiCanvas } from "opentui-web"
import { MacWindow } from "@/components/ui/mac-window"
import { MultiSelect } from "opentui-ui"
import { useKeyboard } from "@opentui/react"

const items = [
  { label: "TypeScript", value: "ts" },
  { label: "JavaScript", value: "js" },
  { label: "Python", value: "py" },
  { label: "Rust", value: "rs" },
]

export default function MultiSelectDemo() {
  return (
    <MacWindow title="MultiSelect">
      <OpenTuiCanvas style={{ width: "100%", height: 160 }}>
        <box padding={1} flexDirection="column" gap={1}>
          <text fg="#d8dee9" bold>Select languages:</text>
          <MultiSelect items={items} useKeyboard={useKeyboard} />
        </box>
      </OpenTuiCanvas>
    </MacWindow>
  )
}
