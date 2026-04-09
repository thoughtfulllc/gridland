// @ts-nocheck
"use client"
import { useState } from "react"
import { DemoWindow } from "@/components/ui/demo-window"
import { TextInputApp } from "@demos/text-input"
import { TextInput, StatusBar, textStyle, useTheme } from "@gridland/ui"
import { useKeyboard } from "@gridland/utils"

// ── State Picker (docs-only) ────────────────────────────────────────────

const STATES = [
  { name: "default", props: { focus: true } },
  { name: "read only", props: {} },
  { name: "required", props: { focus: true, required: true } },
  { name: "error", props: { focus: true, error: "This field is required" } },
  { name: "description", props: { focus: true, description: "Enter your display name" } },
  { name: "disabled", props: { disabled: true } },
  { name: "maxLength", props: { focus: true, value: "John Doe", maxLength: 15 } },
]

function TextInputPickerApp() {
  const theme = useTheme()
  const [selected, setSelected] = useState(0)
  const [value, setValue] = useState("")

  useKeyboard((event) => {
    if (event.name === "left") setSelected((s) => (s > 0 ? s - 1 : STATES.length - 1))
    if (event.name === "right") setSelected((s) => (s < STATES.length - 1 ? s + 1 : 0))
  })

  const state = STATES[selected]

  return (
    <box flexDirection="column" flexGrow={1}>
      <box paddingLeft={1} paddingRight={2} paddingTop={1} paddingBottom={2} flexDirection="column" flexGrow={1}>
        <TextInput label="Email" placeholder="user@example.com" prompt="> " focus={false} value={state.props.value ?? value} onChange={setValue} {...state.props} />
      </box>
      <box paddingX={1} paddingBottom={1}>
        <StatusBar
          items={[{ key: "←→", label: "change state" }]}
          extra={<span style={textStyle({ fg: theme.accent, bold: true })}>{state.name.padEnd(12)}</span>}
        />
      </box>
    </box>
  )
}

// ── Exports ───────────────────────────────────────────────────────────────

export function TextInputPickerDemo() {
  return (
    <DemoWindow title="TextInput" tuiStyle={{ width: "100%", height: 200 }} autoFocus>
      <TextInputPickerApp />
    </DemoWindow>
  )
}

export default function TextInputDemo() {
  return (
    <DemoWindow title="TextInput" tuiStyle={{ width: "100%", height: 360 }}>
      <TextInputApp />
    </DemoWindow>
  )
}
